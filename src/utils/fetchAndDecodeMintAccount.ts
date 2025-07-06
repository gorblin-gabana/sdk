import { decodeMintAccount, DecodedMintAccount } from '../utils/decodeMintAccount.js';
export { decodeMintAccount, DecodedMintAccount };

// SDK helper to fetch and decode a mint account using Gor API
// Moved to utils as a private helper, not exported from decoders

export async function fetchAndDecodeMintAccount(mint: string): Promise<DecodedMintAccount | null> {
  const res = await fetch(`https://gorbscan.com/api/account/${mint}/info`);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.account?.data) return null;
  // Try to decode as base64
  try {
    return decodeMintAccount(data.account.data, { encoding: 'base64' });
  } catch (_e) {
    // fallback: try as hex
    try {
      return decodeMintAccount(data.account.data, { encoding: 'hex' });
    } catch {
      return null;
    }
  }
}

// Add decodeAndMintAccount here as well if needed
