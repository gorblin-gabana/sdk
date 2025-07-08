/**
 * Enhanced RPC Client for Gorbchain SDK v2
 * Provides network-aware token operations and custom program support
 */

import { NetworkConfig, getNetworkConfig, detectNetworkFromEndpoint } from '../config/networks.js';

export interface ProgramAccountFilter {
  memcmp?: {
    offset: number;
    bytes: string;
  };
  dataSize?: number;
}

export interface ProgramAccount {
  pubkey: string;
  account: {
    data: [string, string]; // [data, encoding]
    executable: boolean;
    lamports: number;
    owner: string;
    rentEpoch: number;
    space: number;
  };
}

export interface ParsedTokenAccount {
  mint: string;
  owner: string;
  amount: string;
  decimals: number;
  uiAmount: number;
  isInitialized: boolean;
}

export interface ParsedMintAccount {
  mintAuthority: string | null;
  supply: string;
  decimals: number;
  isInitialized: boolean;
  freezeAuthority: string | null;
}

export interface TokenHolding {
  mint: string;
  tokenAccount: string;
  balance: {
    raw: string;
    decimal: number;
    formatted: string;
  };
  decimals: number;
  isNFT: boolean;
  metadata?: {
    name?: string;
    symbol?: string;
    uri?: string;
  };
  mintInfo?: {
    supply?: string;
    mintAuthority?: string;
    freezeAuthority?: string;
    isInitialized?: boolean;
  };
}

export interface TokenConfig {
  /** Custom token programs to scan */
  customPrograms?: string[];
  /** Whether to include standard SPL tokens */
  includeStandardTokens?: boolean;
  /** Whether to include Token-2022 */
  includeToken2022?: boolean;
  /** Maximum concurrent requests */
  maxConcurrentRequests?: number;
}

/**
 * Enhanced RPC Client with network-aware capabilities
 */
export class EnhancedRpcClient {
  private rpcEndpoint: string;
  private networkConfig: NetworkConfig | null;
  private baseRpcClient: any; // The original RPC client

  constructor(rpcEndpoint: string, baseRpcClient: any) {
    this.rpcEndpoint = rpcEndpoint;
    this.baseRpcClient = baseRpcClient;
    this.networkConfig = detectNetworkFromEndpoint(rpcEndpoint);
  }

  /**
   * Get program accounts with filters
   */
  async getProgramAccounts(
    programId: string,
    filters?: ProgramAccountFilter[]
  ): Promise<ProgramAccount[]> {
    const params: any[] = [programId];
    
    if (filters && filters.length > 0) {
      const config: any = {
        encoding: 'base64',
        filters: filters
      };
      params.push(config);
    } else {
      // If no filters, just use basic encoding
      params.push({ encoding: 'base64' });
    }

    try {
      const response = await this.makeRpcCall('getProgramAccounts', params);
      return response.result || [];
    } catch (error) {
      // If complex filters fail, try without filters (less efficient but more compatible)
      if (filters && filters.length > 0) {
        console.warn(`Complex filters failed for program ${programId}, trying without filters:`, (error as Error).message);
        try {
          const simpleResponse = await this.makeRpcCall('getProgramAccounts', [programId, { encoding: 'base64' }]);
          const allAccounts = simpleResponse.result || [];
          
          // Apply filters manually if we got all accounts
          return this.applyFiltersManually(allAccounts, filters);
        } catch (fallbackError) {
          console.warn(`Fallback without filters also failed for program ${programId}:`, (fallbackError as Error).message);
          return [];
        }
      }
      
      // If no filters and still failed, return empty array
      console.warn(`getProgramAccounts failed for program ${programId}:`, (error as Error).message);
      return [];
    }
  }

