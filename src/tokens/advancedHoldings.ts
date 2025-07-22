/**
 * Advanced Token Holdings Analyzer for Gorbchain SDK v2
 * Provides comprehensive token portfolio analysis with multi-program support
 */

import type {
  EnhancedRpcClient,
  TokenHolding,
  TokenConfig,
} from "../rpc/enhancedClient.js";
import type { NetworkConfig } from "../config/networks.js";

export interface TokenPortfolio {
  walletAddress: string;
  holdings: TokenHolding[];
  summary: PortfolioSummary;
  timestamp: string;
}

export interface PortfolioSummary {
  totalTokens: number;
  totalNFTs: number;
  totalFungibleTokens: number;
  uniqueMints: number;
  hasMetadata: number;
  totalValue?: number; // If price data is available
  topHoldings: TokenHolding[];
}

export interface PortfolioAnalysis {
  diversification: {
    mintCount: number;
    largestHoldingPercentage: number;
    concentrationRisk: "low" | "medium" | "high";
  };
  tokenTypes: {
    fungibleTokens: number;
    nfts: number;
    unknownTokens: number;
  };
  balanceDistribution: {
    zeroBalance: number;
    smallBalance: number;
    mediumBalance: number;
    largeBalance: number;
  };
}

export interface TokenMetadata {
  name?: string;
  symbol?: string;
  uri?: string;
  description?: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

/**
 * Advanced Token Holdings Analyzer
 */
export class AdvancedTokenHoldings {
  private rpcClient: EnhancedRpcClient;
  private networkConfig: NetworkConfig | null;

  constructor(rpcClient: EnhancedRpcClient) {
    this.rpcClient = rpcClient;
    this.networkConfig = rpcClient.getNetworkConfig();
  }

