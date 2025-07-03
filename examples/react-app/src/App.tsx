import React, { useState } from 'react';
import { DecoderRegistry } from './DecoderRegistry';
import { useDecodedInstructions } from './useDecodedInstructions';
import { PROGRAM_IDS } from './gorbchainConfig';
import {
  decodeMintAccount,
  createMintToInstruction,
  createTransferInstruction,
  createTokenAccountInstruction,
  decodeTransactionInstruction,
  decodeTransactionInstructions,
  buildCreateMetadataInstruction,
  decodeCreateMetadata,
  bytesToBase58,
  base58ToBytes,
  getAndDecodeTransaction,
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
  setLogs(logs => [...logs, `Fetching mint info from RPC for: ${mint}`]);
  // Demo: Replace with actual fetch logic or remove if not needed
  setLogs(logs => [...logs, `Mint info not found or could not be decoded from RPC.`]);
  return null;
}

export default function App() {
  const [sig, setSig] = useState('');
  const [instructions, setInstructions] = useState<any[]>([]);
  const { decoded, loading } = useDecodedInstructions(instructions, registry);
  const [txMeta, setTxMeta] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [tokenMeta, setTokenMeta] = useState<any>(null);
  const [tab, setTab] = useState('decode');
  const [sdkResult, setSdkResult] = useState<any>(null);
  const [sdkCode, setSdkCode] = useState<string>('');
  const [inputIx, setInputIx] = useState('');

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

  // New: SDK test handlers
  const handleDecodeTransaction = async () => {
    setSdkCode(`import { getAndDecodeTransaction } from '@gorbchain-xyz/chaindecode';\nconst result = await getAndDecodeTransaction(connection, signature, registry);`);
    // In handleDecodeTransaction, pass a connection object (or mock for browser demo)
    const connection = {
      getTransaction: async (signature: string, opts: any) => {
        // fallback to fetch for browser demo
        const res = await fetch('https://rpc.gorbchain.xyz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getTransaction',
            params: [signature, opts],
          }),
        });
        const data = await res.json();
        return data.result;
      },
    };
    const result = await getAndDecodeTransaction({ signature: sig, registry, connection });
    setSdkResult(result);
  };

  const handleSendTransaction = async () => {
    setSdkCode(`import { sendRpcTransaction } from '@gorbchain-xyz/chaindecode';\nconst sig = await sendRpcTransaction(connection, transaction, signers);`);
    setSdkResult('Demo: This would call sendRpcTransaction(connection, transaction, signers)');
  };

  const handleCreateInstructions = () => {
    const mintIx = createMintToInstruction({
      mint: 'Mint111111111111111111111111111111111111111',
      destination: 'Dest11111111111111111111111111111111111111',
      authority: 'Auth11111111111111111111111111111111111111',
      amount: 1000,
    });
    const transferIx = createTransferInstruction({
      source: 'Src111111111111111111111111111111111111111',
      destination: 'Dest11111111111111111111111111111111111111',
      authority: 'Auth11111111111111111111111111111111111111',
      amount: 500,
    });
    const createIx = createTokenAccountInstruction({
      payer: 'Payer1111111111111111111111111111111111111',
      newAccount: 'New11111111111111111111111111111111111111',
      mint: 'Mint111111111111111111111111111111111111111',
      owner: 'Owner1111111111111111111111111111111111111',
    });
    setSdkCode(`import { createMintToInstruction, createTransferInstruction, createTokenAccountInstruction } from '@gorbchain-xyz/chaindecode';\nconst mintIx = createMintToInstruction({ ... });\nconst transferIx = createTransferInstruction({ ... });\nconst createIx = createTokenAccountInstruction({ ... });`);
    setSdkResult({ mintIx, transferIx, createIx });
  };

  const handleDecodeInstructions = () => {
    // Use the above created instructions for demo
    const mintIx = createMintToInstruction({
      mint: 'Mint111111111111111111111111111111111111111',
      destination: 'Dest11111111111111111111111111111111111111',
      authority: 'Auth11111111111111111111111111111111111111',
      amount: 1000,
    });
    const decoded = decodeTransactionInstruction(mintIx);
    setSdkCode(`import { decodeTransactionInstruction } from '@gorbchain-xyz/chaindecode';\nconst decoded = decodeTransactionInstruction(mintIx);`);
    setSdkResult(decoded);
  };

  const handleCreateMetaplexInstruction = () => {
    const ix = buildCreateMetadataInstruction({
      name: 'Demo NFT',
      symbol: 'DEMO',
      uri: 'https://example.com/metadata.json',
      sellerFeeBasisPoints: 500,
      updateAuthority: 'Auth11111111111111111111111111111111111111',
      mint: 'Mint111111111111111111111111111111111111111',
      payer: 'Payer1111111111111111111111111111111111111',
    });
    setSdkCode(`import { buildCreateMetadataInstruction } from '@gorbchain-xyz/chaindecode';\nconst ix = buildCreateMetadataInstruction({ ... });`);
    setSdkResult(ix);
  };

  const handleDecodeMetaplexInstruction = () => {
    const ix = buildCreateMetadataInstruction({
      name: 'Demo NFT',
      symbol: 'DEMO',
      uri: 'https://example.com/metadata.json',
      sellerFeeBasisPoints: 500,
      updateAuthority: 'Auth11111111111111111111111111111111111111',
      mint: 'Mint111111111111111111111111111111111111111',
      payer: 'Payer1111111111111111111111111111111111111',
    });
    const decoded = decodeCreateMetadata(ix);
    setSdkCode(`import { decodeCreateMetadata } from '@gorbchain-xyz/chaindecode';\nconst decoded = decodeCreateMetadata(ix);`);
    setSdkResult(decoded);
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ background: '#1e293b', color: '#fff', padding: '24px 0', textAlign: 'center', boxShadow: '0 2px 8px #0001', borderRadius: '0 0 16px 16px' }}>
        <h1 style={{ margin: 0, fontWeight: 700, fontSize: 36, letterSpacing: 2 }}>Gorbchain SDK Decoder</h1>
        <div style={{ fontSize: 18, opacity: 0.85, marginTop: 4 }}>Solana Transaction Explorer &amp; Instruction Decoder</div>
      </header>
      <main style={{ maxWidth: 1000, margin: '48px auto', background: '#fff', borderRadius: 18, boxShadow: '0 4px 32px #0002', padding: 40, display: 'flex', gap: 40, minHeight: 600 }}>
        <div style={{ flex: 1, minWidth: 340 }}>
          <div style={{ marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button className={tab==='decode'? 'active' : ''} onClick={() => setTab('decode')}>Decode Transaction</button>
            <button className={tab==='send'? 'active' : ''} onClick={() => setTab('send')}>Send Transaction</button>
            <button className={tab==='create'? 'active' : ''} onClick={() => setTab('create')}>Create SPL Token Instructions</button>
            <button className={tab==='decodeIx'? 'active' : ''} onClick={() => setTab('decodeIx')}>Decode Instructions</button>
            <button className={tab==='createMetaplex'? 'active' : ''} onClick={() => setTab('createMetaplex')}>Create Metaplex NFT Instruction</button>
            <button className={tab==='decodeMetaplex'? 'active' : ''} onClick={() => setTab('decodeMetaplex')}>Decode Metaplex NFT Instruction</button>
          </div>
          {tab === 'decode' && (
            <div style={{ marginBottom: 24 }}>
              <h3>Decode Transaction by Signature</h3>
              <input
                type="text"
                value={sig}
                onChange={e => setSig(e.target.value)}
                placeholder="Enter transaction signature"
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 12, fontSize: 16 }}
              />
              <button onClick={handleDecodeTransaction} style={{ padding: '8px 20px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none', fontWeight: 600, fontSize: 16 }}>Run Test</button>
              {sdkResult && <pre style={{ marginTop: 16 }}>{JSON.stringify(sdkResult, null, 2)}</pre>}
            </div>
          )}
          {tab === 'send' && (
            <div style={{ marginBottom: 24 }}>
              <h3>Send Transaction (Demo)</h3>
              <input
                type="text"
                value={sig}
                onChange={e => setSig(e.target.value)}
                placeholder="Enter transaction signature to send"
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 12, fontSize: 16 }}
              />
              <button onClick={handleSendTransaction} style={{ padding: '8px 20px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none', fontWeight: 600, fontSize: 16 }}>Run Test</button>
              {sdkResult && <pre style={{ marginTop: 16 }}>{JSON.stringify(sdkResult, null, 2)}</pre>}
            </div>
          )}
          {tab === 'decodeIx' && (
            <div style={{ marginBottom: 24 }}>
              <h3>Decode SPL Token Instruction</h3>
              <textarea
                value={inputIx}
                onChange={e => setInputIx(e.target.value)}
                placeholder="Paste base64/base58 encoded instruction data or JSON"
                style={{ width: '100%', minHeight: 60, padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 12, fontSize: 15 }}
              />
              <button onClick={handleDecodeInstructions} style={{ padding: '8px 20px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none', fontWeight: 600, fontSize: 16 }}>Run Test</button>
              {sdkResult && <pre style={{ marginTop: 16 }}>{JSON.stringify(sdkResult, null, 2)}</pre>}
            </div>
          )}
          {tab === 'create' && (
            <div style={{ marginBottom: 24 }}>
              <h3>Create SPL Token Instructions</h3>
              <button onClick={handleCreateInstructions} style={{ padding: '8px 20px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none', fontWeight: 600, fontSize: 16 }}>Run Test</button>
              {sdkResult && <pre style={{ marginTop: 16 }}>{JSON.stringify(sdkResult, null, 2)}</pre>}
            </div>
          )}
          {tab === 'createMetaplex' && (
            <div style={{ marginBottom: 24 }}>
              <h3>Create Metaplex NFT Instruction</h3>
              <button onClick={handleCreateMetaplexInstruction} style={{ padding: '8px 20px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none', fontWeight: 600, fontSize: 16 }}>Run Test</button>
              {sdkResult && <pre style={{ marginTop: 16 }}>{JSON.stringify(sdkResult, null, 2)}</pre>}
            </div>
          )}
          {tab === 'decodeMetaplex' && (
            <div style={{ marginBottom: 24 }}>
              <h3>Decode Metaplex NFT Instruction</h3>
              <button onClick={handleDecodeMetaplexInstruction} style={{ padding: '8px 20px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none', fontWeight: 600, fontSize: 16 }}>Run Test</button>
              {sdkResult && <pre style={{ marginTop: 16 }}>{JSON.stringify(sdkResult, null, 2)}</pre>}
            </div>
          )}
        </div>
        <div style={{ flex: 1, background: '#f8fafc', borderRadius: 12, padding: 24, fontSize: 15, minHeight: 400, boxShadow: '0 2px 8px #0001' }}>
          <h3 style={{ marginTop: 0, fontWeight: 600, fontSize: 18 }}>Sample Code</h3>
          <pre style={{ background: '#f1f5f9', borderRadius: 8, padding: 18, fontSize: 15, overflowX: 'auto', minHeight: 320 }}>{sdkCode}</pre>
        </div>
      </main>
      <style>{`
        button { cursor: pointer; border: none; background: #e2e8f0; color: #1e293b; font-weight: 600; padding: 8px 16px; border-radius: 8px; margin-right: 2px; transition: background 0.2s; }
        button.active, button:focus { background: #2563eb; color: #fff; }
        button:hover:not(.active) { background: #cbd5e1; }
        input, textarea { outline: none; transition: border 0.2s; }
        input:focus, textarea:focus { border: 1.5px solid #2563eb; }
        pre { background: #f1f5f9; border-radius: 8px; padding: 12px; font-size: 15px; overflow-x: auto; }
      `}</style>
    </div>
  );
}
