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
import { DecoderRegistry } from '../decoders/registry.js';
import { getDefaultConfig, validateConfig } from './config.js';
import type { GorbchainSDKConfig, RichTransaction, TransactionDecodingOptions } from './types.js';

// Import all decoders at the top to avoid browser require() issues
import { decodeSystemInstruction } from '../decoders/system.js';
import { decodeSPLTokenInstruction } from '../decoders/splToken.js';
import { decodeToken2022Instruction } from '../decoders/token2022.js';
import { decodeATAInstruction } from '../decoders/ata.js';
import { decodeNFTInstruction } from '../decoders/nft.js';

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
      const decoded = decodeSystemInstruction(instruction.data);
      return {
        type: decoded.type,
        programId: instruction.programId,
        data: {
          instruction: decoded.instruction,
          lamports: decoded.lamports,
          space: decoded.space,
          seed: decoded.seed
        },
        accounts: instruction.accounts || [],
        raw: instruction
      };
    });

    // Register SPL Token decoder
    const splTokenProgramId = this.config.programIds?.splToken || 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
    registry.register('spl-token', splTokenProgramId, (instruction: any) => {
      const decoded = decodeSPLTokenInstruction(instruction);
      return {
        type: decoded.type,
        programId: instruction.programId,
        data: decoded,
        accounts: instruction.accounts || [],
        raw: instruction
      };
    });

    // Register Token-2022 decoder
    const token2022ProgramId = this.config.programIds?.token2022 || 'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn';
    registry.register('token-2022', token2022ProgramId, (instruction: any) => {
      const decoded = decodeToken2022Instruction(instruction);
      return {
        type: decoded.type,
        programId: instruction.programId,
        data: decoded,
        accounts: instruction.accounts || [],
        raw: instruction
      };
    });

    // Register ATA decoder
    const ataProgramId = this.config.programIds?.ata || '4YpYoLVTQ8bxcne9GneN85RUXeN7pqGTwgPcY71ZL5gX';
    registry.register('ata', ataProgramId, (instruction: any) => {
      const decoded = decodeATAInstruction(instruction);
      return {
        type: decoded.type,
        programId: instruction.programId,
        data: decoded,
        accounts: instruction.accounts || [],
        raw: instruction
      };
    });

    // Register NFT/Metaplex decoder
    const metaplexProgramId = this.config.programIds?.metaplex || 'BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc';
    registry.register('nft', metaplexProgramId, (instruction: any) => {
      const decoded = decodeNFTInstruction(instruction);
      return {
        type: decoded.type,
        programId: instruction.programId,
        data: decoded,
        accounts: instruction.accounts || [],
        raw: instruction
      };
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
   * This method makes additional RPC calls to fetch token info, metadata, and account details
   */
  async getAndDecodeTransaction(
    signature: string, 
    options: TransactionDecodingOptions = {}
  ): Promise<RichTransaction> {
    // Merge options with SDK defaults
    const useRichDecoding = options.richDecoding ?? this.config.richDecoding?.enabled ?? true;
    const includeTokenMetadata = options.includeTokenMetadata ?? this.config.richDecoding?.includeTokenMetadata ?? true;
    
    try {
      // Step 1: Fetch raw transaction
      const rawTransaction = await this.rpc.request('getTransaction', [
        signature,
        { 
          maxSupportedTransactionVersion: 0,
          encoding: 'jsonParsed',
          commitment: 'confirmed'
        }
      ]) as any;

      if (!rawTransaction || !rawTransaction.transaction) {
        throw new Error(`Transaction not found: ${signature}`);
      }

      // Extract account keys
      let accountKeys: string[] = [];
      if (rawTransaction.transaction.message?.accountKeys && Array.isArray(rawTransaction.transaction.message.accountKeys)) {
        accountKeys = rawTransaction.transaction.message.accountKeys.map((key: any) => {
          return typeof key === 'string' ? key : (key.pubkey || key);
        });
      }

      // Step 2: Process instructions to create RICH enriched structure
      const instructions = rawTransaction.transaction?.message?.instructions || [];
      const enrichedInstructions: any[] = [];
      const programs = new Set<string>();
      const involvedMints = new Set<string>();
      const involvedTokenAccounts = new Set<string>();
      
      // First pass: decode instructions and identify tokens
      for (let i = 0; i < instructions.length; i++) {
        const instruction = instructions[i];
        const programId = instruction.programId;
        
        let decodedInstruction: any;
        
        // Handle different instruction formats
        if (instruction.parsed) {
          // For parsed instructions (like system), use parsed data directly
          decodedInstruction = this.decodeParsedInstruction(instruction.parsed, instruction.program);
        } else {
          // For unparsed instructions, convert base64 data to Uint8Array and decode
          let instructionData: Uint8Array;
          
          if (instruction.data && typeof instruction.data === 'string') {
            // Convert base64 string to Uint8Array
            try {
              const binaryString = atob(instruction.data);
              instructionData = new Uint8Array(binaryString.length);
              for (let j = 0; j < binaryString.length; j++) {
                instructionData[j] = binaryString.charCodeAt(j);
              }
            } catch (error) {
              // Try to fix common base64 issues
              let cleanedData = instruction.data.replace(/[^A-Za-z0-9+/]/g, '');
              while (cleanedData.length % 4 !== 0) {
                cleanedData += '=';
              }
              try {
                const binaryString = atob(cleanedData);
                instructionData = new Uint8Array(binaryString.length);
                for (let j = 0; j < binaryString.length; j++) {
                  instructionData[j] = binaryString.charCodeAt(j);
                }
              } catch (cleanupError) {
                instructionData = new Uint8Array(0);
              }
            }
          } else {
            instructionData = new Uint8Array(0);
          }
          
          // Decode using the decoder registry
          try {
            decodedInstruction = this.decoders.decode({
              programId,
              data: instructionData,
              accounts: instruction.accounts || []
            });
          } catch (error) {
            decodedInstruction = {
              type: 'error',
              data: {
                error: (error as Error).message,
                programId,
                originalData: instruction.data
              }
            };
          }
        }
        
        // Identify involved tokens and accounts for rich data fetching
        if (instruction.accounts) {
          for (const accountItem of instruction.accounts) {
            let accountAddress: string;
            
            // Handle both cases: account indices and direct account addresses
            if (typeof accountItem === 'number') {
              // Account item is an index, map it to account address
              accountAddress = accountKeys[accountItem];
            } else if (typeof accountItem === 'string') {
              // Account item is already an address
              accountAddress = accountItem;
            } else {
              continue; // Skip invalid entries
            }
            
            if (accountAddress) {
              // For token programs, collect potential mints and token accounts
              if (programId === this.config.programIds?.token2022 || 
                  programId === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
                involvedTokenAccounts.add(accountAddress);
              }
            }
          }
        }
        
        const programName = this.getProgramName(programId);
        programs.add(programName);
        
        enrichedInstructions.push({
          instruction: i + 1,
          program: programName,
          programId,
          decoded: decodedInstruction,
          accounts: instruction.accounts?.map((idx: number) => accountKeys[idx]) || [],
          rawInstruction: instruction
        });
      }
      
      // Step 2.5: Make RPC calls to get RICH token information
      const tokenInfoMap = new Map<string, any>();
      const accountInfoMap = new Map<string, any>();
      
      if (useRichDecoding && includeTokenMetadata) {
        // Fetch account info for all involved accounts
        const accountInfoPromises = Array.from(involvedTokenAccounts).map(async (address) => {
          try {
            const accountInfo = await this.rpc.getAccountInfo(address);
            if (accountInfo) {
              accountInfoMap.set(address, accountInfo);
              
              // If this is a token account, get its mint
              if (accountInfo.owner === this.config.programIds?.token2022 || 
                  accountInfo.owner === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
                try {
                  const tokenAccountInfo = await this.rpc.getTokenAccountInfo(address);
                  if (tokenAccountInfo?.mint) {
                    involvedMints.add(tokenAccountInfo.mint);
                  }
                } catch (err) {
                  // Address might be a mint, not a token account
                  involvedMints.add(address);
                }
              }
            }
          } catch (error) {
            console.warn(`Failed to fetch account info for ${address}:`, error);
          }
        });
        
        await Promise.all(accountInfoPromises);
        
        // Fetch token info for all identified mints
        const tokenInfoPromises = Array.from(involvedMints).map(async (mintAddress) => {
          try {
            const tokenInfo = await this.rpc.getTokenInfo(mintAddress);
            if (tokenInfo) {
              tokenInfoMap.set(mintAddress, tokenInfo);
            }
          } catch (error) {
            console.warn(`Failed to fetch token info for ${mintAddress}:`, error);
          }
        });
        
        await Promise.all(tokenInfoPromises);
      }
      
      // Step 3: Create rich simplified instructions with actual token data
      const simpleInstructions: any[] = [];
      
      for (const enriched of enrichedInstructions) {
        const { decoded, program, accounts } = enriched;
        
        let action = 'Unknown';
        let description = 'Unknown operation';
        let instructionData: any = {};
        
        // Map instruction types to human-readable actions with RICH data
        switch (decoded.type) {
          case 'system-transfer':
            action = 'Transfer SOL';
            const lamports = decoded.data?.lamports || decoded.info?.lamports || 0;
            const sol = Number(lamports) / 1e9;
            description = `Transfer ${sol} SOL`;
            instructionData = {
              amount: `${sol} SOL`,
              lamports,
              from: decoded.data?.source || decoded.info?.source,
              to: decoded.data?.destination || decoded.info?.destination
            };
            break;
            
          case 'token2022-initialize-nft-metadata':
            action = 'Create NFT';
            const nftName = decoded.data?.metadata?.name || 'Unknown NFT';
            description = `Create NFT: ${nftName}`;
            instructionData = {
              name: nftName,
              symbol: decoded.data?.metadata?.symbol || 'UNK',
              uri: decoded.data?.metadata?.uri,
              mint: decoded.data?.mint
            };
            break;
            
          case 'token2022-mint-to':
            action = 'Mint Tokens';
            // Try to get rich token info for proper formatting
            let mintAddress = accounts[0]; // Usually first account is mint
            let tokenInfo = tokenInfoMap.get(mintAddress);
            let formattedAmount = decoded.data?.amount || '0';
            
            if (tokenInfo && decoded.data?.amount) {
              const rawAmount = BigInt(decoded.data.amount);
              const uiAmount = Number(rawAmount) / (10 ** tokenInfo.decimals);
              formattedAmount = `${uiAmount} ${tokenInfo.metadata?.symbol || 'tokens'}`;
            }
            
            description = `Mint ${formattedAmount}`;
            instructionData = {
              amount: formattedAmount,
              rawAmount: decoded.data?.amount,
              mint: mintAddress,
              tokenInfo: tokenInfo ? {
                name: tokenInfo.metadata?.name,
                symbol: tokenInfo.metadata?.symbol,
                decimals: tokenInfo.decimals
              } : undefined,
              to: decoded.data?.destination,
              authority: decoded.data?.authority
            };
            break;
            
          case 'ata-create':
            action = 'Create Token Account';
            description = 'Create Associated Token Account';
            instructionData = {
              account: decoded.data?.account,
              owner: decoded.data?.owner,
              mint: decoded.data?.mint
            };
            break;
            
          case 'token2022-generic':
            action = 'Token-2022 Operation';
            description = decoded.data?.description || 'Token-2022 operation';
            instructionData = decoded.data || {};
            break;
            
          case 'error':
            action = 'Error';
            description = `Failed to decode ${program} instruction`;
            instructionData = decoded.data || {};
            break;
            
          default:
            // Handle token2022-extension-* types
            if (decoded.type?.startsWith('token2022-extension-')) {
              action = decoded.type;
              description = decoded.data?.description || `${program} operation`;
              instructionData = decoded.data || {};
            } else {
              action = decoded.type || 'Unknown';
              description = `${program} operation`;
              instructionData = decoded.data || {};
            }
        }
        
        simpleInstructions.push({
          instruction: enriched.instruction,
          program,
          action,
          description,
          data: instructionData
        });
      }
      
      // Step 4: Build simplified token metadata and transaction description
      const tokenMetadata = this.buildSimpleTokenMetadata(tokenInfoMap, simpleInstructions);
      const transactionSummary = this.buildSimpleTransactionSummary(simpleInstructions);
        
        // Step 6: Return enriched rich transaction
      const richTransaction: RichTransaction = {
        signature,
        slot: rawTransaction.slot || 0,
        blockTime: rawTransaction.blockTime || Date.now() / 1000,
        fee: rawTransaction.meta?.fee || 0,
        status: rawTransaction.meta?.err ? 'failed' : 'success',
        
        summary: {
          type: transactionSummary.type,
          description: transactionSummary.description,
          programsUsed: Array.from(programs),
          instructionCount: simpleInstructions.length,
          computeUnits: rawTransaction.meta?.computeUnitsConsumed || 0
        },
        
        tokens: tokenMetadata.tokens.length > 0 ? {
          created: tokenMetadata.tokens,
          operations: tokenMetadata.operations
        } : undefined,
        
        instructions: simpleInstructions,
        
        accountChanges: this.extractAccountChanges(rawTransaction, simpleInstructions),
        
        // Include raw data only if requested
        raw: useRichDecoding ? {
          meta: rawTransaction.meta,
          accountKeys,
          fullInstructions: instructions
        } : undefined
      };
      
      return richTransaction;
      
    } catch (error) {
      throw new Error(`Failed to decode transaction: ${error}`);
    }
  }
  
  /**
   * Extract account changes from transaction
   */
  private extractAccountChanges(rawTransaction: any, simpleInstructions: any[]): any {
    const changes: any = {};
    
    // Extract SOL transfers
    const solTransfers = simpleInstructions
      .filter(ix => ix.action === 'Transfer SOL')
      .map(ix => ({
        amount: ix.data.amount,
        from: ix.data.from,
        to: ix.data.to,
        lamports: ix.data.lamports
      }));
    
    if (solTransfers.length > 0) {
      changes.solTransfers = solTransfers;
    }
    
    // Extract token transfers
    const tokenTransfers = simpleInstructions
      .filter(ix => ix.action === 'Transfer Tokens')
      .map(ix => ({
        mint: ix.data.mint,
        amount: ix.data.amount,
        from: ix.data.from,
        to: ix.data.to
      }));
    
    if (tokenTransfers.length > 0) {
      changes.tokenTransfers = tokenTransfers;
    }
    
    // Extract account creations
    const accountsCreated = simpleInstructions
      .filter(ix => ix.action === 'Create Token Account')
      .map(ix => ix.data.account)
      .filter(Boolean);
    
    if (accountsCreated.length > 0) {
      changes.accountsCreated = accountsCreated;
    }
    
    return Object.keys(changes).length > 0 ? changes : undefined;
  }
  
  /**
   * Get human-readable program name
   */
  private getProgramName(programId: string): string {
    const programNames: { [key: string]: string } = {
      '11111111111111111111111111111111': 'System',
      'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn': 'Token-2022',
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'SPL Token',
      '4YpYoLVTQ8bxcne9GneN85RUXeN7pqGTwgPcY71ZL5gX': 'ATA',
      'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL': 'ATA'
    };
    
    return programNames[programId] || programId.slice(0, 8) + '...';
  }

  /**
   * Get raw transaction data without rich decoding
   */
  async getTransaction(signature: string): Promise<any> {
    try {
      const rawTransaction = await this.rpc.request('getTransaction', [
        signature,
        { 
          maxSupportedTransactionVersion: 0,
          encoding: 'jsonParsed',
          commitment: 'confirmed'
        }
      ]) as any;

      if (!rawTransaction || !rawTransaction.transaction) {
        throw new Error(`Transaction not found: ${signature}`);
      }

      return rawTransaction;
    } catch (error) {
      throw new Error(`Failed to fetch transaction: ${error}`);
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
   * Classify transaction type based on instructions and programs
   */
  private classifyTransactionType(instructions: any[], accountKeys: string[]): { type: string; subtype: string } {
    const programs = instructions.map((ix: any) => ix.programId);
    const hasTokenProgram = programs.some(p => 
      p === this.config.programIds?.token2022 || 
      p === this.config.programIds?.splToken ||
      p === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' ||
      p === 'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn'
    );
    const hasSystemProgram = programs.some(p => p === '11111111111111111111111111111111');
    
    if (hasTokenProgram) {
      const tokenInstructions = instructions.filter((ix: any) => 
        ix.programId === this.config.programIds?.token2022 || 
        ix.programId === this.config.programIds?.splToken ||
        ix.programId === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' ||
        ix.programId === 'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn'
      );
      
      const tokenTypes = tokenInstructions.map((ix: any) => {
        if (ix.parsed?.type) return ix.parsed.type;
        return 'unknown';
      });
      
      if (tokenTypes.includes('createAccount') || instructions.some((ix: any) => 
          ix.parsed?.type === 'createAccount' && ix.parsed?.info?.owner === 'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn')) {
        return { type: 'Token Transaction', subtype: 'Token Creation/Account Setup' };
      } else if (tokenTypes.includes('transfer')) {
        return { type: 'Token Transaction', subtype: 'Token Transfer' };
      } else if (tokenTypes.includes('burn')) {
        return { type: 'Token Transaction', subtype: 'Token Burn' };
      } else if (tokenTypes.includes('mintTo')) {
        return { type: 'Token Transaction', subtype: 'Token Minting' };
      } else {
        return { type: 'Token Transaction', subtype: 'Token Operation' };
      }
    } else if (hasSystemProgram) {
      return { type: 'System Transaction', subtype: 'Account Management' };
    }
    
    return { type: 'Unknown Transaction', subtype: 'Mixed Operations' };
  }

  /**
   * Build simplified, human-readable token metadata from decoded instructions
   */
  private async buildTokenMetadata(instructions: any[], decodedAccounts: Map<string, any>, accountInfoMap: Map<string, any>): Promise<any> {
    const operations: any[] = [];
    const tokens: any[] = [];
    const summary = {
      type: 'unknown',
      description: '',
      tokenCount: 0,
      totalValue: 0
    };
    
    // Process each instruction to extract meaningful token operations
    for (let i = 0; i < instructions.length; i++) {
      const instruction = instructions[i];
      const programId = instruction.programId;
      
      // Skip non-token instructions
      if (programId !== this.config.programIds?.token2022 && 
          programId !== this.config.programIds?.splToken &&
          programId !== 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' &&
          programId !== 'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn') {
        continue;
      }
      
      // Decode the instruction to get meaningful data
      const decodedInstruction = this.decoders.decode({
        programId,
        data: instruction.data,
        accounts: instruction.accounts || []
      });
      
      let operation: any = {
        instruction: i + 1,
        type: decodedInstruction.type,
        program: programId === 'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn' ? 'Token-2022' : 'SPL Token'
      };
      
      // Extract specific data based on instruction type
      if (decodedInstruction.type === 'token2022-initialize-nft-metadata') {
        operation = {
          ...operation,
          action: 'Create NFT',
          tokenName: decodedInstruction.data?.metadata?.name || 'Unknown NFT',
          tokenSymbol: decodedInstruction.data?.metadata?.symbol || 'UNK',
          tokenUri: decodedInstruction.data?.metadata?.uri,
          mint: decodedInstruction.data?.mint,
          description: `Created NFT: ${decodedInstruction.data?.metadata?.name || 'Unknown'}`
        };
        
        // Add to tokens list
        tokens.push({
          mint: decodedInstruction.data?.mint,
          name: decodedInstruction.data?.metadata?.name || 'Unknown NFT',
          symbol: decodedInstruction.data?.metadata?.symbol || 'UNK',
          type: 'NFT',
          uri: decodedInstruction.data?.metadata?.uri,
          supply: '1', // NFTs typically have supply of 1
          decimals: 0
        });
        
      } else if (decodedInstruction.type === 'token2022-mint-to') {
        const amount = decodedInstruction.data?.amount || '0';
        operation = {
          ...operation,
          action: 'Mint Tokens',
          amount: amount,
          mint: decodedInstruction.data?.mint,
          destination: decodedInstruction.data?.destination,
          authority: decodedInstruction.data?.authority,
          description: `Minted ${amount} tokens`
        };
        
      } else if (decodedInstruction.type === 'token2022-transfer') {
        const amount = decodedInstruction.data?.amount || '0';
        operation = {
          ...operation,
          action: 'Transfer Tokens',
          amount: amount,
          source: decodedInstruction.data?.source,
          destination: decodedInstruction.data?.destination,
          description: `Transferred ${amount} tokens`
        };
        
      } else if (decodedInstruction.type === 'system-transfer') {
        const lamports = decodedInstruction.data?.lamports || 0;
        const sol = Number(lamports) / 1e9;
        operation = {
          ...operation,
          action: 'Transfer SOL',
          amount: `${sol} SOL`,
          source: decodedInstruction.data?.source,
          destination: decodedInstruction.data?.destination,
          description: `Transferred ${sol} SOL`
        };
      }
      
      operations.push(operation);
    }
    
    // Create summary
    if (operations.length > 0) {
      const mainOperation = operations[0];
      summary.type = mainOperation.action || 'Token Operation';
      summary.description = operations.map(op => op.description).join(', ');
      summary.tokenCount = tokens.length;
    }
    
    return {
      operations,
      tokens,
      summary,
      mints: tokens.map(t => t.mint).filter(Boolean),
      accounts: [],
      totalValue: 0
    };
  }

  /**
   * Build rich token metadata using fetched token information from RPC calls
   */
  private buildSimpleTokenMetadata(tokenInfoMap: Map<string, any>, simpleInstructions: any[]): any {
    const tokens: any[] = [];
    const operations: any[] = [];
    
    // Extract tokens from the tokenInfoMap - keep it simple
    for (const [mintAddress, tokenInfo] of tokenInfoMap.entries()) {
      // Simple token/NFT detection: if decimals = 0, it's an NFT
      const isNFT = tokenInfo.decimals === 0;
      
      // Extract name and symbol from NFT metadata if available
      let name = tokenInfo.metadata?.name || 'Unknown Token';
      let symbol = tokenInfo.metadata?.symbol || 'UNK';
      
      // Try to extract NFT metadata from instructions
      const nftInstruction = simpleInstructions.find(ix => 
        ix.program === 'Token-2022' && 
        ix.data?.accounts?.includes(mintAddress) && 
        ix.data?.raw?.data
      );
      
      if (nftInstruction && isNFT) {
        const extractedMetadata = this.extractNFTMetadataFromInstruction(nftInstruction.data.raw.data);
        if (extractedMetadata) {
          name = extractedMetadata.name || name;
          symbol = extractedMetadata.symbol || symbol;
        }
      }
      
      tokens.push({
        mint: mintAddress,
        name,
        symbol,
        type: isNFT ? 'NFT' : 'Token',
        isNFT,
        decimals: tokenInfo.decimals || 0,
        supply: {
          raw: tokenInfo.supply || '0',
          formatted: isNFT ? '1' : tokenInfo.supply || '0',
          total: isNFT ? '1 (NFT)' : `${tokenInfo.supply || '0'} ${symbol}`
        },
        authorities: {
          mint: tokenInfo.mintAuthority || null,
          freeze: tokenInfo.freezeAuthority || null,
          update: tokenInfo.updateAuthority || null
        },
        metadata: {
          uri: tokenInfo.metadata?.uri || null,
          description: tokenInfo.metadata?.description || null,
          image: tokenInfo.metadata?.image || null,
          attributes: tokenInfo.metadata?.attributes || []
        }
      });
    }
    
    // Simple operations list
    for (const instruction of simpleInstructions) {
      operations.push({
        instruction: instruction.instruction,
        type: instruction.action,
        program: instruction.program,
        description: instruction.description
      });
    }
    
    return {
      tokens,
      operations
    };
  }

  private buildSimpleTransactionSummary(simpleInstructions: any[]): { type: string; description: string } {
    if (simpleInstructions.length === 0) {
      return { type: 'Empty Transaction', description: 'No instructions found' };
    }
    
    // Count operation types
    const hasSOLTransfer = simpleInstructions.some(ix => ix.action === 'Transfer SOL');
    const hasTokenOps = simpleInstructions.some(ix => ix.program === 'Token-2022');
    const hasATACreation = simpleInstructions.some(ix => ix.program === 'ATA');
    const hasNFTOps = simpleInstructions.some(ix => ix.action.includes('NFT') || ix.action.includes('Create NFT'));
    
    // Generate simple transaction type
    let type: string;
    if (hasNFTOps) {
      type = 'NFT Creation';
    } else if (hasTokenOps && hasATACreation) {
      type = 'Token Account Setup';
    } else if (hasSOLTransfer && !hasTokenOps) {
      type = 'SOL Transfer';
    } else if (hasTokenOps) {
      type = 'Token Operation';
    } else {
      type = 'General Transaction';
    }
    
    // Generate simple description
    const descriptions = simpleInstructions.map(ix => ix.description).slice(0, 3); // Max 3 descriptions
    let description = descriptions.join(', ');
    if (simpleInstructions.length > 3) {
      description += `, and ${simpleInstructions.length - 3} more operations`;
    }
    
    return { type, description };
  }

  private extractNFTMetadataFromInstruction(rawData: any): { name?: string; symbol?: string; uri?: string } | null {
    try {
      // Convert raw data to array if it's an object
      const dataArray = Array.isArray(rawData) ? rawData : Object.values(rawData);
      
      // For Token-2022 metadata instructions, don't extract metadata from instruction data
      // The metadata is stored in the mint account, not in the instruction data
      // Instruction 232 is just triggering a metadata update, not storing actual metadata
      if (dataArray.length >= 1 && dataArray[0] === 232) {
        // This is a Token-2022 metadata instruction, but the actual metadata
        // should be retrieved from the mint account via RPC calls
        return null;
      }
      
      // For other instruction types, you could add proper parsing here
      // But for now, return null to rely on RPC-based metadata extraction
      return null;
    } catch (error) {
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
        // Browser-compatible base64 decoding
        const binaryString = atob(data);
        bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
      } else if (Array.isArray(data)) {
        bytes = new Uint8Array(data);
      } else if (data[0] && Array.isArray(data[0])) {
        // Handle [data, encoding] format - data[0] is the array, data[1] is encoding
        bytes = new Uint8Array(data[0]);
      } else {
        bytes = data;
      }

      // Token-2022 and SPL Token mint account structure
      if (bytes.length >= 82) {
        const view = new DataView(bytes.buffer, bytes.byteOffset);
        
        // Read supply (8 bytes, little endian)
        const supply = view.getBigUint64(0, true);
        
        // Read decimals (1 byte at offset 44)
        const decimals = view.getUint8(44);
        
        // Read initialization flag (1 byte at offset 45)
        const isInitialized = view.getUint8(45) === 1;
        
        // Read mint authority (32 bytes at offset 4)
        // First check if there's a mint authority (1 byte at offset 4)
        const hasMintAuthority = view.getUint8(4) === 1;
        let mintAuthority = null;
        if (hasMintAuthority) {
          const mintAuthorityBytes = bytes.slice(5, 37);
          mintAuthority = this.bytesToBase58(mintAuthorityBytes);
        }
        
        // Read freeze authority (32 bytes at offset 37)
        // First check if there's a freeze authority (1 byte at offset 37)
        const hasFreezeAuthority = view.getUint8(37) === 1;
        let freezeAuthority = null;
        if (hasFreezeAuthority) {
          const freezeAuthorityBytes = bytes.slice(38, 70);
          freezeAuthority = this.bytesToBase58(freezeAuthorityBytes);
        }
        
        return {
          type: 'mint-account',
          data: {
            supply: supply.toString(),
            decimals,
            isInitialized,
            mintAuthority,
            freezeAuthority,
            // Calculate UI amount if supply > 0
            uiAmount: decimals > 0 ? (Number(supply) / Math.pow(10, decimals)).toString() : supply.toString()
          }
        };
      }
      
      return {
        type: 'mint-account',
        error: 'Invalid mint account data length',
        dataLength: bytes.length
      };
    } catch (error) {
      console.error('🔥 MINT: Failed to decode mint account:', error);
      return {
        type: 'mint-account',
        error: `Failed to decode: ${error}`
      };
    }
  }

  /**
   * Convert bytes to base58 address (Solana format)
   */
  private bytesToBase58(bytes: Uint8Array): string {
    try {
      const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
      
      // Handle empty input
      if (bytes.length === 0) return '';
      
      // Convert to big integer for base58 encoding
      let num = BigInt(0);
      for (let i = 0; i < bytes.length; i++) {
        num = num * BigInt(256) + BigInt(bytes[i]);
      }
      
      // Convert to base58
      let result = '';
      while (num > BigInt(0)) {
        const remainder = num % BigInt(58);
        result = alphabet[Number(remainder)] + result;
        num = num / BigInt(58);
      }
      
      // Add leading zeros
      for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
        result = '1' + result;
      }
      
      return result;
    } catch (error) {
      console.warn('Failed to convert bytes to base58:', error);
      return 'invalid-address';
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
        // Browser-compatible base64 decoding
        const binaryString = atob(data);
        bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
      } else if (Array.isArray(data)) {
        bytes = new Uint8Array(data);
      } else if (data[0] && Array.isArray(data[0])) {
        // Handle [data, encoding] format - data[0] is the array, data[1] is encoding
        bytes = new Uint8Array(data[0]);
      } else {
        bytes = data;
      }

      // Token account structure (165 bytes for standard accounts)
      if (bytes.length >= 165) {
        const view = new DataView(bytes.buffer, bytes.byteOffset);
        
        // Read mint address (32 bytes at offset 0)
        const mintBytes = bytes.slice(0, 32);
        const mint = this.bytesToBase58(mintBytes);
        
        // Read owner address (32 bytes at offset 32)
        const ownerBytes = bytes.slice(32, 64);
        const owner = this.bytesToBase58(ownerBytes);
        
        // Read amount (8 bytes at offset 64, little endian)
        const amount = view.getBigUint64(64, true);
        
        // Read delegate option (1 + 32 bytes at offset 72)
        const hasDelegateOption = view.getUint8(72) === 1;
        let delegate = null;
        if (hasDelegateOption) {
          const delegateBytes = bytes.slice(73, 105);
          delegate = this.bytesToBase58(delegateBytes);
        }
        
        // Read state (1 byte at offset 105)
        const state = view.getUint8(105);
        const isInitialized = state === 1;
        const isFrozen = state === 2;
        
        // Read delegated amount (8 bytes at offset 106)
        const delegatedAmount = view.getBigUint64(106, true);
        
        // Read close authority option (1 + 32 bytes at offset 114)
        const hasCloseAuthority = view.getUint8(114) === 1;
        let closeAuthority = null;
        if (hasCloseAuthority) {
          const closeAuthorityBytes = bytes.slice(115, 147);
          closeAuthority = this.bytesToBase58(closeAuthorityBytes);
        }
        
        return {
          type: 'token-account',
          data: {
            mint,
            owner,
            amount: amount.toString(),
            delegate,
            delegatedAmount: delegatedAmount.toString(),
            closeAuthority,
            isInitialized,
            isFrozen,
            state: isInitialized ? 'initialized' : isFrozen ? 'frozen' : 'uninitialized'
          }
        };
      }
      
      return {
        type: 'token-account',
        error: 'Invalid token account data length',
        dataLength: bytes.length
      };
    } catch (error) {
      console.error('🔥 TOKEN: Failed to decode token account:', error);
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

  /**
   * Generate a meaningful transaction name based on the instructions
   */
  private generateTransactionName(instructions: any[]): string {
    if (instructions.length === 0) return 'Empty Transaction';
    
    // Get all unique actions, excluding errors
    const actions = instructions
      .filter(ix => ix.action !== 'Error')
      .map(ix => ix.action);
    
    const uniqueActions = [...new Set(actions)];
    
    // If all instructions failed, return error
    if (uniqueActions.length === 0) {
      return 'Failed Transaction';
    }
    
    // Single operation types
    if (uniqueActions.length === 1) {
      const action = uniqueActions[0];
      return action === 'Unknown' ? 'Unknown Transaction' : action;
    }
    
    // Multiple operations - generate compound name
    const hasNFTCreation = uniqueActions.includes('Create NFT');
    const hasTokenCreation = uniqueActions.includes('Create Token Account');
    const hasTokenMinting = uniqueActions.includes('Mint Tokens');
    const hasSOLTransfer = uniqueActions.includes('Transfer SOL');
    const hasTokenTransfer = uniqueActions.includes('Transfer Tokens');
    
    // NFT creation workflow
    if (hasNFTCreation) {
      return 'NFT Creation';
    }
    
    // Token creation workflow
    if (hasTokenCreation && hasTokenMinting) {
      return 'Token Creation & Minting';
    }
    
    if (hasTokenCreation) {
      return 'Token Account Setup';
    }
    
    // Transfer operations
    if (hasSOLTransfer && hasTokenTransfer) {
      return 'SOL & Token Transfer';
    }
    
    if (hasSOLTransfer && uniqueActions.length === 1) {
      return 'SOL Transfer';
    }
    
    if (hasTokenTransfer && uniqueActions.length === 1) {
      return 'Token Transfer';
    }
    
    // Complex operations
    if (uniqueActions.length > 3) {
      return 'Complex Transaction';
    }
    
    // Default for 2-3 operations
    return 'Multi-Operation Transaction';
  }
} 
