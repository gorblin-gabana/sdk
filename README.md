Here’s a polished GitHub-style `README.md` scaffold for your SDK **chaindecode** by **gorbchain-xyz**:

---

# ChainDecode 🧩

**Dynamic, fork‑aware decoding SDK for Solana transactions**
Parse and decode SPL Token, Token‑2022, Metaplex metadata, and custom programs using `@solana/kit` with flexible program ID support.

---

## 🚀 NPM Installation

```bash
npm install @solana/kit @solana-program/token @solana-program/token-2022 @solana-program/token-metadata gorbchain-xyz/chaindecode
```

Or via Yarn:

```bash
yarn add @solana/kit \
  @solana-program/token @solana-program/token-2022 \
  @solana-program/token-metadata \
  gorbchain-xyz/chaindecode
```

**`chaindecode`** published as:

```
npm install @gorbchain-xyz/chaindecode
```

---

## 📦 Dependencies

* `@solana/kit` — core RPC, transactions, subscriptions
* `@solana-program/token` — SPL Token
* `@solana-program/token-2022` — Token 2022 and extensions
* `@solana-program/token-metadata` — Metaplex metadata decoding
* `TypeScript >= 4.x`, Node 18+ / Browser

---

## ✅ Features

* Dynamic decoding of SPL Token, Token‑2022, metadata using **custom program IDs**
* Pass forked Token program IDs—no need to patch libraries
* Plugin-friendly registry for custom programs
* Works across React, Node, and CLI
* Based on modern `@solana/kit`, replacing legacy `web3.js`

---

## 🧱 Quickstart Example

```ts
import { Connection, TransactionInstruction } from '@solana/kit';
import { DecoderRegistry } from '@gorbchain-xyz/chaindecode';

// Initialize RPC
const connection = new Connection('https://rpc.gorbchain.xyz');

// Create registry and register decoders
const registry = new DecoderRegistry();

// Pre-register core decoders
registry.registerSPLTokenDecoders();
registry.registerToken2022Decoders();
registry.registerMetadataDecoders();

// Decode a received transaction instruction
const tx = await connection.getTransaction(sig, { maxSupportedTransactionVersion: 0 });
const ix: TransactionInstruction = tx!.transaction.message.instructions[0];

// Decode using mainnet or fork
const result = registry.decode(ix, {
  splTokenProgram: pid || undefined,        // mainnet has default
  token2022Program: forkPid2022,
  metadataProgram: customMetaplexPid,
});

console.log(result);
```

---

## 🔑 Transaction Helpers

Create, sign, send, and simulate transactions using Solana RPC or backend API:

```ts
import {
  createTransaction,
  createRawTransaction,
  signTransaction,
  sendTransaction,
  simulateTransaction
} from '@gorbchain-xyz/chaindecode';

// Create a transaction
const tx = await createTransaction([instruction1, instruction2], payerPublicKey);

// Sign
const signed = await signTransaction(tx, payerKeypair);

// Send
const sig = await sendTransaction(connection, signed, [payerKeypair]);

// Simulate
const sim = await simulateTransaction(connection, signed);
```

- You can use these helpers in browser or Node.js (requires `@solana/web3.js`).
- For backend or API-based workflows, use the Gor API endpoints for transaction submission and simulation.

---

## ⚙️ SDK Configuration

Set backend, RPC, and program addresses at runtime:

```ts
import { setGorbchainConfig, getGorbchainConfig, PROGRAM_IDS } from '@gorbchain-xyz/chaindecode';

setGorbchainConfig({
  backendUrl: 'https://gorbscan.com',
  rpcUrl: 'https://rpc.gorbchain.xyz',
  programIds: {
    token2022: '...',
    ata: '...',
    metaplex: '...'
  }
});

console.log(getGorbchainConfig());
console.log(PROGRAM_IDS.token2022);
```

---

## 🧩 Exports

- **Decoders:**
  - `decodeMintAccount`, `fetchAndDecodeMintAccount`, all SPL/Token2022/Metaplex/Swap/NameService decoders
- **Transaction helpers:**
  - `createTransaction`, `createRawTransaction`, `signTransaction`, `sendTransaction`, `simulateTransaction`
- **Config:**
  - `setGorbchainConfig`, `getGorbchainConfig`, `PROGRAM_IDS`
- **Registry:**
  - `DecoderRegistry`, plugin system
- **React:**
  - `useDecodedInstructions` (for explorer UIs)

