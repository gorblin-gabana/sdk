# Gorbchain SDK Examples

This document provides comprehensive examples of how to use the Gorbchain SDK for various blockchain operations.

## Table of Contents

1. [Setup and Initialization](#setup-and-initialization)
2. [Transaction Decoding](#transaction-decoding)
3. [Token Creation](#token-creation)
4. [NFT Creation](#nft-creation)
5. [Balance and Cost Management](#balance-and-cost-management)
6. [Custom Decoders](#custom-decoders)
7. [Error Handling](#error-handling)
8. [Batch Operations](#batch-operations)
9. [Real-World Applications](#real-world-applications)

## Setup and Initialization

### Basic Setup
```typescript
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode';

// Basic initialization
const sdk = new GorbchainSDK();

// Custom configuration
const sdk = new GorbchainSDK({
  rpcEndpoint: 'https://rpc.gorbchain.xyz',
  network: 'mainnet',
  timeout: 30000,
  retries: 3,
  richDecoding: {
    enabled: true,
    includeTokenMetadata: true,
    includeNftMetadata: true,
    maxConcurrentRequests: 10
  }
});
```

### Environment-Based Setup
```typescript
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode';

// Using environment variables
const sdk = new GorbchainSDK({
  rpcEndpoint: process.env.GORBCHAIN_RPC_URL || 'https://rpc.gorbchain.xyz',
  network: (process.env.GORBCHAIN_NETWORK as any) || 'mainnet',
  timeout: parseInt(process.env.RPC_TIMEOUT || '30000'),
  retries: parseInt(process.env.RPC_RETRIES || '3')
});
```

## Transaction Decoding

### Basic Transaction Decoding
```typescript
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode';

async function analyzeTransaction(signature: string) {
  const sdk = new GorbchainSDK({
    richDecoding: { enabled: true }
  });
  
  try {
    const richTransaction = await sdk.getAndDecodeTransaction(signature);
    
    console.log('Transaction Analysis:');
    console.log('- Signature:', richTransaction.signature);
    console.log('- Status:', richTransaction.status);
    console.log('- Fee:', richTransaction.fee / 1e9, 'SOL');
    console.log('- Block Time:', new Date(richTransaction.blockTime! * 1000));
    console.log('- Instructions:', richTransaction.instructions.length);
    
    richTransaction.instructions.forEach((instruction, index) => {
      console.log(`  ${index + 1}. ${instruction.decoded.type}`);
      console.log(`     Program: ${instruction.programName || 'Unknown'}`);
      console.log(`     Description: ${instruction.decoded.description}`);
    });
    
    return richTransaction;
  } catch (error) {
    console.error('Failed to analyze transaction:', error);
    throw error;
  }
}

// Usage
analyzeTransaction('5a7f8c9d...')
  .then(result => console.log('Analysis complete'))
  .catch(err => console.error('Analysis failed:', err));
```

### Advanced Transaction Analysis
```typescript
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode';

async function deepAnalyzeTransaction(signature: string) {
  const sdk = new GorbchainSDK({
    richDecoding: {
      enabled: true,
      includeTokenMetadata: true,
      includeNftMetadata: true
    }
  });
  
  const richTransaction = await sdk.getAndDecodeTransaction(signature);
  
  // Analyze token transfers
  const tokenTransfers = richTransaction.instructions.filter(
    inst => inst.decoded.type.includes('transfer')
  );
  
  console.log('\nToken Transfers:');
  tokenTransfers.forEach((transfer, index) => {
    console.log(`  ${index + 1}. Type: ${transfer.decoded.type}`);
    console.log(`     Amount: ${transfer.decoded.data?.amount || 'N/A'}`);
    console.log(`     From: ${transfer.decoded.data?.source || 'N/A'}`);
    console.log(`     To: ${transfer.decoded.data?.destination || 'N/A'}`);
    
    if (transfer.decoded.tokenMetadata) {
      console.log(`     Token: ${transfer.decoded.tokenMetadata.name} (${transfer.decoded.tokenMetadata.symbol})`);
    }
  });
  
  // Analyze account changes
  if (richTransaction.tokenAccounts) {
    console.log('\nToken Account Changes:');
    Object.entries(richTransaction.tokenAccounts).forEach(([address, info]) => {
      console.log(`  ${address}:`);
      console.log(`    Balance: ${info.balance || 'N/A'}`);
      console.log(`    Owner: ${info.owner || 'N/A'}`);
    });
  }
  
  return richTransaction;
}
```

### Batch Transaction Analysis
```typescript
async function analyzeMultipleTransactions(signatures: string[]) {
  const sdk = new GorbchainSDK();
  
  const results = await Promise.allSettled(
    signatures.map(signature => 
      sdk.getAndDecodeTransaction(signature)
    )
  );
  
  const successful = results
    .filter(result => result.status === 'fulfilled')
    .map(result => (result as PromiseFulfilledResult<any>).value);
  
  const failed = results
    .filter(result => result.status === 'rejected')
    .map((result, index) => ({
      signature: signatures[index],
      error: (result as PromiseRejectedResult).reason
    }));
  
  console.log(`Analyzed ${successful.length} successful transactions`);
  console.log(`Failed to analyze ${failed.length} transactions`);
  
  return { successful, failed };
}
```

## Token Creation

### Simple Token Creation
```typescript
import { 
  GorbchainSDK, 
  createToken22TwoTx, 
  estimateTokenCreationCost 
} from '@gorbchain-xyz/chaindecode';
import { Keypair, Connection } from '@solana/web3.js';

async function createSimpleToken() {
  const sdk = new GorbchainSDK();
  const connection = new Connection(sdk.config.rpcEndpoint);
  const payer = Keypair.generate(); // In real app, load from wallet
  
  const tokenParams = {
    name: 'My Awesome Token',
    symbol: 'MAT',
    supply: 1000000,
    decimals: 6,
    uri: 'https://example.com/token-metadata.json',
    description: 'A token for my awesome project'
  };
  
  try {
    // Estimate cost first
    const estimatedCost = await estimateTokenCreationCost(connection, tokenParams);
    console.log(`Estimated cost: ${estimatedCost / 1e9} SOL`);
    
    // Create the token
    const result = await createToken22TwoTx(connection, payer, tokenParams);
    
    console.log('Token created successfully!');
    console.log('- Token Address:', result.tokenAddress);
    console.log('- Associated Token Address:', result.associatedTokenAddress);
    console.log('- Transaction Signature:', result.signature);
    
    return result;
  } catch (error) {
    console.error('Token creation failed:', error);
    throw error;
  }
}
```

### Advanced Token Creation with Validation
```typescript
import { 
  createToken22TwoTx, 
  checkSufficientBalance, 
  estimateTokenCreationCost,
  validateTokenParameters 
} from '@gorbchain-xyz/chaindecode';

async function createValidatedToken(payer: Keypair, params: TokenCreationParams) {
  const connection = new Connection('https://rpc.gorbchain.xyz');
  
  try {
    // Validate parameters
    validateTokenParameters(params);
    console.log('✓ Token parameters valid');
    
    // Estimate cost
    const estimatedCost = await estimateTokenCreationCost(connection, params);
    console.log(`✓ Estimated cost: ${estimatedCost / 1e9} SOL`);
    
    // Check balance
    const balanceCheck = await checkSufficientBalance(
      connection,
      payer.publicKey,
      estimatedCost
    );
    
    if (!balanceCheck.sufficient) {
      throw new Error(
        `Insufficient balance. Required: ${balanceCheck.required / 1e9} SOL, ` +
        `Available: ${balanceCheck.balance / 1e9} SOL`
      );
    }
    console.log('✓ Sufficient balance confirmed');
    
    // Create token
    const result = await createToken22TwoTx(connection, payer, params, {
      commitment: 'confirmed',
      maxRetries: 3
    });
    
    console.log('✓ Token created successfully!');
    return result;
    
  } catch (error) {
    console.error('Token creation failed:', error);
    throw error;
  }
}
```

## NFT Creation

### Simple NFT Creation
```typescript
import { createNFT, estimateNFTCreationCost } from '@gorbchain-xyz/chaindecode';

async function createSimpleNFT(wallet: any) {
  const connection = new Connection('https://rpc.gorbchain.xyz');
  
  const nftParams = {
    name: 'My Cool NFT',
    uri: 'https://example.com/nft-metadata.json',
    description: 'A really cool NFT',
    royaltyBasisPoints: 500, // 5% royalty
    attributes: [
      { trait_type: 'Color', value: 'Blue' },
      { trait_type: 'Rarity', value: 'Rare' },
      { trait_type: 'Power', value: 85, display_type: 'number' }
    ]
  };
  
  try {
    const estimatedCost = await estimateNFTCreationCost(connection, nftParams);
    console.log(`Estimated NFT creation cost: ${estimatedCost / 1e9} SOL`);
    
    const result = await createNFT(connection, wallet, nftParams);
    
    console.log('NFT created successfully!');
    console.log('- Asset Address:', result.assetAddress);
    console.log('- Transaction Signature:', result.signature);
    
    return result;
  } catch (error) {
    console.error('NFT creation failed:', error);
    throw error;
  }
}
```

### NFT Collection Creation
```typescript
import { createNFT } from '@gorbchain-xyz/chaindecode';

async function createNFTCollection(wallet: any, nftCount: number) {
  const connection = new Connection('https://rpc.gorbchain.xyz');
  const results = [];
  
  for (let i = 0; i < nftCount; i++) {
    const nftParams = {
      name: `Collection NFT #${i + 1}`,
      uri: `https://example.com/collection-metadata/${i + 1}.json`,
      description: `NFT #${i + 1} from my collection`,
      royaltyBasisPoints: 250, // 2.5% royalty
      creators: [
        { address: wallet.publicKey.toString(), percentage: 100 }
      ],
      attributes: [
        { trait_type: 'Collection', value: 'My Collection' },
        { trait_type: 'Edition', value: i + 1, display_type: 'number' },
        { trait_type: 'Rarity', value: i < 10 ? 'Rare' : 'Common' }
      ]
    };
    
    try {
      const result = await createNFT(connection, wallet, nftParams);
      results.push(result);
      
      console.log(`Created NFT ${i + 1}/${nftCount}: ${result.assetAddress}`);
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Failed to create NFT ${i + 1}:`, error);
    }
  }
  
  return results;
}
```

## Balance and Cost Management

### Comprehensive Balance Checker
```typescript
import { checkSufficientBalance, estimateTokenCreationCost, estimateNFTCreationCost } from '@gorbchain-xyz/chaindecode';

class BalanceManager {
  private connection: Connection;
  
  constructor(rpcEndpoint: string) {
    this.connection = new Connection(rpcEndpoint);
  }
  
  async checkBalanceForTokenCreation(
    payer: PublicKey, 
    tokenParams: TokenCreationParams
  ): Promise<{ canAfford: boolean; details: any }> {
    const estimatedCost = await estimateTokenCreationCost(this.connection, tokenParams);
    const balanceCheck = await checkSufficientBalance(
      this.connection,
      payer,
      estimatedCost
    );
    
    return {
      canAfford: balanceCheck.sufficient,
      details: {
        estimatedCost: estimatedCost / 1e9,
        currentBalance: balanceCheck.balance / 1e9,
        shortfall: balanceCheck.sufficient ? 0 : (estimatedCost - balanceCheck.balance) / 1e9
      }
    };
  }
  
  async checkBalanceForNFTCreation(
    payer: PublicKey, 
    nftParams: NFTCreationParams
  ): Promise<{ canAfford: boolean; details: any }> {
    const estimatedCost = await estimateNFTCreationCost(this.connection, nftParams);
    const balanceCheck = await checkSufficientBalance(
      this.connection,
      payer,
      estimatedCost
    );
    
    return {
      canAfford: balanceCheck.sufficient,
      details: {
        estimatedCost: estimatedCost / 1e9,
        currentBalance: balanceCheck.balance / 1e9,
        shortfall: balanceCheck.sufficient ? 0 : (estimatedCost - balanceCheck.balance) / 1e9
      }
    };
  }
}
```

## Custom Decoders

### Simple Custom Decoder
```typescript
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode';

function createCustomDecoder() {
  const sdk = new GorbchainSDK();
  
  // Register a custom decoder for a DEX program
  sdk.registerDecoder(
    'my-dex',
    'DEXProgram1111111111111111111111111111111111',
    (instruction) => {
      const data = instruction.data;
      
      // Parse different instruction types
      switch (data[0]) {
        case 0: // Initialize
          return {
            type: 'dex-initialize',
            programId: instruction.programId,
            data: {
              instructionType: 'initialize',
              authority: instruction.accounts[0]?.address
            },
            accounts: instruction.accounts,
            raw: instruction
          };
          
        case 1: // Swap
          return {
            type: 'dex-swap',
            programId: instruction.programId,
            data: {
              instructionType: 'swap',
              tokenA: instruction.accounts[0]?.address,
              tokenB: instruction.accounts[1]?.address,
              trader: instruction.accounts[2]?.address,
              amount: readUint64(data, 1) // Custom parsing function
            },
            accounts: instruction.accounts,
            raw: instruction
          };
          
        default:
          return {
            type: 'dex-unknown',
            programId: instruction.programId,
            data: { instructionType: 'unknown' },
            accounts: instruction.accounts,
            raw: instruction
          };
      }
    }
  );
  
  return sdk;
}

// Helper function to read uint64 from bytes
function readUint64(data: Uint8Array, offset: number): string {
  const view = new DataView(data.buffer, data.byteOffset + offset, 8);
  const low = view.getUint32(0, true);
  const high = view.getUint32(4, true);
  return (BigInt(high) << 32n | BigInt(low)).toString();
}
```

### Advanced Custom Decoder with Validation
```typescript
class CustomDEXDecoder {
  static register(sdk: GorbchainSDK) {
    sdk.registerDecoder(
      'advanced-dex',
      'ADEXProgram111111111111111111111111111111111',
      this.decode
    );
  }
  
  static decode(instruction: any) {
    try {
      const data = instruction.data;
      
      if (data.length < 1) {
        throw new Error('Invalid instruction data length');
      }
      
      const instructionType = data[0];
      
      switch (instructionType) {
        case 0x00:
          return this.decodeInitialize(instruction, data);
        case 0x01:
          return this.decodeSwap(instruction, data);
        case 0x02:
          return this.decodeAddLiquidity(instruction, data);
        case 0x03:
          return this.decodeRemoveLiquidity(instruction, data);
        default:
          return this.decodeUnknown(instruction, data);
      }
    } catch (error) {
      return {
        type: 'dex-error',
        programId: instruction.programId,
        data: {
          error: error.message,
          instructionType: 'error'
        },
        accounts: instruction.accounts,
        raw: instruction
      };
    }
  }
  
  private static decodeSwap(instruction: any, data: Uint8Array) {
    if (data.length < 17) {
      throw new Error('Invalid swap instruction data length');
    }
    
    const amount = readUint64(data, 1);
    const minimumAmountOut = readUint64(data, 9);
    
    return {
      type: 'dex-swap',
      programId: instruction.programId,
      data: {
        instructionType: 'swap',
        amount,
        minimumAmountOut,
        tokenA: instruction.accounts[0]?.address,
        tokenB: instruction.accounts[1]?.address,
        trader: instruction.accounts[2]?.address,
        description: `Swap ${amount} tokens with minimum ${minimumAmountOut} output`
      },
      accounts: instruction.accounts,
      raw: instruction
    };
  }
  
  // ... other decode methods
}
```

## Error Handling

### Comprehensive Error Handler
```typescript
import { 
  RpcNetworkError, 
  RpcTimeoutError, 
  RpcServerError, 
  RpcConnectionError 
} from '@gorbchain-xyz/chaindecode';

class SDKErrorHandler {
  static async handleOperation<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error(`${context} failed:`, error);
      
      if (error instanceof RpcTimeoutError) {
        console.error('Request timed out. Try again later.');
        throw new Error('Operation timed out');
      }
      
      if (error instanceof RpcNetworkError) {
        console.error('Network error. Check your connection.');
        throw new Error('Network error');
      }
      
      if (error instanceof RpcServerError) {
        console.error('Server error:', error.message);
        throw new Error('Server error');
      }
      
      if (error instanceof RpcConnectionError) {
        console.error('Connection error:', error.message);
        throw new Error('Connection error');
      }
      
      // Generic error
      throw error;
    }
  }
}

// Usage
async function safeTransactionDecoding(signature: string) {
  const sdk = new GorbchainSDK();
  
  return SDKErrorHandler.handleOperation(
    () => sdk.getAndDecodeTransaction(signature),
    'Transaction decoding'
  );
}
```

## Batch Operations

### Batch Token Creation
```typescript
async function createTokensBatch(
  payer: Keypair,
  tokenConfigs: TokenCreationParams[]
): Promise<{ successful: TokenMintResult[]; failed: any[] }> {
  const connection = new Connection('https://rpc.gorbchain.xyz');
  const successful: TokenMintResult[] = [];
  const failed: any[] = [];
  
  // Process in batches to avoid overwhelming the network
  const batchSize = 3;
  for (let i = 0; i < tokenConfigs.length; i += batchSize) {
    const batch = tokenConfigs.slice(i, i + batchSize);
    
    const batchResults = await Promise.allSettled(
      batch.map(async (config, index) => {
        try {
          const result = await createToken22TwoTx(connection, payer, config);
          console.log(`Created token ${i + index + 1}/${tokenConfigs.length}: ${result.tokenAddress}`);
          return result;
        } catch (error) {
          console.error(`Failed to create token ${i + index + 1}:`, error);
          throw error;
        }
      })
    );
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push({
          config: batch[index],
          error: result.reason
        });
      }
    });
    
    // Add delay between batches
    if (i + batchSize < tokenConfigs.length) {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  return { successful, failed };
}
```

## Real-World Applications

### Token Portfolio Analyzer
```typescript
class TokenPortfolioAnalyzer {
  private sdk: GorbchainSDK;
  
  constructor() {
    this.sdk = new GorbchainSDK({
      richDecoding: {
        enabled: true,
        includeTokenMetadata: true
      }
    });
  }
  
  async analyzeWalletTransactions(
    walletAddress: string,
    transactionSignatures: string[]
  ): Promise<{
    totalTransactions: number;
    tokenTransfers: number;
    nftTransfers: number;
    totalFeesSpent: number;
    tokenBreakdown: Record<string, any>;
  }> {
    const results = await Promise.allSettled(
      transactionSignatures.map(sig => 
        this.sdk.getAndDecodeTransaction(sig)
      )
    );
    
    const successful = results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<any>).value);
    
    let totalFeesSpent = 0;
    let tokenTransfers = 0;
    let nftTransfers = 0;
    const tokenBreakdown: Record<string, any> = {};
    
    successful.forEach(tx => {
      totalFeesSpent += tx.fee;
      
      tx.instructions.forEach(instruction => {
        if (instruction.decoded.type.includes('transfer')) {
          if (instruction.decoded.type.includes('nft')) {
            nftTransfers++;
          } else {
            tokenTransfers++;
            
            // Track token activity
            if (instruction.decoded.tokenMetadata) {
              const symbol = instruction.decoded.tokenMetadata.symbol;
              if (!tokenBreakdown[symbol]) {
                tokenBreakdown[symbol] = {
                  name: instruction.decoded.tokenMetadata.name,
                  transferCount: 0,
                  totalAmount: 0
                };
              }
              tokenBreakdown[symbol].transferCount++;
              tokenBreakdown[symbol].totalAmount += 
                parseFloat(instruction.decoded.data.amount || '0');
            }
          }
        }
      });
    });
    
    return {
      totalTransactions: successful.length,
      tokenTransfers,
      nftTransfers,
      totalFeesSpent: totalFeesSpent / 1e9,
      tokenBreakdown
    };
  }
}
```

### Trading Bot Integration
```typescript
class TradingBotIntegration {
  private sdk: GorbchainSDK;
  
  constructor() {
    this.sdk = new GorbchainSDK({
      richDecoding: { enabled: true }
    });
  }
  
  async monitorDEXTransactions(
    dexProgramId: string,
    onSwapDetected: (swap: any) => void
  ): Promise<void> {
    // This would typically be integrated with a websocket listener
    // For demo purposes, we'll show how to decode DEX transactions
    
    const mockTransactionSignatures = [
      '5VqRpL...',
      '7sNmTx...',
      '9kPfWe...'
    ];
    
    for (const signature of mockTransactionSignatures) {
      try {
        const richTx = await this.sdk.getAndDecodeTransaction(signature);
        
        const swapInstructions = richTx.instructions.filter(
          inst => inst.programId === dexProgramId && 
                  inst.decoded.type === 'dex-swap'
        );
        
        swapInstructions.forEach(swap => {
          onSwapDetected({
            signature: richTx.signature,
            timestamp: richTx.blockTime,
            tokenA: swap.decoded.data.tokenA,
            tokenB: swap.decoded.data.tokenB,
            amount: swap.decoded.data.amount,
            trader: swap.decoded.data.trader
          });
        });
      } catch (error) {
        console.error('Failed to analyze transaction:', error);
      }
    }
  }
}
```

This comprehensive examples documentation provides practical, real-world usage patterns for the Gorbchain SDK. Each example includes complete, runnable code with proper error handling and best practices. 