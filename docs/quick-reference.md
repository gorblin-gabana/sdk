# Gorbchain SDK Quick Reference

## Installation

```bash
npm install @gorbchain-xyz/chaindecode
```

## Quick Start

```typescript
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode';

const sdk = new GorbchainSDK({
  rpcEndpoint: 'https://rpc.gorbchain.xyz',
  network: 'mainnet'
});
```

## Most Common Functions

### 1. Initialize SDK
```typescript
const sdk = new GorbchainSDK({
  rpcEndpoint: 'https://rpc.gorbchain.xyz',
  network: 'mainnet',
  richDecoding: { enabled: true }
});
```

### 2. Decode Transaction
```typescript
const richTx = await sdk.getAndDecodeTransaction('signature123...');
console.log(richTx.instructions[0].decoded.type); // 'spl-token-transfer'
```

### 3. Create Token
```typescript
import { createToken22TwoTx } from '@gorbchain-xyz/chaindecode';

const result = await createToken22TwoTx(payer, {
  name: 'My Token',
  symbol: 'MTK',
  supply: 1000000,
  decimals: 6
});
```

### 4. Create NFT
```typescript
import { createNFT } from '@gorbchain-xyz/chaindecode';

const result = await createNFT(wallet, {
  name: 'My NFT',
  uri: 'https://example.com/metadata.json'
});
```

### 5. Check Network Health
```typescript
const health = await sdk.getNetworkHealth();
console.log(health.status); // 'healthy' | 'degraded' | 'unavailable'
```

### 6. Decode Single Instruction
```typescript
const decoded = sdk.decodeInstruction(instruction);
console.log(decoded.type); // 'spl-token-transfer'
```

### 7. Get Token Info
```typescript
import { getTokenInfo } from '@gorbchain-xyz/chaindecode';

const tokenInfo = await getTokenInfo('mintAddress123...');
console.log(tokenInfo.supply, tokenInfo.decimals);
```

### 8. Check Balance
```typescript
import { checkSufficientBalance } from '@gorbchain-xyz/chaindecode';

const balanceCheck = await checkSufficientBalance(payer.publicKey, 1000000);
console.log(balanceCheck.sufficient); // true/false
```

### 9. Estimate Costs
```typescript
import { estimateTokenCreationCost, estimateNFTCreationCost } from '@gorbchain-xyz/chaindecode';

const tokenCost = await estimateTokenCreationCost(params);
const nftCost = await estimateNFTCreationCost(params);
```

### 10. Register Custom Decoder
```typescript
sdk.registerDecoder('my-program', 'ProgramId123...', (instruction) => ({
  type: 'my-custom-instruction',
  programId: instruction.programId,
  data: parseMyData(instruction.data),
  accounts: instruction.accounts
}));
```

## Response Types

### TokenMintResult
```typescript
{
  signature: string;
  tokenAddress: string;
  associatedTokenAddress: string;
  transactionUrl?: string;
}
```

### NFTMintResult
```typescript
{
  signature: string;
  assetAddress: string;
  transactionUrl?: string;
}
```

### RichTransaction
```typescript
{
  signature: string;
  slot: number;
  blockTime: number | null;
  fee: number;
  status: 'success' | 'failed';
  instructions: RichInstruction[];
  accountKeys: string[];
  // ... more fields
}
```

### DecodedInstruction
```typescript
{
  type: string;           // 'spl-token-transfer'
  programId: string;      // Program ID
  data: any;             // Parsed data
  accounts: any[];       // Account info
}
```

## Error Handling

```typescript
try {
  const result = await sdk.getAndDecodeTransaction(signature);
} catch (error) {
  if (error instanceof RpcTimeoutError) {
    console.log('Request timed out');
  } else if (error instanceof RpcNetworkError) {
    console.log('Network error');
  }
}
```

## Common Patterns

### Batch Decode Instructions
```typescript
const decoded = sdk.decodeInstructions([inst1, inst2, inst3]);
```

### Rich Transaction Analysis
```typescript
const richTx = await sdk.getAndDecodeTransaction(signature, {
  richDecoding: true,
  includeTokenMetadata: true,
  includeNftMetadata: true
});
```

### Safe Token Creation
```typescript
const cost = await estimateTokenCreationCost(params);
const balanceCheck = await checkSufficientBalance(payer.publicKey, cost);

if (balanceCheck.sufficient) {
  const result = await createToken22TwoTx(payer, params);
}
```

## Program IDs

```typescript
const PROGRAM_IDS = {
  TOKEN22_PROGRAM: 'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn',
  ASSOCIATED_TOKEN_PROGRAM: '4YpYoLVTQ8bxcne9GneN85RUXeN7pqGTwgPcY71ZL5gX',
  CUSTOM_MPL_CORE_PROGRAM: 'BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc'
};
```

## Environment Setup

```typescript
// .env file
RPC_ENDPOINT=https://rpc.gorbchain.xyz
NETWORK=mainnet

// Usage
const sdk = new GorbchainSDK({
  rpcEndpoint: process.env.RPC_ENDPOINT,
  network: process.env.NETWORK
});
``` 