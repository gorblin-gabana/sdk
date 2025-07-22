// Browser polyfills for Node.js modules
import { Buffer } from "buffer";

// Make Buffer available globally
if (typeof global === "undefined") {
  (globalThis as any).global = globalThis;
}

if (typeof (globalThis as any).Buffer === "undefined") {
  (globalThis as any).Buffer = Buffer;
}

// Also make it available on window for good measure
if (typeof window !== "undefined") {
  (window as any).Buffer = Buffer;
  (window as any).global = globalThis;
}

export {};
