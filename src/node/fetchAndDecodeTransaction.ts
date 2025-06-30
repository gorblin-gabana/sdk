// Utility: fetch and decode transaction details from RPC
import { DecoderRegistry } from '../registry';

export async function fetchAndDecodeTransaction(signature: string, rpcUrl: string, registry: DecoderRegistry, overrides?: Record<string, any>) {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getTransaction',
      params: [signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }],
    }),
  });
  const { result } = await res.json();
  if (!result) throw new Error('Transaction not found');
  const instructions = result.transaction.message.instructions;
  const decoded = instructions.map((ix: any) => registry.decode(ix.program, ix, overrides?.[ix.program]));
  return { ...result, decodedInstructions: decoded };
}
