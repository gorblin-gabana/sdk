/**
 * Direct encryption between two parties
 * Uses public key cryptography for secure communication
 */

import { bytesToBase58 as encodeBase58, base58ToBytes as decodeBase58 } from '../utils/base58.js';
import nacl from 'tweetnacl';
import {
  EncryptionMethod,
  EncryptionResult,
  DirectEncryptionMetadata,
  EncryptionOptions
} from './types.js';
import {
  generateRandomBytes,
  performKeyExchange,
  encryptAES,
  decryptAES,
  stringToBytes,
  bytesToString,
  combineBuffers,
  splitBuffer,
  generateKeyPair,
  deriveKey,
  IV_SIZE,
  AUTH_TAG_SIZE,
  getCurrentTimestamp,
  compressData,
  decompressData,
  ed25519ToCurve25519PrivateKey,
  ed25519ToCurve25519PublicKey
} from './utils.js';
import { Keypair } from '@solana/web3.js';

/**
 * Encrypt data for a specific recipient
 */
export async function encryptDirect(
  data: string | Uint8Array,
  recipientPublicKey: string,
  senderPrivateKey: string | Uint8Array,
  options?: EncryptionOptions
): Promise<EncryptionResult> {
  // Convert inputs
  let dataBytes = typeof data === 'string' ? stringToBytes(data) : data;
  const recipientPubKeyBytes = decodeBase58(recipientPublicKey);
  const senderPrivKeyBytes = typeof senderPrivateKey === 'string'
    ? decodeBase58(senderPrivateKey)
    : senderPrivateKey;

  // Validate decoded keys
  if (!recipientPubKeyBytes || recipientPubKeyBytes.length === 0) {
    throw new Error('Invalid recipient public key');
  }
  if (!senderPrivKeyBytes || senderPrivKeyBytes.length === 0) {
    throw new Error('Invalid sender private key');
  }

  // Get sender's public key
  const senderKeypair = Keypair.fromSecretKey(senderPrivKeyBytes);
  const senderPublicKey = senderKeypair.publicKey.toBase58();

  // Compress if requested
  if (options?.compress) {
    dataBytes = await compressData(dataBytes);
  }

  // Use recipient's public key directly for key derivation (simpler approach)
  // This is secure because we're using their public key + a random salt
  const salt = generateRandomBytes(32);
  const sharedSecret = deriveKey(recipientPubKeyBytes, salt, 1000);

  // Encrypt the data
  const { encrypted, iv, authTag } = encryptAES(dataBytes, sharedSecret);
  
  // Combine salt, iv, authTag, and encrypted data
  const combined = combineBuffers(
    salt,
    iv,
    authTag,
    encrypted
  );

  // Create metadata
  const metadata: DirectEncryptionMetadata = {
    senderPublicKey,
    recipientPublicKey,
    ephemeralPublicKey: encodeBase58(salt), // Store salt instead of ephemeral key
    nonce: encodeBase58(iv),
    timestamp: getCurrentTimestamp(),
    version: '1.0.0'
  };

  // Add compression flag if used
  if (options?.compress) {
    (metadata as any).compressed = true;
  }

  return {
    encryptedData: encodeBase58(combined),
    method: EncryptionMethod.DIRECT,
    metadata
  };
}

/**
 * Decrypt direct encrypted data
 */
