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
  const meta = await fetchMintAccountFromRpc(mint);
  if (!meta) {
    setLogs(logs => [...logs, `Mint info not found or could not be decoded from RPC.`]);
    return null;
  }
  setLogs(logs => [...logs, `Mint info decoded via RPC: supply=${meta.supply}, decimals=${meta.decimals}, isInitialized=${meta.isInitialized}`]);
  return meta;
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
    setSdkCode(`import { getAndDecodeTransaction } from '@gorbchain-xyz/chaindecode';\nconst result = await getAndDecodeTransaction(connection, signature);`);
    // You'd need a Connection object and a real signature in a real app
    setSdkResult('Demo: This would call getAndDecodeTransaction(connection, signature)');
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

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ background: '#1e293b', color: '#fff', padding: '24px 0', textAlign: 'center', boxShadow: '0 2px 8px #0001' }}>
        <h1 style={{ margin: 0, fontWeight: 700, fontSize: 32, letterSpacing: 1 }}>Gorbchain SDK Decoder</h1>
        <div style={{ fontSize: 16, opacity: 0.8 }}>Solana Transaction Explorer & Instruction Decoder</div>
      </header>
      <main style={{ maxWidth: 900, margin: '40px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px #0002', padding: 32, display: 'flex', gap: 32 }}>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 16 }}>
            <button onClick={() => setTab('decode')}>Decode Transaction</button>
            <button onClick={() => setTab('send')}>Send Transaction</button>
            <button onClick={() => setTab('create')}>Create SPL Token Instructions</button>
            <button onClick={() => setTab('decodeIx')}>Decode Instructions</button>
          </div>
          {tab === 'decode' && (
            <div>
              <h3>Decode Transaction by Signature</h3>
              <button onClick={handleDecodeTransaction}>Run Test</button>
              {sdkResult && <pre>{JSON.stringify(sdkResult, null, 2)}</pre>}
            </div>
          )}
          {tab === 'send' && (
            <div>
              <h3>Send Transaction (Demo)</h3>
              <button onClick={handleSendTransaction}>Run Test</button>
              {sdkResult && <pre>{JSON.stringify(sdkResult, null, 2)}</pre>}
            </div>
          )}
          {tab === 'create' && (
            <div>
              <h3>Create SPL Token Instructions</h3>
              <button onClick={handleCreateInstructions}>Run Test</button>
              {sdkResult && <pre>{JSON.stringify(sdkResult, null, 2)}</pre>}
            </div>
          )}
          {tab === 'decodeIx' && (
            <div>
              <h3>Decode SPL Token Instruction</h3>
              <button onClick={handleDecodeInstructions}>Run Test</button>
              {sdkResult && <pre>{JSON.stringify(sdkResult, null, 2)}</pre>}
            </div>
          )}
        </div>
        <div style={{ flex: 1, background: '#f8fafc', borderRadius: 8, padding: 16, fontSize: 14, minHeight: 400 }}>
          <h3>Sample Code</h3>
          <pre style={{ background: '#f1f5f9', borderRadius: 8, padding: 16, fontSize: 14, overflowX: 'auto' }}>{sdkCode}</pre>
        </div>
      </main>
    </div>
  );
}
