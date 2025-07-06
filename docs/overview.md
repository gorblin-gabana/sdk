# Gorbchain SDK Overview

## Summary

The Gorbchain SDK (`@gorbchain-xyz/chaindecode`) is a comprehensive TypeScript SDK that provides:

1. **Transaction Decoding** - Rich analysis of blockchain transactions with instruction decoding
2. **Token Creation** - Token22 program integration for creating tokens with metadata
3. **NFT Minting** - Metaplex Core NFT creation with royalties and attributes
4. **RPC Management** - Optimized RPC client with retry logic and error handling
5. **Utility Functions** - Helper functions for common blockchain operations

## Installation

```bash
npm install @gorbchain-xyz/chaindecode
```

## Core Export Categories

### 1. Main SDK Class

#### `GorbchainSDK`
The primary class that provides all SDK functionality.

**Key Methods:**
- `getAndDecodeTransaction()` - Rich transaction analysis
- `decodeInstruction()` - Decode single instruction
- `decodeInstructions()` - Decode multiple instructions
- `getNetworkHealth()` - Check network status
- `getCurrentSlot()` - Get current slot
- `getBlockHeight()` - Get block height
- `registerDecoder()` - Register custom decoder
- `getSupportedPrograms()` - List supported programs

### 2. Token Creation Functions

#### Core Functions:
- `createToken22TwoTx()` - Create Token22 token (2 transactions, more reliable)
- `createToken22SingleTx()` - Create Token22 token (1 transaction, faster)
- `estimateTokenCreationCost()` - Estimate creation cost
- `getTokenInfo()` - Get token information

#### Helper Functions:
- `validateTokenParameters()` - Validate token parameters
- `calculateMetadataSpace()` - Calculate metadata space
- `calculateMintAccountSize()` - Calculate mint account size

### 3. NFT Creation Functions

#### Core Functions:
- `createNFT()` - Create NFT with Metaplex Core
- `estimateNFTCreationCost()` - Estimate NFT creation cost

#### Helper Functions:
- `validateNFTParameters()` - Validate NFT parameters

### 4. Balance and Cost Management

#### Functions:
- `checkSufficientBalance()` - Check account balance
- `sendTransactionWithRetry()` - Send transaction with retry logic

### 5. RPC Client

#### `RpcClient` Class:
- `request()` - Make RPC request
- `getHealth()` - Get RPC health
- `getSlot()` - Get current slot
- `getBlockHeight()` - Get block height
- `getVersion()` - Get RPC version
- `getAccountInfo()` - Get account info
- `getTokenAccountInfo()` - Get token account info
- `getMintInfo()` - Get mint info
- `getTokenMetadata()` - Get token metadata
- `isNFT()` - Check if mint is NFT
- `getTokenInfo()` - Get comprehensive token info

### 6. Decoder System

#### `DecoderRegistry` Class:
- `register()` - Register decoder
- `decode()` - Decode instruction
- `hasDecoder()` - Check if decoder exists
- `getRegisteredPrograms()` - Get registered programs

### 7. Transaction Utilities

#### Functions:
- `getAndDecodeTransaction()` - Fetch and decode transaction
- `fetchTransactionBySignature()` - Fetch transaction by signature
- `decodeInstructions()` - Decode multiple instructions

### 8. Utility Functions

#### Conversion Functions:
- `base58ToBytes()` - Convert base58 to bytes
- `bytesToBase58()` - Convert bytes to base58
- `base64ToHex()` - Convert base64 to hex

#### Configuration Functions:
- `getGorbchainConfig()` - Get default configuration

## Type Definitions

### Core Types:
- `GorbchainSDKConfig` - SDK configuration
- `RichTransaction` - Rich transaction object
- `RichInstruction` - Rich instruction object
- `TransactionDecodingOptions` - Decoding options
- `DecodedInstruction` - Decoded instruction
- `DecoderFunction` - Decoder function signature

### Token Types:
- `TokenCreationParams` - Token creation parameters
- `TokenMintResult` - Token creation result
- `TransactionOptions` - Transaction options

