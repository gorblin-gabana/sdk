// SPL Token decoders and builders
// Unified entry point for all SPL Token-related decoding in the SDK.
// Only export public decoders/types. Helpers are private.
import { IInstruction } from '@solana/instructions';
import { decodeMintAccount, DecodedMintAccount } from '../utils/decodeMintAccount.js';
import { getGorbchainConfig } from '../utils/gorbchainConfig.js';
import { Address, address } from '@solana/addresses';

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

function writeUInt64LE(buffer: Buffer, value: bigint | number | string, offset = 0) {
  // Fallback for ES2016: only support up to Number.MAX_SAFE_INTEGER
  let n = typeof value === 'bigint' ? Number(value) : typeof value === 'string' ? Number(value) : value;
  for (let i = 0; i < 8; i++) {
    buffer[offset + i] = n & 0xff;
    n = Math.floor(n / 256);
  }
}

// --- Public decoders ---
export function decodeMintInstruction(ix: IInstruction) {
  if (!ix.data || ix.data[0] !== MINT_TO) throw new Error('Not a MintTo instruction');
  const data = Buffer.from(ix.data);
  const amount = readUInt64LE(data, 1);
  return {
    type: 'mint',
    amount: amount.toString(),
    mint: ix.accounts?.[0]?.address ?? '',
    destination: ix.accounts?.[1]?.address ?? '',
    authority: ix.accounts?.[2]?.address ?? '',
    multiSigners: (ix.accounts?.slice(3) ?? []).map(k => k.address),
  };
}

export function decodeTransferInstruction(ix: IInstruction) {
  if (!ix.data || ix.data[0] !== TRANSFER) throw new Error('Not a Transfer instruction');
  const data = Buffer.from(ix.data);
  const amount = readUInt64LE(data, 1);
  return {
    type: 'transfer',
    amount: amount.toString(),
    source: {
      address: ix.accounts?.[0]?.address ?? '',
    },
    destination: {
      address: ix.accounts?.[1]?.address ?? '',
    },
    authority: {
      address: ix.accounts?.[2]?.address ?? '',
    },
    multiSigners: (ix.accounts?.slice(3) ?? []).map(k => ({
      address: k.address,
    })),
    raw: Array.from(data).map(x => x.toString(16).padStart(2, '0')).join(''),
  };
}

export function decodeBurnInstruction(ix: IInstruction) {
  if (!ix.data || ix.data[0] !== BURN) throw new Error('Not a Burn instruction');
  const data = Buffer.from(ix.data);
  const amount = readUInt64LE(data, 1);
  return {
    type: 'burn',
    amount: amount.toString(),
    account: ix.accounts?.[0]?.address ?? '',
    mint: ix.accounts?.[1]?.address ?? '',
    authority: ix.accounts?.[2]?.address ?? '',
    multiSigners: (ix.accounts?.slice(3) ?? []).map(k => k.address),
  };
}

export function decodeSetAuthorityInstruction(ix: IInstruction) {
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
    account: ix.accounts?.[0]?.address ?? '',
    authorityType,
    newAuthority,
    authority: ix.accounts?.[1]?.address ?? '',
    multiSigners: (ix.accounts?.slice(2) ?? []).map(k => k.address),
  };
}

export function decodeCreateAccountInstruction(ix: IInstruction) {
  if (!ix.data || ix.data[0] !== INITIALIZE_ACCOUNT) throw new Error('Not an InitializeAccount instruction');
  return {
    type: 'createAccount',
    account: ix.accounts?.[0]?.address ?? '',
    mint: ix.accounts?.[1]?.address ?? '',
    owner: ix.accounts?.[2]?.address ?? '',
    rent: ix.accounts?.[3]?.address ?? '',
  };
}

export function decodeCloseAccountInstruction(ix: IInstruction) {
  if (!ix.data || ix.data[0] !== CLOSE_ACCOUNT) throw new Error('Not a CloseAccount instruction');
  return {
    type: 'closeAccount',
    account: ix.accounts?.[0]?.address ?? '',
    destination: ix.accounts?.[1]?.address ?? '',
    authority: ix.accounts?.[2]?.address ?? '',
    multiSigners: (ix.accounts?.slice(3) ?? []).map(k => k.address),
  };
}

/**
 * Create a MintTo instruction (mint tokens to an account)
 */
export function createMintToInstruction({
  mint,
  destination,
  authority,
  amount,
  multiSigners = [],
}: {
  mint: string | Address;
  destination: string | Address;
  authority: string | Address;
  amount: bigint | number | string;
  multiSigners?: (string | Address)[];
}): IInstruction {
  const programAddress = address(getGorbchainConfig().programIds?.splToken || 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
  const data = new Uint8Array(9);
  data[0] = MINT_TO;
  let n = typeof amount === 'bigint' ? amount : BigInt(amount);
  for (let i = 0; i < 8; i++) {
    data[1 + i] = Number(n & BigInt(255));
    n = n / BigInt(256);
  }
  return {
    programAddress,
    accounts: [
      { address: address(mint), role: 1 }, // writable
      { address: address(destination), role: 1 }, // writable
      { address: address(authority), role: 2 }, // writable signer
      ...multiSigners.map((k) => ({ address: address(k), role: 2 })), // writable signer
    ],
    data,
  };
}

/**
 * Create a Transfer instruction (transfer tokens between accounts)
 */
export function createTransferInstruction({
  source,
  destination,
  authority,
  amount,
  multiSigners = [],
}: {
  source: string | Address;
  destination: string | Address;
  authority: string | Address;
  amount: bigint | number | string;
  multiSigners?: (string | Address)[];
}): IInstruction {
  const programAddress = address(getGorbchainConfig().programIds?.splToken || 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
  const data = new Uint8Array(9);
  data[0] = TRANSFER;
  let n = typeof amount === 'bigint' ? amount : BigInt(amount);
  for (let i = 0; i < 8; i++) {
    data[1 + i] = Number(n & BigInt(255));
    n = n / BigInt(256);
  }
  return {
    programAddress,
    accounts: [
      { address: address(source), role: 1 }, // writable
      { address: address(destination), role: 1 }, // writable
      { address: address(authority), role: 2 }, // writable signer
      ...multiSigners.map((k) => ({ address: address(k), role: 2 })), // writable signer
    ],
    data,
  };
}

/**
 * Create a new SPL Token account (associated token account)
 */
export function createTokenAccountInstruction({
  payer,
  newAccount,
  mint,
  owner,
}: {
  payer: string | Address;
  newAccount: string | Address;
  mint: string | Address;
  owner: string | Address;
}): IInstruction {
  // This is a simplified version; for full ATA creation, use @solana/spl-token
  return {
    programAddress: address(getGorbchainConfig().programIds?.splToken || 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    accounts: [
      { address: address(payer), role: 2 }, // writable signer
      { address: address(newAccount), role: 1 }, // writable
      { address: address(mint), role: 1 }, // writable
      { address: address(owner), role: 1 }, // writable
    ],
    data: new Uint8Array(0), // No data for simple create
  };
}

// --- Account decoders ---
export { decodeMintAccount, DecodedMintAccount };
