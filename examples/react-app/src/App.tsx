import React, { useState } from 'react';
import { DecoderRegistry } from './DecoderRegistry';
import { useDecodedInstructions } from './useDecodedInstructions';
import { PROGRAM_IDS } from './gorbchainConfig';
import {
  fetchAndDecodeMintAccount,
  decodeMintAccount,
  base64ToHex,
  base58ToBytes,
  bytesToBase58,
  decodeWithEncoding,
} from '@gorbchain-xyz/chaindecode';

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
    setLogs(logs => [...logs, `Metaplex data decoded as base58: ${Array.from(bytes).map((x) => (x as number).toString(16).padStart(2, '0')).join('')}`]);
    return { encoding: 'base58', hex: Array.from(bytes).map((x) => (x as number).toString(16).padStart(2, '0')).join('') };
  } catch (e) {
    // Try base64
    try {
      const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));
      setLogs(logs => [...logs, `Metaplex data decoded as base64: ${Array.from(bytes).map((x) => (x as number).toString(16).padStart(2, '0')).join('')}`]);
      return { encoding: 'base64', hex: Array.from(bytes).map((x) => (x as number).toString(16).padStart(2, '0')).join('') };
    } catch (e2) {
      setLogs(logs => [...logs, `Metaplex data could not be decoded as base58 or base64.`]);
      return { encoding: 'unknown', hex: '' };
    }
  }
}

// Helper to fetch token metadata (decode as base64 only, with buffer checks)
async function fetchTokenMetadata(mint: string, setLogs: (fn: (logs: string[]) => string[]) => void) {
  setLogs(logs => [...logs, `Fetching mint info using SDK for: ${mint}`]);
  const meta = await fetchAndDecodeMintAccount(mint);
  if (!meta) {
    setLogs(logs => [...logs, `Mint info not found or could not be decoded.`]);
    return null;
  }
  setLogs(logs => [...logs, `Mint info decoded via SDK: supply=${meta.supply}, decimals=${meta.decimals}, isInitialized=${meta.isInitialized}`]);
  return meta;
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
            <div>Mint Authority: <b>{tokenMeta.mintAuthorityBase58}</b></div>
            <div style={{ fontSize: 12, color: '#888' }}>(hex: {tokenMeta.mintAuthority})</div>
            <div>Freeze Authority: <b>{tokenMeta.freezeAuthorityBase58}</b></div>
            <div style={{ fontSize: 12, color: '#888' }}>(hex: {tokenMeta.freezeAuthority})</div>
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