### NFT Types:
- `NFTCreationParams` - NFT creation parameters
- `NFTMintResult` - NFT creation result

## Program IDs

### Supported Programs:
- **System Program**: `11111111111111111111111111111111`
- **SPL Token**: `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`
- **Token-2022**: `FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn`
- **Associated Token Account**: `4YpYoLVTQ8bxcne9GneN85RUXeN7pqGTwgPcY71ZL5gX`
- **Metaplex Core**: `BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc`

## Error Handling

### Error Types:
- `RpcNetworkError` - Network-related errors
- `RpcTimeoutError` - Request timeout errors
- `RpcServerError` - Server-side errors
- `RpcConnectionError` - Connection errors
- `RpcInvalidResponseError` - Invalid response errors
- `RpcRateLimitError` - Rate limiting errors
- `RpcMethodNotSupportedError` - Unsupported method errors

## Usage Patterns

### 1. Basic SDK Usage
```typescript
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode';

const sdk = new GorbchainSDK({
  rpcEndpoint: 'https://rpc.gorbchain.xyz',
  network: 'mainnet',
  richDecoding: { enabled: true }
});
```

### 2. Transaction Decoding
```typescript
const richTx = await sdk.getAndDecodeTransaction('signature...');
console.log(richTx.instructions[0].decoded.type);
```

### 3. Token Creation
```typescript
import { createToken22TwoTx } from '@gorbchain-xyz/chaindecode';

const result = await createToken22TwoTx(payer, {
  name: 'My Token',
  symbol: 'MTK',
  supply: 1000000,
  decimals: 6
});
```

### 4. NFT Creation
```typescript
import { createNFT } from '@gorbchain-xyz/chaindecode';

const result = await createNFT(wallet, {
  name: 'My NFT',
  uri: 'https://example.com/metadata.json'
});
```

### 5. Balance Checking
```typescript
import { checkSufficientBalance } from '@gorbchain-xyz/chaindecode';

const balanceCheck = await checkSufficientBalance(
  payer.publicKey,
  estimatedCost
);
```

## Documentation Structure

### Quick Start:
- **[Quick Reference](./quick-reference.md)** - Most common functions
- **[Examples](./examples.md)** - Real-world usage patterns

### Comprehensive Reference:
- **[SDK Reference](./sdk-reference.md)** - Complete API documentation
- **[API Reference](./api.md)** - Detailed API documentation

### Specialized Guides:
- **[Minting Guide](./minting.md)** - Token and NFT creation
- **[Usage Guide](./usage.md)** - Transaction decoding
- **[Plugin Development](./plugins.md)** - Custom decoders

## Best Practices

### 1. Error Handling
Always wrap RPC calls in try-catch blocks and handle specific error types.

### 2. Resource Management
Check balance before operations and estimate costs upfront.

### 3. Batch Operations
Use batch functions for multiple operations to avoid rate limiting.

### 4. Custom Decoders
Register custom decoders for your specific program needs.

### 5. Configuration
Use environment variables for configuration in production.

## Response Formats

### Common Response Types:

#### TokenMintResult
```typescript
{
  signature: string;
  tokenAddress: string;
  associatedTokenAddress: string;
  transactionUrl?: string;
}
```

#### NFTMintResult
```typescript
{
  signature: string;
  assetAddress: string;
  transactionUrl?: string;
}
```

#### RichTransaction
```typescript
{
  signature: string;
  slot: number;
  blockTime: number | null;
  fee: number;
  status: 'success' | 'failed';
  instructions: RichInstruction[];
  accountKeys: string[];
  // ... additional fields
}
```

#### DecodedInstruction
```typescript
{
  type: string;
  programId: string;
  data: any;
  accounts: any[];
  raw?: any;
}
```

## Getting Help

- Check the [Examples](./examples.md) for real-world usage patterns
- Review the [SDK Reference](./sdk-reference.md) for complete API documentation
- Look at the [Quick Reference](./quick-reference.md) for common functions
- See the test files for additional usage examples

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on contributing to the SDK. 