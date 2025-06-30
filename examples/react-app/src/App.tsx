import React, { useState } from 'react';
import { DecoderRegistry } from './DecoderRegistry';
import { useDecodedInstructions } from './useDecodedInstructions';
import { PROGRAM_IDS } from './gorbchainConfig';
import { MintLayout } from '@solana/spl-token'; // Note: @solana-program/token-2022 does NOT export MintLayout. The SPL Token MintLayout is compatible for most use cases.
// If Token-2022 ever diverges, define the layout manually using buffer-layout.
import { Buffer } from 'buffer';

// Helper to convert base64 to hex
function base64ToHex(base64: string) {
  const raw = atob(base64);
  return Array.from(raw).map(x => x.charCodeAt(0).toString(16).padStart(2, '0')).join('');
}

// Helper to parse TLV extensions from a buffer (Token-2022)
function parseTlvExtensions(buf: Uint8Array) {
  // TLV extensions start after the canonical mint layout (82 bytes)
  const TLV_START = 82;
  const extensions: { type: number; length: number; data: Uint8Array; hex: string }[] = [];
  let offset = TLV_START;
  while (offset + 4 <= buf.length) {
    const type = buf[offset];
    const length = buf[offset + 1] | (buf[offset + 2] << 8);
    if (type === 0 || length === 0) break; // End of TLV or padding
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

// Helper to decode Token Metadata extension (type 6)
function decodeTokenMetadataExtension(ext: { data: Uint8Array }) {
  // Token Metadata extension layout (see SPL Token-2022 docs):
  // name: [0,32], symbol: [32,44], uri: [44,200], updateAuthority: [200,232]
  const name = new TextDecoder().decode(ext.data.slice(0, 32)).replace(/\0+$/, '');
  const symbol = new TextDecoder().decode(ext.data.slice(32, 44)).replace(/\0+$/, '');
  const uri = new TextDecoder().decode(ext.data.slice(44, 200)).replace(/\0+$/, '');
  // updateAuthority is a 32-byte pubkey (base58, but show as hex for now)
  const updateAuthority = Array.from(ext.data.slice(200, 232)).map((x: number) => x.toString(16).padStart(2, '0')).join('');
  return { name, symbol, uri, updateAuthority };
}

// Helper to read a BigUInt64LE from a Uint8Array (browser-safe, matches Buffer.readBigUInt64LE)
function readBigUInt64LE(bytes: Uint8Array, offset = 0): string {
  // Polyfill for environments targeting < ES2020
  var lo = bytes[offset] + bytes[offset + 1] * 2 ** 8 + bytes[offset + 2] * 2 ** 16 + bytes[offset + 3] * 2 ** 24;
  var hi = bytes[offset + 4] + bytes[offset + 5] * 2 ** 8 + bytes[offset + 6] * 2 ** 16 + bytes[offset + 7] * 2 ** 24;
  // Use string math to avoid BigInt literals
  var hiStr = hi.toString();
  var loStr = lo.toString();
  // 2^32 = 4294967296
  var result = (hi * 4294967296 + lo).toString();
  return result;
}

// Helper to parse Token2022/SPL Token mint data using the correct MintLayout and TLV extensions
function parseTokenMintData(buf: Uint8Array, programId?: string) {
  // Use SPL Token MintLayout for both SPL Token and Token-2022
  const decoded = MintLayout.decode(Buffer.from(buf));
  let metadataExt = null;
  let allExtensions: any[] = [];
  if (buf.length > 82) {
    const extensions = parseTlvExtensions(buf);
    allExtensions = extensions;
    if (extensions.length === 0) {
      // For debugging, log if no extensions found
      console.log('No TLV extensions found in mint account');
    } else {
      console.log('TLV extensions found:', extensions.map(e => `type=${e.type}, length=${e.length}`));
    }
    const metaExt = extensions.find(e => e.type === 6);
    if (metaExt) {
      if (metaExt.length >= 232) {
        metadataExt = decodeTokenMetadataExtension(metaExt);
      } else {
        console.log('Token Metadata extension (type 6) found but too short:', metaExt.length);
      }
    } else {
      console.log('Token Metadata extension (type 6) not found in TLV extensions');
    }
  }
  // Correctly decode supply as BigUInt64LE
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

// Helper to decode base58 (browser-safe, using bs58)
function base58ToBytes(b58: string): Uint8Array {
  // Minimal browser base58 decode (for demo, not production)
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const BASE = 58;
  let bytes = [0];
  for (let i = 0; i < b58.length; i++) {
    const c = b58[i];
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
  // Deal with leading zeros
  for (let k = 0; k < b58.length && b58[k] === '1'; ++k) bytes.push(0);
  return new Uint8Array(bytes.reverse());
}

// Helper to decode base58 or base64 to bytes
function decodeBase58OrBase64(data: string, setLogs?: (fn: (logs: string[]) => string[]) => void, label?: string): Uint8Array | null {
  // Try base58 first
  try {
    const bytes = base58ToBytes(data);
    if (setLogs && label) setLogs(logs => [...logs, `${label} decoded as base58: ${Array.from(bytes).map(x => x.toString(16).padStart(2, '0')).join('')}`]);
    return bytes;
  } catch (e) {
    // Try base64
    try {
      const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));
      if (setLogs && label) setLogs(logs => [...logs, `${label} decoded as base64: ${Array.from(bytes).map(x => x.toString(16).padStart(2, '0')).join('')}`]);
      return bytes;
    } catch (e2) {
      if (setLogs && label) setLogs(logs => [...logs, `${label} could not be decoded as base58 or base64.`]);
      return null;
    }
  }
}

// Helper to decode as base58 or base64 and return encoding info
function decodeWithEncoding(data: string, setLogs?: (fn: (logs: string[]) => string[]) => void, label?: string): { bytes: Uint8Array | null, encoding: string } {
  try {
    const bytes = base58ToBytes(data);
    if (setLogs && label) setLogs(logs => [...logs, `${label} decoded as base58: ${Array.from(bytes).map(x => x.toString(16).padStart(2, '0')).join('')}`]);
    return { bytes, encoding: 'base58' };
  } catch (e) {
    try {
      const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));
      if (setLogs && label) setLogs(logs => [...logs, `${label} decoded as base64: ${Array.from(bytes).map(x => x.toString(16).padStart(2, '0')).join('')}`]);
      return { bytes, encoding: 'base64' };
    } catch (e2) {
      if (setLogs && label) setLogs(logs => [...logs, `${label} could not be decoded as base58 or base64.`]);
      return { bytes: null, encoding: 'unknown' };
    }
  }
}

