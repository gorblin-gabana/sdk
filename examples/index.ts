/**
 * GorbchainSDK V1 - Complete Examples Collection
 * 
 * This file imports and runs all examples to demonstrate the full capabilities
 * of GorbchainSDK V1 for rapid Solana application development.
 */

import { basicUsageExample } from './typescript/basic-usage.js';
import { richTokenAnalysisExample } from './typescript/token-analysis.js';
import { richTransactionAnalysisExample } from './typescript/transaction-analysis.js';
import { walletIntegrationExample } from './typescript/wallet-integration.js';
import { advancedPortfolioExample } from './typescript/portfolio-management.js';

/**
 * Run all GorbchainSDK V1 examples in sequence
 */
async function runAllExamples() {
  console.log('🚀 GorbchainSDK V1 - Complete Examples Showcase');
  console.log('='.repeat(60));
  console.log('');
  console.log('This demonstration showcases the key capabilities of GorbchainSDK V1:');
  console.log('• Rich wallet integration across all Solana providers');
  console.log('• Enhanced transaction analysis with decoded context');
  console.log('• Advanced portfolio management with metadata');
  console.log('• Performance-optimized operations for production apps');
  console.log('');
  console.log('Perfect for building DeFi apps, NFT marketplaces, and portfolio trackers!');
  console.log('');
  console.log('='.repeat(60));
  console.log('');

  const examples = [
    { name: 'Basic SDK Usage & Setup', fn: basicUsageExample },
    { name: 'Token Portfolio Analysis', fn: richTokenAnalysisExample },
    { name: 'Transaction Analysis & Decoding', fn: richTransactionAnalysisExample },
    { name: 'Universal Wallet Integration', fn: walletIntegrationExample },
    { name: 'Advanced Portfolio Management', fn: advancedPortfolioExample }
  ];

  for (const [index, example] of examples.entries()) {
    console.log(`\n${'█'.repeat(20)} EXAMPLE ${index + 1}/5 ${'█'.repeat(20)}`);
    console.log(`🎯 ${example.name.toUpperCase()}`);
    console.log('█'.repeat(60));
    
    try {
      await example.fn();
    } catch (error) {
      console.error(`❌ Example "${example.name}" failed:`, error instanceof Error ? error.message : error);
      console.log('💡 This is expected when running with example data in Node.js environment');
    }
    
    console.log('\n' + '█'.repeat(60));
    
    // Add a small delay between examples for readability
    if (index < examples.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n🎉 ALL EXAMPLES COMPLETED!');
  console.log('\n📚 Next Steps:');
  console.log('1. Replace example addresses with real wallet addresses');
  console.log('2. Set up proper RPC endpoints for your network');
  console.log('3. Configure market data APIs if needed');
  console.log('4. Test in browser environment for wallet integration');
  console.log('5. Build your super app with GorbchainSDK V1!');
  
  console.log('\n🔗 Quick Start:');
  console.log('```bash');
  console.log('npm install @gorbchain-xyz/chaindecode');
  console.log('```');
  
  console.log('\n```typescript');
  console.log('import { GorbchainSDK } from "@gorbchain-xyz/chaindecode";');
  console.log('');
  console.log('const sdk = new GorbchainSDK({');
  console.log('  rpcEndpoint: "https://rpc.gorbchain.xyz"');
  console.log('});');
  console.log('');
  console.log('// Rich token analysis');
  console.log('const portfolio = await sdk.getRichTokenAccounts(address);');
  console.log('');
  console.log('// Enhanced transaction analysis');
  console.log('const transaction = await sdk.getRichTransaction(signature);');
  console.log('');
  console.log('// Universal wallet integration');
  console.log('const walletManager = sdk.createWalletManager();');
  console.log('const wallet = await walletManager.connectWallet("phantom");');
  console.log('```');
  
  console.log('\n✨ Happy building with GorbchainSDK V1!');
}

/**
 * Run individual examples
 */
export const examples = {
  basic: basicUsageExample,
  tokens: richTokenAnalysisExample,
  transactions: richTransactionAnalysisExample,
  wallets: walletIntegrationExample,
  portfolio: advancedPortfolioExample,
  all: runAllExamples
};

// CLI interface
if (require.main === module) {
  const exampleName = process.argv[2];
  
  if (!exampleName) {
    console.log('🚀 GorbchainSDK V1 Examples');
    console.log('\nUsage: npm run example [name]');
    console.log('\nAvailable examples:');
    console.log('  basic        - Basic SDK setup and usage');
    console.log('  tokens       - Token portfolio analysis with metadata'); 
    console.log('  transactions - Transaction analysis and decoding');
    console.log('  wallets      - Universal wallet integration');
    console.log('  portfolio    - Advanced portfolio management');
    console.log('  all          - Run all examples in sequence');
    console.log('\nExample: npm run example tokens');
    process.exit(0);
  }
  
  const example = examples[exampleName as keyof typeof examples];
  if (!example) {
    console.error(`❌ Unknown example: ${exampleName}`);
    console.log('Available examples:', Object.keys(examples).join(', '));
    process.exit(1);
  }
  
  example().catch((error) => {
    console.error('❌ Example failed:', error);
    process.exit(1);
  });
}

export default examples;