/**
 * Scalable Encryption System
 * Seamlessly transitions from single recipient to multi-recipient encryption
 */

import {
  bytesToBase58 as encodeBase58,
  base58ToBytes as decodeBase58,
} from "../utils/base58.js";
import { Keypair } from "@solana/web3.js";
import type { EncryptionResult, EncryptionOptions } from "./types.js";
import { EncryptionMethod } from "./types.js";
import type { SharePermissions } from "./shared-key-manager.js";
import {
  SharedKeyManager,
  SharedEncryptionKey,
  KeyTransitionRequest,
} from "./shared-key-manager.js";
import { encryptDirect, decryptDirect } from "./direct.js";
import {
  stringToBytes,
  bytesToString,
  getCurrentTimestamp,
  isValidPublicKey,
} from "./utils.js";

/**
 * Scalable encryption configuration
 */
export interface ScalableEncryptionConfig {
  /** Automatically transition to shared key when recipients exceed this threshold */
  autoTransitionThreshold: number;
  /** Default permissions for new recipients */
  defaultRecipientPermissions: SharePermissions;
  /** Enable automatic key rotation */
  enableAutoKeyRotation: boolean;
  /** Key rotation interval in seconds */
  keyRotationInterval: number;
}

/**
 * Encryption context for tracking recipients and keys
 */
export interface EncryptionContext {
  /** Context ID */
  contextId: string;
  /** Current recipients */
  recipients: string[];
  /** Encryption method being used */
  method: EncryptionMethod;
  /** Shared key ID (if using shared encryption) */
  sharedKeyId?: string;
  /** Context metadata */
  metadata: {
    name: string;
    purpose: string;
    creator: string;
    createdAt: number;
    lastUpdated: number;
  };
  /** Auto-scaling configuration */
  scalingConfig: ScalableEncryptionConfig;
}

/**
 * Scalable encryption manager that automatically handles growth from single to multi-recipient
 */
export class ScalableEncryptionManager {
  private sharedKeyManager: SharedKeyManager;
  private contexts: Map<string, EncryptionContext> = new Map();
  private defaultConfig: ScalableEncryptionConfig;

  constructor(
    sharedKeyManager?: SharedKeyManager,
    defaultConfig?: Partial<ScalableEncryptionConfig>,
  ) {
    this.sharedKeyManager = sharedKeyManager || new SharedKeyManager();
    this.defaultConfig = {
      autoTransitionThreshold: 3,
      defaultRecipientPermissions: {
        canDecrypt: true,
        canEncrypt: true, // Enable encryption for scalable contexts
        canShare: false,
        canRevoke: false,
      },
      enableAutoKeyRotation: false,
      keyRotationInterval: 30 * 24 * 60 * 60, // 30 days
      ...defaultConfig,
    };
  }

