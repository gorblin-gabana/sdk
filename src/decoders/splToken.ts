// SPL Token decoders and builders

// Placeholder types (replace with actual types from Solana SDK)
type TransactionInstruction = any;
type PublicKey = any;

// --- Decoders ---
export function decodeMintInstruction(ix: TransactionInstruction, programId?: PublicKey) {
  // TODO: Implement SPL Token mint instruction decoding
  return { type: 'mint', data: {} };
}

export function decodeTransferInstruction(ix: TransactionInstruction, programId?: PublicKey) {
  // TODO: Implement SPL Token transfer instruction decoding
  return { type: 'transfer', data: {} };
}

export function decodeBurnInstruction(ix: TransactionInstruction, programId?: PublicKey) {
  // TODO: Implement SPL Token burn instruction decoding
  return { type: 'burn', data: {} };
}

export function decodeSetAuthorityInstruction(ix: TransactionInstruction, programId?: PublicKey) {
  // TODO: Implement SPL Token setAuthority instruction decoding
  return { type: 'setAuthority', data: {} };
}

export function decodeCreateAccountInstruction(ix: TransactionInstruction, programId?: PublicKey) {
  // TODO: Implement SPL Token createAccount instruction decoding
  return { type: 'createAccount', data: {} };
}

export function decodeCloseAccountInstruction(ix: TransactionInstruction, programId?: PublicKey) {
  // TODO: Implement SPL Token closeAccount instruction decoding
  return { type: 'closeAccount', data: {} };
}

// --- Builders ---
export function buildMintToken(args: any): TransactionInstruction {
  // TODO: Implement SPL Token mint instruction builder
  return {} as TransactionInstruction;
}

export function buildTransferToken(args: any): TransactionInstruction {
  // TODO: Implement SPL Token transfer instruction builder
  return {} as TransactionInstruction;
}

export function buildBurnToken(args: any): TransactionInstruction {
  // TODO: Implement SPL Token burn instruction builder
  return {} as TransactionInstruction;
}

export function buildSetAuthority(args: any): TransactionInstruction {
  // TODO: Implement SPL Token setAuthority instruction builder
  return {} as TransactionInstruction;
}

export function buildCreateAccount(args: any): TransactionInstruction {
  // TODO: Implement SPL Token createAccount instruction builder
  return {} as TransactionInstruction;
}

export function buildCloseAccount(args: any): TransactionInstruction {
  // TODO: Implement SPL Token closeAccount instruction builder
  return {} as TransactionInstruction;
}

import { decodeMintAccount, DecodedMintAccount, TLVExtension, TokenMetadataExtension } from './decodeMintAccount.js';

export { decodeMintAccount, DecodedMintAccount, TLVExtension, TokenMetadataExtension };
