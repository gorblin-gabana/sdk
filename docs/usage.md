# Usage Guide: ChainDecode SDK

## 🧑‍💻 How to Use: Quick Examples

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
  backendUrl: 'https://gorbscan.com',
  rpcUrl: 'https://rpc.gorbchain.xyz',
  programIds: { token2022: '...', ata: '...', metaplex: '...' }
});

console.log(getGorbchainConfig());
console.log(PROGRAM_IDS.token2022);
```

### 4. Use the Decoder Registry

```ts
import { DecoderRegistry } from '@gorbchain-xyz/chaindecode';
const registry = new DecoderRegistry();
registry.register('myCustomIx', (ix) => ({ type: 'myCustomIx', data: ix }));
const decoded = registry.decode('myCustomIx', { foo: 1 });
```

---

## Decoding SPL Token Instructions

```ts
import {
  decodeMintInstruction,
  decodeTransferInstruction,
  decodeBurnInstruction,
  decodeSetAuthorityInstruction,
  decodeCreateAccountInstruction,
  decodeCloseAccountInstruction
} from '@gorbchain-xyz/chaindecode/dist/decoders/splToken';

const decoded = decodeMintInstruction(ix, customTokenProgramId);
```

## Decoding Token-2022 Instructions

```ts
import {
  decodeToken2022Mint,
  decodeToken2022Transfer,
  decodeToken2022Extension
} from '@gorbchain-xyz/chaindecode/dist/decoders/token2022';

const decoded = decodeToken2022Mint(ix, customToken2022ProgramId);
```

## Decoding Metaplex/Metadata Instructions

```ts
import {
  decodeCreateMetadata,
  decodeUpdateMetadata,
  decodeMintNewEdition
} from '@gorbchain-xyz/chaindecode/dist/decoders/metadata';

const decoded = decodeCreateMetadata(ix, customMetadataProgramId);
```

## Decoding Swap/DEX Instructions

```ts
import {
  decodeSwap,
  decodeAddLiquidity,
  decodeRemoveLiquidity,
  decodeInitializePool
} from '@gorbchain-xyz/chaindecode/dist/decoders/swap';

const decoded = decodeSwap(ix, customSwapProgramId);
```

## Decoding Name Service Instructions

```ts
import {
  decodeRegisterName,
  decodeUpdateName,
  decodeTransferName
} from '@gorbchain-xyz/chaindecode/dist/decoders/nameService';

const decoded = decodeRegisterName(ix, customNameServiceProgramId);
```

## Building SPL Token Instructions

```ts
import {
  buildMintToken,
  buildTransferToken,
  buildBurnToken,
  buildSetAuthority,
  buildCreateAccount,
  buildCloseAccount
} from '@gorbchain-xyz/chaindecode/dist/decoders/splToken';

const mintIx = buildMintToken({ mint, to, amount, authority, programId });
```

## Building Token-2022 Instructions

```ts
import {
  buildToken2022Mint,
  buildToken2022Transfer
} from '@gorbchain-xyz/chaindecode/dist/decoders/token2022';

const mintIx = buildToken2022Mint({ mint, to, amount, authority, programId });
```

## Building Metaplex/Metadata Instructions

```ts
import {
  buildCreateMetadata,
  buildUpdateMetadata,
  buildMintNewEdition
} from '@gorbchain-xyz/chaindecode/dist/decoders/metadata';

const createMetadataIx = buildCreateMetadata({ /* metadata fields */ });
```

## Building Swap/DEX Instructions

```ts
import {
  buildSwap,
  buildAddLiquidity,
  buildRemoveLiquidity,
  buildInitializePool
} from '@gorbchain-xyz/chaindecode/dist/decoders/swap';

const swapIx = buildSwap({ /* swap fields */ });
```

## Building Name Service Instructions

```ts
import {
  buildRegisterName,
  buildUpdateName,
  buildTransferName
} from '@gorbchain-xyz/chaindecode/dist/decoders/nameService';

const registerNameIx = buildRegisterName({ /* name service fields */ });
```

// ... Add similar usage for custom program registration as you implement them ...

---

For more, see the [API reference](./api.md), [usage guide](./usage.md), and [plugin docs](./plugins.md).
