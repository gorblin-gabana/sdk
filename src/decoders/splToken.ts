// SPL Token decoders and builders
// Unified entry point for all SPL Token-related decoding in the SDK.
// Only export public decoders/types. Helpers are private.
import { TransactionInstruction } from '@solana/web3.js';
import { decodeMintAccount, DecodedMintAccount } from '../utils/decodeMintAccount.js';

// --- Instruction discriminators (SPL Token program spec) ---
const MINT_TO = 7;
const TRANSFER = 3;
const BURN = 8;
const SET_AUTHORITY = 6;
const INITIALIZE_ACCOUNT = 1;
const CLOSE_ACCOUNT = 9;

// --- Private helpers ---
function readUInt64LE(buffer: Buffer, offset = 0) {
  const lower = buffer.readUInt32LE(offset);
  const upper = buffer.readUInt32LE(offset + 4);
  return upper * 0x100000000 + lower;
}

// --- Public decoders ---
export function decodeMintInstruction(ix: TransactionInstruction) {
  if (!ix.data || ix.data[0] !== MINT_TO) throw new Error('Not a MintTo instruction');
  const data = Buffer.from(ix.data);
  const amount = readUInt64LE(data, 1);
  return {
    type: 'mint',
    amount: amount.toString(),
    mint: ix.keys[0]?.pubkey?.toBase58?.() ?? '',
    destination: ix.keys[1]?.pubkey?.toBase58?.() ?? '',
    authority: ix.keys[2]?.pubkey?.toBase58?.() ?? '',
    multiSigners: ix.keys.slice(3).map(k => k.pubkey.toBase58()),
  };
}

export function decodeTransferInstruction(ix: TransactionInstruction) {
  if (!ix.data || ix.data[0] !== TRANSFER) throw new Error('Not a Transfer instruction');
  const data = Buffer.from(ix.data);
  const amount = readUInt64LE(data, 1);
  return {
    type: 'transfer',
    amount: amount.toString(),
    source: {
      address: ix.keys[0]?.pubkey?.toBase58?.() ?? '',
      raw: ix.keys[0]?.pubkey?.toString?.() ?? '',
    },
    destination: {
      address: ix.keys[1]?.pubkey?.toBase58?.() ?? '',
      raw: ix.keys[1]?.pubkey?.toString?.() ?? '',
    },
    authority: {
      address: ix.keys[2]?.pubkey?.toBase58?.() ?? '',
      raw: ix.keys[2]?.pubkey?.toString?.() ?? '',
    },
    multiSigners: ix.keys.slice(3).map(k => ({
      address: k.pubkey.toBase58(),
      raw: k.pubkey.toString(),
    })),
    raw: Array.from(data).map(x => x.toString(16).padStart(2, '0')).join(''),
  };
}

export function decodeBurnInstruction(ix: TransactionInstruction) {
  if (!ix.data || ix.data[0] !== BURN) throw new Error('Not a Burn instruction');
  const data = Buffer.from(ix.data);
  const amount = readUInt64LE(data, 1);
  return {
    type: 'burn',
    amount: amount.toString(),
    account: ix.keys[0]?.pubkey?.toBase58?.() ?? '',
    mint: ix.keys[1]?.pubkey?.toBase58?.() ?? '',
    authority: ix.keys[2]?.pubkey?.toBase58?.() ?? '',
    multiSigners: ix.keys.slice(3).map(k => k.pubkey.toBase58()),
  };
}

export function decodeSetAuthorityInstruction(ix: TransactionInstruction) {
  if (!ix.data || ix.data[0] !== SET_AUTHORITY) throw new Error('Not a SetAuthority instruction');
  const data = Buffer.from(ix.data);
  const authorityType = data[1];
  const newAuthorityOption = data[2];
  let newAuthority = null;
  if (newAuthorityOption) {
    newAuthority = Buffer.from(data.slice(3, 35)).toString('hex');
  }
  return {
    type: 'setAuthority',
    account: ix.keys[0]?.pubkey?.toBase58?.() ?? '',
    authorityType,
    newAuthority,
    authority: ix.keys[1]?.pubkey?.toBase58?.() ?? '',
    multiSigners: ix.keys.slice(2).map(k => k.pubkey.toBase58()),
  };
}

export function decodeCreateAccountInstruction(ix: TransactionInstruction) {
  if (!ix.data || ix.data[0] !== INITIALIZE_ACCOUNT) throw new Error('Not an InitializeAccount instruction');
  return {
    type: 'createAccount',
    account: ix.keys[0]?.pubkey?.toBase58?.() ?? '',
    mint: ix.keys[1]?.pubkey?.toBase58?.() ?? '',
    owner: ix.keys[2]?.pubkey?.toBase58?.() ?? '',
    rent: ix.keys[3]?.pubkey?.toBase58?.() ?? '',
  };
}

export function decodeCloseAccountInstruction(ix: TransactionInstruction) {
  if (!ix.data || ix.data[0] !== CLOSE_ACCOUNT) throw new Error('Not a CloseAccount instruction');
  return {
    type: 'closeAccount',
    account: ix.keys[0]?.pubkey?.toBase58?.() ?? '',
    destination: ix.keys[1]?.pubkey?.toBase58?.() ?? '',
    authority: ix.keys[2]?.pubkey?.toBase58?.() ?? '',
    multiSigners: ix.keys.slice(3).map(k => k.pubkey.toBase58()),
  };
}

// --- Account decoders ---
export { decodeMintAccount, DecodedMintAccount };

// --- Clean: Only public decoders are exported. All helpers are private or in utils. ---
