/**
 * Core types for cryptographic operations
 */

/**
 * Supported encryption methods
 */
export enum EncryptionMethod {
  /** Personal encryption using sender's private key */
  PERSONAL = 'personal',
  /** Direct encryption to specific recipient */
  DIRECT = 'direct',
  /** Group encryption for multiple recipients */
  GROUP = 'group',
  /** Dynamic group with signature-based access */
  SIGNATURE_GROUP = 'signature-group'
}

/**
 * Base encryption result
 */
export interface EncryptionResult {
  /** Encrypted data (base58) */
  encryptedData: string;
  /** Encryption method used */
  method: EncryptionMethod;
  /** Metadata specific to encryption method */
  metadata: EncryptionMetadata;
}

/**
 * Base encryption metadata
 */
export interface EncryptionMetadata {
  /** Nonce/IV used for encryption (base58) */
  nonce: string;
  /** Timestamp of encryption */
  timestamp: number;
  /** Version for future compatibility */
  version: string;
}

/**
 * Personal encryption metadata
 */
export interface PersonalEncryptionMetadata extends EncryptionMetadata {
  /** Key derivation salt (base58) */
  salt: string;
}

/**
 * Direct encryption metadata
 */
export interface DirectEncryptionMetadata extends EncryptionMetadata {
  /** Sender's public key (base58) */
  senderPublicKey: string;
  /** Recipient's public key (base58) */
  recipientPublicKey: string;
  /** Ephemeral public key for forward secrecy (base58) */
  ephemeralPublicKey?: string;
}

/**
 * Group encryption metadata
 */
export interface GroupEncryptionMetadata extends EncryptionMetadata {
  /** Group identifier */
  groupId: string;
  /** Encrypted key shares for each recipient */
  keyShares: KeyShare[];
  /** Group creator's public key */
  creatorPublicKey: string;
}

/**
 * Signature group metadata (for dynamic groups)
 */
export interface SignatureGroupMetadata extends GroupEncryptionMetadata {
  /** Group name */
  groupName: string;
  /** Group signature for verification */
  groupSignature: string;
  /** Current members with their roles */
  members: GroupMember[];
  /** Group permissions */
  permissions: GroupPermissions;
  /** Encryption epochs for key rotation */
  epochs: EncryptionEpoch[];
}

/**
 * Key share for group members
 */
export interface KeyShare {
  /** Recipient's public key (base58) */
  recipientPublicKey: string;
  /** Encrypted key share (base58) */
  encryptedShare: string;
  /** Share creation timestamp */
  createdAt: number;
  /** Optional expiration timestamp */
  expiresAt?: number;
}

/**
 * Group member information
 */
export interface GroupMember {
  /** Member's public key (base58) */
  publicKey: string;
  /** Member's role in the group */
  role: MemberRole;
  /** When the member joined */
  joinedAt: number;
  /** Who added this member */
  addedBy: string;
  /** Member's permissions */
  permissions: MemberPermissions;
}

/**
 * Member roles in a group
 */
export enum MemberRole {
  /** Group creator with full permissions */
  OWNER = 'owner',
  /** Administrator who can add/remove members */
  ADMIN = 'admin',
  /** Regular member with read/write access */
  MEMBER = 'member',
  /** Read-only access */
  VIEWER = 'viewer'
}

/**
 * Member permissions
 */
export interface MemberPermissions {
  /** Can decrypt data */
  canDecrypt: boolean;
  /** Can encrypt new data */
  canEncrypt: boolean;
  /** Can add new members */
  canAddMembers: boolean;
  /** Can remove members */
  canRemoveMembers: boolean;
  /** Can rotate encryption keys */
  canRotateKeys: boolean;
}

/**
 * Group permissions and settings
 */
export interface GroupPermissions {
  /** Allow dynamic membership */
  allowDynamicMembership: boolean;
  /** Require signature verification */
  requireSignatureVerification: boolean;
  /** Maximum number of members (0 = unlimited) */
  maxMembers: number;
  /** Allow key rotation */
  allowKeyRotation: boolean;
  /** Auto-expire inactive members */
  autoExpireInactiveMembers: boolean;
  /** Inactivity threshold in days */
  inactivityThresholdDays: number;
}

/**
 * Encryption epoch for key rotation
 */
export interface EncryptionEpoch {
  /** Epoch number */
  epochNumber: number;
  /** Epoch start timestamp */
  startTime: number;
  /** Epoch end timestamp (if rotated) */
  endTime?: number;
  /** Master key ID for this epoch */
  masterKeyId: string;
  /** Reason for rotation */
  rotationReason?: string;
}

/**
 * Decryption request
 */
export interface DecryptionRequest {
  /** Encrypted data to decrypt */
  encryptedData: string;
  /** Encryption metadata */
  metadata: EncryptionMetadata;
  /** Decryptor's private key (base58) */
  privateKey: string;
  /** Additional options */
  options?: DecryptionOptions;
}

/**
 * Decryption options
 */
export interface DecryptionOptions {
  /** Verify signatures if present */
  verifySignatures?: boolean;
  /** Check member permissions */
  checkPermissions?: boolean;
  /** Allow expired key shares */
  allowExpiredShares?: boolean;
}

/**
 * Crypto configuration
 */
export interface CryptoConfig {
  /** Default encryption method */
  defaultMethod: EncryptionMethod;
  /** Key derivation iterations */
  keyDerivationIterations: number;
  /** Enable debug logging */
  debug: boolean;
  /** Custom RNG function */
  randomGenerator?: () => Uint8Array;
}

/**
 * Encryption options
 */
export interface EncryptionOptions {
  /** Override default method */
  method?: EncryptionMethod;
  /** Compression before encryption */
  compress?: boolean;
  /** Add integrity check */
  addIntegrityCheck?: boolean;
  /** Custom metadata */
  customMetadata?: Record<string, any>;
}

/**
 * Key rotation request
 */
export interface KeyRotationRequest {
  /** Group ID to rotate keys for */
  groupId: string;
  /** Reason for rotation */
  reason: string;
  /** Members to exclude from new epoch */
  excludeMembers?: string[];
  /** New permissions for the group */
  newPermissions?: Partial<GroupPermissions>;
}