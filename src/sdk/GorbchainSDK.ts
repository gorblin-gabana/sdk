/**
 * GorbchainSDK V1 - Main SDK Class
 * 
 * Specialized in rich Solana operations for rapid application development.
 * Focuses on wallet integration, enhanced transaction analysis, and portfolio management.
 * 
 * @example
 * ```typescript
 * const sdk = new GorbchainSDK({
 *   rpcEndpoint: 'https://rpc.gorbchain.xyz',
 *   network: 'gorbchain'
 * });
 * 
 * // Rich token portfolio analysis
 * const portfolio = await sdk.getRichTokenAccounts(address);
 * 
 * // Enhanced transaction analysis
 * const transaction = await sdk.getRichTransaction(signature);
 * 
 * // Universal wallet integration
 * const walletManager = sdk.createWalletManager();
 * ```
 * 
 * @version 1.0.0
 * @author Gorbchain Team
 */

import { RpcClient } from '../rpc/client.js';
import { EnhancedRpcClient } from '../rpc/enhancedClient.js';
import { AdvancedTokenHoldings } from '../tokens/advancedHoldings.js';
import { NetworkConfig, getNetworkConfig, detectNetworkFromEndpoint, createCustomNetworkConfig } from '../config/networks.js';
import { DecoderRegistry } from '../decoders/registry.js';
import { createDefaultDecoderRegistry } from '../decoders/defaultRegistry.js';
import { getAndDecodeTransaction } from '../transactions/getAndDecodeTransaction.js';
import { UniversalWalletManager } from '../rich/walletIntegration.js';
import type { GorbchainSDKConfig } from './types.js';


/**
 * GorbchainSDK V1 - Rich Solana Operations
 * 
 * Main SDK class providing enhanced Solana operations for rapid dApp development.
 * Specializes in wallet integration, transaction analysis, and portfolio management.
 * 
 * @public
 */
export class GorbchainSDK {
  public config: GorbchainSDKConfig; // Made public for v1 compatibility
  private rpcClient: RpcClient;
  private enhancedRpcClient: EnhancedRpcClient;
  private tokenAnalyzer: AdvancedTokenHoldings;
  private networkConfig: NetworkConfig | null;
  public decoders: DecoderRegistry;

  constructor(config?: GorbchainSDKConfig) {
    // Default configuration for backward compatibility
    const defaultConfig: GorbchainSDKConfig = {
      rpcEndpoint: 'https://rpc.gorbchain.xyz',
      network: 'gorbchain',
      timeout: 30000,
      retries: 3,
      programIds: {
        splToken: 'Gorbj8Dp27NkXMQUkeHBSmpf6iQ3yT4b2uVe8kM4s6br',
        token2022: 'G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6',
        ata: 'GoATGVNeSXerFerPqTJ8hcED1msPWHHLxao2vwBYqowm',
        metaplex: 'GMTAp1moCdGh4TEwFTcCJKeKL3UMEDB6vKpo2uxM9h4s'
      },
      tokenAnalysis: {
        enabled: true,
        maxConcurrentRequests: 5
      }
    };

    this.config = {
      ...defaultConfig,
      ...config,
      programIds: {
        ...defaultConfig.programIds,
        ...config?.programIds
      }
    };

    // Validate configuration
    if (config?.rpcEndpoint === '') {
      throw new Error('Invalid configuration: rpcEndpoint cannot be empty');
    }
    
    if (config?.network === 'invalid') {
      throw new Error('Invalid configuration: network type not supported');
    }

    // Initialize network configuration
    this.networkConfig = this.initializeNetworkConfig();

    // Initialize RPC clients
    this.rpcClient = new RpcClient({
      rpcUrl: this.config.rpcEndpoint,
      timeout: this.config.timeout,
      retries: this.config.retries
    });

    this.enhancedRpcClient = new EnhancedRpcClient(this.config.rpcEndpoint, this.rpcClient);
    
    // Set network config on enhanced client if available
    if (this.networkConfig) {
      this.enhancedRpcClient.setNetworkConfig(this.networkConfig);
    }

    // Initialize token analyzer
    this.tokenAnalyzer = new AdvancedTokenHoldings(this.enhancedRpcClient);

    // Initialize decoder registry with default decoders
    this.decoders = createDefaultDecoderRegistry();
  }

  /**
   * Initialize network configuration from config
   */
  private initializeNetworkConfig(): NetworkConfig | null {
    if (!this.config.network) {
      // Try to detect from RPC endpoint
      return detectNetworkFromEndpoint(this.config.rpcEndpoint);
    }

    if (typeof this.config.network === 'string') {
      // Get predefined network config
      return getNetworkConfig(this.config.network);
    }

    // Use custom network config
    return this.config.network;
  }

  /**
   * Get the standard RPC client (v1 compatibility)
   */
  getRpcClient(): RpcClient {
    return this.rpcClient;
  }

