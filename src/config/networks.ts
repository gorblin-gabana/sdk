/**
 * Network Configuration System for Gorbchain SDK v2
 * Provides network-specific configurations and capabilities
 */

export interface TokenPrograms {
  /** Standard SPL Token Program */
  spl?: string;
  /** Token-2022 Program */
  token2022?: string;
  /** Custom token programs specific to the network */
  custom?: string[];
}

export interface NetworkFeatures {
  /** Supports standard SPL tokens */
  standardTokens: boolean;
  /** Supports custom token programs */
  customTokens: boolean;
  /** Supports NFT operations */
  nftSupport: boolean;
  /** Supports token metadata */
  metadataSupport: boolean;
  /** Supports transaction decoding */
  transactionDecoding: boolean;
}

export interface NetworkConfig {
  /** Human-readable network name */
  name: string;
  /** RPC endpoint URL */
  rpcEndpoint: string;
  /** Supported token programs */
  tokenPrograms: TokenPrograms;
  /** RPC methods supported by this network */
  supportedMethods: string[];
  /** Network feature capabilities */
  features: NetworkFeatures;
  /** Network-specific settings */
  settings: {
    /** Default timeout for requests */
    timeout: number;
    /** Default retry attempts */
    retries: number;
    /** Rate limiting (requests per second) */
    rateLimit: number;
  };
}

/**
 * Predefined network configurations
 */
export const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  "mainnet-beta": {
    name: "Solana Mainnet",
    rpcEndpoint: "https://api.mainnet-beta.solana.com",
    tokenPrograms: {
      spl: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      token2022: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
      custom: [],
    },
    supportedMethods: [
      "getBalance",
      "getSlot",
      "getTokenAccountsByOwner",
      "getTokenAccountInfo",
      "getTokenInfo",
      "getProgramAccounts",
      "getAccountInfo",
      "getSignaturesForAddress",
      "getTransaction",
    ],
    features: {
      standardTokens: true,
      customTokens: true,
      nftSupport: true,
      metadataSupport: true,
      transactionDecoding: true,
    },
    settings: {
      timeout: 30000,
      retries: 3,
      rateLimit: 100,
    },
  },

  devnet: {
    name: "Solana Devnet",
    rpcEndpoint: "https://api.devnet.solana.com",
    tokenPrograms: {
      spl: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      token2022: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
      custom: [],
    },
    supportedMethods: [
      "getBalance",
      "getSlot",
      "getTokenAccountsByOwner",
      "getTokenAccountInfo",
      "getTokenInfo",
      "getProgramAccounts",
      "getAccountInfo",
      "getSignaturesForAddress",
      "getTransaction",
    ],
    features: {
      standardTokens: true,
      customTokens: true,
      nftSupport: true,
      metadataSupport: true,
      transactionDecoding: true,
    },
    settings: {
      timeout: 30000,
      retries: 3,
      rateLimit: 100,
    },
  },

  testnet: {
    name: "Solana Testnet",
    rpcEndpoint: "https://api.testnet.solana.com",
    tokenPrograms: {
      spl: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      token2022: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
      custom: [],
    },
    supportedMethods: [
      "getBalance",
      "getSlot",
      "getTokenAccountsByOwner",
      "getTokenAccountInfo",
      "getTokenInfo",
      "getProgramAccounts",
      "getAccountInfo",
      "getSignaturesForAddress",
      "getTransaction",
    ],
    features: {
      standardTokens: true,
      customTokens: true,
      nftSupport: true,
      metadataSupport: true,
      transactionDecoding: true,
    },
    settings: {
      timeout: 30000,
      retries: 3,
      rateLimit: 100,
    },
  },

  gorbchain: {
    name: "Gorbchain Network",
    rpcEndpoint: "https://rpc.gorbchain.xyz",
    tokenPrograms: {
      // Standard SPL tokens are supported but not commonly used
      spl: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      // Custom Gorbchain token program
      custom: ["G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6"],
    },
    supportedMethods: [
      "getBalance",
      "getSlot",
      "getProgramAccounts",
      "getAccountInfo",
      "getSignaturesForAddress",
      "getTransaction",
      // Note: getTokenAccountsByOwner, getTokenAccountInfo, getTokenInfo are NOT supported
    ],
    features: {
      standardTokens: false, // Not commonly used
      customTokens: true,
      nftSupport: true,
      metadataSupport: false, // Custom tokens don't use standard metadata
      transactionDecoding: true,
    },
    settings: {
      timeout: 30000,
      retries: 3,
      rateLimit: 50, // More conservative rate limiting
    },
  },
};

