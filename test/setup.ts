// Global test setup for Gorbchain SDK v2
// Configure timeouts, mocks, and common test utilities

// Extend Jest timeout for network-dependent tests
jest.setTimeout(30000);

// Global beforeAll to setup common test environment
beforeAll(() => {
  // Configure any global test settings here
  process.env.NODE_ENV = 'test';
  
  // Mock console for cleaner test output if needed
  const originalConsoleWarn = console.warn;
  console.warn = (...args: any[]) => {
    // Only show warnings that aren't expected test warnings
    if (!args[0]?.includes?.('experimental') && !args[0]?.includes?.('deprecated')) {
      originalConsoleWarn(...args);
    }
  };
});

// Simple test setup without custom matchers 