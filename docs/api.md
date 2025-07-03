# API Reference: ChainDecode SDK

## Main Exports

- `DecoderRegistry` — Registry for all decoders and custom program registration
- SPL Token decoders/builders: `decodeMintInstruction`, `decodeTransferInstruction`, etc.
- Account decoders: `decodeMintAccount`, `fetchAndDecodeMintAccount`
- Transaction utilities: `getAndDecodeTransaction`, `sendRpcTransaction`
- Instruction decoders: `decodeTransactionInstruction`, `decodeTransactionInstructions`
- React hook: `useDecodedInstructions`
- Node utility: `createBlockDecoder`

## Usage

```ts
import {
  DecoderRegistry,
  decodeMintInstruction,
  decodeTransferInstruction,
  decodeMintAccount,
  fetchAndDecodeMintAccount,
  getAndDecodeTransaction,
  sendRpcTransaction,
  decodeTransactionInstruction,
  decodeTransactionInstructions,
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
