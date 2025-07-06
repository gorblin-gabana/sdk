# Gorbchain SDK Reference Documentation

## Overview

The Gorbchain SDK (`@gorbchain-xyz/chaindecode`) provides a comprehensive solution for interacting with the Gorbchain network, including transaction decoding, RPC communication, token minting, and NFT creation.

## Installation

```bash
npm install @gorbchain-xyz/chaindecode
```

## Core Exports

### Primary Classes
- [`GorbchainSDK`](#gorbchainsdk-class) - Main SDK class
- [`RpcClient`](#rpcclient-class) - RPC communication client
- [`DecoderRegistry`](#decoderregistry-class) - Instruction decoder registry

### Function Categories
- [Minting Functions](#minting-functions) - Token and NFT creation
- [Transaction Utilities](#transaction-utilities) - Transaction processing
- [Decoder Functions](#decoder-functions) - Instruction decoding
- [Utility Functions](#utility-functions) - Helper functions

---

## GorbchainSDK Class

### Constructor

```typescript
constructor(config?: Partial<GorbchainSDKConfig>)
```

**Parameters:**
- `config` - Optional configuration object

**Example:**
```typescript
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode';

// Initialize with defaults
const sdk = new GorbchainSDK();

// Initialize with custom configuration
const sdk = new GorbchainSDK({
  rpcEndpoint: 'https://rpc.gorbchain.xyz',
  network: 'mainnet',
  timeout: 30000,
  retries: 3,
  programIds: {
    splToken: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    token2022: 'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn'
  },
  richDecoding: {
    enabled: true,
    includeTokenMetadata: true,
    includeNftMetadata: true
  }
});
```

**Response:**
```typescript
interface GorbchainSDKConfig {
  rpcEndpoint: string;
  network: 'mainnet' | 'testnet' | 'devnet' | 'custom';
  timeout?: number;
  retries?: number;
  programIds?: { [key: string]: string };
  richDecoding?: {
    enabled?: boolean;
    includeTokenMetadata?: boolean;
    includeNftMetadata?: boolean;
    maxConcurrentRequests?: number;
    enableCache?: boolean;
  };
}
```

### Instance Properties

- `config: GorbchainSDKConfig` - SDK configuration
- `decoders: DecoderRegistry` - Instruction decoder registry
- `rpc: RpcClient` - RPC client instance
- `transactions: any` - Transaction utilities (placeholder)

### Core Methods

#### `decodeInstruction(instruction: any): DecodedInstruction`

Decodes a single blockchain instruction.

**Parameters:**
- `instruction` - Raw instruction object

**Example:**
```typescript
const instruction = {
  programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  data: new Uint8Array([3, 0, 0, 0, 0, 0, 0, 0, 100]), // Transfer instruction
  accounts: ['source', 'destination', 'authority']
};

const decoded = sdk.decodeInstruction(instruction);
```

**Response:**
```typescript
interface DecodedInstruction {
  type: string;           // e.g., 'spl-token-transfer'
  programId: string;      // Program ID
  data: any;             // Parsed instruction data
  accounts: any[];       // Account information
  raw?: any;             // Original instruction
}
```

#### `decodeInstructions(instructions: any[]): DecodedInstruction[]`

Decodes multiple instructions in batch.

**Parameters:**
- `instructions` - Array of raw instruction objects

**Example:**
```typescript
const instructions = [instruction1, instruction2, instruction3];
const decoded = sdk.decodeInstructions(instructions);
```

**Response:**
```typescript
DecodedInstruction[]
```

#### `getAndDecodeTransaction(signature: string, options?: TransactionDecodingOptions): Promise<RichTransaction>`

Fetches and decodes a transaction with comprehensive analysis.

**Parameters:**
- `signature` - Transaction signature
- `options` - Optional decoding options

**Example:**
```typescript
const richTransaction = await sdk.getAndDecodeTransaction(
  'signature123...',
  {
    richDecoding: true,
    includeTokenMetadata: true,
    includeNftMetadata: true
  }
);
```

**Response:**
```typescript
interface RichTransaction {
  signature: string;
  slot: number;
  blockTime: number | null;
  fee: number;
  status: 'success' | 'failed';
  error?: string;
  instructions: RichInstruction[];
  accountKeys: string[];
  meta: any;
  tokenAccounts?: Record<string, any>;
  accountInfoMap?: Record<string, any>;
}
```

#### `getNetworkHealth(): Promise<NetworkHealth>`

Checks network health and performance.

**Example:**
```typescript
const health = await sdk.getNetworkHealth();
```

**Response:**
```typescript
interface NetworkHealth {
  status: 'healthy' | 'degraded' | 'unavailable';
  currentSlot: number;
  blockHeight: number;
  epochInfo: any;
  version: any;
  rpcEndpoint: string;
  responseTime: number;
}
```

#### `getCurrentSlot(commitment?: string): Promise<number>`

Gets the current slot number.

**Parameters:**
- `commitment` - Optional commitment level ('processed' | 'confirmed' | 'finalized')

**Example:**
```typescript
const slot = await sdk.getCurrentSlot('confirmed');
```

**Response:**
```typescript
number // Current slot number
```

#### `getBlockHeight(commitment?: string): Promise<number>`

Gets the current block height.

**Parameters:**
- `commitment` - Optional commitment level

**Example:**
```typescript
const height = await sdk.getBlockHeight('finalized');
```

**Response:**
```typescript
number // Current block height
```

#### `getLatestBlockhash(commitment?: string): Promise<BlockhashInfo>`

Gets the latest blockhash.

**Parameters:**
- `commitment` - Optional commitment level

**Example:**
```typescript
const blockhash = await sdk.getLatestBlockhash();
```

**Response:**
```typescript
interface BlockhashInfo {
  blockhash: string;
  lastValidBlockHeight: number;
}
```

#### `registerDecoder(programName: string, programId: string, decoder: DecoderFunction): void`

Registers a custom instruction decoder.

**Parameters:**
- `programName` - Human-readable program name
- `programId` - Program's public key address
- `decoder` - Decoder function

**Example:**
```typescript
sdk.registerDecoder(
  'my-program',
  'ProgramId123...',
  (instruction) => ({
    type: 'custom-action',
    programId: instruction.programId,
    data: parseCustomData(instruction.data),
    accounts: instruction.accounts
  })
);
```

#### `getSupportedPrograms(): string[]`

Gets list of supported programs.

**Example:**
```typescript
const programs = sdk.getSupportedPrograms();
// ['spl-token', 'token-2022', 'ata', 'nft', 'system']
```

#### `getRpcClient(): RpcClient`

Gets the RPC client instance.

**Example:**
```typescript
const rpc = sdk.getRpcClient();
```

#### `setRpcEndpoint(url: string): void`

Updates the RPC endpoint.

**Parameters:**
- `url` - New RPC endpoint URL

**Example:**
```typescript
sdk.setRpcEndpoint('https://new-rpc.gorbchain.xyz');
```

#### `setRichDecoding(enabled: boolean, options?: RichDecodingOptions): void`

Configures rich decoding options.

**Parameters:**
- `enabled` - Enable/disable rich decoding
- `options` - Optional rich decoding configuration

**Example:**
```typescript
sdk.setRichDecoding(true, {
  includeTokenMetadata: true,
  includeNftMetadata: true,
  maxConcurrentRequests: 10
});
```

---

## RpcClient Class

### Constructor

```typescript
constructor(options?: RpcClientOptions)
```

**Parameters:**
- `options` - Optional RPC client configuration

**Example:**
```typescript
import { RpcClient } from '@gorbchain-xyz/chaindecode';

const rpc = new RpcClient({
  rpcUrl: 'https://rpc.gorbchain.xyz',
  timeout: 30000,
  retries: 3
});
```

### RPC Methods

#### `request<T>(method: string, params?: any[]): Promise<T>`

Makes a raw RPC request.

**Parameters:**
- `method` - RPC method name
- `params` - Optional method parameters

**Example:**
```typescript
const result = await rpc.request('getSlot');
```

#### `getHealth(): Promise<string>`

Gets RPC health status.

**Example:**
```typescript
const health = await rpc.getHealth();
// 'ok'
```

#### `getSlot(commitment?: string): Promise<number>`

Gets current slot.

**Example:**
```typescript
const slot = await rpc.getSlot('confirmed');
```

#### `getBlockHeight(commitment?: string): Promise<number>`

Gets current block height.

**Example:**
```typescript
const height = await rpc.getBlockHeight();
```

#### `getVersion(): Promise<VersionInfo>`

Gets RPC version information.

**Example:**
```typescript
const version = await rpc.getVersion();
```

**Response:**
```typescript
interface VersionInfo {
  'solana-core': string;
  'feature-set'?: number;
}
```

#### `getAccountInfo(address: string, commitment?: string): Promise<AccountInfo | null>`

Gets account information.

**Parameters:**
- `address` - Account address
- `commitment` - Optional commitment level

**Example:**
```typescript
const accountInfo = await rpc.getAccountInfo('account123...');
```

**Response:**
```typescript
interface AccountInfo {
  lamports: number;
  owner: string;
  executable: boolean;
  rentEpoch: number;
  data: [string, string]; // [base64, encoding]
}
```

#### `getTokenAccountInfo(address: string, commitment?: string): Promise<TokenAccountInfo | null>`

Gets token account information.

**Parameters:**
- `address` - Token account address
- `commitment` - Optional commitment level

**Example:**
```typescript
const tokenInfo = await rpc.getTokenAccountInfo('tokenAccount123...');
```

**Response:**
```typescript
interface TokenAccountInfo {
  mint: string;
  owner: string;
  tokenAmount: {
    amount: string;
    decimals: number;
    uiAmount: number;
    uiAmountString: string;
  };
}
```

#### `getMintInfo(mintAddress: string, commitment?: string): Promise<MintInfo | null>`

Gets mint account information.

**Parameters:**
- `mintAddress` - Mint account address
- `commitment` - Optional commitment level

**Example:**
```typescript
const mintInfo = await rpc.getMintInfo('mint123...');
```

**Response:**
```typescript
interface MintInfo {
  supply: string;
  decimals: number;
  isInitialized: boolean;
  mintAuthority: string | null;
  freezeAuthority: string | null;
}
```

#### `getTokenMetadata(mintAddress: string, commitment?: string): Promise<TokenMetadata | null>`

Gets token metadata.

**Parameters:**
- `mintAddress` - Mint address
- `commitment` - Optional commitment level

**Example:**
```typescript
const metadata = await rpc.getTokenMetadata('mint123...');
```

**Response:**
```typescript
interface TokenMetadata {
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators: Array<{
    address: string;
    verified: boolean;
    share: number;
  }>;
  collection?: {
    verified: boolean;
    key: string;
  };
}
```

#### `isNFT(mintAddress: string, commitment?: string): Promise<boolean>`

Checks if mint is an NFT.

**Parameters:**
- `mintAddress` - Mint address
- `commitment` - Optional commitment level

**Example:**
```typescript
const isNFT = await rpc.isNFT('mint123...');
```

---

## Minting Functions

### `createToken22TwoTx(payer: Keypair, params: TokenCreationParams, options?: TransactionOptions): Promise<TokenMintResult>`

Creates a Token-2022 token using two transactions (more reliable).

**Parameters:**
- `payer` - Keypair that will pay for the transaction
- `params` - Token creation parameters
- `options` - Optional transaction options

**Example:**
```typescript
import { createToken22TwoTx } from '@gorbchain-xyz/chaindecode';
import { Keypair } from '@solana/web3.js';

const payer = Keypair.generate();
const result = await createToken22TwoTx(payer, {
  name: 'My Token',
  symbol: 'MTK',
  supply: 1000000,
  decimals: 6,
  uri: 'https://example.com/metadata.json',
  description: 'My awesome token'
});
```

**Response:**
```typescript
interface TokenMintResult {
  signature: string;
  tokenAddress: string;
  associatedTokenAddress: string;
  transactionUrl?: string;
}
```

### `createToken22SingleTx(payer: Keypair, params: TokenCreationParams, options?: TransactionOptions): Promise<TokenMintResult>`

Creates a Token-2022 token using a single transaction (faster but less reliable).

**Parameters:**
- `payer` - Keypair that will pay for the transaction
- `params` - Token creation parameters
- `options` - Optional transaction options

**Example:**
```typescript
const result = await createToken22SingleTx(payer, {
  name: 'Quick Token',
  symbol: 'QTK',
  supply: 500000,
  decimals: 9
});
```

**Response:**
```typescript
TokenMintResult
```

### `createNFT(wallet: any, params: NFTCreationParams, options?: TransactionOptions): Promise<NFTMintResult>`

Creates an NFT using Metaplex Core.

**Parameters:**
- `wallet` - Wallet adapter instance
- `params` - NFT creation parameters
- `options` - Optional transaction options

**Example:**
```typescript
import { createNFT } from '@gorbchain-xyz/chaindecode';

const result = await createNFT(wallet, {
  name: 'My NFT',
  uri: 'https://example.com/nft-metadata.json',
  description: 'My awesome NFT',
  royaltyBasisPoints: 500, // 5%
  creators: [
    { address: 'creator1...', percentage: 70 },
    { address: 'creator2...', percentage: 30 }
  ],
  attributes: [
    { trait_type: 'Color', value: 'Blue' },
    { trait_type: 'Rarity', value: 'Legendary' }
  ]
});
```

**Response:**
```typescript
interface NFTMintResult {
  signature: string;
  assetAddress: string;
  transactionUrl?: string;
}
```

### `checkSufficientBalance(payer: PublicKey, estimatedCost: number): Promise<BalanceCheck>`

Checks if account has sufficient balance for operation.

**Parameters:**
- `payer` - Account to check
- `estimatedCost` - Estimated cost in lamports

**Example:**
```typescript
import { checkSufficientBalance } from '@gorbchain-xyz/chaindecode';

const balanceCheck = await checkSufficientBalance(
  payer.publicKey,
  1000000 // 0.001 SOL
);
```

**Response:**
```typescript
interface BalanceCheck {
  sufficient: boolean;
  balance: number;
  required: number;
}
```

### `estimateTokenCreationCost(params: TokenCreationParams): Promise<number>`

Estimates the cost of token creation.

**Parameters:**
- `params` - Token creation parameters

**Example:**
```typescript
import { estimateTokenCreationCost } from '@gorbchain-xyz/chaindecode';

const cost = await estimateTokenCreationCost({
  name: 'My Token',
  symbol: 'MTK',
  supply: 1000000,
  decimals: 6
});
```

**Response:**
```typescript
number // Cost in lamports
```

### `estimateNFTCreationCost(params: NFTCreationParams): Promise<number>`

Estimates the cost of NFT creation.

**Parameters:**
- `params` - NFT creation parameters

**Example:**
```typescript
import { estimateNFTCreationCost } from '@gorbchain-xyz/chaindecode';

const cost = await estimateNFTCreationCost({
  name: 'My NFT',
  uri: 'https://example.com/metadata.json'
});
```

**Response:**
```typescript
number // Cost in lamports
```

### `getTokenInfo(mintAddress: string): Promise<TokenInfo>`

Gets comprehensive token information.

**Parameters:**
- `mintAddress` - Token mint address

**Example:**
```typescript
import { getTokenInfo } from '@gorbchain-xyz/chaindecode';

const tokenInfo = await getTokenInfo('mint123...');
```

**Response:**
```typescript
interface TokenInfo {
  mint: string;
  supply: string;
  decimals: number;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  metadata?: {
    name: string;
    symbol: string;
    uri: string;
  };
}
```

---

## Transaction Utilities

### `getAndDecodeTransaction(signature: string, registry: DecoderRegistry, connection: Connection): Promise<DecodedTransaction>`

Fetches and decodes a transaction.

**Parameters:**
- `signature` - Transaction signature
- `registry` - Decoder registry
- `connection` - RPC connection

**Example:**
```typescript
import { getAndDecodeTransaction } from '@gorbchain-xyz/chaindecode';

const decoded = await getAndDecodeTransaction({
  signature: 'signature123...',
  registry: sdk.decoders,
  connection: rpc
});
```

**Response:**
```typescript
interface DecodedTransaction {
  decoded: DecodedInstruction[];
  meta: any;
}
```

### `fetchTransactionBySignature(connection: Connection, signature: string): Promise<Transaction>`

Fetches a transaction by signature.

**Parameters:**
- `connection` - RPC connection
- `signature` - Transaction signature

**Example:**
```typescript
import { fetchTransactionBySignature } from '@gorbchain-xyz/chaindecode';

const transaction = await fetchTransactionBySignature(connection, 'signature123...');
```

---

## Decoder Functions

### `decodeInstructions(instructions: any[]): DecodedInstruction[]`

Decodes multiple instructions using the default registry.

**Parameters:**
- `instructions` - Array of raw instructions

**Example:**
```typescript
import { decodeInstructions } from '@gorbchain-xyz/chaindecode';

const decoded = decodeInstructions([instruction1, instruction2]);
```

**Response:**
```typescript
DecodedInstruction[]
```

---

## Utility Functions

### `base58ToBytes(base58: string): Uint8Array`

Converts base58 string to bytes.

**Parameters:**
- `base58` - Base58 encoded string

**Example:**
```typescript
import { base58ToBytes } from '@gorbchain-xyz/chaindecode';

const bytes = base58ToBytes('base58string...');
```

**Response:**
```typescript
Uint8Array
```

### `bytesToBase58(bytes: Uint8Array): string`

Converts bytes to base58 string.

**Parameters:**
- `bytes` - Byte array

**Example:**
```typescript
import { bytesToBase58 } from '@gorbchain-xyz/chaindecode';

const base58 = bytesToBase58(new Uint8Array([1, 2, 3, 4]));
```

**Response:**
```typescript
string
```

### `base64ToHex(base64: string): string`

Converts base64 string to hex.

**Parameters:**
- `base64` - Base64 encoded string

**Example:**
```typescript
import { base64ToHex } from '@gorbchain-xyz/chaindecode';

const hex = base64ToHex('base64string...');
```

**Response:**
```typescript
string
```

### `getGorbchainConfig(): GorbchainConfig`

Gets the default Gorbchain configuration.

**Example:**
```typescript
import { getGorbchainConfig } from '@gorbchain-xyz/chaindecode';

const config = getGorbchainConfig();
```

**Response:**
```typescript
interface GorbchainConfig {
  rpcUrl: string;
  programIds: Record<string, string>;
  // ... other config options
}
```

---

## Type Definitions

### Core Types

```typescript
interface GorbchainSDKConfig {
  rpcEndpoint: string;
  network: 'mainnet' | 'testnet' | 'devnet' | 'custom';
  timeout?: number;
  retries?: number;
  programIds?: Record<string, string>;
  richDecoding?: RichDecodingOptions;
}

interface RichDecodingOptions {
  enabled?: boolean;
  includeTokenMetadata?: boolean;
  includeNftMetadata?: boolean;
  maxConcurrentRequests?: number;
  enableCache?: boolean;
}

interface TokenCreationParams {
  name: string;
  symbol: string;
  supply: number;
  decimals: number;
  uri?: string;
  description?: string;
}

interface NFTCreationParams {
  name: string;
  uri: string;
  description?: string;
  royaltyBasisPoints?: number;
  creators?: Array<{
    address: string;
    percentage: number;
  }>;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
}

interface TransactionOptions {
  commitment?: 'processed' | 'confirmed' | 'finalized';
  maxRetries?: number;
  skipPreflight?: boolean;
}

interface DecodedInstruction {
  type: string;
  programId: string;
  data: any;
  accounts: any[];
  raw?: any;
}

interface RichTransaction {
  signature: string;
  slot: number;
  blockTime: number | null;
  fee: number;
  status: 'success' | 'failed';
  error?: string;
  instructions: RichInstruction[];
  accountKeys: string[];
  meta: any;
  tokenAccounts?: Record<string, any>;
  accountInfoMap?: Record<string, any>;
}

interface RichInstruction {
  index: number;
  programId: string;
  programName?: string;
  data: string;
  accounts: string[];
  decoded: {
    type: string;
    description: string;
    data?: any;
    tokenMetadata?: any;
    nftMetadata?: any;
  };
}

interface TransactionDecodingOptions {
  richDecoding?: boolean;
  includeTokenMetadata?: boolean;
  includeNftMetadata?: boolean;
  customRegistry?: any;
}
```

---

## Error Handling

The SDK provides comprehensive error handling with specific error types:

- `RpcNetworkError` - Network-related errors
- `RpcTimeoutError` - Request timeout errors
- `RpcServerError` - Server-side errors
- `RpcConnectionError` - Connection errors
- `RpcInvalidResponseError` - Invalid response errors
- `RpcRateLimitError` - Rate limiting errors
- `RpcMethodNotSupportedError` - Unsupported method errors

**Example Error Handling:**
```typescript
try {
  const result = await sdk.getAndDecodeTransaction('signature123...');
} catch (error) {
  if (error instanceof RpcTimeoutError) {
    console.log('Request timed out');
  } else if (error instanceof RpcNetworkError) {
    console.log('Network error:', error.message);
  } else {
    console.log('Other error:', error);
  }
}
```

---

## Best Practices

### 1. **Initialization**
```typescript
// Initialize with proper configuration
const sdk = new GorbchainSDK({
  rpcEndpoint: process.env.RPC_ENDPOINT || 'https://rpc.gorbchain.xyz',
  network: 'mainnet',
  timeout: 30000,
  retries: 3,
  richDecoding: {
    enabled: true,
    includeTokenMetadata: true
  }
});
```

### 2. **Error Handling**
```typescript
// Always wrap RPC calls in try-catch
try {
  const result = await sdk.getAndDecodeTransaction(signature);
} catch (error) {
  console.error('Transaction decoding failed:', error);
}
```

### 3. **Custom Decoders**
```typescript
// Register custom decoders for your programs
sdk.registerDecoder('my-program', 'ProgramId123...', (instruction) => {
  // Your decoding logic
  return {
    type: 'my-instruction',
    programId: instruction.programId,
    data: parseMyData(instruction.data),
    accounts: instruction.accounts
  };
});
```

### 4. **Batch Operations**
```typescript
// Use batch operations for multiple instructions
const decoded = sdk.decodeInstructions(instructions);
```

### 5. **Resource Management**
```typescript
// Check balance before operations
const balanceCheck = await checkSufficientBalance(payer.publicKey, estimatedCost);
if (!balanceCheck.sufficient) {
  throw new Error(`Insufficient balance: ${balanceCheck.balance} < ${balanceCheck.required}`);
}
```

---

## Examples

### Complete Token Creation Example
```typescript
import { GorbchainSDK, createToken22TwoTx, checkSufficientBalance } from '@gorbchain-xyz/chaindecode';
import { Keypair } from '@solana/web3.js';

async function createMyToken() {
  const sdk = new GorbchainSDK();
  const payer = Keypair.generate();
  
  // Estimate cost
  const cost = await sdk.estimateTokenCreationCost({
    name: 'My Token',
    symbol: 'MTK',
    supply: 1000000,
    decimals: 6
  });
  
  // Check balance
  const balanceCheck = await checkSufficientBalance(payer.publicKey, cost);
  if (!balanceCheck.sufficient) {
    throw new Error('Insufficient balance');
  }
  
  // Create token
  const result = await createToken22TwoTx(payer, {
    name: 'My Token',
    symbol: 'MTK',
    supply: 1000000,
    decimals: 6,
    uri: 'https://example.com/metadata.json'
  });
  
  console.log('Token created:', result.tokenAddress);
  return result;
}
```

### Transaction Decoding Example
```typescript
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode';

async function analyzeTransaction(signature: string) {
  const sdk = new GorbchainSDK({
    richDecoding: {
      enabled: true,
      includeTokenMetadata: true,
      includeNftMetadata: true
    }
  });
  
  const richTransaction = await sdk.getAndDecodeTransaction(signature);
  
  console.log('Transaction Analysis:');
  console.log('- Signature:', richTransaction.signature);
  console.log('- Status:', richTransaction.status);
  console.log('- Fee:', richTransaction.fee);
  console.log('- Instructions:', richTransaction.instructions.length);
  
  richTransaction.instructions.forEach((instruction, index) => {
    console.log(`  ${index + 1}. ${instruction.decoded.type}: ${instruction.decoded.description}`);
  });
  
  return richTransaction;
}
```

This comprehensive reference covers all the exported functions, their signatures, usage patterns, and expected responses. The documentation includes practical examples and best practices for using the Gorbchain SDK effectively. 