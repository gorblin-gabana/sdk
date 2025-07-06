// Utility functions for decoding Solana instructions
import { createDefaultDecoderRegistry } from '../decoders/defaultRegistry.js';

// Create a default registry for utility functions
const defaultRegistry = createDefaultDecoderRegistry();

/**
 * Try to decode an instruction using the default decoder registry
 */
export function decodeInstruction(instruction: any): any {
  return defaultRegistry.decode(instruction);
}

/**
 * Decode an array of instructions
 */
export function decodeInstructions(instructions: any[]): any[] {
  return instructions.map(instruction => defaultRegistry.decode(instruction));
}