  /**
   * Apply filters manually to account results
   */
  private applyFiltersManually(accounts: ProgramAccount[], filters: ProgramAccountFilter[]): ProgramAccount[] {
    return accounts.filter(account => {
      for (const filter of filters) {
        // Check dataSize filter
        if (filter.dataSize !== undefined) {
          const dataLength = account.account.data[0] ? Buffer.from(account.account.data[0], 'base64').length : 0;
          if (dataLength !== filter.dataSize) {
            return false;
          }
        }

        // Check memcmp filter
        if (filter.memcmp) {
          try {
            const data = Buffer.from(account.account.data[0], 'base64');
            const { offset, bytes } = filter.memcmp;
            
            // Convert wallet address to bytes for comparison
            const targetBytes = this.addressToBytes(bytes);
            if (!targetBytes) continue;
            
            // Check if we have enough data at the offset
            if (data.length < offset + targetBytes.length) {
              return false;
            }
            
            // Compare bytes at offset
            const dataSlice = data.slice(offset, offset + targetBytes.length);
            if (!dataSlice.equals(targetBytes)) {
              return false;
            }
                     } catch (error) {
             console.warn('Failed to apply memcmp filter:', (error as Error).message);
             return false;
           }
        }
      }
      return true;
    });
  }

  /**
   * Convert address string to bytes for comparison
   */
  private addressToBytes(address: string): Buffer | null {
    try {
      // For Gorbchain, addresses might be in different formats
      // Try base58 decode first
      const { base58ToBytes } = require('../utils/base58');
      return Buffer.from(base58ToBytes(address));
         } catch (error) {
       try {
         // Try as hex if base58 fails
         if (address.startsWith('0x')) {
           return Buffer.from(address.slice(2), 'hex');
         }
         return Buffer.from(address, 'hex');
       } catch (hexError) {
         console.warn('Failed to convert address to bytes:', address, (error as Error).message);
         return null;
       }
     }
  }

  /**
   * Get token accounts by program for a specific wallet
   */
  async getTokenAccountsByProgram(
    walletAddress: string,
    programId: string
  ): Promise<ProgramAccount[]> {
    // Validate wallet address first
    if (!this.isValidAddress(walletAddress)) {
      console.warn(`Invalid wallet address: ${walletAddress}`);
      return [];
    }

    // Try with memcmp filter first
    try {
      const filters: ProgramAccountFilter[] = [
        {
          memcmp: {
            offset: 32, // Owner field offset in token accounts
            bytes: walletAddress
          }
        }
      ];

      const accounts = await this.getProgramAccounts(programId, filters);
      return accounts;
         } catch (error) {
       console.warn(`memcmp filter failed for wallet ${walletAddress} and program ${programId}, trying alternative approach:`, (error as Error).message);
       
       // Fallback: get all accounts and filter manually
       try {
         const allAccounts = await this.getProgramAccounts(programId, []);
         return this.filterAccountsByOwner(allAccounts, walletAddress);
       } catch (fallbackError) {
         console.warn(`Alternative approach failed:`, (fallbackError as Error).message);
         return [];
       }
     }
  }

  /**
   * Validate if an address is in correct format
   */
  private isValidAddress(address: string): boolean {
    if (!address || typeof address !== 'string') return false;
    
    // Basic length and character checks
    if (address.length < 32 || address.length > 44) return false;
    
    // Check for valid base58 characters (or hex if starts with 0x)
    if (address.startsWith('0x')) {
      return /^0x[0-9a-fA-F]+$/.test(address);
    }
    
    // Base58 check (simplified)
    return /^[1-9A-HJ-NP-Za-km-z]+$/.test(address);
  }

  /**
   * Filter accounts by owner manually
   */
  private filterAccountsByOwner(accounts: ProgramAccount[], ownerAddress: string): ProgramAccount[] {
    const filtered: ProgramAccount[] = [];
    
    for (const account of accounts) {
      try {
        // Parse token account to check owner
        if (account.account.data[0]) {
          const data = Buffer.from(account.account.data[0], 'base64');
          if (data.length >= 64) { // Minimum size for token account
            const parsed = this.parseTokenAccount(data);
            if (parsed.owner === ownerAddress) {
              filtered.push(account);
            }
          }
        }
      } catch (parseError) {
        // Skip accounts that can't be parsed
        continue;
      }
    }
    
    return filtered;
  }

