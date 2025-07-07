// Utility functions for decoding Solana instructions
import { createDefaultDecoderRegistry } from '../decoders/defaultRegistry.js';
import type { RawInstruction, DecodedInstruction } from '../decoders/registry.js';

// Create a default registry for utility functions
const defaultRegistry = createDefaultDecoderRegistry();

/**
 * Try to decode an instruction using the default decoder registry
 */
export function decodeInstruction(instruction: RawInstruction): DecodedInstruction {
  return defaultRegistry.decode(instruction);
}

/**
 * Decode an array of instructions
 */
export function decodeInstructions(instructions: RawInstruction[]): DecodedInstruction[] {
  return instructions.map(instruction => defaultRegistry.decode(instruction));
}
