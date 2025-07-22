/**
 * Shared Example Data and Utilities
 *
 * Common configuration, addresses, and utilities used across TypeScript examples.
 * This centralizes example data for consistency across all backend examples.
 */

/**
 * Example wallet addresses for testing (replace with real addresses)
 */
export const EXAMPLE_ADDRESSES = {
  // Solana Foundation wallet - well-known public address
  foundation: "GThUX1Atko4tqhN2NaiTazWSeFWMuiUiswQrunPiLaFU",

  // Example wallets for different use cases (replace with real addresses for testing)
  defiTrader: "J3dxNj7nDRRqRRXuEMynDG57DkZK4jYRuv3Garmb1i99",
  nftCollector: "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
  hodler: "DRiP2Pn2K6fuMLKQmt5rZWxa91vSDhqhZF3KZg9gEM5M",
} as const;

/**
 * Example transaction signatures for testing (replace with real signatures)
 */
export const EXAMPLE_TRANSACTIONS = {
  tokenTransfer: {
    signature:
      "5j7s4H8n9QFjA2mP8xV3qE4R9K7nM2sL6tY1uI9oP3wQ8eR5tY1uI9oP3wQ8eR5tY",
    description: "SPL Token transfer transaction",
    type: "Token Transfer",
  },
  nftMint: {
    signature:
      "3k8s5I9p0RgjB3nQ9yW4rF5S0L8oN3tM7uZ2vJ0qQ4xR9fS6uZ2vJ0qQ4xR9fS6uZ",
    description: "NFT minting transaction",
    type: "NFT Mint",
  },
  defiSwap: {
    signature:
      "2h6r3G7m8NqfA1mO7xU2pD4Q8K6nL1sJ5tX0vH8oN2wP7eQ4tX0vH8oN2wP7eQ4tX",
    description: "DeFi token swap transaction",
    type: "DeFi Swap",
  },
} as const;

/**
 * Gorbchain Program Addresses
 */
export const GORBCHAIN_PROGRAMS = {
  // SPL Token Program (Gorbchain custom)
  SPL_TOKEN: "Gorbj8Dp27NkXMQUkeHBSmpf6iQ3yT4b2uVe8kM4s6br",

  // SPL Token 2022 Program (Gorbchain custom)
  SPL_TOKEN_2022: "G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6",

  // Associated Token Account Program (Gorbchain custom)
  ASSOCIATED_TOKEN: "GoATGVNeSXerFerPqTJ8hcED1msPWHHLxao2vwBYqowm",

  // Metadata Program (Gorbchain custom)
  METADATA: "GMTAp1moCdGh4TEwFTcCJKeKL3UMEDB6vKpo2uxM9h4s",
} as const;

/**
 * Standard SDK configuration for examples
 */
export const EXAMPLE_SDK_CONFIG = {
  rpcEndpoint: "https://rpc.gorbchain.xyz",
  network: "gorbchain",
  timeout: 30000,
  // Custom program configurations for Gorbchain
  programIds: {
    splToken: GORBCHAIN_PROGRAMS.SPL_TOKEN,
    splToken2022: GORBCHAIN_PROGRAMS.SPL_TOKEN_2022,
    associatedToken: GORBCHAIN_PROGRAMS.ASSOCIATED_TOKEN,
    metadata: GORBCHAIN_PROGRAMS.METADATA,
  },
} as const;

/**
 * TrashPack wallet injection script path
 */
export const TRASHPACK_INJECTION_SCRIPT = "../utils/injected.js";

/**
 * Standard SDK configuration for testnet examples
 */
export const EXAMPLE_TESTNET_CONFIG = {
  rpcEndpoint: "https://testnet.gorbchain.xyz",
  network: "gorbchain-testnet",
  timeout: 30000,
} as const;

/**
 * Utility function to format wallet addresses for display
 */
export function formatAddress(address: string, chars: number = 8): string {
  if (address.length <= chars * 2) return address;
  return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
}

/**
 * Utility function to format token amounts
 */
export function formatTokenAmount(
  amount: number | string,
  decimals: number = 6,
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * Utility function to add delays between operations for demo purposes
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Utility function to handle example errors consistently
 */
export function handleExampleError(error: unknown, context: string): void {
  console.log(
    `❌ ${context} failed: ${error instanceof Error ? error.message : "Unknown error"}`,
  );
  console.log(
    "💡 This is expected when running with example data in Node.js environment",
  );
}

/**
 * Standard example header
 */
export function printExampleHeader(title: string, description: string): void {
  console.log(`🚀 ${title}`);
  console.log("=".repeat(60));
  console.log(description);
  console.log("=".repeat(60));
  console.log("");
}

/**
 * Standard example footer
 */
export function printExampleFooter(features: string[]): void {
  console.log("\n✨ Example complete!");
  console.log("\n🎯 Key Features Demonstrated:");
  features.forEach((feature) => {
    console.log(`  • ${feature}`);
  });
}
