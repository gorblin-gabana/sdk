module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: [
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
    '**/test/decoders.test.ts'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testTimeout: 30000, // 30 seconds for network tests
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.ts', // Exclude barrel export file from coverage
    '!src/browser.ts' // Exclude browser-specific entry point
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  verbose: true
};
