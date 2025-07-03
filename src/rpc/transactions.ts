// RPC utilities for sending transactions
import { Connection, Transaction, SendOptions, TransactionSignature } from '@solana/web3.js';

/**
 * Send a transaction using the provided connection and signers
 */
export async function sendRpcTransaction(
  connection: Connection,
  transaction: Transaction,
  signers: any[],
  options?: SendOptions
): Promise<TransactionSignature> {
  return await connection.sendTransaction(transaction, signers, options);
}