  /**
   * Create a new encryption context (starts with single recipient)
   */
  async createEncryptionContext(
    contextName: string,
    purpose: string,
    initialRecipient: string,
    creatorPrivateKey: string | Uint8Array,
    config?: Partial<ScalableEncryptionConfig>,
  ): Promise<EncryptionContext> {
    if (!isValidPublicKey(initialRecipient)) {
      throw new Error("Invalid initial recipient public key");
    }

    const creatorPrivKeyBytes =
      typeof creatorPrivateKey === "string"
        ? decodeBase58(creatorPrivateKey)
        : creatorPrivateKey;

    const creatorKeypair = Keypair.fromSecretKey(creatorPrivKeyBytes);
    const creatorPublicKey = creatorKeypair.publicKey.toBase58();

    const contextId = `context_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const context: EncryptionContext = {
      contextId,
      recipients: [initialRecipient],
      method: EncryptionMethod.DIRECT,
      metadata: {
        name: contextName,
        purpose,
        creator: creatorPublicKey,
        createdAt: getCurrentTimestamp(),
        lastUpdated: getCurrentTimestamp(),
      },
      scalingConfig: {
        ...this.defaultConfig,
        ...config,
      },
    };

    this.contexts.set(contextId, context);
    return context;
  }

  /**
   * Encrypt data within a context (automatically scales as needed)
   */
  async encryptInContext(
    contextId: string,
    data: string | Uint8Array,
    senderPrivateKey: string | Uint8Array,
    options?: EncryptionOptions,
  ): Promise<EncryptionResult> {
    const context = this.contexts.get(contextId);
    if (!context) {
      throw new Error("Encryption context not found");
    }

    const senderPrivKeyBytes =
      typeof senderPrivateKey === "string"
        ? decodeBase58(senderPrivateKey)
        : senderPrivateKey;

    const senderKeypair = Keypair.fromSecretKey(senderPrivKeyBytes);
    const senderPublicKey = senderKeypair.publicKey.toBase58();

    // Check if we need to transition to shared key encryption
    if (
      context.method === EncryptionMethod.DIRECT &&
      context.recipients.length >= context.scalingConfig.autoTransitionThreshold
    ) {
      await this.transitionToSharedEncryption(
        contextId,
        senderPrivateKey,
        senderPublicKey,
      );
      // Refresh context after transition
      const updatedContext = this.contexts.get(contextId)!;
      return this.encryptWithSharedKey(
        updatedContext,
        data,
        senderPrivateKey,
        senderPublicKey,
        options,
      );
    }

    // Use appropriate encryption method
    if (context.method === EncryptionMethod.DIRECT) {
      // Single recipient encryption
      return encryptDirect(
        data,
        context.recipients[0],
        senderPrivateKey,
        options,
      );
    } else {
      // Shared key encryption
      return this.encryptWithSharedKey(
        context,
        data,
        senderPrivateKey,
        senderPublicKey,
        options,
      );
    }
  }

  /**
   * Decrypt data within a context
   */
  async decryptInContext(
    contextId: string,
    encryptionResult: EncryptionResult,
    recipientPrivateKey: string | Uint8Array,
    recipientPublicKey: string,
  ): Promise<Uint8Array> {
    const context = this.contexts.get(contextId);
    if (!context) {
      throw new Error("Encryption context not found");
    }

    // Verify recipient is authorized
    if (!context.recipients.includes(recipientPublicKey)) {
      throw new Error("Recipient not authorized for this context");
    }

    // Use appropriate decryption method
    if (context.method === EncryptionMethod.DIRECT) {
      return decryptDirect(encryptionResult, recipientPrivateKey);
    } else if (context.sharedKeyId) {
      return this.sharedKeyManager.decryptWithSharedKey(
        encryptionResult,
        recipientPrivateKey,
        recipientPublicKey,
      );
    } else {
      throw new Error("Invalid encryption context state");
    }
  }

  /**
   * Add recipients to an encryption context
   */
  async addRecipientsToContext(
    contextId: string,
    newRecipients: string[],
    authorizerPrivateKey: string | Uint8Array,
    authorizerPublicKey: string,
    permissions?: Partial<SharePermissions>,
  ): Promise<EncryptionContext> {
    const context = this.contexts.get(contextId);
    if (!context) {
      throw new Error("Encryption context not found");
    }

    // Validate new recipients
    const validRecipients = newRecipients.filter((recipient) => {
      return (
        isValidPublicKey(recipient) && !context.recipients.includes(recipient)
      );
    });

    if (validRecipients.length === 0) {
      return context; // No valid new recipients
    }

    // Check if we need to transition to shared encryption first
    const totalRecipients = context.recipients.length + validRecipients.length;

    if (
      context.method === EncryptionMethod.DIRECT &&
      totalRecipients > context.scalingConfig.autoTransitionThreshold
    ) {
      await this.transitionToSharedEncryption(
        contextId,
        authorizerPrivateKey,
        authorizerPublicKey,
      );
    }

    // Add recipients based on current method
    if (
      context.method === EncryptionMethod.DIRECT &&
      context.recipients.length === 1
    ) {
      // Still single recipient, but we're adding more - transition to shared
      await this.transitionToSharedEncryption(
        contextId,
        authorizerPrivateKey,
        authorizerPublicKey,
      );
    }

    // Refresh context after potential transition
    const updatedContext = this.contexts.get(contextId)!;

    // Now add to shared key
    if (updatedContext.sharedKeyId) {
      const recipientPermissions = {
        ...updatedContext.scalingConfig.defaultRecipientPermissions,
        ...permissions,
      };

      const recipientsWithPermissions = validRecipients.map((publicKey) => ({
        publicKey,
        permissions: recipientPermissions,
      }));

      await this.sharedKeyManager.addRecipientsToSharedKey(
        updatedContext.sharedKeyId,
        recipientsWithPermissions,
        authorizerPrivateKey,
        authorizerPublicKey,
      );
    }

    // Update context with new recipients
    const finalUpdatedContext: EncryptionContext = {
      ...updatedContext,
      recipients: [...updatedContext.recipients, ...validRecipients],
      metadata: {
        ...updatedContext.metadata,
        lastUpdated: getCurrentTimestamp(),
      },
    };

    this.contexts.set(contextId, finalUpdatedContext);
    return finalUpdatedContext;
  }

  /**
   * Remove recipients from an encryption context
   */
  async removeRecipientsFromContext(
    contextId: string,
    recipientsToRemove: string[],
    authorizerPrivateKey: string | Uint8Array,
    authorizerPublicKey: string,
    rotateKeys: boolean = true,
  ): Promise<EncryptionContext> {
    const context = this.contexts.get(contextId);
    if (!context) {
      throw new Error("Encryption context not found");
    }

    // Validate recipients to remove
    const validRecipientsToRemove = recipientsToRemove.filter((recipient) =>
      context.recipients.includes(recipient),
    );

    if (validRecipientsToRemove.length === 0) {
      return context; // No valid recipients to remove
    }

    // Don't allow removing all recipients
    if (validRecipientsToRemove.length >= context.recipients.length) {
      throw new Error("Cannot remove all recipients from context");
    }

    // Remove from shared key if using shared encryption
    if (context.sharedKeyId) {
      await this.sharedKeyManager.removeRecipientsFromSharedKey(
        context.sharedKeyId,
        validRecipientsToRemove,
        authorizerPrivateKey,
        authorizerPublicKey,
        rotateKeys,
      );
    }

    // Update context
    const updatedRecipients = context.recipients.filter(
      (recipient) => !validRecipientsToRemove.includes(recipient),
    );

    const updatedContext: EncryptionContext = {
      ...context,
      recipients: updatedRecipients,
      metadata: {
        ...context.metadata,
        lastUpdated: getCurrentTimestamp(),
      },
    };

    this.contexts.set(contextId, updatedContext);
    return updatedContext;
  }

  /**
   * Get context information
   */
  getContextInfo(contextId: string): EncryptionContext | null {
    return this.contexts.get(contextId) || null;
  }

  /**
   * List all contexts
   */
  listContexts(): Array<{
    contextId: string;
    name: string;
    recipients: number;
    method: EncryptionMethod;
    createdAt: number;
  }> {
    return Array.from(this.contexts.values()).map((context) => ({
      contextId: context.contextId,
      name: context.metadata.name,
      recipients: context.recipients.length,
      method: context.method,
      createdAt: context.metadata.createdAt,
    }));
  }

  /**
   * Update context configuration
   */
  updateContextConfig(
    contextId: string,
    newConfig: Partial<ScalableEncryptionConfig>,
  ): boolean {
    const context = this.contexts.get(contextId);
    if (!context) {
      return false;
    }

    const updatedContext: EncryptionContext = {
      ...context,
      scalingConfig: {
        ...context.scalingConfig,
        ...newConfig,
      },
      metadata: {
        ...context.metadata,
        lastUpdated: getCurrentTimestamp(),
      },
    };

    this.contexts.set(contextId, updatedContext);
    return true;
  }

  // Private helper methods

  private async transitionToSharedEncryption(
    contextId: string,
    authorizerPrivateKey: string | Uint8Array,
    authorizerPublicKey: string,
  ): Promise<void> {
    const context = this.contexts.get(contextId);
    if (!context || context.method !== EncryptionMethod.DIRECT) {
      return;
    }

    // Create shared key with current recipients
    // Give creator full permissions and recipients default permissions
    const initialRecipients = context.recipients.map((publicKey) => ({
      publicKey,
      permissions: context.scalingConfig.defaultRecipientPermissions,
    }));

    // Add the creator with full permissions if not already included
    // This ensures the creator can always manage their contexts
    if (!initialRecipients.some((r) => r.publicKey === authorizerPublicKey)) {
      initialRecipients.push({
        publicKey: authorizerPublicKey,
        permissions: {
          canDecrypt: true,
          canEncrypt: true,
          canShare: true,
          canRevoke: true,
        },
      });
    } else {
      // Ensure the creator has full permissions if they're already in recipients
      const creatorRecipient = initialRecipients.find(
        (r) => r.publicKey === authorizerPublicKey,
      );
      if (creatorRecipient) {
        creatorRecipient.permissions = {
          canDecrypt: true,
          canEncrypt: true,
          canShare: true,
          canRevoke: true,
        };
      }
    }

    const sharedKey = await this.sharedKeyManager.createSharedKey(
      {
        name: `Shared key for ${context.metadata.name}`,
        purpose: context.metadata.purpose,
        creator: authorizerPublicKey,
        algorithm: "AES-256-GCM",
        derivationMethod: "ECDH + PBKDF2",
        properties: {
          contextId,
          transitionedAt: getCurrentTimestamp(),
        },
      },
      initialRecipients,
      authorizerPrivateKey,
    );

    // Update context
    const updatedContext: EncryptionContext = {
      ...context,
      method: EncryptionMethod.GROUP,
      sharedKeyId: sharedKey.keyId,
      metadata: {
        ...context.metadata,
        lastUpdated: getCurrentTimestamp(),
      },
    };

    this.contexts.set(contextId, updatedContext);
  }

  private async encryptWithSharedKey(
    context: EncryptionContext,
    data: string | Uint8Array,
    senderPrivateKey: string | Uint8Array,
    senderPublicKey: string,
    options?: EncryptionOptions,
  ): Promise<EncryptionResult> {
    if (!context.sharedKeyId) {
      throw new Error("No shared key ID in context");
    }

    return this.sharedKeyManager.encryptWithSharedKey(
      data,
      context.sharedKeyId,
      senderPrivateKey,
      senderPublicKey,
    );
  }
}

// Convenience functions
export async function createScalableEncryption(
  contextName: string,
  purpose: string,
  initialRecipient: string,
  creatorPrivateKey: string | Uint8Array,
  config?: Partial<ScalableEncryptionConfig>,
): Promise<{
  manager: ScalableEncryptionManager;
  context: EncryptionContext;
}> {
  const manager = new ScalableEncryptionManager();
  const context = await manager.createEncryptionContext(
    contextName,
    purpose,
    initialRecipient,
    creatorPrivateKey,
    config,
  );

  return { manager, context };
}
