// Fetch and decode a transaction by signature using the registry
// This belongs in the SDK transaction utilities, not in the app
import { PROGRAM_IDS } from '../utils/gorbchainConfig.js';
import { ensureFallbackDecoders } from '../utils/ensureFallbackDecoders.js';
import { fetchTransactionBySignature } from '../rpc/fetchTransactionBySignature.js';

export async function getAndDecodeTransaction({
  signature,
  registry,
  connection,
}: {
  signature: string;
  registry: any;
  connection: any;
}): Promise<{ decoded: any[]; meta: any }> {
  const tx = await fetchTransactionBySignature(connection, signature);
  if (!tx || !tx.transaction || !tx.transaction.message || !tx.transaction.message.instructions) {
    return { decoded: [], meta: null };
  }
  const mapped = tx.transaction.message.instructions.map((ix: any, i: number) => {
    const programId = tx.transaction.message.accountKeys[ix.programIdIndex];
    let type = 'raw';
    if (programId === PROGRAM_IDS.token2022) type = 'token2022';
    else if (programId === PROGRAM_IDS.ata) type = 'ata';
    else if (programId === PROGRAM_IDS.metaplex) type = 'metaplex';
    else type = 'unknown' + i;
    return { ...ix, type, programId };
  });
  ensureFallbackDecoders(mapped, registry);
  const decoded = mapped.map((ix: any) => {
    try {
      return registry.decode(ix.type, ix);
    } catch (e: any) {
      return { error: e?.message || String(e), raw: ix };
    }
  });
  return { decoded, meta: tx.meta };
}
