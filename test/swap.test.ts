import * as swap from '../src/decoders/swap';

describe('Swap/DEX Decoders', () => {
  it('decodes swap', () => {
    expect(swap.decodeSwap({ programId: 'test', data: new Uint8Array(), accounts: [] })).toHaveProperty('type', 'swap');
  });
});
