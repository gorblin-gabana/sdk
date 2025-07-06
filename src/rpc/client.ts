// RPC Client - Main connection and client management
import { getGorbchainConfig } from '../utils/gorbchainConfig.js';
import type { RpcResponse } from './accounts.js';
import {
  RpcNetworkError,
  RpcTimeoutError,
  RpcServerError,
  RpcConnectionError,
  RpcInvalidResponseError,
  RpcRateLimitError,
  RpcMethodNotSupportedError,
  type ErrorContext
} from '../errors/index.js';
import { RetryManager, type RetryOptions, type CircuitBreakerOptions } from '../errors/retry.js';

export interface RpcClientOptions {
  rpcUrl?: string;
  timeout?: number;
  retries?: number;
  retryOptions?: RetryOptions;
  circuitBreakerOptions?: CircuitBreakerOptions;
}

export class RpcClient {
  private rpcUrl: string;
  private timeout: number;
  private retries: number;
  private requestId: number = 1;
  private retryManager: RetryManager;

  constructor(options: RpcClientOptions = {}) {
    const config = getGorbchainConfig();
    this.rpcUrl = options.rpcUrl || config.rpcUrl || 'https://rpc.gorbchain.xyz';
    this.timeout = options.timeout || 30000; // 30 seconds
    this.retries = options.retries || 3;
    
    // Initialize retry manager with custom options
    this.retryManager = new RetryManager(
      options.retryOptions || {
        maxAttempts: this.retries,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        jitter: true
      },
      options.circuitBreakerOptions || {
        failureThreshold: 5,
        resetTimeout: 30000,
        successThreshold: 2
      }
    );
  }

