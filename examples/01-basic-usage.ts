/**
 * GorbchainSDK V1 - Basic Usage Example
 * 
 * This example demonstrates the basic setup and usage of GorbchainSDK V1
 * for rapid Solana application development.
 */

import { GorbchainSDK } from '@gorbchain-xyz/chaindecode';

async function basicUsageExample() {
  console.log('🚀 GorbchainSDK V1 - Basic Usage Example\n');

  // Initialize the SDK
  const sdk = new GorbchainSDK({
    rpcEndpoint: 'https://api.mainnet-beta.solana.com',
    network: 'solana-mainnet',
    timeout: 30000
  });

  console.log('✅ SDK initialized successfully');
  console.log('Network:', sdk.config.network);
  console.log('RPC Endpoint:', sdk.config.rpcEndpoint);

  // Example wallet address (Solana Foundation)
  const walletAddress = 'GThUX1Atko4tqhN2NaiTazWSeFWMuiUiswQrunPiLaFU';

  console.log('\n📊 Network Health Check...');
  try {
    const health = await sdk.getNetworkHealth();
    console.log(`Network Status: ${health.status}`);
    console.log(`Current Slot: ${health.currentSlot}`);
    console.log(`Response Time: ${health.responseTime}ms`);
  } catch (error) {
    console.log('Network health check failed (expected for demo)');
  }

  console.log('\n🔧 Network Capabilities...');
  try {
    const capabilities = await sdk.detectNetworkCapabilities();
    console.log(`Supported Methods: ${capabilities.supportedMethods.length}`);
    console.log(`Token Support: ${capabilities.detectedFeatures.standardTokens ? '✅' : '❌'}`);
    console.log(`NFT Support: ${capabilities.detectedFeatures.nftSupport ? '✅' : '❌'}`);
  } catch (error) {
    console.log('Capabilities detection failed (expected for demo)');
  }

  console.log('\n💡 Direct RPC Access Examples:');
  console.log('For basic operations, use direct RPC access:');
  console.log('- sdk.rpc.getAccountInfo(address)');
  console.log('- sdk.rpc.getSlot()');
  console.log('- sdk.enhancedRpc for network-aware operations');

  console.log('\n🎯 Rich Operations Examples:');
  console.log('Use GorbchainSDK for enhanced operations:');
  console.log('- sdk.getRichTokenAccounts(address) - Portfolio with metadata');
  console.log('- sdk.getRichTransaction(signature) - Decoded transaction context');
  console.log('- sdk.createWalletManager() - Universal wallet integration');

  console.log('\n✨ Ready to build super apps with GorbchainSDK V1!');
}

// Run the example
if (require.main === module) {
  basicUsageExample().catch(console.error);
}

export { basicUsageExample };