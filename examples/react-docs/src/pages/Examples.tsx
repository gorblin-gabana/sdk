import { useState } from 'react'
import CodeBlock from '../components/CodeBlock'
import { 
  CubeIcon,
  WalletIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  BeakerIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'

export default function ExamplesV1() {
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({})
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['basic']))

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopied(prev => ({ ...prev, [id]: true }))
    setTimeout(() => {
      setCopied(prev => ({ ...prev, [id]: false }))
    }, 2000)
  }

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const basicUsageCode = `/**
 * GorbchainSDK V1 - Basic Usage Example
 * Demonstrates SDK initialization and basic operations
 */
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode';

async function basicUsageExample() {
  console.log('🚀 GorbchainSDK V1 - Basic Usage Example\\n');

  // Initialize the SDK with Gorbchain custom program addresses
  const sdk = new GorbchainSDK({
    rpcEndpoint: 'https://rpc.gorbchain.xyz',
    network: 'gorbchain',
    timeout: 30000,
    // Gorbchain custom program addresses
    programIds: {
      splToken: 'Gorbj8Dp27NkXMQUkeHBSmpf6iQ3yT4b2uVe8kM4s6br',
      splToken2022: 'G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6',
      associatedToken: 'GoATGVNeSXerFerPqTJ8hcED1msPWHHLxao2vwBYqowm',
      metadata: 'GMTAp1moCdGh4TEwFTcCJKeKL3UMEDB6vKpo2uxM9h4s'
    }
  });

  console.log('✅ SDK initialized successfully');
  console.log('Network:', sdk.config.network);
  console.log('RPC Endpoint:', sdk.config.rpcEndpoint);

  // Example wallet address (Solana Foundation)
  const walletAddress = 'GThUX1Atko4tqhN2NaiTazWSeFWMuiUiswQrunPiLaFU';

  console.log('\\n📊 Network Health Check...');
  try {
    const health = await sdk.getNetworkHealth();
    console.log(\`Network Status: \${health.status}\`);
    console.log(\`Current Slot: \${health.currentSlot}\`);
    console.log(\`Response Time: \${health.responseTime}ms\`);
  } catch (error) {
    console.log('Network health check failed (expected for demo)');
  }

  console.log('\\n🔧 Network Capabilities...');
  try {
    const capabilities = await sdk.detectNetworkCapabilities();
    console.log(\`Supported Methods: \${capabilities.supportedMethods.length}\`);
    console.log(\`Token Support: \${capabilities.detectedFeatures.standardTokens ? '✅' : '❌'}\`);
    console.log(\`NFT Support: \${capabilities.detectedFeatures.nftSupport ? '✅' : '❌'}\`);
  } catch (error) {
    console.log('Capabilities detection failed (expected for demo)');
  }

  console.log('\\n💡 Direct RPC Access Examples:');
  console.log('For basic operations, use direct RPC access:');
  console.log('- sdk.rpc.getAccountInfo(address)');
  console.log('- sdk.rpc.getSlot()');
  console.log('- sdk.enhancedRpc for network-aware operations');

  console.log('\\n🎯 Rich Operations Examples:');
  console.log('Use GorbchainSDK for enhanced operations:');
  console.log('- sdk.getRichTokenAccounts(address) - Portfolio with metadata');
  console.log('- sdk.getRichTransaction(signature) - Decoded transaction context');
  console.log('- sdk.createWalletManager() - Universal wallet integration');

  console.log('\\n✨ Ready to build super apps with GorbchainSDK V1!');
}

export { basicUsageExample };`

  const richTokenAnalysisCode = `/**
 * GorbchainSDK V1 - Rich Token Analysis Example
 * Demonstrates portfolio analysis with metadata and insights
 */
import { GorbchainSDK, getRichTokenAccountsByOwner } from '@gorbchain-xyz/chaindecode';

async function richTokenAnalysisExample() {
  console.log('🎯 GorbchainSDK V1 - Rich Token Analysis Example\\n');

  // Initialize SDK with Gorbchain custom program addresses
  const sdk = new GorbchainSDK({
    rpcEndpoint: 'https://rpc.gorbchain.xyz',
    network: 'gorbchain',
    programIds: {
      splToken: 'Gorbj8Dp27NkXMQUkeHBSmpf6iQ3yT4b2uVe8kM4s6br',
      splToken2022: 'G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6',
      associatedToken: 'GoATGVNeSXerFerPqTJ8hcED1msPWHHLxao2vwBYqowm',
      metadata: 'GMTAp1moCdGh4TEwFTcCJKeKL3UMEDB6vKpo2uxM9h4s'
    }
  });

  // Example wallet with diverse portfolio (replace with real address)
  const walletAddress = 'GThUX1Atko4tqhN2NaiTazWSeFWMuiUiswQrunPiLaFU';

  console.log(\`📱 Analyzing portfolio for: \${walletAddress.substring(0, 8)}...\\n\`);

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
    console.log(\`  Total Tokens: \${portfolioSDK.summary.totalTokens}\`);
    console.log(\`  Total NFTs: \${portfolioSDK.summary.totalNFTs}\`);
    console.log(\`  Diversity Score: \${(portfolioSDK.summary.diversityScore * 100).toFixed(1)}%\`);
    console.log(\`  Analysis Duration: \${portfolioSDK.meta.duration}ms\`);

    // Display top holdings
    console.log('\\n🏆 Top Holdings:');
    portfolioSDK.accounts.slice(0, 5).forEach((account, index) => {
      const token = account.tokenInfo;
      console.log(\`  \${index + 1}. \${token?.name || 'Unknown Token'}\`);
      console.log(\`     Symbol: \${token?.symbol || 'N/A'}\`);
      console.log(\`     Balance: \${account.balance.formatted}\`);
      console.log(\`     Type: \${account.isNFT ? 'NFT' : 'Fungible Token'}\`);
    });

    // Portfolio insights
    if (portfolioSDK.insights) {
      console.log('\\n🔍 Portfolio Insights:');
      console.log(\`  Risk Level: \${portfolioSDK.insights.riskLevel}\`);
      console.log(\`  Concentration: \${(portfolioSDK.insights.concentration * 100).toFixed(1)}%\`);
      console.log(\`  Liquidity Score: \${(portfolioSDK.insights.liquidityScore * 100).toFixed(1)}%\`);
    }

    // Method 2: Using standalone function
    console.log('\\nMethod 2: Using standalone function');
    const portfolioStandalone = await getRichTokenAccountsByOwner(sdk, walletAddress, {
      includeMetadata: true,
      includeNFTs: false, // Focus on fungible tokens only
      maxConcurrentRequests: 3
    });

    console.log('📊 Fungible Tokens Analysis:');
    console.log(\`  Fungible Tokens: \${portfolioStandalone.summary.totalTokens}\`);
    console.log(\`  Performance: \${portfolioStandalone.meta.duration}ms\`);

  } catch (error) {
    console.error('Error analyzing portfolio:', error instanceof Error ? error.message : error);
    console.log('💡 This is expected when running with example data');
  }

  console.log('\\n✨ Portfolio analysis complete!');
}

export { richTokenAnalysisExample };`

  const transactionAnalysisCode = `/**
 * GorbchainSDK V1 - Rich Transaction Analysis Example
 * Demonstrates enhanced transaction decoding with context
 */
import { GorbchainSDK, getRichTransaction } from '@gorbchain-xyz/chaindecode';

async function richTransactionAnalysisExample() {
  console.log('🔍 GorbchainSDK V1 - Rich Transaction Analysis Example\\n');

  // Initialize SDK with Gorbchain custom program addresses
  const sdk = new GorbchainSDK({
    rpcEndpoint: 'https://rpc.gorbchain.xyz',
    network: 'gorbchain',
    programIds: {
      splToken: 'Gorbj8Dp27NkXMQUkeHBSmpf6iQ3yT4b2uVe8kM4s6br',
      splToken2022: 'G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6',
      associatedToken: 'GoATGVNeSXerFerPqTJ8hcED1msPWHHLxao2vwBYqowm',
      metadata: 'GMTAp1moCdGh4TEwFTcCJKeKL3UMEDB6vKpo2uxM9h4s'
    }
  });

  // Example transaction signatures (replace with real signatures)
  const exampleTransactions = [
    {
      name: 'Token Transfer',
      signature: '5j7s4H8n9QFjA2mP8xV3qE4R9K7nM2sL6tY1uI9oP3wQ8eR5tY1uI9oP3wQ8eR5tY',
      description: 'SPL Token transfer transaction'
    },
    {
      name: 'NFT Mint',
      signature: '3k8s5I9p0RgjB3nQ9yW4rF5S0L8oN3tM7uZ2vJ0qQ4xR9fS6uZ2vJ0qQ4xR9fS6uZ',
      description: 'NFT minting transaction'
    }
  ];

  console.log('📜 Analyzing Transaction Examples...\\n');

  for (const [index, txExample] of exampleTransactions.entries()) {
    console.log(\`\${index + 1}. \${txExample.name} Analysis:\`);
    console.log(\`   Description: \${txExample.description}\`);
    console.log(\`   Signature: \${txExample.signature.substring(0, 20)}...\`);

    try {
      // Method 1: Using SDK instance method
      const richTx = await sdk.getRichTransaction(txExample.signature, {
        includeTokenMetadata: true,
        includeBalanceChanges: true,
        resolveAddressLabels: false,
        commitment: 'finalized'
      });

      console.log('\\n   📊 Transaction Summary:');
      console.log(\`     Primary Action: \${richTx.summary.primaryAction}\`);
      console.log(\`     Description: \${richTx.summary.description}\`);
      console.log(\`     Category: \${richTx.summary.category}\`);
      console.log(\`     Success: \${richTx.success ? '✅' : '❌'}\`);
      console.log(\`     Fee: \${richTx.fee / 1e9} SOL\`);

      // Token operations
      if (richTx.tokenOperations && richTx.tokenOperations.length > 0) {
        console.log('\\n   🪙 Token Operations:');
        richTx.tokenOperations.forEach((op, i) => {
          console.log(\`     \${i + 1}. \${op.type}: \${op.action}\`);
          if (op.tokenInfo) {
            console.log(\`        Token: \${op.tokenInfo.name} (\${op.tokenInfo.symbol})\`);
            console.log(\`        Amount: \${op.amount || 'N/A'}\`);
          }
        });
      }

      // Balance changes
      if (richTx.balanceChanges && richTx.balanceChanges.length > 0) {
        console.log('\\n   💰 Balance Changes:');
        richTx.balanceChanges.slice(0, 3).forEach((change, i) => {
          console.log(\`     \${i + 1}. \${change.account.substring(0, 8)}...\`);
          console.log(\`        Change: \${change.change > 0 ? '+' : ''}\${change.change / 1e9} SOL\`);
        });
      }

    } catch (error) {
      console.log('\\n   ❌ Analysis failed (expected with example data)');
      console.log(\`      Error: \${error instanceof Error ? error.message : 'Unknown error'}\`);
    }

    console.log('\\n' + '-'.repeat(50));
  }

  console.log('\\n✨ Transaction analysis examples complete!');
}

export { richTransactionAnalysisExample };`

  const walletIntegrationCode = `/**
 * GorbchainSDK V1 - Universal Wallet Integration Example
 * Demonstrates connecting to all Solana wallets universally
 */
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode';

async function walletIntegrationExample() {
  console.log('🔗 GorbchainSDK V1 - Wallet Integration Example\\n');

  // Initialize SDK with Gorbchain custom program addresses
  const sdk = new GorbchainSDK({
    rpcEndpoint: 'https://rpc.gorbchain.xyz',
    network: 'gorbchain',
    programIds: {
      splToken: 'Gorbj8Dp27NkXMQUkeHBSmpf6iQ3yT4b2uVe8kM4s6br',
      splToken2022: 'G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6',
      associatedToken: 'GoATGVNeSXerFerPqTJ8hcED1msPWHHLxao2vwBYqowm',
      metadata: 'GMTAp1moCdGh4TEwFTcCJKeKL3UMEDB6vKpo2uxM9h4s'
    }
  });

  console.log('🔍 Creating wallet manager...');
  
  try {
    // Create universal wallet manager
    const walletManager = sdk.createWalletManager();
    
    console.log('✅ Wallet manager created successfully');

    // Discover available wallets
    console.log('\\n🔍 Discovering available wallets...');
    const discovery = await walletManager.discoverWallets({
      includeExtensions: true,
      includeMobileWallets: true,
      includeHardwareWallets: false
    });

    console.log('📱 Wallet Discovery Results:');
    console.log(\`  Total wallets found: \${discovery.totalFound}\`);
    console.log(\`  Browser extensions: \${discovery.browserExtensions.length}\`);
    console.log(\`  Mobile wallets: \${discovery.mobileWallets.length}\`);
    console.log(\`  Recommended: \${discovery.recommended?.name || 'None'}\`);

    // Display available wallets
    if (discovery.browserExtensions.length > 0) {
      console.log('\\n🌐 Available Browser Wallets:');
      discovery.browserExtensions.forEach((wallet, index) => {
        console.log(\`  \${index + 1}. \${wallet.name}\`);
        console.log(\`     Ready: \${wallet.readyState}\`);
        console.log(\`     Icon: \${wallet.icon ? '✅' : '❌'}\`);
        console.log(\`     URL: \${wallet.url || 'N/A'}\`);
      });
    }

    // Auto-connect example
    console.log('\\n🔄 Attempting auto-connect...');
    const autoConnectedWallet = await walletManager.autoConnect({
      timeout: 10000,
      preferredWallets: ['trashpack', 'phantom', 'solflare', 'backpack']
    });

    if (autoConnectedWallet) {
      console.log('✅ Auto-connect successful!');
      console.log(\`   Wallet: \${autoConnectedWallet.name}\`);
      console.log(\`   Address: \${autoConnectedWallet.publicKey?.toString().substring(0, 8)}...\`);
      
      // Get portfolio for connected wallet
      if (autoConnectedWallet.publicKey) {
        console.log('\\n📊 Analyzing connected wallet portfolio...');
        const portfolio = await autoConnectedWallet.getPortfolioSummary();
        
        console.log('💼 Portfolio Summary:');
        console.log(\`   SOL Balance: \${portfolio.solBalance} SOL\`);
        console.log(\`   Token Count: \${portfolio.tokenCount}\`);
        console.log(\`   NFT Count: \${portfolio.nftCount}\`);
        console.log(\`   Total Value: \${portfolio.totalValue || 'Unknown'}\`);
      }
    } else {
      console.log('❌ Auto-connect failed (expected in Node.js environment)');
    }

    // Manual connection example
    console.log('\\n📱 Manual connection example:');
    console.log('// In a browser environment, you would do:');
    console.log('// const wallet = await walletManager.connectWallet("phantom", {');
    console.log('//   onlyIfTrusted: false,');
    console.log('//   timeout: 30000');
    console.log('// });');

  } catch (error) {
    console.error('Wallet integration error:', error instanceof Error ? error.message : error);
    console.log('💡 This is expected when running outside a browser environment');
  }

  console.log('\\n✨ Wallet integration example complete!');
}

export { walletIntegrationExample };`

  const advancedPortfolioCode = `/**
 * GorbchainSDK V1 - Advanced Portfolio Management Example
 * Demonstrates portfolio analysis, comparison, and insights
 */
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode';

async function advancedPortfolioExample() {
  console.log('📈 GorbchainSDK V1 - Advanced Portfolio Example\\n');

  // Initialize SDK with Gorbchain custom program addresses
  const sdk = new GorbchainSDK({
    rpcEndpoint: 'https://rpc.gorbchain.xyz',
    network: 'gorbchain',
    programIds: {
      splToken: 'Gorbj8Dp27NkXMQUkeHBSmpf6iQ3yT4b2uVe8kM4s6br',
      splToken2022: 'G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6',
      associatedToken: 'GoATGVNeSXerFerPqTJ8hcED1msPWHHLxao2vwBYqowm',
      metadata: 'GMTAp1moCdGh4TEwFTcCJKeKL3UMEDB6vKpo2uxM9h4s'
    }
  });

  // Example wallet addresses (replace with real addresses)
  const wallet1 = 'GThUX1Atko4tqhN2NaiTazWSeFWMuiUiswQrunPiLaFU';
  const wallet2 = 'DRiP2Pn2K6fuMLKQmt5rZWxa91vSDhqhZF3KZg9gEM5M';

  console.log(\`📊 Advanced portfolio analysis for multiple wallets\\n\`);

  try {
    // 1. Individual Portfolio Analysis
    console.log('1️⃣ Individual Portfolio Analysis');
    console.log('Analyzing wallet 1...');
    
    const portfolio1 = await sdk.analyzePortfolio(wallet1);
    console.log('📈 Wallet 1 Analysis:');
    console.log(\`   Total Holdings: \${portfolio1.summary?.totalTokens || 0}\`);
    console.log(\`   Risk Level: \${portfolio1.riskAnalysis?.level || 'Unknown'}\`);
    console.log(\`   Diversification: \${portfolio1.diversification?.score || 'N/A'}\`);

    // 2. Portfolio Comparison
    console.log('\\n2️⃣ Portfolio Comparison');
    console.log('Comparing two portfolios...');
    
    const comparison = await sdk.comparePortfolios(wallet1, wallet2);
    console.log('🔍 Portfolio Comparison Results:');
    console.log(\`   Similarity Score: \${(comparison.similarityScore * 100).toFixed(1)}%\`);
    console.log(\`   Common Holdings: \${comparison.commonHoldings?.length || 0}\`);
    console.log(\`   Wallet 1 Unique: \${comparison.wallet1Unique?.length || 0}\`);
    console.log(\`   Wallet 2 Unique: \${comparison.wallet2Unique?.length || 0}\`);

    // Display common holdings
    if (comparison.commonHoldings && comparison.commonHoldings.length > 0) {
      console.log('\\n🤝 Common Holdings:');
      comparison.commonHoldings.slice(0, 3).forEach((holding, index) => {
        console.log(\`   \${index + 1}. \${holding.tokenInfo?.name || 'Unknown Token'}\`);
        console.log(\`      Symbol: \${holding.tokenInfo?.symbol || 'N/A'}\`);
        console.log(\`      Both wallets hold this token\`);
      });
    }

    // 3. Risk Analysis
    console.log('\\n3️⃣ Risk Analysis');
    const riskMetrics = comparison.riskComparison;
    if (riskMetrics) {
      console.log('⚠️ Risk Comparison:');
      console.log(\`   Wallet 1 Risk: \${riskMetrics.wallet1Risk || 'Unknown'}\`);
      console.log(\`   Wallet 2 Risk: \${riskMetrics.wallet2Risk || 'Unknown'}\`);
      console.log(\`   Risk Difference: \${riskMetrics.riskDifference || 'N/A'}\`);
    }

    // 4. Performance Insights
    console.log('\\n4️⃣ Performance Insights');
    if (comparison.insights) {
      console.log('💡 Insights:');
      comparison.insights.forEach((insight, index) => {
        console.log(\`   \${index + 1}. \${insight.type}: \${insight.message}\`);
        console.log(\`      Confidence: \${(insight.confidence * 100).toFixed(0)}%\`);
      });
    }

    // 5. Recommendations
    console.log('\\n5️⃣ Portfolio Recommendations');
    if (comparison.recommendations) {
      console.log('🎯 Recommendations:');
      comparison.recommendations.forEach((rec, index) => {
        console.log(\`   \${index + 1}. \${rec.category}: \${rec.action}\`);
        console.log(\`      Priority: \${rec.priority}\`);
        console.log(\`      Impact: \${rec.expectedImpact}\`);
      });
    }

    // 6. Token Categories Analysis
    console.log('\\n6️⃣ Token Categories Analysis');
    const categories1 = await sdk.getTokensByCategory(wallet1);
    console.log('📂 Wallet 1 Token Categories:');
    console.log(\`   DeFi Tokens: \${categories1.defi?.length || 0}\`);
    console.log(\`   NFTs: \${categories1.nfts?.length || 0}\`);
    console.log(\`   Stablecoins: \${categories1.stablecoins?.length || 0}\`);
    console.log(\`   Gaming Tokens: \${categories1.gaming?.length || 0}\`);

  } catch (error) {
    console.error('Portfolio analysis error:', error instanceof Error ? error.message : error);
    console.log('💡 This is expected when running with example data');
  }

  console.log('\\n✨ Advanced portfolio analysis complete!');
  console.log('\\n🚀 Ready to build comprehensive portfolio management features!');
}

export { advancedPortfolioExample };`

  const examples = [
    {
      id: 'basic',
      title: 'Basic SDK Setup & Usage',
      description: 'Initialize GorbchainSDK V1 and explore core capabilities',
      icon: <CubeIcon className="w-5 h-5" />,
      color: 'blue',
      code: basicUsageCode,
      features: ['SDK initialization', 'Network health monitoring', 'Capability detection', 'Direct RPC access']
    },
    {
      id: 'tokens',
      title: 'Rich Token Portfolio Analysis',
      description: 'Analyze token portfolios with complete metadata and insights',
      icon: <ChartBarIcon className="w-5 h-5" />,
      color: 'emerald',
      code: richTokenAnalysisCode,
      features: ['Portfolio metadata', 'Token categorization', 'Diversity scoring', 'Performance optimization']
    },
    {
      id: 'transactions',
      title: 'Enhanced Transaction Analysis',
      description: 'Decode transactions with human-readable context and token metadata',
      icon: <MagnifyingGlassIcon className="w-5 h-5" />,
      color: 'purple',
      code: transactionAnalysisCode,
      features: ['Rich transaction decoding', 'Token operation analysis', 'Balance change tracking', 'Context resolution']
    },
    {
      id: 'wallets',
      title: 'Universal Wallet Integration',
      description: 'Connect to all Solana wallets with auto-discovery and portfolio analysis',
      icon: <WalletIcon className="w-5 h-5" />,
      color: 'orange',
      code: walletIntegrationCode,
      features: ['Universal wallet support', 'Auto-discovery', 'Portfolio integration', 'Event-driven management']
    },
    {
      id: 'portfolio',
      title: 'Advanced Portfolio Management',
      description: 'Compare portfolios, analyze risk, and generate actionable insights',
      icon: <BeakerIcon className="w-5 h-5" />,
      color: 'pink',
      code: advancedPortfolioCode,
      features: ['Portfolio comparison', 'Risk analysis', 'Diversification insights', 'Actionable recommendations']
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-docs-heading mb-4">
          GorbchainSDK V1 Examples 🚀
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Comprehensive examples showcasing the rich capabilities of GorbchainSDK V1 for rapid Solana application development.
          These examples demonstrate real-world usage patterns for building super apps within seconds.
        </p>
        
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-blue-900 mb-3">✨ What Makes V1 Special</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <div className="font-medium mb-2">🎯 Rich Functions</div>
              <ul className="space-y-1 ml-4">
                <li>• Enhanced token portfolio analysis</li>
                <li>• Transaction decoding with context</li>
                <li>• Universal wallet integration</li>
              </ul>
            </div>
            <div>
              <div className="font-medium mb-2">⚡ Performance Optimized</div>
              <ul className="space-y-1 ml-4">
                <li>• Concurrent request handling</li>
                <li>• Intelligent metadata caching</li>
                <li>• Configurable rate limiting</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {examples.map((example) => {
        const isOpen = openSections.has(example.id)
        
        return (
          <div key={example.id} className="docs-card">
            <button
              onClick={() => toggleSection(example.id)}
              className="w-full flex items-center justify-between p-1 text-left"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 bg-${example.color}-100 rounded-lg flex items-center justify-center`}>
                  {example.icon}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-docs-heading">{example.title}</h2>
                  <p className="text-gray-600">{example.description}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {example.features.slice(0, 2).map((feature, index) => (
                      <span key={index} className={`px-2 py-1 bg-${example.color}-50 text-${example.color}-700 rounded text-xs`}>
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`px-3 py-1 bg-${example.color}-100 text-${example.color}-800 rounded-full text-sm font-medium`}>
                  V1
                </div>
                {isOpen ? 
                  <ChevronDownIcon className="w-5 h-5 text-gray-400" /> : 
                  <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                }
              </div>
            </button>
            
            {isOpen && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-docs-heading">Complete Implementation</h3>
                  <button
                    onClick={() => copyToClipboard(example.code, example.id)}
                    className="flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-md hover:border-blue-300 transition-colors"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                    <span>{copied[example.id] ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                
                <CodeBlock
                  code={example.code}
                  language="typescript"
                  title={example.title}
                  id={example.id}
                  onCopy={() => copyToClipboard(example.code, example.id)}
                  copied={copied[example.id] || false}
                />
                
                {/* Feature highlights */}
                <div className={`mt-4 p-4 bg-${example.color}-50 border border-${example.color}-200 rounded-lg`}>
                  <h4 className={`font-medium text-${example.color}-900 mb-2`}>✨ Key Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {example.features.map((feature, index) => (
                      <div key={index} className={`text-sm text-${example.color}-800 flex items-center`}>
                        <span className="w-2 h-2 bg-current rounded-full mr-2 opacity-60"></span>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Example-specific tips */}
                {example.id === 'basic' && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">🎯 Getting Started Tips</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Replace the example RPC endpoint with your preferred provider</li>
                      <li>• Network health checks help ensure reliable connections</li>
                      <li>• Use capability detection to adapt to different RPC providers</li>
                    </ul>
                  </div>
                )}

                {example.id === 'tokens' && (
                  <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <h4 className="font-medium text-emerald-900 mb-2">📊 Portfolio Analysis Power</h4>
                    <ul className="text-sm text-emerald-800 space-y-1">
                      <li>• Automatically fetches metadata for all tokens and NFTs</li>
                      <li>• Provides diversity scoring for portfolio risk assessment</li>
                      <li>• Supports concurrent requests for optimal performance</li>
                      <li>• Includes market data integration (when API keys provided)</li>
                    </ul>
                  </div>
                )}

                {example.id === 'wallets' && (
                  <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="font-medium text-orange-900 mb-2">🔗 Wallet Integration Benefits</h4>
                    <ul className="text-sm text-orange-800 space-y-1">
                      <li>• Works with Phantom, Solflare, Backpack, and 15+ other wallets</li>
                      <li>• Auto-discovery handles wallet detection automatically</li>
                      <li>• Includes portfolio analysis for connected wallets</li>
                      <li>• Event-driven architecture for real-time updates</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Quick Start Section */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">🚀 Quick Start Guide</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-docs-heading mb-3">1. Installation</h3>
            <div className="code-block">
              <pre><code>{`npm install @gorbchain-xyz/chaindecode`}</code></pre>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-docs-heading mb-3">2. Basic Setup</h3>
            <div className="code-block">
              <pre><code>{`import { GorbchainSDK } from '@gorbchain-xyz/chaindecode'

const sdk = new GorbchainSDK({
  rpcEndpoint: 'https://rpc.gorbchain.xyz',
  network: 'gorbchain',
  // Gorbchain custom program addresses
  programs: {
    splToken: 'Gorbj8Dp27NkXMQUkeHBSmpf6iQ3yT4b2uVe8kM4s6br',
    splToken2022: 'G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6',
    associatedToken: 'GoATGVNeSXerFerPqTJ8hcED1msPWHHLxao2vwBYqowm',
    metadata: 'GMTAp1moCdGh4TEwFTcCJKeKL3UMEDB6vKpo2uxM9h4s'
  }
})

// Rich token portfolio analysis
const portfolio = await sdk.getRichTokenAccounts(address, {
  includeMetadata: true,
  includeNFTs: true
})

// Enhanced transaction analysis
const transaction = await sdk.getRichTransaction(signature, {
  includeTokenMetadata: true,
  includeBalanceChanges: true
})

// Universal wallet integration
const walletManager = sdk.createWalletManager()
const wallet = await walletManager.autoConnect()`}</code></pre>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-docs-heading mb-4 text-center">
          ✨ Build Super Apps with GorbchainSDK V1
        </h2>
        <p className="text-gray-600 text-center mb-6">
          These examples provide the foundation for building the next generation of Solana applications.
          Rich functions, performance optimization, and universal wallet support - everything you need is here.
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <a 
            href="/playground" 
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>Try Interactive Playground</span>
          </a>
          <a 
            href="/api-reference" 
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span>View Full API Reference</span>
          </a>
          <a 
            href="https://github.com/gorbchain-xyz/chaindecode" 
            className="inline-flex items-center justify-center px-6 py-3 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>View on GitHub</span>
          </a>
        </div>
      </div>
    </div>
  )
}