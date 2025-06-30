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

## 📚 Examples

* `examples/react-app/` – UI demo decoding transactions
* `examples/cli/` – Simple CLI to decode recent block

---

## 📖 Roadmap

* Add custom plugin support for user programs
* Plugin system for Anchor + custom IDLs
* Hooks: `useInstructionParser`, `useForkDecoder`

---

## 📝 Contributing

1. Fork the repo
2. Create your feature branch
3. Run `npm test`
4. Submit PR!

---

## 👤 Maintainers

* **gorblin** — SDK core
* Open to community contributions and feature requests

---

## ℹ️ License

MIT © 2025 **gorbchain-xyz**
