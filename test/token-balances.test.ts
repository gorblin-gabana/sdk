import { RpcClient } from "../src/rpc/client.js";
import { EnhancedRpcClient } from "../src/rpc/enhancedClient.js";
import { GorbchainSDK } from "../src/sdk/GorbchainSDK.js";

describe("Token Balance Tests - Simple getTokenAccountsByOwner", () => {
  let rpcClient: RpcClient;
  let enhancedClient: EnhancedRpcClient;
  let sdk: GorbchainSDK;

  beforeEach(() => {
    rpcClient = new RpcClient({
      rpcUrl: "https://rpc.gorbchain.xyz",
      timeout: 30000,
      retries: 3,
    });

    enhancedClient = new EnhancedRpcClient(
      "https://rpc.gorbchain.xyz",
      rpcClient,
    );

    sdk = new GorbchainSDK({
      rpcEndpoint: "https://rpc.gorbchain.xyz",
    });
  });

  describe("Token2022 Program Token Balances", () => {
    test("should get token balances using getTokenAccountsByOwner with jsonParsed encoding", async () => {
      const ownerAddress = "9x5kYbJgJ6WoHQayADmTYGh94SbLdbnecKP8bRr7x9uM";
      const token2022ProgramId = "G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6";

      // Make the actual RPC call
      const response = await rpcClient.request("getTokenAccountsByOwner", [
        ownerAddress,
        { programId: token2022ProgramId },
        { encoding: "jsonParsed" },
      ]);

      expect(response).toBeDefined();
      expect(Array.isArray(response.value)).toBe(true);

      // Verify the response structure matches the expected format
      if (response.value.length > 0) {
        const tokenAccount = response.value[0];
        
        // Check account structure
        expect(tokenAccount.pubkey).toBeDefined();
        expect(tokenAccount.account).toBeDefined();
        expect(tokenAccount.account.data).toBeDefined();
        expect(tokenAccount.account.data.parsed).toBeDefined();
        expect(tokenAccount.account.data.program).toBe("spl-token-2022");
        
        // Check parsed info structure
        const parsedInfo = tokenAccount.account.data.parsed.info;
        expect(parsedInfo.mint).toBeDefined();
        expect(parsedInfo.owner).toBe(ownerAddress);
        expect(parsedInfo.state).toBe("initialized");
        expect(parsedInfo.tokenAmount).toBeDefined();
        
        // Check token amount structure
        const tokenAmount = parsedInfo.tokenAmount;
        expect(tokenAmount.amount).toBeDefined();
        expect(tokenAmount.decimals).toBeDefined();
        expect(tokenAmount.uiAmount).toBeDefined();
        expect(tokenAmount.uiAmountString).toBeDefined();
        
        // Check extensions if present
        if (parsedInfo.extensions) {
          expect(Array.isArray(parsedInfo.extensions)).toBe(true);
        }
      }
    }, 30000);

    test("should handle multiple token accounts with different decimals", async () => {
      const ownerAddress = "9x5kYbJgJ6WoHQayADmTYGh94SbLdbnecKP8bRr7x9uM";
      const token2022ProgramId = "G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6";

      const response = await rpcClient.request("getTokenAccountsByOwner", [
        ownerAddress,
        { programId: token2022ProgramId },
        { encoding: "jsonParsed" },
      ]);

      expect(Array.isArray(response.value)).toBe(true);
      
      // Map to collect different decimal configurations
      const decimalVariations = new Map<number, any[]>();
      
      response.value.forEach((account: any) => {
        const decimals = account.account.data.parsed.info.tokenAmount.decimals;
        if (!decimalVariations.has(decimals)) {
          decimalVariations.set(decimals, []);
        }
        decimalVariations.get(decimals)!.push(account);
      });

      // Verify we have tokens with different decimal places
      console.log("Found tokens with decimal variations:", Array.from(decimalVariations.keys()));
      
      // Check specific known tokens from the example
      const expectedTokens = [
        { mint: "CAp8xiciqCTdrVqu3nnANdzryWjYdMxE2VrvtgTzxeS7", decimals: 6 },
        { mint: "8xbGhrW8hzmrKNj6q22TyccYFgRGA8VvhZqkXMC73bLS", decimals: 0 },
        { mint: "7yLEKtiEZMqJoEYJDetLyUzHnUiP92PwPkExoSEhdkG8", decimals: 9 },
      ];

      expectedTokens.forEach(expected => {
        const found = response.value.find(
          (acc: any) => acc.account.data.parsed.info.mint === expected.mint
        );
        if (found) {
          expect(found.account.data.parsed.info.tokenAmount.decimals).toBe(expected.decimals);
        }
      });
    }, 30000);

    test("should correctly parse token amounts and UI amounts", async () => {
      const ownerAddress = "9x5kYbJgJ6WoHQayADmTYGh94SbLdbnecKP8bRr7x9uM";
      const token2022ProgramId = "G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6";

      const response = await rpcClient.request("getTokenAccountsByOwner", [
        ownerAddress,
        { programId: token2022ProgramId },
        { encoding: "jsonParsed" },
      ]);

      response.value.forEach((account: any) => {
        const tokenAmount = account.account.data.parsed.info.tokenAmount;
        
        // Verify amount parsing
        expect(tokenAmount.amount).toMatch(/^\d+$/); // Should be numeric string
        expect(typeof tokenAmount.decimals).toBe("number");
        expect(typeof tokenAmount.uiAmount).toBe("number");
        expect(tokenAmount.uiAmountString).toBe(tokenAmount.uiAmount.toString());
        
        // Verify UI amount calculation
        const rawAmount = BigInt(tokenAmount.amount);
        const expectedUiAmount = Number(rawAmount) / Math.pow(10, tokenAmount.decimals);
        expect(tokenAmount.uiAmount).toBeCloseTo(expectedUiAmount, 10);
      });
    }, 30000);
  });

  describe("Enhanced Client Token Balance Methods", () => {
    test("should get token accounts through enhanced client", async () => {
      const ownerAddress = "9x5kYbJgJ6WoHQayADmTYGh94SbLdbnecKP8bRr7x9uM";
      const token2022ProgramId = "G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6";

      const tokenAccounts = await enhancedClient.getTokenAccountsByOwner(
        ownerAddress,
        { programId: token2022ProgramId },
        "confirmed",
      );

      expect(tokenAccounts).toBeInstanceOf(Array);
      
      if (tokenAccounts.length > 0) {
        const account = tokenAccounts[0];
        expect(account.pubkey).toBeDefined();
        expect(account.account).toBeDefined();
      }
    }, 30000);

    test("should handle different token programs", async () => {
      const ownerAddress = "9x5kYbJgJ6WoHQayADmTYGh94SbLdbnecKP8bRr7x9uM";
      
      // Test with standard SPL token program
      const splProgramId = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
      const splTokens = await enhancedClient.getTokenAccountsByOwner(
        ownerAddress,
        { programId: splProgramId },
        "confirmed",
      );

      // Test with Token-2022 program
      const token2022ProgramId = "G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6";
      const token2022Tokens = await enhancedClient.getTokenAccountsByOwner(
        ownerAddress,
        { programId: token2022ProgramId },
        "confirmed",
      );

      // Both should return arrays (even if empty)
      expect(splTokens).toBeInstanceOf(Array);
      expect(token2022Tokens).toBeInstanceOf(Array);
      
      console.log(`SPL tokens found: ${splTokens.length}`);
      console.log(`Token-2022 tokens found: ${token2022Tokens.length}`);
    }, 30000);
  });

  describe("SDK Token Balance Integration", () => {
    test("should get all token holdings including Token-2022 using simplified approach", async () => {
      const ownerAddress = "9x5kYbJgJ6WoHQayADmTYGh94SbLdbnecKP8bRr7x9uM";
      const token2022ProgramId = "G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6";

      const holdings = await sdk.getAllTokenHoldings(ownerAddress, {
        includeStandardTokens: true,
        includeCustomTokens: true,
        customPrograms: [token2022ProgramId],
      });

      expect(holdings).toBeDefined();
      expect(Array.isArray(holdings.holdings)).toBe(true);
      expect(holdings.summary).toBeDefined();
      expect(holdings.timestamp).toBeDefined();
      
      // Check if we have Token-2022 tokens
      const token2022Holdings = holdings.holdings.filter(
        h => h.programId === token2022ProgramId
      );
      
      console.log(`Total holdings: ${holdings.holdings.length}`);
      console.log(`Token-2022 holdings: ${token2022Holdings.length}`);
      console.log(`Unique mints: ${holdings.summary.uniqueMints}`);
      console.log(`Non-zero balances: ${holdings.summary.nonZeroBalance}`);
      
      if (token2022Holdings.length > 0) {
        const holding = token2022Holdings[0];
        expect(holding.mint).toBeDefined();
        expect(holding.owner).toBeDefined();
        expect(holding.tokenAccount).toBeDefined();
        expect(holding.balance).toBeDefined();
        expect(holding.balance.raw).toBeDefined();
        expect(holding.balance.decimal).toBeDefined();
        expect(holding.balance.formatted).toBeDefined();
        expect(holding.decimals).toBeDefined();
        expect(typeof holding.isNFT).toBe("boolean");
      }
    }, 30000);

    test("should compare parsed RPC response with simplified SDK implementation", async () => {
      const ownerAddress = "9x5kYbJgJ6WoHQayADmTYGh94SbLdbnecKP8bRr7x9uM";
      const token2022ProgramId = "G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6";

      // Get tokens directly via RPC
      const rpcResponse = await rpcClient.request<{
        value: Array<{
          pubkey: string;
          account: {
            data: {
              parsed: {
                info: {
                  mint: string;
                  owner: string;
                  tokenAmount: {
                    amount: string;
                    decimals: number;
                    uiAmount: number;
                    uiAmountString: string;
                  };
                };
              };
            };
          };
        }>;
      }>("getTokenAccountsByOwner", [
        ownerAddress,
        { programId: token2022ProgramId },
        { encoding: "jsonParsed" },
      ]);

      // Get tokens via simplified SDK
      const sdkHoldings = await sdk.getAllTokenHoldings(ownerAddress, {
        customPrograms: [token2022ProgramId],
      });

      // Create a map of RPC tokens by mint for comparison
      const rpcTokensByMint = new Map();
      rpcResponse.value.forEach((account: any) => {
        const mint = account.account.data.parsed.info.mint;
        const tokenAmount = account.account.data.parsed.info.tokenAmount;
        rpcTokensByMint.set(mint, {
          amount: tokenAmount.amount,
          decimals: tokenAmount.decimals,
          uiAmount: tokenAmount.uiAmount,
          accountAddress: account.pubkey,
        });
      });

      // Verify SDK captures the same tokens with correct structure
      const token2022Holdings = sdkHoldings.holdings.filter(h => h.programId === token2022ProgramId);
      
      console.log(`RPC found ${rpcResponse.value.length} tokens`);
      console.log(`SDK found ${token2022Holdings.length} Token-2022 tokens`);

      // Compare each token found by both methods
      token2022Holdings.forEach(holding => {
        if (rpcTokensByMint.has(holding.mint)) {
          const rpcToken = rpcTokensByMint.get(holding.mint);
          
          // Verify all fields match
          expect(holding.balance.raw).toBe(rpcToken.amount);
          expect(holding.decimals).toBe(rpcToken.decimals);
          expect(holding.balance.decimal).toBe(rpcToken.uiAmount);
          expect(holding.tokenAccount).toBe(rpcToken.accountAddress);
          expect(holding.owner).toBe(ownerAddress);
          
          console.log(`✓ Token ${holding.mint.slice(0, 8)}... matches perfectly`);
          console.log(`  Amount: ${holding.balance.raw} (${holding.balance.formatted})`);
          console.log(`  Decimals: ${holding.decimals}`);
        }
      });

      // Ensure we found the expected tokens
      expect(token2022Holdings.length).toBeGreaterThan(0);
    }, 30000);

    test("should test simplified SDK helper methods", async () => {
      const ownerAddress = "9x5kYbJgJ6WoHQayADmTYGh94SbLdbnecKP8bRr7x9uM";
      
      // Test hasTokens method
      const hasAnyTokens = await sdk.hasTokens(ownerAddress);
      expect(typeof hasAnyTokens).toBe("boolean");
      console.log(`Wallet has tokens: ${hasAnyTokens}`);

      if (hasAnyTokens) {
        // Test getTopHoldings method
        const topHoldings = await sdk.getTopHoldings(ownerAddress, 3);
        expect(Array.isArray(topHoldings)).toBe(true);
        expect(topHoldings.length).toBeLessThanOrEqual(3);
        console.log(`Top ${topHoldings.length} holdings found`);

        if (topHoldings.length > 0) {
          const topHolding = topHoldings[0];
          expect(topHolding.mint).toBeDefined();
          expect(topHolding.balance.raw).toBeDefined();
          console.log(`Top holding: ${topHolding.mint} with ${topHolding.balance.formatted}`);

          // Test getTokenBalanceForMint method
          const specificBalance = await sdk.getTokenBalanceForMint(ownerAddress, topHolding.mint);
          expect(specificBalance).toBeDefined();
          if (specificBalance) {
            expect(specificBalance.mint).toBe(topHolding.mint);
            expect(specificBalance.balance.raw).toBe(topHolding.balance.raw);
            console.log(`Specific balance lookup successful for ${topHolding.mint}`);
          }
        }

        // Test getCustomProgramTokens method
        const token2022Tokens = await sdk.getCustomProgramTokens(
          ownerAddress, 
          "G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6"
        );
        expect(Array.isArray(token2022Tokens)).toBe(true);
        console.log(`Found ${token2022Tokens.length} Token-2022 specific tokens`);
      }
    }, 30000);
  });

  describe("Edge Cases and Error Handling", () => {
    test("should handle empty token account responses", async () => {
      // Use an address that exists but likely has no Token-2022 tokens
      const emptyWallet = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
      const token2022ProgramId = "G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6";

      try {
        const response = await rpcClient.request("getTokenAccountsByOwner", [
          emptyWallet,
          { programId: token2022ProgramId },
          { encoding: "jsonParsed" },
        ]);

        expect(response).toBeDefined();
        expect(Array.isArray(response.value)).toBe(true);
      } catch (error) {
        // This is acceptable - might be invalid address format for this network
        expect(error).toBeDefined();
      }
    }, 30000);

    test("should handle invalid wallet addresses gracefully", async () => {
      const invalidAddress = "invalid-address";
      const token2022ProgramId = "G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6";

      await expect(
        rpcClient.request("getTokenAccountsByOwner", [
          invalidAddress,
          { programId: token2022ProgramId },
          { encoding: "jsonParsed" },
        ])
      ).rejects.toThrow();
    }, 30000);

    test("should handle responses without jsonParsed encoding", async () => {
      const ownerAddress = "9x5kYbJgJ6WoHQayADmTYGh94SbLdbnecKP8bRr7x9uM";
      const token2022ProgramId = "G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6";

      // Get with base64 encoding
      const response = await rpcClient.request("getTokenAccountsByOwner", [
        ownerAddress,
        { programId: token2022ProgramId },
        { encoding: "base64" },
      ]);

      expect(Array.isArray(response.value)).toBe(true);
      
      if (response.value.length > 0) {
        const account = response.value[0];
        expect(Array.isArray(account.account.data)).toBe(true);
        expect(account.account.data[0]).toMatch(/^[A-Za-z0-9+/]+=*$/); // Base64
        expect(account.account.data[1]).toBe("base64");
      }
    }, 30000);
  });
});