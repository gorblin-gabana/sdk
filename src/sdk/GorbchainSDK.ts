/**
 * GorbchainSDK: Main entry point for the Gorbchain transaction decoding SDK
 *
 * This SDK provides a comprehensive solution for interacting with the Gorbchain network,
 * including transaction decoding, RPC communication, and token management.
 *
 * @example
 * ```typescript
 * // Initialize with default Gorbchain configuration
 * const sdk = new GorbchainSDK();
 *
 * // Initialize with custom configuration
 * const sdk = new GorbchainSDK({
 *   rpcEndpoint: 'https://custom-rpc.gorbchain.xyz',
 *   network: 'custom',
 *   programIds: {
 *     'custom-program': 'YourProgramIdHere'
 *   }
 * });
 *
 * // Decode a transaction instruction
 * const decoded = sdk.decodeInstruction(instruction);
 * console.log(decoded);
 * ```
 */
import { RpcClient } from '../rpc/client.js';
import type { DecoderRegistry } from '../decoders/registry.js';
import { getDefaultConfig, validateConfig } from './config.js';
import type { GorbchainSDKConfig, RichTransaction, TransactionDecodingOptions } from './types.js';
import type { Keypair, PublicKey } from '@solana/web3.js';
import type { TokenCreationParams, TransactionOptions, TokenMintResult, NFTCreationParams, NFTMintResult } from './minting.js';
import type { DecodedInstruction } from '../decoders/registry.js';

// Import utility modules
import { createDecoderRegistry, getProgramName } from '../utils/decoderRegistrySetup.js';
import {
  getInstructionDescription,
  classifyTransactionType,
  buildSimpleTransactionSummary,
  extractAccountChanges
} from '../utils/transactionHelpers.js';
import type { SimpleInstruction } from './types.js';
import { base64ToUint8Array } from '../utils/dataProcessing.js';

// Common instruction interface
interface InstructionData {
  programId: string;
  data: Uint8Array;
  accounts: string[];
}

// Raw transaction interfaces for RPC responses
interface RawInstruction {
  programId: string;
  data: string;
  accounts: number[];
  parsed?: unknown;
  program?: string;
}

interface RawTransactionMessage {
  accountKeys: Array<string | { pubkey: string }>;
  instructions: RawInstruction[];
}

interface RawTransaction {
  transaction: {
    message: RawTransactionMessage;
  };
  meta?: {
    fee?: number;
    err?: unknown;
    computeUnitsConsumed?: number;
  };
  slot?: number;
  blockTime?: number;
}

/**
 * Main SDK class for Gorbchain transaction decoding and blockchain interaction
 */
export class GorbchainSDK {
  /** SDK configuration including RPC endpoint and network settings */
  public config: GorbchainSDKConfig;

  /** Registry for managing instruction decoders */
  public decoders: DecoderRegistry;

  /** RPC client for blockchain communication */
  public rpc: RpcClient;

  /** Placeholder for future transaction utilities */
  public transactions: any;

  /**
   * Creates a new instance of the GorbchainSDK
   *
   * @param config - Partial configuration object that will be merged with defaults
   * @example
   * ```typescript
   * const sdk = new GorbchainSDK({
   *   rpcEndpoint: 'https://rpc.gorbchain.xyz',
   *   network: 'custom'
   * });
   * ```
   */
  constructor(config: Partial<GorbchainSDKConfig> = {}) {
    const merged = { ...getDefaultConfig(), ...config };
    validateConfig(merged);
    this.config = merged;

    // Initialize decoder registry with SDK's program IDs
    this.decoders = createDecoderRegistry(this.config);

    // Initialize RPC client
    this.rpc = new RpcClient({
      rpcUrl: this.config.rpcEndpoint
    });

    // TODO: Initialize transaction utilities
    this.transactions = {};
  }

