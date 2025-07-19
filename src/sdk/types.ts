import type { NetworkConfig } from '../config/networks.js';

/**
 * Configuration interface for the GorbchainSDK
 */
export interface GorbchainSDKConfig {
  /** RPC endpoint URL for blockchain communication */
  rpcEndpoint: string;

  /** Network configuration (name or custom config) */
  network?: string | NetworkConfig;

  /** Optional timeout for RPC requests in milliseconds */
  timeout?: number;

  /** Number of retry attempts for failed requests */
  retries?: number;

  /** Program IDs for different blockchain programs */
  programIds?: {
    /** SPL Token program ID */
    splToken?: string;
    /** Token-2022 program ID */
    token2022?: string;
    /** Associated Token Account program ID */
    ata?: string;
    /** Metaplex program ID */
    metaplex?: string;
    /** Custom program IDs */
    [key: string]: string | undefined;
  };

  /** Enhanced token analysis features */
  tokenAnalysis?: {
    enabled: boolean;
    maxConcurrentRequests?: number;
    enableMetadataResolution?: boolean;
  };

  /** Rich decoding options for enhanced transaction processing */
  richDecoding?: {
    /** Enable rich instruction decoding (requires additional processing) */
    enabled?: boolean;
    /** Include token metadata fetching for token-related instructions */
    includeTokenMetadata?: boolean;
    /** Include NFT metadata fetching for NFT-related instructions */
    includeNftMetadata?: boolean;
    /** Maximum number of concurrent metadata requests */
    maxConcurrentRequests?: number;
    /** Cache decoded results to improve performance */
    enableCache?: boolean;
  };
}

/**
 * Simplified rich transaction interface focused on human readability
 */
export interface RichTransaction {
  // Basic transaction info
  signature: string;
  slot: number;
  blockTime: number;
  fee: number;
  status: 'success' | 'failed';

  // Transaction summary
  summary: {
    type: string; // e.g., "Create NFT", "Transfer Tokens", "Transfer SOL"
    description: string; // Human-readable description
    programsUsed: string[]; // e.g., ["Token-2022", "System"]
    instructionCount: number;
    computeUnits: number;
  };

  // Token information (when applicable)
  tokens?: {
    created?: TokenMetadata[];
    transferred?: TokenTransferInfo[];
    operations: TokenOperationInfo[];
  };

  // Simplified instruction list
  instructions: SimpleInstruction[];

  // Account changes
  accountChanges?: {
    solTransfers?: SolTransfer[];
    tokenTransfers?: TokenTransferInfo[];
    accountsCreated?: string[];
    accountsClosed?: string[];
  };

  // Raw data (only when requested)
  raw?: {
    meta: Record<string, unknown>;
    accountKeys: string[];
    fullInstructions: Record<string, unknown>[];
  };
}

/**
 * Simplified instruction interface
 */
export interface SimpleInstruction {
  instruction: number;
  program: string; // e.g., "Token-2022", "System", "ATA"
  action: string; // e.g., "Create NFT", "Mint Tokens", "Transfer SOL"
  description: string; // Human-readable description
  data?: {
    [key: string]: unknown; // Relevant data for this instruction
  };
}

/**
 * Token metadata information
 */
export interface TokenMetadata {
  mint: string;
  name: string;
  symbol: string;
  type: 'Token' | 'NFT';
  decimals?: number;
  supply?: string;
  uri?: string;
  description?: string;
}

/**
 * Token transfer information for simplified interface
 */
export interface TokenTransferInfo {
  mint: string;
  amount: string;
  from: string;
  to: string;
  tokenName?: string;
  tokenSymbol?: string;
  decimals?: number;
}

/**
 * SOL transfer information
 */
export interface SolTransfer {
  amount: string; // in SOL, e.g., "0.897840"
  from: string;
  to: string;
  lamports: number;
}

/**
 * Token operation information for simplified interface
 */
export interface TokenOperationInfo {
  instruction: number;
  type: string;
  action: string;
  description: string;
  program: string;
  data?: {
    [key: string]: unknown;
  };
}

// Removed old complex RichTransaction interface

/**
 * Enhanced instruction interface with rich decoding
 */
export interface RichInstruction {
  index: number;
  programId: string;
  programName: string;
  data: Record<string, unknown>;
  accounts: string[];
  decoded: {
    type: string;
    description: string;
    data: Record<string, unknown>;
    accountDetails: AccountDetail[];
    metadata?: Record<string, unknown>;
  };
}

/**
 * Token operation details
 */
export interface TokenOperation {
  index: number;
  type: 'transfer' | 'mint' | 'burn' | 'approve' | 'revoke' | 'initialize' | 'close' | 'unknown';
  subtype?: string;
  amount: number | null;
  mint: string | null;
  account: string | null;
  programId: string;
  accounts: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Token transfer details
 */
export interface TokenTransfer {
  index: number;
  mint: string;
  amount: number;
  decimals: number;
  source: string;
  destination: string;
  authority: string;
  programId: string;
  uiAmount?: number;
  uiAmountString?: string;
}

/**
 * Token mint details
 */
export interface TokenMint {
  index: number;
  mint: string;
  amount: number;
  decimals: number;
  destination: string;
  authority: string;
  programId: string;
}

/**
 * Token burn details
 */
export interface TokenBurn {
  index: number;
  mint: string;
  amount: number;
  decimals: number;
  account: string;
  authority: string;
  programId: string;
}

/**
 * Enhanced token account information
 */
export interface TokenAccount {
  address: string;
  mint: string;
  owner: string;
  amount: number;
  decimals: number;
  programId: string;
  isNative: boolean;
  uiAmount?: number;
  uiAmountString?: string;
}

/**
 * Account detail information
 */
export interface AccountDetail {
  address: string;
  type: 'token-account' | 'mint-account' | 'system-account' | 'program-account' | 'unknown-account';
  owner?: string;
  dataLength?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Token account information
 */
export interface TokenAccountInfo {
  address: string;
  type: 'token-account' | 'mint-account';
  mint?: string;
  owner?: string;
  amount?: number;
  decimals?: number;
  programId?: string;
  error?: string;
  dataLength?: number;
}

/**
 * System account information
 */
export interface SystemAccountInfo {
  address: string;
  type: 'system-account';
  owner: string;
  balance: number;
  dataLength: number;
  executable: boolean;
  rentEpoch: number;
}

/**
 * Program account information
 */
export interface ProgramAccountInfo {
  address: string;
  type: 'program-account';
  owner: string;
  dataLength: number;
  executable: boolean;
  programId: string;
}

/**
 * Balance change information
 */
export interface BalanceChange {
  address: string;
  type: 'sol' | 'token';
  mint?: string;
  preBalance: number;
  postBalance: number;
  change: number;
  changePercent: number;
}

/**
 * Transaction category for filtering
 */
export interface TransactionCategory {
  primary: 'token' | 'system' | 'program' | 'mixed';
  secondary: string[];
  tags: string[];
  complexity: 'simple' | 'medium' | 'complex';
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Transaction decoding options
 */
export interface TransactionDecodingOptions {
  /** Enable rich decoding (overrides SDK default) */
  richDecoding?: boolean;
  /** Include token metadata */
  includeTokenMetadata?: boolean;
  /** Include NFT metadata */
  includeNftMetadata?: boolean;
  /** Custom decoder registry to use */
  customRegistry?: Record<string, unknown>;
}