// Helper to fetch token metadata (decode as base64 only, with buffer checks)
async function fetchTokenMetadata(mint: string, setLogs: (fn: (logs: string[]) => string[]) => void) {
  const res = await fetch('https://rpc.gorbchain.xyz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getAccountInfo',
      params: [mint, { encoding: 'base64' }],
    }),
  });
  const data = await res.json();
  const value = data.result?.value;
  if (value?.data && Array.isArray(value.data)) {
    const rawData = value.data[0];
    let buf: Uint8Array;
    try {
      buf = Uint8Array.from(atob(rawData), c => c.charCodeAt(0));
    } catch (e) {
      setLogs(logs => [...logs, `Token mint data could not be decoded as base64.`]);
      return null;
    }
    setLogs(logs => [...logs, `Token mint raw: ${rawData}`]);
    setLogs(logs => [...logs, `Token mint raw hex: ${Array.from(buf).map(x => x.toString(16).padStart(2, '0')).join('')}`]);
    setLogs(logs => [...logs, `Token mint buffer length: ${buf.length}`]);
    setLogs(logs => [...logs, `Token mint first 16 bytes: ${Array.from(buf.slice(0,16)).map(x => x.toString(16).padStart(2, '0')).join(' ')}`]);
    if (buf.length < 82) {
      setLogs(logs => [...logs, `Token mint buffer too short for parsing mint layout.`]);
      return null;
    }
    // Parse mint data
    const parsed = parseTokenMintData(buf);
    setLogs(logs => [...logs, `Token mint parsed: supply=${parsed.supply}, decimals=${parsed.decimals}, isInitialized=${parsed.isInitialized}`]);
    // Try to decode the base64 string as base58 for diagnostic purposes
    let base58DecodedHex: string | null = null;
    try {
      const b58 = base58ToBytes(rawData);
      base58DecodedHex = Array.from(b58).map(x => x.toString(16).padStart(2, '0')).join('');
      setLogs(logs => [...logs, `Token mint raw (base58 decode attempt): ${base58DecodedHex}`]);
    } catch (e: any) {
      setLogs(logs => [...logs, `Token mint raw could not be decoded as base58: ${e.message}`]);
    }
    return { hex: Array.from(buf).map(x => x.toString(16).padStart(2, '0')).join(''), encoding: 'base64', base58DecodedHex, ...parsed };
  }
  return null;
}

