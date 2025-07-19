// ============================================
// Core SDK Exports
// ============================================
export { GorbchainSDK } from './sdk/GorbchainSDK.js';
export { getDefaultConfig, validateConfig } from './sdk/config.js';

// ============================================
// Types & Interfaces
// ============================================

// Core SDK Types
export type { 
  GorbchainSDKConfig,
  TransactionDecodingOptions, 
  SimpleInstruction,
  TokenTransferInfo,
  SolTransfer,
  TokenOperationInfo,
  TokenOperation,
  TokenTransfer,
  TokenMint,
  TokenBurn,
  TokenAccount,
  AccountDetail,
  TokenAccountInfo,
  SystemAccountInfo,
  ProgramAccountInfo as SDKProgramAccountInfo,
  BalanceChange,
  TransactionCategory
} from './sdk/types.js';

// Minting Types
export type {
  TokenCreationParams,
  NFTCreationParams,
  TokenMintResult,
  NFTMintResult,
  TransactionOptions
} from './sdk/minting.js';

// RPC Types
export type { RpcClientOptions } from './rpc/client.js';
export type { AccountInfo, RpcResponse } from './rpc/accounts.js';
export type { TransactionSignature, TransactionDetails } from './rpc/transactions.js';
export type {
  ProgramAccountFilter,
  ProgramAccount,
  ParsedTokenAccount,
  ParsedMintAccount,
  TokenHolding,
  TokenConfig
} from './rpc/enhancedClient.js';

// Decoder Types
export type { DecodedInstruction, DecoderFunction } from './decoders/registry.js';
export type { DecodedSystemInstruction } from './decoders/system.js';
export type { NFTMetadata, NFTTokenInfo } from './decoders/nft.js';

// Token Types
export type {
  TokenPortfolio,
  PortfolioSummary,
  PortfolioAnalysis,
  TokenMetadata as AdvancedTokenMetadata
} from './tokens/advancedHoldings.js';

// Utility Types
export type { DecodedNFTMetadata } from './utils/decodeNFT.js';
export type { DecodedMintAccount } from './utils/decodeMintAccount.js';
export type { ProgramAccountInfo } from './utils/fetchProgramAccount.js';
export type { AccountChange } from './utils/transactionHelpers.js';

// ============================================
// Network Configuration
// ============================================
export {
  type TokenPrograms,
  type NetworkFeatures,
  type NetworkConfig,
  NETWORK_CONFIGS,
  getNetworkConfig,
  detectNetworkFromEndpoint,
  createCustomNetworkConfig,
  validateNetworkConfig,
  getAvailableNetworks,
  networkSupportsFeature,
  networkSupportsMethod
} from './config/networks.js';

// ============================================
// RPC Clients
// ============================================
export { RpcClient } from './rpc/client.js';
export { EnhancedRpcClient } from './rpc/enhancedClient.js';
export { fetchTransactionBySignature } from './rpc/fetchTransactionBySignature.js';

// ============================================
// Decoders
// ============================================
export { DecoderRegistry } from './decoders/registry.js';
export { createDefaultDecoderRegistry } from './decoders/defaultRegistry.js';
export { decodeInstructions } from './utils/decodeInstructions.js';

// System Decoder
export {
  SystemInstructionType,
  decodeSystemInstruction,
  lamportsToSol,
  formatBytes
} from './decoders/system.js';

// Token Decoders
export {
  decodeSPLTokenInstructionWithDetails,
  decodeInstructionData
} from './decoders/splToken.js';

export {
  Token2022Instruction,
  decodeToken2022Instruction,
  decodeToken2022InstructionWithDetails
} from './decoders/token2022.js';

export {
  ATAInstruction,
  decodeATAInstruction
} from './decoders/ata.js';

// NFT Decoder
export {
  MetaplexInstruction,
  decodeNFTInstruction,
  decodeNFTInstructionWithDetails,
  isNFTToken,
  isStandardNFT
} from './decoders/nft.js';

