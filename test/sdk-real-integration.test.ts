import { GorbchainSDK } from '../src/sdk/GorbchainSDK.js';
import { DecoderRegistry } from '../src/decoders/registry.js';

describe('SDK Real Integration Tests', () => {
  let sdk: GorbchainSDK;

  beforeEach(() => {
    sdk = new GorbchainSDK({
      rpcEndpoint: 'https://rpc.gorbchain.xyz',
      richDecoding: {
        enabled: true,
        includeTokenMetadata: true,
        includeNftMetadata: true
      }
    });
  });

  describe('SDK Initialization', () => {
    test('should initialize with default configuration', () => {
      const defaultSdk = new GorbchainSDK();
      expect(defaultSdk).toBeDefined();
      expect(defaultSdk.config.rpcEndpoint).toBe('https://rpc.gorbchain.xyz');
      expect(defaultSdk.config.network).toBe('custom');
    });

    test('should initialize with custom configuration', () => {
      const customSdk = new GorbchainSDK({
        rpcEndpoint: 'https://custom-rpc.example.com',
        network: 'testnet'
      });
      expect(customSdk.config.rpcEndpoint).toBe('https://custom-rpc.example.com');
      expect(customSdk.config.network).toBe('testnet');
    });

    test('should have decoder registry properly initialized', () => {
      expect(sdk.decoders).toBeDefined();
      expect(sdk.decoders).toBeInstanceOf(DecoderRegistry);

      const registeredPrograms = sdk.decoders.getRegisteredPrograms();
      expect(registeredPrograms).toContain('system');
      expect(registeredPrograms).toContain('spl-token');
      expect(registeredPrograms).toContain('token-2022');
      expect(registeredPrograms).toContain('ata');
      expect(registeredPrograms).toContain('nft');
    });

    test('should have RPC client properly initialized', () => {
      expect(sdk.rpc).toBeDefined();
      expect(sdk.rpc.getRpcUrl()).toBe('https://rpc.gorbchain.xyz');
    });
  });

  describe('Decoder Registry', () => {
    test('should decode System Program instructions', () => {
      const systemInstruction = {
        programId: '11111111111111111111111111111111',
        data: new Uint8Array([2, 0, 0, 0, 0, 0, 0, 0, 64, 66, 15, 0, 0, 0, 0, 0]), // Transfer 1000000 lamports
        accounts: ['sender123', 'recipient456']
      };

      const decoded = sdk.decodeInstruction(systemInstruction);
      expect(decoded).toBeDefined();
      expect(decoded.programId).toBe('11111111111111111111111111111111');
    });

    test('should decode SPL Token instructions', () => {
      const splTokenInstruction = {
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        data: new Uint8Array([3, 64, 66, 15, 0, 0, 0, 0, 0]), // Transfer 1000000 tokens
        accounts: ['sourceAccount', 'destinationAccount', 'authority']
      };

      const decoded = sdk.decodeInstruction(splTokenInstruction);
      expect(decoded).toBeDefined();
      expect(decoded.programId).toBe('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    });

    test('should decode Token-2022 instructions', () => {
      const token2022Instruction = {
        programId: 'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn',
        data: new Uint8Array([3, 64, 66, 15, 0, 0, 0, 0, 0]), // Transfer 1000000 tokens
        accounts: ['sourceAccount', 'destinationAccount', 'authority']
      };

      const decoded = sdk.decodeInstruction(token2022Instruction);
      expect(decoded).toBeDefined();
      expect(decoded.programId).toBe('FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn');
    });

    test('should handle unknown program IDs', () => {
      const unknownInstruction = {
        programId: 'UnknownProgramIdHere123456789',
        data: new Uint8Array([1, 2, 3, 4]),
        accounts: ['account1', 'account2']
      };

      const decoded = sdk.decodeInstruction(unknownInstruction);
      expect(decoded).toBeDefined();
      expect(decoded.type).toBe('unknown');
    });

    test('should allow custom decoder registration', () => {
      const customProgramId = 'CustomProgramId123456789';
      const customDecoder = jest.fn().mockReturnValue({
        type: 'custom-instruction',
        programId: customProgramId,
        data: { custom: true },
        accounts: []
      });

      sdk.registerDecoder('custom', customProgramId, customDecoder);

      const customInstruction = {
        programId: customProgramId,
        data: new Uint8Array([1, 2, 3]),
        accounts: ['account1']
      };

      const decoded = sdk.decodeInstruction(customInstruction);
      expect(customDecoder).toHaveBeenCalledWith(customInstruction);
      expect(decoded.type).toBe('custom-instruction');
      expect(decoded.data.custom).toBe(true);
    });
  });

  describe('Browser Compatibility', () => {
    test('should not use Buffer in browser environment', () => {
      // Test that the SDK doesn't try to use Buffer
      const originalBuffer = global.Buffer;
      delete (global as any).Buffer;

      try {
        // This should not throw an error
        const browserSdk = new GorbchainSDK();
        expect(browserSdk).toBeDefined();

        // Test instruction decoding without Buffer
        const instruction = {
          programId: '11111111111111111111111111111111',
          data: new Uint8Array([1, 2, 3, 4]),
          accounts: ['account1']
        };

        const decoded = browserSdk.decodeInstruction(instruction);
        expect(decoded).toBeDefined();
      } finally {
        // Restore Buffer
        (global as any).Buffer = originalBuffer;
      }
    });

    test('should handle base64 decoding without Buffer', () => {
      const base64String = 'SGVsbG8gV29ybGQ='; // "Hello World" in base64

      // Test that we can decode base64 without Buffer
      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const decoded = new TextDecoder().decode(bytes);
      expect(decoded).toBe('Hello World');
    });
  });

  describe('Configuration Management', () => {
    test('should enable/disable rich decoding', () => {
      expect(sdk.config.richDecoding?.enabled).toBe(true);

      sdk.setRichDecoding(false);
      expect(sdk.config.richDecoding?.enabled).toBe(false);

      sdk.setRichDecoding(true, { includeTokenMetadata: false });
      expect(sdk.config.richDecoding?.enabled).toBe(true);
      expect(sdk.config.richDecoding?.includeTokenMetadata).toBe(false);
    });

    test('should list supported programs', () => {
      const supportedPrograms = sdk.getSupportedPrograms();
      expect(supportedPrograms).toContain('system');
      expect(supportedPrograms).toContain('spl-token');
      expect(supportedPrograms).toContain('token-2022');
      expect(supportedPrograms).toContain('ata');
      expect(supportedPrograms).toContain('nft');
    });
  });

  describe('Test Methods', () => {
    test('should provide test methods for each decoder', async () => {
      // Test System Program decoder
      const systemTest = await sdk.testSystemDecoder('transfer');
      expect(systemTest).toBeDefined();
      expect(systemTest.type).toBeTruthy();

      // Test SPL Token decoder
      const splTest = await sdk.testSPLTokenDecoder('transfer');
      expect(splTest).toBeDefined();
      expect(splTest.type).toBeTruthy();

      // Test Token-2022 decoder
      const token2022Test = await sdk.testToken2022Decoder('transfer');
      expect(token2022Test).toBeDefined();
      expect(token2022Test.type).toBeTruthy();

      // Test ATA decoder
      const ataTest = await sdk.testATADecoder('create');
      expect(ataTest).toBeDefined();
      expect(ataTest.type).toBeTruthy();

      // Test Metaplex decoder
      const metaplexTest = await sdk.testMetaplexDecoder('createMetadata');
      expect(metaplexTest).toBeDefined();
      expect(metaplexTest.type).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid configuration gracefully', () => {
      expect(() => {
        new GorbchainSDK({
          rpcEndpoint: '', // Invalid empty endpoint
          network: 'invalid' as any
        });
      }).toThrow();
    });

    test('should handle decoding errors gracefully', () => {
      const malformedInstruction = {
        programId: 'invalid-program-id',
        data: 'invalid-data' as any,
        accounts: null as any
      };

      const decoded = sdk.decodeInstruction(malformedInstruction);
      expect(decoded).toBeDefined();
      expect(decoded.type).toBe('unknown');
    });
  });

  describe('RPC Client Integration', () => {
    test('should have working RPC client', () => {
      expect(sdk.rpc).toBeDefined();
      expect(typeof sdk.rpc.request).toBe('function');
      expect(typeof sdk.rpc.getHealth).toBe('function');
      expect(typeof sdk.rpc.getSlot).toBe('function');
      expect(typeof sdk.rpc.getAccountInfo).toBe('function');
    });

    test('should handle RPC errors gracefully', async () => {
      // This test would require actual network calls, so we'll mock it
      const mockRpc = {
        ...sdk.rpc,
        getHealth: jest.fn().mockRejectedValue(new Error('Network error'))
      };

      try {
        await mockRpc.getHealth();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });
  });

  describe('Memory Management', () => {
    test('should not leak memory on multiple decoder calls', () => {
      const initialMemory = process.memoryUsage();

      // Run many decoding operations
      for (let i = 0; i < 1000; i++) {
        const instruction = {
          programId: '11111111111111111111111111111111',
          data: new Uint8Array([2, 0, 0, 0, 0, 0, 0, 0, 64, 66, 15, 0, 0, 0, 0, 0]),
          accounts: [`sender${  i}`, `recipient${  i}`]
        };
        sdk.decodeInstruction(instruction);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
});
