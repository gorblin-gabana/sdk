/**
 * Shared Key Manager for transitioning between single and group encryption
 * Manages shared encryption/decryption keys that can be distributed among group members
 */

import { bytesToBase58 as encodeBase58, base58ToBytes as decodeBase58 } from '../utils/base58.js';
import { Keypair } from '@solana/web3.js';
import {
  EncryptionMethod,
  EncryptionResult,
  GroupMember,
  MemberRole,
  KeyShare,
  SignatureGroupMetadata
} from './types.js';
import {
  generateRandomBytes,
  encryptAES,
  decryptAES,
  stringToBytes,
  bytesToString,
  combineBuffers,
  splitBuffer,
  generateId,
  signData,
  verifySignature,
  KEY_SIZE,
  IV_SIZE,
  AUTH_TAG_SIZE,
  getCurrentTimestamp
} from './utils.js';

/**
 * Shared encryption key that can be distributed to multiple recipients
 */
export interface SharedEncryptionKey {
  /** Unique key identifier */
  keyId: string;
  /** The actual encryption key (encrypted per recipient) */
  encryptedShares: Map<string, EncryptedKeyShare>;
  /** Key metadata */
  metadata: SharedKeyMetadata;
  /** Current key holders */
  holders: string[];
  /** Key creation timestamp */
  createdAt: number;
  /** Key expiration (optional) */
  expiresAt?: number;
}

/**
 * Encrypted key share for a specific recipient
 */
export interface EncryptedKeyShare {
  /** Recipient's public key */
  recipientPublicKey: string;
  /** Encrypted key data */
  encryptedData: string;
  /** Share-specific nonce */
  nonce: string;
  /** Share creation timestamp */
  createdAt: number;
  /** Who created this share */
  createdBy: string;
  /** Share permissions */
  permissions: SharePermissions;
}

/**
 * Permissions for a key share
 */
export interface SharePermissions {
  /** Can use key to decrypt data */
  canDecrypt: boolean;
  /** Can use key to encrypt data */
  canEncrypt: boolean;
  /** Can share key with others */
  canShare: boolean;
  /** Can revoke their own access */
  canRevoke: boolean;
  /** Key usage expiration */
  usageExpiresAt?: number;
}

/**
 * Shared key metadata
 */
export interface SharedKeyMetadata {
  /** Key name/description */
  name: string;
  /** Key purpose */
  purpose: string;
  /** Key creator */
  creator: string;
  /** Key algorithm used */
  algorithm: string;
  /** Key derivation method */
  derivationMethod: string;
  /** Custom properties */
  properties: Record<string, any>;
}

/**
 * Key transition request - converting single key to shared key
 */
export interface KeyTransitionRequest {
  /** Original recipient public key */
  originalRecipient: string;
  /** New recipients to add */
  newRecipients: { publicKey: string; permissions: SharePermissions }[];
  /** Transition reason */
  reason: string;
  /** Authorizer private key */
  authorizerPrivateKey: string | Uint8Array;
  /** Authorizer public key */
  authorizerPublicKey: string;
}

/**
 * Manages shared encryption keys for flexible group encryption
 */
export class SharedKeyManager {
  private sharedKeys: Map<string, SharedEncryptionKey> = new Map();
  private keyDerivationCache: Map<string, Uint8Array> = new Map();

