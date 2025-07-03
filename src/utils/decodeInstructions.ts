// Utility functions for decoding Solana instructions
import { IInstruction } from '@solana/instructions';
import { decodeMintInstruction, decodeTransferInstruction } from '../decoders/splToken.js';

/**
 * Try to decode an IInstruction using known decoders
 * TODO: Update decoders in splToken.ts to accept IInstruction, not TransactionInstruction
 */
export function decodeInstruction(ix: IInstruction): any {
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
 * Decode an array of IInstructions
 */
export function decodeInstructions(instructions: IInstruction[]): any[] {
  return instructions.map(decodeInstruction);
}
