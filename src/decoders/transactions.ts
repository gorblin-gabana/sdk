// Decoders for transaction instructions using internal utils
import { decodeInstruction, decodeInstructions } from '../utils/decodeInstructions.js';
import type { IInstruction } from '@solana/instructions';

/**
 * Decode a single IInstruction using all available decoders
 */
export function decodeTransactionInstruction(ix: IInstruction): any {
  return decodeInstruction(ix);
}

/**
 * Decode an array of IInstructions
 */
export function decodeTransactionInstructions(instructions: IInstruction[]): any[] {
  return decodeInstructions(instructions);
}
