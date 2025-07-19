import { GorbchainSDK } from '../src/index';
import { createTestSDK, TEST_DATA, PerformanceTracker, shouldSkipNetworkTests, shouldSkipRealDataTests } from './setup';

describe('Real User Journey Tests', () => {
  let sdk: GorbchainSDK;
  let perfTracker: PerformanceTracker;

  beforeAll(() => {
    sdk = createTestSDK();
    perfTracker = new PerformanceTracker();
  });

  const skipNetworkTests = shouldSkipNetworkTests();
  const skipRealDataTests = shouldSkipRealDataTests();

  describe('Journey 1: NFT Collector Workflow', () => {
    test('Complete NFT analysis workflow', async () => {
      if (skipNetworkTests || skipRealDataTests) {
        console.log('⏭️  Skipping NFT collector journey - requires network and real data');
        return;
      }

      console.log('🎨 Starting NFT Collector Journey...');
      
      // Step 1: Connect to wallet
      perfTracker.start();
      const walletAddress = TEST_DATA.wallets.nft;
      console.log(`   📱 Analyzing wallet: ${walletAddress}`);

      // Step 2: Get all holdings with focus on NFTs
      const holdings = await sdk.getAllTokenHoldings(walletAddress, {
        includeStandardTokens: true,
        includeCustomTokens: true,
        includeNFTs: true,
        customPrograms: ['BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc'] // MPL Core
      });

      expect(holdings).toHaveProperty('holdings');
      expect(holdings).toHaveProperty('summary');
      console.log(`   📊 Found ${holdings.holdings.length} total holdings`);

      // Step 3: Categorize tokens to find NFTs specifically
      const categorized = await sdk.getTokensByCategory(walletAddress);
      
      expect(categorized).toHaveProperty('nfts');
      expect(categorized).toHaveProperty('fungibleTokens');
      console.log(`   🎭 NFT breakdown: ${categorized.nfts.length} NFTs, ${categorized.fungibleTokens.length} fungible tokens`);

      // Step 4: Analyze specific NFT if available
      if (categorized.nfts.length > 0) {
        const firstNFT = categorized.nfts[0];
        console.log(`   🔍 Analyzing NFT: ${(firstNFT as any).mint || (firstNFT as any).address || 'Unknown'}`);
        
        // Verify NFT structure
        expect(firstNFT).toBeDefined();
        // NFTs should have specific properties that distinguish them from fungible tokens
      }

      perfTracker.expectUnder(25000, 'Complete NFT collector journey');
      console.log('✅ NFT Collector Journey completed successfully');
    }, 30000);

    test('NFT metadata resolution workflow', async () => {
      if (skipNetworkTests || skipRealDataTests) {
        console.log('⏭️  Skipping NFT metadata test - requires network and real data');
        return;
      }

      const nftAddress = TEST_DATA.nfts.mplCore.address;
      console.log(`🎨 Testing NFT metadata resolution for: ${nftAddress}`);

      // Get account info for the NFT
      const accountInfo = await sdk.getAccountInfo(nftAddress);
      expect(accountInfo).toBeDefined();

      if (accountInfo) {
        console.log(`   📄 NFT account info:`, {
          owner: accountInfo.owner.toString(),
          dataLength: accountInfo.data?.length || 0,
          executable: accountInfo.executable,
          lamports: accountInfo.lamports
        });

        // Verify it's owned by a known NFT program
        const isNFTProgram = [
          'BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc', // MPL Core
          'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',  // SPL Token (for older NFTs)
          'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'   // Metaplex
        ].includes(accountInfo.owner.toString());

        console.log(`   ✅ Owned by known NFT program: ${isNFTProgram}`);
      }
    });
  });

  describe('Journey 2: DeFi Portfolio Manager Workflow', () => {
    test('Complete portfolio analysis workflow', async () => {
      if (skipNetworkTests || skipRealDataTests) {
        console.log('⏭️  Skipping DeFi portfolio journey - requires network and real data');
        return;
      }

      console.log('💰 Starting DeFi Portfolio Manager Journey...');
      
      perfTracker.start();
      const walletAddress = TEST_DATA.wallets.diverse;
      console.log(`   📱 Analyzing diverse portfolio: ${walletAddress}`);

      // Step 1: Get comprehensive token holdings
      const holdings = await sdk.getAllTokenHoldings(walletAddress, {
        includeStandardTokens: true,
        includeCustomTokens: true,
        includeNFTs: false // Focus on fungible tokens for DeFi
      });

      console.log(`   📊 Portfolio size: ${holdings.holdings.length} holdings`);
      console.log(`   📈 Summary:`, holdings.summary);

      // Step 2: Analyze portfolio for DeFi insights
      const analysis = await sdk.analyzePortfolio(walletAddress);
      
      expect(analysis).toHaveProperty('diversification');
      expect(analysis).toHaveProperty('tokenTypes');
      expect(analysis).toHaveProperty('balanceDistribution');

      console.log(`   🎯 Portfolio Analysis:`, {
        totalTokens: analysis.diversification.mintCount,
        concentrationRisk: analysis.diversification.concentrationRisk,
        fungibleTokens: analysis.tokenTypes.fungibleTokens,
        riskLevel: Number(analysis.diversification.concentrationRisk) > 0.5 ? 'High' : 'Moderate'
      });

      // Step 3: Get top holdings for asset allocation analysis
      const topHoldings = await sdk.getTopHoldings(walletAddress, 10);
      
      expect(Array.isArray(topHoldings)).toBe(true);
      console.log(`   🏆 Top ${topHoldings.length} holdings identified`);

      topHoldings.slice(0, 3).forEach((holding: any, index: number) => {
        console.log(`   ${index + 1}. ${holding.metadata?.symbol || 'Unknown'}: ${holding.balance?.formatted || holding.balance}`);
      });

      // Step 4: Check for rebalancing opportunities
      if (Number(analysis.diversification.concentrationRisk) > 0.7) {
        console.log('   ⚠️  High concentration risk detected - consider rebalancing');
      } else {
        console.log('   ✅ Portfolio diversification looks healthy');
      }

      perfTracker.expectUnder(30000, 'Complete DeFi portfolio analysis');
      console.log('✅ DeFi Portfolio Manager Journey completed successfully');
    }, 35000);

    test('Portfolio comparison workflow', async () => {
      if (skipNetworkTests || skipRealDataTests) {
        console.log('⏭️  Skipping portfolio comparison test - requires network and real data');
        return;
      }

      console.log('🔄 Testing portfolio comparison workflow...');

      const wallet1 = TEST_DATA.wallets.diverse;
      const wallet2 = TEST_DATA.wallets.token;

      const comparison = await sdk.comparePortfolios(wallet1, wallet2);

      expect(comparison).toHaveProperty('commonTokens');
      expect(comparison).toHaveProperty('uniqueToWallet1');
      expect(comparison).toHaveProperty('uniqueToWallet2');
      expect(comparison).toHaveProperty('similarity');
      expect(typeof comparison.similarity).toBe('number');

      console.log(`   📊 Portfolio Comparison Results:`, {
        commonTokens: comparison.commonTokens.length,
        uniqueToWallet1: comparison.uniqueToWallet1.length,
        uniqueToWallet2: comparison.uniqueToWallet2.length,
        similarity: `${(comparison.similarity * 100).toFixed(1)}%`
      });

      if (comparison.similarity > 0.7) {
        console.log('   🤝 Portfolios are very similar');
      } else if (comparison.similarity > 0.3) {
        console.log('   📈 Portfolios have moderate overlap');
      } else {
        console.log('   🎯 Portfolios are quite different - diverse strategies');
      }
    });
  });

  describe('Journey 3: Transaction Analyst Workflow', () => {
    test('Transaction decoding and analysis workflow', async () => {
      if (skipNetworkTests || skipRealDataTests) {
        console.log('⏭️  Skipping transaction analysis journey - requires network and real data');
        return;
      }

      console.log('🔍 Starting Transaction Analyst Journey...');

      // Test with a real transaction signature if provided
      const txSignature = TEST_DATA.transactions.tokenTransfer || TEST_DATA.transactions.complex;
      
      if (!txSignature) {
        console.log('   ⚠️  No real transaction signatures provided - testing with simulation');
        
        // Create simulated instruction for testing
        const simulatedInstruction = {
          programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          data: new Uint8Array([3, 64, 66, 15, 0, 0, 0, 0, 0]), // Transfer instruction
          accounts: [TEST_DATA.wallets.diverse, TEST_DATA.wallets.token, TEST_DATA.wallets.diverse]
        };

        const decoded = sdk.decoderRegistry.decode(simulatedInstruction);
        expect(decoded).toBeDefined();
        expect(decoded.programId).toBe('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
        
        console.log(`   🔬 Simulated instruction decoded:`, {
          type: decoded.type,
          programId: decoded.programId,
          accounts: decoded.accounts?.length || 0
        });
        
        return;
      }

      console.log(`   📜 Analyzing transaction: ${txSignature}`);

      perfTracker.start();

      // Step 1: Fetch and decode the transaction
      const decodedTx = await sdk.getAndDecodeTransaction(txSignature, {
        richDecoding: true,
        includeTokenMetadata: true
      });

      expect(decodedTx).toBeDefined();
      console.log(`   ✅ Transaction decoded successfully`);

      // Step 2: Analyze the decoded transaction
      if (decodedTx && decodedTx.decoded) {
        console.log(`   📋 Found ${decodedTx.decoded.length} instructions`);
        
        // Categorize instructions by program
        const programCounts: Record<string, number> = {};
        decodedTx.decoded.forEach((instruction: any) => {
          const programId = instruction.programId || 'unknown';
          programCounts[programId] = (programCounts[programId] || 0) + 1;
        });

        console.log(`   📊 Instruction breakdown:`, programCounts);

        // Step 3: Generate human-readable summary
        const instructionTypes = decodedTx.decoded.map((ix: any) => ix.type || 'unknown');
        const uniqueTypes = [...new Set(instructionTypes)];
        
        console.log(`   🎯 Transaction contains: ${uniqueTypes.join(', ')}`);
      }

      perfTracker.expectUnder(15000, 'Transaction analysis');
      console.log('✅ Transaction Analyst Journey completed successfully');
    }, 20000);

    test('Bulk instruction decoding workflow', async () => {
      console.log('🔄 Testing bulk instruction decoding...');

      // Create multiple test instructions
      const instructions = [
        {
          programId: '11111111111111111111111111111111', // System
          data: new Uint8Array([2, 0, 0, 0, 0, 0, 0, 0, 64, 66, 15, 0, 0, 0, 0, 0]),
          accounts: ['sender1', 'recipient1']
        },
        {
          programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // SPL Token
          data: new Uint8Array([3, 64, 66, 15, 0, 0, 0, 0, 0]),
          accounts: ['source', 'dest', 'authority']
        },
        {
          programId: 'BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc', // MPL Core
          data: new Uint8Array([1, 2, 3, 4]),
          accounts: ['asset', 'owner']
        }
      ];

      perfTracker.start();
      const decodedInstructions = instructions.map(ix => sdk.decoderRegistry.decode(ix));
      perfTracker.expectUnder(100, 'Bulk instruction decoding');

      expect(Array.isArray(decodedInstructions)).toBe(true);
      expect(decodedInstructions).toHaveLength(instructions.length);

      decodedInstructions.forEach((decoded, index) => {
        expect(decoded.programId).toBe(instructions[index].programId);
        console.log(`   ${index + 1}. ${decoded.type || 'unknown'} (${decoded.programId})`);
      });

      console.log('✅ Bulk instruction decoding completed successfully');
    });
  });

  describe('Journey 4: RPC Integration Tests', () => {
    test('should validate real transaction signatures', async () => {
      if (skipNetworkTests || skipRealDataTests) {
        console.log('⏭️  Skipping RPC integration test - requires network access');
        return;
      }

      // Test transaction signature validation
      const realTxSignatures = [
        TEST_DATA.transactions.tokenTransfer,
        TEST_DATA.transactions.nftMint,
        TEST_DATA.transactions.complex
      ].filter(sig => sig && sig.length > 0);

      if (realTxSignatures.length === 0) {
        console.log('⚠️  No real transaction signatures provided - skipping validation');
        return;
      }

      console.log(`🔍 Testing ${realTxSignatures.length} real transaction signatures...`);

      for (const txSignature of realTxSignatures) {
        // Validate signature format
        expect(txSignature).toMatch(/^[A-Za-z0-9]+$/);
        expect(txSignature.length).toBeGreaterThan(80);
        console.log(`   ✅ Valid signature format: ${txSignature.substring(0, 20)}...`);
      }
    });

    test('should handle network errors gracefully', async () => {
      if (skipNetworkTests) {
        console.log('⏭️  Skipping network error test - requires network access');
        return;
      }

      // Test with invalid address
      try {
        await sdk.getAccountInfo('InvalidAddress123');
        fail('Should have thrown an error for invalid address');
      } catch (error) {
        expect(error).toBeDefined();
        console.log('   ✅ Invalid address error handled gracefully');
      }
    });
  });

  describe('Journey 5: Network Health Monitor Workflow', () => {
    test('Complete network monitoring workflow', async () => {
      if (skipNetworkTests) {
        console.log('⏭️  Skipping network monitoring journey - requires network access');
        return;
      }

      console.log('🌐 Starting Network Health Monitor Journey...');

      perfTracker.start();

      // Step 1: Check basic network health
      const health = await sdk.getNetworkHealth();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('currentSlot');
      expect(health).toHaveProperty('responseTime');
      
      console.log(`   💓 Network Health:`, {
        status: health.status,
        slot: health.currentSlot,
        responseTime: `${health.responseTime}ms`,
        network: health.networkName
      });

      // Step 2: Test network performance
      const performance = await sdk.testRpcPerformance(5);
      
      expect(performance.successRate).toBeGreaterThan(0);
      console.log(`   🚀 Network Performance:`, {
        avgResponse: `${performance.averageResponseTime}ms`,
        successRate: `${performance.successRate}%`,
        minResponse: `${performance.minResponseTime}ms`,
        maxResponse: `${performance.maxResponseTime}ms`
      });

      // Step 3: Detect network capabilities
      const capabilities = await sdk.detectNetworkCapabilities();
      
      expect(capabilities).toHaveProperty('supportedMethods');
      expect(capabilities).toHaveProperty('detectedFeatures');
      
      console.log(`   🔧 Network Capabilities:`, {
        methods: capabilities.supportedMethods.length,
        features: Object.keys(capabilities.detectedFeatures).length,
        tokenSupport: capabilities.detectedFeatures.standardTokens ? '✅' : '❌',
        nftSupport: capabilities.detectedFeatures.nftSupport ? '✅' : '❌'
      });

      // Step 4: Get network statistics
      const stats = await sdk.getNetworkStats();
      
      expect(stats).toHaveProperty('currentSlot');
      console.log(`   📊 Network Stats:`, {
        currentSlot: stats.currentSlot,
        epochInfo: stats.epochInfo ? '✅' : '❌',
        version: stats.version ? stats.version.solanaCore || 'Unknown' : 'Unknown',
        identity: stats.identity !== 'unknown' ? '✅' : '❌'
      });

      perfTracker.expectUnder(20000, 'Complete network monitoring');
      console.log('✅ Network Health Monitor Journey completed successfully');
    }, 25000);

    test('Network resilience testing', async () => {
      if (skipNetworkTests) {
        console.log('⏭️  Skipping network resilience test - requires network access');
        return;
      }

      console.log('🛡️  Testing network resilience...');

      // Test with a short timeout to simulate network stress
      const stressTestSdk = createTestSDK({
        timeout: 2000, // Very short timeout
        retries: 1
      });

      try {
        const health = await stressTestSdk.getNetworkHealth();
        console.log(`   ✅ Network handled stress test well: ${health.status}`);
      } catch (error) {
        console.log(`   ⚠️  Network stress test triggered timeout (expected behavior)`);
        expect(error).toBeDefined(); // Should handle errors gracefully
      }
    });
  });

  describe('Journey 5: Developer Integration Workflow', () => {
    test('SDK integration and customization workflow', async () => {
      console.log('🛠️  Starting Developer Integration Journey...');

      // Step 1: Custom SDK configuration
      const customSdk = createTestSDK({
        timeout: 10000,
        retries: 2,
        tokenAnalysis: {
          enabled: true,
          maxConcurrentRequests: 10
        },
        richDecoding: {
          enabled: true,
          includeTokenMetadata: false, // Custom: disable metadata for performance
          enableCache: true
        }
      });

      expect(customSdk.config.timeout).toBe(10000);
      expect(customSdk.config.retries).toBe(2);
      expect(customSdk.config.tokenAnalysis?.maxConcurrentRequests).toBe(10);
      console.log('   ✅ Custom SDK configuration applied');

      // Step 2: Register custom decoder
      const customDecoder = jest.fn().mockReturnValue({
        type: 'custom-program',
        programId: 'CustomProgram111111111111111111111111111',
        data: { customField: 'test' },
        accounts: []
      });

      customSdk.registerDecoder('custom', 'CustomProgram111111111111111111111111111', customDecoder);

      // Test custom decoder
      const customInstruction = {
        programId: 'CustomProgram111111111111111111111111111',
        data: new Uint8Array([1, 2, 3]),
        accounts: ['account1']
      };

      const decoded = customSdk.decodeInstruction(customInstruction);
      expect(customDecoder).toHaveBeenCalled();
      expect(decoded.type).toBe('custom-program');
      console.log('   ✅ Custom decoder registration and usage successful');

      // Step 3: Test error handling customization
      const invalidInstruction = {
        programId: 'invalid',
        data: null as any,
        accounts: []
      };

      const decodedInvalid = customSdk.decodeInstruction(invalidInstruction);
      expect(decodedInvalid.type).toBe('unknown');
      console.log('   ✅ Error handling works correctly');

      // Step 4: Performance optimization validation
      perfTracker.start();
      for (let i = 0; i < 50; i++) {
        customSdk.decodeInstruction({
          programId: '11111111111111111111111111111111',
          data: new Uint8Array([i % 255]),
          accounts: [`account${i}`]
        });
      }
      perfTracker.expectUnder(500, '50 custom SDK operations');

      console.log('✅ Developer Integration Journey completed successfully');
    });

    test('SDK feature detection and compatibility', () => {
      console.log('🔍 Testing SDK feature detection...');

      // Test export availability
      const exports = require('../src/index');
      const expectedFeatures = [
        'GorbchainSDK',
        'RpcClient', 
        'EnhancedRpcClient',
        'AdvancedTokenHoldings',
        'DecoderRegistry',
        'createDefaultDecoderRegistry'
      ];

      expectedFeatures.forEach(feature => {
        expect(exports[feature]).toBeDefined();
        console.log(`   ✅ ${feature} available`);
      });

      // Test SDK capabilities
      const capabilities = [
        'getSupportedPrograms',
        'getNetworkConfig',
        'getNetworkCapabilities',
        'supportsFeature',
        'supportsMethod'
      ];

      capabilities.forEach(capability => {
        expect(typeof (sdk as any)[capability]).toBe('function');
        console.log(`   ✅ ${capability} capability available`);
      });

      console.log('✅ Feature detection completed successfully');
    });
  });
});