  /**
   * Get custom token holdings for a wallet
   */
  async getCustomTokenHoldings(
    walletAddress: string,
    config?: TokenConfig
  ): Promise<TokenHolding[]> {
    const holdings: TokenHolding[] = [];
    const processedMints = new Set<string>();

    // Determine which programs to scan
    const programsToScan = this.getProgramsToScan(config);

    // Scan each program
    for (const programId of programsToScan) {
      try {
        const accounts = await this.getTokenAccountsByProgram(walletAddress, programId);
        
        for (const account of accounts) {
          try {
            const parsed = this.parseTokenAccount(Buffer.from(account.account.data[0], 'base64'));
            
            // Skip if we already processed this mint or if balance is zero
            if (processedMints.has(parsed.mint) || parseFloat(parsed.amount) === 0) {
              continue;
            }
            
            processedMints.add(parsed.mint);

            const holding: TokenHolding = {
              mint: parsed.mint,
              tokenAccount: account.pubkey,
              balance: {
                raw: parsed.amount,
                decimal: parsed.uiAmount,
                formatted: parsed.uiAmount.toString()
              },
              decimals: parsed.decimals,
              isNFT: parsed.uiAmount === 1 && parsed.decimals === 0,
                             metadata: undefined, // Will be populated if metadata is available
               mintInfo: undefined // Will be populated if mint info is available
            };

            // Try to get additional mint information
            try {
              const mintInfo = await this.getMintAccountInfo(parsed.mint);
              if (mintInfo) {
                                 holding.mintInfo = {
                   supply: mintInfo.supply,
                   mintAuthority: mintInfo.mintAuthority ?? undefined,
                   freezeAuthority: mintInfo.freezeAuthority ?? undefined,
                   isInitialized: mintInfo.isInitialized
                 };
              }
            } catch (error) {
              // Mint info not available, continue without it
            }

            holdings.push(holding);
            
          } catch (parseError) {
            console.warn(`Failed to parse token account ${account.pubkey}:`, parseError);
          }
        }
      } catch (error) {
        console.warn(`Failed to scan program ${programId}:`, error);
      }
    }

    return holdings;
  }

  /**
   * Parse token account data from buffer
   */
  parseTokenAccount(data: Buffer): ParsedTokenAccount {
    if (data.length < 72) {
      throw new Error('Invalid token account data length');
    }

    // Token account structure:
    // 0-32: mint (32 bytes)
    // 32-64: owner (32 bytes)
    // 64-72: amount (8 bytes, little endian)
    // 72-73: delegate option (1 byte)
    // 73-74: state (1 byte)
    // 74-75: is_native option (1 byte)
    // 75-83: delegated_amount (8 bytes)
    // 83-115: close_authority option (32 bytes)

    const mint = data.slice(0, 32);
    const owner = data.slice(32, 64);
    const amount = data.readBigUInt64LE(64);
    
    // Try to read decimals from offset 109 if available (some token programs store it there)
    let decimals = 0;
    if (data.length > 109) {
      try {
        decimals = data.readUInt8(109);
      } catch {
        // If reading decimals fails, default to 0
      }
    }

    const mintAddress = this.bufferToBase58(mint);
    const ownerAddress = this.bufferToBase58(owner);
    const amountString = amount.toString();
    const uiAmount = parseFloat(amountString) / Math.pow(10, decimals);

    return {
      mint: mintAddress,
      owner: ownerAddress,
      amount: amountString,
      decimals,
      uiAmount,
      isInitialized: true
    };
  }

