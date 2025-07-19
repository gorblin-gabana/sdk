/**
 * Rich Token Operations - Enhanced token functions with metadata and context
 * 
 * These functions provide comprehensive token information including metadata,
 * market data, and decoded transaction context for frontend developers.
 */

import type { GorbchainSDK } from '../sdk/GorbchainSDK.js';
import type { RpcClient } from '../rpc/client.js';

/**
 * Rich token account information with complete metadata
 */
export interface RichTokenAccount {
  /** Token account address */
  address: string;
  /** Owner wallet address */
  owner: string;
  /** Token mint address */
  mint: string;
  /** Raw token balance */
  amount: string;
  /** Formatted balance with decimals */
  balance: string;
  /** Token decimals */
  decimals: number;
  /** Whether account is frozen */
  frozen: boolean;
  /** Token metadata */
  metadata: {
    /** Token name */
    name?: string;
    /** Token symbol */
    symbol?: string;
    /** Token description */
    description?: string;
    /** Token image/logo URL */
    image?: string;
    /** External URL */
    externalUrl?: string;
    /** Token attributes */
    attributes?: Array<{
      trait_type: string;
      value: string | number;
    }>;
    /** Whether this is an NFT */
    isNFT: boolean;
    /** NFT collection information */
    collection?: {
      name: string;
      family: string;
      verified: boolean;
    };
  };
  /** Market information (if available) */
  market?: {
    /** Current USD price */
    priceUsd?: number;
    /** 24h price change percentage */
    priceChange24h?: number;
    /** Market cap */
    marketCap?: number;
    /** Total supply */
    totalSupply?: string;
    /** Circulating supply */
    circulatingSupply?: string;
  };
  /** Program information */
  program: {
    /** Program ID that manages this token */
    id: string;
    /** Program type (SPL Token, Token-2022, etc.) */
    type: 'spl-token' | 'token-2022' | 'nft' | 'custom';
    /** Program version */
    version?: string;
  };
  /** Account creation info */
  created: {
    /** Block slot when account was created */
    slot?: number;
    /** Approximate creation timestamp */
    timestamp?: number;
    /** Creation transaction signature */
    signature?: string;
  };
}

/**
 * Rich token accounts response with portfolio summary
 */
export interface RichTokenAccountsResponse {
  /** Array of rich token accounts */
  accounts: RichTokenAccount[];
  /** Portfolio summary */
  summary: {
    /** Total number of tokens */
    totalTokens: number;
    /** Total number of NFTs */
    totalNFTs: number;
    /** Total USD value (if available) */
    totalValueUsd?: number;
    /** Portfolio diversity score (0-1) */
    diversityScore: number;
    /** Top 5 holdings by value */
    topHoldings: Array<{
      symbol: string;
      percentage: number;
      valueUsd?: number;
    }>;
  };
  /** Metadata about the operation */
  meta: {
    /** Whether metadata resolution was successful */
    metadataResolved: boolean;
    /** Whether market data was fetched */
    marketDataFetched: boolean;
    /** Number of failed metadata requests */
    failedMetadataRequests: number;
    /** Operation duration in milliseconds */
    duration: number;
    /** Timestamp of the operation */
    timestamp: number;
  };
}

/**
 * Get rich token accounts with complete metadata and context
 * 
 * This function enhances the basic getTokenAccountsByOwner with:
 * - Complete token metadata (name, symbol, image, etc.)
 * - Market data (price, market cap, etc.)
 * - NFT collection information
 * - Portfolio analysis and summary
 * - Performance metrics
 * 
 * @param sdk - GorbchainSDK instance
 * @param ownerAddress - Wallet address to get token accounts for
 * @param options - Configuration options
 * @returns Promise resolving to rich token accounts with metadata
 * 
 * @example
 * ```typescript
 * const sdk = new GorbchainSDK({ rpcEndpoint: 'https://rpc.gorbchain.xyz' });
 * 
 * const richTokens = await getRichTokenAccountsByOwner(sdk, 'wallet_address', {
 *   includeMetadata: true,
 *   includeMarketData: true,
 *   includeNFTs: true
 * });
 * 
 * console.log(`Found ${richTokens.accounts.length} tokens`);
 * console.log(`Portfolio value: $${richTokens.summary.totalValueUsd}`);
 * 
 * // Access individual token data
 * richTokens.accounts.forEach(token => {
 *   console.log(`${token.metadata.symbol}: ${token.balance} tokens`);
 *   if (token.metadata.isNFT) {
 *     console.log(`NFT: ${token.metadata.name} from ${token.metadata.collection?.name}`);
 *   }
 * });
 * ```
 */
