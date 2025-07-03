// Utility functions for decoding Solana instructions
import { TransactionInstruction } from '@solana/web3.js';
import { decodeMintInstruction, decodeTransferInstruction } from '../decoders/splToken.js';

/**
 * Try to decode a TransactionInstruction using known decoders
 */
export function decodeInstruction(ix: TransactionInstruction): any {
  try {
    return decodeMintInstruction(ix);
  } catch {}
  try {
    return decodeTransferInstruction(ix);
  } catch {}
  // Add more decoders as needed
  return { raw: ix };
}

/**
 * Decode an array of TransactionInstructions
 */
export function decodeInstructions(instructions: TransactionInstruction[]): any[] {
  return instructions.map(decodeInstruction);
}
