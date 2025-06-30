import { DecoderRegistry } from '../src/registry';

describe('DecoderRegistry', () => {
  it('registers and decodes using a custom decoder', () => {
    const registry = new DecoderRegistry();
    registry.register('test', (ix) => ({ type: 'test', data: ix }));
    const result = registry.decode('test', { foo: 1 });
    expect(result).toEqual({ type: 'test', data: { foo: 1 } });
  });
});
