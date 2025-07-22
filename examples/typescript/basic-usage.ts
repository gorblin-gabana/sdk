/**
 * GorbchainSDK V1 - Basic Usage Example
 *
 * This example demonstrates the basic setup and usage of GorbchainSDK V1
 * for rapid Solana application development.
 */

import { GorbchainSDK } from "@gorbchain-xyz/chaindecode";
import {
  EXAMPLE_SDK_CONFIG,
  GORBCHAIN_PROGRAMS,
} from "../shared/example-data.js";

async function basicUsageExample() {
  console.log("🚀 GorbchainSDK V1 - Basic Usage Example\n");

  // Initialize the SDK with Gorbchain custom program addresses
  const sdk = new GorbchainSDK(EXAMPLE_SDK_CONFIG);

  console.log("✅ SDK initialized successfully");
  console.log("Network:", sdk.config.network);
  console.log("RPC Endpoint:", sdk.config.rpcEndpoint);

  console.log("\n🔧 Gorbchain Custom Program Addresses:");
  console.log(`SPL Token: ${GORBCHAIN_PROGRAMS.SPL_TOKEN}`);
  console.log(`SPL Token 2022: ${GORBCHAIN_PROGRAMS.SPL_TOKEN_2022}`);
  console.log(`Associated Token: ${GORBCHAIN_PROGRAMS.ASSOCIATED_TOKEN}`);
  console.log(`Metadata: ${GORBCHAIN_PROGRAMS.METADATA}`);

  // Example wallet address (Solana Foundation)
  const walletAddress = "GThUX1Atko4tqhN2NaiTazWSeFWMuiUiswQrunPiLaFU";

  console.log("\n📊 Network Health Check...");
  try {
    const health = await sdk.getNetworkHealth();
    console.log(`Network Status: ${health.status}`);
    console.log(`Current Slot: ${health.currentSlot}`);
    console.log(`Response Time: ${health.responseTime}ms`);
  } catch (error) {
    console.log("Network health check failed (expected for demo)");
  }

  console.log("\n🔧 Network Capabilities...");
  try {
    const capabilities = await sdk.detectNetworkCapabilities();
    console.log(`Supported Methods: ${capabilities.supportedMethods.length}`);
    console.log(
      `Token Support: ${capabilities.detectedFeatures.standardTokens ? "✅" : "❌"}`,
    );
    console.log(
      `NFT Support: ${capabilities.detectedFeatures.nftSupport ? "✅" : "❌"}`,
    );
  } catch (error) {
    console.log("Capabilities detection failed (expected for demo)");
  }

  console.log("\n💡 Direct RPC Access Examples:");
  console.log("For basic operations, use direct RPC access:");
  console.log("- sdk.rpc.getAccountInfo(address)");
  console.log("- sdk.rpc.getSlot()");
  console.log("- sdk.enhancedRpc for network-aware operations");

  console.log("\n🎯 Rich Operations Examples:");
  console.log("Use GorbchainSDK for enhanced operations:");
  console.log("- sdk.getRichTokenAccounts(address) - Portfolio with metadata");
  console.log(
    "- sdk.getRichTransaction(signature) - Decoded transaction context",
  );
  console.log("- sdk.createWalletManager() - Universal wallet integration");

  console.log("\n✨ Ready to build super apps with GorbchainSDK V1!");
}

// Run the example if this file is executed directly
const isMainModule =
  process.argv[1] && process.argv[1].endsWith("basic-usage.ts");
if (isMainModule) {
  basicUsageExample().catch(console.error);
}

export { basicUsageExample };
