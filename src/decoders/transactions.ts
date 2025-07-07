// Decoders for transaction instructions using internal utils
import { decodeInstruction, decodeInstructions } from '../utils/decodeInstructions.js';
import type { IInstruction } from '@solana/instructions';
import type { RawInstruction } from './registry.js';

/**
 * Convert IInstruction to RawInstruction format
 */
function convertToRawInstruction(ix: IInstruction): RawInstruction {
  return {
    programId: ix.programAddress,
    data: ix.data ? new Uint8Array(ix.data) : new Uint8Array(0),
    accounts: ix.accounts?.map(acc => 'address' in acc ? acc.address : String(acc)) ?? []
  };
}

/**
 * Decode a single IInstruction using all available decoders
 */
export function decodeTransactionInstruction(ix: IInstruction): any {
  const rawInstruction = convertToRawInstruction(ix);
  return decodeInstruction(rawInstruction);
}

/**
 * Decode an array of IInstructions
 */
export function decodeTransactionInstructions(instructions: IInstruction[]): any[] {
  const rawInstructions = instructions.map(convertToRawInstruction);
  return decodeInstructions(rawInstructions);
}
