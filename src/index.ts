// ============================================
// GorbchainSDK - Specialized Solana Operations
// ============================================
//
// Focus: Rich wallet connections, enhanced transaction analysis,
// advanced token operations, and portfolio management.
// For basic Solana RPC operations, use @solana/web3.js directly.

// ============================================
// Core SDK
// ============================================
/**
 * Main SDK class with enhanced Solana operations
 * Specializes in rich transactions, wallet integration, and portfolio analysis
 */
export { GorbchainSDK } from "./sdk/GorbchainSDK.js";
export { getDefaultConfig, validateConfig } from "./sdk/config.js";

// ============================================
// Rich Functions - Our Core Specializations
// ============================================

/**
 * Rich Token Operations
 *
 * Enhanced token functions with comprehensive metadata, market data,
 * and portfolio analysis for building applications quickly.
 */
export {
  getRichTokenAccountsByOwner,
  type RichTokenAccount,
  type RichTokenAccountsResponse,
} from "./rich/tokenOperations.js";

/**
 * Rich Transaction Operations
 *
 * Enhanced transaction analysis with decoded instructions, token metadata,
 * and human-readable summaries with complete context.
 */
export {
  getRichTransaction,
  type RichTransaction,
  type RichInstruction,
} from "./rich/transactionOperations.js";

/**
 * Universal Wallet Integration
 *
 * Comprehensive wallet integration supporting all Solana providers,
 * deep links, hardware wallets, and automatic portfolio analysis.
 */
export {
  UniversalWalletManager,
  type RichWallet,
  type WalletDiscovery,
  type WalletProvider,
  type WalletType,
  type WalletStatus,
} from "./rich/walletIntegration.js";

// ============================================
// Advanced Token & Portfolio Operations
// ============================================
/**
 * Advanced token holdings and portfolio analysis
 */
export { AdvancedTokenHoldings } from "./tokens/advancedHoldings.js";
export type {
  TokenPortfolio,
  PortfolioSummary,
  PortfolioAnalysis,
  TokenMetadata as AdvancedTokenMetadata,
} from "./tokens/advancedHoldings.js";

/**
 * Simple Token Balance Operations (Recommended)
 * 
 * Direct RPC approach using getTokenAccountsByOwner with jsonParsed encoding.
 * This is the simplest and most reliable way to get token balances.
 */
export {
  getSimpleTokenBalances,
  getAllTokenBalances,
  getTokenBalanceForMint,
  hasTokens,
  TOKEN_PROGRAMS,
  type SimpleTokenAccount,
  type TokenBalanceResponse,
} from "./tokens/simpleTokenBalance.js";

// ============================================
// Enhanced RPC & Network Configuration
// ============================================
/**
 * Direct RPC access for advanced users
 * Use these when you need direct Solana RPC functionality
 */
export { RpcClient } from "./rpc/client.js";
export { EnhancedRpcClient } from "./rpc/enhancedClient.js";

/**
 * Network configuration and detection
 */
export {
  type NetworkConfig,
  NETWORK_CONFIGS,
  getNetworkConfig,
  detectNetworkFromEndpoint,
  createCustomNetworkConfig,
} from "./config/networks.js";

// ============================================
// Custom Decoders & Enhanced Transaction Decoding
// ============================================
/**
 * Custom instruction decoders for specialized programs
 */
export { DecoderRegistry } from "./decoders/registry.js";
export { createDefaultDecoderRegistry } from "./decoders/defaultRegistry.js";
export { getAndDecodeTransaction } from "./transactions/getAndDecodeTransaction.js";

// Specialized decoders for major programs
export { decodeInstructions } from "./utils/decodeInstructions.js";
export {
  SystemInstructionType,
  decodeSystemInstruction,
} from "./decoders/system.js";
export {
  decodeSPLTokenInstructionWithDetails,
  decodeInstructionData,
} from "./decoders/splToken.js";

export {
  Token2022Instruction,
  decodeToken2022Instruction,
  decodeToken2022InstructionWithDetails,
} from "./decoders/token2022.js";

export { ATAInstruction, decodeATAInstruction } from "./decoders/ata.js";

export {
  MetaplexInstruction,
  decodeNFTInstruction,
  decodeNFTInstructionWithDetails,
  isNFTToken,
  isStandardNFT,
} from "./decoders/nft.js";

// ============================================
// Essential Types
// ============================================