  /**
   * Get all tokens for a wallet across all supported programs
   */
  async getAllTokens(
    walletAddress: string,
    config?: TokenConfig,
  ): Promise<TokenPortfolio> {
    const startTime = Date.now();

    // Get SOL balance
    const solBalance = await this.rpcClient.getBalance(walletAddress);

    // Get token holdings from all programs
    const tokenHoldings = await this.rpcClient.getCustomTokenHoldings(
      walletAddress,
      config,
    );

    // Enhance holdings with additional metadata and analysis
    const enhancedHoldings = await this.enhanceHoldings(tokenHoldings);

    // Generate portfolio summary
    const summary = this.generatePortfolioSummary(enhancedHoldings);

    const endTime = Date.now();
    console.log(`Portfolio analysis completed in ${endTime - startTime}ms`);

    return {
      walletAddress,
      holdings: enhancedHoldings,
      summary,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get tokens from a specific custom program
   */
  async getCustomProgramTokens(
    walletAddress: string,
    programId: string,
  ): Promise<TokenHolding[]> {
    const config: TokenConfig = {
      customPrograms: [programId],
      includeStandardTokens: false,
      includeToken2022: false,
    };

    return this.rpcClient.getCustomTokenHoldings(walletAddress, config);
  }

  /**
   * Detect token decimals from mint account
   */
  async detectTokenDecimals(mintAddress: string): Promise<number> {
    try {
      const mintInfo = await this.rpcClient.getMintAccountInfo(mintAddress);
      return mintInfo?.decimals ?? 0;
    } catch (error) {
      console.warn(`Failed to detect decimals for ${mintAddress}:`, error);
      return 0;
    }
  }

  /**
   * Resolve token metadata (when available)
   */
  async resolveTokenMetadata(
    mintAddress: string,
  ): Promise<TokenMetadata | null> {
    // For now, return null as custom networks may not have standard metadata
    // In a full implementation, this would check various metadata sources
    return null;
  }

  /**
   * Analyze portfolio for insights
   */
  async analyzePortfolio(holdings: TokenHolding[]): Promise<PortfolioAnalysis> {
    const totalHoldings = holdings.length;

    // Calculate diversification metrics
    const balances = holdings.map((h) => h.balance.decimal);
    const totalValue = balances.reduce((sum, balance) => sum + balance, 0);
    const largestBalance = Math.max(...balances);
    const largestHoldingPercentage =
      totalValue > 0 ? (largestBalance / totalValue) * 100 : 0;

    let concentrationRisk: "low" | "medium" | "high" = "low";
    if (largestHoldingPercentage > 50) {
      concentrationRisk = "high";
    } else if (largestHoldingPercentage > 25) {
      concentrationRisk = "medium";
    }

    // Analyze token types
    const fungibleTokens = holdings.filter((h) => !h.isNFT).length;
    const nfts = holdings.filter((h) => h.isNFT).length;
    const unknownTokens = holdings.filter(
      (h) => !h.metadata && !h.isNFT,
    ).length;

    // Analyze balance distribution
    const zeroBalance = holdings.filter((h) => h.balance.decimal === 0).length;
    const smallBalance = holdings.filter(
      (h) => h.balance.decimal > 0 && h.balance.decimal < 1,
    ).length;
    const mediumBalance = holdings.filter(
      (h) => h.balance.decimal >= 1 && h.balance.decimal < 1000,
    ).length;
    const largeBalance = holdings.filter(
      (h) => h.balance.decimal >= 1000,
    ).length;

    return {
      diversification: {
        mintCount: totalHoldings,
        largestHoldingPercentage,
        concentrationRisk,
      },
      tokenTypes: {
        fungibleTokens,
        nfts,
        unknownTokens,
      },
      balanceDistribution: {
        zeroBalance,
        smallBalance,
        mediumBalance,
        largeBalance,
      },
    };
  }

  /**
   * Get tokens by category (NFTs vs Fungible)
   */
  async getTokensByCategory(walletAddress: string): Promise<{
    nfts: TokenHolding[];
    fungibleTokens: TokenHolding[];
  }> {
    const portfolio = await this.getAllTokens(walletAddress);

    const nfts = portfolio.holdings.filter((h) => h.isNFT);
    const fungibleTokens = portfolio.holdings.filter((h) => !h.isNFT);

    return { nfts, fungibleTokens };
  }

  /**
   * Get top holdings by balance
   */
  async getTopHoldings(
    walletAddress: string,
    limit: number = 10,
  ): Promise<TokenHolding[]> {
    const portfolio = await this.getAllTokens(walletAddress);

    return portfolio.holdings
      .sort((a, b) => b.balance.decimal - a.balance.decimal)
      .slice(0, limit);
  }

  /**
   * Enhance holdings with additional metadata and analysis
   */
  private async enhanceHoldings(
    holdings: TokenHolding[],
  ): Promise<TokenHolding[]> {
    const enhanced: TokenHolding[] = [];

    for (const holding of holdings) {
      const enhancedHolding = { ...holding };

      // Try to resolve metadata if not already present
      if (!enhancedHolding.metadata) {
        try {
          const metadata = await this.resolveTokenMetadata(holding.mint);
          if (metadata) {
            enhancedHolding.metadata = metadata;
          }
        } catch (error) {
          // Metadata resolution failed, continue without it
        }
      }

      // Get mint information for accurate NFT detection and decimals
      try {
        const mintInfo = await this.rpcClient.getMintAccountInfo(holding.mint);
        if (mintInfo) {
          // Update mint info
          enhancedHolding.mintInfo = {
            supply: mintInfo.supply,
            mintAuthority: mintInfo.mintAuthority ?? undefined,
            freezeAuthority: mintInfo.freezeAuthority ?? undefined,
            isInitialized: mintInfo.isInitialized,
          };

          // Check if this is an NFT based on supply=1 and decimals=0
          const isNFT = mintInfo.supply === "1" && mintInfo.decimals === 0;
          enhancedHolding.isNFT = isNFT;

          // Update decimals from mint info if more accurate
          if (mintInfo.decimals !== enhancedHolding.decimals) {
            enhancedHolding.decimals = mintInfo.decimals;
            // Recalculate balance with correct decimals
            const rawAmount = parseFloat(enhancedHolding.balance.raw);
            const correctDecimalBalance =
              rawAmount / Math.pow(10, mintInfo.decimals);
            enhancedHolding.balance.decimal = correctDecimalBalance;
            enhancedHolding.balance.formatted =
              correctDecimalBalance.toString();
          }
        }
      } catch (error) {
        // Mint info not available, fall back to token account analysis
        // For tokens with decimals=0 but not marked as NFT, try to detect decimals
        if (enhancedHolding.decimals === 0 && !enhancedHolding.isNFT) {
          try {
            const detectedDecimals = await this.detectTokenDecimals(
              holding.mint,
            );
            if (detectedDecimals > 0) {
              enhancedHolding.decimals = detectedDecimals;
              // Recalculate balance with correct decimals
              const rawAmount = parseFloat(enhancedHolding.balance.raw);
              const correctDecimalBalance =
                rawAmount / Math.pow(10, detectedDecimals);
              enhancedHolding.balance.decimal = correctDecimalBalance;
              enhancedHolding.balance.formatted =
                correctDecimalBalance.toString();
            } else {
              // If decimals are still 0 and balance is 1, likely an NFT
              if (enhancedHolding.balance.decimal === 1) {
                enhancedHolding.isNFT = true;
              }
            }
          } catch (error) {
            // Decimals detection failed, use heuristic
            // If decimals are 0 and balance is exactly 1, likely an NFT
            if (
              enhancedHolding.decimals === 0 &&
              enhancedHolding.balance.decimal === 1
            ) {
              enhancedHolding.isNFT = true;
            }
          }
        }
      }

      enhanced.push(enhancedHolding);
    }

    return enhanced;
  }

  /**
   * Generate portfolio summary
   */
  private generatePortfolioSummary(holdings: TokenHolding[]): PortfolioSummary {
    const totalTokens = holdings.length;
    const totalNFTs = holdings.filter((h) => h.isNFT).length;
    const totalFungibleTokens = holdings.filter((h) => !h.isNFT).length;
    const uniqueMints = new Set(holdings.map((h) => h.mint)).size;
    const hasMetadata = holdings.filter((h) => h.metadata).length;

    // Get top 5 holdings by balance
    const topHoldings = holdings
      .sort((a, b) => b.balance.decimal - a.balance.decimal)
      .slice(0, 5);

    return {
      totalTokens,
      totalNFTs,
      totalFungibleTokens,
      uniqueMints,
      hasMetadata,
      topHoldings,
    };
  }

  /**
   * Batch process multiple wallets
   */
  async batchAnalyzeWallets(
    walletAddresses: string[],
    config?: TokenConfig,
  ): Promise<TokenPortfolio[]> {
    const results: TokenPortfolio[] = [];

    // Process wallets in parallel with rate limiting
    const maxConcurrent = config?.maxConcurrentRequests ?? 5;
    const batches = this.chunkArray(walletAddresses, maxConcurrent);

    for (const batch of batches) {
      const batchPromises = batch.map((address) =>
        this.getAllTokens(address, config),
      );

      const batchResults = await Promise.allSettled(batchPromises);

      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          results.push(result.value);
        } else {
          console.warn("Failed to analyze wallet:", result.reason);
        }
      }
    }

    return results;
  }

