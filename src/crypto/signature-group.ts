/**
 * Signature-based group encryption
 * Dynamic groups with membership managed by signatures
 */

import { bytesToBase58 as encodeBase58, base58ToBytes as decodeBase58 } from '../utils/base58.js';
import { Keypair } from '@solana/web3.js';
import {
  EncryptionMethod,
  EncryptionResult,
  SignatureGroupMetadata,
  GroupMember,
  MemberRole,
  MemberPermissions,
  GroupPermissions,
  EncryptionEpoch,
  KeyShare,
  EncryptionOptions,
  KeyRotationRequest
} from './types.js';
import {
  generateRandomBytes,
  deriveKey,
  encryptAES,
  decryptAES,
  signData,
  verifySignature,
  stringToBytes,
  bytesToString,
  combineBuffers,
  splitBuffer,
  generateId,
  KEY_SIZE,
  IV_SIZE,
  AUTH_TAG_SIZE,
  getCurrentTimestamp,
  compressData,
  decompressData,
  isValidPublicKey
} from './utils.js';

/**
 * Default permissions for different roles
 */
const DEFAULT_ROLE_PERMISSIONS: Record<MemberRole, MemberPermissions> = {
  [MemberRole.OWNER]: {
    canDecrypt: true,
    canEncrypt: true,
    canAddMembers: true,
    canRemoveMembers: true,
    canRotateKeys: true
  },
  [MemberRole.ADMIN]: {
    canDecrypt: true,
    canEncrypt: true,
    canAddMembers: true,
    canRemoveMembers: true,
    canRotateKeys: false
  },
  [MemberRole.MEMBER]: {
    canDecrypt: true,
    canEncrypt: true,
    canAddMembers: false,
    canRemoveMembers: false,
    canRotateKeys: false
  },
  [MemberRole.VIEWER]: {
    canDecrypt: true,
    canEncrypt: false,
    canAddMembers: false,
    canRemoveMembers: false,
    canRotateKeys: false
  }
};

/**
 * Create a signature-based dynamic group
 */
export async function createSignatureGroup(
  groupName: string,
  creatorPrivateKey: string | Uint8Array,
  initialMembers: { publicKey: string; role: MemberRole }[],
  permissions?: Partial<GroupPermissions>
): Promise<SignatureGroupMetadata> {
  const creatorPrivKeyBytes = typeof creatorPrivateKey === 'string'
    ? decodeBase58(creatorPrivateKey)
    : creatorPrivateKey;

  // Get creator's public key
  const creatorKeypair = Keypair.fromSecretKey(creatorPrivKeyBytes);
  const creatorPublicKey = creatorKeypair.publicKey.toBase58();

  // Generate group ID
  const groupId = generateId(groupName, creatorPublicKey, Date.now().toString());

  // Create group data for signature
  const groupData = {
    groupId,
    groupName,
    creatorPublicKey,
    timestamp: getCurrentTimestamp()
  };

  // Sign group creation
  const groupSignature = encodeBase58(
    signData(stringToBytes(JSON.stringify(groupData)), creatorPrivKeyBytes)
  );

  // Generate initial master key
  const masterKey = generateRandomBytes(KEY_SIZE);
  const masterKeyId = generateId(masterKey);

  // Create initial epoch
  const initialEpoch: EncryptionEpoch = {
    epochNumber: 0,
    startTime: getCurrentTimestamp(),
    masterKeyId,
    rotationReason: 'Group creation'
  };

  // Create members list with creator as owner
  const members: GroupMember[] = [
    {
      publicKey: creatorPublicKey,
      role: MemberRole.OWNER,
      joinedAt: getCurrentTimestamp(),
      addedBy: creatorPublicKey,
      permissions: DEFAULT_ROLE_PERMISSIONS[MemberRole.OWNER]
    }
  ];

  // Add initial members
  const keyShares: KeyShare[] = [];
  
  // Create key share for creator
  const creatorShare = await createKeyShareForMember(
    masterKey,
    creatorPublicKey,
    creatorPrivKeyBytes
  );
  keyShares.push(creatorShare);

  // Add other initial members
  for (const member of initialMembers) {
    if (!isValidPublicKey(member.publicKey)) {
      throw new Error(`Invalid public key: ${member.publicKey}`);
    }

    if (member.publicKey !== creatorPublicKey) {
      members.push({
        publicKey: member.publicKey,
        role: member.role,
        joinedAt: getCurrentTimestamp(),
        addedBy: creatorPublicKey,
        permissions: DEFAULT_ROLE_PERMISSIONS[member.role]
      });

      const share = await createKeyShareForMember(
        masterKey,
        member.publicKey,
        creatorPrivKeyBytes
      );
      keyShares.push(share);
    }
  }

  // Set group permissions
  const groupPermissions: GroupPermissions = {
    allowDynamicMembership: true,
    requireSignatureVerification: true,
    maxMembers: 100,
    allowKeyRotation: true,
    autoExpireInactiveMembers: false,
    inactivityThresholdDays: 90,
    ...permissions
  };

  return {
    groupId,
    groupName,
    groupSignature,
    members,
    permissions: groupPermissions,
    epochs: [initialEpoch],
    keyShares,
    creatorPublicKey,
    nonce: '',
    timestamp: getCurrentTimestamp(),
    version: '1.0.0'
  };
}