  /**
   * Create a new shared encryption key
   */
  async createSharedKey(
    keyMetadata: SharedKeyMetadata,
    initialRecipients: { publicKey: string; permissions: SharePermissions }[],
    creatorPrivateKey: string | Uint8Array
  ): Promise<SharedEncryptionKey> {
    const creatorPrivKeyBytes = typeof creatorPrivateKey === 'string'
      ? decodeBase58(creatorPrivateKey)
      : creatorPrivateKey;

    // Get creator's public key
    const creatorKeypair = Keypair.fromSecretKey(creatorPrivKeyBytes);
    const creatorPublicKey = creatorKeypair.publicKey.toBase58();

    // Generate a master shared key
    const masterKey = generateRandomBytes(KEY_SIZE);
    const keyId = generateId(masterKey, creatorPublicKey);

    // Create encrypted shares for each recipient
    const encryptedShares = new Map<string, EncryptedKeyShare>();
    const holders: string[] = [];

    for (const recipient of initialRecipients) {
      const share = await this.createEncryptedKeyShare(
        masterKey,
        recipient.publicKey,
        recipient.permissions,
        creatorPrivKeyBytes,
        creatorPublicKey
      );
      
      encryptedShares.set(recipient.publicKey, share);
      holders.push(recipient.publicKey);
    }

    const sharedKey: SharedEncryptionKey = {
      keyId,
      encryptedShares,
      metadata: keyMetadata,
      holders,
      createdAt: getCurrentTimestamp()
    };

    // Store the key
    this.sharedKeys.set(keyId, sharedKey);

    return sharedKey;
  }

  /**
   * Transition from single recipient encryption to shared key encryption
   */
  async transitionToSharedKey(
    originalEncryptionResult: EncryptionResult,
    transitionRequest: KeyTransitionRequest
  ): Promise<{
    sharedKey: SharedEncryptionKey;
    reEncryptedData: EncryptionResult;
  }> {
    // First, decrypt the original data (assuming the authorizer has access)
    const originalData = await this.decryptWithOriginalKey(
      originalEncryptionResult,
      transitionRequest.authorizerPrivateKey
    );

    // Create new shared key metadata
    const keyMetadata: SharedKeyMetadata = {
      name: `Shared key transitioned from ${transitionRequest.originalRecipient}`,
      purpose: transitionRequest.reason,
      creator: transitionRequest.authorizerPublicKey,
      algorithm: 'AES-256-GCM',
      derivationMethod: 'ECDH + PBKDF2',
      properties: {
        originalRecipient: transitionRequest.originalRecipient,
        transitionedAt: getCurrentTimestamp()
      }
    };

    // Include original recipient with full permissions
    const allRecipients = [
      {
        publicKey: transitionRequest.originalRecipient,
        permissions: {
          canDecrypt: true,
          canEncrypt: true,
          canShare: true,
          canRevoke: true
        }
      },
      ...transitionRequest.newRecipients
    ];

    // Create the shared key
    const sharedKey = await this.createSharedKey(
      keyMetadata,
      allRecipients,
      transitionRequest.authorizerPrivateKey
    );

    // Re-encrypt the data with the shared key
    const reEncryptedData = await this.encryptWithSharedKey(
      originalData,
      sharedKey.keyId,
      transitionRequest.authorizerPrivateKey,
      transitionRequest.authorizerPublicKey
    );

    return {
      sharedKey,
      reEncryptedData
    };
  }

  /**
   * Add new recipients to an existing shared key
   */
  async addRecipientsToSharedKey(
    keyId: string,
    newRecipients: { publicKey: string; permissions: SharePermissions }[],
    authorizerPrivateKey: string | Uint8Array,
    authorizerPublicKey: string
  ): Promise<SharedEncryptionKey> {
    const sharedKey = this.sharedKeys.get(keyId);
    if (!sharedKey) {
      throw new Error('Shared key not found');
    }

    // Verify authorizer has sharing permissions
    const authorizerShare = sharedKey.encryptedShares.get(authorizerPublicKey);
    if (!authorizerShare || !authorizerShare.permissions.canShare) {
      throw new Error('Authorizer does not have permission to share this key');
    }

    const authorizerPrivKeyBytes = typeof authorizerPrivateKey === 'string'
      ? decodeBase58(authorizerPrivateKey)
      : authorizerPrivateKey;

    // First, decrypt the master key using authorizer's share
    const masterKey = await this.decryptKeyShare(
      authorizerShare,
      authorizerPrivKeyBytes,
      authorizerShare.createdBy
    );

    // Create encrypted shares for new recipients
    const updatedShares = new Map(sharedKey.encryptedShares);
    const updatedHolders = [...sharedKey.holders];

    for (const recipient of newRecipients) {
      if (updatedShares.has(recipient.publicKey)) {
        continue; // Skip if already a recipient
      }

      const share = await this.createEncryptedKeyShare(
        masterKey,
        recipient.publicKey,
        recipient.permissions,
        authorizerPrivKeyBytes,
        authorizerPublicKey
      );

      updatedShares.set(recipient.publicKey, share);
      updatedHolders.push(recipient.publicKey);
    }

    // Update the shared key
    const updatedSharedKey: SharedEncryptionKey = {
      ...sharedKey,
      encryptedShares: updatedShares,
      holders: updatedHolders
    };

    this.sharedKeys.set(keyId, updatedSharedKey);

    return updatedSharedKey;
  }

