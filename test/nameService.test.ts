import * as nameService from '../src/decoders/nameService';

describe('Name Service Decoders', () => {
  it('decodes registerName', () => {
    expect(nameService.decodeRegisterName({ programId: 'test', data: new Uint8Array(), accounts: [] })).toHaveProperty('type', 'registerName');
  });
});