const registry = new DecoderRegistry();
// Register decoders for known programs
registry.register('token2022', (ix: any) => ({ ...ix, decoded: 'Token2022 (demo)', programId: PROGRAM_IDS.token2022 }));
registry.register('ata', (ix: any) => ({ ...ix, decoded: 'ATA (demo)', programId: PROGRAM_IDS.ata }));
registry.register('metaplex', (ix: any) => ({ ...ix, decoded: 'Metaplex (demo)', programId: PROGRAM_IDS.metaplex }));

function ensureFallbackDecoders(instructions: any[], registry: DecoderRegistry) {
  instructions.forEach((ix, i) => {
    const type = ix.type;
    if (!(registry as any).decoders.has(type)) {
      registry.register(type, (ix: any) => ({ ...ix, decoded: 'Raw', programId: ix.programId }));
    }
  });
}

// Move tryDecodeInstructionData above its first usage
function tryDecodeInstructionData(data: string, setLogs: (fn: (logs: string[]) => string[]) => void) {
  // Try base58 first (Metaplex instructions are usually base58)
  try {
    const bytes = base58ToBytes(data);
    setLogs(logs => [...logs, `Metaplex data decoded as base58: ${Array.from(bytes).map(x => x.toString(16).padStart(2, '0')).join('')}`]);
    return { encoding: 'base58', hex: Array.from(bytes).map(x => x.toString(16).padStart(2, '0')).join('') };
  } catch (e) {
    // Try base64
    try {
      const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));
      setLogs(logs => [...logs, `Metaplex data decoded as base64: ${Array.from(bytes).map(x => x.toString(16).padStart(2, '0')).join('')}`]);
      return { encoding: 'base64', hex: Array.from(bytes).map(x => x.toString(16).padStart(2, '0')).join('') };
    } catch (e2) {
      setLogs(logs => [...logs, `Metaplex data could not be decoded as base58 or base64.`]);
      return { encoding: 'unknown', hex: '' };
    }
  }
}

