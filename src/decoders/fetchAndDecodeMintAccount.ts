// SDK helper to fetch and decode a mint account using Gor API
// Usage: await fetchAndDecodeMintAccount(mintAddress)

import { decodeMintAccount, DecodedMintAccount } from './decodeMintAccount.js';

export async function fetchAndDecodeMintAccount(mint: string): Promise<DecodedMintAccount | null> {
  const res = await fetch(`https://gorbscan.com/api/account/${mint}/info`);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.account?.data) return null;
  // Try to decode as base64
  try {
    return decodeMintAccount(data.account.data, { encoding: 'base64' });
  } catch (e) {
    // fallback: try as hex
    try {
      return decodeMintAccount(data.account.data, { encoding: 'hex' });
    } catch {
      return null;
    }
  }
}
