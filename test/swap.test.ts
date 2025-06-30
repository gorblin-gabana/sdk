import * as swap from '../src/decoders/swap';

describe('Swap/DEX Decoders', () => {
  it('decodes swap', () => {
    expect(swap.decodeSwap({})).toHaveProperty('type', 'swap');
  });
});
