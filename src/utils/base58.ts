// Minimal browser-safe base58 encode/decode utilities

export function base58ToBytes(b58: string): Uint8Array {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const BASE = 58;
  const bytes = [0];
  for (let i = 0; i < b58.length; i++) {
    const c = b58[i];
    const val = ALPHABET.indexOf(c);
    if (val < 0) throw new Error("Invalid base58 char");
    let carry = val;
    for (let j = 0; j < bytes.length; ++j) {
      carry += bytes[j] * BASE;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (let k = 0; k < b58.length && b58[k] === "1"; ++k) bytes.push(0);
  return new Uint8Array(bytes.reverse());
}

export function bytesToBase58(bytes: Uint8Array): string {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const digits = [0];
  for (let i = 0; i < bytes.length; ++i) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; ++j) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let result = "";
  for (let k = 0; k < bytes.length && bytes[k] === 0; ++k) result += "1";
  for (let q = digits.length - 1; q >= 0; --q) result += ALPHABET[digits[q]];
  return result;
}

export function decodeWithEncoding(data: string): {
  bytes: Uint8Array | null;
  encoding: string;
} {
  try {
    const bytes = base58ToBytes(data);
    return { bytes, encoding: "base58" };
  } catch (_e) {
    try {
      const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
      return { bytes, encoding: "base64" };
    } catch (_e2) {
      return { bytes: null, encoding: "unknown" };
    }
  }
}
