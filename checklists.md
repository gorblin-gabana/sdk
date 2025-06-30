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
- [ ] Initialize TypeScript project (`tsconfig.json`, `package.json`)
- [ ] Add dependencies: `@solana/kit`, `@solana-program/token`, `@solana-program/token-2022`, `@solana-program/token-metadata`
- [ ] Set up linting, formatting, and basic CI

---

### 2. Core SDK Architecture

#### 2.1 Decoder Registry
- [ ] Implement `DecoderRegistry` class (`src/registry/DecoderRegistry.ts`)
- [ ] Support registration and lookup of decoders by name
- [ ] Allow dynamic `programId` overrides at decode-time
- [ ] Export registry from `src/registry/index.ts`

#### 2.2 Decoder Implementations
- [ ] SPL Token decoders (`src/decoders/splToken.ts`)
  - [ ] Mint, transfer, setAuthority, etc.
- [ ] Token-2022 decoders (`src/decoders/token2022.ts`)
  - [ ] Extensions: MetadataPointer, transfer fees, etc.
- [ ] Metaplex/Metadata decoders (`src/decoders/metadata.ts`)
  - [ ] Support both Token-2022 and Metaplex metadata
- [ ] Export all decoders from `src/decoders/index.ts`
- [ ] Register all core decoders in the registry

#### 2.3 Types
- [ ] Define all shared types/interfaces in `src/types/index.ts`
  - [ ] `DecoderFn`, `DecodedResult`, registry options, etc.

---

### 3. React & Node Utilities

#### 3.1 React Hooks
- [ ] Implement `useDecodedInstructions` (`src/react/useDecodedInstructions.ts`)
  - [ ] Accepts transactions and programId overrides
  - [ ] Returns decoded instructions and loading state

#### 3.2 Node Utilities
- [ ] Implement `createBlockDecoder` (`src/node/createBlockDecoder.ts`)
  - [ ] Batch decode block instructions with programId overrides

---

### 4. Testing

- [ ] Write unit tests for registry and decoders (`test/registry.test.ts`, `test/decoders.test.ts`)
- [ ] Write integration tests for React hook and Node utilities
- [ ] Add fixtures for mainnet and forked program instructions
- [ ] Test against local validator and forked program IDs

---

### 5. Documentation & Examples

- [ ] Write usage docs (`docs/usage.md`)
- [ ] Write API reference (`docs/api.md`)
- [ ] Document plugin system and custom decoders (`docs/plugins.md`)
- [ ] Provide example React app (`examples/react-app/`)
- [ ] Provide example CLI (`examples/cli/`)
- [ ] Update `README.md` with usage, API, and contribution guidelines

---

### 6. Plugin & Extensibility

- [ ] Design plugin interface for user-defined decoders
- [ ] Support Anchor/IDL-based plugins (future milestone)
- [ ] Add hooks: `useInstructionParser`, `useForkDecoder` (future milestone)

---

### 7. Release & Maintenance

- [ ] Prepare for npm publish (`@gorbchain-xyz/chaindecode`)
- [ ] Add MIT license and contributor guidelines
- [ ] Set up CI for tests and linting
- [ ] Plan for community feedback and roadmap updates

---

## ✅ Summary Table

| Area                | Task/Folder                        | Status  |
|---------------------|------------------------------------|---------|
| Core Registry       | `src/registry/`                    | [ ]     |
| Decoders            | `src/decoders/`                    | [ ]     |
| React Hooks         | `src/react/`                       | [ ]     |
| Node Utilities      | `src/node/`                        | [ ]     |
| Types               | `src/types/`                       | [ ]     |
| Tests               | `test/`                            | [ ]     |
| Examples            | `examples/`                        | [ ]     |
| Docs                | `docs/`                            | [ ]     |
| CI/Release          | root files, npm, license           | [ ]     |

---

This checklist will guide the SDK development and ensure all milestones are covered for a robust, extensible, and production-ready package.