---

## 🧮 API Reference

### `DecoderRegistry`

| Method                                                                                                                   | Description                                           |
| ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| `register(name: string, fn: DecoderFn)`                                                                                  | Add a custom decoder                                  |
| `decode(ix: TransactionInstruction, options?: { splTokenProgram?, token2022Program?, metadataProgram? }): DecodedResult` | Run decode with optional overrides                    |
| `registerSPLTokenDecoders()`                                                                                             | Includes mint, transfer, setAuthority, etc.           |
| `registerToken2022Decoders()`                                                                                            | Includes Token‑2022 extensions, metadata pointers     |
| `registerMetadataDecoders()`                                                                                             | Required for `@solana-program/token-metadata` support |

---

## 🧩 Mint Account Decoding (SPL Token & Token-2022)

Decode any mint account buffer, base64, or base58 string, including all TLV extensions (Token Metadata, etc):

```ts
import { decodeMintAccount } from '@gorbchain-xyz/chaindecode';

// Buffer, base64, or base58 string
const decoded = decodeMintAccount(mintAccountData, { encoding: 'base64' });
console.log(decoded.name, decoded.symbol, decoded.tokenMetadata, decoded.tlvExtensions);
```

Or fetch and decode directly from the Gor API:

```ts
import { fetchAndDecodeMintAccount } from '@gorbchain-xyz/chaindecode';

const mintInfo = await fetchAndDecodeMintAccount('So11111111111111111111111111111111111111112');
console.log(mintInfo?.tokenMetadata?.name, mintInfo?.tlvExtensions);
```

- Returns all canonical mint fields, plus all TLV extensions (type, length, hex, and parsed Token Metadata if present).
- Works for both SPL Token and Token-2022 mints.

---

## 🔌 CLI / Node Usage

```ts
import { createBlockDecoder } from '@gorbchain-xyz/chaindecode';
import { Connection } from '@solana/kit';

const connection = new Connection(...);
const decodeBlock = createBlockDecoder(connection, registry);

decodeBlock( /* slot number */, {
  splTokenProgram: ...,
  token2022Program: ...,
  metadataProgram: ...
}).then(console.log);
```

---

## ♻️ React Support (optional)

```ts
import { useDecodedInstructions } from '@gorbchain-xyz/chaindecode';
const { decoded, loading } = useDecodedInstructions(sig, overrides);
```

---

## 🛠️ How It Works

1. **Dynamic decode**: `@solana-program/*` libraries accept custom `programId` at call-time
2. **Registry pattern**: Easily swap out program IDs—works for forks
3. **Based on `@solana/kit`**: modern RPC tooling with subscriptions and batching ([solana-kit-docs.vercel.app][1], [reddit.com][2], [solana-kit-docs.vercel.app][3], [reddit.com][4], [solanakite.org][5], [mcprepository.com][6])

---

## 🔄 Fork Compatibility

```ts
registry.decode(ix, {
  splTokenProgram: new PublicKey(FORKED_TOKEN_ID),
  token2022Program: new PublicKey(FORKED_TOKEN2022_ID),
  metadataProgram: new PublicKey(FORKED_METADATA_ID),
});
```

The respective library verifies `ix.programId.equals(programId)` internally.

---

## 🧪 Testing

* Covers decoding across both mainnet and test forks
* Example integration with `@solana/kit` local validator
* Sample fixtures included

---

## 🧪 Running Tests

```bash
npm install
npm test
```

- All decoders, helpers, and config are covered by tests in `/test`.
- Transaction helpers require `@solana/web3.js` installed in your project.

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## 👤 Maintainers

* **gorblin** — SDK core
* Open to community contributions and feature requests

---

## ⚠️ Note

- Transaction helpers require `@solana/web3.js` as a peer dependency.
- For backend or API-based workflows, use the Gor API endpoints for transaction submission and simulation.

---

## ℹ️ License

MIT © 2025 **gorbchain-xyz**

[1]: https://solana-kit-docs.vercel.app
[2]: https://www.reddit.com/r/solana/comments/pxxg6v/solana_sdk_kit_is_now_live/
[3]: https://solana-kit-docs.vercel.app/getting-started/installation
[4]: https://www.reddit.com/r/solana/comments/qz8j8u/announcing_solanasdk_kit_a_new_way_to_build_on/
[5]: https://solanakite.org
[6]: https://mcprepository.com
