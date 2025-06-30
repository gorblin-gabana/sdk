import { render, act } from '@testing-library/react';
import { useDecodedInstructions } from '../src/react/useDecodedInstructions';
import { DecoderRegistry } from '../src/registry';
import React from 'react';

function TestComponent({ instructions, registry }: any) {
  const { decoded, loading } = useDecodedInstructions(instructions, registry);
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'done'}</div>
      <div data-testid="decoded">{JSON.stringify(decoded)}</div>
    </div>
  );
}

describe('useDecodedInstructions', () => {
  it('decodes instructions using registry', () => {
    const registry = new DecoderRegistry();
    registry.register('test', (ix) => ({ type: 'test', data: ix }));
    let utils: any;
    act(() => {
      utils = render(
        <TestComponent instructions={[{ type: 'test', foo: 1 }]} registry={registry} />
      );
    });
    const decoded = utils.getByTestId('decoded').textContent;
    expect(decoded).toContain('test');
    expect(decoded).toContain('foo');
  });
});