// Name Service Decoder
export {
  decodeRegisterName,
  decodeUpdateName,
  decodeTransferName,
  buildRegisterName,
  buildUpdateName,
  buildTransferName
} from './decoders/nameService.js';

// Swap Decoder
export {
  decodeSwap,
  decodeAddLiquidity,
  decodeRemoveLiquidity,
  decodeInitializePool,
  buildSwap,
  buildAddLiquidity,
  buildRemoveLiquidity,
  buildInitializePool
} from './decoders/swap.js';

// Transaction Decoders
export {
  decodeTransactionInstruction,
  decodeTransactionInstructions
} from './decoders/transactions.js';

// ============================================
// Token Operations
// ============================================
export { AdvancedTokenHoldings } from './tokens/advancedHoldings.js';

// ============================================
// Rich Functions - Enhanced Operations with Metadata
// ============================================

/**
 * Rich Token Operations
 * 
 * Enhanced token functions that provide comprehensive metadata, market data,
 * and portfolio analysis for frontend developers building applications quickly.
 */
export {
  getRichTokenAccountsByOwner,
  type RichTokenAccount,
  type RichTokenAccountsResponse
} from './rich/tokenOperations.js';

/**
 * Rich Transaction Operations
 * 
 * Enhanced transaction functions that decode instructions, resolve token metadata,
 * and provide human-readable transaction summaries with complete context.
 */
export {
  getRichTransaction,
  type RichTransaction,
  type RichInstruction
} from './rich/transactionOperations.js';

/**
 * Universal Wallet Integration
 * 
 * Comprehensive wallet integration supporting Solana web3 providers,
 * deep links, custom scripts, and hardware wallets with portfolio analysis.
 */
export {
  UniversalWalletManager,
  type RichWallet,
  type WalletDiscovery,
  type WalletProvider,
  type WalletType,
  type WalletStatus
} from './rich/walletIntegration.js';

// ============================================
// Transaction Utilities
// ============================================
export { getAndDecodeTransaction } from './transactions/getAndDecodeTransaction.js';
export { createTransaction, getTransactionMetadata } from './transactions/index.js';

// ============================================
// Minting Functions
// ============================================
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
  sendTransactionWithRetry
} from './sdk/minting.js';

// ============================================
// Error Handling
// ============================================
export * from './errors/index.js';

// ============================================
// Utilities
// ============================================

// Encoding Utilities
export { base58ToBytes, bytesToBase58, decodeWithEncoding } from './utils/base58.js';
export { base64ToHex } from './utils/base64ToHex.js';
export {
  base64ToUint8Array,
  normalizeDataToUint8Array,
  readU64LE,
  formatLamportsToSol
} from './utils/dataProcessing.js';

// Configuration Utilities
export { 
  getGorbchainConfig, 
  setGorbchainConfig, 
  type GorbchainConfig, 
  PROGRAM_IDS 
} from './utils/gorbchainConfig.js';

// Decoder Utilities
export { ensureFallbackDecoders } from './utils/ensureFallbackDecoders.js';
export { decodeNFT } from './utils/decodeNFT.js';
export { decodeInstruction } from './utils/decodeInstructions.js';
export { decodeMintAccount } from './utils/decodeMintAccount.js';
export { createDecoderRegistry, getProgramName } from './utils/decoderRegistrySetup.js';
export { fetchAndDecodeMintAccount } from './utils/fetchAndDecodeMintAccount.js';
export { fetchProgramAccount } from './utils/fetchProgramAccount.js';

// Transaction Helpers
export {
  getInstructionDescription,
  isTokenRelatedInstruction,
  isNftRelatedInstruction,
  classifyTransactionType,
  buildSimpleTransactionSummary,
  extractAccountChanges,
  generateTransactionName
} from './utils/transactionHelpers.js';