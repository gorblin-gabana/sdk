// Decoder Module - Central export for all decoders
export { DecoderRegistry } from "./registry.js";
export type { DecodedInstruction, DecoderFunction } from "./registry.js";
export {
  decodeSPLTokenInstruction,
  SPLTokenInstruction,
  AuthorityType,
} from "./splToken.js";

// Re-export default registry factory
export { createDefaultDecoderRegistry } from "./defaultRegistry.js";

// Re-export existing utility decoders for backward compatibility
export * from "./transactions.js";
export * from "./nft.js";
