/**
 * Configuration management for the GorbchainSDK
 */
import type { GorbchainSDKConfig } from './types.js';

/**
 * Get the default configuration for the GorbchainSDK
 *
 * @returns Default SDK configuration optimized for Gorbchain network
 */
export function getDefaultConfig(): GorbchainSDKConfig {
  return {
    rpcEndpoint: 'https://rpc.gorbchain.xyz',
    network: 'custom',
    timeout: 30000,
    retries: 3,
    programIds: {
      splToken: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      token2022: 'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn',
      ata: '4YpYoLVTQ8bxcne9GneN85RUXeN7pqGTwgPcY71ZL5gX',
      metaplex: 'BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc'
    },
    richDecoding: {
      enabled: true, // Enabled by default for better user experience
      includeTokenMetadata: true,
      includeNftMetadata: true,
      maxConcurrentRequests: 5,
      enableCache: true
    }
  };
}

/**
 * Validate a configuration object to ensure all required fields are present
 *
 * @param config - Configuration object to validate
 * @throws {Error} If configuration is invalid
 */
export function validateConfig(config: GorbchainSDKConfig): void {
  if (!config.rpcEndpoint) {
    throw new Error('rpcEndpoint is required in GorbchainSDK configuration');
  }

  if (!config.network) {
    throw new Error('network is required in GorbchainSDK configuration');
  }

  if (config.timeout !== undefined && (config.timeout < 1000 || config.timeout > 300000)) {
    throw new Error('timeout must be between 1000ms and 300000ms (5 minutes)');
  }

  if (config.retries !== undefined && (config.retries < 0 || config.retries > 10)) {
    throw new Error('retries must be between 0 and 10');
  }

  // Validate richDecoding options
  if (config.richDecoding?.maxConcurrentRequests !== undefined) {
    const max = config.richDecoding.maxConcurrentRequests;
    if (max < 1 || max > 20) {
      throw new Error('richDecoding.maxConcurrentRequests must be between 1 and 20');
    }
  }

  try {
    new URL(config.rpcEndpoint);
  } catch {
    throw new Error('rpcEndpoint must be a valid URL');
  }
}
