// Token-2022 decoders and builders

type TransactionInstruction = any;
type PublicKey = any;

// --- Decoders ---
export function decodeToken2022Mint(ix: TransactionInstruction, programId?: PublicKey) {
  // TODO: Implement Token-2022 mint instruction decoding
  return { type: 'token2022Mint', data: {} };
}

export function decodeToken2022Transfer(ix: TransactionInstruction, programId?: PublicKey) {
  // TODO: Implement Token-2022 transfer instruction decoding
  return { type: 'token2022Transfer', data: {} };
}

export function decodeToken2022Extension(ix: TransactionInstruction, programId?: PublicKey) {
  // TODO: Implement Token-2022 extension decoding (e.g., transfer fees)
  return { type: 'token2022Extension', data: {} };
}

// --- Builders ---
export function buildToken2022Mint(args: any): TransactionInstruction {
  // TODO: Implement Token-2022 mint instruction builder
  return {} as TransactionInstruction;
}

export function buildToken2022Transfer(args: any): TransactionInstruction {
  // TODO: Implement Token-2022 transfer instruction builder
  return {} as TransactionInstruction;
}

export function buildToken2022Extension(args: any): TransactionInstruction {
  // TODO: Implement Token-2022 extension builder
  return {} as TransactionInstruction;
}

import { decodeMintAccount, DecodedMintAccount, TLVExtension, TokenMetadataExtension } from './decodeMintAccount.js';

export { decodeMintAccount, DecodedMintAccount, TLVExtension, TokenMetadataExtension };
