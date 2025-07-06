// RPC Account Methods - Our own implementation based on Solana RPC specs
import { getGorbchainConfig } from '../utils/gorbchainConfig.js';

export interface AccountInfo {
  executable: boolean;
  owner: string;
  lamports: number;
  data: string;
  rentEpoch: number;
}

export interface RpcResponse<T> {
  jsonrpc: string;
  id: number;
  result: T | null;
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Get account information for a given public key
 */
export async function getAccountInfo(
  connection: any,
  pubkey: string,
  options?: { encoding?: string; commitment?: string }
): Promise<AccountInfo | null> {
  const config = getGorbchainConfig();
  const rpcUrl = config.rpcUrl || 'https://rpc.gorbchain.xyz';

  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getAccountInfo',
      params: [
        pubkey,
        {
          encoding: options?.encoding || 'base64',
          commitment: options?.commitment || 'finalized'
        }
      ]
    })
  });

  const data: RpcResponse<{ value: AccountInfo }> = await response.json();
  return data.result?.value || null;
}

/**
 * Get multiple account information at once
 */
export async function getMultipleAccounts(
  connection: any,
  pubkeys: string[],
  options?: { encoding?: string; commitment?: string }
): Promise<(AccountInfo | null)[]> {
  const config = getGorbchainConfig();
  const rpcUrl = config.rpcUrl || 'https://rpc.gorbchain.xyz';

  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getMultipleAccounts',
      params: [
        pubkeys,
        {
          encoding: options?.encoding || 'base64',
          commitment: options?.commitment || 'finalized'
        }
      ]
    })
  });

  const data: RpcResponse<{ value: (AccountInfo | null)[] }> = await response.json();
  return data.result?.value || [];
}

/**
 * Get all accounts owned by a specific program
 */
export async function getProgramAccounts(
  connection: any,
  programId: string,
  options?: {
    encoding?: string;
    commitment?: string;
    filters?: Array<{
      memcmp?: { offset: number; bytes: string };
      dataSize?: number;
    }>;
  }
): Promise<Array<{ pubkey: string; account: AccountInfo }>> {
  const config = getGorbchainConfig();
  const rpcUrl = config.rpcUrl || 'https://rpc.gorbchain.xyz';

  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getProgramAccounts',
      params: [
        programId,
        {
          encoding: options?.encoding || 'base64',
          commitment: options?.commitment || 'finalized',
          filters: options?.filters || []
        }
      ]
    })
  });

  const data: RpcResponse<Array<{ pubkey: string; account: AccountInfo }>> = await response.json();
  return data.result || [];
}

/**
 * Get the balance of an account in lamports
 */
export async function getBalance(
  connection: any,
  pubkey: string,
  commitment?: string
): Promise<number> {
  const config = getGorbchainConfig();
  const rpcUrl = config.rpcUrl || 'https://rpc.gorbchain.xyz';

  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getBalance',
      params: [
        pubkey,
        {
          commitment: commitment || 'finalized'
        }
      ]
    })
  });

  const data: RpcResponse<{ value: number }> = await response.json();
  return data.result?.value || 0;
}
