// DecoderRegistry: Manages decoder functions for Solana instructions
import type { TransactionInstruction, PublicKey } from '@solana/kit';
import type { DecoderFn } from '../types';

export class DecoderRegistry {
  private decoders = new Map<string, DecoderFn>();

  register(name: string, fn: DecoderFn) {
    this.decoders.set(name, fn);
  }

  decode(name: string, ix: TransactionInstruction, programId?: PublicKey) {
    const fn = this.decoders.get(name);
    if (!fn) throw new Error(`No decoder for ${name}`);
    return fn(ix, programId);
  }
}
