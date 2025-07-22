/**
 * Data processing utilities for the GorbchainSDK
 *
 * This module contains utility functions for processing various data formats
 * commonly used in blockchain applications.
 */

/**
 * Convert bytes to base58 address (Solana format)
 */
export function bytesToBase58(bytes: Uint8Array): string {
  try {
    const alphabet =
      "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

    // Handle empty input
    if (bytes.length === 0) return "";

    // Convert to big integer for base58 encoding
    let num = BigInt(0);
    for (let i = 0; i < bytes.length; i++) {
      num = num * BigInt(256) + BigInt(bytes[i]);
    }

    // Convert to base58
    let result = "";
    while (num > BigInt(0)) {
      const remainder = num % BigInt(58);
      result = alphabet[Number(remainder)] + result;
      num = num / BigInt(58);
    }

    // Add leading zeros
    for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
      result = `1${result}`;
    }

    return result;
  } catch (_error) {
    // console.warn('Failed to convert bytes to base58:', _error);
    return "invalid-address";
  }
}

/**
 * Helper function to convert base64 string to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  try {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch {
    return new Uint8Array(0);
  }
}

/**
 * Convert various data formats to Uint8Array
 */
export function normalizeDataToUint8Array(data: any): Uint8Array {
  if (typeof data === "string") {
    // Browser-compatible base64 decoding
    return base64ToUint8Array(data);
  } else if (Array.isArray(data)) {
    return new Uint8Array(data);
  } else if (data[0] && Array.isArray(data[0])) {
    // Handle [data, encoding] format - data[0] is the array, data[1] is encoding
    return new Uint8Array(data[0]);
  } else if (data instanceof Uint8Array) {
    return data;
  } else {
    return new Uint8Array(0);
  }
}

/**
 * Read a 64-bit little-endian unsigned integer from buffer
 */
export function readU64LE(
  buffer: Uint8Array | number[],
  offset: number,
): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (offset + 8 > bytes.length) {
    throw new Error("Buffer too small for u64");
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 8);
  const value = view.getBigUint64(0, true); // little endian
  return value.toString();
}

/**
 * Format lamports as SOL with appropriate decimal places
 */
export function formatLamportsToSol(
  lamports: bigint | number | string,
): string {
  const lamportsNum =
    typeof lamports === "string" ? BigInt(lamports) : BigInt(lamports);
  const sol = Number(lamportsNum) / 1e9;
  return sol.toFixed(9).replace(/\.?0+$/, ""); // Remove trailing zeros
}

/**
 * Format bytes as human-readable size
 */
export function formatBytes(bytes: bigint | number): string {
  const bytesNum = typeof bytes === "bigint" ? Number(bytes) : bytes;
  if (bytesNum === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytesNum) / Math.log(k));

  return `${parseFloat((bytesNum / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
