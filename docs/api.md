# API Reference: ChainDecode SDK

## Main Exports

- `DecoderRegistry` — Registry for all decoders and custom program registration
- SPL Token decoders/builders: `decodeMintInstruction`, `buildMintToken`, etc.
- Token-2022 decoders/builders: `decodeToken2022Mint`, `buildToken2022Mint`, etc.
- Metaplex/Metadata decoders/builders: `decodeCreateMetadata`, `buildCreateMetadata`, etc.
- Swap/DEX decoders/builders: `decodeSwap`, `buildSwap`, etc.
- Name Service decoders/builders: `decodeRegisterName`, `buildRegisterName`, etc.
- React hook: `useDecodedInstructions`
- Node utility: `createBlockDecoder`

## Usage

```ts
import {
  DecoderRegistry,
  decodeMintInstruction,
  buildMintToken,
  useDecodedInstructions,
  createBlockDecoder
} from '@gorbchain-xyz/chaindecode';
```

## DecoderRegistry

### Methods
- `register(name: string, fn: DecoderFn)` — Register a decoder
- `decode(name: string, ix: TransactionInstruction, programId?: PublicKey)` — Decode an instruction
- `registerProgram(opts: { programId, idl, label, types? })` — Register a custom program with IDL/schema

## Decoders & Builders

See [usage.md](./usage.md) for detailed examples for each module.

## React Hook

- `useDecodedInstructions(instructions, registry, overrides?)`
  - Returns `{ decoded, loading }`

## Node Utility

- `createBlockDecoder(registry, overrides?)`
  - Returns a function to decode all instructions in a block

---

For more, see the full [usage guide](./usage.md) and [plugin docs](./plugins.md).
