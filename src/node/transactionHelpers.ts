// Transaction helpers for SDK (browser/node)
// These are stubs; real implementations should use @solana/web3.js or backend API

import { PublicKey, Transaction, TransactionInstruction, Connection, sendAndConfirmTransaction, Keypair } from '@solana/web3.js';

export async function createTransaction(instructions: TransactionInstruction[], payer: PublicKey, recentBlockhash?: string): Promise<Transaction> {
  const tx = new Transaction();
  tx.add(...instructions);
  tx.feePayer = payer;
  if (recentBlockhash) tx.recentBlockhash = recentBlockhash;
  return tx;
}

export async function createRawTransaction(instructions: TransactionInstruction[], payer: PublicKey, recentBlockhash?: string): Promise<Uint8Array> {
  const tx = await createTransaction(instructions, payer, recentBlockhash);
  return tx.serialize();
}

export async function signTransaction(tx: Transaction, signer: Keypair): Promise<Transaction> {
  tx.partialSign(signer);
  return tx;
}

export async function sendTransaction(connection: Connection, tx: Transaction, signers: Keypair[]): Promise<string> {
  return await sendAndConfirmTransaction(connection, tx, signers);
}

export async function simulateTransaction(connection: Connection, tx: Transaction): Promise<any> {
  return await connection.simulateTransaction(tx);
}
