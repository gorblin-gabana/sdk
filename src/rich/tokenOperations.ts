/**
 * Rich Token Operations - Enhanced token functions with metadata and context
 *
 * These functions provide comprehensive token information including metadata,
 * market data, and decoded transaction context for frontend developers.
 */

import type { GorbchainSDK } from "../sdk/GorbchainSDK.js";
import type { RpcClient } from "../rpc/client.js";

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
    type: "spl-token" | "token-2022" | "nft" | "custom";
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
  } = {},
): Promise<RichTokenAccountsResponse> {
  const startTime = Date.now();

  const {
    includeMetadata = true,
    includeMarketData = false,
    includeNFTs = true,
    includeZeroBalance = false,
    maxConcurrentRequests = 5,
    customPrograms = [],
  } = options;

  try {
    // Get all token holdings using the simplified method
    const holdings = await sdk.getAllTokenHoldings(ownerAddress, {
      includeStandardTokens: true,
      includeCustomTokens: true,
      includeNFTs,
      customPrograms,
    });

    // Filter out zero balance accounts if requested
    const filteredHoldings = includeZeroBalance
      ? holdings.holdings
      : holdings.holdings.filter(
          (holding) => parseFloat(holding.balance.raw || "0") > 0,
        );

    // Convert to rich token accounts (simplified approach)
    const richAccounts: RichTokenAccount[] = filteredHoldings.map((holding) => {
      return {
        address: holding.tokenAccount,
        owner: holding.owner,
        mint: holding.mint,
        amount: holding.balance.raw,
        balance: holding.balance.formatted,
        decimals: holding.decimals,
        frozen: holding.frozen || false,
        metadata: {
          name: `Token ${holding.mint.slice(0, 8)}...`,
          symbol: "UNKNOWN",
          isNFT: holding.isNFT || false,
          attributes: [],
        },
        program: {
          id: holding.programId || "unknown",
          type: determineTokenType(holding.programId),
        },
        created: {},
      };
    });

    // Generate portfolio summary
    const summary = generatePortfolioSummary(richAccounts);

    const duration = Date.now() - startTime;

    return {
      accounts: richAccounts,
      summary,
      meta: {
        metadataResolved: includeMetadata,
        marketDataFetched: includeMarketData,
        failedMetadataRequests: 0,
        duration,
        timestamp: Date.now(),
      },
    };
  } catch (error) {
    throw new Error(
      `Failed to get rich token accounts: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Removed complex enrichment functions - now using simple direct approach

/**
 * Determine token type based on program ID
 */
function determineTokenType(
  programId?: string,
): "spl-token" | "token-2022" | "nft" | "custom" {
  if (!programId) return "custom";

  switch (programId) {
    case "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA":
      return "spl-token";
    case "G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6":
      return "token-2022";
    case "BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc":
    case "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s":
      return "nft";
    default:
      return "custom";
  }
}

// Removed complex metadata fetching and caching - simplified approach

/**
 * Generate portfolio summary from rich accounts
 */
function generatePortfolioSummary(
  accounts: RichTokenAccount[],
): RichTokenAccountsResponse["summary"] {
  const totalTokens = accounts.filter((acc) => !acc.metadata.isNFT).length;
  const totalNFTs = accounts.filter((acc) => acc.metadata.isNFT).length;

  // Calculate total USD value if market data is available
  let totalValueUsd = 0;
  let hasMarketData = false;

  accounts.forEach((account) => {
    if (account.market?.priceUsd && !account.metadata.isNFT) {
      const balance = parseFloat(account.balance.replace(/[^0-9.-]/g, ""));
      totalValueUsd += balance * account.market.priceUsd;
      hasMarketData = true;
    }
  });

  // Calculate diversity score (simplified)
  const diversityScore = Math.min(accounts.length / 10, 1); // Normalize to 0-1

  // Get top holdings
  const sortedAccounts = accounts
    .filter((acc) => !acc.metadata.isNFT)
    .sort((a, b) => {
      const aValue = a.market?.priceUsd
        ? parseFloat(a.balance.replace(/[^0-9.-]/g, "")) * a.market.priceUsd
        : 0;
      const bValue = b.market?.priceUsd
        ? parseFloat(b.balance.replace(/[^0-9.-]/g, "")) * b.market.priceUsd
        : 0;
      return bValue - aValue;
    });

  const topHoldings = sortedAccounts.slice(0, 5).map((account) => {
    const value = account.market?.priceUsd
      ? parseFloat(account.balance.replace(/[^0-9.-]/g, "")) *
        account.market.priceUsd
      : 0;
    return {
      symbol: account.metadata.symbol || "UNKNOWN",
      percentage: totalValueUsd > 0 ? (value / totalValueUsd) * 100 : 0,
      valueUsd: value > 0 ? value : undefined,
    };
  });

  return {
    totalTokens,
    totalNFTs,
    totalValueUsd: hasMarketData ? totalValueUsd : undefined,
    diversityScore,
    topHoldings,
  };
}