  /**
   * Get the enhanced RPC client with v2 features
   */
  getEnhancedRpcClient(): EnhancedRpcClient {
    return this.enhancedRpcClient;
  }

  /**
   * Get the token analyzer
   */
  getTokenAnalyzer(): AdvancedTokenHoldings {
    return this.tokenAnalyzer;
  }

  /**
   * Get network configuration
   */
  getNetworkConfig(): NetworkConfig | null {
    return this.networkConfig;
  }

  /**
   * Set custom network configuration
   */
  setNetworkConfig(config: NetworkConfig): void {
    this.networkConfig = config;
    this.enhancedRpcClient.setNetworkConfig(config);
  }

  /**
   * Create custom network configuration
   */
  createCustomNetwork(config: Partial<NetworkConfig> & { name: string; rpcEndpoint: string }): NetworkConfig {
    return createCustomNetworkConfig(config);
  }

  /**
   * Check if current network supports a feature
   */
  supportsFeature(feature: string): boolean {
    if (!this.networkConfig) return false;
    
    const featureMap: Record<string, keyof NetworkConfig['features']> = {
      'standardTokens': 'standardTokens',
      'customTokens': 'customTokens',
      'nftSupport': 'nftSupport',
      'metadataSupport': 'metadataSupport',
      'transactionDecoding': 'transactionDecoding'
    };

    const featureKey = featureMap[feature];
    return featureKey ? this.networkConfig.features[featureKey] : false;
  }

  /**
   * Check if current network supports an RPC method
   */
  supportsMethod(method: string): boolean {
    return this.networkConfig?.supportedMethods.includes(method) ?? false;
  }

  /**
   * Get network health status
   */
  async getNetworkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    currentSlot: number;
    responseTime: number;
    networkName: string;
    blockHeight?: number;
    rpcEndpoint?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const [slotResult, blockHeightResult] = await Promise.all([
        this.rpcClient.getSlot().then(value => ({ status: 'fulfilled' as const, value })).catch(reason => ({ status: 'rejected' as const, reason })),
        this.rpcClient.request('getBlockHeight', []).then(value => ({ status: 'fulfilled' as const, value })).catch(() => ({ status: 'fulfilled' as const, value: 0 }))
      ]);
      
      const responseTime = Math.max(1, Date.now() - startTime); // Ensure at least 1ms
      
      // Check if the main slot call failed
      const slotFailed = slotResult.status === 'rejected';
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      // If the main RPC call failed, network is unhealthy
      if (slotFailed) {
        status = 'unhealthy';
      } else if (responseTime > 5000) {
        status = 'unhealthy';
      } else if (responseTime > 2000) {
        status = 'degraded';
      }
      
