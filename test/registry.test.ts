import { DecoderRegistry } from '../src/decoders/registry.js';

describe('DecoderRegistry', () => {
  it('registers and decodes using a custom decoder', () => {
    const registry = new DecoderRegistry();
    registry.register('test', 'TestProgram123', (instruction: any) => ({
      type: 'test',
      programId: instruction.programId,
      data: instruction,
      accounts: instruction.accounts || []
    }));

    const mockInstruction = {
      programId: 'TestProgram123',
      data: { foo: 1 },
      accounts: []
    };

    const result = registry.decode(mockInstruction);
    expect(result).toEqual({
      type: 'test',
      programId: 'TestProgram123',
      data: mockInstruction,
      accounts: []
    });
  });
});