  /**
   * Remove recipients from a shared key
   */
  async removeRecipientsFromSharedKey(
    keyId: string,
    recipientsToRemove: string[],
    authorizerPrivateKey: string | Uint8Array,
    authorizerPublicKey: string,
    rotateKey: boolean = true
  ): Promise<SharedEncryptionKey> {
    const sharedKey = this.sharedKeys.get(keyId);
    if (!sharedKey) {
      throw new Error('Shared key not found');
    }

    // Verify authorizer permissions
    const authorizerShare = sharedKey.encryptedShares.get(authorizerPublicKey);
    if (!authorizerShare || !authorizerShare.permissions.canShare) {
      throw new Error('Authorizer does not have permission to modify this key');
    }

    // Remove specified recipients
    const updatedShares = new Map(sharedKey.encryptedShares);
    const updatedHolders = sharedKey.holders.filter(
      holder => !recipientsToRemove.includes(holder)
    );

    recipientsToRemove.forEach(recipient => {
      updatedShares.delete(recipient);
    });

    let finalShares = updatedShares;

    // Rotate key if requested (recommended for security)
    if (rotateKey) {
      const authorizerPrivKeyBytes = typeof authorizerPrivateKey === 'string'
        ? decodeBase58(authorizerPrivateKey)
        : authorizerPrivateKey;

      // Generate new master key
      const newMasterKey = generateRandomBytes(KEY_SIZE);
      
      // Re-encrypt for remaining recipients
      finalShares = new Map();
      
      for (const holder of updatedHolders) {
        const originalShare = updatedShares.get(holder);
        if (originalShare) {
          const newShare = await this.createEncryptedKeyShare(
            newMasterKey,
            holder,
            originalShare.permissions,
            authorizerPrivKeyBytes,
            authorizerPublicKey
          );
          finalShares.set(holder, newShare);
        }
      }
    }

    const updatedSharedKey: SharedEncryptionKey = {
      ...sharedKey,
      encryptedShares: finalShares,
      holders: updatedHolders
    };

    this.sharedKeys.set(keyId, updatedSharedKey);

    return updatedSharedKey;
  }

  /**
   * Encrypt data using a shared key
   */
  async encryptWithSharedKey(
    data: string | Uint8Array,
    keyId: string,
    senderPrivateKey: string | Uint8Array,
    senderPublicKey: string
  ): Promise<EncryptionResult> {
    const sharedKey = this.sharedKeys.get(keyId);
    if (!sharedKey) {
      throw new Error('Shared key not found');
    }

    // Verify sender has encryption permissions
    const senderShare = sharedKey.encryptedShares.get(senderPublicKey);
    if (!senderShare || !senderShare.permissions.canEncrypt) {
      throw new Error('Sender does not have permission to encrypt with this key');
    }

    const senderPrivKeyBytes = typeof senderPrivateKey === 'string'
      ? decodeBase58(senderPrivateKey)
      : senderPrivateKey;

    // Decrypt the master key
    const masterKey = await this.decryptKeyShare(
      senderShare,
      senderPrivKeyBytes,
      senderShare.createdBy
    );

    // Prepare data
    const dataBytes = typeof data === 'string' ? stringToBytes(data) : data;

    // Encrypt with master key
    const { encrypted, iv, authTag } = encryptAES(dataBytes, masterKey);

    // Create signature for integrity
    const timestamp = getCurrentTimestamp();
    const encryptionMetadata = {
      keyId,
      sender: senderPublicKey,
      timestamp: timestamp,
      recipients: sharedKey.holders
    };

    const metadataSignature = encodeBase58(
      signData(stringToBytes(JSON.stringify(encryptionMetadata)), senderPrivKeyBytes)
    );

    // Combine all parts
    const combined = combineBuffers(
      decodeBase58(keyId),
      decodeBase58(metadataSignature),
      iv,
      authTag,
      encrypted
    );

    return {
      encryptedData: encodeBase58(combined),
      method: EncryptionMethod.GROUP,
      metadata: {
        nonce: encodeBase58(iv),
        timestamp: timestamp,
        version: '2.0.0',
        keyId,
        sender: senderPublicKey,
        recipients: sharedKey.holders,
        signature: metadataSignature
      } as any
    };
  }

