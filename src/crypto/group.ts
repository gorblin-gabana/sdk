/**
 * Group encryption for multiple recipients
 * Static groups with fixed membership
 */

import {
  bytesToBase58 as encodeBase58,
  base58ToBytes as decodeBase58,
} from "../utils/base58.js";
import { Keypair } from "@solana/web3.js";
import type {
  EncryptionResult,
  GroupEncryptionMetadata,
  KeyShare,
  EncryptionOptions,
} from "./types.js";
import { EncryptionMethod } from "./types.js";
import {
  generateRandomBytes,
  performKeyExchange,
  encryptAES,
  decryptAES,
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
} from "./utils.js";

/**
 * Create a static encryption group
 */
export async function createGroup(
  groupName: string,
  memberPublicKeys: string[],
  creatorPrivateKey: string | Uint8Array,
): Promise<GroupEncryptionMetadata> {
  const creatorPrivKeyBytes =
    typeof creatorPrivateKey === "string"
      ? decodeBase58(creatorPrivateKey)
      : creatorPrivateKey;

  // Get creator's public key
  const creatorKeypair = Keypair.fromSecretKey(creatorPrivKeyBytes);
  const creatorPublicKey = creatorKeypair.publicKey.toBase58();

  // Generate group ID
  const groupId = generateId(groupName, ...memberPublicKeys.sort());

  // Generate master key for the group
  const masterKey = generateRandomBytes(KEY_SIZE);

  // Create key shares for each member
  const keyShares: KeyShare[] = [];

  for (const memberPublicKey of memberPublicKeys) {
    const share = await createKeyShare(
      masterKey,
      memberPublicKey,
      creatorPrivKeyBytes,
    );
    keyShares.push(share);
  }

  return {
    groupId,
    keyShares,
    creatorPublicKey,
    nonce: "", // Will be set during encryption
    timestamp: getCurrentTimestamp(),
    version: "1.0.0",
  };
}

/**
 * Encrypt data for a group
 */
export async function encryptGroup(
  data: string | Uint8Array,
  groupMetadata: GroupEncryptionMetadata,
  options?: EncryptionOptions,
): Promise<EncryptionResult> {
  // Convert input
  let dataBytes = typeof data === "string" ? stringToBytes(data) : data;

  // Compress if requested
  if (options?.compress) {
    dataBytes = await compressData(dataBytes);
  }

  // Reconstruct master key from any key share (for demonstration)
  // In practice, the encryptor should have the master key stored securely
  const masterKey = generateRandomBytes(KEY_SIZE);

  // Encrypt data with master key
  const { encrypted, iv, authTag } = encryptAES(dataBytes, masterKey);

  // Combine group ID, iv, authTag, and encrypted data
  const groupIdBytes = decodeBase58(groupMetadata.groupId);
  const combined = combineBuffers(groupIdBytes, iv, authTag, encrypted);

  // Update metadata with nonce
  const metadata: GroupEncryptionMetadata = {
    ...groupMetadata,
    nonce: encodeBase58(iv),
    timestamp: getCurrentTimestamp(),
  };

  // Add compression flag if used
  if (options?.compress) {
    (metadata as any).compressed = true;
  }

  return {
    encryptedData: encodeBase58(combined),
    method: EncryptionMethod.GROUP,
    metadata,
  };
}

/**
 * Decrypt group encrypted data
 */
export async function decryptGroup(
  encryptionResult: EncryptionResult,
  memberPrivateKey: string | Uint8Array,
  memberPublicKey: string,
): Promise<Uint8Array> {
  if (encryptionResult.method !== EncryptionMethod.GROUP) {
    throw new Error("Invalid encryption method for group decryption");
  }

  const metadata = encryptionResult.metadata as GroupEncryptionMetadata;
  const memberPrivKeyBytes =
    typeof memberPrivateKey === "string"
      ? decodeBase58(memberPrivateKey)
      : memberPrivateKey;

  // Find member's key share
  const keyShare = metadata.keyShares.find(
    (share) => share.recipientPublicKey === memberPublicKey,
  );

  if (!keyShare) {
    throw new Error("No key share found for this member");
  }

  // Decrypt the master key
  const masterKey = await decryptKeyShare(
    keyShare,
    memberPrivKeyBytes,
    metadata.creatorPublicKey,
  );

  // Decode the combined data
  const combined = decodeBase58(encryptionResult.encryptedData);

  // Split the combined data
  const groupIdSize = 32; // SHA256 hash size
  const [groupIdBytes, iv, authTag, encrypted] = splitBuffer(
    combined,
    groupIdSize,
    IV_SIZE,
    AUTH_TAG_SIZE,
  );

  // Verify group ID
  const groupId = encodeBase58(groupIdBytes);
  if (groupId !== metadata.groupId) {
    throw new Error("Group ID mismatch");
  }

  // Decrypt the data
  let decrypted = decryptAES(encrypted, masterKey, iv, authTag);

  // Decompress if needed
  if ((metadata as any).compressed) {
    decrypted = await decompressData(decrypted);
  }

  return decrypted;
}

