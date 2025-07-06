/**
 * Configuration interface for the GorbchainSDK
 */
export interface GorbchainSDKConfig {
  /** RPC endpoint URL for blockchain communication */
  rpcEndpoint: string;
  
  /** Network type identifier */
  network: 'mainnet' | 'testnet' | 'devnet' | 'custom';
  
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
 * Rich transaction object with decoded instructions and comprehensive account analysis
 */
export interface RichTransaction {
  /** Transaction signature */
  signature: string;
  /** Slot number when transaction was processed */
  slot: number;
  /** Unix timestamp when transaction was processed */
  blockTime: number | null;
  /** Transaction fee in lamports */
  fee: number;
  /** Transaction status */
  status: 'success' | 'failed';
  /** Error message if transaction failed */
  error?: string;
  /** Array of decoded instructions */
  instructions: RichInstruction[];
  /** Array of account keys involved in transaction */
  accountKeys: string[];
  /** Transaction metadata from RPC response */
  meta: any;
  /** Comprehensive token account analysis */
  tokenAccounts?: Record<string, any>;
  /** Raw account info map for all fetched accounts */
  accountInfoMap?: Record<string, any>;
}

/**
 * Rich instruction with enhanced decoding
 */
export interface RichInstruction {
  /** Instruction index in the transaction */
  index: number;
  /** Program ID that owns this instruction */
  programId: string;
  /** Program name (if recognized) */
  programName?: string;
  /** Raw instruction data */
  data: string;
  /** Account addresses used by this instruction */
  accounts: string[];
  /** Decoded instruction details */
  decoded: {
    /** Instruction type */
    type: string;
    /** Human-readable description */
    description: string;
    /** Parsed instruction data */
    data?: any;
    /** Token metadata (if applicable and enabled) */
    tokenMetadata?: any;
    /** NFT metadata (if applicable and enabled) */
    nftMetadata?: any;
  };
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
  customRegistry?: any;
}
