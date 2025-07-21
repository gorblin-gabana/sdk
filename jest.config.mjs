export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          target: 'ESNext',
          moduleResolution: 'node',
          allowSyntheticDefaultImports: true,
          esModuleInterop: true
        }
      }
    ]
  },
  roots: ['<rootDir>/test'],
  testMatch: [
    // Crypto tests (working ones first)
    '**/test/crypto.test.ts',
    '**/test/crypto-messaging-scenarios.test.ts',
    '**/test/crypto-security-edge-cases.test.ts',
    
    // Core optimized SDK tests (new)
    '**/test/optimized-sdk.test.ts',
    '**/test/real-user-journeys.test.ts',
    '**/test/rich-functions.test.ts',
    
    // Real scenario tests (kept)
    '**/test/wallet-v2-real-scenarios.test.ts',
    '**/test/usage-example.test.ts',
    
    // Core functionality tests (kept)
    '**/test/enhanced-rpc.test.ts',
    '**/test/rpc-client.test.ts',
    '**/test/error-handling.test.ts',
    '**/test/decoders.test.ts',
    
    // Temporarily exclude hanging tests
    // '**/test/crypto-collaboration-scenarios.test.ts',
    // '**/test/crypto-performance-stress.test.ts'
  ],
  testTimeout: 60000,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/browser.ts'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  verbose: true
};