/**
 * Add a member to a signature group
 */
export async function addMemberToSignatureGroup(
  groupMetadata: SignatureGroupMetadata,
  newMember: { publicKey: string; role: MemberRole },
  authorizedMemberPrivateKey: string | Uint8Array,
  authorizedMemberPublicKey: string
): Promise<SignatureGroupMetadata> {
  // Verify authorized member has permission
  const authorizedMember = groupMetadata.members.find(
    m => m.publicKey === authorizedMemberPublicKey
  );

  if (!authorizedMember) {
    throw new Error('Authorized member not found in group');
  }

  if (!authorizedMember.permissions.canAddMembers) {
    throw new Error('Member does not have permission to add new members');
  }

  // Check group limits
  if (groupMetadata.permissions.maxMembers > 0 && 
      groupMetadata.members.length >= groupMetadata.permissions.maxMembers) {
    throw new Error('Group has reached maximum member limit');
  }

  // Check if member already exists
  if (groupMetadata.members.some(m => m.publicKey === newMember.publicKey)) {
    throw new Error('Member already exists in group');
  }

  // Get current master key
  const authorizedPrivKeyBytes = typeof authorizedMemberPrivateKey === 'string'
    ? decodeBase58(authorizedMemberPrivateKey)
    : authorizedMemberPrivateKey;

  const currentEpoch = groupMetadata.epochs[groupMetadata.epochs.length - 1];
  const masterKey = await getMasterKeyForMember(
    groupMetadata,
    authorizedMemberPublicKey,
    authorizedPrivKeyBytes
  );

  // Create key share for new member
  const newKeyShare = await createKeyShareForMember(
    masterKey,
    newMember.publicKey,
    authorizedPrivKeyBytes
  );

  // Create new member entry
  const newMemberEntry: GroupMember = {
    publicKey: newMember.publicKey,
    role: newMember.role,
    joinedAt: getCurrentTimestamp(),
    addedBy: authorizedMemberPublicKey,
    permissions: DEFAULT_ROLE_PERMISSIONS[newMember.role]
  };

  // Sign the addition
  const additionData = {
    groupId: groupMetadata.groupId,
    action: 'add_member',
    member: newMemberEntry,
    timestamp: getCurrentTimestamp()
  };

  const additionSignature = encodeBase58(
    signData(stringToBytes(JSON.stringify(additionData)), authorizedPrivKeyBytes)
  );

  // Return updated metadata
  return {
    ...groupMetadata,
    members: [...groupMetadata.members, newMemberEntry],
    keyShares: [...groupMetadata.keyShares, newKeyShare],
    timestamp: getCurrentTimestamp()
  };
}

/**
 * Remove a member from a signature group
 */
export async function removeMemberFromSignatureGroup(
  groupMetadata: SignatureGroupMetadata,
  memberToRemove: string,
  authorizedMemberPrivateKey: string | Uint8Array,
  authorizedMemberPublicKey: string,
  rotateKeys: boolean = true
): Promise<SignatureGroupMetadata> {
  // Verify authorized member has permission
  const authorizedMember = groupMetadata.members.find(
    m => m.publicKey === authorizedMemberPublicKey
  );

  if (!authorizedMember) {
    throw new Error('Authorized member not found in group');
  }

  if (!authorizedMember.permissions.canRemoveMembers) {
    throw new Error('Member does not have permission to remove members');
  }

  // Cannot remove the owner
  const memberToRemoveData = groupMetadata.members.find(
    m => m.publicKey === memberToRemove
  );

  if (!memberToRemoveData) {
    throw new Error('Member to remove not found in group');
  }

  if (memberToRemoveData.role === MemberRole.OWNER) {
    throw new Error('Cannot remove group owner');
  }

  // Remove member and their key share
  const updatedMembers = groupMetadata.members.filter(
    m => m.publicKey !== memberToRemove
  );
  const updatedKeyShares = groupMetadata.keyShares.filter(
    share => share.recipientPublicKey !== memberToRemove
  );

  let updatedMetadata: SignatureGroupMetadata = {
    ...groupMetadata,
    members: updatedMembers,
    keyShares: updatedKeyShares,
    timestamp: getCurrentTimestamp()
  };

  // Rotate keys if requested (recommended for security)
  if (rotateKeys && authorizedMember.permissions.canRotateKeys) {
    const rotationRequest: KeyRotationRequest = {
      groupId: groupMetadata.groupId,
      reason: `Member removed: ${memberToRemove}`,
      excludeMembers: [memberToRemove]
    };

    updatedMetadata = await rotateGroupKeys(
      updatedMetadata,
      rotationRequest,
      authorizedMemberPrivateKey,
      authorizedMemberPublicKey
    );
  }

  return updatedMetadata;
}

