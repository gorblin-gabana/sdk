/**
 * Personal encryption using private keys
 * For encrypting data that only the key owner can decrypt
 */

import {
  bytesToBase58 as encodeBase58,
  base58ToBytes as decodeBase58,
} from "../utils/base58.js";
import type {
  EncryptionResult,
  PersonalEncryptionMetadata,
  EncryptionOptions,
} from "./types.js";
import { EncryptionMethod, DecryptionRequest } from "./types.js";
import {
  generateRandomBytes,
  deriveKey,
  encryptAES,
  decryptAES,
  stringToBytes,
  bytesToString,
  combineBuffers,
  splitBuffer,
  SALT_SIZE,
  IV_SIZE,
  AUTH_TAG_SIZE,
  getCurrentTimestamp,
  compressData,
  decompressData,
} from "./utils.js";

/**
 * Encrypt data using a private key (personal encryption)
 * Only the private key owner can decrypt this data
 */
export async function encryptPersonal(
  data: string | Uint8Array,
  privateKey: string | Uint8Array,
  options?: EncryptionOptions,
): Promise<EncryptionResult> {
  // Convert inputs
  let dataBytes = typeof data === "string" ? stringToBytes(data) : data;

  // Validate and convert private key
  let privateKeyBytes: Uint8Array;
  if (typeof privateKey === "string") {
    try {
      if (!privateKey || privateKey.length < 32) {
        throw new Error("Invalid private key format");
      }
      privateKeyBytes = decodeBase58(privateKey);
    } catch (error) {
      throw new Error("Invalid private key: unable to decode base58");
    }
  } else {
    privateKeyBytes = privateKey;
  }

  // Validate private key length (should be 32 or 64 bytes for ed25519)
  if (
    !privateKeyBytes ||
    (privateKeyBytes.length !== 32 && privateKeyBytes.length !== 64)
  ) {
    throw new Error("Invalid private key: must be 32 or 64 bytes");
  }

  // Check for invalid key patterns (all zeros, etc.)
  const isAllZeros = privateKeyBytes.every((byte) => byte === 0);
  const isAllOnes = privateKeyBytes.every((byte) => byte === 255);
  if (isAllZeros || isAllOnes) {
    throw new Error("Invalid private key: key cannot be all zeros or all ones");
  }

  // Compress if requested
  if (options?.compress) {
    dataBytes = await compressData(dataBytes);
  }

  // Generate salt for key derivation
  const salt = generateRandomBytes(SALT_SIZE);

  // Derive encryption key from private key
  const encryptionKey = deriveKey(privateKeyBytes, salt);

  // Encrypt the data
  const { encrypted, iv, authTag } = encryptAES(dataBytes, encryptionKey);

  // Combine salt, iv, authTag, and encrypted data
  const combined = combineBuffers(salt, iv, authTag, encrypted);

  // Create metadata
  const metadata: PersonalEncryptionMetadata = {
    salt: encodeBase58(salt),
    nonce: encodeBase58(iv),
    timestamp: getCurrentTimestamp(),
    version: "1.0.0",
    ...options?.customMetadata, // Spread custom metadata
  };

  // Add compression flag to metadata if used
  if (options?.compress) {
    (metadata as any).compressed = true;
  }

  return {
    encryptedData: encodeBase58(combined),
    method: EncryptionMethod.PERSONAL,
    metadata,
  };
}

/**
 * Decrypt personal encrypted data
 */
export async function decryptPersonal(
  encryptionResult: EncryptionResult,
  privateKey: string | Uint8Array,
): Promise<Uint8Array> {
  if (encryptionResult.method !== EncryptionMethod.PERSONAL) {
    throw new Error("Invalid encryption method for personal decryption");
  }

  const metadata = encryptionResult.metadata as PersonalEncryptionMetadata;
  const privateKeyBytes =
    typeof privateKey === "string" ? decodeBase58(privateKey) : privateKey;

  // Decode the combined data
  const combined = decodeBase58(encryptionResult.encryptedData);

  // Split the combined data
  const [salt, iv, authTag, encrypted] = splitBuffer(
    combined,
    SALT_SIZE,
    IV_SIZE,
    AUTH_TAG_SIZE,
  );

  // Validate metadata integrity - nonce should match IV
  if (metadata.nonce !== encodeBase58(iv)) {
    throw new Error("Metadata tampering detected: nonce mismatch");
  }

  // Validate metadata integrity - salt should match
  if (metadata.salt !== encodeBase58(salt)) {
    throw new Error("Metadata tampering detected: salt mismatch");
  }

  // Validate version - should be a known version
  const supportedVersions = ["1.0.0"];
  if (!supportedVersions.includes(metadata.version)) {
    throw new Error(
      "Metadata tampering detected: unsupported or invalid version",
    );
  }

  // Derive the same encryption key
  const decryptionKey = deriveKey(privateKeyBytes, salt);

  // Decrypt the data
  let decrypted = decryptAES(encrypted, decryptionKey, iv, authTag);

  // Decompress if needed
  if ((metadata as any).compressed) {
    decrypted = await decompressData(decrypted);
  }

  return decrypted;
}

/**
 * Decrypt personal encrypted data and return as string
 */
export async function decryptPersonalString(
  encryptionResult: EncryptionResult,
  privateKey: string | Uint8Array,
): Promise<string> {
  const decrypted = await decryptPersonal(encryptionResult, privateKey);
  return bytesToString(decrypted);
}

/**
 * Create a personal encryption session for multiple operations
 */
export class PersonalEncryptionSession {
  private encryptionKey: Uint8Array;
  private salt: Uint8Array;

  constructor(privateKey: string | Uint8Array) {
    const privateKeyBytes =
      typeof privateKey === "string" ? decodeBase58(privateKey) : privateKey;

    // Generate a session salt
    this.salt = generateRandomBytes(SALT_SIZE);

    // Derive session key
    this.encryptionKey = deriveKey(privateKeyBytes, this.salt);
  }

  /**
   * Encrypt data in this session
   */
  async encrypt(data: string | Uint8Array): Promise<EncryptionResult> {
    const dataBytes = typeof data === "string" ? stringToBytes(data) : data;

    const { encrypted, iv, authTag } = encryptAES(
      dataBytes,
      this.encryptionKey,
    );

    const combined = combineBuffers(this.salt, iv, authTag, encrypted);

    const metadata: PersonalEncryptionMetadata = {
      salt: encodeBase58(this.salt),
      nonce: encodeBase58(iv),
      timestamp: getCurrentTimestamp(),
      version: "1.0.0",
    };

    return {
      encryptedData: encodeBase58(combined),
      method: EncryptionMethod.PERSONAL,
      metadata,
    };
  }

  /**
   * Get session info
   */
  getSessionInfo() {
    return {
      salt: encodeBase58(this.salt),
      keyId: encodeBase58(this.encryptionKey.slice(0, 8)),
    };
  }
}
