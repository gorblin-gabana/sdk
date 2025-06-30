# 📋 ChainDecode SDK: Development Checklist & Folder Structure

## 📁 Folder Structure

```
sdk/
├── src/
│   ├── registry/
│   │   ├── DecoderRegistry.ts
│   │   └── index.ts
│   ├── decoders/
│   │   ├── splToken.ts
│   │   ├── token2022.ts
│   │   ├── metadata.ts
│   │   ├── swap.ts
│   │   ├── nameService.ts
│   │   └── index.ts
│   ├── react/
│   │   └── useDecodedInstructions.ts
│   ├── node/
│   │   └── createBlockDecoder.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts
├── examples/
│   ├── react-app/
│   └── cli/
├── test/
│   ├── registry.test.ts
│   ├── decoders.test.ts
│   ├── swap.test.ts
│   ├── nameService.test.ts
│   └── react.test.ts
├── docs/
│   ├── usage.md
│   ├── api.md
│   └── plugins.md
├── package.json
├── tsconfig.json
├── README.md
└── plan.md
```

---

## 🏁 Milestones & Checklist

### 1. Project Setup
- [x] Initialize TypeScript project (`tsconfig.json`, `package.json`)
- [x] Add dependencies: `@solana/kit`, `@solana-program/token`, `@solana-program/token-2022`, `@metaplex-foundation/mpl-token-metadata`
- [x] Set up linting, formatting, and basic CI

---

### 2. Core SDK Architecture

#### 2.1 Decoder Registry
- [x] Implement `DecoderRegistry` class (`src/registry/DecoderRegistry.ts`)
- [x] Support registration and lookup of decoders by name
- [x] Allow dynamic `programId` overrides at decode-time
- [x] Export registry from `src/registry/index.ts`
- [x] Add support for registering custom programs with IDL/schemas

#### 2.2 Decoder Implementations
- [x] SPL Token decoders (`src/decoders/splToken.ts`)
  - [x] Mint, transfer, burn, setAuthority, createAccount, closeAccount
- [x] Token-2022 decoders (`src/decoders/token2022.ts`)
  - [x] Extensions: Transfer fees, native mint, confidential transfers, etc.
- [x] Metaplex/Metadata decoders (`src/decoders/metadata.ts`)
  - [x] CreateMetadata, UpdateMetadata, MintNewEdition, programmable-NFT rules
- [x] Swap/DEX decoders (`src/decoders/swap.ts`)
  - [x] swap, addLiquidity, removeLiquidity, initializePool
- [x] Name Service decoders (`src/decoders/nameService.ts`)
  - [x] registerName, updateName, transferName
- [x] Export all decoders from `src/decoders/index.ts`
- [x] Register all core decoders in the registry

#### 2.3 Types
- [x] Define all shared types/interfaces in `src/types/index.ts`
  - [x] `DecoderFn`, `DecodedResult`, registry options, IDL/Beet types, etc.

---

### 3. Instruction Builders (Encoding)
- [x] SPL Token: `buildMintToken`, `buildTransferToken`, `buildBurnToken`, etc.
- [x] Token-2022: builders for extensions
- [x] Metaplex: `buildCreateMetadata`, `buildUpdateMetadata`, etc.
- [x] Swap/DEX: `buildSwap`, `buildAddLiquidity`, etc.
- [x] Name Service: `buildRegisterName`, `buildUpdateName`, etc.
- [x] All builders accept custom `programId`

---

### 4. Data-Driven/Generic API
- [x] Support `registerProgram({ programId, idl, types, decode, encode })`
- [x] Anchor IDL and Beet schema support for dynamic decode/build
- [x] Fallback to raw/base64 or custom parser if unknown

---

### 5. React & Node Utilities

#### 5.1 React Hooks
- [x] Implement `useDecodedInstructions` (`src/react/useDecodedInstructions.ts`)
  - [x] Accepts transactions and programId overrides
  - [x] Returns decoded instructions and loading state
  - [x] Support custom program decoders

#### 5.2 Node Utilities
- [x] Implement `createBlockDecoder` (`src/node/createBlockDecoder.ts`)
  - [x] Batch decode block instructions with programId overrides

---

### 6. Testing

- [x] Write unit tests for registry and decoders (`test/registry.test.ts`, `test/decoders.test.ts`)
- [x] Write tests for swap and name service decoders
- [x] Write integration tests for React hook and Node utilities
- [x] Add fixtures for mainnet and forked program instructions
- [x] Test against local validator and forked program IDs

---

### 7. Documentation & Examples

- [x] Write usage docs (`docs/usage.md`)
- [x] Write API reference (`docs/api.md`)
- [x] Document plugin system and custom decoders (`docs/plugins.md`)
- [x] Provide example React app (`examples/react-app/`)
- [x] Provide example CLI (`examples/cli/`)
- [x] Update `README.md` with usage, API, and contribution guidelines

---

### 8. Plugin & Extensibility

- [x] Design plugin interface for user-defined decoders
- [x] Support Anchor/IDL-based plugins (future milestone)
- [x] Add hooks: `useInstructionParser`, `useForkDecoder` (future milestone)

---

### 9. Release & Maintenance

- [x] Prepare for npm publish (`@gorbchain-xyz/chaindecode`)
- [x] Add MIT license and contributor guidelines
- [x] Set up CI for tests and linting
- [ ] Plan for community feedback and roadmap updates

---

## ✅ Summary Table

| Area                | Task/Folder                        | Status  |
|---------------------|------------------------------------|---------|
| Core Registry       | `src/registry/`                    | [x]     |
| Decoders            | `src/decoders/`                    | [x]     |
| Builders            | `src/decoders/`                    | [x]     |
| React Hooks         | `src/react/`                       | [x]     |
| Node Utilities      | `src/node/`                        | [x]     |
| Types               | `src/types/`                        | [x]     |
| Tests               | `test/`                            | [x]     |
| Examples            | `examples/`                        | [x]     |
| Docs                | `docs/`                            | [x]     |
| CI/Release          | root files, npm, license           | [x]     |

---

This checklist will guide the SDK development and ensure all milestones are covered for a robust, extensible, and production-ready package.