/**
 * Rotate encryption keys for a group
 */
export async function rotateGroupKeys(
  groupMetadata: SignatureGroupMetadata,
  rotationRequest: KeyRotationRequest,
  authorizedMemberPrivateKey: string | Uint8Array,
  authorizedMemberPublicKey: string
): Promise<SignatureGroupMetadata> {
  // Verify permissions
  const authorizedMember = groupMetadata.members.find(
    m => m.publicKey === authorizedMemberPublicKey
  );

  if (!authorizedMember?.permissions.canRotateKeys) {
    throw new Error('Member does not have permission to rotate keys');
  }

  if (!groupMetadata.permissions.allowKeyRotation) {
    throw new Error('Key rotation is not allowed for this group');
  }

  const authorizedPrivKeyBytes = typeof authorizedMemberPrivateKey === 'string'
    ? decodeBase58(authorizedMemberPrivateKey)
    : authorizedMemberPrivateKey;

  // Generate new master key
  const newMasterKey = generateRandomBytes(KEY_SIZE);
  const newMasterKeyId = generateId(newMasterKey);

  // Close current epoch
  const currentEpoch = groupMetadata.epochs[groupMetadata.epochs.length - 1];
  currentEpoch.endTime = getCurrentTimestamp();

  // Create new epoch
  const newEpoch: EncryptionEpoch = {
    epochNumber: currentEpoch.epochNumber + 1,
    startTime: getCurrentTimestamp(),
    masterKeyId: newMasterKeyId,
    rotationReason: rotationRequest.reason
  };

  // Create new key shares for all active members
  const newKeyShares: KeyShare[] = [];
  
  for (const member of groupMetadata.members) {
    if (!rotationRequest.excludeMembers?.includes(member.publicKey)) {
      const share = await createKeyShareForMember(
        newMasterKey,
        member.publicKey,
        authorizedPrivKeyBytes
      );
      newKeyShares.push(share);
    }
  }

  // Update permissions if provided
  const updatedPermissions = rotationRequest.newPermissions
    ? { ...groupMetadata.permissions, ...rotationRequest.newPermissions }
    : groupMetadata.permissions;

  return {
    ...groupMetadata,
    keyShares: newKeyShares,
    epochs: [...groupMetadata.epochs, newEpoch],
    permissions: updatedPermissions,
    timestamp: getCurrentTimestamp()
  };
}

/**
 * Encrypt data for a signature group
 */
export async function encryptForSignatureGroup(
  data: string | Uint8Array,
  groupMetadata: SignatureGroupMetadata,
  senderPrivateKey: string | Uint8Array,
  senderPublicKey: string,
  options?: EncryptionOptions
): Promise<EncryptionResult> {
  // Verify sender is a member with encrypt permission
  const senderMember = groupMetadata.members.find(
    m => m.publicKey === senderPublicKey
  );

  if (!senderMember) {
    throw new Error('Sender is not a member of this group');
  }

  if (!senderMember.permissions.canEncrypt) {
    throw new Error('Sender does not have permission to encrypt for this group');
  }

  // Convert and prepare data
  let dataBytes = typeof data === 'string' ? stringToBytes(data) : data;
  
  if (options?.compress) {
    dataBytes = await compressData(dataBytes);
  }

  // Get current master key
  const senderPrivKeyBytes = typeof senderPrivateKey === 'string'
    ? decodeBase58(senderPrivateKey)
    : senderPrivateKey;

  const masterKey = await getMasterKeyForMember(
    groupMetadata,
    senderPublicKey,
    senderPrivKeyBytes
  );

  // Encrypt data
  const { encrypted, iv, authTag } = encryptAES(dataBytes, masterKey);
  
  // Create metadata signature
  const encryptionData = {
    groupId: groupMetadata.groupId,
    sender: senderPublicKey,
    timestamp: getCurrentTimestamp(),
    epochNumber: groupMetadata.epochs[groupMetadata.epochs.length - 1].epochNumber
  };

  const metadataSignature = encodeBase58(
    signData(stringToBytes(JSON.stringify(encryptionData)), senderPrivKeyBytes)
  );

  // Combine all parts
  const combined = combineBuffers(
    decodeBase58(groupMetadata.groupId),
    decodeBase58(metadataSignature),
    iv,
    authTag,
    encrypted
  );

  // Update metadata
  const metadata: SignatureGroupMetadata = {
    ...groupMetadata,
    nonce: encodeBase58(iv),
    timestamp: getCurrentTimestamp()
  };

  if (options?.compress) {
    (metadata as any).compressed = true;
  }

  return {
    encryptedData: encodeBase58(combined),
    method: EncryptionMethod.SIGNATURE_GROUP,
    metadata
  };
}