  /**
   * Parse mint account data from buffer
   */
  parseMintAccount(data: Buffer): ParsedMintAccount {
    if (data.length < 82) {
      throw new Error('Invalid mint account data length');
    }

    // Mint account structure:
    // 0-4: mint_authority option (4 bytes) + mint_authority (32 bytes if present)
    // 36-44: supply (8 bytes, little endian)
    // 44: decimals (1 byte)
    // 45: is_initialized (1 byte)
    // 46-50: freeze_authority option (4 bytes) + freeze_authority (32 bytes if present)

    const mintAuthorityOption = data.readUInt32LE(0);
    const mintAuthority = mintAuthorityOption === 1 ? this.bufferToBase58(data.slice(4, 36)) : null;
    
    const supply = data.readBigUInt64LE(36);
    const decimals = data.readUInt8(44);
    const isInitialized = data.readUInt8(45) === 1;
    
    const freezeAuthorityOption = data.readUInt32LE(46);
    const freezeAuthority = freezeAuthorityOption === 1 ? this.bufferToBase58(data.slice(50, 82)) : null;

    return {
      mintAuthority,
      supply: supply.toString(),
      decimals,
      isInitialized,
      freezeAuthority
    };
  }

  /**
   * Get mint account information
   */
  async getMintAccountInfo(mintAddress: string): Promise<ParsedMintAccount | null> {
    try {
      const response = await this.makeRpcCall('getAccountInfo', [
        mintAddress,
        { encoding: 'base64' }
      ]);

      if (!response.result?.value?.data) {
        return null;
      }

      const data = Buffer.from(response.result.value.data[0], 'base64');
      return this.parseMintAccount(data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if a specific RPC method is supported
   */
  async isMethodSupported(method: string): Promise<boolean> {
    if (this.networkConfig) {
      return this.networkConfig.supportedMethods.includes(method);
    }

    // If no network config, try to detect by making a test call
    try {
      await this.makeRpcCall(method, []);
      return true;
    } catch (error) {
      const errorMessage = (error as Error).message?.toLowerCase() || '';
      
      // Return false for network errors, timeouts, and unsupported methods
      if (errorMessage.includes('method not found') || 
          errorMessage.includes('not supported') ||
          errorMessage.includes('network') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('connection') ||
          errorMessage.includes('fetch') ||
          errorMessage.includes('http')) {
        return false;
      }
      
      return false; // Default to false for any error
    }
  }

  /**
   * Get list of supported RPC methods
   */
  async getSupportedMethods(): Promise<string[]> {
    if (this.networkConfig) {
      return this.networkConfig.supportedMethods;
    }

    // Fallback: test common methods
    const commonMethods = [
      'getBalance',
      'getSlot',
      'getAccountInfo',
      'getProgramAccounts',
      'getTokenAccountsByOwner',
      'getTokenAccountInfo',
      'getTokenInfo',
      'getSignaturesForAddress',
      'getTransaction'
    ];

    const supportedMethods: string[] = [];
    for (const method of commonMethods) {
      if (await this.isMethodSupported(method)) {
        supportedMethods.push(method);
      }
    }

    return supportedMethods;
  }

  /**
   * Get network configuration
   */
  getNetworkConfig(): NetworkConfig | null {
    return this.networkConfig;
  }

  /**
   * Set network configuration manually
   */
  setNetworkConfig(config: NetworkConfig): void {
    this.networkConfig = config;
  }

  /**
   * Determine which token programs to scan based on config and network
   */
  private getProgramsToScan(config?: TokenConfig): string[] {
    const programs: string[] = [];

    // Add custom programs from config
    if (config?.customPrograms) {
      programs.push(...config.customPrograms);
    }

    // Add network-specific custom programs
    if (this.networkConfig?.tokenPrograms.custom) {
      programs.push(...this.networkConfig.tokenPrograms.custom);
    }

    // Add standard programs if requested and supported
    if (config?.includeStandardTokens !== false && this.networkConfig?.features.standardTokens) {
      if (this.networkConfig.tokenPrograms.spl) {
        programs.push(this.networkConfig.tokenPrograms.spl);
      }
    }

    // Add Token-2022 if requested and supported
    if (config?.includeToken2022 && this.networkConfig?.tokenPrograms.token2022) {
      programs.push(this.networkConfig.tokenPrograms.token2022);
    }

    // Remove duplicates
    return [...new Set(programs)];
  }

  /**
   * Make RPC call to the endpoint
   */
  private async makeRpcCall(method: string, params: any[]): Promise<any> {
    const response = await fetch(this.rpcEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Math.random(),
        method,
        params
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`RPC Error: ${data.error.message}`);
    }

    return data;
  }

  /**
   * Convert buffer to base58 string
   */
  private bufferToBase58(buffer: Buffer): string {
    // This would use the actual base58 implementation from the SDK
    // For now, we'll assume it's available from the utils
    const { bytesToBase58 } = require('../utils/base58');
    return bytesToBase58(new Uint8Array(buffer));
  }

  // Proxy methods to the base RPC client for backward compatibility
  async getBalance(publicKey: string): Promise<number> {
    const accountInfo = await this.baseRpcClient.getAccountInfo(publicKey);
    return accountInfo?.lamports || 0;
  }

  async getSlot(): Promise<number> {
    return this.baseRpcClient.getSlot();
  }

  async getAccountInfo(publicKey: string, encoding?: string): Promise<any> {
    return this.baseRpcClient.getAccountInfo(publicKey, encoding);
  }

  async getSignaturesForAddress(address: string, options?: any): Promise<any[]> {
    return this.baseRpcClient.request('getSignaturesForAddress', [address, options]);
  }

  async getTransaction(signature: string, options?: any): Promise<any> {
    return this.baseRpcClient.request('getTransaction', [signature, options]);
  }

  // Network-aware token methods with fallbacks
  async getTokenAccountsByOwner(walletAddress: string, filter: any, commitment?: string): Promise<any[]> {
    // Check if the method is supported
    if (await this.isMethodSupported('getTokenAccountsByOwner')) {
      return this.baseRpcClient.getTokenAccountsByOwner(walletAddress, filter, commitment);
    }

    // Fallback: use custom implementation for unsupported networks
    if (filter.programId) {
      const accounts = await this.getTokenAccountsByProgram(walletAddress, filter.programId);
      return accounts.map(account => ({
        pubkey: account.pubkey,
        account: account.account
      }));
    }

    throw new Error('getTokenAccountsByOwner not supported and no fallback available');
  }

  async getTokenAccountInfo(tokenAccount: string, commitment?: string): Promise<any> {
    // Check if the method is supported
    if (await this.isMethodSupported('getTokenAccountInfo')) {
      return this.baseRpcClient.getTokenAccountInfo(tokenAccount, commitment);
    }

    // Fallback: manually parse account data
    const accountInfo = await this.getAccountInfo(tokenAccount, 'base64');
    if (!accountInfo?.data) {
      return null;
    }

    const data = Buffer.from(accountInfo.data[0], 'base64');
    const parsed = this.parseTokenAccount(data);

    return {
      mint: parsed.mint,
      owner: parsed.owner,
      tokenAmount: {
        amount: parsed.amount,
        decimals: parsed.decimals,
        uiAmount: parsed.uiAmount,
        uiAmountString: parsed.uiAmount.toString()
      }
    };
  }

  async getTokenInfo(mintAddress: string): Promise<any> {
    // Check if the method is supported
    if (await this.isMethodSupported('getTokenInfo')) {
      return this.baseRpcClient.getTokenInfo(mintAddress);
    }

    // Fallback: manually get mint info
    const mintInfo = await this.getMintAccountInfo(mintAddress);
    if (!mintInfo) {
      return null;
    }

    return {
      supply: mintInfo.supply,
      decimals: mintInfo.decimals,
      mintAuthority: mintInfo.mintAuthority,
      freezeAuthority: mintInfo.freezeAuthority,
      isInitialized: mintInfo.isInitialized,
      isNFT: mintInfo.decimals === 0 && mintInfo.supply === '1'
    };
  }
} 