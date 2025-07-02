// Unified mint account decoder for SPL Token and Token-2022
// Exports: decodeMintAccount (buffer or base64/base58/hex string, options)
// Handles canonical fields and TLV extensions (Token Metadata, etc)

export interface TokenMetadataExtension {
  name: string;
  symbol: string;
  uri: string;
  updateAuthority: string;
}

export interface TLVExtension {
  type: number;
  length: number;
  data: Uint8Array;
  hex: string;
}

export interface DecodedMintAccount {
  supply: string;
  decimals: number;
  isInitialized: boolean;
  mintAuthorityOption: number;
  mintAuthority: string;
  mintAuthorityBase58?: string;
  freezeAuthorityOption: number;
  freezeAuthority: string;
  freezeAuthorityBase58?: string;
  raw: string;
  tokenMetadata?: TokenMetadataExtension | null;
  tlvExtensions: TLVExtension[];
}

function parseTlvExtensions(buf: Uint8Array): TLVExtension[] {
  const TLV_START = 82;
  const extensions: TLVExtension[] = [];
  let offset = TLV_START;
  while (offset + 4 <= buf.length) {
    const type = buf[offset];
    const length = buf[offset + 1] | (buf[offset + 2] << 8);
    if (type === 0 || length === 0) break;
    const dataStart = offset + 4;
    const dataEnd = dataStart + length;
    if (dataEnd > buf.length) break;
    const data = buf.slice(dataStart, dataEnd);
    const hex = Array.from(data).map(x => x.toString(16).padStart(2, '0')).join('');
    extensions.push({ type, length, data, hex });
    offset = dataEnd;
  }
  return extensions;
}

function decodeTokenMetadataExtension(ext: TLVExtension): TokenMetadataExtension {
  const name = new TextDecoder().decode(ext.data.slice(0, 32)).replace(/\0+$/, '');
  const symbol = new TextDecoder().decode(ext.data.slice(32, 44)).replace(/\0+$/, '');
  const uri = new TextDecoder().decode(ext.data.slice(44, 200)).replace(/\0+$/, '');
  const updateAuthority = Array.from(ext.data.slice(200, 232)).map((x: number) => x.toString(16).padStart(2, '0')).join('');
  return { name, symbol, uri, updateAuthority };
}

function readBigUInt64LE(bytes: Uint8Array, offset = 0): string {
  var lo = bytes[offset] + bytes[offset + 1] * 2 ** 8 + bytes[offset + 2] * 2 ** 16 + bytes[offset + 3] * 2 ** 24;
  var hi = bytes[offset + 4] + bytes[offset + 5] * 2 ** 8 + bytes[offset + 6] * 2 ** 16 + bytes[offset + 7] * 2 ** 24;
  return (hi * 4294967296 + lo).toString();
}

// Minimal base58 encode/decode for browser
function bytesToBase58(bytes: Uint8Array): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let digits = [0];
  for (let i = 0; i < bytes.length; ++i) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; ++j) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let result = '';
  for (let k = 0; k < bytes.length && bytes[k] === 0; ++k) result += '1';
  for (let q = digits.length - 1; q >= 0; --q) result += ALPHABET[digits[q]];
  return result;
}

export function decodeMintAccount(
  input: Uint8Array | string,
  opts?: { encoding?: 'base64' | 'base58' | 'hex' }
): DecodedMintAccount {
  let buf: Uint8Array;
  if (typeof input === 'string') {
    if (opts?.encoding === 'base64') {
      buf = Uint8Array.from(atob(input), c => c.charCodeAt(0));
    } else if (opts?.encoding === 'base58') {
      // Minimal base58 decode
      const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
      const BASE = 58;
      let bytes = [0];
      for (let i = 0; i < input.length; i++) {
        const c = input[i];
        const val = ALPHABET.indexOf(c);
        if (val < 0) throw new Error('Invalid base58 char');
        let carry = val;
        for (let j = 0; j < bytes.length; ++j) {
          carry += bytes[j] * BASE;
          bytes[j] = carry & 0xff;
          carry >>= 8;
        }
        while (carry) {
          bytes.push(carry & 0xff);
          carry >>= 8;
        }
      }
      for (let k = 0; k < input.length && input[k] === '1'; ++k) bytes.push(0);
      buf = new Uint8Array(bytes.reverse());
    } else if (opts?.encoding === 'hex') {
      const hex = input.startsWith('0x') ? input.slice(2) : input;
      buf = new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    } else {
      // Default: try base64
      buf = Uint8Array.from(atob(input), c => c.charCodeAt(0));
    }
  } else {
    buf = input;
  }
  // SPL Mint layout (82 bytes):
  // 0: supply (u64 LE)
  // 8: decimals (u8)
  // 9: isInitialized (u8)
  // 10: mintAuthorityOption (u32 LE)
  // 14: mintAuthority (32 bytes)
  // 46: freezeAuthorityOption (u32 LE)
  // 50: freezeAuthority (32 bytes)
  const supply = readBigUInt64LE(buf, 0);
  const decimals = buf[8];
  const isInitialized = buf[9] !== 0;
  const mintAuthorityOption = buf[10] | (buf[11] << 8) | (buf[12] << 16) | (buf[13] << 24);
  const mintAuthority = Array.from(buf.slice(14, 46)).map(x => x.toString(16).padStart(2, '0')).join('');
  const mintAuthorityBase58 = bytesToBase58(buf.slice(14, 46));
  const freezeAuthorityOption = buf[46] | (buf[47] << 8) | (buf[48] << 16) | (buf[49] << 24);
  const freezeAuthority = Array.from(buf.slice(50, 82)).map(x => x.toString(16).padStart(2, '0')).join('');
  const freezeAuthorityBase58 = bytesToBase58(buf.slice(50, 82));
  let metadataExt: TokenMetadataExtension | null = null;
  let allExtensions: TLVExtension[] = [];
  if (buf.length > 82) {
    const extensions = parseTlvExtensions(buf);
    allExtensions = extensions;
    const metaExt = extensions.find(e => e.type === 6);
    if (metaExt && metaExt.length >= 232) {
      metadataExt = decodeTokenMetadataExtension(metaExt);
    }
  }
  return {
    supply,
    decimals,
    isInitialized,
    mintAuthorityOption,
    mintAuthority,
    mintAuthorityBase58,
    freezeAuthorityOption,
    freezeAuthority,
    freezeAuthorityBase58,
    raw: Array.from(buf).map(x => x.toString(16).padStart(2, '0')).join(''),
    tokenMetadata: metadataExt,
    tlvExtensions: allExtensions,
  };
}
