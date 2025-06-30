import { renderHook } from '@testing-library/react-hooks';
import { useDecodedInstructions } from '../src/react/useDecodedInstructions';
import { DecoderRegistry } from '../src/registry';

describe('useDecodedInstructions', () => {
  it('decodes instructions using registry', () => {
    const registry = new DecoderRegistry();
    registry.register('test', (ix) => ({ type: 'test', data: ix }));
    const { result } = renderHook(() =>
      useDecodedInstructions([{ type: 'test', foo: 1 }], registry)
    );
    expect(result.current.decoded[0]).toEqual({ type: 'test', data: { type: 'test', foo: 1 } });
  });
});
