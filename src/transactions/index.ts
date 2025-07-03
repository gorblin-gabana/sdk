// Transaction utilities for fetching, sending, and decoding transactions
import { Connection, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction } from '@solana/web3.js';
import { decodeMintInstruction, decodeTransferInstruction } from '../decoders/splToken.js';

/**
 * Fetch a transaction by signature and decode its instructions
 */
export async function getAndDecodeTransaction(
  connection: Connection,
  signature: string
): Promise<{ slot: number; instructions: any[]; raw: any[] } | null> {
  const txInfo = await connection.getTransaction(signature, { commitment: 'confirmed' });
  if (!txInfo || !txInfo.transaction) return null;
  const instructions = txInfo.transaction.message.instructions.map((ix: any) => {
    // Try SPL Token decoders (expand as needed)
    try {
      return decodeMintInstruction(ix);
    } catch {}
    try {
      return decodeTransferInstruction(ix);
    } catch {}
    // Fallback: raw
    return { raw: ix };
  });
  return {
    slot: txInfo.slot,
    instructions,
    raw: txInfo.transaction.message.instructions, // Now typed as any[]
  };
}

/**
 * Send a transaction and return the signature
 */
export async function sendTransaction(
  connection: Connection,
  transaction: Transaction,
  signers: any[]
): Promise<string> {
  return await sendAndConfirmTransaction(connection, transaction, signers);
}
