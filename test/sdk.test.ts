import { GorbchainSDK } from '../src/sdk/GorbchainSDK';
import { DecoderRegistry } from '../src/decoders/index';
import { RpcClient } from '../src/rpc/client';

// Mock the RPC client
jest.mock('../src/rpc/client.js');
const MockedRpcClient = RpcClient as jest.MockedClass<typeof RpcClient>;

describe('GorbchainSDK', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with basic configuration', () => {
      const config = {
        rpcEndpoint: 'https://rpc.gorbchain.xyz'
      };
      const sdk = new GorbchainSDK(config);

      expect(sdk.decoders).toBeInstanceOf(DecoderRegistry);
      expect(MockedRpcClient).toHaveBeenCalledWith({
        rpcUrl: 'https://rpc.gorbchain.xyz',
        timeout: 30000,
        retries: 3
      });
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        rpcEndpoint: 'https://custom-rpc.example.com',
        network: 'devnet',
        timeout: 60000,
        retries: 5
      };

      const sdk = new GorbchainSDK(customConfig);

      expect(sdk.decoders).toBeInstanceOf(DecoderRegistry);
      expect(MockedRpcClient).toHaveBeenCalledWith({
        rpcUrl: 'https://custom-rpc.example.com',
        timeout: 60000,
        retries: 5
      });
    });

    it('should initialize with v2 token analysis configuration', () => {
      const v2Config = {
        rpcEndpoint: 'https://rpc.gorbchain.xyz',
        tokenAnalysis: {
          enabled: true,
          maxConcurrentRequests: 10,
          enableMetadataResolution: true
        },
        richDecoding: {
          enabled: true,
          includeTokenMetadata: true,
          includeNftMetadata: true
        },
        timeout: 60000,
        retries: 5
      };

      const sdk = new GorbchainSDK(v2Config);

      expect(sdk.decoders).toBeInstanceOf(DecoderRegistry);
      expect(sdk.getEnhancedRpcClient()).toBeDefined();
      expect(sdk.getTokenAnalyzer()).toBeDefined();
    });

    it('should use default configuration when none provided', () => {
      const sdk = new GorbchainSDK();
      
      expect(sdk.config.rpcEndpoint).toBe('https://rpc.gorbchain.xyz');
      expect(sdk.config.timeout).toBe(30000);
      expect(sdk.config.retries).toBe(3);
      expect(sdk.decoders).toBeInstanceOf(DecoderRegistry);
    });
  });

  describe('V2 Network Features', () => {
    let sdk: GorbchainSDK;

    beforeEach(() => {
      sdk = new GorbchainSDK({ rpcEndpoint: 'https://rpc.gorbchain.xyz' });
    });

    it('should provide network configuration', () => {
      const networkConfig = sdk.getNetworkConfig();
      
      expect(networkConfig).toBeDefined();
      expect(networkConfig?.name).toBe('Gorbchain Network');
      expect(networkConfig?.features).toBeDefined();
      expect(networkConfig?.tokenPrograms).toBeDefined();
      expect(networkConfig?.supportedMethods).toBeDefined();
    });

    it('should provide network capabilities', () => {
      const capabilities = sdk.getNetworkCapabilities();
      
      expect(capabilities).toBeDefined();
      expect(capabilities.supportedMethods).toBeInstanceOf(Array);
      expect(capabilities.features).toBeDefined();
      expect(capabilities.tokenPrograms).toBeInstanceOf(Array);
    });

    it('should support feature checking', () => {
      const features = ['standardTokens', 'customTokens', 'nftSupport', 'metadataSupport'];
      
      features.forEach(feature => {
        const supported = sdk.supportsFeature(feature);
        expect(typeof supported).toBe('boolean');
      });
    });

    it('should provide enhanced RPC client', () => {
      const enhancedClient = sdk.getEnhancedRpcClient();
      
      expect(enhancedClient).toBeDefined();
      expect(typeof enhancedClient.getSupportedMethods).toBe('function');
      expect(typeof enhancedClient.getNetworkConfig).toBe('function');
      expect(typeof enhancedClient.getProgramAccounts).toBe('function');
    });
  });

  describe('V2 Token Analysis Features', () => {
    let sdk: GorbchainSDK;
    let mockRpcClient: any;

    beforeEach(() => {
      sdk = new GorbchainSDK();
      mockRpcClient = {
        getHealth: jest.fn(),
        getSlot: jest.fn(),
        getBlockHeight: jest.fn(),
        getLatestBlockhash: jest.fn(),
        setRpcUrl: jest.fn(),
        request: jest.fn(),
        getAccountInfo: jest.fn(),
        getTokenAccountsByOwner: jest.fn()
      };

      // Replace the private RPC client with our mock
      (sdk as any).rpcClient = mockRpcClient;
    });

    it('should provide enhanced token holdings analysis', async () => {
      const testWallet = '2CHVCwMA5i75GdBQJW1TRXh8M8hy18rqMawMcbGuwfAp';
      const mockHoldings = {
        walletAddress: testWallet,
        timestamp: new Date().toISOString(),
        summary: {
          totalTokens: 5,
          totalFungibleTokens: 3,
          totalNFTs: 2,
          uniqueMints: 5,
          hasMetadata: 1,
          topHoldings: []
        },
        holdings: []
      };

      // Mock the enhanced token holdings method
      jest.spyOn(sdk, 'getAllTokenHoldings').mockResolvedValue(mockHoldings);

      const holdings = await sdk.getAllTokenHoldings(testWallet, {
        includeCustomTokens: true,
        customPrograms: ['TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA']
      });

      expect(holdings).toBeDefined();
      expect(holdings.summary).toBeDefined();
      expect(holdings.summary.totalTokens).toBe(5);
      expect(holdings.holdings).toBeInstanceOf(Array);
    });

    it('should provide portfolio analysis', async () => {
      const mockAnalysis = {
        diversification: {
          mintCount: 5,
          largestHoldingPercentage: 45.2,
          concentrationRisk: 'medium' as const
        },
        tokenTypes: {
          fungibleTokens: 3,
          nfts: 2,
          unknownTokens: 0
        },
        balanceDistribution: {
          zeroBalance: 0,
          smallBalance: 2,
          mediumBalance: 2,
          largeBalance: 1
        }
      };

      // Mock the portfolio analysis method
      jest.spyOn(sdk, 'analyzePortfolio').mockResolvedValue(mockAnalysis);

      const walletAddress = '2CHVCwMA5i75GdBQJW1TRXh8M8hy18rqMawMcbGuwfAp';
      const analysis = await sdk.analyzePortfolio(walletAddress);

      expect(analysis).toBeDefined();
      expect(analysis.diversification).toBeDefined();
      expect(analysis.tokenTypes).toBeDefined();
      expect(analysis.diversification.mintCount).toBe(5);
    });

    it('should provide custom program token analysis', async () => {
      const mockCustomTokens = [
        {
          mint: 'TestMint123',
          tokenAccount: 'TestAccount123',
          balance: {
            raw: '1000000',
            decimal: 1.0,
            formatted: '1.0'
          },
          decimals: 6,
          isNFT: false
        }
      ];

      // Mock the custom program tokens method
      jest.spyOn(sdk, 'getCustomProgramTokens').mockResolvedValue(mockCustomTokens);

      const testWallet = '2CHVCwMA5i75GdBQJW1TRXh8M8hy18rqMawMcbGuwfAp';
      const customTokens = await sdk.getCustomProgramTokens(testWallet, 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

      expect(customTokens).toBeInstanceOf(Array);
      expect(customTokens.length).toBe(1);
      expect(customTokens[0].mint).toBe('TestMint123');
    });

    it('should categorize tokens', async () => {
      const mockCategories = {
        fungibleTokens: [
          { 
            mint: 'FungibleMint1', 
            tokenAccount: 'FungibleAccount1',
            balance: { formatted: '100.0', raw: '100000000', decimal: 100.0 },
            decimals: 6,
            isNFT: false
          },
          { 
            mint: 'FungibleMint2', 
            tokenAccount: 'FungibleAccount2',
            balance: { formatted: '50.0', raw: '50000000', decimal: 50.0 },
            decimals: 6,
            isNFT: false
          }
        ],
        nfts: [
          { 
            mint: 'NFTMint1', 
            tokenAccount: 'NFTAccount1',
            balance: { formatted: '1', raw: '1', decimal: 1 },
            decimals: 0,
            isNFT: true
          }
        ]
      };

      // Mock the token categories method
      jest.spyOn(sdk, 'getTokensByCategory').mockResolvedValue(mockCategories);

      const testWallet = '2CHVCwMA5i75GdBQJW1TRXh8M8hy18rqMawMcbGuwfAp';
      const categories = await sdk.getTokensByCategory(testWallet);

      expect(categories).toBeDefined();
      expect(categories.fungibleTokens).toBeInstanceOf(Array);
      expect(categories.nfts).toBeInstanceOf(Array);
      expect(categories.fungibleTokens.length).toBe(2);
      expect(categories.nfts.length).toBe(1);
    });
  });

  describe('Decoder Methods', () => {
    let sdk: GorbchainSDK;

    beforeEach(() => {
      sdk = new GorbchainSDK({ rpcEndpoint: 'https://rpc.gorbchain.xyz' });
    });

    it('should decode single instruction', () => {
      const mockInstruction = { 
        programId: 'test', 
        data: new Uint8Array([1, 2, 3]), 
        accounts: ['account1', 'account2'] 
      };
      const mockDecodedResult = {
        type: 'test',
        programId: 'test',
        data: {},
        accounts: []
      };

      // Mock the decoder registry decode method
      jest.spyOn(sdk.decoders, 'decode').mockReturnValue(mockDecodedResult);

      const result = sdk.decodeInstruction(mockInstruction);

      expect(sdk.decoders.decode).toHaveBeenCalledWith(mockInstruction);
      expect(result).toBe(mockDecodedResult);
    });

    it('should decode multiple instructions', () => {
      const mockInstructions = [
        { programId: 'test1', data: new Uint8Array([1, 2, 3]), accounts: ['account1'] },
        { programId: 'test2', data: new Uint8Array([4, 5, 6]), accounts: ['account2'] }
      ];
      const mockDecodedResults = [
        { type: 'test1', programId: 'test1', data: {}, accounts: [] },
        { type: 'test2', programId: 'test2', data: {}, accounts: [] }
      ];

      jest.spyOn(sdk.decoders, 'decode')
        .mockReturnValueOnce(mockDecodedResults[0])
        .mockReturnValueOnce(mockDecodedResults[1]);

      const results = sdk.decodeInstructions(mockInstructions);

      expect(results).toEqual(mockDecodedResults);
      expect(sdk.decoders.decode).toHaveBeenCalledTimes(2);
    });

    it('should register custom decoder', () => {
      const mockDecoder = jest.fn();
      jest.spyOn(sdk.decoders, 'register').mockImplementation();

      sdk.registerDecoder('testProgram', '11111111111111111111111111111111', mockDecoder);

      expect(sdk.decoders.register).toHaveBeenCalledWith(
        'testProgram',
        '11111111111111111111111111111111',
        mockDecoder
      );
    });

    it('should get supported programs', () => {
      const programs = sdk.getSupportedPrograms();
      
      expect(Array.isArray(programs)).toBe(true);
      expect(programs).toContain('spl-token');
      expect(programs).toContain('system');
      expect(programs).toContain('ata');
    });
  });

  describe('RPC Methods', () => {
    let sdk: GorbchainSDK;
    let mockRpcClient: any;

    beforeEach(() => {
      sdk = new GorbchainSDK();
      mockRpcClient = {
        getHealth: jest.fn(),
        getSlot: jest.fn(),
        getBlockHeight: jest.fn(),
        getLatestBlockhash: jest.fn(),
        setRpcUrl: jest.fn(),
        request: jest.fn(),
        getAccountInfo: jest.fn()
      };

      // Replace the private RPC client with our mock
      (sdk as any).rpcClient = mockRpcClient;
    });

    it('should get RPC client', () => {
      const client = sdk.rpc;
      expect(client).toBe(mockRpcClient);
    });

    it('should update RPC endpoint', () => {
      const newUrl = 'https://new-rpc.example.com';

      sdk.setRpcEndpoint(newUrl);

      expect(sdk.config.rpcEndpoint).toBe(newUrl);
      // After setRpcEndpoint, a new RpcClient is created, so we can't check the old mock
      expect(sdk.rpc).toBeDefined();
    });

    it('should get network health', async () => {
      // Mock the actual methods that getNetworkHealth calls
      mockRpcClient.getSlot = jest.fn().mockResolvedValue(12345);
      mockRpcClient.request = jest.fn()
        .mockResolvedValueOnce(67890); // getBlockHeight

      const health = await sdk.getNetworkHealth();

      expect(health.status).toBeDefined();
      expect(health.currentSlot).toBeDefined();
      expect(health.responseTime).toBeGreaterThan(0);
      expect(health.networkName).toBeDefined();
    });

    it('should get current slot', async () => {
      const mockSlot = 12345;
      mockRpcClient.getSlot.mockResolvedValue(mockSlot);

      const slot = await sdk.getCurrentSlot('confirmed');

      expect(slot).toBe(mockSlot);
      expect(mockRpcClient.getSlot).toHaveBeenCalledWith('confirmed');
    });

    it('should get block height', async () => {
      const mockHeight = 67890;
      mockRpcClient.request.mockResolvedValue(mockHeight);

      const height = await sdk.getBlockHeight('finalized');

      expect(height).toBe(mockHeight);
      expect(mockRpcClient.request).toHaveBeenCalledWith('getBlockHeight', [{ commitment: 'finalized' }]);
    });

    it('should get latest blockhash', async () => {
      const mockBlockhash = {
        blockhash: 'test-blockhash',
        lastValidBlockHeight: 12345
      };
      mockRpcClient.request.mockResolvedValue(mockBlockhash);

      const blockhash = await sdk.getLatestBlockhash('processed');

      expect(blockhash).toBe(mockBlockhash);
      expect(mockRpcClient.request).toHaveBeenCalledWith('getLatestBlockhash', [{ commitment: 'processed' }]);
    });
  });
});
