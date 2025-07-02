// Generic fetcher for any Solana account (program, mint, etc)
// Usage: await fetchProgramAccount(address)

import { getGorbchainConfig } from './gorbchainConfig.js';

export interface ProgramAccountInfo {
  pubkey: string;
  owner: string;
  lamports: number;
  executable: boolean;
  rentEpoch: number;
  data: string; // base64
  raw?: Uint8Array;
}

export async function fetchProgramAccount(address: string): Promise<ProgramAccountInfo | null> {
  // Use the public Solana RPC (or allow override via config)
  const res = await fetch('https://rpc.gorbchain.xyz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getAccountInfo',
      params: [address, { encoding: 'base64' }],
    }),
  });
  const data = await res.json();
  if (!data?.result?.value) return null;
  const info = data.result.value;
  return {
    pubkey: address,
    owner: info.owner,
    lamports: info.lamports,
    executable: info.executable,
    rentEpoch: info.rentEpoch,
    data: info.data[0], // base64
    raw: Uint8Array.from(atob(info.data[0]), c => c.charCodeAt(0)),
  };
}

export async function fetchMintAccountFromRpc(mint: string): Promise<import('./decodeMintAccount.js').DecodedMintAccount | null> {
  const acct = await fetchProgramAccount(mint);
  if (!acct || !acct.data) return null;
  // Use all known token program IDs from config
  const config = getGorbchainConfig();
  const TOKEN_PROGRAMS = [
    config.programIds?.token2022,
    config.programIds?.token,
    config.programIds?.splToken,
    config.programIds?.mainnetToken,
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // fallback SPL Token
  ].filter(Boolean);
  if (acct.raw && acct.raw.length < 82) return null;
  if (!TOKEN_PROGRAMS.includes(acct.owner)) return null;
  try {
    // Try to decode as base64
    return (await import('./decodeMintAccount.js')).decodeMintAccount(acct.data, { encoding: 'base64' });
  } catch (e) {
    // fallback: try as hex
    try {
      return (await import('./decodeMintAccount.js')).decodeMintAccount(acct.data, { encoding: 'hex' });
    } catch {
      return null;
    }
  }
}
