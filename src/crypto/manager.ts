/**
 * Crypto Manager - Main interface for all cryptographic operations
 */

import { Keypair } from "@solana/web3.js";
import type {
  EncryptionResult,
  CryptoConfig,
  SignatureGroupMetadata,
  MemberRole,
  GroupPermissions,
} from "./types.js";
import {
  EncryptionMethod,
  EncryptionOptions,
  DecryptionOptions,
  GroupMember,
} from "./types.js";
import {
  encryptPersonal,
  decryptPersonal,
  decryptPersonalString,
  PersonalEncryptionSession,
} from "./personal.js";
import {
  encryptDirect,
  decryptDirect,
  decryptDirectString,
  SecureChannel,
} from "./direct.js";
import {
  createGroup,
  encryptGroup,
  decryptGroup,
  decryptGroupString,
  addGroupMember,
} from "./group.js";
import {
  createSignatureGroup,
  addMemberToSignatureGroup,
  removeMemberFromSignatureGroup,
  rotateGroupKeys,
  encryptForSignatureGroup,
  decryptSignatureGroupData,
} from "./signature-group.js";
import {
  bytesToString,
  stringToBytes,
  isValidPublicKey,
  signData,
  verifySignature,
} from "./utils.js";
import {
  bytesToBase58 as encodeBase58,
  base58ToBytes as decodeBase58,
} from "../utils/base58.js";

/**
 * Main crypto manager for the SDK
 */
export class CryptoManager {
  private config: CryptoConfig;
  private groupCache: Map<string, SignatureGroupMetadata> = new Map();

  constructor(config?: Partial<CryptoConfig>) {
    this.config = {
      defaultMethod: EncryptionMethod.PERSONAL,
      keyDerivationIterations: 100000,
      debug: false,
      ...config,
    };
  }

  /**
   * Encrypt data using the specified method
   */
  async encrypt(
    data: string | Uint8Array,
    options: {
      method?: EncryptionMethod;
      privateKey?: string | Uint8Array;
      recipientPublicKey?: string;
      recipientPublicKeys?: string[];
      groupMetadata?: SignatureGroupMetadata;
      groupId?: string;
      compress?: boolean;
    } = {},
  ): Promise<EncryptionResult> {
    const method = options.method || this.config.defaultMethod;

    switch (method) {
      case EncryptionMethod.PERSONAL:
        if (!options.privateKey) {
          throw new Error("Private key required for personal encryption");
        }
        return encryptPersonal(data, options.privateKey, {
          compress: options.compress,
        });

      case EncryptionMethod.DIRECT:
        if (!options.privateKey || !options.recipientPublicKey) {
          throw new Error(
            "Private key and recipient public key required for direct encryption",
          );
        }
        return encryptDirect(
          data,
          options.recipientPublicKey,
          options.privateKey,
          { compress: options.compress },
        );

      case EncryptionMethod.GROUP:
        if (!options.groupMetadata) {
          throw new Error("Group metadata required for group encryption");
        }
        return encryptGroup(data, options.groupMetadata, {
          compress: options.compress,
        });

      case EncryptionMethod.SIGNATURE_GROUP:
        if (!options.groupId || !options.privateKey) {
          throw new Error(
            "Group ID and private key required for signature group encryption",
          );
        }
        const groupMeta = await this.getGroupMetadata(options.groupId);
        if (!groupMeta) {
          throw new Error("Group not found");
        }

        // Get sender's public key
        const senderKeypair = Keypair.fromSecretKey(
          typeof options.privateKey === "string"
            ? decodeBase58(options.privateKey)
            : options.privateKey,
        );

        return encryptForSignatureGroup(
          data,
          groupMeta,
          options.privateKey,
          senderKeypair.publicKey.toBase58(),
          { compress: options.compress },
        );

      default:
        throw new Error(`Unsupported encryption method: ${method}`);
    }
  }

