# ChainDecode SDK

A modular, extensible SDK for decoding Solana instructions and accounts, with support for SPL Token, custom programs, and React integration.

## Code Structure

- `src/index.ts`: Main entry point. Re-exports all public decoders.
- `src/decoders/`: Protocol-specific decoders (e.g., SPL Token).
- `src/utils/`: Utility functions (e.g., account decoders, fetchers).
- `examples/`: Example CLI and React usage.
- `docs/`: Markdown documentation for usage, API, plugins, and SPL Token decoders.

## Main Exports

- **Decoders**: `decodeMintInstruction`, `decodeTransferInstruction`, etc.
- **Account Decoders**: `decodeMintAccount`, `fetchAndDecodeMintAccount`
- **DecoderRegistry**: Register and use custom decoders
- **React Hook**: `useDecodedInstructions`

## Usage Example

```ts
import {
  decodeMintInstruction,
  decodeTransferInstruction,
  decodeMintAccount,
  fetchAndDecodeMintAccount,
  DecoderRegistry,
  useDecodedInstructions
} from '@gorbchain-xyz/chaindecode';

// Decode a MintTo instruction
const decoded = decodeMintInstruction(transactionInstruction);

// Decode a Mint account buffer
const mintInfo = decodeMintAccount(mintAccountData, { encoding: 'base64' });

// Fetch and decode a Mint account from backend
const mintInfoRemote = await fetchAndDecodeMintAccount('MintPubkey...');
```

## DecoderRegistry Example

```ts
const registry = new DecoderRegistry();
registry.register('myCustomInstruction', (ix, programId) => {
  // Custom decode logic
  return { type: 'myCustomInstruction', data: ix };
});
```

## Documentation

- `docs/usage.md`: Quick start, usage, and configuration
- `docs/api.md`: API reference for all exports
- `docs/plugins.md`: Custom decoders and program registration
- `docs/spl-token-decoders.md`: SPL Token decoder details and examples

---

See `/docs` for full documentation and advanced usage.