  /**
   * Decode a single instruction using the registered decoders
   *
   * @param instruction - Raw instruction data to decode
   * @returns Decoded instruction with structured data
   * @example
   * ```typescript
   * const decoded = sdk.decodeInstruction({
   *   programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
   *   data: instructionData,
   *   accounts: ['account1', 'account2']
   * });
   * ```
   */
  decodeInstruction(instruction: InstructionData): DecodedInstruction {
    return this.decoders.decode(instruction as any);
  }

  /**
   * Decode multiple instructions at once
   *
   * @param instructions - Array of raw instruction data to decode
   * @returns Array of decoded instructions
   */
  decodeInstructions(instructions: InstructionData[]): DecodedInstruction[] {
    return instructions.map(instruction => this.decodeInstruction(instruction));
  }

  /**
   * Get and decode a transaction with rich metadata and analysis
   *
   * @param signature - Transaction signature to fetch and decode
   * @param options - Decoding options for customizing the output
   * @returns Promise resolving to rich transaction data
   * @example
   * ```typescript
   * const richTx = await sdk.getAndDecodeTransaction(
   *   '5VfQGkJ...',
   *   { includeTokenMetadata: true }
   * );
   * console.log(richTx.summary.type); // "Create NFT"
   * ```
   */
  async getAndDecodeTransaction(
    signature: string,
    options: TransactionDecodingOptions = {}
  ): Promise<RichTransaction> {
    try {
      // Fetch raw transaction
      const rawTransaction = await this.getTransaction(signature);
      if (!rawTransaction) {
        throw new Error(`Transaction not found: ${signature}`);
      }

      // Extract basic transaction info
      const slot = rawTransaction.slot || 0;
      const blockTime = rawTransaction.blockTime || 0;
      const fee = rawTransaction.meta?.fee || 0;
      const status = rawTransaction.meta?.err ? 'failed' : 'success';

      // Process transaction message
      let _accountKeys: string[] = [];
      const transactionMessage = (rawTransaction.transaction as Record<string, unknown>)?.message as Record<string, unknown>;
      if (transactionMessage?.accountKeys && Array.isArray(transactionMessage.accountKeys)) {
        _accountKeys = (transactionMessage.accountKeys as unknown[]).map((key: unknown) => {
          if (typeof key === 'string') return key;
          if (key && typeof key === 'object' && 'pubkey' in key) return (key as any).pubkey;
          return 'unknown';
        });
      }

      const instructions = transactionMessage?.instructions as unknown[] || [];

      // Decode instructions
      const decodedInstructions: DecodedInstruction[] = [];
      const simpleInstructions: SimpleInstruction[] = [];

      for (const rawInst of instructions) {
        try {
          const instruction = rawInst as Record<string, unknown>;
          const programId = instruction.programId as string;
          const data = instruction.data ? base64ToUint8Array(instruction.data as string) : new Uint8Array(0);
          const accounts = (instruction.accounts as number[] || []).map((idx: number) => _accountKeys[idx] || 'unknown');

          const decoded = this.decodeInstruction({
            programId,
            data,
            accounts
          });

          decodedInstructions.push(decoded);

          // Create simple instruction
          const simple: SimpleInstruction = {
            instruction: decodedInstructions.length, // Use current index
            program: getProgramName(programId),
            action: decoded.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: getInstructionDescription(decoded.type, decoded.data),
            data: {
              ...decoded.data,
              programId,
              accounts
            }
          };

          simpleInstructions.push(simple);
        } catch (error) {
          console.warn('Failed to decode instruction:', error);
        }
      }

      // Build transaction summary
      const summary = buildSimpleTransactionSummary(simpleInstructions);
      const classification = classifyTransactionType(decodedInstructions, _accountKeys);

      // Extract account changes
      const accountChanges = extractAccountChanges(rawTransaction as Record<string, unknown>, simpleInstructions);

      // Build rich transaction object
      const richTransaction: RichTransaction = {
        signature,
        slot,
        blockTime,
        fee,
        status,
        summary: {
          type: summary.type,
          description: summary.description,
          programsUsed: [...new Set(decodedInstructions.map(inst => getProgramName(inst.programId)))],
          instructionCount: decodedInstructions.length,
          computeUnits: rawTransaction.meta?.computeUnitsConsumed || 0
        },
        instructions: simpleInstructions,
        accountChanges
      };

      return richTransaction;
    } catch (error) {
      throw new Error(`Failed to decode transaction: ${error}`);
    }
  }