  /**
   * Decrypt data
   */
  async decrypt(
    encryptionResult: EncryptionResult,
    privateKey: string | Uint8Array,
    options?: {
      publicKey?: string; // Required for group decryption
      verifySignature?: boolean;
    },
  ): Promise<Uint8Array> {
    switch (encryptionResult.method) {
      case EncryptionMethod.PERSONAL:
        return decryptPersonal(encryptionResult, privateKey);

      case EncryptionMethod.DIRECT:
        return decryptDirect(encryptionResult, privateKey);

      case EncryptionMethod.GROUP:
        if (!options?.publicKey) {
          throw new Error("Public key required for group decryption");
        }
        return decryptGroup(encryptionResult, privateKey, options.publicKey);

      case EncryptionMethod.SIGNATURE_GROUP:
        if (!options?.publicKey) {
          throw new Error("Public key required for signature group decryption");
        }
        return decryptSignatureGroupData(
          encryptionResult,
          privateKey,
          options.publicKey,
          { verifySignature: options.verifySignature },
        );

      default:
        throw new Error(
          `Unsupported decryption method: ${encryptionResult.method}`,
        );
    }
  }

  /**
   * Decrypt data and return as string
   */
  async decryptString(
    encryptionResult: EncryptionResult,
    privateKey: string | Uint8Array,
    options?: {
      publicKey?: string;
      verifySignature?: boolean;
    },
  ): Promise<string> {
    const decrypted = await this.decrypt(encryptionResult, privateKey, options);
    return bytesToString(decrypted);
  }

  /**
   * Create a new signature-based group
   */
  async createSignatureGroup(
    groupName: string,
    creatorPrivateKey: string | Uint8Array,
    initialMembers: { publicKey: string; role: MemberRole }[] = [],
    permissions?: Partial<GroupPermissions>,
  ): Promise<SignatureGroupMetadata> {
    const group = await createSignatureGroup(
      groupName,
      creatorPrivateKey,
      initialMembers,
      permissions,
    );

    // Cache the group
    this.groupCache.set(group.groupId, group);

    return group;
  }