  /**
   * Decrypt data encrypted with a shared key
   */
  async decryptWithSharedKey(
    encryptionResult: EncryptionResult,
    recipientPrivateKey: string | Uint8Array,
    recipientPublicKey: string
  ): Promise<Uint8Array> {
    const metadata = encryptionResult.metadata as any;
    const keyId = metadata.keyId;

    const sharedKey = this.sharedKeys.get(keyId);
    if (!sharedKey) {
      throw new Error('Shared key not found');
    }

    // Verify recipient has decryption permissions
    const recipientShare = sharedKey.encryptedShares.get(recipientPublicKey);
    if (!recipientShare || !recipientShare.permissions.canDecrypt) {
      throw new Error('Recipient does not have permission to decrypt with this key');
    }

    const recipientPrivKeyBytes = typeof recipientPrivateKey === 'string'
      ? decodeBase58(recipientPrivateKey)
      : recipientPrivateKey;

    // Decrypt the master key
    const masterKey = await this.decryptKeyShare(
      recipientShare,
      recipientPrivKeyBytes,
      recipientShare.createdBy
    );

    // Decode the combined data
    const combined = decodeBase58(encryptionResult.encryptedData);
    const keyIdSize = 32; // SHA256 hash size
    const signatureSize = 64; // ed25519 signature size

    const [keyIdBytes, signature, iv, authTag, encrypted] = splitBuffer(
      combined,
      keyIdSize,
      signatureSize,
      IV_SIZE,
      AUTH_TAG_SIZE
    );

    // Verify key ID
    if (encodeBase58(keyIdBytes) !== keyId) {
      throw new Error('Key ID mismatch');
    }

    // Verify signature if sender is known
    if (metadata.sender && metadata.signature) {
      const expectedMetadata = {
        keyId,
        sender: metadata.sender,
        timestamp: metadata.timestamp,
        recipients: sharedKey.holders
      };

      const isValidSignature = verifySignature(
        stringToBytes(JSON.stringify(expectedMetadata)),
        decodeBase58(metadata.signature),
        decodeBase58(metadata.sender)
      );

      if (!isValidSignature) {
        throw new Error('Invalid encryption signature');
      }
    }

    // Decrypt the data
    return decryptAES(encrypted, masterKey, iv, authTag);
  }

  /**
   * List all shared keys
   */
  listSharedKeys(): Array<{
    keyId: string;
    name: string;
    holders: number;
    createdAt: number;
  }> {
    return Array.from(this.sharedKeys.values()).map(key => ({
      keyId: key.keyId,
      name: key.metadata.name,
      holders: key.holders.length,
      createdAt: key.createdAt
    }));
  }

  /**
   * Get detailed information about a shared key
   */
  getSharedKeyInfo(keyId: string): SharedEncryptionKey | null {
    return this.sharedKeys.get(keyId) || null;
  }

