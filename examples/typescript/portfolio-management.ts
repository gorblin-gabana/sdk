/**
 * GorbchainSDK V1 - Advanced Portfolio Analysis Example
 * 
 * This example demonstrates advanced portfolio operations including
 * portfolio comparison, risk analysis, and comprehensive insights.
 */

import { GorbchainSDK } from '@gorbchain-xyz/chaindecode';
import { EXAMPLE_SDK_CONFIG, EXAMPLE_ADDRESSES, GORBCHAIN_PROGRAMS } from '../shared/example-data.js';

async function advancedPortfolioExample() {
  console.log('📈 GorbchainSDK V1 - Advanced Portfolio Analysis Example\n');

  // Initialize SDK with Gorbchain custom program addresses
  const sdk = new GorbchainSDK(EXAMPLE_SDK_CONFIG);
  
  console.log('🔧 Using Gorbchain Custom Programs for Portfolio Analysis:');
  console.log(`  SPL Token: ${GORBCHAIN_PROGRAMS.SPL_TOKEN.substring(0, 8)}...`);
  console.log(`  SPL Token 2022: ${GORBCHAIN_PROGRAMS.SPL_TOKEN_2022.substring(0, 8)}...`);
  console.log(`  Associated Token: ${GORBCHAIN_PROGRAMS.ASSOCIATED_TOKEN.substring(0, 8)}...`);
  console.log(`  Metadata: ${GORBCHAIN_PROGRAMS.METADATA.substring(0, 8)}...\n`);

  // Example wallet addresses (replace with real addresses for testing)
  const wallets = {
    defiTrader: EXAMPLE_ADDRESSES.defiTrader,
    nftCollector: EXAMPLE_ADDRESSES.nftCollector,
    hodler: EXAMPLE_ADDRESSES.hodler
  };

  console.log('👥 Analyzing Multiple Portfolio Types...\n');

  // 1. Individual Portfolio Analysis
  for (const [type, address] of Object.entries(wallets)) {
    console.log(`📊 ${type.toUpperCase()} Portfolio Analysis:`);
    console.log(`   Address: ${address.substring(0, 8)}...${address.substring(-8)}`);

    try {
      // Get comprehensive portfolio analysis
      const portfolio = await sdk.analyzePortfolio(address);
      
      console.log('\n   🎯 Portfolio Metrics:');
      console.log(`     Total Mints: ${portfolio.diversification.mintCount}`);
      console.log(`     Unique Programs: ${portfolio.diversification.programCount}`);
      console.log(`     Concentration Risk: ${(Number(portfolio.diversification.concentrationRisk) * 100).toFixed(1)}%`);
      
      const riskLevel = Number(portfolio.diversification.concentrationRisk) > 0.7 ? 'High' 
                      : Number(portfolio.diversification.concentrationRisk) > 0.4 ? 'Medium' 
                      : 'Low';
      console.log(`     Risk Level: ${riskLevel}`);

      console.log('\n   🏷️ Token Breakdown:');
      console.log(`     Fungible Tokens: ${portfolio.tokenTypes.fungibleTokens}`);
      console.log(`     NFTs: ${portfolio.tokenTypes.nfts}`);
      console.log(`     Unknown/Custom: ${portfolio.tokenTypes.unknownTokens}`);

      // Get top holdings for this wallet
      const topHoldings = await sdk.getTopHoldings(address, 5);
      if (topHoldings.length > 0) {
        console.log('\n   🏆 Top 5 Holdings:');
        topHoldings.forEach((holding, index) => {
          console.log(`     ${index + 1}. ${holding.metadata?.symbol || 'Unknown'}`);
          console.log(`        Balance: ${holding.balance?.formatted || holding.balance}`);
          console.log(`        Program: ${holding.programId?.substring(0, 8)}...`);
        });
      }

      // Portfolio insights based on type
      console.log('\n   💡 Portfolio Insights:');
      if (type === 'defiTrader') {
        console.log('     • Active DeFi participant');
        console.log('     • High token diversity indicates yield farming');
        console.log('     • Monitor for impermanent loss risk');
      } else if (type === 'nftCollector') {
        console.log('     • Digital art and collectibles focus');
        console.log('     • Consider floor price tracking');
        console.log('     • Evaluate collection rarity scores');
      } else if (type === 'hodler') {
        console.log('     • Long-term investment strategy');
        console.log('     • Focus on blue-chip tokens');
        console.log('     • Consider staking opportunities');
      }

    } catch (error) {
      console.log(`   ❌ Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log('   💡 This is expected with example addresses.');
    }

    console.log('\n' + '-'.repeat(50) + '\n');
  }

  // 2. Portfolio Comparison
  console.log('🔄 Portfolio Comparison Analysis:\n');
  
  try {
    const comparison = await sdk.comparePortfolios(wallets.defiTrader, wallets.nftCollector);
    
    console.log('📊 Comparison Results:');
    console.log(`   Common Tokens: ${comparison.commonTokens.length}`);
    console.log(`   Unique to DeFi Trader: ${comparison.uniqueToWallet1.length}`);
    console.log(`   Unique to NFT Collector: ${comparison.uniqueToWallet2.length}`);
    console.log(`   Portfolio Similarity: ${(comparison.similarity * 100).toFixed(1)}%`);

    if (comparison.similarity > 0.7) {
      console.log('   💡 Very similar portfolios - potential copycat strategy');
    } else if (comparison.similarity > 0.3) {
      console.log('   💡 Some overlap - common market trends');
    } else {
      console.log('   💡 Very different strategies - good diversification');
    }

    if (comparison.commonTokens.length > 0) {
      console.log('\n   🤝 Common Holdings:');
      comparison.commonTokens.slice(0, 3).forEach((token, index) => {
        console.log(`     ${index + 1}. ${token.metadata?.symbol || 'Unknown Token'}`);
      });
    }

  } catch (error) {
    console.log('❌ Portfolio comparison failed (expected with example addresses)');
  }

  // 3. Risk Analysis Demonstration
  console.log('\n⚠️ Risk Analysis Framework:\n');
  
  console.log('🎯 Risk Factors to Monitor:');
  console.log('  1. Concentration Risk:');
  console.log('     • >70% in single token = High Risk');
  console.log('     • 40-70% in single token = Medium Risk');
  console.log('     • <40% in single token = Low Risk');
  
  console.log('\n  2. Liquidity Risk:');
  console.log('     • Check token trading volume');
  console.log('     • Monitor DEX liquidity pools');
  console.log('     • Assess market depth');
  
  console.log('\n  3. Smart Contract Risk:');
  console.log('     • Verify program audits');
  console.log('     • Check upgrade authority');
  console.log('     • Monitor for unusual activities');

  // 4. Performance Tracking Setup
  console.log('\n📈 Performance Tracking Setup:\n');
  
  console.log('💾 Data Points to Track:');
  console.log('  • Portfolio value over time');
  console.log('  • Token allocation changes');
  console.log('  • New token acquisitions');
  console.log('  • Transaction frequency');
  console.log('  • Risk metrics evolution');

  // 5. Advanced Analysis Examples
  console.log('\n🚀 Advanced Analysis Examples:\n');

  console.log('1. Yield Farming Analysis:');
  console.log('```typescript');
  console.log('const portfolio = await sdk.analyzePortfolio(address);');
  console.log('const yieldTokens = portfolio.holdings.filter(h => ');
  console.log('  h.metadata?.name?.includes("LP") || ');
  console.log('  h.metadata?.symbol?.includes("LP")');
  console.log(');');
  console.log('```');

  console.log('\n2. NFT Collection Analysis:');
  console.log('```typescript');
  console.log('const tokens = await sdk.getRichTokenAccounts(address, {');
  console.log('  includeNFTs: true,');
  console.log('  includeMetadata: true');
  console.log('});');
  console.log('const nftsByCollection = tokens.accounts');
  console.log('  .filter(t => t.metadata.isNFT)');
  console.log('  .groupBy(t => t.metadata.collection?.name);');
  console.log('```');

  console.log('\n3. Risk Monitoring:');
  console.log('```typescript');
  console.log('const analysis = await sdk.analyzePortfolio(address);');
  console.log('if (analysis.diversification.concentrationRisk > 0.7) {');
  console.log('  console.warn("High concentration risk detected!");');
  console.log('  // Trigger rebalancing alert');
  console.log('}');
  console.log('```');

  console.log('\n4. Portfolio Rebalancing Suggestions:');
  console.log('```typescript');
  console.log('const suggestions = await generateRebalancingSuggestions(portfolio);');
  console.log('suggestions.forEach(suggestion => {');
  console.log('  console.log(`Consider: ${suggestion.action}`);');
  console.log('  console.log(`Reason: ${suggestion.reason}`);');
  console.log('});');
  console.log('```');

  console.log('\n✨ Advanced portfolio analysis complete!');
  console.log('\n🎯 Key Features Demonstrated:');
  console.log('  • Multi-wallet portfolio analysis');
  console.log('  • Portfolio comparison and similarity scoring');
  console.log('  • Risk assessment and concentration analysis');
  console.log('  • Token categorization and breakdown');
  console.log('  • Performance tracking framework');
  console.log('  • Advanced analysis patterns for different investor types');
}

// Utility function for generating rebalancing suggestions
function generateRebalancingSuggestions(portfolio: any) {
  const suggestions = [];
  
  if (portfolio.diversification.concentrationRisk > 0.7) {
    suggestions.push({
      action: 'Reduce largest position by 20-30%',
      reason: 'High concentration risk detected'
    });
  }
  
  if (portfolio.tokenTypes.nfts === 0 && portfolio.tokenTypes.fungibleTokens > 5) {
    suggestions.push({
      action: 'Consider adding 5-10% NFT allocation',
      reason: 'Portfolio lacks digital collectibles exposure'
    });
  }
  
  if (portfolio.tokenTypes.fungibleTokens < 3) {
    suggestions.push({
      action: 'Increase token diversification',
      reason: 'Portfolio too concentrated in few assets'
    });
  }
  
  return suggestions;
}

// Run the example if this file is executed directly
const isMainModule = process.argv[1] && process.argv[1].endsWith('portfolio-management.ts');
if (isMainModule) {
  advancedPortfolioExample().catch(console.error);
}

export { advancedPortfolioExample };