  /**
   * Add a member to a signature group
   */
  async addMemberToGroup(
    groupId: string,
    newMember: { publicKey: string; role: MemberRole },
    authorizedMemberPrivateKey: string | Uint8Array,
    authorizedMemberPublicKey: string,
  ): Promise<SignatureGroupMetadata> {
    const group = await this.getGroupMetadata(groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    const updatedGroup = await addMemberToSignatureGroup(
      group,
      newMember,
      authorizedMemberPrivateKey,
      authorizedMemberPublicKey,
    );

    // Update cache
    this.groupCache.set(groupId, updatedGroup);

    return updatedGroup;
  }

  /**
   * Remove a member from a signature group
   */
  async removeMemberFromGroup(
    groupId: string,
    memberToRemove: string,
    authorizedMemberPrivateKey: string | Uint8Array,
    authorizedMemberPublicKey: string,
    rotateKeys: boolean = true,
  ): Promise<SignatureGroupMetadata> {
    const group = await this.getGroupMetadata(groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    const updatedGroup = await removeMemberFromSignatureGroup(
      group,
      memberToRemove,
      authorizedMemberPrivateKey,
      authorizedMemberPublicKey,
      rotateKeys,
    );

    // Update cache
    this.groupCache.set(groupId, updatedGroup);

    return updatedGroup;
  }

  /**
   * Create a secure channel between two parties
   */
  createSecureChannel(
    localPrivateKey: string | Uint8Array,
    remotePublicKey: string,
  ): SecureChannel {
    return new SecureChannel(localPrivateKey, remotePublicKey);
  }

  /**
   * Create a personal encryption session
   */
  createPersonalSession(
    privateKey: string | Uint8Array,
  ): PersonalEncryptionSession {
    return new PersonalEncryptionSession(privateKey);
  }

  /**
   * Sign data
   */
  sign(data: string | Uint8Array, privateKey: string | Uint8Array): string {
    const dataBytes = typeof data === "string" ? stringToBytes(data) : data;
    const privateKeyBytes =
      typeof privateKey === "string" ? decodeBase58(privateKey) : privateKey;

    return encodeBase58(signData(dataBytes, privateKeyBytes));
  }

  /**
   * Verify signature
   */
  verify(
    data: string | Uint8Array,
    signature: string,
    publicKey: string,
  ): boolean {
    const dataBytes = typeof data === "string" ? stringToBytes(data) : data;
    const signatureBytes = decodeBase58(signature);
    const publicKeyBytes = decodeBase58(publicKey);

    return verifySignature(dataBytes, signatureBytes, publicKeyBytes);
  }

  /**
   * Get group metadata (from cache or storage)
   */
  async getGroupMetadata(
    groupId: string,
  ): Promise<SignatureGroupMetadata | null> {
    return this.groupCache.get(groupId) || null;
  }

  /**
   * Store group metadata
   */
  async storeGroupMetadata(group: SignatureGroupMetadata): Promise<void> {
    this.groupCache.set(group.groupId, group);
  }

  /**
   * List all cached groups
   */
  listCachedGroups(): string[] {
    return Array.from(this.groupCache.keys());
  }

  /**
   * Clear group cache
   */
  clearGroupCache(): void {
    this.groupCache.clear();
  }

  /**
   * Validate a public key
   */
  validatePublicKey(publicKey: string): boolean {
    return isValidPublicKey(publicKey);
  }

  /**
   * Generate a new keypair
   */
  generateKeypair(): {
    publicKey: string;
    privateKey: string;
  } {
    const keypair = Keypair.generate();
    return {
      publicKey: keypair.publicKey.toBase58(),
      privateKey: encodeBase58(keypair.secretKey),
    };
  }

  // Direct method aliases for backward compatibility and testing
  /**
   * Encrypt data using personal encryption
   */
  async encryptPersonal(
    data: string | Uint8Array,
    privateKey: string | Uint8Array,
    options?: { compress?: boolean },
  ): Promise<EncryptionResult> {
    return encryptPersonal(data, privateKey, options);
  }

  /**
   * Decrypt personal encrypted data
   */
  async decryptPersonal(
    encryptionResult: EncryptionResult,
    privateKey: string | Uint8Array,
  ): Promise<Uint8Array> {
    return decryptPersonal(encryptionResult, privateKey);
  }

  /**
   * Decrypt personal encrypted data and return as string
   */
  async decryptPersonalString(
    encryptionResult: EncryptionResult,
    privateKey: string | Uint8Array,
  ): Promise<string> {
    return decryptPersonalString(encryptionResult, privateKey);
  }

  /**
   * Encrypt data for direct communication
   */
  async encryptDirect(
    data: string | Uint8Array,
    recipientPublicKey: string,
    senderPrivateKey: string | Uint8Array,
    options?: { compress?: boolean },
  ): Promise<EncryptionResult> {
    return encryptDirect(data, recipientPublicKey, senderPrivateKey, options);
  }

  /**
   * Decrypt direct encrypted data
   */
  async decryptDirect(
    encryptionResult: EncryptionResult,
    recipientPrivateKey: string | Uint8Array,
  ): Promise<Uint8Array> {
    return decryptDirect(encryptionResult, recipientPrivateKey);
  }

  /**
   * Decrypt direct encrypted data and return as string
   */
  async decryptDirectString(
    encryptionResult: EncryptionResult,
    recipientPrivateKey: string | Uint8Array,
  ): Promise<string> {
    return decryptDirectString(encryptionResult, recipientPrivateKey);
  }

  /**
   * Encrypt data for group
   */
  async encryptGroup(
    data: string | Uint8Array,
    groupMetadata: SignatureGroupMetadata,
    options?: { compress?: boolean },
  ): Promise<EncryptionResult> {
    return encryptGroup(data, groupMetadata, options);
  }

  /**
   * Decrypt group encrypted data
   */
  async decryptGroup(
    encryptionResult: EncryptionResult,
    privateKey: string | Uint8Array,
    publicKey: string,
  ): Promise<Uint8Array> {
    return decryptGroup(encryptionResult, privateKey, publicKey);
  }
}