/**
 * Get network configuration by name or RPC endpoint
 */
export function getNetworkConfig(identifier: string): NetworkConfig | null {
  // Try exact match by name first
  if (NETWORK_CONFIGS[identifier]) {
    return NETWORK_CONFIGS[identifier];
  }

  // Try to match by RPC endpoint
  for (const [name, config] of Object.entries(NETWORK_CONFIGS)) {
    if (config.rpcEndpoint === identifier) {
      return config;
    }
  }

  return null;
}

/**
 * Detect network configuration from RPC endpoint
 */
export function detectNetworkFromEndpoint(
  rpcEndpoint: string,
): NetworkConfig | null {
  // Known endpoint patterns
  const endpointPatterns = [
    { pattern: /mainnet-beta\.solana\.com/, network: "mainnet-beta" },
    { pattern: /api\.mainnet-beta\.solana\.com/, network: "mainnet-beta" },
    { pattern: /devnet\.solana\.com/, network: "devnet" },
    { pattern: /api\.devnet\.solana\.com/, network: "devnet" },
    { pattern: /testnet\.solana\.com/, network: "testnet" },
    { pattern: /api\.testnet\.solana\.com/, network: "testnet" },
    { pattern: /rpc\.gorbchain\.xyz/, network: "gorbchain" },
  ];

  for (const { pattern, network } of endpointPatterns) {
    if (pattern.test(rpcEndpoint)) {
      return NETWORK_CONFIGS[network];
    }
  }

  return null;
}

/**
 * Create a custom network configuration
 */
export function createCustomNetworkConfig(
  baseConfig: Partial<NetworkConfig> & { name: string; rpcEndpoint: string },
): NetworkConfig {
  const defaultConfig: NetworkConfig = {
    name: baseConfig.name,
    rpcEndpoint: baseConfig.rpcEndpoint,
    tokenPrograms: {
      spl: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      custom: [],
    },
    supportedMethods: ["getBalance", "getSlot", "getAccountInfo"],
    features: {
      standardTokens: false,
      customTokens: false,
      nftSupport: false,
      metadataSupport: false,
      transactionDecoding: false,
    },
    settings: {
      timeout: 30000,
      retries: 3,
      rateLimit: 50,
    },
  };

  return {
    ...defaultConfig,
    ...baseConfig,
    tokenPrograms: {
      ...defaultConfig.tokenPrograms,
      ...baseConfig.tokenPrograms,
    },
    features: {
      ...defaultConfig.features,
      ...baseConfig.features,
    },
    settings: {
      ...defaultConfig.settings,
      ...baseConfig.settings,
    },
  };
}

/**
 * Validate network configuration
 */
export function validateNetworkConfig(config: NetworkConfig): string[] {
  const errors: string[] = [];

  if (!config.name) {
    errors.push("Network name is required");
  }

  if (!config.rpcEndpoint) {
    errors.push("RPC endpoint is required");
  }

  try {
    new URL(config.rpcEndpoint);
  } catch {
    errors.push("RPC endpoint must be a valid URL");
  }

  if (!config.tokenPrograms) {
    errors.push("Token programs configuration is required");
  }

  if (!Array.isArray(config.supportedMethods)) {
    errors.push("Supported methods must be an array");
  }

  if (!config.features) {
    errors.push("Features configuration is required");
  }

  if (!config.settings) {
    errors.push("Settings configuration is required");
  }

  return errors;
}

/**
 * Get all available network names
 */
export function getAvailableNetworks(): string[] {
  return Object.keys(NETWORK_CONFIGS);
}

/**
 * Check if a network supports a specific feature
 */
export function networkSupportsFeature(
  networkName: string,
  feature: keyof NetworkFeatures,
): boolean {
  const config = getNetworkConfig(networkName);
  return config?.features[feature] ?? false;
}

/**
 * Check if a network supports a specific RPC method
 */
export function networkSupportsMethod(
  networkName: string,
  method: string,
): boolean {
  const config = getNetworkConfig(networkName);
  return config?.supportedMethods.includes(method) ?? false;
}
