# 🪙 Token and NFT Minting Guide

This guide covers the comprehensive token and NFT minting capabilities of the Gorbchain SDK, based on the proven implementation from the Gorbagana Token LaunchPad.

## Table of Contents
- [Token Creation](#token-creation)
- [NFT Creation](#nft-creation)
- [Cost Estimation](#cost-estimation)
- [Balance Checking](#balance-checking)
- [Transaction Options](#transaction-options)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Overview

The Gorbchain SDK provides enterprise-grade token and NFT minting capabilities using:
- **Token22 Program** - Latest Solana token standard with advanced features
- **Metaplex Core** - Industry-standard NFT creation and management
- **Two-Transaction Approach** - Recommended for reliability with complex metadata
- **Single Transaction Approach** - Faster execution for simple use cases

## Token Creation

### Creating Tokens with Two-Transaction Approach (Recommended)

The two-transaction approach provides better reliability for complex metadata:

```typescript
import { GorbchainSDK, TokenCreationParams } from '@gorbchain-xyz/chaindecode';
import { Keypair } from '@solana/web3.js';

const sdk = new GorbchainSDK({
  rpcEndpoint: 'https://rpc.gorbchain.xyz',
  network: 'mainnet'
});

const payer = Keypair.generate(); // Your keypair

const tokenParams: TokenCreationParams = {
  name: 'My Awesome Token',
  symbol: 'MAT',
  supply: 1000000,
  decimals: 6,
  uri: 'https://example.com/metadata.json',
  description: 'A revolutionary token for the Gorbchain ecosystem'
};

try {
  const result = await sdk.createToken22TwoTx(payer, tokenParams);
  
  console.log('✅ Token created successfully!');
  console.log('🪙 Token Address:', result.tokenAddress);
  console.log('💼 Associated Token Account:', result.associatedTokenAddress);
  console.log('📄 Transaction:', result.signature);
  console.log('🔗 Explorer:', result.transactionUrl);
} catch (error) {
  console.error('❌ Token creation failed:', error);
}
```

### Creating Tokens with Single Transaction Approach

For faster execution with simpler metadata:

```typescript
const result = await sdk.createToken22SingleTx(payer, tokenParams, {
  commitment: 'confirmed',
  maxRetries: 3
});
```

### Token Creation Parameters

```typescript
interface TokenCreationParams {
  name: string;          // Token name (1-32 characters)
  symbol: string;        // Token symbol (1-10 characters)  
  supply: number;        // Total supply (1 to 1e15)
  decimals: number;      // Decimal places (0-9)
  uri?: string;          // Metadata URI (optional)
  description?: string;  // Token description (optional)
}
```

### Token Creation Result

```typescript
interface TokenMintResult {
  signature: string;                // Transaction signature
  tokenAddress: string;            // Token mint address
  associatedTokenAddress: string;  // Creator's token account
  transactionUrl?: string;         // Explorer URL
}
```

## NFT Creation

### Creating NFTs with Metaplex Core

```typescript
import { NFTCreationParams } from '@gorbchain-xyz/chaindecode';

const nftParams: NFTCreationParams = {
  name: 'Epic Digital Art',
  uri: 'https://example.com/nft-metadata.json',
  description: 'A unique piece of digital art',
  royaltyBasisPoints: 500, // 5% royalty
  creators: [{
    address: wallet.publicKey.toString(),
    percentage: 100
  }],
  attributes: [
    {
      trait_type: 'Rarity',
      value: 'Legendary'
    },
    {
      trait_type: 'Collection',
      value: 'Genesis'
    }
  ]
};

try {
  const result = await sdk.createNFT(wallet, nftParams);
  
  console.log('✅ NFT created successfully!');
  console.log('🎨 Asset Address:', result.assetAddress);
  console.log('📄 Transaction:', result.signature);
  console.log('🔗 Explorer:', result.transactionUrl);
} catch (error) {
  console.error('❌ NFT creation failed:', error);
}
```

### NFT Creation Parameters

```typescript
interface NFTCreationParams {
  name: string;                    // NFT name (1-32 characters)
  uri: string;                     // Metadata URI (required)
  description?: string;            // NFT description
  royaltyBasisPoints?: number;     // Royalty (0-10000, i.e. 500 = 5%)
  creators?: Array<{               // Creator split
    address: string;
    percentage: number;            // Must sum to 100
  }>;
  attributes?: Array<{             // NFT attributes
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
}
```

### NFT Metadata JSON Standard

```json
{
  "name": "Epic Digital Art",
  "description": "A unique piece of digital art",
  "image": "https://example.com/image.png",
  "external_url": "https://example.com",
  "attributes": [
    {
      "trait_type": "Rarity",
      "value": "Legendary"
    },
    {
      "trait_type": "Collection", 
      "value": "Genesis"
    }
  ],
  "properties": {
    "creators": [
      {
        "address": "11111111111111111111111111111111",
        "share": 100
      }
    ],
    "category": "image"
  }
}
```

## Cost Estimation

### Estimating Token Creation Costs

```typescript
const tokenParams: TokenCreationParams = {
  name: 'Test Token',
  symbol: 'TEST',
  supply: 1000000,
  decimals: 6,
  uri: 'https://example.com/metadata.json'
};

const estimatedCost = await sdk.estimateTokenCreationCost(tokenParams);
console.log(`💰 Estimated cost: ${estimatedCost / 1e9} SOL`);

// Check if user has sufficient balance
const balance = await sdk.checkSufficientBalance(
  payer.publicKey,
  estimatedCost
);

if (!balance.sufficient) {
  console.error(`❌ Insufficient balance! Need ${balance.required / 1e9} SOL, have ${balance.balance / 1e9} SOL`);
}
```

### Estimating NFT Creation Costs

```typescript
const nftParams: NFTCreationParams = {
  name: 'Test NFT',
  uri: 'https://example.com/nft.json',
  royaltyBasisPoints: 500,
  attributes: [{ trait_type: 'Test', value: 'Value' }]
};

const estimatedCost = await sdk.estimateNFTCreationCost(nftParams);
console.log(`💰 Estimated NFT cost: ${estimatedCost / 1e9} SOL`);
```

## Balance Checking

```typescript
const balance = await sdk.checkSufficientBalance(
  userPublicKey,
  estimatedCost
);

console.log('💰 Balance Check:', {
  sufficient: balance.sufficient,
  currentBalance: `${balance.balance / 1e9} SOL`,
  requiredBalance: `${balance.required / 1e9} SOL`
});
```

## Transaction Options

```typescript
interface TransactionOptions {
  commitment?: 'processed' | 'confirmed' | 'finalized';
  maxRetries?: number;
  skipPreflight?: boolean;
}

// Custom transaction options
const options: TransactionOptions = {
  commitment: 'finalized',  // Wait for finalized confirmation
  maxRetries: 5,           // Retry up to 5 times
  skipPreflight: false     // Run preflight checks
};

const result = await sdk.createToken22TwoTx(payer, tokenParams, options);
```

## Error Handling

### Common Errors and Solutions

```typescript
try {
  const result = await sdk.createToken22TwoTx(payer, tokenParams);
} catch (error) {
  if (error.message.includes('Insufficient')) {
    console.error('💸 Add more SOL to your wallet');
  } else if (error.message.includes('Invalid')) {
    console.error('📝 Check your token parameters');
  } else if (error.message.includes('simulation failed')) {
    console.error('🔄 Transaction simulation failed, trying again...');
  } else {
    console.error('❌ Unexpected error:', error.message);
  }
}
```

### Validation Errors

The SDK provides built-in validation for all parameters:

```typescript
// Token validation errors
- "Token name must be 1-32 characters"
- "Token symbol must be 1-10 characters"
- "Token supply must be between 1 and 1e15"
- "Decimals must be between 0 and 9"
- "Invalid URI format"

// NFT validation errors  
- "NFT name must be 1-32 characters"
- "Valid metadata URI is required"
- "Royalty basis points must be between 0 and 10000"
- "Creator percentages must sum to 100"
```

## Examples

### Complete Token Creation Example

```typescript
import { 
  GorbchainSDK, 
  TokenCreationParams,
  TransactionOptions 
} from '@gorbchain-xyz/chaindecode';
import { Keypair } from '@solana/web3.js';

async function createMyToken() {
  // Initialize SDK
  const sdk = new GorbchainSDK({
    rpcEndpoint: 'https://rpc.gorbchain.xyz',
    network: 'mainnet'
  });

  // Your keypair (load from file or generate)
  const payer = Keypair.generate();

  // Token parameters
  const tokenParams: TokenCreationParams = {
    name: 'Governance Token',
    symbol: 'GOV',
    supply: 10000000,
    decimals: 9,
    uri: 'https://metadata.gorbchain.xyz/gov-token.json',
    description: 'Governance token for DAO voting'
  };

  // Transaction options
  const options: TransactionOptions = {
    commitment: 'confirmed',
    maxRetries: 3
  };

  try {
    // Check balance first
    const estimatedCost = await sdk.estimateTokenCreationCost(tokenParams);
    const balanceCheck = await sdk.checkSufficientBalance(
      payer.publicKey,
      estimatedCost
    );

    if (!balanceCheck.sufficient) {
      throw new Error(
        `Insufficient balance. Need ${balanceCheck.required / 1e9} SOL, ` +
        `have ${balanceCheck.balance / 1e9} SOL`
      );
    }

    console.log('🚀 Creating token...');
    
    // Create token with two-transaction approach
    const result = await sdk.createToken22TwoTx(payer, tokenParams, options);
    
    console.log('✅ Token created successfully!');
    console.log(`🪙 Token Address: ${result.tokenAddress}`);
    console.log(`💼 Your Token Account: ${result.associatedTokenAddress}`);
    console.log(`🔗 View on Explorer: ${result.transactionUrl}`);
    
    // Get token info
    const tokenInfo = await sdk.getTokenInfo(result.tokenAddress);
    console.log('📊 Token Info:', tokenInfo);
    
    return result;
  } catch (error) {
    console.error('❌ Token creation failed:', error);
    throw error;
  }
}

// Usage
createMyToken()
  .then(result => console.log('Token created:', result))
  .catch(error => console.error('Failed:', error));
```

### Complete NFT Creation Example

```typescript
async function createMyNFT(wallet: any) {
  const sdk = new GorbchainSDK({
    rpcEndpoint: 'https://rpc.gorbchain.xyz'
  });

  const nftParams: NFTCreationParams = {
    name: 'Genesis Collection #1',
    uri: 'https://metadata.gorbchain.xyz/genesis-1.json',
    description: 'First NFT in the Genesis collection',
    royaltyBasisPoints: 750, // 7.5% royalty
    creators: [{
      address: wallet.publicKey.toString(),
      percentage: 100
    }],
    attributes: [
      { trait_type: 'Collection', value: 'Genesis' },
      { trait_type: 'Rarity', value: 'Ultra Rare' },
      { trait_type: 'Edition', value: 1, display_type: 'number' }
    ]
  };

  try {
    console.log('🎨 Creating NFT...');
    
    const result = await sdk.createNFT(wallet, nftParams);
    
    console.log('✅ NFT created successfully!');
    console.log(`🎨 Asset Address: ${result.assetAddress}`);
    console.log(`🔗 View on Explorer: ${result.transactionUrl}`);
    
    return result;
  } catch (error) {
    console.error('❌ NFT creation failed:', error);
    throw error;
  }
}
```

### Batch Token Creation

```typescript
async function createMultipleTokens(payer: Keypair, tokenConfigs: TokenCreationParams[]) {
  const sdk = new GorbchainSDK({ rpcEndpoint: 'https://rpc.gorbchain.xyz' });
  const results = [];
  
  for (const [index, config] of tokenConfigs.entries()) {
    try {
      console.log(`🚀 Creating token ${index + 1}/${tokenConfigs.length}: ${config.name}`);
      
      const result = await sdk.createToken22TwoTx(payer, config);
      results.push({ success: true, result, config });
      
      console.log(`✅ Token ${config.symbol} created: ${result.tokenAddress}`);
      
      // Wait between creations to avoid rate limiting
      if (index < tokenConfigs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`❌ Failed to create ${config.name}:`, error);
      results.push({ success: false, error, config });
    }
  }
  
  return results;
}
```

## Integration with Wallet Adapters

### Using with React and Wallet Adapters

```typescript
import { useWallet } from '@solana/wallet-adapter-react';
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode';

function TokenCreator() {
  const wallet = useWallet();
  const [isCreating, setIsCreating] = useState(false);
  
  const createToken = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      alert('Please connect your wallet');
      return;
    }
    
    setIsCreating(true);
    
    try {
      const sdk = new GorbchainSDK({
        rpcEndpoint: 'https://rpc.gorbchain.xyz'
      });
      
      // Note: For browser usage, you'd need to sign transactions differently
      // This example shows the concept
      const result = await sdk.createNFT(wallet, {
        name: 'My NFT',
        uri: 'https://example.com/metadata.json'
      });
      
      console.log('NFT created:', result);
    } catch (error) {
      console.error('Creation failed:', error);
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <button onClick={createToken} disabled={isCreating}>
      {isCreating ? 'Creating...' : 'Create NFT'}
    </button>
  );
}
```

## Best Practices

### Security
- ✅ Always validate input parameters
- ✅ Check balance before creating transactions
- ✅ Use the two-transaction approach for production
- ✅ Implement proper error handling
- ✅ Never expose private keys in client-side code

### Performance
- ✅ Estimate costs before creation
- ✅ Use appropriate commitment levels
- ✅ Implement retry logic for reliability
- ✅ Add delays between batch operations
- ✅ Monitor transaction success rates

### User Experience
- ✅ Provide clear progress indicators
- ✅ Show estimated costs upfront
- ✅ Display helpful error messages
- ✅ Include transaction explorer links
- ✅ Implement proper loading states

## Program IDs

The SDK uses the following Gorbchain-specific program IDs:

```typescript
TOKEN22_PROGRAM = 'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn'
ASSOCIATED_TOKEN_PROGRAM = '4YpYoLVTQ8bxcne9GneN85RUXeN7pqGTwgPcY71ZL5gX'  
CUSTOM_MPL_CORE_PROGRAM = 'BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc'
```

## Support

For questions about token and NFT minting:
- 📚 [SDK Documentation](../README.md)
- 💬 [Discord Community](https://discord.gg/gorbchain)
- 🐛 [GitHub Issues](https://github.com/gorbchain/sdk/issues)
- 📧 [Email Support](mailto:support@gorbchain.xyz)

---

*The minting functionality is based on the proven implementation from the [Gorbagana Token LaunchPad](https://launch.gorbchain.xyz), which has successfully created thousands of tokens and NFTs on the Gorbchain network.* 