  /**
   * Get raw transaction data from the blockchain
   */
  async getTransaction(signature: string): Promise<any> {
    try {
      const response = await this.rpc.request('getTransaction', [
        signature,
        {
          encoding: 'json',
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0
        }
      ]);
      return response;
    } catch (error) {
      throw new Error(`Failed to fetch transaction: ${error}`);
    }
  }

  // ================================
  // UTILITY METHODS
  // ================================

  /**
   * Register a custom decoder for a specific program
   *
   * @param programName - Human-readable name for the program
   * @param programId - The program's public key as a string
   * @param decoder - Function that decodes instructions for this program
   * @example
   * ```typescript
   * sdk.registerDecoder('my-program', 'ProgramId123...', (instruction) => ({
   *   type: 'my-program-action',
   *   programId: instruction.programId,
   *   data: { action: 'custom', ...instruction },
   *   accounts: instruction.accounts
   * }));
   * ```
   */
  registerDecoder(programName: string, programId: string, decoder: any) {
    this.decoders.register(programName, programId, decoder);
  }

  /**
   * Get list of all supported program names
   *
   * @returns Array of registered program names
   * @example
   * ```typescript
   * const programs = sdk.getSupportedPrograms();
   * console.log(programs); // ['spl-token', 'gorba-token', ...]
   * ```
   */
  getSupportedPrograms() {
    return this.decoders.getRegisteredPrograms();
  }

  /**
   * Get the RPC client for direct blockchain interactions
   *
   * @returns The configured RPC client instance
   * @example
   * ```typescript
   * const rpcClient = sdk.getRpcClient();
   * const accountInfo = await rpcClient.request('getAccountInfo', [publicKey]);
   * ```
   */
  getRpcClient() {
    return this.rpc;
  }

  /**
   * Update the RPC endpoint URL for blockchain communication
   *
   * @param url - New RPC endpoint URL
   * @example
   * ```typescript
   * sdk.setRpcEndpoint('https://new-rpc.gorbchain.xyz');
   * ```
   */
  setRpcEndpoint(url: string) {
    this.config.rpcEndpoint = url;
    this.rpc.setRpcUrl(url);
  }

  /**
   * Enable or disable rich decoding globally for this SDK instance
   *
   * @param enabled - Whether to enable rich decoding
   * @param options - Additional rich decoding options
   * @example
   * ```typescript
   * // Enable rich decoding with token metadata
   * sdk.setRichDecoding(true, {
   *   includeTokenMetadata: true,
   *   includeNftMetadata: true
   * });
   * ```
   */
  setRichDecoding(enabled: boolean, options: Partial<NonNullable<GorbchainSDKConfig['richDecoding']>> = {}) {
    this.config.richDecoding = {
      ...this.config.richDecoding,
      enabled,
      ...options
    };
  }

