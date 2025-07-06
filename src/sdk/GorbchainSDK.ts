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
import type { GorbchainSDKConfig, RichTransaction, TransactionDecodingOptions } from './types.js';
import { getDefaultConfig, validateConfig } from './config.js';
import { DecoderRegistry } from '../decoders/index.js';
import { RpcClient } from '../rpc/client.js';

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
    this.decoders = this.createDecoderRegistry();
    
    // Initialize RPC client
    this.rpc = new RpcClient({
      rpcUrl: this.config.rpcEndpoint
    });
    
    // TODO: Initialize transaction utilities
    this.transactions = {};
  }

  /**
   * Create a decoder registry using this SDK instance's configuration
   */
  private createDecoderRegistry(): DecoderRegistry {
    const registry = new DecoderRegistry();

    // Register System Program decoder
    const systemProgramId = '11111111111111111111111111111111';
    registry.register('system', systemProgramId, (instruction: any) => {
      const { decodeSystemInstruction } = require('../decoders/system.js');
      return decodeSystemInstruction(instruction);
    });

    // Register SPL Token decoder
    const splTokenProgramId = this.config.programIds?.splToken || 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
    registry.register('spl-token', splTokenProgramId, (instruction: any) => {
      const { decodeSPLTokenInstruction } = require('../decoders/splToken.js');
      return decodeSPLTokenInstruction(instruction);
    });

    // Register Token-2022 decoder
    const token2022ProgramId = this.config.programIds?.token2022 || 'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn';
    registry.register('token-2022', token2022ProgramId, (instruction: any) => {
      const { decodeToken2022Instruction } = require('../decoders/token2022.js');
      return decodeToken2022Instruction(instruction);
    });

    // Register ATA decoder
    const ataProgramId = this.config.programIds?.ata || '4YpYoLVTQ8bxcne9GneN85RUXeN7pqGTwgPcY71ZL5gX';
    registry.register('ata', ataProgramId, (instruction: any) => {
      const { decodeATAInstruction } = require('../decoders/ata.js');
      return decodeATAInstruction(instruction);
    });

    // Register NFT/Metaplex decoder
    const metaplexProgramId = this.config.programIds?.metaplex || 'BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc';
    registry.register('nft', metaplexProgramId, (instruction: any) => {
      const { decodeNFTInstruction } = require('../decoders/nft.js');
      return decodeNFTInstruction(instruction);
    });

    console.log('Decoder registry created with program IDs:', {
      system: systemProgramId,
      splToken: splTokenProgramId,
      token2022: token2022ProgramId,
      ata: ataProgramId,
      metaplex: metaplexProgramId
    });

    return registry;
  }

  /**
   * Decode a single blockchain instruction using registered decoders
   *
   * @param instruction - The instruction object to decode
   * @returns Decoded instruction with type, data, and metadata
   * @example
   * ```typescript
   * const instruction = {
   *   programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
   *   data: '...',
   *   accounts: [...]
   * };
   * const decoded = sdk.decodeInstruction(instruction);
   * console.log(decoded.type); // e.g., 'spl-token-transfer'
   * ```
   */
  decodeInstruction(instruction: any) {
    return this.decoders.decode(instruction);
  }

  /**
   * Decode multiple blockchain instructions in batch
   *
   * @param instructions - Array of instruction objects to decode
   * @returns Array of decoded instructions
   * @example
   * ```typescript
   * const instructions = [instruction1, instruction2, instruction3];
   * const decodedInstructions = sdk.decodeInstructions(instructions);
   * decodedInstructions.forEach(decoded => {
   *   console.log(decoded.type);
   * });
   * ```
   */
  decodeInstructions(instructions: any[]) {
    return instructions.map(instruction => this.decoders.decode(instruction));
  }

  /**
   * Fetch and decode a transaction with comprehensive rich analysis
   * This method automatically fetches account info for all token-related accounts
   */
  async getAndDecodeTransaction(
    signature: string, 
    options: TransactionDecodingOptions = {}
  ): Promise<RichTransaction> {
    console.log('🔥 SDK: getAndDecodeTransaction() method called');
    console.log('🔥 SDK: Input signature:', signature);
    console.log('🔥 SDK: Input options:', options);
    console.log('🔥 SDK: this.config:', this.config);
    console.log('🔥 SDK: this.rpc:', this.rpc);
    console.log('🔥 SDK: this.decoders:', this.decoders);

    // Merge options with SDK defaults
    const useRichDecoding = options.richDecoding ?? this.config.richDecoding?.enabled ?? false;
    const includeTokenMetadata = options.includeTokenMetadata ?? this.config.richDecoding?.includeTokenMetadata ?? false;
    const includeNftMetadata = options.includeNftMetadata ?? this.config.richDecoding?.includeNftMetadata ?? false;
    
    console.log('🔥 SDK: Merged options:', {
      useRichDecoding,
      includeTokenMetadata,
      includeNftMetadata
    });
    
    try {
      console.log('🚀 SDK: Starting comprehensive transaction analysis...');
      
      // Step 1: Fetch raw transaction
      console.log('📡 SDK Step 1: Fetching transaction data...');
      console.log('🔥 SDK: About to call this.rpc.request()...');
      console.log('🔥 SDK: RPC endpoint:', this.rpc);
      
      let rawTransaction: any;
      try {
        rawTransaction = await this.rpc.request('getTransaction', [
          signature,
          { 
            maxSupportedTransactionVersion: 0,
            encoding: 'jsonParsed',
            commitment: 'confirmed'
          }
        ]);
        console.log('🔥 SDK: RPC request completed successfully');
        console.log('🔥 SDK: Raw transaction received:', rawTransaction);
        console.log('🔥 SDK: Raw transaction DETAILED:', JSON.stringify(rawTransaction, null, 2));
        console.log('🔥 SDK: Instructions array:', rawTransaction.transaction?.message?.instructions);
        console.log('🔥 SDK: Instructions DETAILED:', JSON.stringify(rawTransaction.transaction?.message?.instructions, null, 2));
      } catch (rpcError) {
        console.error('🔥 SDK: RPC request failed:', rpcError);
        throw new Error(`RPC request failed: ${rpcError}`);
      }

      if (!rawTransaction || !rawTransaction.transaction) {
        console.error('🔥 SDK: Invalid transaction response:', rawTransaction);
        throw new Error(`Transaction not found: ${signature}`);
      }

      console.log('🔥 SDK: Transaction validation passed');
      console.log('🔥 SDK: Transaction structure:', {
        hasTransaction: !!rawTransaction.transaction,
        hasMessage: !!rawTransaction.transaction?.message,
        hasInstructions: !!rawTransaction.transaction?.message?.instructions,
        instructionCount: rawTransaction.transaction?.message?.instructions?.length || 0
      });

      // Extract account keys
      let accountKeys: string[] = [];
      if (rawTransaction.transaction.message?.accountKeys && Array.isArray(rawTransaction.transaction.message.accountKeys)) {
        accountKeys = rawTransaction.transaction.message.accountKeys.map((key: any) => {
          return typeof key === 'string' ? key : (key.pubkey || key);
        });
      }

      console.log(`📋 SDK: Found ${accountKeys.length} accounts in transaction`);
      console.log('🔥 SDK: Account keys:', accountKeys);

      // Step 2: Identify token-related accounts
      console.log('🔍 SDK Step 2: Identifying token-related accounts...');
      const tokenAccounts = new Set<string>();
      const mintAccounts = new Set<string>();
      
      // Check instructions for token program involvement
      const instructions = rawTransaction.transaction?.message?.instructions || [];
      console.log('🔥 SDK: Processing instructions for token detection...');
      console.log('🔥 SDK: Total instructions to process:', instructions.length);
      
      for (let i = 0; i < instructions.length; i++) {
        const instruction = instructions[i];
        const programId = instruction.programId;
        
        console.log(`🔥 SDK: Checking instruction ${i} with program ${programId}`);
        console.log(`🔥 SDK: Instruction ${i} full object:`, JSON.stringify(instruction, null, 2));
        
        // If it's a token program instruction, collect relevant accounts
        if (programId === this.config.programIds?.token2022 || 
            programId === this.config.programIds?.splToken ||
            programId === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
          
          console.log(`🔥 SDK: Found token program instruction at index ${i}`);
          console.log(`🔥 SDK: Instruction accounts property:`, instruction.accounts);
          console.log(`🔥 SDK: Instruction accounts type:`, typeof instruction.accounts);
          console.log(`🔥 SDK: Instruction accounts length:`, instruction.accounts?.length);
          
          // Add instruction accounts as potential token accounts
          if (instruction.accounts) {
            console.log(`🔥 SDK: Processing ${instruction.accounts.length} accounts from instruction...`);
            instruction.accounts.forEach((accountRef: any, idx: number) => {
              console.log(`🔥 SDK: Account ${idx}: index=${accountRef}, resolved=${accountKeys[accountRef]}`);
              
              // Handle both index-based and already-resolved account formats
              let resolvedAccount: string | undefined;
              
              if (typeof accountRef === 'number') {
                // Index-based account (raw instructions)
                resolvedAccount = accountKeys[accountRef];
                console.log(`🔥 SDK: Resolved account by index ${accountRef}: ${resolvedAccount}`);
              } else if (typeof accountRef === 'string') {
                // Already resolved account address (parsed instructions)
                resolvedAccount = accountRef;
                console.log(`🔥 SDK: Account already resolved: ${resolvedAccount}`);
              }
              
              if (resolvedAccount) {
                tokenAccounts.add(resolvedAccount);
                console.log(`🔥 SDK: Added token account: ${resolvedAccount}`);
              } else {
                console.log(`🔥 SDK: Failed to resolve account reference: ${accountRef}`);
              }
            });
          } else {
            console.log(`🔥 SDK: No accounts property found in instruction`);
          }
          
          // For parsed instructions, extract specific accounts
          if (instruction.parsed) {
            console.log('🔥 SDK: Processing parsed instruction info...');
            const info = instruction.parsed.info;
            if (info) {
              if (info.mint) {
                mintAccounts.add(info.mint);
                console.log(`🔥 SDK: Added mint account: ${info.mint}`);
              }
              if (info.source) {
                tokenAccounts.add(info.source);
                console.log(`🔥 SDK: Added source account: ${info.source}`);
              }
              if (info.destination) {
                tokenAccounts.add(info.destination);
                console.log(`🔥 SDK: Added destination account: ${info.destination}`);
              }
              if (info.account) {
                tokenAccounts.add(info.account);
                console.log(`🔥 SDK: Added account: ${info.account}`);
              }
              if (info.tokenAccount) {
                tokenAccounts.add(info.tokenAccount);
                console.log(`🔥 SDK: Added tokenAccount: ${info.tokenAccount}`);
              }
            }
          }
        }
      }

      console.log(`🪙 SDK: Found ${tokenAccounts.size} potential token accounts`);
      console.log(`🏭 SDK: Found ${mintAccounts.size} mint accounts`);
      console.log('🔥 SDK: Token accounts list:', Array.from(tokenAccounts));
      console.log('🔥 SDK: Mint accounts list:', Array.from(mintAccounts));

      // Step 3: Fetch account info for all identified accounts
      console.log('📊 SDK Step 3: Fetching detailed account information...');
      const accountInfoMap = new Map<string, any>();
      const accountsToFetch = [...tokenAccounts, ...mintAccounts];
      
      console.log('🔥 SDK: Accounts to fetch info for:', accountsToFetch);
      
      if (accountsToFetch.length > 0) {
        console.log(`🔄 SDK: Fetching account info for ${accountsToFetch.length} accounts...`);
        
        // Batch fetch account info (limit to avoid rate limiting)
        const batchSize = 10;
        for (let i = 0; i < accountsToFetch.length; i += batchSize) {
          const batch = accountsToFetch.slice(i, i + batchSize);
          console.log(`🔥 SDK: Processing batch ${Math.floor(i/batchSize) + 1}: ${batch.length} accounts`);
          
          const batchPromises = batch.map(async (account, index) => {
            try {
              console.log(`🔥 SDK: Fetching account info for ${account} (batch item ${index + 1})`);
              const accountInfo = await this.rpc.request('getAccountInfo', [
                account,
                { encoding: 'base64', commitment: 'confirmed' }
              ]);
              console.log(`🔥 SDK: Account info received for ${account}:`, accountInfo);
              return { account, info: accountInfo };
            } catch (error) {
              console.warn(`🔥 SDK: Failed to fetch account info for ${account}:`, error);
              return { account, info: null };
            }
          });
          
          const batchResults = await Promise.all(batchPromises);
          batchResults.forEach(({ account, info }) => {
            if (info) {
              accountInfoMap.set(account, info);
              console.log(`🔥 SDK: Stored account info for ${account}`);
            }
          });
          
          console.log(`✅ SDK: Processed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(accountsToFetch.length/batchSize)}`);
        }
      } else {
        console.log('🔥 SDK: No token accounts found to fetch info for');
      }

      console.log('🔥 SDK: Total account info collected:', accountInfoMap.size);

      // Step 4: Decode account data for token accounts
      console.log('🔧 SDK Step 4: Decoding account data...');
      const decodedAccounts = new Map<string, any>();
      
      for (const [account, accountInfo] of accountInfoMap) {
        console.log(`🔥 SDK: Decoding account data for ${account}`);
        if (accountInfo?.value?.data) {
          try {
            const decodedAccountData = await this.decodeAccountData(account, accountInfo, mintAccounts.has(account));
            if (decodedAccountData) {
              decodedAccounts.set(account, decodedAccountData);
              console.log(`🎯 SDK: Decoded account ${account}:`, decodedAccountData.type);
            }
          } catch (error) {
            console.warn(`🔥 SDK: Failed to decode account data for ${account}:`, error);
          }
        } else {
          console.log(`🔥 SDK: No data to decode for account ${account}`);
        }
      }

      console.log('🔥 SDK: Total accounts decoded:', decodedAccounts.size);

      // Step 5: Build comprehensive rich transaction
      console.log('🏗️ SDK Step 5: Building comprehensive transaction analysis...');
      const richTransaction: RichTransaction = {
        signature,
        slot: rawTransaction.slot || 0,
        blockTime: rawTransaction.blockTime || null,
        fee: rawTransaction.meta?.fee || 0,
        status: rawTransaction.meta?.err ? 'failed' : 'success',
        error: rawTransaction.meta?.err ? JSON.stringify(rawTransaction.meta.err) : undefined,
        instructions: [],
        accountKeys,
        meta: rawTransaction.meta || {},
        // Add our comprehensive account analysis
        tokenAccounts: Object.fromEntries(decodedAccounts),
        accountInfoMap: Object.fromEntries(accountInfoMap)
      };

      console.log('🔥 SDK: Base rich transaction created');

      // Step 6: Process instructions with enriched context
      console.log('⚙️ SDK Step 6: Processing instructions with enriched context...');
      for (let i = 0; i < instructions.length; i++) {
        const instruction = instructions[i];
        console.log(`🔥 SDK: Processing instruction ${i + 1}/${instructions.length}`);
        
        let programId: string = instruction.programId;
        let instructionAccounts: string[] = [];
        let instructionData: any;

        // Handle parsed vs raw instructions
        if (instruction.parsed) {
          console.log(`🔥 SDK: Instruction ${i} is parsed`);
          programId = instruction.programId;
          instructionData = JSON.stringify(instruction.parsed);
          instructionAccounts = instruction.accounts || [];
        } else {
          console.log(`🔥 SDK: Instruction ${i} is raw, converting base64...`);
          // Convert base64 to Uint8Array for decoders
          if (instruction.data && typeof instruction.data === 'string') {
            try {
              console.log(`🔥 SDK: Instruction data type: ${typeof instruction.data}`);
              console.log(`🔥 SDK: Instruction data length: ${instruction.data.length}`);
              console.log(`🔥 SDK: Instruction data sample: ${instruction.data.substring(0, 50)}...`);
              
              // Try base58 decoding first (common for Solana)
              try {
                console.log('🔥 SDK: Attempting base58 decoding...');
                const { base58ToBytes } = await import('../utils/base58.js');
                const bytes = base58ToBytes(instruction.data);
                instructionData = bytes;
                console.log(`🔥 SDK: Successfully decoded base58: ${instruction.data.length} chars to ${bytes.length} bytes`);
              } catch (base58Error) {
                console.log('🔥 SDK: Base58 decoding failed, trying base64...');
                // Fall back to base64 decoding
                const binaryString = atob(instruction.data);
                const bytes = new Uint8Array(binaryString.length);
                for (let j = 0; j < binaryString.length; j++) {
                  bytes[j] = binaryString.charCodeAt(j);
                }
                instructionData = bytes;
                console.log(`🔥 SDK: Successfully decoded base64: ${instruction.data.length} chars to ${bytes.length} bytes`);
              }
            } catch (error) {
              console.warn('🔥 SDK: Failed to decode instruction data:', error);
              console.log('🔥 SDK: Trying alternative data formats...');
              
              // Try to handle different data formats
              if (Array.isArray(instruction.data)) {
                console.log('🔥 SDK: Instruction data is array, converting to Uint8Array...');
                instructionData = new Uint8Array(instruction.data);
              } else if (instruction.data.startsWith && instruction.data.startsWith('0x')) {
                console.log('🔥 SDK: Instruction data is hex string, converting...');
                const hex = instruction.data.slice(2);
                const bytes = new Uint8Array(hex.length / 2);
                for (let j = 0; j < hex.length; j += 2) {
                  bytes[j / 2] = parseInt(hex.substr(j, 2), 16);
                }
                instructionData = bytes;
              } else {
                console.log('🔥 SDK: Using instruction data as-is');
                instructionData = instruction.data;
              }
            }
          } else if (Array.isArray(instruction.data)) {
            console.log('🔥 SDK: Instruction data is already array format');
            instructionData = new Uint8Array(instruction.data);
          } else {
            console.log('🔥 SDK: Instruction data is unknown format, using as-is');
            instructionData = instruction.data || new Uint8Array(0);
          }
          
          // Map account indices to addresses
          if (Array.isArray(instruction.accounts)) {
            instructionAccounts = instruction.accounts.map((accountRef: any) => {
              if (typeof accountRef === 'number') {
                return accountKeys[accountRef] || '';
              }
              return accountRef;
            });
          }
        }
        
        // Determine program name
        let programName = 'unknown';
        if (programId === this.config.programIds?.splToken) programName = 'spl-token';
        else if (programId === this.config.programIds?.token2022) programName = 'token-2022';
        else if (programId === this.config.programIds?.ata) programName = 'ata';
        else if (programId === this.config.programIds?.metaplex) programName = 'metaplex';
        else if (programId === '11111111111111111111111111111111') programName = 'system';

        console.log(`🔥 SDK: Instruction ${i} identified as program: ${programName} (${programId})`);

        // Decode instruction
        const instructionObj = {
          programId,
          data: instructionData,
          accounts: instructionAccounts
        };

        let decoded: any = {
          type: 'unknown',
          description: 'Raw instruction data',
          data: instruction.parsed || { raw: instructionData }
        };

        // Apply rich decoding with account context
        if (useRichDecoding) {
          console.log(`🔥 SDK: Applying rich decoding to instruction ${i}...`);
          try {
            if (instruction.parsed) {
              console.log(`🔥 SDK: Decoding parsed instruction...`);
              decoded = this.decodeParsedInstruction(instruction.parsed, programName);
            } else {
              console.log(`🔥 SDK: Using decoder registry for raw instruction...`);
              console.log(`🔥 SDK: Checking if decoder exists for program ${programId}...`);
              console.log(`🔥 SDK: Has decoder:`, this.decoders.hasDecoder(programId));
              
              const decodedInstruction = this.decoders.decode(instructionObj);
              console.log(`🔥 SDK: Decoder result:`, decodedInstruction);
              
              decoded = {
                type: decodedInstruction.type,
                description: this.getInstructionDescription(decodedInstruction.type, decodedInstruction.data),
                data: decodedInstruction.data
              };
            }

            // Enrich with account data
            console.log(`🔥 SDK: Enriching instruction with account data...`);
            decoded = this.enrichInstructionWithAccountData(decoded, instructionAccounts, decodedAccounts);

            console.log(`✨ SDK: Enriched instruction ${i + 1}: ${decoded.type}`);
          } catch (error) {
            console.warn(`🔥 SDK: Rich decoding failed for instruction ${i}:`, error);
          }
        } else {
          console.log(`🔥 SDK: Rich decoding disabled for instruction ${i}`);
        }

        richTransaction.instructions.push({
          index: i,
          programId,
          programName,
          data: typeof instructionData === 'string' ? instructionData : 
                instructionData instanceof Uint8Array ? Array.from(instructionData).join(',') : 
                JSON.stringify(instructionData),
          accounts: instructionAccounts,
          decoded
        });

        console.log(`🔥 SDK: Added instruction ${i + 1} to result`);
      }

      console.log('🎉 SDK: Comprehensive transaction analysis complete!');
      console.log(`📊 SDK: Final result: ${richTransaction.instructions.length} instructions, ${Object.keys(richTransaction.tokenAccounts || {}).length} token accounts analyzed`);
      console.log('🔥 SDK: Final rich transaction object:', richTransaction);

      return richTransaction;
    } catch (error) {
      console.error('❌ SDK: Error in comprehensive transaction analysis:', error);
      console.error('🔥 SDK: Error stack:', (error as Error)?.stack);
      throw error;
    }
  }

  /**
   * Decode a parsed instruction from the RPC response
   */
  private decodeParsedInstruction(parsed: any, programName: string): any {
    if (parsed.type === 'createAccount') {
      return {
        type: 'system-create-account',
        description: `Create account with ${parsed.info?.lamports || 0} lamports`,
        data: {
          lamports: parsed.info?.lamports || 0,
          space: parsed.info?.space || 0,
          owner: parsed.info?.owner || '',
          newAccount: parsed.info?.newAccount || '',
          source: parsed.info?.source || ''
        }
      };
    }

    if (parsed.type === 'transfer') {
      return {
        type: 'system-transfer',
        description: `Transfer ${parsed.info?.lamports || 0} lamports`,
        data: {
          lamports: parsed.info?.lamports || 0,
          source: parsed.info?.source || '',
          destination: parsed.info?.destination || ''
        }
      };
    }

    // For token operations
    if (parsed.type === 'initializeMint') {
      return {
        type: 'token2022-initialize-mint',
        description: `Initialize mint with ${parsed.info?.decimals || 0} decimals`,
        data: parsed.info || {}
      };
    }

    // Default for other parsed instructions
    return {
      type: `${programName}-${parsed.type}`,
      description: `${parsed.type} instruction`,
      data: parsed.info || parsed
    };
  }

  /**
   * Get a human-readable description for an instruction type
   */
  private getInstructionDescription(type: string, data: any): string {
    const descriptions: Record<string, string> = {
      'spl-token-transfer': `Transfer ${data?.amount || 'unknown amount'} tokens`,
      'spl-token-mint-to': `Mint ${data?.amount || 'unknown amount'} tokens`,
      'spl-token-burn': `Burn ${data?.amount || 'unknown amount'} tokens`,
      'spl-token-approve': `Approve ${data?.amount || 'unknown amount'} tokens`,
      'spl-token-revoke': 'Revoke token approval',
      'spl-token-close-account': 'Close token account',
      'spl-token-freeze-account': 'Freeze token account',
      'spl-token-thaw-account': 'Thaw token account',
      'spl-token-initialize-mint': `Initialize mint with ${data?.decimals || 'unknown'} decimals`,
      'spl-token-initialize-account': 'Initialize token account',
      'system-transfer': `Transfer ${data?.lamports || 'unknown amount'} lamports`,
      'system-create-account': 'Create new account',
      'unknown': 'Raw instruction data (decoder needed for full parsing)'
    };

    return descriptions[type] || `${type} instruction`;
  }

  /**
   * Check if an instruction type is related to token operations
   */
  private isTokenRelatedInstruction(type: string): boolean {
    return type.startsWith('spl-token-') || type.startsWith('token2022-');
  }

  /**
   * Check if an instruction type is related to NFT operations
   */
  private isNftRelatedInstruction(type: string): boolean {
    return type.includes('metaplex') || type.includes('nft') || type.includes('metadata');
  }

  /**
   * Fetch token metadata for token-related instructions
   */
  private async fetchTokenMetadata(instruction: any, decoded: any): Promise<any> {
    try {
      // Extract mint address from instruction accounts
      let mintAddress: string | null = null;
      
      // Try to find mint address from different instruction types
      if (instruction.accounts && instruction.accounts.length > 0) {
        // For most token instructions, mint is often the first or second account
        if (decoded.type.includes('initialize-account') || decoded.type.includes('mint-to')) {
          mintAddress = instruction.accounts[1]; // Mint is usually second account
        } else if (decoded.type.includes('transfer') || decoded.type.includes('approve')) {
          // For transfers, we need to get the mint from the token account
          // For now, try the first account as potential mint
          mintAddress = instruction.accounts[0];
        } else {
          mintAddress = instruction.accounts[0]; // Default to first account
        }
      }
      
      // If we couldn't extract mint from accounts, try from decoded data
      if (!mintAddress && decoded.data) {
        if (decoded.data.mint) {
          mintAddress = decoded.data.mint;
        } else if (decoded.data.tokenAccount) {
          // Get mint from token account info
          try {
            const tokenAccountInfo = await this.rpc.getTokenAccountInfo(decoded.data.tokenAccount);
            if (tokenAccountInfo) {
              mintAddress = tokenAccountInfo.mint;
            }
          } catch (err) {
            console.warn('Failed to get token account info:', err);
          }
        }
      }
      
      if (!mintAddress) {
        console.warn('Could not extract mint address from instruction');
        return null;
      }
      
      // Fetch comprehensive token information
      const tokenInfo = await this.rpc.getTokenInfo(mintAddress);
      
      if (!tokenInfo) {
        console.warn('No token info found for mint:', mintAddress);
        return null;
      }
      
      return {
        mintAddress,
        name: tokenInfo.metadata?.name || 'Unknown Token',
        symbol: tokenInfo.metadata?.symbol || 'UNK',
        decimals: tokenInfo.decimals,
        supply: tokenInfo.supply,
        isNFT: tokenInfo.isNFT,
        isInitialized: tokenInfo.isInitialized,
        mintAuthority: tokenInfo.mintAuthority,
        freezeAuthority: tokenInfo.freezeAuthority,
        metadata: tokenInfo.metadata
      };
    } catch (error) {
      console.warn('Failed to fetch token metadata:', error);
      return null;
    }
  }

  /**
   * Fetch NFT metadata for NFT-related instructions
   */
  private async fetchNftMetadata(instruction: any, decoded: any): Promise<any> {
    try {
      // Extract mint address from instruction accounts
      let mintAddress: string | null = null;
      
      if (instruction.accounts && instruction.accounts.length > 0) {
        // For NFT instructions, mint is often in the second position
        if (decoded.type.includes('create-metadata') || decoded.type.includes('update-metadata')) {
          mintAddress = instruction.accounts[1]; // Mint account
        } else if (decoded.type.includes('verify') || decoded.type.includes('transfer')) {
          mintAddress = instruction.accounts[0]; // Metadata account points to mint
        } else {
          mintAddress = instruction.accounts[1]; // Default assumption
        }
      }
      
      if (!mintAddress) {
        console.warn('Could not extract mint address from NFT instruction');
        return null;
      }
      
      // First check if it's actually an NFT
      const isNFT = await this.rpc.isNFT(mintAddress);
      if (!isNFT) {
        console.warn('Token is not an NFT:', mintAddress);
        return null;
      }
      
      // Get comprehensive token info including metadata
      const tokenInfo = await this.rpc.getTokenInfo(mintAddress);
      
      if (!tokenInfo || !tokenInfo.metadata) {
        console.warn('No NFT metadata found for mint:', mintAddress);
        return null;
      }
      
      // Try to fetch external metadata from URI if available
      let externalMetadata = null;
      if (tokenInfo.metadata.uri) {
        try {
          const response = await fetch(tokenInfo.metadata.uri);
          if (response.ok) {
            externalMetadata = await response.json();
          }
        } catch (err) {
          console.warn('Failed to fetch external NFT metadata:', err);
        }
      }
      
      return {
        mintAddress,
        name: tokenInfo.metadata.name || externalMetadata?.name || 'Unknown NFT',
        symbol: tokenInfo.metadata.symbol || externalMetadata?.symbol || '',
        description: externalMetadata?.description || 'No description available',
        image: externalMetadata?.image || null,
        attributes: externalMetadata?.attributes || [],
        uri: tokenInfo.metadata.uri,
        creators: tokenInfo.metadata.creators || [],
        sellerFeeBasisPoints: tokenInfo.metadata.sellerFeeBasisPoints || 0,
        collection: (tokenInfo.metadata as any).collection || null,
        supply: tokenInfo.supply,
        decimals: tokenInfo.decimals,
        isCollection: decoded.data?.extension === 'Collection' || false,
        isMasterEdition: decoded.type.includes('master-edition')
      };
    } catch (error) {
      console.warn('Failed to fetch NFT metadata:', error);
      return null;
    }
  }

  /**
   * Decode account data based on the account owner/program
   */
  private async decodeAccountData(account: string, accountInfo: any, isMint: boolean): Promise<any> {
    if (!accountInfo?.value?.data) return null;

    const owner = accountInfo.value.owner;
    const data = accountInfo.value.data;

    try {
      // Decode based on owner program
      if (owner === this.config.programIds?.token2022 || owner === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
        if (isMint) {
          return await this.decodeMintAccount(data);
        } else {
          return await this.decodeTokenAccount(data);
        }
      }
      
      return {
        type: 'unknown-account',
        owner,
        dataLength: Array.isArray(data) ? data.length : (typeof data === 'string' ? data.length : 0)
      };
    } catch (error) {
      console.warn(`Failed to decode account data for ${account}:`, error);
      return null;
    }
  }

  /**
   * Decode mint account data
   */
  private async decodeMintAccount(data: any): Promise<any> {
    try {
      // Convert base64 data to bytes if needed
      let bytes: Uint8Array;
      if (typeof data === 'string') {
        bytes = new Uint8Array(Buffer.from(data, 'base64'));
      } else if (Array.isArray(data)) {
        bytes = new Uint8Array(data);
      } else {
        bytes = data;
      }

      // Basic mint account structure (simplified)
      if (bytes.length >= 82) {
        const view = new DataView(bytes.buffer, bytes.byteOffset);
        
        return {
          type: 'mint-account',
          supply: view.getBigUint64(0, true).toString(),
          decimals: view.getUint8(44),
          isInitialized: view.getUint8(45) === 1,
          mintAuthority: bytes.slice(46, 78),
          freezeAuthority: bytes.slice(78, 110)
        };
      }
      
      return {
        type: 'mint-account',
        error: 'Invalid mint account data length'
      };
    } catch (error) {
      return {
        type: 'mint-account',
        error: `Failed to decode: ${error}`
      };
    }
  }

  /**
   * Decode token account data
   */
  private async decodeTokenAccount(data: any): Promise<any> {
    try {
      // Convert base64 data to bytes if needed
      let bytes: Uint8Array;
      if (typeof data === 'string') {
        bytes = new Uint8Array(Buffer.from(data, 'base64'));
      } else if (Array.isArray(data)) {
        bytes = new Uint8Array(data);
      } else {
        bytes = data;
      }

      // Basic token account structure (simplified)
      if (bytes.length >= 165) {
        const view = new DataView(bytes.buffer, bytes.byteOffset);
        
        return {
          type: 'token-account',
          mint: Array.from(bytes.slice(0, 32)),
          owner: Array.from(bytes.slice(32, 64)),
          amount: view.getBigUint64(64, true).toString(),
          delegateOption: view.getUint32(72, true),
          isInitialized: view.getUint8(108) === 1,
          isFrozen: view.getUint8(109) === 1
        };
      }
      
      return {
        type: 'token-account',
        error: 'Invalid token account data length'
      };
    } catch (error) {
      return {
        type: 'token-account',
        error: `Failed to decode: ${error}`
      };
    }
  }

  /**
   * Enrich instruction data with decoded account information
   */
  private enrichInstructionWithAccountData(decoded: any, accounts: string[], decodedAccounts: Map<string, any>): any {
    const enriched = { ...decoded };
    
    // Add account details to the decoded instruction
    enriched.accountDetails = accounts.map(account => {
      const accountData = decodedAccounts.get(account);
      return {
        address: account,
        ...accountData
      };
    });

    // For token instructions, add specific token details
    if (decoded.type.includes('token') || decoded.type.includes('spl')) {
      const tokenAccounts = accounts.filter(account => {
        const accountData = decodedAccounts.get(account);
        return accountData?.type === 'token-account';
      });
      
      const mintAccounts = accounts.filter(account => {
        const accountData = decodedAccounts.get(account);
        return accountData?.type === 'mint-account';
      });

      if (tokenAccounts.length > 0) {
        enriched.tokenAccountsInvolved = tokenAccounts.map(account => ({
          address: account,
          ...decodedAccounts.get(account)
        }));
      }

      if (mintAccounts.length > 0) {
        enriched.mintsInvolved = mintAccounts.map(account => ({
          address: account,
          ...decodedAccounts.get(account)
        }));
      }
    }

    return enriched;
  }

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
    return this.rpc.request('getBlockHeight', commitment ? [{ commitment }] : []);
  }

  /**
   * Get the latest blockhash for transaction building
   *
   * @param commitment - Optional commitment level ('processed', 'confirmed', 'finalized')
   * @returns Promise resolving to blockhash information
   * @example
   * ```typescript
   * const { blockhash, lastValidBlockHeight } = await sdk.getLatestBlockhash();
   * ```
   */
  async getLatestBlockhash(commitment?: string) {
    return this.rpc.request('getLatestBlockhash', commitment ? [{ commitment }] : []);
  }

  /**
   * Test System Program decoder with various instruction types
   */
  async testSystemDecoder(instructionType: string): Promise<any> {
    const systemProgramId = '11111111111111111111111111111111';
    let mockInstruction: any;

    switch (instructionType) {
      case 'transfer':
        mockInstruction = {
          programId: systemProgramId,
          data: new Uint8Array([2, 0, 0, 0, 0, 0, 0, 0, 64, 66, 15, 0, 0, 0, 0, 0]), // Transfer 1000000 lamports
          accounts: ['sender123', 'recipient456']
        };
        break;
      case 'createAccount':
        mockInstruction = {
          programId: systemProgramId,
          data: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 64, 66, 15, 0, 0, 0, 0, 0, 165, 0, 0, 0, 0, 0, 0, 0]), // Create account with 1000000 lamports, 165 bytes
          accounts: ['payer123', 'newAccount456', 'owner789']
        };
        break;
      case 'allocate':
        mockInstruction = {
          programId: systemProgramId,
          data: new Uint8Array([8, 0, 0, 0, 0, 0, 0, 0, 100, 0, 0, 0, 0, 0, 0, 0]), // Allocate 100 bytes
          accounts: ['account123']
        };
        break;
      case 'assign':
        mockInstruction = {
          programId: systemProgramId,
          data: new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0]), // Assign to program
          accounts: ['account123', 'newOwner456']
        };
        break;
      default:
        mockInstruction = {
          programId: systemProgramId,
          data: new Uint8Array([2, 0, 0, 0, 0, 0, 0, 0, 64, 66, 15, 0, 0, 0, 0, 0]),
          accounts: ['sender123', 'recipient456']
        };
    }

    const decoded = this.decoders.decode(mockInstruction);
    console.log('System Program Decoder Test Result:', decoded);
    return decoded;
  }

  /**
   * Test SPL Token decoder with various instruction types
   */
  async testSPLTokenDecoder(instructionType: string): Promise<any> {
    const splTokenProgramId = this.config.programIds?.splToken || 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
    let mockInstruction: any;

    switch (instructionType) {
      case 'transfer':
        mockInstruction = {
          programId: splTokenProgramId,
          data: new Uint8Array([3, 64, 66, 15, 0, 0, 0, 0, 0]), // Transfer 1000000 tokens
          accounts: ['sourceAccount', 'destinationAccount', 'authority']
        };
        break;
      case 'mintTo':
        mockInstruction = {
          programId: splTokenProgramId,
          data: new Uint8Array([7, 64, 66, 15, 0, 0, 0, 0, 0]), // Mint 1000000 tokens
          accounts: ['mint', 'destination', 'authority']
        };
        break;
      case 'burn':
        mockInstruction = {
          programId: splTokenProgramId,
          data: new Uint8Array([8, 64, 66, 15, 0, 0, 0, 0, 0]), // Burn 1000000 tokens
          accounts: ['account', 'mint', 'authority']
        };
        break;
      case 'initializeMint':
        mockInstruction = {
          programId: splTokenProgramId,
          data: new Uint8Array([0, 9, 0, 0, 0, 0, 0, 0, 0]), // Initialize mint with 9 decimals
          accounts: ['mint', 'rent']
        };
        break;
      case 'initializeAccount':
        mockInstruction = {
          programId: splTokenProgramId,
          data: new Uint8Array([1]), // Initialize account
          accounts: ['account', 'mint', 'owner', 'rent']
        };
        break;
      case 'approve':
        mockInstruction = {
          programId: splTokenProgramId,
          data: new Uint8Array([4, 64, 66, 15, 0, 0, 0, 0, 0]), // Approve 1000000 tokens
          accounts: ['source', 'delegate', 'authority']
        };
        break;
      case 'revoke':
        mockInstruction = {
          programId: splTokenProgramId,
          data: new Uint8Array([5]), // Revoke approval
          accounts: ['source', 'authority']
        };
        break;
      default:
        mockInstruction = {
          programId: splTokenProgramId,
          data: new Uint8Array([3, 64, 66, 15, 0, 0, 0, 0, 0]),
          accounts: ['sourceAccount', 'destinationAccount', 'authority']
        };
    }

    const decoded = this.decoders.decode(mockInstruction);
    console.log('SPL Token Decoder Test Result:', decoded);
    return decoded;
  }

  /**
   * Test Token-2022 decoder with various instruction types
   */
  async testToken2022Decoder(instructionType: string): Promise<any> {
    const token2022ProgramId = this.config.programIds?.token2022 || 'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn';
    let mockInstruction: any;

    switch (instructionType) {
      case 'transfer':
        mockInstruction = {
          programId: token2022ProgramId,
          data: new Uint8Array([3, 64, 66, 15, 0, 0, 0, 0, 0]), // Transfer 1000000 tokens
          accounts: ['sourceAccount', 'destinationAccount', 'authority']
        };
        break;
      case 'mintTo':
        mockInstruction = {
          programId: token2022ProgramId,
          data: new Uint8Array([7, 64, 66, 15, 0, 0, 0, 0, 0]), // Mint 1000000 tokens
          accounts: ['mint', 'destination', 'authority']
        };
        break;
      case 'burn':
        mockInstruction = {
          programId: token2022ProgramId,
          data: new Uint8Array([8, 64, 66, 15, 0, 0, 0, 0, 0]), // Burn 1000000 tokens
          accounts: ['account', 'mint', 'authority']
        };
        break;
      case 'initializeMint':
        mockInstruction = {
          programId: token2022ProgramId,
          data: new Uint8Array([0, 9, 0, 0, 0, 0, 0, 0, 0]), // Initialize mint with 9 decimals
          accounts: ['mint', 'rent']
        };
        break;
      case 'transferChecked':
        mockInstruction = {
          programId: token2022ProgramId,
          data: new Uint8Array([12, 64, 66, 15, 0, 0, 0, 0, 0, 9]), // Transfer checked 1000000 tokens, 9 decimals
          accounts: ['sourceAccount', 'mint', 'destinationAccount', 'authority']
        };
        break;
      case 'initializeImmutableOwner':
        mockInstruction = {
          programId: token2022ProgramId,
          data: new Uint8Array([22]), // Initialize immutable owner
          accounts: ['account']
        };
        break;
      case 'reallocate':
        mockInstruction = {
          programId: token2022ProgramId,
          data: new Uint8Array([29]), // Reallocate
          accounts: ['account', 'payer', 'systemProgram']
        };
        break;
      default:
        mockInstruction = {
          programId: token2022ProgramId,
          data: new Uint8Array([3, 64, 66, 15, 0, 0, 0, 0, 0]),
          accounts: ['sourceAccount', 'destinationAccount', 'authority']
        };
    }

    const decoded = this.decoders.decode(mockInstruction);
    console.log('Token-2022 Decoder Test Result:', decoded);
    return decoded;
  }

  /**
   * Test ATA Program decoder with various instruction types
   */
  async testATADecoder(instructionType: string): Promise<any> {
    const ataProgramId = this.config.programIds?.ata || '4YpYoLVTQ8bxcne9GneN85RUXeN7pqGTwgPcY71ZL5gX';
    let mockInstruction: any;

    switch (instructionType) {
      case 'create':
        mockInstruction = {
          programId: ataProgramId,
          data: new Uint8Array([0]), // Create ATA
          accounts: ['payer', 'associatedTokenAccount', 'owner', 'mint', 'systemProgram', 'tokenProgram']
        };
        break;
      case 'createIdempotent':
        mockInstruction = {
          programId: ataProgramId,
          data: new Uint8Array([1]), // Create ATA idempotent
          accounts: ['payer', 'associatedTokenAccount', 'owner', 'mint', 'systemProgram', 'tokenProgram']
        };
        break;
      default:
        mockInstruction = {
          programId: ataProgramId,
          data: new Uint8Array([0]),
          accounts: ['payer', 'associatedTokenAccount', 'owner', 'mint', 'systemProgram', 'tokenProgram']
        };
    }

    const decoded = this.decoders.decode(mockInstruction);
    console.log('ATA Program Decoder Test Result:', decoded);
    return decoded;
  }

  /**
   * Test Metaplex decoder with various instruction types
   */
  async testMetaplexDecoder(instructionType: string): Promise<any> {
    const metaplexProgramId = this.config.programIds?.metaplex || 'BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc';
    let mockInstruction: any;

    switch (instructionType) {
      case 'createMetadata':
        mockInstruction = {
          programId: metaplexProgramId,
          data: new Uint8Array([0]), // Create metadata
          accounts: ['metadata', 'mint', 'mintAuthority', 'payer', 'updateAuthority', 'systemProgram', 'rent']
        };
        break;
      case 'updateMetadata':
        mockInstruction = {
          programId: metaplexProgramId,
          data: new Uint8Array([1]), // Update metadata
          accounts: ['metadata', 'updateAuthority']
        };
        break;
      case 'verifyCreator':
        mockInstruction = {
          programId: metaplexProgramId,
          data: new Uint8Array([7]), // Verify creator
          accounts: ['metadata', 'creator']
        };
        break;
      case 'createMasterEdition':
        mockInstruction = {
          programId: metaplexProgramId,
          data: new Uint8Array([10]), // Create master edition
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

    const decoded = this.decoders.decode(mockInstruction);
    console.log('Metaplex Decoder Test Result:', decoded);
    return decoded;
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
  // MINTING FUNCTIONS  
  // ================================

  /**
   * Create a new Token22 token with metadata using the recommended two-transaction approach
   * 
   * @param payer - Keypair that will pay for the transaction and own the token
   * @param params - Token creation parameters
   * @param options - Transaction options
   * @returns Token minting result with addresses and signature
   */
  async createToken22TwoTx(
    payer: import('@solana/web3.js').Keypair,
    params: import('./minting.js').TokenCreationParams,
    options?: import('./minting.js').TransactionOptions
  ): Promise<import('./minting.js').TokenMintResult> {
    const { createToken22TwoTx } = await import('./minting.js');
    const { Connection } = await import('@solana/web3.js');
    const connection = new Connection(this.config.rpcEndpoint, 'confirmed');
    return createToken22TwoTx(connection, payer, params, options);
  }

  /**
   * Create a new Token22 token with metadata using a single transaction approach
   * 
   * @param payer - Keypair that will pay for the transaction and own the token
   * @param params - Token creation parameters  
   * @param options - Transaction options
   * @returns Token minting result with addresses and signature
   */
  async createToken22SingleTx(
    payer: import('@solana/web3.js').Keypair,
    params: import('./minting.js').TokenCreationParams,
    options?: import('./minting.js').TransactionOptions
  ): Promise<import('./minting.js').TokenMintResult> {
    const { createToken22SingleTx } = await import('./minting.js');
    const { Connection } = await import('@solana/web3.js');
    const connection = new Connection(this.config.rpcEndpoint, 'confirmed');
    return createToken22SingleTx(connection, payer, params, options);
  }

  /**
   * Create a new NFT using Metaplex Core
   * 
   * @param wallet - Wallet adapter for signing transactions
   * @param params - NFT creation parameters
   * @param options - Transaction options
   * @returns NFT minting result with asset address and signature
   */
  async createNFT(
    wallet: any, // Wallet adapter
    params: import('./minting.js').NFTCreationParams,
    options?: import('./minting.js').TransactionOptions
  ): Promise<import('./minting.js').NFTMintResult> {
    const { createNFT } = await import('./minting.js');
    const { Connection } = await import('@solana/web3.js');
    const connection = new Connection(this.config.rpcEndpoint, 'confirmed');
    return createNFT(connection, wallet, params, options);
  }

  /**
   * Check if a user has sufficient balance for a transaction
   * 
   * @param payer - Public key of the account to check
   * @param estimatedCost - Estimated cost in lamports
   * @returns Balance check result
   */
  async checkSufficientBalance(
    payer: import('@solana/web3.js').PublicKey,
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
    params: import('./minting.js').TokenCreationParams
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
    params: import('./minting.js').NFTCreationParams
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
} 
