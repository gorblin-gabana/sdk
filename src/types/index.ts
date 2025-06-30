// Shared types for ChainDecode SDK

export type TransactionInstruction = any;
export type PublicKey = any;

export type DecoderFn = (
  ix: TransactionInstruction,
  programId?: PublicKey
) => DecodedResult;

export interface DecodedResult {
  type: string;
  data: any;
}

export interface RegistryOptions {
  programId?: PublicKey;
  idl?: any;
  types?: any[];
  decode?: boolean;
  encode?: boolean;
}

// For IDL/Beet support
export type AnchorIdl = any;
export type BeetSchema = any;

export * from './plugins';
