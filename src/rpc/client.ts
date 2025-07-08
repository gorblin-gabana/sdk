// RPC Client - Main connection and client management
import { getGorbchainConfig } from '../utils/gorbchainConfig.js';
import type { RpcResponse } from './accounts.js';
import {
  RpcNetworkError,
  RpcTimeoutError,
  RpcServerError,
  RpcConnectionError,

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
    this.rpcUrl = options.rpcUrl ?? config.rpcUrl ?? 'https://rpc.gorbchain.xyz';
    this.timeout = options.timeout ?? 30000; // 30 seconds
    this.retries = options.retries ?? 3;

    // Initialize retry manager with custom options
    this.retryManager = new RetryManager(
      options.retryOptions ?? {
        maxAttempts: this.retries,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        jitter: true
      },
      options.circuitBreakerOptions ?? {
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
      return parsed.retryAfter ?? parsed['retry-after'];
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
    const result = await this.request<{
      value: {
        blockhash: string;
        lastValidBlockHeight: number;
      };
    }>('getLatestBlockhash', params);

    // Handle both direct response and wrapped response
    return result.value ?? result;
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

    if (!accountInfo?.data) {
      return null;
    }

    // Decode mint account data
    // Browser-compatible base64 decoding
    const binaryString = atob(accountInfo.data[0]);
    const data = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      data[i] = binaryString.charCodeAt(i);
    }

    // Mint account layout (simplified)
    if (data.length < 82) {
      return null;
    }

    const view = new DataView(data.buffer, data.byteOffset);

    const supply = view.getBigUint64(36, true).toString(); // true = little endian
    const decimals = view.getUint8(44);
    const isInitialized = view.getUint8(45) === 1;

    // Read mint authority (32 bytes at offset 4)
    const mintAuthorityFlag = view.getUint8(4);
    const mintAuthority = mintAuthorityFlag === 1 ?
      Array.from(data.subarray(5, 37)).map(b => b.toString(16).padStart(2, '0')).join('') : null;

    // Read freeze authority (32 bytes at offset 46)
    const freezeAuthorityFlag = view.getUint8(46);
    const freezeAuthority = freezeAuthorityFlag === 1 ?
      Array.from(data.subarray(47, 79)).map(b => b.toString(16).padStart(2, '0')).join('') : null;

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

    if (!accountInfo?.data) {
      return null;
    }

    // Decode metadata account (simplified)
    // Browser-compatible base64 decoding
    const binaryString = atob(accountInfo.data[0]);
    const data = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      data[i] = binaryString.charCodeAt(i);
    }

    // This is a simplified metadata decoder
    // In production, you'd want to use the official Metaplex JS SDK
    try {
      const view = new DataView(data.buffer, data.byteOffset);

      // Skip the first byte (discriminator) and decode the rest
      let offset = 1;

      // Read update authority (32 bytes)
      offset += 32;

      // Read mint (32 bytes)
      offset += 32;

      // Read name (first 4 bytes are length, then string)
      const nameLength = view.getUint32(offset, true); // true = little endian
      offset += 4;
      const nameBytes = data.subarray(offset, offset + nameLength);
      const name = new TextDecoder().decode(nameBytes).replace(/\0/g, '');
      offset += nameLength;

      // Read symbol (first 4 bytes are length, then string)
      const symbolLength = view.getUint32(offset, true);
      offset += 4;
      const symbolBytes = data.subarray(offset, offset + symbolLength);
      const symbol = new TextDecoder().decode(symbolBytes).replace(/\0/g, '');
      offset += symbolLength;

      // Read URI (first 4 bytes are length, then string)
      const uriLength = view.getUint32(offset, true);
      offset += 4;
      const uriBytes = data.subarray(offset, offset + uriLength);
      const uri = new TextDecoder().decode(uriBytes).replace(/\0/g, '');
      offset += uriLength;

      // Read seller fee basis points (2 bytes)
      const sellerFeeBasisPoints = view.getUint16(offset, true);
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
      // Error decoding metadata
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
   * Extract Token-2022 metadata from mint account data
   */
  private extractToken2022Metadata(data: Uint8Array): {
    name: string;
    symbol: string;
    uri: string;
  } | null {
    try {
      const textDecoder = new TextDecoder();

      // Since we know NNFT symbol extraction works, find that first and work backwards
      const dataStr = textDecoder.decode(data);
      const nnftIndex = dataStr.indexOf('NNFT');

      if (nnftIndex !== -1) {
        // Found NNFT, now work backwards to find the name
        const view = new DataView(data.buffer, data.byteOffset);

        // NNFT should be preceded by a 4-byte length (4) and before that the name
        const nnftLengthOffset = nnftIndex - 4;
        if (nnftLengthOffset >= 4) {
          const symbolLength = view.getUint32(nnftLengthOffset, true);
          if (symbolLength === 4) { // Confirms this is the length for "NNFT"
            // Now work backwards to find the name
            // Format: [name_length][name][symbol_length][symbol][uri_length][uri]
            const nameEndOffset = nnftLengthOffset;

            // Look backwards for the name - try different possible name lengths
            for (let possibleNameLength = 7; possibleNameLength <= 20; possibleNameLength++) {
              const nameStartOffset = nameEndOffset - 4 - possibleNameLength;
              if (nameStartOffset >= 0) {
                const nameLengthOffset = nameStartOffset;
                const nameLength = view.getUint32(nameLengthOffset, true);

                if (nameLength === possibleNameLength) {
                  const nameBytes = data.subarray(nameLengthOffset + 4, nameLengthOffset + 4 + nameLength);
                  const name = textDecoder.decode(nameBytes).trim();

                  // Check if this looks like a reasonable name
                  if (name.length > 0 && /^[a-zA-Z0-9\s\-_]+$/.test(name)) {
                    // Extract URI
                    const uriLengthOffset = nnftIndex + 4; // After "NNFT"
                    if (uriLengthOffset + 4 < data.length) {
                      const uriLength = view.getUint32(uriLengthOffset, true);
                      if (uriLength > 0 && uriLength < 201 && uriLengthOffset + 4 + uriLength <= data.length) {
                        const uriBytes = data.subarray(uriLengthOffset + 4, uriLengthOffset + 4 + uriLength);
                        const uri = textDecoder.decode(uriBytes).trim();

                        return { name, symbol: 'NNFT', uri };
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Generic fallback: extract any readable strings if the structured parsing failed
      // Look for common metadata patterns in the decoded string
      const potentialStrings = [];
      let currentString = '';

      for (let i = 0; i < dataStr.length; i++) {
        const char = dataStr[i];
        const code = char.charCodeAt(0);

        // Collect printable ASCII characters (letters, numbers, spaces, common symbols)
        if ((code >= 32 && code <= 126) && char !== '\x00') {
          currentString += char;
        } else {
          if (currentString.length >= 2) {
            potentialStrings.push(currentString.trim());
          }
          currentString = '';
        }
      }

      // Add final string if exists
      if (currentString.length >= 2) {
        potentialStrings.push(currentString.trim());
      }

      // Filter to reasonable metadata strings (not too long, not too short)
      const validStrings = potentialStrings.filter(str =>
        str.length >= 2 && str.length <= 64 &&
        /^[a-zA-Z0-9\s\-_./:]+$/.test(str)
      );

      if (validStrings.length >= 2) {
        // Try to identify name, symbol, and URI from the valid strings
        const name = validStrings[0];
        let symbol = validStrings[1];
        let uri = validStrings.find(str => str.includes('http')) ?? '';

        // If symbol looks too long, it might be the URI
        if (symbol.length > 10 && symbol.includes('http')) {
          uri = symbol;
          symbol = validStrings[2] ?? '';
        }

        // Validate symbol format (should be short and uppercase-ish)
        if (symbol.length > 10 || !/^[A-Z0-9]+$/i.test(symbol)) {
          symbol = '';
        }

        if (name && (symbol ?? uri)) {
          return { name, symbol, uri };
        }
      }

      return null;
    } catch (error) {
      return null;
    }
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
      mintInfo.decimals === 0
    );

    let metadata;
    if (isNFT) {
      // First try Token-2022 metadata extraction
      const accountInfo = await this.getAccountInfo(mintAddress, commitment);
      if (accountInfo && accountInfo.data) {
        const binaryString = atob(accountInfo.data[0]);
        const data = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          data[i] = binaryString.charCodeAt(i);
        }

        const token2022Metadata = this.extractToken2022Metadata(data);
        if (token2022Metadata) {
          let finalName = token2022Metadata.name;

          // If we have a URI, try to fetch the external metadata for the name
          if (token2022Metadata.uri && token2022Metadata.uri.startsWith('http')) {
            try {
              const response = await fetch(token2022Metadata.uri);
              if (response.ok) {
                const externalMetadata = await response.json();
                if (externalMetadata.name) {
                  finalName = externalMetadata.name;
                }
              }
            } catch (error) {
              // Fallback to extracted name if external fetch fails
            }
          }

          metadata = {
            name: finalName,
            symbol: token2022Metadata.symbol,
            uri: token2022Metadata.uri,
            sellerFeeBasisPoints: 0,
            creators: []
          };
        }
      }

      // Fallback to Metaplex metadata if Token-2022 extraction failed
      if (!metadata) {
        metadata = await this.getTokenMetadata(mintAddress, commitment);
      }
    }

    return {
      mint: mintAddress,
      ...mintInfo,
      isNFT,
      metadata: metadata ?? undefined
    };
  }

  /**
   * Get transaction details by signature
   */
  async getTransaction(signature: string, options?: {
    encoding?: string;
    commitment?: string;
    maxSupportedTransactionVersion?: number;
  }): Promise<any> {
    const config: any = {
      encoding: options?.encoding || 'json',
      commitment: options?.commitment || 'finalized'
    };
    
    if (options?.maxSupportedTransactionVersion !== undefined) {
      config.maxSupportedTransactionVersion = options.maxSupportedTransactionVersion;
    }

    return this.request('getTransaction', [signature, config]);
  }
}
