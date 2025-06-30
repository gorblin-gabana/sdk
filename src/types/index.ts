// Shared types for ChainDecode SDK
// Use any as a placeholder for TransactionInstruction and PublicKey
type TransactionInstruction = any;
type PublicKey = any;

export type DecoderFn = (
  ix: TransactionInstruction,
  programId?: PublicKey
) => any;

export interface DecodedResult {
  type: string;
  data: any;
}
