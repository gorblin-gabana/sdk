// Unified mint account decoder for SPL Token and Token-2022
// Exports: decodeMintAccount (buffer or base64/base58 string, options)
// Handles canonical fields and TLV extensions (Token Metadata, etc)

import { MintLayout } from '@solana/spl-token';
import { Buffer } from 'buffer';

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
  freezeAuthorityOption: number;
  freezeAuthority: string;
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
  const decoded = MintLayout.decode(Buffer.from(buf));
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
  const supply = readBigUInt64LE(buf, 0);
  return {
    supply,
    decimals: decoded.decimals,
    isInitialized: decoded.isInitialized !== 0,
    mintAuthorityOption: decoded.mintAuthorityOption,
    mintAuthority: decoded.mintAuthority.toString('hex'),
    freezeAuthorityOption: decoded.freezeAuthorityOption,
    freezeAuthority: decoded.freezeAuthority.toString('hex'),
    raw: Array.from(buf).map(x => x.toString(16).padStart(2, '0')).join(''),
    tokenMetadata: metadataExt,
    tlvExtensions: allExtensions,
  };
}