  /**
   * Export a shared key (encrypted for backup)
   */
  async exportSharedKey(
    keyId: string,
    exporterPrivateKey: string | Uint8Array,
    exporterPublicKey: string,
    backupPassword: string
  ): Promise<string> {
    const sharedKey = this.sharedKeys.get(keyId);
    if (!sharedKey) {
      throw new Error('Shared key not found');
    }

    // Verify exporter has access
    const exporterShare = sharedKey.encryptedShares.get(exporterPublicKey);
    if (!exporterShare) {
      throw new Error('Exporter does not have access to this key');
    }

    const exportData = {
      sharedKey,
      exportedAt: getCurrentTimestamp(),
      exportedBy: exporterPublicKey
    };

    // Encrypt with backup password
    const passwordKey = new TextEncoder().encode(backupPassword).slice(0, 32);
    const padded = new Uint8Array(32);
    padded.set(passwordKey);

    const { encrypted, iv, authTag } = encryptAES(
      stringToBytes(JSON.stringify(exportData)),
      padded
    );

    const exportPackage = {
      encrypted: encodeBase58(encrypted),
      iv: encodeBase58(iv),
      authTag: encodeBase58(authTag),
      version: '2.0.0'
    };

    return encodeBase58(stringToBytes(JSON.stringify(exportPackage)));
  }

  /**
   * Import a shared key from backup
   */
  async importSharedKey(
    exportedData: string,
    backupPassword: string
  ): Promise<SharedEncryptionKey> {
    try {
      const exportPackage = JSON.parse(
        bytesToString(decodeBase58(exportedData))
      );

      // Decrypt with backup password
      const passwordKey = new TextEncoder().encode(backupPassword).slice(0, 32);
      const padded = new Uint8Array(32);
      padded.set(passwordKey);

      const decrypted = decryptAES(
        decodeBase58(exportPackage.encrypted),
        padded,
        decodeBase58(exportPackage.iv),
        decodeBase58(exportPackage.authTag)
      );

      const exportData = JSON.parse(bytesToString(decrypted));
      const sharedKey = exportData.sharedKey as SharedEncryptionKey;

      // Store the imported key
      this.sharedKeys.set(sharedKey.keyId, sharedKey);

      return sharedKey;
    } catch (error) {
      throw new Error('Failed to import shared key: Invalid data or password');
    }
  }

  // Private helper methods

  private async createEncryptedKeyShare(
    masterKey: Uint8Array,
    recipientPublicKey: string,
    permissions: SharePermissions,
    senderPrivateKey: Uint8Array,
    senderPublicKey: string
  ): Promise<EncryptedKeyShare> {
    const recipientPubKeyBytes = decodeBase58(recipientPublicKey);
    
    // Use salt-based approach like in direct encryption
    const salt = generateRandomBytes(32);
    const { deriveKey } = await import('./utils.js');
    const sharedSecret = deriveKey(recipientPubKeyBytes, salt, 1000);
    
    // Encrypt master key with shared secret  
    const { encrypted, iv, authTag } = encryptAES(masterKey, sharedSecret);
    
    // Combine salt, iv, authTag, and encrypted key
    const combined = combineBuffers(salt, iv, authTag, encrypted);
    
    return {
      recipientPublicKey,
      encryptedData: encodeBase58(combined),
      nonce: encodeBase58(iv),
      createdAt: getCurrentTimestamp(),
      createdBy: senderPublicKey,
      permissions
    };
  }

  private async decryptKeyShare(
    keyShare: EncryptedKeyShare,
    recipientPrivateKey: Uint8Array,
    senderPublicKey: string
  ): Promise<Uint8Array> {
    const recipientPubKeyBytes = decodeBase58(keyShare.recipientPublicKey);
    
    // Decode the encrypted share
    const combined = decodeBase58(keyShare.encryptedData);
    const [salt, iv, authTag, encrypted] = splitBuffer(combined, 32, IV_SIZE, AUTH_TAG_SIZE);
    
    // Use same salt-based approach as encryption
    const { deriveKey } = await import('./utils.js');
    const sharedSecret = deriveKey(recipientPubKeyBytes, salt, 1000);
    
    // Decrypt the master key
    return decryptAES(encrypted, sharedSecret, iv, authTag);
  }

  private async decryptWithOriginalKey(
    encryptionResult: EncryptionResult,
    privateKey: string | Uint8Array
  ): Promise<Uint8Array> {
    // This would use the appropriate decryption method based on the original encryption method
    // For now, assuming it's a direct encryption
    const { decryptDirect } = await import('./direct.js');
    return decryptDirect(encryptionResult, privateKey);
  }
}