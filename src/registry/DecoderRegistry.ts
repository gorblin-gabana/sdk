// DecoderRegistry: Manages decoder functions for Solana instructions
// Use any as a placeholder for TransactionInstruction and PublicKey
// Remove import from '@solana/kit'
type TransactionInstruction = any;
type PublicKey = any;

export class DecoderRegistry {
  private decoders = new Map<string, (ix: TransactionInstruction, programId?: PublicKey) => any>();

  register(name: string, fn: (ix: TransactionInstruction, programId?: PublicKey) => any) {
    this.decoders.set(name, fn);
  }

  decode(name: string, ix: TransactionInstruction, programId?: PublicKey) {
    const fn = this.decoders.get(name);
    if (!fn) throw new Error(`No decoder for ${name}`);
    return fn(ix, programId);
  }
}
