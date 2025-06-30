import React, { useState } from 'react';
import { DecoderRegistry } from '../../src/registry';
import { useDecodedInstructions } from '../../src/react/useDecodedInstructions';

const registry = new DecoderRegistry();
// Register core decoders here as needed

export default function App() {
  const [sig, setSig] = useState('');
  const [instructions, setInstructions] = useState<any[]>([]);
  const { decoded, loading } = useDecodedInstructions(instructions, registry);

  const handleSearch = async () => {
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
    if (tx && tx.transaction && tx.transaction.message && tx.transaction.message.instructions) {
      setInstructions(tx.transaction.message.instructions.map((ix: any, i: number) => ({ ...ix, type: 'unknown' + i })));
    } else {
      setInstructions([]);
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <h2>ChainDecode Explorer</h2>
      <input
        value={sig}
        onChange={e => setSig(e.target.value)}
        placeholder="Enter transaction signature"
        style={{ width: 400, marginRight: 8 }}
      />
      <button onClick={handleSearch} disabled={loading}>Search</button>
      <div style={{ marginTop: 24 }}>
        {loading && <div>Loading...</div>}
        {decoded && decoded.length > 0 && (
          <pre>{JSON.stringify(decoded, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
