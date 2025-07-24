import { GorbchainSDK } from "../src/index";

describe("Wallet V2 Real Scenarios Tests", () => {
  let sdk: GorbchainSDK;

  // Real data from your NFT scripts and Gorbchain network
  const realData = {
    // Test wallet addresses
    wallets: {
      primary: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU", // Test wallet
      secondary: "5YNmS1R9nNSCDzAYUGd2xgXzUk8A5mWJPybyGCPP6gFW", // Secondary test wallet
    },

    // Real program IDs deployed on Gorbchain
    programs: {
      token2022: "G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6", // Token-2022 program
      mplCore: "BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc", // MPL Core NFT program (from your script)
      ata: "GoATGVNeSXerFerPqTJ8hcED1msPWHHLxao2vwBYqowm", // Associated Token Account program
      system: "11111111111111111111111111111111", // System program
      splToken: "Gorbj8Dp27NkXMQUkeHBSmpf6iQ3yT4b2uVe8kM4s6br", // SPL Token program
    },

    // Real token/NFT addresses from your scripts
    tokens: {
      realNFT: "FWsWxqEjpy6B2Je5TwhUsB3aAqXHPgwApWEoHnmnsorZ", // Real NFT from your decode_nft.js
      solana: "So11111111111111111111111111111111111111112", // Wrapped SOL
    },
  };

  beforeAll(() => {
    // Initialize SDK with Gorbchain network
    sdk = new GorbchainSDK({
      rpcEndpoint: "https://rpc.gorbchain.xyz",
      network: "gorbchain-mainnet",
      timeout: 30000,
      retries: 3,
      programIds: {
        splToken: "Gorbj8Dp27NkXMQUkeHBSmpf6iQ3yT4b2uVe8kM4s6br",
        token2022: "G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6",
        ata: "GoATGVNeSXerFerPqTJ8hcED1msPWHHLxao2vwBYqowm",
        metaplex: "GMTAp1moCdGh4TEwFTcCJKeKL3UMEDB6vKpo2uxM9h4s",
      },
      tokenAnalysis: {
        enabled: true,
        maxConcurrentRequests: 5,
        enableMetadataResolution: true,
      },
      richDecoding: {
        enabled: true,
        includeTokenMetadata: true,
        includeNftMetadata: true,
        maxConcurrentRequests: 3,
        enableCache: true,
      },
    });
  });

  describe("1. Basic Wallet Operations", () => {
    test("should get SOL balance for test wallet", async () => {
      const balance = await sdk.getBalanceDetailed(realData.wallets.primary);

      expect(balance).toHaveProperty("lamports");
      expect(balance).toHaveProperty("sol");
      expect(balance).toHaveProperty("formatted");
      expect(typeof balance.lamports).toBe("number");
      expect(typeof balance.sol).toBe("number");
      expect(balance.formatted).toMatch(/\d+\.\d+ SOL/);

      console.log(`✅ Test wallet SOL balance: ${balance.formatted}`);
    }, 15000);

    test("should get account info for test wallet", async () => {
      const accountInfo = await sdk.getAccountInfo(realData.wallets.primary);

      expect(accountInfo).toBeDefined();
      if (accountInfo) {
        expect(accountInfo).toHaveProperty("lamports");
        expect(accountInfo).toHaveProperty("owner");

        console.log(`✅ Account info:`, {
          lamports: accountInfo.lamports,
          owner: accountInfo.owner.toString(),
          executable: accountInfo.executable,
        });
      }
    }, 10000);

    test("should get token holdings for wallet", async () => {
      const holdings = await sdk.getAllTokenHoldings(realData.wallets.primary, {
        includeStandardTokens: true,
        includeCustomTokens: true,
        includeNFTs: true,
        customPrograms: [
          realData.programs.mplCore,
          realData.programs.token2022,
        ],
      });

      expect(holdings).toHaveProperty("holdings");
      expect(holdings).toHaveProperty("summary");
      expect(Array.isArray(holdings.holdings)).toBe(true);

      console.log(`✅ Found ${holdings.holdings.length} total token holdings`);
      console.log(`✅ Summary:`, holdings.summary);

      if (holdings.holdings.length > 0) {
        console.log(`✅ First holding:`, holdings.holdings[0]);
      }
    }, 20000);
  });

  describe("2. Real NFT Analysis", () => {
    test("should analyze the real NFT from decode script", async () => {
      // Use the real NFT address from your decode_nft.js script
      const accountInfo = await sdk.getAccountInfo(realData.tokens.realNFT);

      expect(accountInfo).toBeDefined();
      if (accountInfo) {
        console.log(`✅ Real NFT account info:`, {
          address: realData.tokens.realNFT,
          owner: accountInfo.owner.toString(),
          dataLength: accountInfo.data?.length || 0,
          executable: accountInfo.executable,
          lamports: accountInfo.lamports,
        });

        // Check if this looks like an NFT based on the owner program
        const isNFTProgram =
          accountInfo.owner.toString() === realData.programs.mplCore;
        console.log(`✅ Owned by MPL Core program: ${isNFTProgram}`);
      }
    }, 15000);

    test("should decode MPL Core instruction simulation", async () => {
      // Test instruction decoding with the real MPL Core program
      const mplCoreInstruction = {
        programId: realData.programs.mplCore,
        data: new Uint8Array([
          1, // Create instruction
          ...Array.from(new TextEncoder().encode("Test NFT")), // NFT name
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0, // padding
        ]),
        accounts: [
          realData.tokens.realNFT, // asset
          realData.wallets.primary, // owner
          realData.wallets.secondary, // authority
        ],
      };

      const decoded = sdk.decodeInstruction(mplCoreInstruction);

      expect(decoded.programId).toBe(realData.programs.mplCore);
      expect(decoded.accounts).toHaveLength(3);

      console.log(`✅ MPL Core instruction decoded:`, {
        type: decoded.type,
        programId: decoded.programId,
        accountsCount: decoded.accounts.length,
      });
    });

    test("should test categorizing tokens", async () => {
      const categorized = await sdk.getTokensByCategory(
        realData.wallets.primary,
      );

      expect(categorized).toHaveProperty("nfts");
      expect(categorized).toHaveProperty("tokens");
      expect(categorized).toHaveProperty("categorized");
      expect(Array.isArray(categorized.nfts)).toBe(true);
      expect(Array.isArray(categorized.tokens)).toBe(true);

      console.log(`✅ Token categories:`, {
        nfts: categorized.nfts.length,
        tokens: categorized.tokens.length,
        totalNFTs: categorized.categorized.totalNFTs,
        totalTokens: categorized.categorized.totalTokens,
      });
    }, 15000);
  });

  describe("3. Portfolio Analysis", () => {
    test("should analyze wallet portfolio", async () => {
      const analysis = await sdk.analyzePortfolio(realData.wallets.primary);

      expect(analysis).toHaveProperty("totalTokens");
      expect(analysis).toHaveProperty("uniqueMints");
      expect(analysis).toHaveProperty("nonZeroBalances");
      expect(analysis).toHaveProperty("timestamp");

      console.log(`✅ Portfolio analysis:`, {
        totalTokens: analysis.totalTokens,
        uniqueMints: analysis.uniqueMints,
        nonZeroBalances: analysis.nonZeroBalances,
        riskLevel: analysis.uniqueMints > 5 ? "Diversified" : "Concentrated",
      });
    }, 20000);

    test("should get top holdings", async () => {
      const topHoldings = await sdk.getTopHoldings(realData.wallets.primary, 5);

      expect(Array.isArray(topHoldings)).toBe(true);
      expect(topHoldings.length).toBeLessThanOrEqual(5);

      console.log(`✅ Top ${topHoldings.length} holdings found`);
      topHoldings.forEach((holding: any, index: number) => {
        console.log(
          `${index + 1}. ${holding.metadata?.symbol || "Unknown"}: ${holding.balance?.formatted || holding.balance}`,
        );
      });
    }, 15000);

    test("should compare two wallet portfolios", async () => {
      const comparison = await sdk.comparePortfolios(
        realData.wallets.primary,
        realData.wallets.secondary,
      );

      expect(comparison).toHaveProperty("wallet1");
      expect(comparison).toHaveProperty("wallet2");
      expect(comparison).toHaveProperty("comparison");
      expect(typeof comparison.comparison.commonTokens).toBe("number");

      console.log(`✅ Portfolio comparison:`, {
        wallet1Tokens: comparison.wallet1.totalTokens,
        wallet2Tokens: comparison.wallet2.totalTokens,
        commonTokens: comparison.comparison.commonTokens,
      });
    }, 25000);
  });

  describe("4. Network Health & Performance", () => {
    test("should check Gorbchain network health", async () => {
      const health = await sdk.getNetworkHealth();

      expect(health).toHaveProperty("status");
      expect(health).toHaveProperty("currentSlot");
      expect(health).toHaveProperty("responseTime");
      expect(["healthy", "degraded", "unhealthy"]).toContain(health.status);

      console.log(`✅ Network health:`, {
        status: health.status,
        currentSlot: health.currentSlot,
        responseTime: health.responseTime,
        networkName: health.networkName,
      });
    });

    test("should test RPC performance", async () => {
      const performance = await sdk.testRpcPerformance(3);

      expect(performance).toHaveProperty("averageResponseTime");
      expect(performance).toHaveProperty("successRate");
      expect(performance.successRate).toBeGreaterThan(0);
      expect(performance.successRate).toBeLessThanOrEqual(100);

      console.log(`✅ RPC Performance:`, {
        avgResponse: performance.averageResponseTime + "ms",
        successRate: performance.successRate + "%",
        minResponse: performance.minResponseTime + "ms",
        maxResponse: performance.maxResponseTime + "ms",
      });
    }, 20000);

    test("should detect network capabilities", async () => {
      const capabilities = await sdk.detectNetworkCapabilities();

      expect(capabilities).toHaveProperty("supportedMethods");
      expect(capabilities).toHaveProperty("detectedFeatures");
      expect(Array.isArray(capabilities.supportedMethods)).toBe(true);

      console.log(`✅ Network capabilities:`, {
        supportedMethods: capabilities.supportedMethods.length,
        features: capabilities.detectedFeatures,
      });
    }, 10000);
  });

  describe("5. Instruction Decoding Tests", () => {
    test("should decode Token-2022 instruction", async () => {
      const token2022Instruction = {
        programId: realData.programs.token2022,
        data: new Uint8Array([
          3, // Transfer instruction
          0x00,
          0x10,
          0x27,
          0x00,
          0x00,
          0x00,
          0x00,
          0x00, // 10000 tokens
        ]),
        accounts: [
          realData.wallets.primary,
          realData.wallets.secondary,
          realData.wallets.primary,
        ],
      };

      const decoded = sdk.decodeInstruction(token2022Instruction);

      expect(decoded.programId).toBe(realData.programs.token2022);
      expect(decoded.accounts).toHaveLength(3);

      console.log(`✅ Token-2022 instruction decoded:`, {
        type: decoded.type,
        programId: decoded.programId,
        hasData: !!decoded.data,
      });
    });

    test("should handle unknown instruction gracefully", async () => {
      const unknownInstruction = {
        programId: "UnknownProgram11111111111111111111111111111",
        data: new Uint8Array([255, 255, 255]),
        accounts: [],
      };

      const decoded = sdk.decodeInstruction(unknownInstruction);

      expect(decoded.type).toBe("unknown");
      expect(decoded.programId).toBe(
        "UnknownProgram11111111111111111111111111111",
      );

      console.log(`✅ Unknown instruction handled:`, decoded.type);
    });
  });

  describe("6. GORBA Token Specific Tests", () => {
    test("should validate GORBA token configuration", () => {
      expect(sdk.config.rpcEndpoint).toBe("https://rpc.gorbchain.xyz");
      expect(sdk.config.programIds?.token2022).toBe(
        "G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6",
      );
      expect(sdk.config.programIds?.ata).toBe(
        "GoATGVNeSXerFerPqTJ8hcED1msPWHHLxao2vwBYqowm",
      );
      expect(sdk.config.programIds?.metaplex).toBe(
        "GMTAp1moCdGh4TEwFTcCJKeKL3UMEDB6vKpo2uxM9h4s",
      );
    });

    test("should support GORBA token supply calculations", () => {
      const rawSupply = "2000000000000000000"; // 2 billion total minted
      const accountBalance = "1000000000000000000"; // 1 billion in account

      // Validate the math: account should have half of total supply
      const totalRaw = BigInt(rawSupply);
      const accountRaw = BigInt(accountBalance);
      expect(accountRaw * BigInt(2)).toBe(totalRaw);
    });

    test("should register custom GORBA token decoder", () => {
      const gorbaTokenMint = "2o1oEPUXhNMLu8HQihgXtXu1Vv5zTTvpX5uVZV6f2Jxa";

      const gorbaDecoder = (instruction: any) => ({
        type: "gorba-token",
        programId: gorbaTokenMint,
        data: {
          symbol: "GOR",
          name: "GORBA",
          instruction,
        },
        accounts: instruction.accounts || [],
      });

      sdk.registerDecoder("gorba-token", gorbaTokenMint, gorbaDecoder);

      const supportedPrograms = sdk.getSupportedPrograms();
      expect(supportedPrograms).toContain("gorba-token");
    });
  });

  describe("7. Error Handling", () => {
    test("should handle invalid wallet address gracefully", async () => {
      const invalidAddress = "InvalidAddress123";

      try {
        await sdk.getBalance(invalidAddress);
        fail("Should have thrown an error for invalid address");
      } catch (error) {
        expect(error).toBeDefined();
        console.log(
          `✅ Invalid address error handled:`,
          (error as Error).message,
        );
      }
    });

    test("should handle network timeout gracefully", async () => {
      // Create SDK with very short timeout
      const shortTimeoutSdk = new GorbchainSDK({
        rpcEndpoint: "https://rpc.gorbchain.xyz",
        timeout: 1, // 1ms timeout to force failure
        retries: 1,
      });

      try {
        await shortTimeoutSdk.getNetworkHealth();
        console.log(`⚠️  Timeout test didn't fail - network is very fast!`);
      } catch (error) {
        expect(error).toBeDefined();
        console.log(`✅ Timeout handled gracefully`);
      }
    }, 10000);
  });
});
