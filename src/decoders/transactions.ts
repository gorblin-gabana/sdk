// Decoders for transaction instructions using internal utils
import { decodeInstruction, decodeInstructions } from '../utils/decodeInstructions.js';
import { TransactionInstruction } from '@solana/web3.js';

/**
 * Decode a single TransactionInstruction using all available decoders
 */
export function decodeTransactionInstruction(ix: TransactionInstruction): any {
  return decodeInstruction(ix);
}

/**
 * Decode an array of TransactionInstructions
 */
export function decodeTransactionInstructions(instructions: TransactionInstruction[]): any[] {
  return decodeInstructions(instructions);
}
