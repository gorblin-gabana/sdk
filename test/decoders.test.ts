import * as splToken from '../src/decoders/splToken';
import * as token2022 from '../src/decoders/token2022';
import * as metadata from '../src/decoders/metadata';
import * as decoders from '../src/decoders';

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

describe('Mint Account Decoding', () => {
  it('decodes SPL Token mint account', () => {
    // Fake 82-byte buffer for SPL Token mint (all zeros)
    const buf = new Uint8Array(82);
    const decoded = decoders.decodeMintAccount(buf);
    expect(decoded).toHaveProperty('supply');
    expect(decoded).toHaveProperty('decimals');
    expect(decoded).toHaveProperty('isInitialized');
    expect(decoded).toHaveProperty('tlvExtensions');
  });
  it('decodes Token-2022 mint account with TLV', () => {
    // Fake 300-byte buffer with TLV extension type 6 (Token Metadata)
    const buf = new Uint8Array(300);
    buf[82] = 6; // type
    buf[83] = 232; buf[84] = 0; // length = 232
    // Fill name, symbol, uri, updateAuthority with ASCII
    for (let i = 0; i < 32; i++) buf[86 + i] = 65 + (i % 26); // name: A...
    for (let i = 0; i < 12; i++) buf[86 + 32 + i] = 97 + (i % 26); // symbol: a...
    for (let i = 0; i < 156; i++) buf[86 + 44 + i] = 48 + (i % 10); // uri: 0...
    for (let i = 0; i < 32; i++) buf[86 + 200 + i] = i; // updateAuthority
    const decoded = decoders.decodeMintAccount(buf);
    expect(decoded.tokenMetadata).toBeTruthy();
    expect(decoded.tokenMetadata?.name).toMatch(/A+/);
    expect(decoded.tokenMetadata?.symbol).toMatch(/a+/);
    expect(decoded.tokenMetadata?.uri).toMatch(/0+/);
    expect(decoded.tokenMetadata?.updateAuthority).toBeTruthy();
  });
});
