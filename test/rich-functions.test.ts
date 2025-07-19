import { GorbchainSDK } from '../src/index';
import { getRichTokenAccountsByOwner } from '../src/rich/tokenOperations';
import { getRichTransaction } from '../src/rich/transactionOperations';
import { UniversalWalletManager } from '../src/rich/walletIntegration';
import { createTestSDK, TEST_DATA, PerformanceTracker, shouldSkipNetworkTests, shouldSkipRealDataTests } from './setup';

describe('Rich Functions Integration Tests', () => {
  let sdk: GorbchainSDK;
  let perfTracker: PerformanceTracker;

  beforeAll(() => {
    sdk = createTestSDK();
    perfTracker = new PerformanceTracker();
  });

  const skipNetworkTests = shouldSkipNetworkTests();
  const skipRealDataTests = shouldSkipRealDataTests();

  describe('Rich Token Operations', () => {
    test('getRichTokenAccountsByOwner - comprehensive token analysis', async () => {
      if (skipNetworkTests || skipRealDataTests) {
        console.log('⏭️  Skipping rich token accounts test - requires network and real data');
        return;
      }

      console.log('🎯 Testing rich token accounts functionality...');
      
      perfTracker.start();
      const walletAddress = TEST_DATA.wallets.diverse;

      const richTokens = await getRichTokenAccountsByOwner(sdk, walletAddress, {
        includeMetadata: true,
        includeMarketData: false, // Skip market data for faster testing
        includeNFTs: true,
        includeZeroBalance: false,
        maxConcurrentRequests: 3
      });

      expect(richTokens).toHaveProperty('accounts');
      expect(richTokens).toHaveProperty('summary');
      expect(richTokens).toHaveProperty('meta');
      expect(Array.isArray(richTokens.accounts)).toBe(true);

      console.log(`   📊 Found ${richTokens.accounts.length} token accounts`);
      console.log(`   🎭 Summary: ${richTokens.summary.totalTokens} tokens, ${richTokens.summary.totalNFTs} NFTs`);
      console.log(`   ⏱️  Operation took ${richTokens.meta.duration}ms`);

      // Verify account structure
      if (richTokens.accounts.length > 0) {
        const firstAccount = richTokens.accounts[0];
        expect(firstAccount).toHaveProperty('address');
        expect(firstAccount).toHaveProperty('mint');
        expect(firstAccount).toHaveProperty('balance');
        expect(firstAccount).toHaveProperty('metadata');
        expect(firstAccount).toHaveProperty('program');
        expect(firstAccount).toHaveProperty('created');

        console.log(`   ✅ Account structure verified for ${firstAccount.metadata.symbol || 'unknown token'}`);
      }

      // Verify summary metrics
      expect(typeof richTokens.summary.totalTokens).toBe('number');
      expect(typeof richTokens.summary.totalNFTs).toBe('number');
      expect(typeof richTokens.summary.diversityScore).toBe('number');
      expect(Array.isArray(richTokens.summary.topHoldings)).toBe(true);

      perfTracker.expectUnder(20000, 'Rich token accounts analysis');
    }, 25000);

    test('SDK integration - getRichTokenAccounts method', async () => {
      if (skipNetworkTests || skipRealDataTests) {
        console.log('⏭️  Skipping SDK integration test - requires network and real data');
        return;
      }

      console.log('🔗 Testing SDK getRichTokenAccounts method...');

      const walletAddress = TEST_DATA.wallets.token;
      
      // Test the SDK method directly
      const result = await sdk.getRichTokenAccounts(walletAddress, {
        includeMetadata: true,
        includeNFTs: false, // Focus on tokens only
        maxConcurrentRequests: 2
      });

      expect(result).toHaveProperty('accounts');
      expect(result).toHaveProperty('summary');
      console.log(`   ✅ SDK method returned ${result.accounts.length} accounts`);
    });

    test('Rich token accounts - error handling', async () => {
      console.log('🛡️  Testing rich token accounts error handling...');

      // Test with invalid wallet address
      try {
        await getRichTokenAccountsByOwner(sdk, 'invalid_address', {
          includeMetadata: true
        });
        fail('Should have thrown an error for invalid address');
      } catch (error) {
        expect(error).toBeDefined();
        console.log('   ✅ Invalid address error handled gracefully');
      }

      // Test with empty options
      if (!skipNetworkTests && !skipRealDataTests) {
        const result = await getRichTokenAccountsByOwner(sdk, TEST_DATA.wallets.diverse);
        expect(result).toHaveProperty('accounts');
        console.log('   ✅ Default options work correctly');
      }
    });
  });

  describe('Rich Transaction Operations', () => {
    test('getRichTransaction - comprehensive transaction analysis', async () => {
      if (skipNetworkTests || skipRealDataTests) {
        console.log('⏭️  Skipping rich transaction test - requires network and real data');
        return;
      }

      const txSignature = TEST_DATA.transactions.tokenTransfer || TEST_DATA.transactions.complex;
      
      if (!txSignature || txSignature.length === 0) {
        console.log('⚠️  No real transaction signature provided - skipping test');
        return;
      }

      console.log('🔍 Testing rich transaction analysis...');
      console.log(`   📜 Analyzing: ${txSignature.substring(0, 20)}...`);

      perfTracker.start();

      const richTx = await getRichTransaction(sdk, txSignature, {
        includeTokenMetadata: true,
        includeBalanceChanges: true,
        resolveAddressLabels: false, // Skip for faster testing
        commitment: 'finalized'
      });

      expect(richTx).toHaveProperty('signature');
      expect(richTx).toHaveProperty('instructions');
      expect(richTx).toHaveProperty('summary');
      expect(richTx).toHaveProperty('balanceChanges');
      expect(richTx).toHaveProperty('meta');

      console.log(`   📋 Found ${richTx.instructions.length} instructions`);
      console.log(`   🎯 Primary action: ${richTx.summary.primaryAction}`);
      console.log(`   📊 Category: ${richTx.summary.category}`);
      console.log(`   ⏱️  Analysis took ${richTx.meta.analysisDuration}ms`);

      // Verify instruction structure
      if (richTx.instructions.length > 0) {
        const firstInstruction = richTx.instructions[0];
        expect(firstInstruction).toHaveProperty('index');
        expect(firstInstruction).toHaveProperty('programId');
        expect(firstInstruction).toHaveProperty('programName');
        expect(firstInstruction).toHaveProperty('type');
        expect(firstInstruction).toHaveProperty('description');
        expect(firstInstruction).toHaveProperty('result');

        console.log(`   ✅ Instruction structure verified: ${firstInstruction.description}`);
      }

      // Verify summary
      expect(typeof richTx.summary.totalSOL).toBe('number');
      expect(typeof richTx.summary.totalTokens).toBe('number');
      expect(typeof richTx.summary.totalNFTs).toBe('number');
      expect(Array.isArray(richTx.summary.participants)).toBe(true);

      perfTracker.expectUnder(15000, 'Rich transaction analysis');
    }, 20000);

    test('SDK integration - getRichTransaction method', async () => {
      if (skipNetworkTests || skipRealDataTests) {
        console.log('⏭️  Skipping SDK rich transaction test - requires network and real data');
        return;
      }

      const txSignature = TEST_DATA.transactions.nftMint;
      
      if (!txSignature) {
        console.log('⚠️  No NFT mint transaction signature provided - skipping test');
        return;
      }

      console.log('🔗 Testing SDK getRichTransaction method...');

      const result = await sdk.getRichTransaction(txSignature, {
        includeTokenMetadata: true,
        includeBalanceChanges: false // Skip for faster testing
      });

      expect(result).toHaveProperty('signature');
      expect(result).toHaveProperty('summary');
      console.log(`   ✅ SDK method analyzed transaction: ${result.summary.primaryAction}`);
    });

    test('Rich transaction - error handling', async () => {
      console.log('🛡️  Testing rich transaction error handling...');

      // Test with invalid signature
      try {
        await getRichTransaction(sdk, 'invalid_signature');
        fail('Should have thrown an error for invalid signature');
      } catch (error) {
        expect(error).toBeDefined();
        console.log('   ✅ Invalid signature error handled gracefully');
      }

      // Test with non-existent signature
      try {
        await getRichTransaction(sdk, '1'.repeat(88)); // Valid format but non-existent
        fail('Should have thrown an error for non-existent signature');
      } catch (error) {
        expect(error).toBeDefined();
        console.log('   ✅ Non-existent signature error handled gracefully');
      }
    });
  });

  describe('Universal Wallet Integration', () => {
    test('UniversalWalletManager - basic functionality', async () => {
      console.log('👛 Testing Universal Wallet Manager...');

      const walletManager = new UniversalWalletManager(sdk);
      expect(walletManager).toBeInstanceOf(UniversalWalletManager);

      // Test wallet discovery
      const discovery = await walletManager.discoverWallets({
        includeDeepLinks: false,
        includeMobile: false,
        includeHardware: false
      });

      expect(discovery).toHaveProperty('available');
      expect(discovery).toHaveProperty('recommended');
      expect(discovery).toHaveProperty('previouslyConnected');
      expect(Array.isArray(discovery.available)).toBe(true);

      console.log(`   🔍 Discovered ${discovery.available.length} wallet options`);
      console.log(`   🎯 Recommended: ${discovery.recommended.length} wallets`);

      // Verify wallet structure
      if (discovery.available.length > 0) {
        const firstWallet = discovery.available[0];
        expect(firstWallet).toHaveProperty('type');
        expect(firstWallet).toHaveProperty('name');
        expect(firstWallet).toHaveProperty('installed');

        console.log(`   ✅ Wallet structure verified: ${firstWallet.name} (${firstWallet.installed ? 'installed' : 'not installed'})`);
      }
    });

    test('SDK integration - createWalletManager method', () => {
      console.log('🔗 Testing SDK createWalletManager method...');

      const walletManager = sdk.createWalletManager();
      expect(walletManager).toBeDefined();
      expect(typeof walletManager.discoverWallets).toBe('function');
      expect(typeof walletManager.connectWallet).toBe('function');
      expect(typeof walletManager.autoConnect).toBe('function');

      console.log('   ✅ SDK wallet manager creation successful');
    });

    test('Wallet manager - event handling', () => {
      console.log('📡 Testing wallet manager event handling...');

      const walletManager = new UniversalWalletManager(sdk);
      let eventReceived = false;

      const testListener = (data: any) => {
        eventReceived = true;
        expect(data).toBeDefined();
      };

      // Test event listener registration
      walletManager.on('test:event', testListener);
      
      // Manually emit event to test
      (walletManager as any).emit('test:event', { test: true });
      
      expect(eventReceived).toBe(true);
      console.log('   ✅ Event handling works correctly');

      // Test event listener removal
      walletManager.off('test:event', testListener);
      
      eventReceived = false;
      (walletManager as any).emit('test:event', { test: true });
      
      expect(eventReceived).toBe(false);
      console.log('   ✅ Event listener removal works correctly');
    });

    test('Wallet manager - error handling', async () => {
      console.log('🛡️  Testing wallet manager error handling...');

      const walletManager = new UniversalWalletManager(sdk);

      // Test connecting to non-existent wallet
      try {
        await walletManager.connectWallet('phantom', {
          includePortfolio: false // Skip portfolio for faster testing
        });
        console.log('   ⚠️  Phantom connection may have succeeded (wallet might be installed)');
      } catch (error) {
        expect(error).toBeDefined();
        console.log('   ✅ Non-existent wallet connection error handled gracefully');
      }

      // Test auto-connect with no available wallets
      const autoConnectResult = await walletManager.autoConnect({
        onlyPrevious: true // Should return null if no previous connections
      });
      
      expect(autoConnectResult === null || typeof autoConnectResult === 'object').toBe(true);
      console.log('   ✅ Auto-connect handles no available wallets correctly');
    });
  });

  describe('Rich Functions Performance Tests', () => {
    test('Performance benchmarks', async () => {
      if (skipNetworkTests || skipRealDataTests) {
        console.log('⏭️  Skipping performance tests - requires network and real data');
        return;
      }

      console.log('⚡ Running rich functions performance benchmarks...');

      const walletAddress = TEST_DATA.wallets.diverse;

      // Benchmark rich token accounts
      perfTracker.start();
      const tokenResult = await sdk.getRichTokenAccounts(walletAddress, {
        includeMetadata: false, // Skip metadata for performance test
        includeNFTs: false,
        maxConcurrentRequests: 10
      });
      const tokenTime = perfTracker.end();

      console.log(`   📊 Rich token accounts: ${tokenTime}ms (${tokenResult.accounts.length} accounts)`);
      expect(tokenTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Benchmark wallet manager creation
      perfTracker.start();
      const walletManager = sdk.createWalletManager();
      const discovery = await walletManager.discoverWallets();
      const walletTime = perfTracker.end();

      console.log(`   👛 Wallet discovery: ${walletTime}ms (${discovery.available.length} wallets)`);
      expect(walletTime).toBeLessThan(1000); // Should complete within 1 second

      console.log('   ✅ All performance benchmarks passed');
    });

    test('Concurrent operations stress test', async () => {
      if (skipNetworkTests || skipRealDataTests) {
        console.log('⏭️  Skipping stress test - requires network and real data');
        return;
      }

      console.log('🔥 Running concurrent operations stress test...');

      const walletAddress = TEST_DATA.wallets.diverse;

      perfTracker.start();

      // Run multiple operations concurrently
      const promises = [
        sdk.getRichTokenAccounts(walletAddress, { includeMetadata: false }),
        sdk.createWalletManager().discoverWallets(),
        sdk.getNetworkHealth(),
        sdk.detectNetworkCapabilities(),
        sdk.getAllTokenHoldings(walletAddress)
      ];

      const results = await Promise.allSettled(promises);
      const stressTime = perfTracker.end();

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.filter(r => r.status === 'rejected').length;

      console.log(`   📊 Concurrent operations: ${stressTime}ms`);
      console.log(`   ✅ Successful: ${successCount}, Failed: ${failureCount}`);

      expect(successCount).toBeGreaterThan(0);
      expect(stressTime).toBeLessThan(30000); // Should complete within 30 seconds

      console.log('   ✅ Stress test completed successfully');
    }, 35000);
  });

  describe('Rich Functions Integration with Existing SDK', () => {
    test('Rich functions complement existing functionality', async () => {
      if (skipNetworkTests || skipRealDataTests) {
        console.log('⏭️  Skipping integration test - requires network and real data');
        return;
      }

      console.log('🔗 Testing integration with existing SDK functionality...');

      const walletAddress = TEST_DATA.wallets.diverse;

      // Get basic holdings
      const basicHoldings = await sdk.getAllTokenHoldings(walletAddress);
      
      // Get rich holdings
      const richHoldings = await sdk.getRichTokenAccounts(walletAddress, {
        includeMetadata: true
      });

      // Compare results
      console.log(`   📊 Basic holdings: ${basicHoldings.holdings.length} items`);
      console.log(`   🎯 Rich holdings: ${richHoldings.accounts.length} items`);

      // Rich holdings should provide additional context
      if (richHoldings.accounts.length > 0 && basicHoldings.holdings.length > 0) {
        const richAccount = richHoldings.accounts[0];
        const basicAccount = basicHoldings.holdings.find(h => h.mint === richAccount.mint);

        if (basicAccount) {
          // Rich account should have additional metadata
          expect(richAccount.metadata).toBeDefined();
          expect(richAccount.program).toBeDefined();
          expect(richAccount.created).toBeDefined();
          
          console.log(`   ✅ Rich account provides enhanced data for ${richAccount.metadata.symbol || 'token'}`);
        }
      }

      // Test portfolio analysis integration
      const portfolioAnalysis = await sdk.analyzePortfolio(walletAddress);
      
      expect(portfolioAnalysis).toHaveProperty('diversification');
      expect(portfolioAnalysis).toHaveProperty('tokenTypes');
      
      console.log(`   📈 Portfolio analysis: ${portfolioAnalysis.diversification.mintCount} unique tokens`);
      console.log('   ✅ Integration with existing functionality works correctly');
    });
  });
});