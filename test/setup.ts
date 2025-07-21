// Global test setup for Gorbchain SDK v2 - Enhanced for Optimized SDK
// Configure timeouts, mocks, and common test utilities

import { jest, beforeAll, expect } from '@jest/globals';
import { GorbchainSDK } from '../src/index.js';

// Extend Jest timeout for network-dependent tests
jest.setTimeout(30000);

// Global test configuration types
interface TestConfig {
  NETWORK_TIMEOUT: number;
  DEFAULT_RPC_ENDPOINT: string;
  MAX_RETRIES: number;
  PERFORMANCE_THRESHOLDS: {
    RPC_RESPONSE_TIME: number;
    TOKEN_ANALYSIS_TIME: number;
    PORTFOLIO_ANALYSIS_TIME: number;
  };
}

// Set up global test configuration
(global as any).TEST_CONFIG = {
  NETWORK_TIMEOUT: 30000, // 30 seconds
  DEFAULT_RPC_ENDPOINT: 'https://rpc.gorbchain.xyz',
  MAX_RETRIES: 3,
  PERFORMANCE_THRESHOLDS: {
    RPC_RESPONSE_TIME: 5000, // 5 seconds
    TOKEN_ANALYSIS_TIME: 15000, // 15 seconds
    PORTFOLIO_ANALYSIS_TIME: 20000, // 20 seconds
  }
};

// Test data configuration - populated with real data from environment or defaults
const TEST_DATA = {
  wallets: {
    diverse: process.env.TEST_WALLET_DIVERSE || '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    nft: process.env.TEST_WALLET_NFT || '5YNmS1R9nNSCDzAYUGd2xgXzUk8A5mWJPybyGCPP6gFW',
    token: process.env.TEST_WALLET_TOKEN || '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    empty: process.env.TEST_WALLET_EMPTY || '5YNmS1R9nNSCDzAYUGd2xgXzUk8A5mWJPybyGCPP6gFW'
  },
  
  nfts: {
    mplCore: {
      address: process.env.TEST_NFT_MPL_CORE || 'FWsWxqEjpy6B2Je5TwhUsB3aAqXHPgwApWEoHnmnsorZ',
      owner: process.env.TEST_NFT_OWNER || '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'
    }
  },
  
  tokens: {
    custom: {
      address: process.env.TEST_TOKEN_CUSTOM || 'So11111111111111111111111111111111111111112',
      symbol: process.env.TEST_TOKEN_SYMBOL || 'SOL'
    }
  },
  
  transactions: {
    tokenTransfer: process.env.TEST_TX_TOKEN_TRANSFER || '',
    nftMint: process.env.TEST_TX_NFT_MINT || '',
    complex: process.env.TEST_TX_COMPLEX || ''
  },
  
  network: {
    rpcEndpoint: process.env.TEST_RPC_ENDPOINT || 'https://rpc.gorbchain.xyz',
    networkName: process.env.TEST_NETWORK_NAME || 'gorbchain'
  }
};

// Helper functions for test utilities
function shouldSkipNetworkTests(): boolean {
  return process.env.SKIP_NETWORK_TESTS === 'true';
}

function shouldSkipRealDataTests(): boolean {
  return process.env.SKIP_REAL_DATA_TESTS === 'true';
}

function createTestSDK(overrides?: any) {
  return new GorbchainSDK({
    rpcEndpoint: TEST_DATA.network.rpcEndpoint,
    network: TEST_DATA.network.networkName,
    timeout: (global as any).TEST_CONFIG.NETWORK_TIMEOUT,
    retries: (global as any).TEST_CONFIG.MAX_RETRIES,
    programIds: {
      splToken: 'Gorbj8Dp27NkXMQUkeHBSmpf6iQ3yT4b2uVe8kM4s6br',
      token2022: 'G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6',
      ata: 'GoATGVNeSXerFerPqTJ8hcED1msPWHHLxao2vwBYqowm',
      metaplex: 'GMTAp1moCdGh4TEwFTcCJKeKL3UMEDB6vKpo2uxM9h4s'
    },
    tokenAnalysis: {
      enabled: true,
      maxConcurrentRequests: 5,
      enableMetadataResolution: true
    },
    richDecoding: {
      enabled: true,
      includeTokenMetadata: true,
      includeNftMetadata: true,
      maxConcurrentRequests: 3,
      enableCache: true
    },
    ...overrides
  });
}

// Performance tracking utility
class PerformanceTracker {
  private startTime: number = 0;
  
  start() {
    this.startTime = Date.now();
  }
  
  end(): number {
    return Date.now() - this.startTime;
  }
  
  expectUnder(threshold: number, operation: string) {
    const duration = this.end();
    expect(duration).toBeLessThan(threshold);
    if (process.env.VERBOSE_TESTS === 'true') {
      console.log(`✅ ${operation} completed in ${duration}ms (threshold: ${threshold}ms)`);
    }
  }
}

// Global beforeAll to setup common test environment
beforeAll(() => {
  // Configure any global test settings here
  process.env.NODE_ENV = 'test';
  
  // Mock console for cleaner test output if needed
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;
  
  if (process.env.VERBOSE_TESTS !== 'true') {
    console.warn = (...args: any[]) => {
      // Only show warnings that aren't expected test warnings
      if (!args[0]?.includes?.('experimental') && !args[0]?.includes?.('deprecated')) {
        originalConsoleWarn(...args);
      }
    };
    
    // Suppress logs unless test fails
    console.log = (...args: any[]) => {
      // Only show important logs in tests
      if (args[0]?.includes?.('✅') || args[0]?.includes?.('❌') || args[0]?.includes?.('⚠️')) {
        originalConsoleLog(...args);
      }
    };
  }
  
  // Validate test data availability
  const issues: string[] = [];
  if (!process.env.TEST_WALLET_DIVERSE) {
    issues.push('TEST_WALLET_DIVERSE not provided - using default test wallet');
  }
  if (!process.env.TEST_NFT_MPL_CORE) {
    issues.push('TEST_NFT_MPL_CORE not provided - using default NFT address');
  }
  if (!process.env.TEST_TX_TOKEN_TRANSFER) {
    issues.push('TEST_TX_TOKEN_TRANSFER not provided - transaction tests may be limited');
  }
  
  if (issues.length > 0 && process.env.VERBOSE_TESTS === 'true') {
    console.warn('⚠️  Test Data Issues:');
    issues.forEach(issue => console.warn(`   - ${issue}`));
    console.warn('   See TESTING_STRATEGY.md for instructions on providing real test data');
  }
});

// Export as ES modules
export {
  TEST_DATA,
  shouldSkipNetworkTests,
  shouldSkipRealDataTests,
  createTestSDK,
  PerformanceTracker
};
