Here’s a refined technical doc outlining your SDK’s approach to dynamic decoding across forks, using `solana-kit` and modern SPL/Metaplex utilities:

---

## 🧩 1. Overview

Your SDK requires:

1. Flexible decoding of SPL Token and Token‑2022 instructions with dynamic `programId`
2. Support for metadata decoding via Token‑2022 extensions or Metaplex
3. Integration with `@solana/kit` (not `web3.js` 1.x)
4. A clean TypeScript interface for both frontend (React) and backend

---

## 2. Decoding with Dynamic `programId`

`@solana/spl-token` and related libraries allow for custom `programId`:

```ts
decodeSetAuthorityInstruction(ix: TransactionInstruction, programId?: PublicKey)
// defaults: programId = TOKEN_PROGRAM_ID
```

This pattern applies to almost all decode utilities—e.g.:

```ts
createAssociatedTokenAccountInstruction(
  payer, ata, owner, mint,
  programId = TOKEN_PROGRAM_ID,
  associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID
)
```

([app.unpkg.com][1], [spl.solana.com][2], [reddit.com][3])

**Conclusion:** You **don’t need to modify library source code**—just pass the forked `programId` at decode-time.

---

## 3. Token‑2022 & Metadata Support

### 3.1 Token-2022 Support

Token-2022 util functions also accept `programId`:

* e.g., `TOKEN_2022_PROGRAM_ID` is default, but you can swap in your forked ID


### 3.2 Metadata Extensions

You can decode metadata instructions via:

* `@solana/spl-token-metadata`
* `@solana/spl-token` (>= v0.3.10) which now supports metadata in-mint via `MetadataPointer`
  ([reddit.com][4], [solana.com][5])

These utilities also accept a `programId` so they can adapt to custom metadata-program deployments.

---

## 4. Integration with `@solana/kit`

Swap `@solana/web3.js` for `@solana/kit`:

```ts
import {
  Connection,
  TransactionInstruction,
  PublicKey,
  // etc.
} from '@solana/kit';
```

This provides RPC and parser capabilities while maintaining TypeScript-first modularity.

---

## 5. SDK Architecture

### 5.1 Decoder Registry

```ts
type DecoderFn = (
  ix: TransactionInstruction,
  programId?: PublicKey
) => any;

class DecoderRegistry {
  private decoders = new Map<string, DecoderFn>();

  register(name: string, fn: DecoderFn) {
    this.decoders.set(name, fn);
  }

  decode(name: string, ix: TransactionInstruction, programId?: PublicKey) {
    const fn = this.decoders.get(name);
    if (!fn) throw new Error(`No decoder for ${name}`);
    return fn(ix, programId);
  }
}
```

**Pre-register decoders**:

* SPL Token: mint, transfer, setAuthority, etc.
* Token-2022 extensions: MetadataPointer, transfer fees, etc.
* Metaplex (via `@solana/spl-token-metadata`)

### 5.2 Usage Example

```ts
const forkTokenProgram = new PublicKey(env.FORKED_TOKEN_PROGRAM_ID);

const decoded = registry.decode(
  'spl-token:set-authority',
  ix,
  forkTokenProgram
);
```

### 5.3 Metaplex

```ts
import {
  createInitializeInstruction,
  createUpdateFieldInstruction,
  getTokenMetadata,
} from '@solana/spl-token-metadata';

registry.register('mpl-token:init', (ix, pid) =>
  /* metadata decode logic using custom pid */
);
```

([solana.com][5])

---

## 6. Cross-Fork & React/Node Support

* **Frontend**: Provide React hooks—`useDecodedInstructions(txns, programIdOverrides)`
* **Backend**: Support batch decoding of `getBlocks` output with fork-specific overrides
* **RPC**: Use `@solana/kit` for efficient RPC subscription and parsing

---

## 7. Summary Table

| Feature                      | Approach                                      |
| ---------------------------- | --------------------------------------------- |
| SPL Token decoding           | Use library decoders; pass `programId`        |
| Token-2022 + extensions      | Libraries support dynamic `programId`         |
| Metadata / Metaplex decoding | Use `spl-token-metadata` and pointer support  |
| Registry-driven decoding     | `DecoderRegistry` for modular plugin support  |
| Kit-based core               | `@solana/kit` for modern RPC/instruction APIs |

---

## ✅ Conclusion

* **Yes**, you can reuse SPL/Token-2022/Metaplex decoders directly by passing custom `programId`
* You **don’t need forking patches**, just dynamic invocation
* `@solana/kit` easily replaces `web3.js`
* The Registry pattern keeps it modular, extensible, and plugin-friendly

---

### 📌 Next Steps

* Scaffold `DecoderRegistry` and register all core decoders
* Provide React hooks and Node utilities
* Add tests against both mainnet and a test forked program
* Include usage docs and examples

[1]: https://app.unpkg.com/%40solana/spl-token%400.4.13/files/src/instructions/associatedTokenAccount.ts?utm_source=chatgpt.com "UNPKG"
[2]: https://spl.solana.com/token-2022/wallet?utm_source=chatgpt.com "Wallet Guide | Solana Program Library Docs"
[3]: https://www.reddit.com/r/solana/comments/szskfn?utm_source=chatgpt.com "Trouble Importing Token from @solana/spl-token (npm and node)"
[4]: https://www.reddit.com/r/solana/comments/1d6gn7i?utm_source=chatgpt.com "Im having a lot of trouble trying to decode instructions"
[5]: https://solana.com/vi/developers/courses/token-extensions/token-extensions-metadata?utm_source=chatgpt.com "Metadata and Metadata Pointer Extension | Solana"