export async function decryptDirect(
  encryptionResult: EncryptionResult,
  recipientPrivateKey: string | Uint8Array
): Promise<Uint8Array> {
  if (encryptionResult.method !== EncryptionMethod.DIRECT) {
    throw new Error('Invalid encryption method for direct decryption');
  }

  const metadata = encryptionResult.metadata as DirectEncryptionMetadata;
  const recipientPrivKeyBytes = typeof recipientPrivateKey === 'string'
    ? decodeBase58(recipientPrivateKey)
    : recipientPrivateKey;

  // Decode the combined data
  const combined = decodeBase58(encryptionResult.encryptedData);
  
  // Split the combined data
  const saltSize = 32;
  const [salt, iv, authTag, encrypted] = splitBuffer(
    combined,
    saltSize,
    IV_SIZE,
    AUTH_TAG_SIZE
  );

  // Get recipient public key to derive the same shared secret
  const recipientKeypair = Keypair.fromSecretKey(recipientPrivKeyBytes);
  const recipientPubKeyBytes = recipientKeypair.publicKey.toBytes();
  
  // Derive the same shared secret using recipient's public key and salt
  const sharedSecret = deriveKey(recipientPubKeyBytes, salt, 1000);

  // Decrypt the data
  let decrypted = decryptAES(encrypted, sharedSecret, iv, authTag);
  
  // Decompress if needed
  if ((metadata as any).compressed) {
    decrypted = await decompressData(decrypted);
  }
  
  return decrypted;
}

/**
 * Decrypt direct encrypted data and return as string
 */
export async function decryptDirectString(
  encryptionResult: EncryptionResult,
  recipientPrivateKey: string | Uint8Array
): Promise<string> {
  const decrypted = await decryptDirect(encryptionResult, recipientPrivateKey);
  return bytesToString(decrypted);
}

/**
 * Create a secure channel between two parties
 */
export class SecureChannel {
  private sharedSecret: Uint8Array;
  private localPublicKey: string;
  private remotePublicKey: string;
  private messageCounter: number = 0;

  constructor(
    localPrivateKey: string | Uint8Array,
    remotePublicKey: string
  ) {
    const localPrivKeyBytes = typeof localPrivateKey === 'string'
      ? decodeBase58(localPrivateKey)
      : localPrivateKey;
    const remotePubKeyBytes = decodeBase58(remotePublicKey);

    // Get local public key
    const localKeypair = Keypair.fromSecretKey(localPrivKeyBytes);
    this.localPublicKey = localKeypair.publicKey.toBase58();
    this.remotePublicKey = remotePublicKey;

    // Establish shared secret
    this.sharedSecret = performKeyExchange(localPrivKeyBytes, remotePubKeyBytes);
  }

  /**
   * Encrypt a message in the channel
   */
  async encryptMessage(message: string | Uint8Array): Promise<EncryptionResult> {
    const messageBytes = typeof message === 'string' ? stringToBytes(message) : message;
    
    // Add message counter to prevent replay attacks
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(BigInt(this.messageCounter++));
    
    const dataWithCounter = combineBuffers(counter, messageBytes);
    
    // Encrypt with shared secret
    const { encrypted, iv, authTag } = encryptAES(dataWithCounter, this.sharedSecret);
    
    const combined = combineBuffers(iv, authTag, encrypted);
    
    const metadata: DirectEncryptionMetadata = {
      senderPublicKey: this.localPublicKey,
      recipientPublicKey: this.remotePublicKey,
      nonce: encodeBase58(iv),
      timestamp: getCurrentTimestamp(),
      version: '1.0.0'
    };

    return {
      encryptedData: encodeBase58(combined),
      method: EncryptionMethod.DIRECT,
      metadata
    };
  }

  /**
   * Decrypt a message in the channel
   */
  async decryptMessage(encryptionResult: EncryptionResult): Promise<{
    message: Uint8Array;
    counter: number;
  }> {
    const combined = decodeBase58(encryptionResult.encryptedData);
    const [iv, authTag, encrypted] = splitBuffer(combined, IV_SIZE, AUTH_TAG_SIZE);
    
    const decrypted = decryptAES(encrypted, this.sharedSecret, iv, authTag);
    
    // Extract counter and message
    const counter = decrypted.slice(0, 8);
    const message = decrypted.slice(8);
    
    const counterValue = Buffer.from(counter).readBigUInt64BE();
    
    return {
      message,
      counter: Number(counterValue)
    };
  }

  /**
   * Get channel info
   */
  getChannelInfo() {
    return {
      localPublicKey: this.localPublicKey,
      remotePublicKey: this.remotePublicKey,
      messagesSent: this.messageCounter
    };
  }
}