  /**
   * Check network health and connectivity status
   *
   * @returns Promise resolving to network health information
   * @example
   * ```typescript
   * const health = await sdk.getNetworkHealth();
   * console.log('Current slot:', health.currentSlot);
   * console.log('Network status:', health.status);
   * ```
   */
  async getNetworkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unavailable';
    currentSlot: number;
    blockHeight: number;
    epochInfo: any;
    version: any;
    rpcEndpoint: string;
    responseTime: number;
  }> {
    const startTime = Date.now();

    try {
      // Test multiple RPC calls to assess health
      const [slotInfo, blockHeight, epochInfo, version] = await Promise.all([
        this.rpc.request('getSlot'),
        this.rpc.request('getBlockHeight'),
        this.rpc.request('getEpochInfo'),
        this.rpc.request('getVersion')
      ]);

      const responseTime = Date.now() - startTime;

      // Determine health status based on response time
      let status: 'healthy' | 'degraded' | 'unavailable' = 'healthy';
      if (responseTime > 5000) {
        status = 'degraded';
      } else if (responseTime > 10000) {
        status = 'unavailable';
      }

      return {
        status,
        currentSlot: slotInfo as number,
        blockHeight: blockHeight as number,
        epochInfo,
        version,
        rpcEndpoint: this.config.rpcEndpoint,
        responseTime
      };
    } catch (error) {
      return {
        status: 'unavailable',
        currentSlot: 0,
        blockHeight: 0,
        epochInfo: null,
        version: null,
        rpcEndpoint: this.config.rpcEndpoint,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Get the current slot number from the blockchain
   *
   * @param commitment - Optional commitment level ('processed', 'confirmed', 'finalized')
   * @returns Promise resolving to the current slot number
   * @example
   * ```typescript
   * const slot = await sdk.getCurrentSlot('confirmed');
   * console.log(`Current slot: ${slot}`);
   * ```
   */
  async getCurrentSlot(commitment?: string) {
    return this.rpc.getSlot(commitment);
  }

  /**
   * Get the current block height from the blockchain
   *
   * @param commitment - Optional commitment level ('processed', 'confirmed', 'finalized')
   * @returns Promise resolving to the current block height
   * @example
   * ```typescript
   * const height = await sdk.getBlockHeight('finalized');
   * console.log(`Block height: ${height}`);
   * ```
   */
  async getBlockHeight(commitment?: string) {
    return this.rpc.getBlockHeight(commitment);
  }

  /**
   * Get the latest blockhash from the blockchain
   *
   * @param commitment - Optional commitment level ('processed', 'confirmed', 'finalized')
   * @returns Promise resolving to the latest blockhash information
   * @example
   * ```typescript
   * const { blockhash, lastValidBlockHeight } = await sdk.getLatestBlockhash();
   * console.log(`Blockhash: ${blockhash}`);
   * ```
   */
  async getLatestBlockhash(commitment?: string) {
    return this.rpc.getLatestBlockhash(commitment);
  }

  // ================================
  // MINTING FUNCTIONS
  // ================================

  /**
   * Create a new Token22 token with metadata using the recommended two-transaction approach
   *
   * @param payer - Keypair that will pay for the transaction
   * @param params - Token creation parameters
   * @param options - Transaction options
   * @returns Token minting result with addresses and signature
   */
  async createToken22TwoTx(
    payer: Keypair,
    params: TokenCreationParams,
    options?: TransactionOptions
  ): Promise<TokenMintResult> {
    const { createToken22TwoTx } = await import('./minting.js');
    const { Connection } = await import('@solana/web3.js');
    const connection = new Connection(this.config.rpcEndpoint, 'confirmed');
    return createToken22TwoTx(connection, payer, params, options);
  }

  /**
   * Create a new Token22 token with metadata using a single transaction approach
   *
   * @param payer - Keypair that will pay for the transaction
   * @param params - Token creation parameters
   * @param options - Transaction options
   * @returns Token minting result with addresses and signature
   */
  async createToken22SingleTx(
    payer: Keypair,
    params: TokenCreationParams,
    options?: TransactionOptions
  ): Promise<TokenMintResult> {
    const { createToken22SingleTx } = await import('./minting.js');
    const { Connection } = await import('@solana/web3.js');
    const connection = new Connection(this.config.rpcEndpoint, 'confirmed');
    return createToken22SingleTx(connection, payer, params, options);
  }

  /**
   * Create a new NFT with metadata
   *
   * @param wallet - Wallet adapter for signing transactions
   * @param params - NFT creation parameters
   * @param options - Transaction options
   * @returns NFT minting result with addresses and signature
   */
  async createNFT(
    wallet: any, // Wallet adapter
    params: NFTCreationParams,
    options?: TransactionOptions
  ): Promise<NFTMintResult> {
    const { createNFT } = await import('./minting.js');
    const { Connection } = await import('@solana/web3.js');
    const connection = new Connection(this.config.rpcEndpoint, 'confirmed');
    return createNFT(connection, wallet, params, options);
  }

  /**
   * Check if a payer has sufficient balance for a transaction
   *
   * @param payer - Public key of the payer
   * @param estimatedCost - Estimated cost in lamports
   * @returns Promise resolving to balance check result
   */
  async checkSufficientBalance(
    payer: PublicKey,
    estimatedCost: number
  ): Promise<{ sufficient: boolean; balance: number; required: number }> {
    const { checkSufficientBalance } = await import('./minting.js');
    const { Connection } = await import('@solana/web3.js');
    const connection = new Connection(this.config.rpcEndpoint, 'confirmed');
    return checkSufficientBalance(connection, payer, estimatedCost);
  }

  /**
   * Estimate the cost for creating a token
   *
   * @param params - Token creation parameters
   * @returns Estimated cost in lamports
   */
  async estimateTokenCreationCost(
    params: TokenCreationParams
  ): Promise<number> {
    const { estimateTokenCreationCost } = await import('./minting.js');
    const { Connection } = await import('@solana/web3.js');
    const connection = new Connection(this.config.rpcEndpoint, 'confirmed');
    return estimateTokenCreationCost(connection, params);
  }

  /**
   * Estimate the cost for creating an NFT
   *
   * @param params - NFT creation parameters
   * @returns Estimated cost in lamports
   */
  async estimateNFTCreationCost(
    params: NFTCreationParams
  ): Promise<number> {
    const { estimateNFTCreationCost } = await import('./minting.js');
    const { Connection } = await import('@solana/web3.js');
    const connection = new Connection(this.config.rpcEndpoint, 'confirmed');
    return estimateNFTCreationCost(connection, params);
  }

  /**
   * Get token information from mint address
   *
   * @param mintAddress - Token mint address
   * @returns Token information including metadata
   */
  async getTokenInfo(mintAddress: string): Promise<{
    mint: string;
    supply: string;
    decimals: number;
    mintAuthority: string | null;
    freezeAuthority: string | null;
    metadata?: {
      name: string;
      symbol: string;
      uri: string;
    };
  }> {
    const { getTokenInfo } = await import('./minting.js');
    const { Connection } = await import('@solana/web3.js');
    const connection = new Connection(this.config.rpcEndpoint, 'confirmed');
    return getTokenInfo(connection, mintAddress);
  }

  /**
   * Get transaction information with enriched data
   */
  async getTransactionInfo(signature: string) {
    const { getAndDecodeTransaction } = await import('../transactions/getAndDecodeTransaction.js');
    const { Connection } = await import('@solana/web3.js');
    const connection = new Connection(this.config.rpcEndpoint, 'confirmed');
    return getAndDecodeTransaction({
      signature,
      registry: this.decoders,
      connection
    });
  }

  // ================================
  // TEST METHODS FOR DECODERS
  // ================================

  /**
   * Test the system program decoder with mock data
   */
  async testSystemDecoder(instructionType: string): Promise<DecodedInstruction> {
    const systemProgramId = '11111111111111111111111111111111';
    let mockInstruction: InstructionData;

    switch (instructionType) {
      case 'transfer':
        mockInstruction = {
          programId: systemProgramId,
          data: new Uint8Array([2, 0, 0, 0, 64, 66, 15, 0, 0, 0, 0, 0]), // Transfer 1000000 lamports
          accounts: ['sender', 'recipient']
        };
        break;
      case 'create':
        mockInstruction = {
          programId: systemProgramId,
          data: new Uint8Array([0, 0, 0, 0, 64, 66, 15, 0, 0, 0, 0, 0, 100, 0, 0, 0, 0, 0, 0, 0]),
          accounts: ['payer', 'newAccount', 'systemProgram']
        };
        break;
      default:
        mockInstruction = {
          programId: systemProgramId,
          data: new Uint8Array([0]),
          accounts: ['account']
        };
    }

    return this.decoders.decode(mockInstruction);
  }

  /**
   * Test the SPL Token decoder with mock data
   */
  async testSPLTokenDecoder(instructionType: string): Promise<DecodedInstruction> {
    const splTokenProgramId = this.config.programIds?.splToken || 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
    let mockInstruction: InstructionData;

    switch (instructionType) {
      case 'transfer':
        mockInstruction = {
          programId: splTokenProgramId,
          data: new Uint8Array([3, 100, 0, 0, 0, 0, 0, 0, 0]), // Transfer 100 tokens
          accounts: ['source', 'destination', 'authority']
        };
        break;
      case 'mint':
        mockInstruction = {
          programId: splTokenProgramId,
          data: new Uint8Array([7, 200, 0, 0, 0, 0, 0, 0, 0]), // Mint 200 tokens
          accounts: ['mint', 'destination', 'authority']
        };
        break;
      default:
        mockInstruction = {
          programId: splTokenProgramId,
          data: new Uint8Array([0]),
          accounts: ['account']
        };
    }

    return this.decoders.decode(mockInstruction);
  }

  /**
   * Test the Token-2022 decoder with mock data
   */
  async testToken2022Decoder(instructionType: string): Promise<DecodedInstruction> {
    const token2022ProgramId = this.config.programIds?.token2022 || 'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn';
    let mockInstruction: InstructionData;

    switch (instructionType) {
      case 'transfer':
        mockInstruction = {
          programId: token2022ProgramId,
          data: new Uint8Array([12, 50, 0, 0, 0, 0, 0, 0, 0]), // Transfer 50 tokens
          accounts: ['source', 'mint', 'destination', 'authority']
        };
        break;
      case 'mint':
        mockInstruction = {
          programId: token2022ProgramId,
          data: new Uint8Array([13, 150, 0, 0, 0, 0, 0, 0, 0]), // Mint 150 tokens
          accounts: ['mint', 'destination', 'authority']
        };
        break;
      default:
        mockInstruction = {
          programId: token2022ProgramId,
          data: new Uint8Array([0]),
          accounts: ['account']
        };
    }

    return this.decoders.decode(mockInstruction);
  }

  /**
   * Test the ATA decoder with mock data
   */
  async testATADecoder(instructionType: string): Promise<DecodedInstruction> {
    const ataProgramId = this.config.programIds?.ata || '4YpYoLVTQ8bxcne9GneN85RUXeN7pqGTwgPcY71ZL5gX';
    let mockInstruction: InstructionData;

    switch (instructionType) {
      case 'create':
        mockInstruction = {
          programId: ataProgramId,
          data: new Uint8Array([0]), // Create ATA
          accounts: ['payer', 'associatedTokenAccount', 'owner', 'mint', 'systemProgram', 'tokenProgram']
        };
        break;
      default:
        mockInstruction = {
          programId: ataProgramId,
          data: new Uint8Array([0]),
          accounts: ['account']
        };
    }

    return this.decoders.decode(mockInstruction);
  }

  /**
   * Test the Metaplex decoder with mock data
   */
  async testMetaplexDecoder(instructionType: string): Promise<DecodedInstruction> {
    const metaplexProgramId = this.config.programIds?.metaplex || 'BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc';
    let mockInstruction: InstructionData;

    switch (instructionType) {
      case 'createMetadata':
        mockInstruction = {
          programId: metaplexProgramId,
          data: new Uint8Array([0]), // Create metadata
          accounts: ['metadata', 'mint', 'mintAuthority', 'payer', 'updateAuthority', 'systemProgram', 'rent']
        };
        break;
      case 'createMasterEdition':
        mockInstruction = {
          programId: metaplexProgramId,
          data: new Uint8Array([10, 1, 0, 0, 0, 0, 0, 0, 0]), // Create master edition with max supply 1
          accounts: ['edition', 'mint', 'updateAuthority', 'mintAuthority', 'payer', 'metadata', 'tokenProgram', 'systemProgram', 'rent']
        };
        break;
      default:
        mockInstruction = {
          programId: metaplexProgramId,
          data: new Uint8Array([0]),
          accounts: ['metadata', 'mint', 'mintAuthority', 'payer', 'updateAuthority', 'systemProgram', 'rent']
        };
    }

    return this.decoders.decode(mockInstruction);
  }
}
