// Fetch and decode a transaction by signature using the registry
// This belongs in the SDK transaction utilities, not in the app
import { PROGRAM_IDS } from '../utils/gorbchainConfig.js';
import { ensureFallbackDecoders } from '../utils/ensureFallbackDecoders.js';
import { fetchTransactionBySignature } from '../rpc/fetchTransactionBySignature.js';
import type { DecoderRegistry, DecodedInstruction } from '../decoders/registry.js';

interface TransactionInstruction {
  programIdIndex: number;
  data: Uint8Array;
  accounts?: number[];
}

interface TransactionMessage {
  accountKeys: string[];
  instructions: TransactionInstruction[];
}

interface TransactionData {
  transaction: {
    message: TransactionMessage;
  };
  meta: unknown;
}

export async function getAndDecodeTransaction({
  signature,
  registry,
  connection
}: {
  signature: string;
  registry: DecoderRegistry;
  connection: unknown; // Connection type varies by implementation
}): Promise<{ decoded: DecodedInstruction[]; meta: unknown }> {
  const tx = await fetchTransactionBySignature(connection, signature) as TransactionData | null;
  if (!tx?.transaction?.message?.instructions) {
    return { decoded: [], meta: null };
  }
  const mapped = tx.transaction.message.instructions.map((ix: TransactionInstruction, i: number) => {
    const programId = tx.transaction.message.accountKeys[ix.programIdIndex];
    let type = 'raw';
    if (programId === PROGRAM_IDS.token2022) type = 'token2022';
    else if (programId === PROGRAM_IDS.ata) type = 'ata';
    else if (programId === PROGRAM_IDS.metaplex) type = 'metaplex';
    else type = `unknown${  i}`;
    return { ...ix, type, programId };
  });
  ensureFallbackDecoders(mapped, registry);
  const decoded = mapped.map((ix: TransactionInstruction & { type: string; programId: string }) => {
    try {
      return registry.decode(ix);
    } catch (e: unknown) {
      return {
        type: 'error',
        programId: ix.programId,
        data: { error: e instanceof Error ? e.message : String(e) },
        accounts: ix.accounts || [],
        raw: ix
      };
    }
  });
  return { decoded, meta: tx.meta };
}
