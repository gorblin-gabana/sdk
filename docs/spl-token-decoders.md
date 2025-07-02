# SPL Token Instruction Decoders (SDK)

This SDK provides robust, program-spec-compliant decoders for Solana SPL Token instructions. Use these decoders to parse raw `TransactionInstruction` objects and extract meaningful, human-readable data for your application or UI.

## Supported Decoders

- `decodeMintInstruction`
- `decodeTransferInstruction`
- `decodeBurnInstruction`
- `decodeSetAuthorityInstruction`
- `decodeCreateAccountInstruction`
- `decodeCloseAccountInstruction`
- `decodeMintAccount` (for Mint account state, not instructions)

## Usage Example

```typescript
import {
  decodeMintInstruction,
  decodeTransferInstruction,
  decodeBurnInstruction,
  decodeSetAuthorityInstruction,
  decodeCreateAccountInstruction,
  decodeCloseAccountInstruction,
  decodeMintAccount,
} from '@gorbchain-xyz/chaindecode';

// Example: Decoding a MintTo instruction
const decoded = decodeMintInstruction(transactionInstruction);
console.log(decoded);
// {
//   type: 'mint',
//   amount: '1000000',
//   mint: 'MintPubkey...',
//   destination: 'DestinationPubkey...',
//   authority: 'AuthorityPubkey...',
//   multiSigners: [...]
// }
```

## How It Works

- Each decoder checks the instruction discriminator (first byte of the data buffer) to ensure the correct instruction type.
- The decoder then parses the rest of the buffer according to the SPL Token program specification (see [SPL Token Program Spec](https://github.com/solana-labs/solana-program-library/blob/master/token/program/src/instruction.rs)).
- Account addresses are extracted from the `keys` array of the `TransactionInstruction`.

## Reference: SPL Token Program Spec
- [SPL Token Instruction Layouts](https://github.com/solana-labs/solana-program-library/blob/master/token/program/src/instruction.rs)

## Notes
- These decoders do not require or use any private keys.
- They are safe to use in both browser and Node.js environments (with Buffer polyfill for browsers).
- Builders for creating instructions are provided as stubs and can be implemented as needed.

## Extending
To add support for more SPL Token instructions, follow the same pattern:
- Add the discriminator value.
- Parse the buffer according to the instruction’s layout.
- Extract account addresses from the `keys` array.

---

For questions or contributions, see the SDK repository or open an issue.
