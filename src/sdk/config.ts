/**
 * Configuration management for the GorbchainSDK
 */
import type { GorbchainSDKConfig } from "./types.js";

/**
 * Get the default configuration for the GorbchainSDK
 *
 * @returns Default SDK configuration optimized for Gorbchain network
 */
export function getDefaultConfig(): GorbchainSDKConfig {
  return {
    rpcEndpoint: "https://rpc.gorbchain.xyz",
    network: "custom",
    timeout: 30000,
    retries: 3,
    programIds: {
      splToken: "Gorbj8Dp27NkXMQUkeHBSmpf6iQ3yT4b2uVe8kM4s6br",
      token2022: "G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6",
      ata: "GoATGVNeSXerFerPqTJ8hcED1msPWHHLxao2vwBYqowm",
      metaplex: "GMTAp1moCdGh4TEwFTcCJKeKL3UMEDB6vKpo2uxM9h4s",
    },
    richDecoding: {
      enabled: true, // Enabled by default for better user experience
      includeTokenMetadata: true,
      includeNftMetadata: true,
      maxConcurrentRequests: 5,
      enableCache: true,
    },
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
    throw new Error("rpcEndpoint is required in GorbchainSDK configuration");
  }

  if (!config.network) {
    throw new Error("network is required in GorbchainSDK configuration");
  }

  if (
    config.timeout !== undefined &&
    (config.timeout < 1000 || config.timeout > 300000)
  ) {
    throw new Error("timeout must be between 1000ms and 300000ms (5 minutes)");
  }

  if (
    config.retries !== undefined &&
    (config.retries < 0 || config.retries > 10)
  ) {
    throw new Error("retries must be between 0 and 10");
  }

  // Validate richDecoding options
  if (config.richDecoding?.maxConcurrentRequests !== undefined) {
    const max = config.richDecoding.maxConcurrentRequests;
    if (max < 1 || max > 20) {
      throw new Error(
        "richDecoding.maxConcurrentRequests must be between 1 and 20",
      );
    }
  }

  try {
    new URL(config.rpcEndpoint);
  } catch {
    throw new Error("rpcEndpoint must be a valid URL");
  }
}
