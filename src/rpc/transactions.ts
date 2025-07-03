// RPC utilities for sending transactions and querying status
import type { RpcSendOptions } from '@solana/kit';

/**
 * Send a transaction using the provided connection and signers
 */
export async function sendRpcTransaction(
  connection: any, // Use the actual connection class if available
  transaction: any, // Use the actual Transaction type if available
  signers: any[],
  options?: RpcSendOptions
): Promise<string> {
  return await connection.sendTransaction(transaction, signers, options);
}

/**
 * Get the confirmation status of a transaction
 */
export async function getTransactionStatus(
  connection: any,
  signature: string
): Promise<any> {
  return await connection.getSignatureStatus(signature);
}

/**
 * Get the current slot
 */
export async function getCurrentSlot(connection: any): Promise<number> {
  return await connection.getSlot();
}

/**
 * Get the current block height
 */
export async function getBlockHeight(connection: any): Promise<number> {
  return await connection.getBlockHeight();
}

/**
 * Get the latest blockhash and last valid block height
 */
export async function getLatestBlockhash(connection: any): Promise<{ blockhash: string; lastValidBlockHeight: number }> {
  // The method name and return shape may differ depending on the kit version; adjust as needed
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  return { blockhash, lastValidBlockHeight };
}

export * from './fetchTransactionBySignature.js';
