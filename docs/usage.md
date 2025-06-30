# Usage Guide: ChainDecode SDK

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
