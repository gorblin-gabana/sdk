// Browser-compatible SDK exports (excludes minting functions to avoid Buffer dependencies)
export { GorbchainSDK } from './sdk/GorbchainSDK.js';
export type { GorbchainSDKConfig } from './sdk/types.js';
export type { RichTransaction, TransactionDecodingOptions, RichInstruction } from './sdk/types.js';

// RPC client exports
export { RpcClient } from './rpc/client.js';
export { fetchTransactionBySignature } from './rpc/fetchTransactionBySignature.js';

// Decoder exports
export { DecoderRegistry, type DecodedInstruction, type DecoderFunction } from './decoders/registry.js';
export { createDefaultDecoderRegistry } from './decoders/defaultRegistry.js';

// All available decoders for browser testing
export { decodeSystemInstruction } from './decoders/system.js';
export { decodeSPLTokenInstruction } from './decoders/splToken.js';
export { decodeToken2022Instruction } from './decoders/token2022.js';
export { decodeATAInstruction } from './decoders/ata.js';
export { decodeNFTInstruction } from './decoders/nft.js';

// Name Service individual decoders
export { decodeRegisterName, decodeUpdateName, decodeTransferName } from './decoders/nameService.js';

// Swap individual decoders
export { decodeSwap, decodeAddLiquidity, decodeRemoveLiquidity, decodeInitializePool } from './decoders/swap.js';

// Transaction utilities
export { getAndDecodeTransaction } from './transactions/getAndDecodeTransaction.js';

// Utility exports (browser-compatible versions)
export { base64ToHex } from './utils/base64ToHex.js';
export { decodeInstructions } from './utils/decodeInstructions.js';
export { fetchProgramAccount } from './utils/fetchProgramAccount.js';

// Error types
export * from './errors/index.js';

// NOTE: Minting functions are excluded as they require Node.js Buffer and heavy Metaplex dependencies
// For minting functionality, use the full SDK in Node.js environments
// NOTE: getNetworkHealth is a method of GorbchainSDK class, not a standalone export