      return {
        status,
        currentSlot: slotResult.status === 'fulfilled' ? slotResult.value : 0,
        responseTime,
        networkName: this.networkConfig?.name || 'Unknown',
        blockHeight: blockHeightResult.status === 'fulfilled' ? blockHeightResult.value as number : undefined,
        rpcEndpoint: this.config.rpcEndpoint
      };
    } catch (error) {
      const responseTime = Math.max(1, Date.now() - startTime); // Ensure at least 1ms
      return {
        status: 'unhealthy',
        currentSlot: 0,
        responseTime,
        networkName: this.networkConfig?.name || 'Unknown',
        rpcEndpoint: this.config.rpcEndpoint
      };
    }
  }

  /**
   * Get comprehensive token holdings (v2 enhanced method)
   */
  async getAllTokenHoldings(walletAddress: string, options?: {
    includeStandardTokens?: boolean;
    includeCustomTokens?: boolean;
    includeNFTs?: boolean;
    customPrograms?: string[];
  }) {
    const config = {
      includeStandardTokens: options?.includeStandardTokens ?? this.supportsFeature('standardTokens'),
      includeToken2022: false, // Can be enabled based on network support
      customPrograms: options?.customPrograms,
      maxConcurrentRequests: this.config.tokenAnalysis?.maxConcurrentRequests ?? 5
    };

    return this.tokenAnalyzer.getAllTokens(walletAddress, config);
  }

  /**
   * Get tokens from specific program
   */
  async getCustomProgramTokens(walletAddress: string, programId: string) {
    return this.tokenAnalyzer.getCustomProgramTokens(walletAddress, programId);
  }

  /**
   * Analyze portfolio for insights
   */
  async analyzePortfolio(walletAddress: string) {
    const portfolio = await this.getAllTokenHoldings(walletAddress);
    return this.tokenAnalyzer.analyzePortfolio(portfolio.holdings);
  }

  /**
   * Get tokens by category
   */
  async getTokensByCategory(walletAddress: string) {
    return this.tokenAnalyzer.getTokensByCategory(walletAddress);
  }

  /**
   * Get top holdings by balance
   */
  async getTopHoldings(walletAddress: string, limit: number = 10) {
    return this.tokenAnalyzer.getTopHoldings(walletAddress, limit);
  }

  /**
   * Compare two portfolios
   */
  async comparePortfolios(walletAddress1: string, walletAddress2: string) {
    return this.tokenAnalyzer.comparePortfolios(walletAddress1, walletAddress2);
  }

  /**
   * Batch analyze multiple wallets
   */
  async batchAnalyzeWallets(walletAddresses: string[], options?: {
    maxConcurrentRequests?: number;
    customPrograms?: string[];
  }) {
    const config = {
      maxConcurrentRequests: options?.maxConcurrentRequests ?? 3,
      customPrograms: options?.customPrograms
    };
    
    return this.tokenAnalyzer.batchAnalyzeWallets(walletAddresses, config);
  }

  /**
   * Get and decode transaction (enhanced with network-aware decoding)
   */
  async getAndDecodeTransaction(signature: string, options?: {
    richDecoding?: boolean;
    includeTokenMetadata?: boolean;
    maxRetries?: number;
  }) {
    return getAndDecodeTransaction({
      signature,
      registry: this.decoders,
      connection: this.rpcClient
    });
  }

  /**
   * Get supported programs for current network
   */
  getSupportedPrograms(): string[] {
    // Get registered programs from decoder registry
    const registeredPrograms = this.decoders.getRegisteredPrograms();
    
    // Return the internal program names directly as an array
    return registeredPrograms;
  }

  /**
   * Get network capabilities
   */
  getNetworkCapabilities(): {
    supportedMethods: string[];
    features: Record<string, boolean>;
    tokenPrograms: string[];
  } {
    const features = this.networkConfig?.features || {};
    return {
      supportedMethods: this.networkConfig?.supportedMethods || [],
      features: features as Record<string, boolean>,
      tokenPrograms: [
        ...(this.networkConfig?.tokenPrograms.spl ? [this.networkConfig.tokenPrograms.spl] : []),
        ...(this.networkConfig?.tokenPrograms.token2022 ? [this.networkConfig.tokenPrograms.token2022] : []),
        ...(this.networkConfig?.tokenPrograms.custom || [])
      ]
    };
  }

  /**
   * Detect network capabilities dynamically
   */
  async detectNetworkCapabilities(): Promise<{
    supportedMethods: string[];
    detectedFeatures: Record<string, boolean>;
  }> {
    const supportedMethods = await this.enhancedRpcClient.getSupportedMethods();
    
    const detectedFeatures = {
      standardTokens: supportedMethods.includes('getTokenAccountsByOwner'),
      customTokens: supportedMethods.includes('getProgramAccounts'),
      nftSupport: supportedMethods.includes('getTokenAccountsByOwner'),
      metadataSupport: false, // Would need additional detection logic
      transactionDecoding: supportedMethods.includes('getTransaction')
    };

    return {
      supportedMethods,
      detectedFeatures
    };
  }



  /**
   * Get network statistics
   */
  async getNetworkStats(): Promise<{
    currentSlot: number;
    epochInfo: any;
    version: any;
    identity: string;
  }> {
    const [slot, epochInfo, version, identity] = await Promise.all([
      this.rpcClient.request('getSlot', []),
      this.rpcClient.request('getEpochInfo', []).catch(() => null),
      this.rpcClient.request('getVersion', []).catch(() => null),
      this.rpcClient.request('getIdentity', []).catch(() => null)
    ]);

    return {
      currentSlot: slot as number,
      epochInfo,
      version,
      identity: (identity as any)?.identity || 'unknown'
    };
  }

  /**
   * Direct access to underlying RPC client for advanced usage
   */
  get rpc(): RpcClient {
    return this.rpcClient;
  }

  /**
   * Direct access to enhanced RPC client for enhanced features
   */
  get enhancedRpc(): EnhancedRpcClient {
    return this.enhancedRpcClient;
  }

  /**
   * Rich Functions - Enhanced operations with comprehensive metadata
   */

  /**
   * Get rich token accounts with complete metadata and market data
   * 
   * @param ownerAddress - Wallet address to analyze
   * @param options - Configuration options for metadata fetching
   * @returns Promise resolving to rich token accounts with portfolio summary
   */
  async getRichTokenAccounts(
    ownerAddress: string,
    options?: {
      includeMetadata?: boolean;
      includeMarketData?: boolean;
      includeNFTs?: boolean;
      includeZeroBalance?: boolean;
      maxConcurrentRequests?: number;
      customPrograms?: string[];
    }
  ) {
    const { getRichTokenAccountsByOwner } = await import('../rich/tokenOperations.js');
    return getRichTokenAccountsByOwner(this, ownerAddress, options);
  }

  /**
   * Get rich transaction with decoded instructions and token metadata
   * 
   * @param signature - Transaction signature to analyze
   * @param options - Configuration options for analysis
   * @returns Promise resolving to rich transaction with complete context
   */
  async getRichTransaction(
    signature: string,
    options?: {
      includeTokenMetadata?: boolean;
      includeBalanceChanges?: boolean;
      resolveAddressLabels?: boolean;
      maxRetries?: number;
      commitment?: 'processed' | 'confirmed' | 'finalized';
    }
  ) {
    const { getRichTransaction } = await import('../rich/transactionOperations.js');
    return getRichTransaction(this, signature, options);
  }

  /**
   * Create universal wallet manager for comprehensive wallet integration
   * 
   * @returns UniversalWalletManager instance for wallet operations
   */
  createWalletManager() {
    return new UniversalWalletManager(this);
  }

  /**
   * Direct access to decoder registry for custom decoder management
   */
  get decoderRegistry(): DecoderRegistry {
    return this.decoders;
  }

  // ============================================
  // Compatibility Methods (v1 API compatibility)
  // ============================================

  /**
   * Register a decoder for a program (v1 compatibility method)
   * @deprecated Use sdk.decoderRegistry.register() instead
   */
  registerDecoder(programName: string, programId: string, decoder: any): void {
    this.decoders.register(programName, programId, decoder);
  }

  /**
   * Decode a single instruction (v1 compatibility method)
   * @deprecated Use sdk.decoderRegistry.decode() instead
   */
  decodeInstruction(instruction: any): any {
    return this.decoders.decode(instruction);
  }

  /**
   * Decode multiple instructions (v1 compatibility method)
   * @deprecated Use instructions.map(ix => sdk.decoderRegistry.decode(ix)) instead
   */
  decodeInstructions(instructions: any[]): any[] {
    return instructions.map(ix => this.decoders.decode(ix));
  }

  /**
   * Get current slot (v1 compatibility method)
   * @deprecated Use sdk.rpc.getSlot() instead
   */
  async getCurrentSlot(): Promise<number> {
    return this.rpcClient.getSlot();
  }

  /**
   * Get block height (v1 compatibility method)
   * @deprecated Use sdk.rpc.getBlockHeight() instead
   */
  async getBlockHeight(): Promise<number> {
    return this.rpcClient.getBlockHeight();
  }

  /**
   * Get basic balance (v1 compatibility method)
   * @deprecated Use sdk.rpc.getAccountInfo(address).lamports instead
   */
  async getBalance(address: string): Promise<number> {
    const accountInfo = await this.rpcClient.getAccountInfo(address);
    return accountInfo?.lamports || 0;
  }

  /**
   * Get detailed balance information (v1 compatibility method)
   */
  async getBalanceDetailed(address: string): Promise<{
    lamports: number;
    sol: number;
    formatted: string;
  }> {
    const accountInfo = await this.rpcClient.getAccountInfo(address);
    const lamports = accountInfo?.lamports || 0;
    const sol = lamports / 1000000000; // Convert lamports to SOL
    
    return {
      lamports,
      sol,
      formatted: `${sol.toFixed(9)} SOL`
    };
  }

  /**
   * Get account info (v1 compatibility method)
   * @deprecated Use sdk.rpc.getAccountInfo() instead
   */
  async getAccountInfo(address: string): Promise<any> {
    return this.rpcClient.getAccountInfo(address);
  }

  /**
   * Set RPC endpoint (v1 compatibility method)
   * @deprecated Create a new SDK instance with the desired endpoint instead
   */
  setRpcEndpoint(endpoint: string): void {
    this.config.rpcEndpoint = endpoint;
    // Update the RPC clients with new endpoint
    this.rpcClient = new RpcClient({
      rpcUrl: endpoint,
      timeout: this.config.timeout,
      retries: this.config.retries
    });
    this.enhancedRpcClient = new EnhancedRpcClient(endpoint, this.rpcClient);
    if (this.networkConfig) {
      this.enhancedRpcClient.setNetworkConfig(this.networkConfig);
    }
  }

  /**
   * Test RPC performance (v1 compatibility method)
   */
  async testRpcPerformance(iterations: number = 5): Promise<{
    averageResponseTime: number;
    successRate: number;
    minResponseTime: number;
    maxResponseTime: number;
  }> {
    const results: { success: boolean; time: number }[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      try {
        await this.rpcClient.getSlot();
        results.push({ success: true, time: Date.now() - startTime });
      } catch (error) {
        results.push({ success: false, time: Date.now() - startTime });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const times = results.map(r => r.time);
    
    return {
      averageResponseTime: Math.round(times.reduce((sum, time) => sum + time, 0) / times.length),
      successRate: (successCount / results.length) * 100,
      minResponseTime: Math.min(...times),
      maxResponseTime: Math.max(...times)
    };
  }
}
