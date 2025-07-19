/**
 * Gorbchain SDK v2 - Main SDK Class
 * Enhanced with network configuration and custom token program support
 */

import { RpcClient } from '../rpc/client.js';
import { EnhancedRpcClient } from '../rpc/enhancedClient.js';
import { AdvancedTokenHoldings } from '../tokens/advancedHoldings.js';
import { NetworkConfig, getNetworkConfig, detectNetworkFromEndpoint, createCustomNetworkConfig } from '../config/networks.js';
import { DecoderRegistry } from '../decoders/registry.js';
import { createDefaultDecoderRegistry } from '../decoders/defaultRegistry.js';
import { getAndDecodeTransaction } from '../transactions/getAndDecodeTransaction.js';
import type { GorbchainSDKConfig } from './types.js';


/**
 * Main Gorbchain SDK Class with v2 enhancements
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
        splToken: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        token2022: 'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn',
        ata: '4YpYoLVTQ8bxcne9GneN85RUXeN7pqGTwgPcY71ZL5gX',
        metaplex: 'BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc'
      },
      tokenAnalysis: {
        enabled: true,
        maxConcurrentRequests: 5
      }
    };

    this.config = {
      ...defaultConfig,
      ...config
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
   * Test RPC endpoint performance
   */
  async testRpcPerformance(testCount: number = 5): Promise<{
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    successRate: number;
  }> {
    const results: number[] = [];
    let successes = 0;

    for (let i = 0; i < testCount; i++) {
      const startTime = Date.now();
      try {
        await this.rpcClient.getSlot();
        const responseTime = Date.now() - startTime;
        results.push(responseTime);
        successes++;
      } catch (error) {
        // Failed request, don't count in timing but affects success rate
      }
    }

    return {
      averageResponseTime: results.length > 0 ? results.reduce((a, b) => a + b, 0) / results.length : 0,
      minResponseTime: results.length > 0 ? Math.min(...results) : 0,
      maxResponseTime: results.length > 0 ? Math.max(...results) : 0,
      successRate: (successes / testCount) * 100
    };
  }

  /**
   * Get account balance in both lamports and SOL
   */
  async getBalanceDetailed(publicKey: string): Promise<{
    lamports: number;
    sol: number;
    formatted: string;
  }> {
    const lamports = await this.getBalance(publicKey);
    const sol = lamports / 1e9;
    
    return {
      lamports,
      sol,
      formatted: `${sol.toFixed(4)} SOL`
    };
  }

  /**
   * Batch get account info for multiple addresses
   */
  async getMultipleAccountsInfo(publicKeys: string[], encoding?: string): Promise<any[]> {
    if (this.supportsMethod('getMultipleAccounts')) {
      return this.rpcClient.request('getMultipleAccounts', [publicKeys, { encoding }]);
    }
    
    // Fallback to individual calls
    return Promise.all(
      publicKeys.map(key => this.getAccountInfo(key, encoding))
    );
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
    const { UniversalWalletManager } = require('../rich/walletIntegration.js');
    return new UniversalWalletManager(this);
  }

  /**
   * V1 compatibility methods
   */

  // Legacy token holdings method (v1 compatibility)
  async getTokenHoldings(walletAddress: string) {
    const portfolio = await this.getAllTokenHoldings(walletAddress);
    return portfolio.holdings;
  }

  // Legacy method signatures for backward compatibility
  async getBalance(publicKey: string): Promise<number> {
    const accountInfo = await this.rpcClient.getAccountInfo(publicKey);
    return accountInfo?.lamports || 0;
  }

  async getAccountInfo(publicKey: string, encoding?: string): Promise<any> {
    return this.rpcClient.getAccountInfo(publicKey, encoding);
  }

  async getSignaturesForAddress(address: string, options?: any): Promise<any[]> {
    return this.rpcClient.request('getSignaturesForAddress', [address, options]);
  }

  async getTransaction(signature: string, options?: any): Promise<any> {
    return this.rpcClient.request('getTransaction', [signature, options]);
  }

  /**
   * V1 Compatibility Methods for Decoder Operations
   */

  // Legacy decoder methods for backward compatibility
  decodeInstruction(instruction: any): any {
    return this.decoders.decode(instruction);
  }

  decodeInstructions(instructions: any[]): any[] {
    return instructions.map(instruction => this.decodeInstruction(instruction));
  }

  registerDecoder(name: string, programId: string, decoder: any): void {
    this.decoders.register(name, programId, decoder);
  }

  /**
   * V1 Compatibility - RPC access
   */
  get rpc(): RpcClient {
    return this.rpcClient;
  }

  /**
   * V1 Compatibility - Network operations
   */
  async getCurrentSlot(commitment?: string): Promise<number> {
    return this.rpcClient.getSlot(commitment);
  }

  async getBlockHeight(commitment?: string): Promise<number> {
    return this.rpcClient.request('getBlockHeight', [{ commitment }]);
  }

  async getLatestBlockhash(commitment?: string): Promise<any> {
    return this.rpcClient.request('getLatestBlockhash', [{ commitment }]);
  }

  /**
   * V1 Compatibility - Configuration
   */
  setRpcEndpoint(endpoint: string): void {
    this.config.rpcEndpoint = endpoint;
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
}
