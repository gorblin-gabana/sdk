import { GorbchainSDK } from '../src/index.js';

describe('GorbchainSDK Usage Examples', () => {
  let sdk: GorbchainSDK;

  beforeEach(() => {
    sdk = new GorbchainSDK({
      rpcEndpoint: 'https://test-rpc.gorbchain.xyz',
      network: 'mainnet'
    });
  });

  describe('Basic SDK Usage', () => {
    test('should initialize SDK with custom config', () => {
      const customSdk = new GorbchainSDK({
        rpcEndpoint: 'https://my-custom-rpc.com',
        network: 'devnet'
      });

      expect(customSdk.config.rpcEndpoint).toBe('https://my-custom-rpc.com');
      expect(customSdk.config.network).toBe('devnet');
    });

    test('should provide convenient access to components', () => {
      // Direct access to components
      expect(sdk.rpc).toBeDefined();
      expect(sdk.decoders).toBeDefined();

      // Configuration access
      expect(sdk.config).toBeDefined();

      // Utility methods
      expect(typeof sdk.decodeInstruction).toBe('function');
      expect(typeof sdk.decodeInstructions).toBe('function');
      expect(typeof sdk.getSupportedPrograms).toBe('function');
    });
  });

  describe('Real-world Transaction Decoding', () => {
    test('should decode a typical SPL Token transfer transaction', () => {
      // Simulate a real SPL Token transfer instruction
      const transferInstruction = {
        programAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        data: new Uint8Array([
          3, // Transfer instruction
          0x00, 0xe8, 0x76, 0x48, 0x17, 0x00, 0x00, 0x00 // 100,000,000,000 lamports (100 tokens with 9 decimals)
        ]),
        accounts: [
          { address: 'SourceTokenAccount1111111111111111111111111' }, // source
          { address: 'DestTokenAccount11111111111111111111111111' }, // destination
          { address: 'OwnerPublicKey111111111111111111111111111111' }  // owner/authority
        ]
      };

      const decoded = sdk.decodeInstruction(transferInstruction);

      expect(decoded.type).toBe('spl-token-transfer');
      expect(decoded.data.amount).toBe('100000000000'); // 100 tokens with 9 decimals
      expect(decoded.data.source).toBe('SourceTokenAccount1111111111111111111111111');
      expect(decoded.data.destination).toBe('DestTokenAccount11111111111111111111111111');
      expect(decoded.data.authority).toBe('OwnerPublicKey111111111111111111111111111111');
    });

    test('should decode a multi-instruction transaction', () => {
      const instructions = [
        // First: Approve instruction
        {
          programAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          data: new Uint8Array([
            4, // Approve instruction
            0x00, 0xca, 0x9a, 0x3b, 0x00, 0x00, 0x00, 0x00 // 1,000,000,000 (1000 tokens)
          ]),
          accounts: [
            { address: 'TokenAccount111111111111111111111111111111' },
            { address: 'DelegateAccount1111111111111111111111111111' },
            { address: 'OwnerAccount11111111111111111111111111111111' }
          ]
        },
        // Second: Transfer instruction using approved delegation
        {
          programAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          data: new Uint8Array([
            3, // Transfer instruction
            0x00, 0x65, 0xcd, 0x1d, 0x00, 0x00, 0x00, 0x00 // 500,000,000 (500 tokens)
          ]),
          accounts: [
            { address: 'SourceTokenAccount1111111111111111111111111' },
            { address: 'DestTokenAccount11111111111111111111111111' },
            { address: 'DelegateAccount1111111111111111111111111111' } // delegate as authority
          ]
        }
      ];

      const decodedInstructions = sdk.decodeInstructions(instructions);

      expect(decodedInstructions).toHaveLength(2);

      // First instruction: Approve
      const approve = decodedInstructions[0];
      expect(approve.type).toBe('spl-token-approve');
      expect(approve.data.amount).toBe('1000000000');
      expect(approve.data.delegate).toBe('DelegateAccount1111111111111111111111111111');

      // Second instruction: Transfer by delegate
      const transfer = decodedInstructions[1];
      expect(transfer.type).toBe('spl-token-transfer');
      expect(transfer.data.amount).toBe('500000000');
      expect(transfer.data.authority).toBe('DelegateAccount1111111111111111111111111111');
    });
  });

  describe('Custom Decoder Registration', () => {
    test('should register and use custom program decoder', () => {
      // Register a custom decoder for a hypothetical DEX program
      const dexDecoder = (instruction: any) => {
        const data = instruction.data;

        if (data[0] === 1) {
          return {
            type: 'dex-swap',
            programId: instruction.programAddress,
            data: {
              instructionType: 'swap',
              tokenA: instruction.accounts[0]?.address,
              tokenB: instruction.accounts[1]?.address,
              trader: instruction.accounts[2]?.address
            },
            accounts: instruction.accounts,
            raw: instruction
          };
        }

        return {
          type: 'dex-unknown',
          programId: instruction.programAddress,
          data: { instructionType: 'unknown' },
          accounts: instruction.accounts,
          raw: instruction
        };
      };

      sdk.registerDecoder('custom-dex', 'DEXProgram1111111111111111111111111111111111', dexDecoder);

      // Test the custom decoder
      const dexInstruction = {
        programAddress: 'DEXProgram1111111111111111111111111111111111',
        data: new Uint8Array([1, 2, 3, 4]), // First byte = 1 for swap
        accounts: [
          { address: 'TokenA111111111111111111111111111111111111' },
          { address: 'TokenB111111111111111111111111111111111111' },
          { address: 'TraderAccount1111111111111111111111111111' }
        ]
      };

      const decoded = sdk.decodeInstruction(dexInstruction);

      expect(decoded.type).toBe('dex-swap');
      expect(decoded.data.tokenA).toBe('TokenA111111111111111111111111111111111111');
      expect(decoded.data.tokenB).toBe('TokenB111111111111111111111111111111111111');
      expect(decoded.data.trader).toBe('TraderAccount1111111111111111111111111111');
    });
  });

  describe('Error Scenarios', () => {
    test('should handle malformed instructions gracefully', () => {
      const malformedInstruction = {
        programAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        data: new Uint8Array([3]), // Transfer instruction but missing amount data
        accounts: []
      };

      expect(() => {
        sdk.decodeInstruction(malformedInstruction);
      }).toThrow('Invalid Transfer instruction data length');
    });

    test('should handle unknown programs', () => {
      const unknownInstruction = {
        programAddress: 'UnknownProgram111111111111111111111111111111',
        data: new Uint8Array([1, 2, 3, 4, 5]),
        accounts: []
      };

      const decoded = sdk.decodeInstruction(unknownInstruction);

      expect(decoded.type).toBe('unknown');
      expect(decoded.programId).toBe('UnknownProgram111111111111111111111111111111');
      expect(decoded.data.raw).toEqual([1, 2, 3, 4, 5]);
      expect(decoded.data.hex).toBe('0102030405');
    });
  });

  describe('SDK Convenience Methods', () => {
    test('should provide network health check', async () => {
      // Mock the RPC response
      jest.spyOn(sdk.rpc, 'getHealth').mockResolvedValue('ok');

      const health = await sdk.getNetworkHealth();
      expect(health).toBe('ok');
    });

    test('should provide current slot information', async () => {
      jest.spyOn(sdk.rpc, 'getSlot').mockResolvedValue(12345);

      const slot = await sdk.getCurrentSlot();
      expect(slot).toBe(12345);
    });

    test('should provide block height', async () => {
      jest.spyOn(sdk.rpc, 'getBlockHeight').mockResolvedValue(98765);

      const height = await sdk.getBlockHeight();
      expect(height).toBe(98765);
    });

    test('should allow RPC endpoint updates', () => {
      sdk.setRpcEndpoint('https://new-endpoint.gorbchain.xyz');

      expect(sdk.config.rpcEndpoint).toBe('https://new-endpoint.gorbchain.xyz');
      expect(sdk.rpc.getRpcUrl()).toBe('https://new-endpoint.gorbchain.xyz');
    });
  });

  describe('Configuration Management', () => {
    test('should provide supported programs list', () => {
      const programs = sdk.getSupportedPrograms();

      expect(programs).toContain('spl-token');
      expect(Array.isArray(programs)).toBe(true);
    });

    test('should provide direct RPC client access', () => {
      const rpcClient = sdk.getRpcClient();

      expect(rpcClient).toBe(sdk.rpc);
      expect(typeof rpcClient.request).toBe('function');
    });

    test('should provide configuration access', () => {
      const config = sdk.config;

      expect(config.rpcEndpoint).toBe('https://test-rpc.gorbchain.xyz');
      expect(config.network).toBe('mainnet');
      expect(config.programIds).toBeDefined();
    });
  });
});
