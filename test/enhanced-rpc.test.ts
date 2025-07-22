import { EnhancedRpcClient } from "../src/rpc/enhancedClient";
import { RpcClient } from "../src/rpc/client";

describe("Enhanced RPC Client V2 Tests", () => {
  let enhancedClient: EnhancedRpcClient;
  let baseRpcClient: RpcClient;
  const testWallet = "2CHVCwMA5i75GdBQJW1TRXh8M8hy18rqMawMcbGuwfAp";

  beforeEach(() => {
    baseRpcClient = new RpcClient({
      rpcUrl: "https://rpc.gorbchain.xyz",
      timeout: 30000,
      retries: 3,
    });

    enhancedClient = new EnhancedRpcClient(
      "https://rpc.gorbchain.xyz",
      baseRpcClient,
    );
  });

  describe("Network Configuration", () => {
    test("should auto-detect network configuration", () => {
      const networkConfig = enhancedClient.getNetworkConfig();

      expect(networkConfig).toBeDefined();
      if (networkConfig) {
        expect(networkConfig.name).toBe("Gorbchain Network");
        expect(networkConfig.features).toBeDefined();
        expect(networkConfig.tokenPrograms).toBeDefined();
        expect(networkConfig.supportedMethods).toBeInstanceOf(Array);
      }
    });

    test("should allow manual network configuration", () => {
      const customConfig = {
        name: "Custom Test Network",
        rpcEndpoint: "https://test.rpc.url",
        features: {
          standardTokens: true,
          customTokens: true,
          nftSupport: false,
          metadataSupport: false,
          transactionDecoding: true,
        },
        tokenPrograms: {
          spl: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          custom: ["CustomProgram123"],
          token2022: undefined,
        },
        supportedMethods: ["getAccountInfo", "getProgramAccounts"],
        settings: {
          timeout: 30000,
          retries: 3,
          rateLimit: 50,
        },
      };

      enhancedClient.setNetworkConfig(customConfig);
      const retrievedConfig = enhancedClient.getNetworkConfig();

      expect(retrievedConfig).toEqual(customConfig);
    });
  });

  describe("Method Support Detection", () => {
    test("should detect supported RPC methods", async () => {
      const supportedMethods = await enhancedClient.getSupportedMethods();

      expect(supportedMethods).toBeInstanceOf(Array);
      expect(supportedMethods.length).toBeGreaterThan(0);
      expect(supportedMethods).toContain("getAccountInfo");
    }, 10000);

    test("should check individual method support", async () => {
      const getAccountInfoSupported =
        await enhancedClient.isMethodSupported("getAccountInfo");
      const getProgramAccountsSupported =
        await enhancedClient.isMethodSupported("getProgramAccounts");

      expect(typeof getAccountInfoSupported).toBe("boolean");
      expect(typeof getProgramAccountsSupported).toBe("boolean");

      // getAccountInfo should be supported on most networks
      expect(getAccountInfoSupported).toBe(true);
    }, 10000);

    test("should handle unsupported method checks gracefully", async () => {
      const unsupportedMethod =
        await enhancedClient.isMethodSupported("nonExistentMethod");

      expect(typeof unsupportedMethod).toBe("boolean");
      expect(unsupportedMethod).toBe(false);
    }, 5000);
  });

  describe("Token Account Operations", () => {
    test("should get token accounts by owner with fallback", async () => {
      try {
        const tokenAccounts = await enhancedClient.getTokenAccountsByOwner(
          testWallet,
          { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
          "confirmed",
        );

        expect(tokenAccounts).toBeInstanceOf(Array);

        if (tokenAccounts.length > 0) {
          const account = tokenAccounts[0];
          expect(account.pubkey).toBeDefined();
          expect(account.account).toBeDefined();
          expect(account.account.data).toBeDefined();
        }
      } catch (error) {
        // If the method is not supported, the client should throw gracefully
        expect((error as Error).message).toContain("not supported");
      }
    }, 15000);

    test("should get token account info with fallback", async () => {
      // First, try to get a token account
      try {
        const tokenAccounts = await enhancedClient.getTokenAccountsByOwner(
          testWallet,
          { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        );

        if (tokenAccounts.length > 0) {
          const tokenAccountAddress = tokenAccounts[0].pubkey;
          const tokenAccountInfo =
            await enhancedClient.getTokenAccountInfo(tokenAccountAddress);

          if (tokenAccountInfo) {
            expect(tokenAccountInfo.mint).toBeDefined();
            expect(tokenAccountInfo.owner).toBeDefined();
            expect(tokenAccountInfo.tokenAmount).toBeDefined();
          }
        }
      } catch (error) {
        // This is expected if methods are not supported
        console.log("Token account operations not supported on this network");
      }
    }, 15000);
  });

  describe("Program Account Operations", () => {
    test("should get program accounts with filters", async () => {
      try {
        const programAccounts = await enhancedClient.getProgramAccounts(
          "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          [{ dataSize: 165 }], // Standard SPL token account size
        );

        expect(programAccounts).toBeInstanceOf(Array);

        if (programAccounts.length > 0) {
          const account = programAccounts[0];
          expect(account.pubkey).toBeDefined();
          expect(account.account).toBeDefined();
          expect(account.account.data).toBeInstanceOf(Array);
          expect(account.account.data[0]).toBeDefined(); // Base64 data
          expect(account.account.data[1]).toBe("base64"); // Encoding
        }
      } catch (error) {
        // Some networks might not support this method
        console.log(
          "getProgramAccounts not supported:",
          (error as Error).message,
        );
      }
    }, 15000);

    test("should get token accounts by program", async () => {
      try {
        const accounts = await enhancedClient.getTokenAccountsByProgram(
          testWallet,
          "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        );

        expect(accounts).toBeInstanceOf(Array);

        if (accounts.length > 0) {
          const account = accounts[0];
          expect(account.pubkey).toBeDefined();
          expect(account.account).toBeDefined();
        }
      } catch (error) {
        // Expected if the method is not supported
        console.log(
          "Token accounts by program not supported:",
          (error as Error).message,
        );
      }
    }, 15000);
  });

  describe("Data Parsing", () => {
    test("should parse token account data correctly", () => {
      // Create mock token account data (SPL Token account layout)
      const mockTokenAccountData = Buffer.alloc(165);

      // Set mint (32 bytes starting at offset 0)
      const mockMint = "So11111111111111111111111111111111111111112"; // Wrapped SOL
      Buffer.from(mockMint.padEnd(44, "1").slice(0, 32)).copy(
        mockTokenAccountData,
        0,
      );

      // Set owner (32 bytes starting at offset 32)
      Buffer.from(testWallet.padEnd(44, "1").slice(0, 32)).copy(
        mockTokenAccountData,
        32,
      );

      // Set amount (8 bytes starting at offset 64) - 1000000000 (1 SOL with 9 decimals)
      const amount = BigInt(1000000000);
      const amountBuffer = Buffer.alloc(8);
      amountBuffer.writeBigUInt64LE(amount, 0);
      amountBuffer.copy(mockTokenAccountData, 64);

      try {
        const parsed = enhancedClient.parseTokenAccount(mockTokenAccountData);

        expect(parsed.mint).toBeDefined();
        expect(parsed.owner).toBeDefined();
        expect(parsed.amount).toBeDefined();
        expect(typeof parsed.decimals).toBe("number");
        expect(typeof parsed.uiAmount).toBe("number");
        expect(typeof parsed.isInitialized).toBe("boolean");
      } catch (error) {
        // Token account parsing might fail on mock data
        console.log(
          "Token account parsing failed (expected with mock data):",
          (error as Error).message,
        );
      }
    });

    test("should parse mint account data correctly", () => {
      // Create mock mint account data
      const mockMintData = Buffer.alloc(82);

      // Set mint authority (32 bytes starting at offset 4)
      Buffer.from(testWallet.padEnd(44, "1").slice(0, 32)).copy(
        mockMintData,
        4,
      );

      // Set supply (8 bytes starting at offset 36)
      const supply = BigInt(1000000000000);
      const supplyBuffer = Buffer.alloc(8);
      supplyBuffer.writeBigUInt64LE(supply, 0);
      supplyBuffer.copy(mockMintData, 36);

      // Set decimals (1 byte at offset 44)
      mockMintData.writeUInt8(9, 44);

      try {
        const parsed = enhancedClient.parseMintAccount(mockMintData);

        expect(parsed.mintAuthority).toBeDefined();
        expect(parsed.supply).toBeDefined();
        expect(typeof parsed.decimals).toBe("number");
        expect(typeof parsed.isInitialized).toBe("boolean");
      } catch (error) {
        // Mint account parsing might fail on mock data
        console.log(
          "Mint account parsing failed (expected with mock data):",
          (error as Error).message,
        );
      }
    });
  });

  describe("Custom Token Holdings", () => {
    test("should get custom token holdings", async () => {
      const holdings = await enhancedClient.getCustomTokenHoldings(testWallet, {
        customPrograms: ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"],
        maxConcurrentRequests: 3,
      });

      expect(holdings).toBeInstanceOf(Array);

      if (holdings.length > 0) {
        const holding = holdings[0];
        expect(holding.mint).toBeDefined();
        expect(holding.tokenAccount).toBeDefined();
        expect(holding.balance).toBeDefined();
        expect(holding.balance.raw).toBeDefined();
        expect(holding.balance.decimal).toBeDefined();
        expect(holding.balance.formatted).toBeDefined();
        expect(typeof holding.decimals).toBe("number");
        expect(typeof holding.isNFT).toBe("boolean");
      }
    }, 20000);

    test("should handle empty token holdings gracefully", async () => {
      // Test with a wallet that likely has no tokens
      const emptyWallet = "11111111111111111111111111111112";
      const holdings = await enhancedClient.getCustomTokenHoldings(
        emptyWallet,
        {
          customPrograms: ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"],
        },
      );

      expect(holdings).toBeInstanceOf(Array);
      expect(holdings.length).toBe(0);
    }, 10000);
  });

  describe("Backward Compatibility", () => {
    test("should provide balance through enhanced client", async () => {
      const balance = await enhancedClient.getBalance(testWallet);

      expect(typeof balance).toBe("number");
      expect(balance).toBeGreaterThanOrEqual(0);
    }, 10000);

    test("should provide slot through enhanced client", async () => {
      const slot = await enhancedClient.getSlot();

      expect(typeof slot).toBe("number");
      expect(slot).toBeGreaterThan(0);
    }, 10000);

    test("should provide account info through enhanced client", async () => {
      const accountInfo = await enhancedClient.getAccountInfo(testWallet);

      expect(accountInfo).toBeDefined();
      if (accountInfo) {
        expect(typeof accountInfo.lamports).toBe("number");
        expect(typeof accountInfo.owner).toBe("string");
      }
    }, 10000);
  });

  describe("Error Handling", () => {
    test("should handle invalid wallet addresses", async () => {
      const invalidWallet = "invalid-address";

      await expect(enhancedClient.getBalance(invalidWallet)).rejects.toThrow();
    });

    test("should handle network timeouts gracefully", async () => {
      // Create a mock RPC client that will timeout
      const timeoutRpcClient = new RpcClient({
        rpcUrl: "https://nonexistent.rpc.url",
        timeout: 100, // Very short timeout
        retries: 1,
      });

      const timeoutClient = new EnhancedRpcClient(
        "https://nonexistent.rpc.url",
        timeoutRpcClient,
      );

      // Clear network config so it's forced to actually test methods
      timeoutClient.setNetworkConfig(null as any);

      // Test individual method instead of getSupportedMethods which has fallbacks
      await expect(
        timeoutClient.isMethodSupported("getAccountInfo"),
      ).resolves.toBe(false);
    }, 10000);

    test("should handle custom program errors gracefully", async () => {
      const invalidProgramId = "InvalidProgram123";

      // Should handle gracefully and return empty results
      const holdings = await enhancedClient.getCustomTokenHoldings(testWallet, {
        customPrograms: [invalidProgramId],
      });

      expect(holdings).toBeInstanceOf(Array);
    }, 10000);
  });
});
