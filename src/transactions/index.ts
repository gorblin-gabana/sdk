// Transaction utilities for fetching, sending, and building transactions
import { Address, address } from '@solana/addresses';
import { IInstruction } from '@solana/instructions';
import { createTransactionMessage } from '@solana/transaction-messages';
import { setTransactionMessageFeePayer } from '@solana/transaction-messages';
import { setTransactionMessageLifetimeUsingBlockhash } from '@solana/transaction-messages';
import { appendTransactionMessageInstruction } from '@solana/transaction-messages';
import { compileTransaction, signTransaction, Transaction } from '@solana/transactions';
import { getLatestBlockhash } from '../rpc/transactions.js';
import { pipe } from '@solana/functional';

/**
 * Create and sign a transaction from instructions and feePayer. Automatically fetches recentBlockhash and lastValidBlockHeight.
 */
export async function createTransaction({
  connection,
  instructions,
  feePayer,
  signers,
}: {
  connection: any; // Should be Connection from @solana/kit
  instructions: IInstruction[];
  feePayer: string | Address;
  signers: CryptoKeyPair[];
}): Promise<Transaction> {
  const { blockhash, lastValidBlockHeight } = await getLatestBlockhash(connection);
  const msg = pipe(
    createTransactionMessage({ version: 0 }),
    m => setTransactionMessageFeePayer(typeof feePayer === 'string' ? address(feePayer) : feePayer, m),
    m => setTransactionMessageLifetimeUsingBlockhash({
      blockhash: blockhash as any, // Cast to any to satisfy branded type
      lastValidBlockHeight: BigInt(lastValidBlockHeight),
    }, m),
    m => {
      let out = m;
      for (const ix of instructions) {
        out = appendTransactionMessageInstruction(ix, out);
      }
      return out;
    }
  );
  const compiled = compileTransaction(msg);
  const signed = await signTransaction(signers, compiled);
  return signed;
}

/**
 * Return transaction metadata and raw instructions for UI or API
 */
export function getTransactionMetadata(tx: Transaction) {
  return {
    signatures: tx.signatures,
    messageBytes: tx.messageBytes,
    // No direct feePayer/recentBlockhash/instructions on Transaction type in kit
  };
}

export * from './getAndDecodeTransaction.js';