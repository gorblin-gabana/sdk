# Plugin System & Custom Decoders

ChainDecode SDK supports registering custom programs and decoders using IDL or schema.

## Registering a Custom Program

```ts
import { DecoderRegistry } from '@gorbchain-xyz/chaindecode';

const registry = new DecoderRegistry();
registry.registerProgram({
  programId: myCustomProgramId,
  idl: myIDL, // Anchor IDL or Beet schema
  label: 'MyCustomProgram',
  types: [...],
});
```

## Writing a Custom Decoder

```ts
registry.register('myCustomInstruction', (ix, programId) => {
  // Custom decode logic
  return { type: 'myCustomInstruction', data: ix };
});
```

## Auto-Generated Decoders/Builders

If you provide an Anchor IDL or Beet schema, the SDK can auto-generate decoders/builders for you (future milestone).

---

See [API reference](./api.md) and [usage guide](./usage.md) for more.