  /**
   * Make a raw RPC request with proper error handling and retry logic
   */
  async request<T>(method: string, params: any[] = []): Promise<T> {
    const context: ErrorContext = {
      rpcEndpoint: this.rpcUrl,
      metadata: { method, params }
    };

    return this.retryManager.execute(
      `rpc-${method}`,
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
          const response = await fetch(this.rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: this.requestId++,
              method,
              params
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          // Handle HTTP errors
          if (!response.ok) {
            const responseText = await response.text();
            this.handleHttpError(response.status, responseText, context);
          }

          const data: RpcResponse<T> = await response.json();

          // Handle RPC errors
          if (data.error) {
            this.handleRpcError(data.error, method, context);
          }

          return data.result as T;

        } catch (error) {
          clearTimeout(timeoutId);
          this.handleRequestError(error, method, context);
          throw error; // Re-throw to maintain stack trace
        }
      }
    );
  }

  /**
   * Handle HTTP errors and convert to appropriate error types
   */
  private handleHttpError(status: number, responseText: string, context: ErrorContext): never {
    if (status === 429) {
      // Extract retry-after header if available
      const retryAfter = this.extractRetryAfter(responseText);
      throw new RpcRateLimitError(retryAfter, context);
    }
    
    if (status === 404) {
      throw new RpcConnectionError(this.rpcUrl, context, {
        cause: new Error(`HTTP ${status}: ${responseText}`)
      });
    }
    
    if (status >= 500) {
      throw new RpcServerError(responseText, status, undefined, context);
    }
    
    if (status >= 400) {
      throw new RpcServerError(responseText, status, undefined, context);
    }
    
    throw new RpcNetworkError(`HTTP ${status}: ${responseText}`, context);
  }

  /**
   * Handle RPC-specific errors
   */
  private handleRpcError(error: { code: number; message: string }, method: string, context: ErrorContext): never {
    const { code, message } = error;
    
    if (code === -32601) {
      throw new RpcMethodNotSupportedError(method, context);
    }
    
    if (code === -32603) {
      throw new RpcServerError(message, undefined, code, context);
    }
    
    throw new RpcServerError(message, undefined, code, context);
  }

  /**
   * Handle request-level errors (network, timeout, etc.)
   */
  private handleRequestError(error: unknown, method: string, context: ErrorContext): never {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new RpcTimeoutError(this.timeout, context);
      }
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new RpcConnectionError(this.rpcUrl, context, { cause: error });
      }
    }
    
    throw new RpcNetworkError(`Request failed: ${error}`, context, { 
      cause: error instanceof Error ? error : new Error(String(error))
    });
  }

  /**
   * Extract retry-after value from response
   */
  private extractRetryAfter(responseText: string): number | undefined {
    try {
      const parsed = JSON.parse(responseText);
      return parsed.retryAfter || parsed['retry-after'];
    } catch {
      return undefined;
    }
  }

  /**
   * Get the current RPC endpoint
   */
  getRpcUrl(): string {
    return this.rpcUrl;
  }

  /**
   * Update the RPC endpoint
   */
  setRpcUrl(url: string): void {
    this.rpcUrl = url;
  }

  /**
   * Get network information
   */
  async getHealth(): Promise<string> {
    return this.request<string>('getHealth');
  }

  /**
   * Get current slot
   */
  async getSlot(commitment?: string): Promise<number> {
    const params = commitment ? [{ commitment }] : [];
    return this.request<number>('getSlot', params);
  }

  /**
   * Get current block height
   */
  async getBlockHeight(commitment?: string): Promise<number> {
    const params = commitment ? [{ commitment }] : [];
    return this.request<number>('getBlockHeight', params);
  }

  /**
   * Get version information
   */
  async getVersion(): Promise<{ 'solana-core': string; 'feature-set'?: number }> {
    return this.request('getVersion');
  }

  /**
   * Get latest blockhash
   */
  async getLatestBlockhash(commitment?: string): Promise<{
    blockhash: string;
    lastValidBlockHeight: number;
  }> {
    const params = commitment ? [{ commitment }] : [];
    return this.request('getLatestBlockhash', params);
  }

  /**
   * Get account information
   */
  async getAccountInfo(address: string, commitment?: string): Promise<{
    lamports: number;
    owner: string;
    executable: boolean;
    rentEpoch: number;
    data: [string, string];
  } | null> {
    const config: { encoding: string; commitment?: string } = { encoding: 'base64' };
    if (commitment) {
      config.commitment = commitment;
    }
    
    const params = [address, config];
    
    const result = await this.request<{
      value: {
        lamports: number;
        owner: string;
        executable: boolean;
        rentEpoch: number;
        data: [string, string];
      } | null;
    }>('getAccountInfo', params);
    
    return result.value;
  }

  /**
   * Get token account information
   */
  async getTokenAccountInfo(address: string, commitment?: string): Promise<{
    mint: string;
    owner: string;
    tokenAmount: {
      amount: string;
      decimals: number;
      uiAmount: number;
      uiAmountString: string;
    };
  } | null> {
    const config: { encoding: string; commitment?: string } = { encoding: 'jsonParsed' };
    if (commitment) {
      config.commitment = commitment;
    }
    
    const params = [address, config];
    
    const result = await this.request<{
      value: {
        mint: string;
        owner: string;
        tokenAmount: {
          amount: string;
          decimals: number;
          uiAmount: number;
          uiAmountString: string;
        };
      } | null;
    }>('getTokenAccountInfo', params);
    
    return result.value;
  }

  /**
   * Get mint account information
   */
  async getMintInfo(mintAddress: string, commitment?: string): Promise<{
    supply: string;
    decimals: number;
    isInitialized: boolean;
    mintAuthority: string | null;
    freezeAuthority: string | null;
  } | null> {
    const accountInfo = await this.getAccountInfo(mintAddress, commitment);
    
    if (!accountInfo || !accountInfo.data) {
      return null;
    }
    
    // Decode mint account data
    const data = Buffer.from(accountInfo.data[0], 'base64');
    
    // Mint account layout (simplified)
    if (data.length < 82) {
      return null;
    }
    
    const supply = data.readBigUInt64LE(36).toString();
    const decimals = data.readUInt8(44);
    const isInitialized = data.readUInt8(45) === 1;
    
    // Read mint authority (32 bytes at offset 4)
    const mintAuthorityFlag = data.readUInt8(4);
    const mintAuthority = mintAuthorityFlag === 1 ? 
      Buffer.from(data.subarray(5, 37)).toString('hex') : null;
    
    // Read freeze authority (32 bytes at offset 46)
    const freezeAuthorityFlag = data.readUInt8(46);
    const freezeAuthority = freezeAuthorityFlag === 1 ? 
      Buffer.from(data.subarray(47, 79)).toString('hex') : null;
    
    return {
      supply,
      decimals,
      isInitialized,
      mintAuthority,
      freezeAuthority
    };
  }

  /**
   * Get token metadata account for NFTs
   */
  async getTokenMetadata(mintAddress: string, commitment?: string): Promise<{
    name: string;
    symbol: string;
    uri: string;
    sellerFeeBasisPoints: number;
    creators: Array<{
      address: string;
      verified: boolean;
      share: number;
    }>;
    collection?: {
      verified: boolean;
      key: string;
    };
  } | null> {
    // Calculate metadata PDA address
    const metadataAddress = await this.findMetadataAddress(mintAddress);
    
    if (!metadataAddress) {
      return null;
    }
    
    const accountInfo = await this.getAccountInfo(metadataAddress, commitment);
    
    if (!accountInfo || !accountInfo.data) {
      return null;
    }
    
    // Decode metadata account (simplified)
    const data = Buffer.from(accountInfo.data[0], 'base64');
    
    // This is a simplified metadata decoder
    // In production, you'd want to use the official Metaplex JS SDK
    try {
      // Skip the first byte (discriminator) and decode the rest
      let offset = 1;
      
      // Read update authority (32 bytes)
      offset += 32;
      
      // Read mint (32 bytes)
      offset += 32;
      
      // Read name (first 4 bytes are length, then string)
      const nameLength = data.readUInt32LE(offset);
      offset += 4;
      const name = data.subarray(offset, offset + nameLength).toString('utf8').replace(/\0/g, '');
      offset += nameLength;
      
      // Read symbol (first 4 bytes are length, then string)
      const symbolLength = data.readUInt32LE(offset);
      offset += 4;
      const symbol = data.subarray(offset, offset + symbolLength).toString('utf8').replace(/\0/g, '');
      offset += symbolLength;
      
      // Read URI (first 4 bytes are length, then string)
      const uriLength = data.readUInt32LE(offset);
      offset += 4;
      const uri = data.subarray(offset, offset + uriLength).toString('utf8').replace(/\0/g, '');
      offset += uriLength;
      
      // Read seller fee basis points (2 bytes)
      const sellerFeeBasisPoints = data.readUInt16LE(offset);
      offset += 2;
      
      // Read creators (this is simplified - full implementation would parse the full structure)
      const creators: Array<{
        address: string;
        verified: boolean;
        share: number;
      }> = [];
      
      return {
        name,
        symbol,
        uri,
        sellerFeeBasisPoints,
        creators
      };
    } catch (error) {
      console.error('Error decoding metadata:', error);
      return null;
    }
  }

  /**
   * Find metadata address for a given mint
   */
  private async findMetadataAddress(mintAddress: string): Promise<string | null> {
    // This is a simplified version - in production, use the official method
    // to calculate the PDA for metadata accounts
    const metaplexProgramId = 'BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc';
    const seeds = [
      'metadata',
      metaplexProgramId,
      mintAddress
    ];
    
    // In a real implementation, you'd use the proper PDA calculation
    // For now, return null as we can't calculate PDAs without proper crypto libraries
    return null;
  }

  /**
   * Get multiple account information in a single request
   */
  async getMultipleAccounts(addresses: string[], commitment?: string): Promise<Array<{
    lamports: number;
    owner: string;
    executable: boolean;
    rentEpoch: number;
    data: [string, string];
  } | null>> {
    const config: { encoding: string; commitment?: string } = { encoding: 'base64' };
    if (commitment) {
      config.commitment = commitment;
    }
    
    const params = [addresses, config];
    
    const result = await this.request<{
      value: Array<{
        lamports: number;
        owner: string;
        executable: boolean;
        rentEpoch: number;
        data: [string, string];
      } | null>;
    }>('getMultipleAccounts', params);
    
    return result.value;
  }

  /**
   * Get token accounts owned by a specific address
   */
  async getTokenAccountsByOwner(
    ownerAddress: string,
    filter: { mint?: string; programId?: string },
    commitment?: string
  ): Promise<Array<{
    pubkey: string;
    account: {
      lamports: number;
      owner: string;
      executable: boolean;
      rentEpoch: number;
      data: [string, string];
    };
  }>> {
    const filterParam = filter.mint ? { mint: filter.mint } : { programId: filter.programId };
    const config: { encoding: string; commitment?: string } = { encoding: 'base64' };
    if (commitment) {
      config.commitment = commitment;
    }
    
    const params = [ownerAddress, filterParam, config];
    
    const result = await this.request<{
      value: Array<{
        pubkey: string;
        account: {
          lamports: number;
          owner: string;
          executable: boolean;
          rentEpoch: number;
          data: [string, string];
        };
      }>;
    }>('getTokenAccountsByOwner', params);
    
    return result.value;
  }

  /**
   * Check if a token is likely an NFT based on mint characteristics
   */
  async isNFT(mintAddress: string, commitment?: string): Promise<boolean> {
    const mintInfo = await this.getMintInfo(mintAddress, commitment);
    
    if (!mintInfo) {
      return false;
    }
    
    // NFT characteristics: supply of 1, 0 decimals, no mint authority
    return (
      mintInfo.supply === '1' &&
      mintInfo.decimals === 0 &&
      mintInfo.mintAuthority === null
    );
  }

  /**
   * Get enhanced token information including NFT detection
   */
  async getTokenInfo(mintAddress: string, commitment?: string): Promise<{
    mint: string;
    supply: string;
    decimals: number;
    isInitialized: boolean;
    mintAuthority: string | null;
    freezeAuthority: string | null;
    isNFT: boolean;
    metadata?: {
      name: string;
      symbol: string;
      uri: string;
      sellerFeeBasisPoints: number;
      creators: Array<{
        address: string;
        verified: boolean;
        share: number;
      }>;
    };
  } | null> {
    const mintInfo = await this.getMintInfo(mintAddress, commitment);
    
    if (!mintInfo) {
      return null;
    }
    
    const isNFT = (
      mintInfo.supply === '1' &&
      mintInfo.decimals === 0 &&
      mintInfo.mintAuthority === null
    );
    
    let metadata;
    if (isNFT) {
      metadata = await this.getTokenMetadata(mintAddress, commitment);
    }
    
    return {
      mint: mintAddress,
      ...mintInfo,
      isNFT,
      metadata: metadata || undefined
    };
  }
}
