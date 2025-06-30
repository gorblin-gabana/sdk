// Shared types for ChainDecode SDK
import type { TransactionInstruction, PublicKey } from '@solana/kit';

export type DecoderFn = (
  ix: TransactionInstruction,
  programId?: PublicKey
) => any;

export interface DecodedResult {
  type: string;
  data: any;
}