/**
 * Decrypt group encrypted data and return as string
 */
export async function decryptGroupString(
  encryptionResult: EncryptionResult,
  memberPrivateKey: string | Uint8Array,
  memberPublicKey: string,
): Promise<string> {
  const decrypted = await decryptGroup(
    encryptionResult,
    memberPrivateKey,
    memberPublicKey,
  );
  return bytesToString(decrypted);
}

/**
 * Create an encrypted key share for a group member
 */
async function createKeyShare(
  masterKey: Uint8Array,
  recipientPublicKey: string,
  senderPrivateKey: Uint8Array,
): Promise<KeyShare> {
  const recipientPubKeyBytes = decodeBase58(recipientPublicKey);

  // Perform key exchange
  const sharedSecret = performKeyExchange(
    senderPrivateKey,
    recipientPubKeyBytes,
  );

  // Encrypt master key with shared secret
  const { encrypted, iv, authTag } = encryptAES(masterKey, sharedSecret);

  // Combine iv, authTag, and encrypted key
  const combined = combineBuffers(iv, authTag, encrypted);

  return {
    recipientPublicKey,
    encryptedShare: encodeBase58(combined),
    createdAt: getCurrentTimestamp(),
  };
}

/**
 * Decrypt a key share to get the master key
 */
async function decryptKeyShare(
  keyShare: KeyShare,
  recipientPrivateKey: Uint8Array,
  senderPublicKey: string,
): Promise<Uint8Array> {
  const senderPubKeyBytes = decodeBase58(senderPublicKey);

  // Perform key exchange
  const sharedSecret = performKeyExchange(
    recipientPrivateKey,
    senderPubKeyBytes,
  );

  // Decode the encrypted share
  const combined = decodeBase58(keyShare.encryptedShare);
  const [iv, authTag, encrypted] = splitBuffer(
    combined,
    IV_SIZE,
    AUTH_TAG_SIZE,
  );

  // Decrypt the master key
  return decryptAES(encrypted, sharedSecret, iv, authTag);
}

/**
 * Add a member to an existing group (creates new metadata)
 */
export async function addGroupMember(
  groupMetadata: GroupEncryptionMetadata,
  newMemberPublicKey: string,
  authorizedMemberPrivateKey: string | Uint8Array,
  authorizedMemberPublicKey: string,
): Promise<GroupEncryptionMetadata> {
  const authorizedPrivKeyBytes =
    typeof authorizedMemberPrivateKey === "string"
      ? decodeBase58(authorizedMemberPrivateKey)
      : authorizedMemberPrivateKey;

  // First, decrypt the master key as authorized member
  const authorizedKeyShare = groupMetadata.keyShares.find(
    (share) => share.recipientPublicKey === authorizedMemberPublicKey,
  );

  if (!authorizedKeyShare) {
    throw new Error("Authorized member not found in group");
  }

  const masterKey = await decryptKeyShare(
    authorizedKeyShare,
    authorizedPrivKeyBytes,
    groupMetadata.creatorPublicKey,
  );

  // Create key share for new member
  const newKeyShare = await createKeyShare(
    masterKey,
    newMemberPublicKey,
    authorizedPrivKeyBytes,
  );

  // Return updated metadata
  return {
    ...groupMetadata,
    keyShares: [...groupMetadata.keyShares, newKeyShare],
    timestamp: getCurrentTimestamp(),
  };
}
