// RPC Transaction Methods - Our own implementation based on Solana RPC specs
import { getGorbchainConfig } from '../utils/gorbchainConfig.js';
import type { RpcClient } from './client.js';

export interface TransactionSignature {
  signature: string;
  slot: number;
  err: any;
  memo: string | null;
  blockTime: number | null;
}

export interface TransactionDetails {
  slot: number;
  transaction: {
    message: {
      accountKeys: string[];
      instructions: Array<{
        programIdIndex: number;
        accounts: number[];
        data: string;
      }>;
      recentBlockhash: string;
    };
    signatures: string[];
  };
  meta: {
    err: any;
    status: { Ok: null } | { Err: any };
    fee: number;
    preBalances: number[];
    postBalances: number[];
    logMessages: string[];
  } | null;
  blockTime: number | null;
}

/**
 * Send a transaction to the network
 */
export async function sendTransaction(
  client: RpcClient,
  transaction: string,
  options?: {
    skipPreflight?: boolean;
    preflightCommitment?: string;
    encoding?: string;
  }
): Promise<string> {
  return client.request<string>('sendTransaction', [
    transaction,
    {
      skipPreflight: options?.skipPreflight || false,
      preflightCommitment: options?.preflightCommitment || 'finalized',
      encoding: options?.encoding || 'base64'
    }
  ]);
}

/**
 * Get transaction details by signature
 */
export async function getTransaction(
  client: RpcClient,
  signature: string,
  options?: {
    encoding?: string;
    commitment?: string;
    maxSupportedTransactionVersion?: number;
  }
): Promise<TransactionDetails | null> {
  return client.request<TransactionDetails | null>('getTransaction', [
    signature,
    {
      encoding: options?.encoding || 'json',
      commitment: options?.commitment || 'finalized',
      maxSupportedTransactionVersion: options?.maxSupportedTransactionVersion || 0
    }
  ]);
}

/**
 * Get signature status
 */
export async function getSignatureStatus(
  client: RpcClient,
  signature: string
): Promise<{
  slot: number;
  confirmations: number | null;
  err: any;
  confirmationStatus?: string;
} | null> {
  const result = await client.request<{
    value: Array<{
      slot: number;
      confirmations: number | null;
      err: any;
      confirmationStatus?: string;
    } | null>;
  }>('getSignatureStatuses', [[signature]]);

  return result.value[0];
}

// Legacy functions for backward compatibility (deprecated)
export async function sendRpcTransaction(
  connection: any,
  transaction: any,
  signers: any[],
  options?: any
): Promise<string> {
  console.warn('sendRpcTransaction is deprecated. Use sendTransaction with RpcClient instead.');
  throw new Error('Please use the new RPC client structure');
}

export async function getTransactionStatus(
  connection: any,
  signature: string
): Promise<any> {
  console.warn('getTransactionStatus is deprecated. Use getSignatureStatus with RpcClient instead.');
  throw new Error('Please use the new RPC client structure');
}

export async function getCurrentSlot(connection: any): Promise<number> {
  console.warn('getCurrentSlot is deprecated. Use RpcClient.getSlot() instead.');
  throw new Error('Please use the new RPC client structure');
}

export async function getBlockHeight(connection: any): Promise<number> {
  console.warn('getBlockHeight is deprecated. Use RpcClient.getBlockHeight() instead.');
  throw new Error('Please use the new RPC client structure');
}

export async function getLatestBlockhash(connection: any): Promise<{ blockhash: string; lastValidBlockHeight: number }> {
  console.warn('getLatestBlockhash is deprecated. Use RpcClient.getLatestBlockhash() instead.');
  throw new Error('Please use the new RPC client structure');
}

export * from './fetchTransactionBySignature.js';
