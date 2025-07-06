# 🔗 Gorbchain SDK

A comprehensive TypeScript SDK for interacting with the Gorbchain blockchain, providing transaction decoding, instruction analysis, token & NFT minting, and comprehensive error handling.

## ✨ Features

- **🔍 Transaction Decoding** - Rich transaction analysis with instruction decoding
- **🪙 Token Creation** - Token22 program integration with metadata support
- **🎨 NFT Minting** - Metaplex Core NFT creation with royalties and attributes
- **🏗️ Program Support** - Decoders for SPL Token, Token-2022, ATA, Metaplex, and System programs
- **📊 Account Analysis** - Automatic token account discovery and metadata fetching
- **⚡ RPC Management** - Optimized RPC client with retry logic and error handling
- **🔐 Type Safety** - Full TypeScript support with comprehensive type definitions
- **📚 Rich Documentation** - Extensive guides and examples

## 🚀 Quick Start

### Installation

```bash
npm install @gorbchain-xyz/chaindecode
```

### Basic Usage

```typescript
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode';

// Initialize the SDK
const sdk = new GorbchainSDK({
  rpcEndpoint: 'https://rpc.gorbchain.xyz',
  network: 'mainnet'
});

// Decode a transaction with rich analysis
const result = await sdk.getAndDecodeTransaction(
  '3K7XxugEXv8CBQCaL1ZYB7cgYiCGE4THakb23hw3Ltv1XsYDCNctCEivhwCLvtyrfo3gsS9tS3CPqX6kYTe4WqZn',
  {
    richDecoding: true,
    includeTokenMetadata: true,
    includeNftMetadata: true
  }
);

console.log('Decoded transaction:', result);
```

### Token Creation

```typescript
import { Keypair } from '@solana/web3.js';

const payer = Keypair.generate(); // Your keypair

// Create a new token with Token22 program
const tokenResult = await sdk.createToken22TwoTx(payer, {
  name: 'My Awesome Token',
  symbol: 'MAT',
  supply: 1000000,
  decimals: 6,
  uri: 'https://example.com/metadata.json'
});

console.log('Token created:', tokenResult.tokenAddress);
```

### NFT Creation

```typescript
// Create a new NFT with Metaplex Core
const nftResult = await sdk.createNFT(wallet, {
  name: 'Epic Digital Art',
  uri: 'https://example.com/nft-metadata.json',
  royaltyBasisPoints: 500, // 5% royalty
  attributes: [
    { trait_type: 'Rarity', value: 'Legendary' },
    { trait_type: 'Collection', value: 'Genesis' }
  ]
});

console.log('NFT created:', nftResult.assetAddress);
```

## 📖 Documentation

### Quick Reference
- **[📋 Quick Reference](./docs/quick-reference.md)** - Most common functions and usage patterns
- **[💡 Examples](./docs/examples.md)** - Real-world usage examples and patterns
- **[📚 SDK Reference](./docs/sdk-reference.md)** - Complete API documentation with signatures and responses

### Detailed Guides
- **[🪙 Token & NFT Minting Guide](./docs/minting.md)** - Comprehensive guide for creating tokens and NFTs
- **[🔍 Transaction Decoding](./docs/usage.md)** - Rich transaction analysis and instruction decoding
- **[🔌 Plugin Development](./docs/plugins.md)** - Creating custom instruction decoders
- **[📚 API Reference](./docs/api.md)** - Complete API documentation

## 🎯 Core Features

### Exported Functions Overview

| Category | Function | Purpose |
|----------|----------|---------|
| **Main SDK** | `GorbchainSDK` | Main SDK class with all functionality |
| **Transaction Decoding** | `getAndDecodeTransaction()` | Rich transaction analysis with metadata |
| | `decodeInstruction()` | Decode single instruction |
| | `decodeInstructions()` | Decode multiple instructions |
| **Token Creation** | `createToken22TwoTx()` | Create Token22 token (2 transactions) |
| | `createToken22SingleTx()` | Create Token22 token (1 transaction) |
| | `estimateTokenCreationCost()` | Estimate token creation cost |
| | `getTokenInfo()` | Get comprehensive token information |
| **NFT Creation** | `createNFT()` | Create NFT with Metaplex Core |
| | `estimateNFTCreationCost()` | Estimate NFT creation cost |
| **Balance Management** | `checkSufficientBalance()` | Check if account has sufficient funds |
| **Network** | `getNetworkHealth()` | Check network status and performance |
| | `getCurrentSlot()` | Get current slot number |
| | `getBlockHeight()` | Get current block height |
| **RPC Client** | `RpcClient` | Advanced RPC client with retry logic |
| **Utilities** | `base58ToBytes()` | Convert base58 to bytes |
| | `bytesToBase58()` | Convert bytes to base58 |
| | `base64ToHex()` | Convert base64 to hex |
| | `getGorbchainConfig()` | Get default configuration |

### Transaction Decoding

The SDK provides rich transaction decoding with automatic token account discovery:

```typescript
// Comprehensive transaction analysis
const analysis = await sdk.getAndDecodeTransaction(signature, {
  richDecoding: true,
  includeTokenMetadata: true,
  includeNftMetadata: true
});

// Access decoded instructions
analysis.instructions.forEach(instruction => {
  console.log(`Program: ${instruction.programName}`);
  console.log(`Type: ${instruction.decoded.type}`);
  console.log(`Description: ${instruction.decoded.description}`);
});

// Access token account information
Object.entries(analysis.tokenAccounts).forEach(([address, account]) => {
  console.log(`Token Account: ${address}`);
  console.log(`Type: ${account.type}`);
  console.log(`Data:`, account.data);
});
```

### Token Creation with Token22

Create tokens with advanced features using the Token22 program:

```typescript
// Two-transaction approach (recommended for reliability)
const result = await sdk.createToken22TwoTx(payer, {
  name: 'Governance Token',
  symbol: 'GOV',
  supply: 10000000,
  decimals: 9,
  uri: 'https://metadata.gorbchain.xyz/gov-token.json'
});

// Single transaction approach (faster)
const result2 = await sdk.createToken22SingleTx(payer, tokenParams);
```

### NFT Creation with Metaplex Core

Create NFTs with royalties, attributes, and metadata:

```typescript
const nft = await sdk.createNFT(wallet, {
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
});
```

### Cost Estimation and Balance Checking

```typescript
// Estimate costs before creation
const tokenCost = await sdk.estimateTokenCreationCost(tokenParams);
const nftCost = await sdk.estimateNFTCreationCost(nftParams);

// Check if user has sufficient balance
const balanceCheck = await sdk.checkSufficientBalance(
  payer.publicKey,
  tokenCost
);

if (!balanceCheck.sufficient) {
  console.log(`Need ${balanceCheck.required / 1e9} SOL, have ${balanceCheck.balance / 1e9} SOL`);
}
```

## 🏗️ Architecture

### Supported Programs

The SDK includes comprehensive decoders for:

- **System Program** (`11111111111111111111111111111111`)
- **SPL Token** (`TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`)
- **Token-2022** (`FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn`)
- **Associated Token Account** (`4YpYoLVTQ8bxcne9GneN85RUXeN7pqGTwgPcY71ZL5gX`)
- **Metaplex Core** (`BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc`)

### Configuration

```typescript
interface GorbchainConfig {
  rpcEndpoint: string;
  network: 'mainnet' | 'testnet' | 'devnet' | 'custom';
  timeout?: number;
  retries?: number;
  programIds?: {
    system?: string;
    splToken?: string;
    token2022?: string;
    ata?: string;
    metaplex?: string;
  };
  richDecoding?: {
    enabled?: boolean;
    includeTokenMetadata?: boolean;
    includeNftMetadata?: boolean;
  };
}
```

## 🛠️ Advanced Usage

### Custom Program Decoders

Extend the SDK with custom program decoders:

```typescript
import { DecoderRegistry } from '@gorbchain-xyz/chaindecode';

const registry = new DecoderRegistry();

// Register a custom decoder
registry.register('my-program', 'MyProgramId123...', (instruction) => ({
  type: 'my-custom-instruction',
  programId: instruction.programId,
  data: parseMyInstruction(instruction.data),
  accounts: instruction.accounts
}));

// Use with SDK
const sdk = new GorbchainSDK({
  rpcEndpoint: 'https://rpc.gorbchain.xyz',
  customDecoders: registry
});
```

### Batch Operations

```typescript
// Create multiple tokens
const tokens = await Promise.all([
  sdk.createToken22TwoTx(payer, tokenParams1),
  sdk.createToken22TwoTx(payer, tokenParams2),
  sdk.createToken22TwoTx(payer, tokenParams3)
]);

// Decode multiple transactions
const transactions = await Promise.all([
  sdk.getAndDecodeTransaction(sig1),
  sdk.getAndDecodeTransaction(sig2),
  sdk.getAndDecodeTransaction(sig3)
]);
```

### Error Handling

```typescript
try {
  const result = await sdk.createToken22TwoTx(payer, tokenParams);
} catch (error) {
  if (error.message.includes('Insufficient')) {
    console.error('💸 Add more SOL to your wallet');
  } else if (error.message.includes('Invalid')) {
    console.error('📝 Check your token parameters');
  } else {
    console.error('❌ Unexpected error:', error.message);
  }
}
```

## 🧪 Testing

### Run Tests

```bash
npm test
```

### Example Test Cases

```typescript
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode';

describe('Token Creation', () => {
  test('creates token with valid parameters', async () => {
    const sdk = new GorbchainSDK({ rpcEndpoint: 'http://localhost:8899' });
    const result = await sdk.createToken22TwoTx(payer, validTokenParams);
    
    expect(result.signature).toBeDefined();
    expect(result.tokenAddress).toBeDefined();
  });
});
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/gorbchain/sdk.git
cd sdk

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **🌐 Gorbchain Network**: [https://gorbchain.xyz](https://gorbchain.xyz)
- **🚀 Token Launchpad**: [https://launch.gorbchain.xyz](https://launch.gorbchain.xyz)
- **📚 Documentation**: [https://docs.gorbchain.xyz](https://docs.gorbchain.xyz)
- **💬 Discord**: [https://discord.gg/gorbchain](https://discord.gg/gorbchain)
- **🐦 Twitter**: [@GorbChain](https://twitter.com/GorbChain)

---

*Built with ❤️ by the Gorbchain team. The minting functionality is based on the proven implementation from the [Gorbagana Token LaunchPad](https://launch.gorbchain.xyz).*
