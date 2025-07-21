# GorbchainSDK V1.3+ Quick Reference

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

## 🔐 NEW: Cryptography Functions

### Personal Encryption
```typescript
import { encryptPersonal, decryptPersonalString } from '@gorbchain-xyz/chaindecode';

// Encrypt with your private key
const encrypted = await encryptPersonal('Secret data', privateKey);
const decrypted = await decryptPersonalString(encrypted, privateKey);
```

### Direct Encryption (1-on-1)
```typescript
import { encryptDirect, decryptDirectString } from '@gorbchain-xyz/chaindecode';

// Alice encrypts for Bob
const encrypted = await encryptDirect('Hello Bob', bobPublicKey, alicePrivateKey);
const decrypted = await decryptDirectString(encrypted, bobPrivateKey);
```

### Group & Signature-Based Encryption
```typescript
import { createSignatureGroup, encryptForSignatureGroup, MemberRole } from '@gorbchain-xyz/chaindecode';

// Create group
const group = await createSignatureGroup('Team Chat', creatorPrivateKey, [
  { publicKey: memberKey, role: MemberRole.MEMBER }
]);

// Encrypt for group
const encrypted = await encryptForSignatureGroup('Team message', group, senderPrivateKey, senderPublicKey);
```

### Shared Key Management
```typescript
import { SharedKeyManager } from '@gorbchain-xyz/chaindecode';

const manager = new SharedKeyManager();
const sharedKey = await manager.createSharedKey(
  { name: 'Team Docs', purpose: 'Document sharing' },
  [{ publicKey: memberKey, permissions: { canDecrypt: true, canEncrypt: true }}],
  creatorPrivateKey
);
```

### Scalable Encryption
```typescript
import { ScalableEncryptionManager } from '@gorbchain-xyz/chaindecode';

const manager = new ScalableEncryptionManager();
const { context } = await manager.createEncryptionContext(
  'Project Alpha', 'Auto-scaling chat', initialRecipient, creatorPrivateKey
);
```

### Digital Signatures
```typescript
import { signData, verifySignature } from '@gorbchain-xyz/chaindecode';

const signature = signData('Important document', privateKey);
const isValid = verifySignature('Important document', signature, publicKey);
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

## 🔐 Crypto Response Types

### PersonalEncryptionResult
```typescript
{
  method: 'PERSONAL',
  encryptedData: string,
  metadata: {
    nonce: string,
    version: string,
    timestamp: number,
    compressed?: boolean
  }
}
```

### DirectEncryptionResult  
```typescript
{
  method: 'DIRECT',
  encryptedData: string,
  metadata: {
    ephemeralPublicKey: string,
    nonce: string,
    senderPublicKey: string,
    recipientPublicKey: string
  }
}
```

### GroupEncryptionResult
```typescript
{
  method: 'GROUP',
  encryptedData: string,
  groupId: string,
  senderPublicKey: string,
  metadata: {
    nonce: string,
    timestamp: number,
    epoch: number
  }
}
```

## Common Crypto Patterns

### Secure Messaging App
```typescript
// 1-on-1 chat
const message = await encryptDirect('Hello!', recipientKey, senderPrivateKey);

// Group chat
const group = await createSignatureGroup('Friends', creatorKey, members);
const groupMessage = await encryptForSignatureGroup('Hey everyone!', group, senderKey, senderPublicKey);
```

### Document Management
```typescript
// Shared document access
const docKey = await manager.createSharedKey(
  { name: 'Project Docs' },
  recipients,
  adminKey
);
const encrypted = await manager.encryptWithSharedKey(document, docKey.keyId, userKey, userPublicKey);
```

### Auto-scaling Team Communication
```typescript
// Starts direct, scales to shared key automatically
const { manager, context } = await createScalableEncryption('Team', 'purpose', initialRecipient, creatorKey);

// Add members (auto-transitions at threshold)
await manager.addRecipientsToContext(context.contextId, newMembers, adminKey, adminPublicKey);
```

## Security Best Practices

1. **Never expose private keys** in client-side code
2. **Use compression** for large data: `{ compress: true }`
3. **Implement key rotation** when removing group members
4. **Verify signatures** for group access control
5. **Use forward secrecy** with ephemeral keys

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