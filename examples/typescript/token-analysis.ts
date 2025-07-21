/**
 * GorbchainSDK V1 - Rich Token Analysis Example
 * 
 * This example demonstrates how to analyze token portfolios with complete
 * metadata, market data, and portfolio insights using GorbchainSDK V1.
 */

import { GorbchainSDK, getRichTokenAccountsByOwner } from '@gorbchain-xyz/chaindecode';
import { EXAMPLE_SDK_CONFIG, EXAMPLE_ADDRESSES, GORBCHAIN_PROGRAMS } from '../shared/example-data.js';

async function richTokenAnalysisExample() {
  console.log('🎯 GorbchainSDK V1 - Rich Token Analysis Example\n');

  // Initialize SDK with Gorbchain custom program addresses
  const sdk = new GorbchainSDK(EXAMPLE_SDK_CONFIG);

  // Example wallet with diverse portfolio (replace with real address for testing)
  const walletAddress = EXAMPLE_ADDRESSES.foundation;

  console.log(`📱 Analyzing portfolio for: ${walletAddress.substring(0, 8)}...\n`);
  console.log('🔧 Using Gorbchain Custom Token Programs:');
  console.log(`  SPL Token: ${GORBCHAIN_PROGRAMS.SPL_TOKEN.substring(0, 8)}...`);
  console.log(`  SPL Token 2022: ${GORBCHAIN_PROGRAMS.SPL_TOKEN_2022.substring(0, 8)}...`);
  console.log(`  Associated Token: ${GORBCHAIN_PROGRAMS.ASSOCIATED_TOKEN.substring(0, 8)}...`);
  console.log(`  Metadata: ${GORBCHAIN_PROGRAMS.METADATA.substring(0, 8)}...\n`);

  try {
    // Method 1: Using SDK instance method
    console.log('Method 1: Using SDK instance method');
    const portfolioSDK = await sdk.getRichTokenAccounts(walletAddress, {
      includeMetadata: true,
      includeMarketData: false, // Set to true if you have market data API
      includeNFTs: true,
      includeZeroBalance: false,
      maxConcurrentRequests: 5
    });

    console.log('📊 Portfolio Summary (SDK Method):');
    console.log(`  Total Tokens: ${portfolioSDK.summary.totalTokens}`);
    console.log(`  Total NFTs: ${portfolioSDK.summary.totalNFTs}`);
    console.log(`  Diversity Score: ${(portfolioSDK.summary.diversityScore * 100).toFixed(1)}%`);
    console.log(`  Analysis Duration: ${portfolioSDK.meta.duration}ms`);

    // Method 2: Using standalone function
    console.log('\nMethod 2: Using standalone function');
    const portfolioStandalone = await getRichTokenAccountsByOwner(sdk, walletAddress, {
      includeMetadata: true,
      includeNFTs: false, // Focus on fungible tokens only
      maxConcurrentRequests: 3
    });

    console.log('📊 Fungible Tokens Analysis:');
    console.log(`  Fungible Tokens: ${portfolioStandalone.summary.totalTokens}`);
    
    // Display top holdings
    if (portfolioStandalone.summary.topHoldings.length > 0) {
      console.log('\n🏆 Top Holdings:');
      portfolioStandalone.summary.topHoldings.forEach((holding, index) => {
        console.log(`  ${index + 1}. ${holding.symbol}: ${holding.percentage.toFixed(2)}%`);
      });
    }

    // Analyze individual token accounts
    console.log('\n🔍 Token Account Details:');
    portfolioStandalone.accounts.slice(0, 3).forEach((account, index) => {
      console.log(`\n  Token ${index + 1}:`);
      console.log(`    Symbol: ${account.metadata.symbol || 'Unknown'}`);
      console.log(`    Name: ${account.metadata.name || 'Unknown Token'}`);
      console.log(`    Balance: ${account.balance}`);
      console.log(`    Decimals: ${account.decimals}`);
      console.log(`    Program: ${account.program.type}`);
      console.log(`    Is NFT: ${account.metadata.isNFT ? '✅' : '❌'}`);
    });

    // Portfolio insights
    console.log('\n💡 Portfolio Insights:');
    if (portfolioSDK.summary.diversityScore > 0.7) {
      console.log('  ✅ Well diversified portfolio');
    } else if (portfolioSDK.summary.diversityScore > 0.4) {
      console.log('  ⚠️  Moderately diversified portfolio');
    } else {
      console.log('  🔴 Low diversification - consider rebalancing');
    }

    if (portfolioSDK.summary.totalNFTs > 0) {
      console.log(`  🎨 NFT collector with ${portfolioSDK.summary.totalNFTs} digital assets`);
    }

    if (portfolioSDK.summary.totalTokens > 10) {
      console.log('  🚀 Active DeFi participant');
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error instanceof Error ? error.message : 'Unknown error');
    console.log('\n💡 This is expected when running with example addresses.');
    console.log('   Replace with a real wallet address for actual analysis.');
  }

  console.log('\n✨ Rich token analysis complete!');
  console.log('\n📚 Key Features Demonstrated:');
  console.log('  • Complete token metadata resolution');
  console.log('  • Portfolio diversity analysis');
  console.log('  • NFT vs fungible token categorization');
  console.log('  • Performance-optimized concurrent requests');
  console.log('  • Multiple usage patterns (SDK method vs standalone function)');
}

// Run the example if this file is executed directly
const isMainModule = process.argv[1] && process.argv[1].endsWith('token-analysis.ts');
if (isMainModule) {
  richTokenAnalysisExample().catch(console.error);
}

export { richTokenAnalysisExample };