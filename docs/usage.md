# Usage Guide: ChainDecode SDK

## 🚀 Quick Start

### 1. Decode a Mint Account (SPL Token or Token-2022)

```ts
import { decodeMintAccount, fetchAndDecodeMintAccount } from '@gorbchain-xyz/chaindecode';

// Decode from buffer or base64 string
const decoded = decodeMintAccount(mintAccountData, { encoding: 'base64' });
console.log(decoded.tokenMetadata?.name, decoded.tlvExtensions);

// Or fetch and decode from backend
const mintInfo = await fetchAndDecodeMintAccount('So11111111111111111111111111111111111111112');
console.log(mintInfo?.tokenMetadata?.name);
```

### 2. Create, Sign, and Send a Transaction

```ts
import {
  createTransaction,
  signTransaction,
  sendTransaction,
  simulateTransaction
} from '@gorbchain-xyz/chaindecode';

const tx = await createTransaction([ix1, ix2], payerPublicKey);
const signed = await signTransaction(tx, payerKeypair);
const sig = await sendTransaction(connection, signed, [payerKeypair]);
const sim = await simulateTransaction(connection, signed);
```

### 3. Configure SDK (Backend, RPC, Program IDs)

```ts
import { setGorbchainConfig, getGorbchainConfig, PROGRAM_IDS } from '@gorbchain-xyz/chaindecode';

setGorbchainConfig({
  // ...your config
});
```

### 4. Decode a Transaction by Signature

```ts
import { getAndDecodeTransaction } from '@gorbchain-xyz/chaindecode';
const result = await getAndDecodeTransaction(connection, signature);
console.log(result.instructions);
```

### 5. Send a Transaction via RPC

```ts
import { sendRpcTransaction } from '@gorbchain-xyz/chaindecode';
const sig = await sendRpcTransaction(connection, transaction, signers);
```

### 6. Decode Instructions

```ts
import { decodeTransactionInstruction, decodeTransactionInstructions } from '@gorbchain-xyz/chaindecode';
const decoded = decodeTransactionInstruction(instruction);
const decodedArr = decodeTransactionInstructions([instruction1, instruction2]);
```

## 🧩 DecoderRegistry & Custom Decoders

```ts
import { DecoderRegistry } from '@gorbchain-xyz/chaindecode';
const registry = new DecoderRegistry();
registry.register('customIx', (ix, programId) => ({ type: 'customIx', data: ix }));
```

## 🧑‍💻 React Integration

```ts
import { useDecodedInstructions } from '@gorbchain-xyz/chaindecode';
const { decoded, loading } = useDecodedInstructions(instructions, registry);
```

---

See the API and plugin docs for more advanced usage and extension.