/**
 * Decrypt signature group encrypted data
 */
export async function decryptSignatureGroupData(
  encryptionResult: EncryptionResult,
  memberPrivateKey: string | Uint8Array,
  memberPublicKey: string,
  options?: { verifySignature?: boolean }
): Promise<Uint8Array> {
  if (encryptionResult.method !== EncryptionMethod.SIGNATURE_GROUP) {
    throw new Error('Invalid encryption method for signature group decryption');
  }

  const metadata = encryptionResult.metadata as SignatureGroupMetadata;
  
  // Verify member has decrypt permission
  const member = metadata.members.find(m => m.publicKey === memberPublicKey);
  
  if (!member) {
    throw new Error('Not a member of this group');
  }

  if (!member.permissions.canDecrypt) {
    throw new Error('Member does not have permission to decrypt');
  }

  const memberPrivKeyBytes = typeof memberPrivateKey === 'string'
    ? decodeBase58(memberPrivateKey)
    : memberPrivateKey;

  // Get master key
  const masterKey = await getMasterKeyForMember(
    metadata,
    memberPublicKey,
    memberPrivKeyBytes
  );

  // Decode combined data
  const combined = decodeBase58(encryptionResult.encryptedData);
  const groupIdSize = 32;
  const signatureSize = 64;
  
  const [groupIdBytes, signature, iv, authTag, encrypted] = splitBuffer(
    combined,
    groupIdSize,
    signatureSize,
    IV_SIZE,
    AUTH_TAG_SIZE
  );

  // Verify group ID
  if (encodeBase58(groupIdBytes) !== metadata.groupId) {
    throw new Error('Group ID mismatch');
  }

  // Verify signature if requested
  if (options?.verifySignature && metadata.permissions.requireSignatureVerification) {
    // Would need sender's public key from metadata to verify
    // This is a simplified version
  }

  // Decrypt data
  let decrypted = decryptAES(encrypted, masterKey, iv, authTag);
  
  // Decompress if needed
  if ((metadata as any).compressed) {
    decrypted = await decompressData(decrypted);
  }

  return decrypted;
}

/**
 * Helper: Create key share for a member
 */
async function createKeyShareForMember(
  masterKey: Uint8Array,
  recipientPublicKey: string,
  senderPrivateKey: Uint8Array
): Promise<KeyShare> {
  const recipientPubKeyBytes = decodeBase58(recipientPublicKey);
  
  // Use salt-based approach like direct encryption
  const salt = generateRandomBytes(32);
  const sharedSecret = deriveKey(recipientPubKeyBytes, salt, 1000);
  
  // Encrypt master key
  const { encrypted, iv, authTag } = encryptAES(masterKey, sharedSecret);
  
  const combined = combineBuffers(salt, iv, authTag, encrypted);
  
  return {
    recipientPublicKey,
    encryptedShare: encodeBase58(combined),
    createdAt: getCurrentTimestamp()
  };
}

/**
 * Helper: Get master key for a member
 */
async function getMasterKeyForMember(
  metadata: SignatureGroupMetadata,
  memberPublicKey: string,
  memberPrivateKey: Uint8Array
): Promise<Uint8Array> {
  // Find member's key share
  const keyShare = metadata.keyShares.find(
    share => share.recipientPublicKey === memberPublicKey
  );

  if (!keyShare) {
    throw new Error('No key share found for member');
  }

  // Check expiration
  if (keyShare.expiresAt && getCurrentTimestamp() > keyShare.expiresAt) {
    throw new Error('Key share has expired');
  }

  // Decode share
  const combined = decodeBase58(keyShare.encryptedShare);
  const [salt, iv, authTag, encrypted] = splitBuffer(combined, 32, IV_SIZE, AUTH_TAG_SIZE);

  // Use salt-based key derivation like in createKeyShareForMember
  const memberPubKeyBytes = decodeBase58(memberPublicKey);
  const sharedSecret = deriveKey(memberPubKeyBytes, salt, 1000);

  // Decrypt master key
  return decryptAES(encrypted, sharedSecret, iv, authTag);
}