// Core SDK Types
export type {
  GorbchainSDKConfig,
  TransactionDecodingOptions,
  TokenTransferInfo,
  TokenOperationInfo,
} from "./sdk/types.js";

// RPC Types
export type { RpcClientOptions } from "./rpc/client.js";
export type { AccountInfo, RpcResponse } from "./rpc/accounts.js";
export type {
  ProgramAccountFilter,
  ProgramAccount,
  ParsedTokenAccount,
  TokenHolding,
  TokenConfig,
} from "./rpc/enhancedClient.js";

// Decoder Types
export type {
  DecodedInstruction,
  DecoderFunction,
} from "./decoders/registry.js";
export type { NFTMetadata, NFTTokenInfo } from "./decoders/nft.js";

// ============================================
// Token Creation & Minting
// ============================================
/**
 * Simplified token and NFT creation functions
 */
export {
  createToken22TwoTx,
  createToken22SingleTx,
  createNFT,
  TOKEN22_PROGRAM,
  ASSOCIATED_TOKEN_PROGRAM,
  CUSTOM_MPL_CORE_PROGRAM,
} from "./sdk/minting.js";

export type {
  TokenCreationParams,
  NFTCreationParams,
  TokenMintResult,
  NFTMintResult,
} from "./sdk/minting.js";

// ============================================
// Utilities & Helpers
// ============================================
/**
 * Essential utilities for transaction and data processing
 */
export {
  getGorbchainConfig,
  setGorbchainConfig,
  type GorbchainConfig,
  PROGRAM_IDS,
} from "./utils/gorbchainConfig.js";

export {
  base58ToBytes,
  bytesToBase58,
  decodeWithEncoding,
} from "./utils/base58.js";

export {
  base64ToUint8Array,
  normalizeDataToUint8Array,
  formatLamportsToSol,
} from "./utils/dataProcessing.js";

export { base64ToHex } from "./utils/base64ToHex.js";
export { decodeNFT } from "./utils/decodeNFT.js";
export { decodeMintAccount } from "./utils/decodeMintAccount.js";
export { fetchProgramAccount } from "./utils/fetchProgramAccount.js";

// ============================================
// Cryptographic Operations
// ============================================
/**
 * Advanced encryption and decryption functionality
 * - Personal encryption (private key based)
 * - Direct encryption (public key based)
 * - Group encryption (static and dynamic)
 * - Signature-based access control
 */
export {
  CryptoManager,
  // Types
  EncryptionMethod,
} from "./crypto/index.js";

export type {
  EncryptionResult,
  EncryptionMetadata,
  PersonalEncryptionMetadata,
  DirectEncryptionMetadata,
  GroupEncryptionMetadata,
  SignatureGroupMetadata,
  GroupMember,
  MemberRole,
  MemberPermissions,
  GroupPermissions,
  EncryptionEpoch,
  KeyShare,
  SharedEncryptionKey,
  EncryptedKeyShare,
  SharePermissions,
  KeyTransitionRequest,
  EncryptionContext,
  ScalableEncryptionConfig,
} from "./crypto/index.js";

export {
  // Personal encryption
  encryptPersonal,
  decryptPersonal,
  decryptPersonalString,
  PersonalEncryptionSession,
  // Direct encryption
  encryptDirect,
  decryptDirect,
  decryptDirectString,
  SecureChannel,
  // Group encryption
  createGroup,
  encryptGroup,
  decryptGroup,
  decryptGroupString,
  addGroupMember,
  // Signature groups
  createSignatureGroup,
  addMemberToSignatureGroup,
  removeMemberFromSignatureGroup,
  rotateGroupKeys,
  encryptForSignatureGroup,
  decryptSignatureGroupData,
  // Shared key management
  SharedKeyManager,
  // Scalable encryption
  ScalableEncryptionManager,
  createScalableEncryption,
  // Utilities
  signData,
  verifySignature,
} from "./crypto/index.js";

// ============================================
// Error Handling
// ============================================
export * from "./errors/index.js";

// ============================================
// Note for Developers
// ============================================
/**
 * For basic Solana operations like getBalance, getAccountInfo, etc.,
 * we recommend using @solana/web3.js directly for better performance
 * and fewer dependencies. This SDK focuses on enhanced operations
 * that provide significant value-add over basic RPC calls.
 *
 * Access RPC clients directly via:
 * - sdk.rpc (basic RPC client)
 * - sdk.enhancedRpc (enhanced RPC with network awareness)
 * - sdk.decoderRegistry (for custom decoder management)
 */