export default function App() {
  const [sig, setSig] = useState('');
  const [instructions, setInstructions] = useState<any[]>([]);
  const { decoded, loading } = useDecodedInstructions(instructions, registry);
  const [txMeta, setTxMeta] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [tokenMeta, setTokenMeta] = useState<any>(null);

  const handleSearch = async () => {
    setLogs([]);
    setTokenMeta(null);
    // Fetch transaction from gorbchain RPC
    const res = await fetch('https://rpc.gorbchain.xyz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTransaction',
        params: [sig, { maxSupportedTransactionVersion: 0 }],
      }),
    });
    const data = await res.json();
    const tx = data.result;
    setTxMeta(tx);
    if (tx && tx.transaction && tx.transaction.message && tx.transaction.message.instructions) {
      const mapped = tx.transaction.message.instructions.map((ix: any, i: number) => {
        // Detect program by programIdIndex
        const programId = tx.transaction.message.accountKeys[ix.programIdIndex];
        let type = 'raw';
        if (programId === PROGRAM_IDS.token2022) type = 'token2022';
        else if (programId === PROGRAM_IDS.ata) type = 'ata';
        else if (programId === PROGRAM_IDS.metaplex) type = 'metaplex';
        else type = 'unknown' + i;
        setLogs(logs => [...logs, `Instruction ${i}: programId=${programId}, detectedType=${type}`]);
        return { ...ix, type, programId };
      });
      ensureFallbackDecoders(mapped, registry);
      setInstructions(mapped);
      // If first instruction is token2022, fetch mint metadata for demo
      if (mapped[0]?.type === 'token2022') {
        const mintAccount = tx.transaction.message.accountKeys[mapped[0].accounts[0]];
        setLogs(logs => [...logs, `Fetching token metadata for mint: ${mintAccount}`]);
        const meta = await fetchTokenMetadata(mintAccount, setLogs);
        setTokenMeta(meta);
      }
      // If first instruction is metaplex, decode its data
      if (mapped[0]?.type === 'metaplex') {
        const decoded = tryDecodeInstructionData(mapped[0].data, setLogs);
        setTokenMeta(decoded);
      }
    } else {
      setInstructions([]);
    }
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ background: '#1e293b', color: '#fff', padding: '24px 0', textAlign: 'center', boxShadow: '0 2px 8px #0001' }}>
        <h1 style={{ margin: 0, fontWeight: 700, fontSize: 32, letterSpacing: 1 }}>Gorbchain SDK Decoder</h1>
        <div style={{ fontSize: 16, opacity: 0.8 }}>Solana Transaction Explorer & Instruction Decoder</div>
      </header>
      <main style={{ maxWidth: 700, margin: '40px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px #0002', padding: 32 }}>
        <div style={{ marginBottom: 24 }}>
          <input
            value={sig}
            onChange={e => setSig(e.target.value)}
            placeholder="Enter transaction signature"
            style={{ width: 400, marginRight: 8, padding: 8, fontSize: 16, borderRadius: 6, border: '1px solid #cbd5e1' }}
          />
          <button onClick={handleSearch} disabled={loading} style={{ padding: '8px 20px', fontSize: 16, borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', fontWeight: 600 }}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        {txMeta && (
          <div style={{ marginBottom: 24, background: '#f1f5f9', borderRadius: 8, padding: 16, fontSize: 15 }}>
            <div><b>Slot:</b> {txMeta.slot}</div>
            <div><b>Block Time:</b> {txMeta.blockTime ? new Date(txMeta.blockTime * 1000).toLocaleString() : 'N/A'}</div>
            <div><b>Fee:</b> {txMeta.meta?.fee ?? 'N/A'}</div>
            <div><b>Status:</b> {txMeta.meta?.status?.Ok === null ? 'Success' : JSON.stringify(txMeta.meta?.status)}</div>
          </div>
        )}
        {tokenMeta && (
          <div style={{ marginBottom: 24, background: '#dbeafe', borderRadius: 8, padding: 16, fontSize: 15 }}>
            <div><b>Token Mint Info:</b></div>
            <div>Supply: <b>{tokenMeta.supply}</b></div>
            <div>Decimals: <b>{tokenMeta.decimals}</b></div>
            <div>Initialized: <b>{tokenMeta.isInitialized ? 'Yes' : 'No'}</b></div>
            <div>Mint Authority Option: <b>{JSON.stringify(tokenMeta.mintAuthorityOption)}</b></div>
            <div>Mint Authority: <b>{tokenMeta.mintAuthority}</b></div>
            <div>Freeze Authority Option: <b>{JSON.stringify(tokenMeta.freezeAuthorityOption)}</b></div>
            <div>Freeze Authority: <b>{tokenMeta.freezeAuthority}</b></div>
            {tokenMeta.tlvExtensions && tokenMeta.tlvExtensions.length > 0 && (
              <details style={{ marginTop: 8 }}>
                <summary>TLV Extensions Found</summary>
                <ul style={{ fontFamily: 'monospace', fontSize: 13 }}>
                  {tokenMeta.tlvExtensions.map((ext: any, i: number) => (
                    <li key={i}>
                      Type: <b>{ext.type}</b>, Length: <b>{ext.length}</b>, Data (first 16 bytes): <span>{Array.from(ext.data.slice(0, 16)).map((x: unknown) => (x as number).toString(16).padStart(2, '0')).join(' ')}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
            <details style={{ marginTop: 8 }}>
              <summary>Raw Data</summary>
              <pre style={{ margin: 0 }}>{JSON.stringify(tokenMeta, null, 2)}</pre>
            </details>
          </div>
        )}
        {tokenMeta && tokenMeta.tokenMetadata && (
          <div style={{ marginBottom: 24, background: '#f0fdf4', borderRadius: 8, padding: 16, fontSize: 15 }}>
            <div><b>Token Metadata Extension:</b></div>
            <div>Name: <b>{tokenMeta.tokenMetadata.name ? tokenMeta.tokenMetadata.name : <i>None</i>}</b></div>
            <div>Symbol: <b>{tokenMeta.tokenMetadata.symbol ? tokenMeta.tokenMetadata.symbol : <i>None</i>}</b></div>
            <div>URI: <b style={{ wordBreak: 'break-all' }}>{tokenMeta.tokenMetadata.uri ? tokenMeta.tokenMetadata.uri : <i>None</i>}</b></div>
            <div>Update Authority (hex): <b style={{ wordBreak: 'break-all' }}>{tokenMeta.tokenMetadata.updateAuthority ? tokenMeta.tokenMetadata.updateAuthority : <i>None</i>}</b></div>
          </div>
        )}
        {tokenMeta && !tokenMeta.tokenMetadata && tokenMeta.tlvExtensions && tokenMeta.tlvExtensions.length > 0 && (
          <div style={{ marginBottom: 24, background: '#fef2f2', borderRadius: 8, padding: 16, fontSize: 15, color: '#b91c1c' }}>
            <div><b>No Token Metadata extension found.</b></div>
            <div>TLV Extensions present in mint account:</div>
            <ul style={{ fontFamily: 'monospace', fontSize: 13 }}>
              {tokenMeta.tlvExtensions.map((ext: any, i: number) => (
                <li key={i}>Type: {ext.type}, Length: {ext.length}, Hex: {ext.hex.slice(0, 64)}...</li>
              ))}
            </ul>
          </div>
        )}
        {tokenMeta && instructions[0]?.type === 'metaplex' && (
          <div style={{ marginBottom: 24, background: '#dbeafe', borderRadius: 8, padding: 16, fontSize: 15 }}>
            <div><b>Metaplex Instruction Data:</b></div>
            <div>Encoding: <b>{tokenMeta.encoding}</b></div>
            <div>Hex: <b style={{ wordBreak: 'break-all' }}>{tokenMeta.hex}</b></div>
          </div>
        )}
        <div style={{ marginTop: 24 }}>
          {logs.length > 0 && (
            <div style={{ background: '#fef9c3', borderRadius: 8, padding: 12, marginBottom: 16, color: '#92400e', fontSize: 14 }}>
              <b>Detection Logs:</b>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {logs.map((log, i) => <li key={i} style={{ fontFamily: 'monospace' }}>{log}</li>)}
              </ul>
            </div>
          )}
          {loading && <div>Loading...</div>}
          {decoded && decoded.length > 0 && (
            <pre style={{ background: '#f1f5f9', borderRadius: 8, padding: 16, fontSize: 14, overflowX: 'auto' }}>{JSON.stringify(decoded, null, 2)}</pre>
          )}
        </div>
      </main>
    </div>
  );
}
