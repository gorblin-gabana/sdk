// Mock zlib module for browser compatibility

export function deflate(data: any, callback: (err: any, result: any) => void) {
  // Mock compression - just return the original data
  setTimeout(() => callback(null, data), 0);
}

export function inflate(data: any, callback: (err: any, result: any) => void) {
  // Mock decompression - just return the original data
  setTimeout(() => callback(null, data), 0);
}

const zlib = { deflate, inflate };
export default zlib;