  /**
   * Utility function to chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Compare portfolios to find similarities
   */
  async comparePortfolios(
    walletAddress1: string,
    walletAddress2: string,
  ): Promise<{
    commonTokens: TokenHolding[];
    uniqueToWallet1: TokenHolding[];
    uniqueToWallet2: TokenHolding[];
    similarity: number;
  }> {
    const [portfolio1, portfolio2] = await Promise.all([
      this.getAllTokens(walletAddress1),
      this.getAllTokens(walletAddress2),
    ]);

    const mints1 = new Set(portfolio1.holdings.map((h) => h.mint));
    const mints2 = new Set(portfolio2.holdings.map((h) => h.mint));

    const commonMints = new Set([...mints1].filter((mint) => mints2.has(mint)));

    const commonTokens = portfolio1.holdings.filter((h) =>
      commonMints.has(h.mint),
    );
    const uniqueToWallet1 = portfolio1.holdings.filter(
      (h) => !mints2.has(h.mint),
    );
    const uniqueToWallet2 = portfolio2.holdings.filter(
      (h) => !mints1.has(h.mint),
    );

    const totalUniqueMints = new Set([...mints1, ...mints2]).size;
    const similarity =
      totalUniqueMints > 0 ? (commonMints.size / totalUniqueMints) * 100 : 0;

    return {
      commonTokens,
      uniqueToWallet1,
      uniqueToWallet2,
      similarity,
    };
  }
}
