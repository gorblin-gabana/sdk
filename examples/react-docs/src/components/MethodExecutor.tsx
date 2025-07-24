import { SDKMethod } from "../types/playground";

export class MethodExecutor {
  private sdk: any = null;

  constructor(sdk?: any) {
    this.sdk = sdk;
  }

  setSdk(sdk: any) {
    this.sdk = sdk;
  }

  async executeMethod(
    method: SDKMethod,
    params: { [key: string]: string },
  ): Promise<any> {
    if (!this.sdk) {
      throw new Error("SDK not initialized. Call setSdk() first.");
    }

    const startTime = Date.now();

    try {
      let result: any;

      switch (method.name) {
        case "getNetworkHealth":
          try {
            const health = await this.sdk.rpc.getHealth();
            result = {
              success: true,
              healthy: health === "ok",
              endpoint: this.sdk.config.rpcEndpoint,
              timestamp: new Date().toISOString(),
            };
          } catch (error) {
            result = {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
              timestamp: new Date().toISOString(),
            };
          }
          break;

        case "getAndDecodeTransaction":
          const signature =
            params.signature ||
            "5Nm3CvXWYjDaeVPTXifXHFzpovVZo6pLQdMfZeW5FoUK9z3vE4ABM";
          let options: any = {};

          if (params.options) {
            try {
              options = JSON.parse(params.options);
            } catch (e) {
              console.warn("Invalid JSON in options parameter, using default");
              options = { richDecoding: true, includeTokenMetadata: true };
            }
          }

          result = await this.sdk.getAndDecodeTransaction(signature, options);
          break;

        case "decodeInstruction":
          const data = params.data;
          if (!data) {
            throw new Error("Data parameter is required");
          }

          // For instruction decoding, we need a proper instruction object
          // Let's create a mock instruction for testing the decoder
          const mockInstruction = {
            programId: "G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6", // Token-2022
            data: this.base64ToUint8Array(data),
            accounts: ["mock1", "mock2", "mock3"],
          };

          result = this.sdk.decodeInstruction(mockInstruction);
          break;

        case "getRpcClient":
          result = {
            endpoint: this.sdk.rpc.getRpcUrl(),
            client: "GorbchainRpcClient",
            methods: [
              "getHealth",
              "getSlot",
              "getBlockHeight",
              "getAccountInfo",
              "getTransaction",
              "getBalance",
            ],
            config: this.sdk.config,
          };
          break;

        case "getDecoderRegistry":
          const registry = this.sdk.decoders;
          result = {
            registeredPrograms: registry.getRegisteredPrograms(),
            totalDecoders: registry.getRegisteredPrograms().length,
            supportedPrograms: {
              "System Program": "11111111111111111111111111111111",
              "SPL Token": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
              "Token-2022": "G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6",
              "Associated Token Account":
                "4YpYoLVTQ8bxcne9GneN85RUXeN7pqGTwgPcY71ZL5gX",
              "Metaplex Core": "BvoSmPBF6mBRxBMY9FPguw1zUoUg3xWGBA7sNHXR7QQsn",
            },
          };
          break;

        case "checkSufficientBalance":
          const address = params.address || "";
          const requiredAmount = parseInt(params.requiredAmount) || 0;

          try {
            const balance = await this.sdk.rpc.getBalance(address);
            result = {
              success: true,
              sufficient: balance >= requiredAmount,
              currentBalance: balance,
              requiredAmount: requiredAmount,
              difference: balance - requiredAmount,
              timestamp: new Date().toISOString(),
            };
          } catch (error) {
            result = {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to check balance",
              timestamp: new Date().toISOString(),
            };
          }
          break;

        // For methods that require wallet connections, provide demo responses
        case "createToken22TwoTx":
          let tokenParams: any = {};

          if (params.params) {
            try {
              tokenParams = JSON.parse(params.params);
            } catch (e) {
              console.warn("Invalid JSON in params parameter, using default");
              tokenParams = {
                name: "Test Token",
                symbol: "TEST",
                decimals: 6,
                supply: 1000000,
              };
            }
          }

          result = {
            success: true,
            message:
              "Demo mode - actual token creation requires wallet connection",
            note: "In production, pass a wallet/keypair to create actual tokens",
            demoData: {
              mint: "DemoToken" + Math.random().toString(36).substr(2, 9),
              transactions: ["txn1_" + Date.now(), "txn2_" + Date.now()],
              estimatedCost: 0.002,
              parameters: tokenParams,
            },
            timestamp: new Date().toISOString(),
          };
          break;

        case "createNFT":
          let nftParams: any = {};

          if (params.params) {
            try {
              nftParams = JSON.parse(params.params);
            } catch (e) {
              console.warn("Invalid JSON in params parameter, using default");
              nftParams = {
                name: "Test NFT",
                symbol: "TESTNFT",
                uri: "https://example.com/metadata.json",
              };
            }
          }

          result = {
            success: true,
            message:
              "Demo mode - actual NFT creation requires wallet connection",
            note: "In production, pass a wallet adapter to create actual NFTs",
            demoData: {
              mint: "DemoNFT" + Math.random().toString(36).substr(2, 9),
              metadataAccount:
                "DemoMeta" + Math.random().toString(36).substr(2, 9),
              estimatedCost: 0.005,
              parameters: nftParams,
            },
            timestamp: new Date().toISOString(),
          };
          break;

        case "estimateTokenCreationCost":
          let costParams: any = {};

          if (params.params) {
            try {
              costParams = JSON.parse(params.params);
            } catch (e) {
              console.warn("Invalid JSON in params parameter, using default");
              costParams = { decimals: 6, hasMetadata: true };
            }
          }

          result = {
            success: true,
            cost: {
              lamports: 2000000,
              sol: 0.002,
              breakdown: {
                mint: 1400000,
                metadata: 600000,
              },
            },
            parameters: costParams,
            note: "This is a static estimate - actual costs may vary",
            timestamp: new Date().toISOString(),
          };
          break;

        default:
          throw new Error(`Method ${method.name} not implemented`);
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        executionTime,
      };
    }
  }

  // Helper method to convert base64 to Uint8Array
  private base64ToUint8Array(base64: string): Uint8Array {
    try {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } catch (error) {
      console.warn("Failed to decode base64, returning empty array:", error);
      return new Uint8Array(0);
    }
  }

  // Get the SDK instance for direct access if needed
  getSDK(): any {
    return this.sdk;
  }
}

export default MethodExecutor;
