import * as nameService from '../src/decoders/nameService.js';

describe('Name Service Decoders', () => {
  it('decodes registerName', () => {
    expect(nameService.decodeRegisterName({})).toHaveProperty('type', 'registerName');
  });
});
