import * as splToken from '../src/decoders/splToken';
import * as token2022 from '../src/decoders/token2022';
import * as metadata from '../src/decoders/metadata';

describe('SPL Token Decoders', () => {
  it('decodes mint', () => {
    expect(splToken.decodeMintInstruction({})).toHaveProperty('type', 'mint');
  });
});

describe('Token-2022 Decoders', () => {
  it('decodes token2022Mint', () => {
    expect(token2022.decodeToken2022Mint({})).toHaveProperty('type', 'token2022Mint');
  });
});

describe('Metadata Decoders', () => {
  it('decodes createMetadata', () => {
    expect(metadata.decodeCreateMetadata({})).toHaveProperty('type', 'createMetadata');
  });
});