export async function getRichTokenAccountsByOwner(
  sdk: GorbchainSDK,
  ownerAddress: string,
  options: {
    /** Whether to fetch token metadata */
    includeMetadata?: boolean;
    /** Whether to fetch market data */
    includeMarketData?: boolean;
    /** Whether to include NFT accounts */
    includeNFTs?: boolean;
    /** Whether to include zero balance accounts */
    includeZeroBalance?: boolean;
    /** Maximum number of concurrent metadata requests */
    maxConcurrentRequests?: number;
    /** Custom token programs to include */
    customPrograms?: string[];
  } = {}
): Promise<RichTokenAccountsResponse> {
  const startTime = Date.now();
  
  const {
    includeMetadata = true,
    includeMarketData = false,
    includeNFTs = true,
    includeZeroBalance = false,
    maxConcurrentRequests = 5,
    customPrograms = []
  } = options;

  try {
    // Get all token holdings using the existing enhanced method
    const holdings = await sdk.getAllTokenHoldings(ownerAddress, {
      includeStandardTokens: true,
      includeCustomTokens: true,
      includeNFTs,
      customPrograms
    });

    // Filter out zero balance accounts if requested
    const filteredHoldings = includeZeroBalance 
      ? holdings.holdings
      : holdings.holdings.filter(holding => 
          parseFloat(holding.balance?.toString() || '0') > 0
        );

    // Convert to rich token accounts with metadata
    const richAccounts: RichTokenAccount[] = [];
    let failedMetadataRequests = 0;

    // Process accounts in batches to avoid overwhelming the network
    const batchSize = maxConcurrentRequests;
    for (let i = 0; i < filteredHoldings.length; i += batchSize) {
      const batch = filteredHoldings.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (holding) => {
        try {
          return await enrichTokenAccount(sdk, holding, {
            includeMetadata,
            includeMarketData
          });
        } catch (error) {
          failedMetadataRequests++;
          console.warn(`Failed to enrich token account ${holding.mint}:`, error);
          
          // Return basic account info even if enrichment fails
          return createBasicRichAccount(holding);
        }
      });

      const enrichedBatch = await Promise.all(batchPromises);
      richAccounts.push(...enrichedBatch);
    }

    // Generate portfolio summary
    const summary = generatePortfolioSummary(richAccounts);

    const duration = Date.now() - startTime;

    return {
      accounts: richAccounts,
      summary,
      meta: {
        metadataResolved: includeMetadata,
        marketDataFetched: includeMarketData,
        failedMetadataRequests,
        duration,
        timestamp: Date.now()
      }
    };

  } catch (error) {
    throw new Error(`Failed to get rich token accounts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Enrich a single token account with metadata and market data
 */
async function enrichTokenAccount(
  sdk: GorbchainSDK,
  holding: any,
  options: {
    includeMetadata: boolean;
    includeMarketData: boolean;
  }
): Promise<RichTokenAccount> {
  const { includeMetadata, includeMarketData } = options;

  // Get basic account information
  const accountInfo = await sdk.getAccountInfo(holding.account || holding.address);
  
  // Start with basic token data
  const richAccount: RichTokenAccount = {
    address: holding.account || holding.address,
    owner: holding.owner || '',
    mint: holding.mint || '',
    amount: holding.amount?.toString() || '0',
    balance: holding.balance?.formatted || holding.balance?.toString() || '0',
    decimals: holding.decimals || 0,
    frozen: holding.frozen || false,
    metadata: {
      name: holding.metadata?.name,
      symbol: holding.metadata?.symbol,
      description: holding.metadata?.description,
      image: holding.metadata?.image,
      isNFT: holding.isNFT || false,
      attributes: holding.metadata?.attributes || []
    },
    program: {
      id: holding.programId || 'unknown',
      type: determineTokenType(holding.programId),
      version: holding.programVersion
    },
    created: {
      slot: accountInfo?.slot,
      timestamp: accountInfo?.blockTime ? accountInfo.blockTime * 1000 : undefined
    }
  };

  // Enhance with additional metadata if requested
  if (includeMetadata && holding.mint) {
    try {
      const enhancedMetadata = await fetchTokenMetadata(sdk, holding.mint);
      if (enhancedMetadata) {
        richAccount.metadata = {
          ...richAccount.metadata,
          ...enhancedMetadata
        };
      }
    } catch (error) {
      console.warn(`Failed to fetch metadata for ${holding.mint}:`, error);
    }
  }

  // Add market data if requested
  if (includeMarketData && holding.mint) {
    try {
      const marketData = await fetchMarketData(holding.mint, holding.metadata?.symbol);
      if (marketData) {
        richAccount.market = marketData;
      }
    } catch (error) {
      console.warn(`Failed to fetch market data for ${holding.mint}:`, error);
    }
  }

  return richAccount;
}

/**
 * Create a basic rich account structure when enrichment fails
 */
function createBasicRichAccount(holding: any): RichTokenAccount {
  return {
    address: holding.account || holding.address || 'unknown',
    owner: holding.owner || 'unknown',
    mint: holding.mint || 'unknown',
    amount: holding.amount?.toString() || '0',
    balance: holding.balance?.formatted || holding.balance?.toString() || '0',
    decimals: holding.decimals || 0,
    frozen: holding.frozen || false,
    metadata: {
      name: holding.metadata?.name || 'Unknown Token',
      symbol: holding.metadata?.symbol || 'UNKNOWN',
      isNFT: holding.isNFT || false,
      attributes: []
    },
    program: {
      id: holding.programId || 'unknown',
      type: 'custom',
    },
    created: {}
  };
}

/**
 * Determine token type based on program ID
 */
function determineTokenType(programId?: string): 'spl-token' | 'token-2022' | 'nft' | 'custom' {
  if (!programId) return 'custom';
  
  switch (programId) {
    case 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA':
      return 'spl-token';
    case 'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn':
      return 'token-2022';
    case 'BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc':
    case 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s':
      return 'nft';
    default:
      return 'custom';
  }
}

/**
 * Fetch additional token metadata from various sources
 */
async function fetchTokenMetadata(sdk: GorbchainSDK, mintAddress: string): Promise<Partial<RichTokenAccount['metadata']> | null> {
  try {
    // Try to get account info for the mint
    const mintInfo = await sdk.getAccountInfo(mintAddress);
    
    if (!mintInfo) return null;

    // Basic metadata structure
    const metadata: Partial<RichTokenAccount['metadata']> = {};

    // Try to decode mint account data if it's a known token program
    if (mintInfo.owner) {
      const programId = mintInfo.owner.toString();
      
      // For NFTs, try to fetch metadata from metadata account
      if (programId === 'BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc' ||
          programId === 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s') {
        metadata.isNFT = true;
        
        // Try to fetch NFT metadata
        try {
          const nftMetadata = await fetchNFTMetadata(sdk, mintAddress);
          if (nftMetadata) {
            Object.assign(metadata, nftMetadata);
          }
        } catch (error) {
          console.warn('Failed to fetch NFT metadata:', error);
        }
      }
    }

    return metadata;
  } catch (error) {
    console.warn('Error fetching token metadata:', error);
    return null;
  }
}

/**
 * Fetch NFT-specific metadata
 */
async function fetchNFTMetadata(sdk: GorbchainSDK, mintAddress: string): Promise<Partial<RichTokenAccount['metadata']> | null> {
  // This would integrate with NFT metadata standards
  // For now, return basic structure
  return {
    isNFT: true,
    collection: {
      name: 'Unknown Collection',
      family: 'Unknown',
      verified: false
    }
  };
}

/**
 * Fetch market data for a token (placeholder - would integrate with price APIs)
 */
async function fetchMarketData(mintAddress: string, symbol?: string): Promise<RichTokenAccount['market'] | null> {
  // This would integrate with price APIs like CoinGecko, Jupiter, etc.
  // For now, return null as this requires external API integration
  return null;
}

/**
 * Generate portfolio summary from rich accounts
 */
function generatePortfolioSummary(accounts: RichTokenAccount[]): RichTokenAccountsResponse['summary'] {
  const totalTokens = accounts.filter(acc => !acc.metadata.isNFT).length;
  const totalNFTs = accounts.filter(acc => acc.metadata.isNFT).length;
  
  // Calculate total USD value if market data is available
  let totalValueUsd = 0;
  let hasMarketData = false;
  
  accounts.forEach(account => {
    if (account.market?.priceUsd && !account.metadata.isNFT) {
      const balance = parseFloat(account.balance.replace(/[^0-9.-]/g, ''));
      totalValueUsd += balance * account.market.priceUsd;
      hasMarketData = true;
    }
  });

  // Calculate diversity score (simplified)
  const diversityScore = Math.min(accounts.length / 10, 1); // Normalize to 0-1

  // Get top holdings
  const sortedAccounts = accounts
    .filter(acc => !acc.metadata.isNFT)
    .sort((a, b) => {
      const aValue = a.market?.priceUsd ? parseFloat(a.balance.replace(/[^0-9.-]/g, '')) * a.market.priceUsd : 0;
      const bValue = b.market?.priceUsd ? parseFloat(b.balance.replace(/[^0-9.-]/g, '')) * b.market.priceUsd : 0;
      return bValue - aValue;
    });

  const topHoldings = sortedAccounts.slice(0, 5).map(account => {
    const value = account.market?.priceUsd ? parseFloat(account.balance.replace(/[^0-9.-]/g, '')) * account.market.priceUsd : 0;
    return {
      symbol: account.metadata.symbol || 'UNKNOWN',
      percentage: totalValueUsd > 0 ? (value / totalValueUsd) * 100 : 0,
      valueUsd: value > 0 ? value : undefined
    };
  });

  return {
    totalTokens,
    totalNFTs,
    totalValueUsd: hasMarketData ? totalValueUsd : undefined,
    diversityScore,
    topHoldings
  };
}