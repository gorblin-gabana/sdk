import { GorbchainSDK } from '../src/sdk/GorbchainSDK';
import { SPLTokenInstruction } from '../src/decoders/splToken';
import { setGorbchainConfig } from '../src/utils/gorbchainConfig';

describe('Gorbchain SDK Integration Tests with V2 Features', () => {
  let sdk: GorbchainSDK;
  const testWallet = '2CHVCwMA5i75GdBQJW1TRXh8M8hy18rqMawMcbGuwfAp';

  beforeEach(() => {
    sdk = new GorbchainSDK({
      rpcEndpoint: 'https://rpc.gorbchain.xyz',
      tokenAnalysis: {
        enabled: true,
        maxConcurrentRequests: 5
      },
      timeout: 30000,
      retries: 3
    });
  });

  describe('V2 Network Configuration', () => {
    test('should auto-detect network configuration', () => {
      const networkConfig = sdk.getNetworkConfig();
      
      expect(networkConfig).toBeDefined();
      expect(networkConfig?.name).toBe('Gorbchain Network');
      expect(networkConfig?.features).toBeDefined();
      expect(networkConfig?.tokenPrograms).toBeDefined();
    });

    test('should provide network capabilities', () => {
      const capabilities = sdk.getNetworkCapabilities();
      
      expect(capabilities).toBeDefined();
      expect(capabilities.supportedMethods).toBeInstanceOf(Array);
      expect(capabilities.features).toBeDefined();
      expect(capabilities.tokenPrograms).toBeInstanceOf(Array);
      expect(capabilities.supportedMethods.length).toBeGreaterThan(0);
    });

    test('should support feature checking', () => {
      const customTokensSupported = sdk.supportsFeature('customTokens');
      const nftSupported = sdk.supportsFeature('nftSupport');
      const transactionDecodingSupported = sdk.supportsFeature('transactionDecoding');
      
      expect(typeof customTokensSupported).toBe('boolean');
      expect(typeof nftSupported).toBe('boolean');
      expect(typeof transactionDecodingSupported).toBe('boolean');
    });

    test('should support method checking', () => {
      const getProgramAccountsSupported = sdk.supportsMethod('getProgramAccounts');
      const getAccountInfoSupported = sdk.supportsMethod('getAccountInfo');
      
      expect(typeof getProgramAccountsSupported).toBe('boolean');
      expect(typeof getAccountInfoSupported).toBe('boolean');
    });
  });

  describe('V2 Enhanced RPC Client', () => {
    test('should provide enhanced RPC client', () => {
      const enhancedClient = sdk.getEnhancedRpcClient();
      
      expect(enhancedClient).toBeDefined();
      expect(typeof enhancedClient.getSupportedMethods).toBe('function');
      expect(typeof enhancedClient.getNetworkConfig).toBe('function');
      expect(typeof enhancedClient.getProgramAccounts).toBe('function');
    });

    test('should detect supported methods dynamically', async () => {
      const enhancedClient = sdk.getEnhancedRpcClient();
      const supportedMethods = await enhancedClient.getSupportedMethods();
      
      expect(supportedMethods).toBeInstanceOf(Array);
      expect(supportedMethods.length).toBeGreaterThan(0);
      expect(supportedMethods).toContain('getAccountInfo');
    }, 10000);

    test('should check method support individually', async () => {
      const enhancedClient = sdk.getEnhancedRpcClient();
      
      const getAccountInfoSupported = await enhancedClient.isMethodSupported('getAccountInfo');
      const getProgramAccountsSupported = await enhancedClient.isMethodSupported('getProgramAccounts');
      
      expect(typeof getAccountInfoSupported).toBe('boolean');
      expect(typeof getProgramAccountsSupported).toBe('boolean');
    }, 10000);
  });

  describe('V2 Token Analysis Features', () => {
    test('should provide enhanced token holdings analysis', async () => {
      const holdings = await sdk.getAllTokenHoldings(testWallet, {
        includeCustomTokens: true,
        customPrograms: ['TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA']
      });
      
      expect(holdings).toBeDefined();
      expect(holdings.summary).toBeDefined();
      expect(typeof holdings.summary.totalTokens).toBe('number');
      expect(typeof holdings.summary.totalFungibleTokens).toBe('number');
      expect(typeof holdings.summary.totalNFTs).toBe('number');
      expect(holdings.holdings).toBeInstanceOf(Array);
    }, 15000);

    test('should provide portfolio analysis', async () => {
      const analysis = await sdk.analyzePortfolio(testWallet);
      
      expect(analysis).toBeDefined();
      expect(analysis.diversification).toBeDefined();
      expect(analysis.tokenTypes).toBeDefined();
      expect(typeof analysis.diversification.mintCount).toBe('number');
      expect(typeof analysis.diversification.largestHoldingPercentage).toBe('number');
      expect(typeof analysis.diversification.concentrationRisk).toBe('string');
    }, 15000);

    test('should analyze custom program tokens', async () => {
      const customTokens = await sdk.getCustomProgramTokens(
        testWallet,
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
      );
      
      expect(customTokens).toBeInstanceOf(Array);
      
      if (customTokens.length > 0) {
        const token = customTokens[0];
        expect(token.mint).toBeDefined();
        expect(token.tokenAccount).toBeDefined();
        expect(token.balance).toBeDefined();
        expect(typeof token.decimals).toBe('number');
        expect(typeof token.isNFT).toBe('boolean');
      }
    }, 15000);

    test('should categorize tokens by type', async () => {
      const categories = await sdk.getTokensByCategory(testWallet);
      
      expect(categories).toBeDefined();
      expect(categories.fungibleTokens).toBeInstanceOf(Array);
      expect(categories.nfts).toBeInstanceOf(Array);
      
      // Check structure of fungible tokens if any exist
      if (categories.fungibleTokens.length > 0) {
        const fungibleToken = categories.fungibleTokens[0];
        expect(fungibleToken.mint).toBeDefined();
        expect(fungibleToken.isNFT).toBe(false);
      }
      
      // Check structure of NFTs if any exist
      if (categories.nfts.length > 0) {
        const nft = categories.nfts[0];
        expect(nft.mint).toBeDefined();
        expect(nft.isNFT).toBe(true);
      }
    }, 15000);

    test('should provide top holdings analysis', async () => {
      const topHoldings = await sdk.getTopHoldings(testWallet, 5);
      
      expect(topHoldings).toBeInstanceOf(Array);
      expect(topHoldings.length).toBeLessThanOrEqual(5);
      
      if (topHoldings.length > 0) {
        const holding = topHoldings[0];
        expect(holding.mint).toBeDefined();
        expect(holding.balance).toBeDefined();
        expect(holding.balance.formatted).toBeDefined();
      }
    }, 15000);
  });

  describe('V2 Network Health and Monitoring', () => {
    test('should provide network health status', async () => {
      const health = await sdk.getNetworkHealth();
      
      expect(health).toBeDefined();
      expect(health.status).toMatch(/^(healthy|degraded|unhealthy)$/);
      expect(typeof health.currentSlot).toBe('number');
      expect(typeof health.responseTime).toBe('number');
      expect(typeof health.networkName).toBe('string');
      expect(health.responseTime).toBeGreaterThan(0);
    }, 10000);

    test('should detect network capabilities dynamically', async () => {
      const capabilities = await sdk.detectNetworkCapabilities();
      
      expect(capabilities).toBeDefined();
      expect(capabilities.supportedMethods).toBeInstanceOf(Array);
      expect(capabilities.detectedFeatures).toBeDefined();
      expect(typeof capabilities.detectedFeatures).toBe('object');
    }, 10000);
  });

  describe('V2 Advanced Features', () => {
    test('should provide supported programs list', () => {
      const supportedPrograms = sdk.getSupportedPrograms();
      
      expect(supportedPrograms).toBeDefined();
      expect(typeof supportedPrograms).toBe('object');
      expect(Object.keys(supportedPrograms).length).toBeGreaterThan(0);
    });

         test('should provide token analyzer instance', () => {
       const tokenAnalyzer = sdk.getTokenAnalyzer();
       
       expect(tokenAnalyzer).toBeDefined();
       expect(typeof tokenAnalyzer.getAllTokens).toBe('function');
     });

    test('should support batch wallet analysis', async () => {
      const wallets = [testWallet];
      const batchResults = await sdk.batchAnalyzeWallets(wallets, {
        maxConcurrentRequests: 2
      });
      
      expect(batchResults).toBeInstanceOf(Array);
      expect(batchResults.length).toBe(wallets.length);
      
             if (batchResults.length > 0) {
         const result = batchResults[0];
         expect(result.walletAddress).toBe(testWallet);
         expect(result.summary).toBeDefined();
       }
    }, 20000);
  });

  describe('V2 Transaction Decoding', () => {
    test('should provide enhanced transaction decoding', async () => {
      // Get a recent transaction from the test wallet
      const signatures = await sdk.getSignaturesForAddress(testWallet, { limit: 1 });
      
      if (signatures.length > 0) {
        const signature = signatures[0].signature;
        const decodedTx = await sdk.getAndDecodeTransaction(signature, {
          richDecoding: true,
          includeTokenMetadata: true
        });
        
                 expect(decodedTx).toBeDefined();
         if (decodedTx && decodedTx.decoded) {
           expect(Array.isArray(decodedTx.decoded)).toBe(true);
         }
      }
    }, 15000);
  });

  describe('V1 Compatibility', () => {
    test('should maintain v1 getTokenHoldings compatibility', async () => {
      const v1Holdings = await sdk.getTokenHoldings(testWallet);
      
      expect(v1Holdings).toBeInstanceOf(Array);
      
             if (v1Holdings.length > 0) {
         const holding = v1Holdings[0];
         expect(holding.mint).toBeDefined();
         expect(holding.tokenAccount).toBeDefined();
         expect(holding.balance).toBeDefined();
       }
    }, 15000);

    test('should maintain v1 getBalance compatibility', async () => {
      const balance = await sdk.getBalance(testWallet);
      
      expect(typeof balance).toBe('number');
      expect(balance).toBeGreaterThanOrEqual(0);
    }, 10000);

    test('should maintain v1 getAccountInfo compatibility', async () => {
      const accountInfo = await sdk.getAccountInfo(testWallet);
      
      expect(accountInfo).toBeDefined();
      if (accountInfo) {
        expect(typeof accountInfo.lamports).toBe('number');
        expect(typeof accountInfo.owner).toBe('string');
      }
    }, 10000);

    test('should maintain v1 RPC client access', () => {
      const rpcClient = sdk.getRpcClient();
      
      expect(rpcClient).toBeDefined();
      expect(typeof rpcClient.getSlot).toBe('function');
      expect(typeof rpcClient.getAccountInfo).toBe('function');
    });
  });

  describe('V2 Error Handling and Resilience', () => {
    test('should handle invalid wallet addresses gracefully', async () => {
      const invalidWallet = 'invalid-wallet-address';
      
      await expect(sdk.getAllTokenHoldings(invalidWallet)).rejects.toThrow();
    });

    test('should handle network timeouts gracefully', async () => {
      const shortTimeoutSDK = new GorbchainSDK({
        rpcEndpoint: 'https://localhost:99999', // Invalid port that should timeout
        timeout: 100, // Very short timeout to trigger timeout
        retries: 1
      });
      
      const health = await shortTimeoutSDK.getNetworkHealth();
      // Either unhealthy or degraded is acceptable for a failed connection
      expect(['unhealthy', 'degraded']).toContain(health.status);
      expect(health.responseTime).toBeGreaterThan(0);
    }, 10000);

    test('should handle custom program analysis errors gracefully', async () => {
      const invalidProgramId = 'InvalidProgramId123';
      
      // Should not throw but return empty array or handle gracefully
      const result = await sdk.getCustomProgramTokens(testWallet, invalidProgramId);
      expect(result).toBeInstanceOf(Array);
    }, 10000);
  });
});
