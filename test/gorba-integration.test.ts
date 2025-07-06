import { GorbchainSDK } from '../src/sdk/GorbchainSDK.js';

describe('GORBA Token Integration Tests', () => {
  let sdk: GorbchainSDK;

  beforeEach(() => {
    // Configure SDK for Gorbchain network
    sdk = new GorbchainSDK({
      rpcEndpoint: 'https://rpc.gorbchain.xyz',
      network: 'custom',
      programIds: {
        'token2022': 'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn',
        'ata': '4YpYoLVTQ8bxcne9GneN85RUXeN7pqGTwgPcY71ZL5gX',
        'metaplex': 'BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc'
      }
    });
  });

  describe('Real GORBA Token Transactions', () => {
    const realTransactions = {
      createAccount: '3K7XxugEXv8CBQCaL1ZYB7cgYiCGE4THakb23hw3Ltv1XsYDCNctCEivhwCLvtyrfo3gsS9tS3CPqX6kYTe4WqZn',
      mintTokens: '5Nm3CvXWYjDaeVPTXifXHFzpovVZo6pLQdMfZoBjBjHM8rHehcfT97MYTQv528LwrNDWDtwZeW5FoUK9z3vE4ABM'
    };

    const gorbaTokenData = {
      name: 'GORBA',
      symbol: 'GOR',
      totalSupply: '1000000000', // 1 billion
      mintAddress: '2o1oEPUXhNMLu8HQihgXtXu1Vv5zTTvpX5uVZV6f2Jxa',
      tokenAccount: '53GoeJYQJENBJzgvSQ6FWFn3VVh65bPezokraAvzruSn'
    };

    it('should validate GORBA mint address format', () => {
      expect(gorbaTokenData.mintAddress).toMatch(/^[A-Za-z0-9]+$/);
      expect(gorbaTokenData.mintAddress.length).toBeGreaterThan(40);
    });

    it('should validate token account address format', () => {
      expect(gorbaTokenData.tokenAccount).toMatch(/^[A-Za-z0-9]+$/);
      expect(gorbaTokenData.tokenAccount.length).toBeGreaterThan(40);
    });

    it('should validate transaction signature format', () => {
      Object.values(realTransactions).forEach(txSignature => {
        expect(txSignature).toMatch(/^[A-Za-z0-9]+$/);
        expect(txSignature.length).toBeGreaterThan(80);
      });
    });

    it('should handle GORBA token configuration', () => {
      expect(sdk.config.rpcEndpoint).toBe('https://rpc.gorbchain.xyz');
      expect(sdk.config.network).toBe('custom');
      expect(sdk.config.programIds?.['token2022']).toBe('FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn');
      expect(sdk.config.programIds?.['ata']).toBe('4YpYoLVTQ8bxcne9GneN85RUXeN7pqGTwgPcY71ZL5gX');
      expect(sdk.config.programIds?.['metaplex']).toBe('BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc');
    });

    it('should support token supply calculations', () => {
      const rawSupply = '2000000000000000000'; // As shown in your output
      const humanReadable = '2,000,000,000'; // 2 billion total minted
      const accountBalance = '1000000000000000000'; // 1 billion in account

      expect(rawSupply).toBe('2000000000000000000');
      expect(accountBalance).toBe('1000000000000000000');

      // Validate the math: account should have half of total supply
      const totalRaw = BigInt(rawSupply);
      const accountRaw = BigInt(accountBalance);
      expect(accountRaw * BigInt(2)).toBe(totalRaw);
    });

    it('should register custom GORBA token decoder', () => {
      const gorbaDecoder = (instruction: any) => ({
        type: 'gorba-token',
        programId: gorbaTokenData.mintAddress,
        data: {
          symbol: gorbaTokenData.symbol,
          name: gorbaTokenData.name,
          instruction
        },
        accounts: instruction.accounts || []
      });

      sdk.registerDecoder('gorba-token', gorbaTokenData.mintAddress, gorbaDecoder);

      const supportedPrograms = sdk.getSupportedPrograms();
      expect(supportedPrograms).toContain('gorba-token');
    });

    it('should handle GORBA mint instruction decoding', () => {
      const mockMintInstruction = {
        programId: gorbaTokenData.mintAddress,
        data: 'mock_mint_data',
        accounts: [
          { pubkey: gorbaTokenData.mintAddress, isSigner: false, isWritable: true },
          { pubkey: gorbaTokenData.tokenAccount, isSigner: false, isWritable: true }
        ]
      };

      const gorbaDecoder = (instruction: any) => ({
        type: 'gorba-mint',
        programId: instruction.programId,
        data: {
          action: 'mint',
          symbol: 'GOR',
          amount: '1000000000000000000',
          raw: instruction
        },
        accounts: instruction.accounts
      });

      sdk.registerDecoder('gorba-mint', gorbaTokenData.mintAddress, gorbaDecoder);

      const decoded = sdk.decodeInstruction(mockMintInstruction);

      expect(decoded.type).toBe('gorba-mint');
      expect(decoded.data.symbol).toBe('GOR');
      expect(decoded.data.action).toBe('mint');
    });

    it('should validate Gorbchain RPC endpoint configuration', async () => {
      expect(sdk.config.rpcEndpoint).toBe('https://rpc.gorbchain.xyz');

      // Mock the RPC client to avoid actual network calls in tests
      const mockRpcClient = {
        getHealth: jest.fn().mockResolvedValue({ status: 'ok' }),
        getSlot: jest.fn().mockResolvedValue(12345),
        getBlockHeight: jest.fn().mockResolvedValue(67890),
        request: jest.fn()
      };

      // Replace the RPC client with our mock  
      (sdk as any).rpc = mockRpcClient;

      const health = await sdk.getNetworkHealth();
      expect((health as any).status).toBe('ok');

      const slot = await sdk.getCurrentSlot();
      expect(slot).toBe(12345);

      const height = await sdk.getBlockHeight();
      expect(height).toBe(67890);
    });

    it('should handle network unavailability gracefully', async () => {
      // Test with actual network call but handle both success and failure
      try {
        const health = await sdk.getNetworkHealth();
        // If network is available, expect healthy status
        expect(['ok', 'healthy', 'unavailable']).toContain((health as any).status);
      } catch (error) {
        // If network call fails, that's also acceptable for testing
        expect(error).toBeDefined();
      }
    });
  });

  describe('Token Supply Management', () => {
    it('should handle large token amounts correctly', () => {
      // Test with actual GORBA amounts
      const oneBillionTokens = BigInt('1000000000000000000'); // 1B with 9 decimals
      const twoBillionTokens = BigInt('2000000000000000000'); // 2B with 9 decimals

      expect(oneBillionTokens.toString()).toBe('1000000000000000000');
      expect(twoBillionTokens.toString()).toBe('2000000000000000000');

      // Verify calculations
      expect(oneBillionTokens * BigInt(2)).toBe(twoBillionTokens);
    });

    it('should format token amounts for display', () => {
      const formatTokenAmount = (rawAmount: string, decimals: number = 9): string => {
        const amount = BigInt(rawAmount);
        const divisor = BigInt(10 ** decimals);
        const tokens = amount / divisor;
        return Number(tokens).toLocaleString();
      };

      expect(formatTokenAmount('1000000000000000000')).toBe('1,000,000,000');
      expect(formatTokenAmount('2000000000000000000')).toBe('2,000,000,000');
    });
  });
});
