// Mock crypto module for browser compatibility
// This provides minimal implementations of Node.js crypto functions for demo purposes

export function createHash(_algorithm: string) {
  return {
    update: (data: any) => ({
      digest: () => {
        // For demo purposes, return a mock hash
        if (typeof data === 'string') {
          return new Uint8Array(32).fill(42); // Mock hash
        }
        return new Uint8Array(32).fill(42);
      }
    })
  };
}

export function randomBytes(length: number): Buffer {
  // Use browser's crypto.getRandomValues if available
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    window.crypto.getRandomValues(bytes);
    return Buffer.from(bytes);
  }
  
  // Fallback: generate pseudo-random bytes (NOT cryptographically secure!)
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return Buffer.from(bytes);
}

export function createCipheriv(_algorithm: string, _key: any, _iv: any) {
  return {
    update: (data: any) => data,
    final: () => new Uint8Array(0),
    getAuthTag: () => new Uint8Array(16).fill(0)
  };
}

export function createDecipheriv(_algorithm: string, _key: any, _iv: any) {
  return {
    update: (data: any) => data,
    final: () => new Uint8Array(0),
    setAuthTag: () => {}
  };
}