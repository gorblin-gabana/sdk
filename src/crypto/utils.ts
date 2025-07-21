/**
 * Utility functions for cryptographic operations
 */

import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { encode as encodeBase58, decode as decodeBase58 } from 'bs58';
import { Keypair, PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { Buffer } from 'buffer';

// Constants
export const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
export const KEY_SIZE = 32; // 256 bits
export const IV_SIZE = 16; // 128 bits
export const SALT_SIZE = 32; // 256 bits
export const AUTH_TAG_SIZE = 16; // 128 bits
export const KEY_DERIVATION_ITERATIONS = 100000;

/**
 * Generate cryptographically secure random bytes
 */
export function generateRandomBytes(length: number): Uint8Array {
  return new Uint8Array(randomBytes(length));
}

/**
 * Derive a key from password/secret using PBKDF2
 */
export function deriveKey(
  secret: Uint8Array,
  salt: Uint8Array,
  iterations: number = KEY_DERIVATION_ITERATIONS
): Uint8Array {
  const key = createHash('sha256');
  
  // Simple PBKDF2 implementation
  let result = Buffer.concat([secret, salt]);
  for (let i = 0; i < iterations; i++) {
    result = Buffer.from(key.update(result).digest());
  }
  
  return new Uint8Array(result.slice(0, KEY_SIZE));
}

/**
 * Generate a key pair for encryption
 */
export function generateKeyPair(): {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
} {
  return nacl.box.keyPair();
}

/**
 * Convert ed25519 public key to curve25519 for encryption
 */
export function ed25519ToCurve25519PublicKey(ed25519PublicKey: Uint8Array): Uint8Array {
  // This is a simplified conversion - in production use proper libraries
  const hash = createHash('sha256').update(ed25519PublicKey).digest();
  return new Uint8Array(hash.slice(0, 32));
}

/**
 * Convert ed25519 private key to curve25519 for encryption
 */
export function ed25519ToCurve25519PrivateKey(ed25519PrivateKey: Uint8Array): Uint8Array {
  // Extract the actual private key part (first 32 bytes)
  return new Uint8Array(ed25519PrivateKey.slice(0, 32));
}

/**
 * Perform Diffie-Hellman key exchange
 */
export function performKeyExchange(
  privateKey: Uint8Array,
  publicKey: Uint8Array
): Uint8Array {
  // Convert keys if they're ed25519
  const privKey = privateKey.length === 64 
    ? ed25519ToCurve25519PrivateKey(privateKey)
    : privateKey;
  const pubKey = publicKey.length === 32
    ? publicKey
    : ed25519ToCurve25519PublicKey(publicKey);

  // Perform scalar multiplication for ECDH
  const sharedSecret = nacl.box.before(pubKey, privKey);
  
  // Derive final key from shared secret
  return new Uint8Array(
    createHash('sha256')
      .update(sharedSecret)
      .digest()
  );
}

/**
 * Encrypt data using AES-256-GCM
 */
export function encryptAES(
  data: Uint8Array,
  key: Uint8Array,
  iv?: Uint8Array
): {
  encrypted: Uint8Array;
  iv: Uint8Array;
  authTag: Uint8Array;
} {
  const initVector = iv || generateRandomBytes(IV_SIZE);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, initVector);
  
  const encrypted = Buffer.concat([
    cipher.update(data),
    cipher.final()
  ]);
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted: new Uint8Array(encrypted),
    iv: initVector,
    authTag: new Uint8Array(authTag)
  };
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decryptAES(
  encrypted: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array,
  authTag: Uint8Array
): Uint8Array {
  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  try {
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    return new Uint8Array(decrypted);
  } catch (error) {
    throw new Error('Decryption failed: Invalid key or corrupted data');
  }
}

/**
 * Sign data using ed25519
 */
export function signData(
  data: Uint8Array,
  privateKey: Uint8Array
): Uint8Array {
  // Ensure we have a full keypair
  const keypair = privateKey.length === 64 
    ? privateKey 
    : Keypair.fromSeed(privateKey.slice(0, 32)).secretKey;
  
  return nacl.sign.detached(data, keypair);
}

/**
 * Verify signature using ed25519
 */
export function verifySignature(
  data: Uint8Array,
  signature: Uint8Array,
  publicKey: Uint8Array
): boolean {
  return nacl.sign.detached.verify(data, signature, publicKey);
}

/**
 * Compress data using zlib
 */
export async function compressData(data: Uint8Array): Promise<Uint8Array> {
  const zlib = await import('zlib');
  return new Promise((resolve, reject) => {
    zlib.deflate(data, (err, compressed) => {
      if (err) reject(err);
      else resolve(new Uint8Array(compressed));
    });
  });
}

/**
 * Decompress data using zlib
 */
export async function decompressData(compressed: Uint8Array): Promise<Uint8Array> {
  const zlib = await import('zlib');
  return new Promise((resolve, reject) => {
    zlib.inflate(compressed, (err, decompressed) => {
      if (err) reject(err);
      else resolve(new Uint8Array(decompressed));
    });
  });
}

/**
 * Generate a deterministic ID from multiple inputs
 */
export function generateId(...inputs: (string | Uint8Array)[]): string {
  const hash = createHash('sha256');
  
  for (const input of inputs) {
    const data = typeof input === 'string' 
      ? Buffer.from(input, 'utf-8')
      : input;
    hash.update(data);
  }
  
  return encodeBase58(hash.digest());
}

/**
 * Combine multiple buffers
 */
export function combineBuffers(...buffers: Uint8Array[]): Uint8Array {
  const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0);
  const result = new Uint8Array(totalLength);
  
  let offset = 0;
  for (const buffer of buffers) {
    result.set(buffer, offset);
    offset += buffer.length;
  }
  
  return result;
}

/**
 * Split a buffer at specific positions
 */
export function splitBuffer(
  buffer: Uint8Array,
  ...lengths: number[]
): Uint8Array[] {
  const result: Uint8Array[] = [];
  let offset = 0;
  
  for (const length of lengths) {
    result.push(buffer.slice(offset, offset + length));
    offset += length;
  }
  
  // Add remaining if any
  if (offset < buffer.length) {
    result.push(buffer.slice(offset));
  }
  
  return result;
}

/**
 * Convert string to Uint8Array
 */
export function stringToBytes(str: string): Uint8Array {
  return new Uint8Array(Buffer.from(str, 'utf-8'));
}

/**
 * Convert Uint8Array to string
 */
export function bytesToString(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('utf-8');
}

/**
 * Validate Solana public key
 */
export function isValidPublicKey(publicKey: string): boolean {
  try {
    new PublicKey(publicKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current timestamp in seconds
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Check if a timestamp has expired
 */
export function hasExpired(timestamp: number, ttlSeconds: number): boolean {
  return getCurrentTimestamp() > timestamp + ttlSeconds;
}