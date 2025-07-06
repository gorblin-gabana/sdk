// Core SDK exports
export { GorbchainSDK } from './sdk/GorbchainSDK.js';
export type { GorbchainSDKConfig } from './sdk/types.js';
export type { RichTransaction, TransactionDecodingOptions, RichInstruction } from './sdk/types.js';

// RPC client exports
export { RpcClient } from './rpc/client.js';
export { fetchTransactionBySignature } from './rpc/fetchTransactionBySignature.js';

// Decoder exports
export { DecoderRegistry, type DecodedInstruction, type DecoderFunction } from './decoders/registry.js';
export { decodeInstructions } from './utils/decodeInstructions.js';

// Transaction utilities
export { getAndDecodeTransaction } from './transactions/getAndDecodeTransaction.js';

// Minting functions - Token and NFT creation
export {
  createToken22TwoTx,
  createToken22SingleTx,
  createNFT,
  checkSufficientBalance,
  estimateTokenCreationCost,
  estimateNFTCreationCost,
  getTokenInfo,
  TOKEN22_PROGRAM,
  ASSOCIATED_TOKEN_PROGRAM,
  CUSTOM_MPL_CORE_PROGRAM,
  calculateMetadataSpace,
  calculateMintAccountSize,
  validateTokenParameters,
  validateNFTParameters,
  sendTransactionWithRetry,
} from './sdk/minting.js';

// Minting types
export type {
  TokenCreationParams,
  NFTCreationParams,
  TokenMintResult,
  NFTMintResult,
  TransactionOptions,
} from './sdk/minting.js';

// Utility exports
export { base58ToBytes, bytesToBase58 } from './utils/base58.js';
export { base64ToHex } from './utils/base64ToHex.js';
export { getGorbchainConfig } from './utils/gorbchainConfig.js';
