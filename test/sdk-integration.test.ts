import { GorbchainSDK } from '../src/sdk/GorbchainSDK.js';
import { SPLTokenInstruction } from '../src/decoders/splToken.js';
import { setGorbchainConfig } from '../src/utils/gorbchainConfig.js';

describe('GorbchainSDK Integration Tests', () => {
  let sdk: GorbchainSDK;

  beforeEach(() => {
    // Reset config before each test
    setGorbchainConfig({
      rpcUrl: 'https://test-rpc.gorbchain.xyz',
      programIds: {
        splToken: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        token2022: 'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn',
        ata: '4YpYoLVTQ8bxcne9GneN85RUXeN7pqGTwgPcY71ZL5gX',
        metaplex: 'BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc'
      }
    });
    sdk = new GorbchainSDK();
  });

  describe('SDK Initialization', () => {
    test('should initialize with gorbchain config defaults', () => {
      expect(sdk.config.rpcEndpoint).toBe('https://test-rpc.gorbchain.xyz');
      expect(sdk.config.network).toBe('custom');
      expect(sdk.config.programIds?.splToken).toBe('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    });

    test('should allow custom config override', () => {
      const customSdk = new GorbchainSDK({
        rpcEndpoint: 'https://custom.rpc.url',
        network: 'devnet'
      });

      expect(customSdk.config.rpcEndpoint).toBe('https://custom.rpc.url');
      expect(customSdk.config.network).toBe('devnet');
      // Should still have program IDs from gorbchain config
      expect(customSdk.config.programIds?.splToken).toBe('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    });

    test('should validate config properly', () => {
      expect(() => {
        new GorbchainSDK({ rpcEndpoint: '' });
      }).toThrow('Invalid or missing rpcEndpoint');

      expect(() => {
        new GorbchainSDK({ network: 'invalid' as any });
      }).toThrow('Invalid network');
    });
  });

  describe('Decoder Registry', () => {
    test('should have default decoders registered', () => {
      const supportedPrograms = sdk.getSupportedPrograms();
      expect(supportedPrograms).toContain('spl-token');
    });

    test('should allow custom decoder registration', () => {
      const customDecoder = (instruction: any) => ({
        type: 'custom-test',
        programId: 'CustomProgram111111111111111111111111111',
        data: { custom: true },
        accounts: instruction.accounts || [],
        raw: instruction
      });

      sdk.registerDecoder('custom-program', 'CustomProgram111111111111111111111111111', customDecoder);

      const supportedPrograms = sdk.getSupportedPrograms();
      expect(supportedPrograms).toContain('custom-program');
    });
  });

  describe('SPL Token Decoding', () => {
    test('should decode SPL Token Transfer instruction correctly', () => {
      const mockInstruction = {
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        data: new Uint8Array([
          SPLTokenInstruction.Transfer, // instruction type = 3
          0x00, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 // amount: 4096 (little-endian)
        ]),
        accounts: [
          'SourceAccount1111111111111111111111111111',
          'DestAccount11111111111111111111111111111',
          'Authority111111111111111111111111111111'
        ]
      };

      const decoded = sdk.decodeInstruction(mockInstruction);

      expect(decoded.type).toBe('spl-token-transfer');
      expect(decoded.programId).toBe('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
      expect(decoded.data.amount).toBe('4096');
      expect(decoded.data.source).toBe('SourceAccount1111111111111111111111111111');
      expect(decoded.data.destination).toBe('DestAccount11111111111111111111111111111');
      expect(decoded.data.authority).toBe('Authority111111111111111111111111111111');
    });

    test('should decode SPL Token MintTo instruction correctly', () => {
      const mockInstruction = {
        programAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        data: new Uint8Array([
          SPLTokenInstruction.MintTo, // instruction type = 7
          0x40, 0x42, 0x0F, 0x00, 0x00, 0x00, 0x00, 0x00 // amount: 1000000 (little-endian)
        ]),
        accounts: [
          { address: 'MintAccount1111111111111111111111111111111' },
          { address: 'TokenAccount111111111111111111111111111' },
          { address: 'MintAuthority11111111111111111111111111' }
        ]
      };

      const decoded = sdk.decodeInstruction(mockInstruction);

      expect(decoded.type).toBe('spl-token-mint-to');
      expect(decoded.data.amount).toBe('1000000');
      expect(decoded.data.mint).toBe('MintAccount1111111111111111111111111111111');
      expect(decoded.data.account).toBe('TokenAccount111111111111111111111111111');
      expect(decoded.data.authority).toBe('MintAuthority11111111111111111111111111');
    });

    test('should handle unknown SPL Token instructions gracefully', () => {
      const mockInstruction = {
        programAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        data: new Uint8Array([255]), // Unknown instruction type
        accounts: []
      };

      const decoded = sdk.decodeInstruction(mockInstruction);

      expect(decoded.type).toBe('spl-token-unknown');
      expect(decoded.data.instructionType).toBe(255);
      expect(decoded.data.error).toContain('Unknown SPL Token instruction type: 255');
    });

    test('should decode multiple instructions', () => {
      const instructions = [
        {
          programAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          data: new Uint8Array([SPLTokenInstruction.Transfer, 0x00, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
          accounts: [
            { address: 'Source111' },
            { address: 'Dest1111' },
            { address: 'Auth11111' }
          ]
        },
        {
          programAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          data: new Uint8Array([SPLTokenInstruction.MintTo, 0x40, 0x42, 0x0F, 0x00, 0x00, 0x00, 0x00, 0x00]),
          accounts: [
            { address: 'Mint11111' },
            { address: 'Account11' },
            { address: 'Authority' }
          ]
        }
      ];

      const decoded = sdk.decodeInstructions(instructions);

      expect(decoded).toHaveLength(2);
      expect(decoded[0].type).toBe('spl-token-transfer');
      expect(decoded[1].type).toBe('spl-token-mint-to');
    });
  });

  describe('RPC Client', () => {
    test('should initialize RPC client with correct endpoint', () => {
      expect(sdk.rpc.getRpcUrl()).toBe('https://test-rpc.gorbchain.xyz');
    });

    test('should allow RPC endpoint updates', () => {
      sdk.setRpcEndpoint('https://new-rpc.gorbchain.xyz');
      expect(sdk.config.rpcEndpoint).toBe('https://new-rpc.gorbchain.xyz');
      expect(sdk.rpc.getRpcUrl()).toBe('https://new-rpc.gorbchain.xyz');
    });

    test('should have RPC convenience methods', () => {
      expect(typeof sdk.getNetworkHealth).toBe('function');
      expect(typeof sdk.getCurrentSlot).toBe('function');
      expect(typeof sdk.getBlockHeight).toBe('function');
      expect(typeof sdk.getLatestBlockhash).toBe('function');
    });

    test('should provide direct RPC client access', () => {
      const rpcClient = sdk.getRpcClient();
      expect(rpcClient).toBe(sdk.rpc);
      expect(typeof rpcClient.request).toBe('function');
    });
  });

  describe('Unknown Program Handling', () => {
    test('should handle unknown programs gracefully', () => {
      const mockInstruction = {
        programAddress: 'UnknownProgram111111111111111111111111111',
        data: new Uint8Array([1, 2, 3, 4, 5]),
        accounts: []
      };

      const decoded = sdk.decodeInstruction(mockInstruction);

      expect(decoded.type).toBe('unknown');
      expect(decoded.programId).toBe('UnknownProgram111111111111111111111111111');
      expect(decoded.data.raw).toEqual([1, 2, 3, 4, 5]);
      expect(decoded.data.hex).toBe('0102030405');
    });
  });

  describe('Config Integration', () => {
    test('should use gorbchain config for program IDs', () => {
      // Update config and create new SDK
      setGorbchainConfig({
        programIds: {
          splToken: 'CustomSPLToken11111111111111111111111111'
        }
      });

      const newSdk = new GorbchainSDK();
      expect(newSdk.config.programIds?.splToken).toBe('CustomSPLToken11111111111111111111111111');
    });

    test('should fallback to defaults when config is missing', () => {
      // Clear config
      setGorbchainConfig({});

      const newSdk = new GorbchainSDK();
      expect(newSdk.config.rpcEndpoint).toBe('https://rpc.gorbchain.xyz');
      expect(newSdk.config.programIds).toEqual({});
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed instruction data', () => {
      const mockInstruction = {
        programAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        data: new Uint8Array([SPLTokenInstruction.Transfer, 0x00]), // Too short for transfer
        accounts: []
      };

      expect(() => {
        sdk.decodeInstruction(mockInstruction);
      }).toThrow('Invalid Transfer instruction data length');
    });

    test('should handle empty instruction data', () => {
      const mockInstruction = {
        programAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        data: new Uint8Array([]),
        accounts: []
      };

      expect(() => {
        sdk.decodeInstruction(mockInstruction);
      }).toThrow('Invalid SPL Token instruction: no data');
    });
  });
});
