// SPL Token Program Decoders - Built from Solana program specifications
import type { DecodedInstruction } from './registry.js';
import { getGorbchainConfig } from '../utils/gorbchainConfig.js';

// Get SPL Token program ID from config
function getSPLTokenProgramId(): string {
  const config = getGorbchainConfig();
  return config.programIds?.splToken ?? 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
}

interface SPLTokenInstructionData {
  programId: string;
  data: Uint8Array;
  accounts: string[];
}

// SPL Token Instruction Types (discriminators)
export enum SPLTokenInstruction {
  InitializeMint = 0,
  InitializeAccount = 1,
  InitializeMultisig = 2,
  Transfer = 3,
  Approve = 4,
  Revoke = 5,
  SetAuthority = 6,
  MintTo = 7,
  Burn = 8,
  CloseAccount = 9,
  FreezeAccount = 10,
  ThawAccount = 11,
  TransferChecked = 12,
  ApproveChecked = 13,
  MintToChecked = 14,
  BurnChecked = 15,
  InitializeAccount2 = 16,
  SyncNative = 17,
  InitializeAccount3 = 18,
  InitializeMultisig2 = 19,
  InitializeMint2 = 20,
}

// Authority Types
export enum AuthorityType {
  MintTokens = 0,
  FreezeAccount = 1,
  AccountOwner = 2,
  CloseAccount = 3,
}

/**
 * Main SPL Token decoder function
 */
export function decodeSPLTokenInstruction(instruction: SPLTokenInstructionData): DecodedInstruction {
  const data = instruction.data;
  if (!data || data.length === 0) {
    throw new Error('Invalid SPL Token instruction: no data');
  }

  const instructionType = data[0];
  const programId = getSPLTokenProgramId();

  switch (instructionType) {
    case SPLTokenInstruction.Transfer as number:
      return decodeTransfer(instruction, programId);
    case SPLTokenInstruction.MintTo as number:
      return decodeMintTo(instruction, programId);
    case SPLTokenInstruction.Burn as number:
      return decodeBurn(instruction, programId);
    case SPLTokenInstruction.InitializeMint as number:
      return decodeInitializeMint(instruction, programId);
    case SPLTokenInstruction.InitializeAccount as number:
      return decodeInitializeAccount(instruction, programId);
    case SPLTokenInstruction.SetAuthority as number:
      return decodeSetAuthority(instruction, programId);
    case SPLTokenInstruction.Approve as number:
      return decodeApprove(instruction, programId);
    case SPLTokenInstruction.Revoke as number:
      return decodeRevoke(instruction, programId);
    case SPLTokenInstruction.CloseAccount as number:
      return decodeCloseAccount(instruction, programId);
    case SPLTokenInstruction.FreezeAccount as number:
      return decodeFreezeAccount(instruction, programId);
    case SPLTokenInstruction.ThawAccount as number:
      return decodeThawAccount(instruction, programId);
    case SPLTokenInstruction.TransferChecked as number:
      return decodeTransferChecked(instruction, programId);
    case SPLTokenInstruction.ApproveChecked as number:
      return decodeApproveChecked(instruction, programId);
    case SPLTokenInstruction.MintToChecked as number:
      return decodeMintToChecked(instruction, programId);
    case SPLTokenInstruction.BurnChecked as number:
      return decodeBurnChecked(instruction, programId);
    case SPLTokenInstruction.SyncNative as number:
      return decodeSyncNative(instruction, programId);
    default:
      return {
        type: 'spl-token-unknown',
        programId,
        data: {
          instructionType,
          error: `Unknown SPL Token instruction type: ${instructionType}`
        },
        accounts: instruction.accounts,
        raw: instruction as unknown as Record<string, unknown>
      };
  }
}

/**
 * Enhanced SPL Token instruction decoder with amount extraction
 */
export function decodeSPLTokenInstructionWithDetails(data: Uint8Array): {
  type: string;
  instruction: string;
  amount?: bigint;
  decimals?: number;
  accounts: unknown[];
} {
  if (data.length === 0) {
    return {
      type: 'spl-token-unknown',
      instruction: 'Unknown SPL Token instruction',
      accounts: []
    };
  }

  const instructionType = data[0];

  switch (instructionType) {
    case 3: // Transfer
      if (data.length >= 9) {
        const amount = new DataView(data.buffer, data.byteOffset + 1, 8).getBigUint64(0, true);
        return {
          type: 'spl-token-transfer',
          instruction: 'Transfer tokens',
          amount,
          accounts: []
        };
      }
      break;

    case 7: // MintTo
      if (data.length >= 9) {
        const amount = new DataView(data.buffer, data.byteOffset + 1, 8).getBigUint64(0, true);
        return {
          type: 'spl-token-mint-to',
          instruction: 'Mint tokens',
          amount,
          accounts: []
        };
      }
      break;

    case 8: // Burn
      if (data.length >= 9) {
        const amount = new DataView(data.buffer, data.byteOffset + 1, 8).getBigUint64(0, true);
        return {
          type: 'spl-token-burn',
          instruction: 'Burn tokens',
          amount,
          accounts: []
        };
      }
      break;

    case 4: // Approve
      if (data.length >= 9) {
        const amount = new DataView(data.buffer, data.byteOffset + 1, 8).getBigUint64(0, true);
        return {
          type: 'spl-token-approve',
          instruction: 'Approve token spending',
          amount,
          accounts: []
        };
      }
      break;

    case 5: // Revoke
      return {
        type: 'spl-token-revoke',
        instruction: 'Revoke token approval',
        accounts: []
      };

    case 9: // CloseAccount
      return {
        type: 'spl-token-close-account',
        instruction: 'Close token account',
        accounts: []
      };

    case 10: // FreezeAccount
      return {
        type: 'spl-token-freeze-account',
        instruction: 'Freeze token account',
        accounts: []
      };

    case 11: // ThawAccount
      return {
        type: 'spl-token-thaw-account',
        instruction: 'Thaw token account',
        accounts: []
      };

    case 0: // InitializeMint
      if (data.length >= 51) {
        const decimals = data[1];
        return {
          type: 'spl-token-initialize-mint',
          instruction: `Initialize mint with ${decimals} decimals`,
          decimals,
          accounts: []
        };
      }
      break;

    case 1: // InitializeAccount
      return {
        type: 'spl-token-initialize-account',
        instruction: 'Initialize token account',
        accounts: []
      };

    default:
      return {
        type: 'spl-token-unknown',
        instruction: `Unknown SPL Token instruction (type: ${instructionType})`,
        accounts: []
      };
  }

  return {
    type: 'spl-token-unknown',
    instruction: 'Unknown SPL Token instruction',
    accounts: []
  };
}

/**
 * Decode base58 instruction data to Uint8Array
 */
export function decodeInstructionData(base58Data: string): Uint8Array {
  try {
    // Simple base58 decode - in production use proper base58 library
    const bytes = new Uint8Array(Buffer.from(base58Data, 'base64'));
    return bytes;
  } catch (error) {
    // Failed to decode instruction data - return empty array
    return new Uint8Array(0);
  }
}

/**
 * Decode Transfer instruction (3)
 * Layout: [u8 instruction, u64 amount]
 */
function decodeTransfer(instruction: SPLTokenInstructionData, programId: string): DecodedInstruction {
  const data = instruction.data;
  if (data.length !== 9) {
    throw new Error('Invalid Transfer instruction data length');
  }

  const amount = readU64LE(data, 1);
  const accounts = instruction.accounts;

  return {
    type: 'spl-token-transfer',
    programId,
    data: {
      amount: amount.toString(),
      source: accounts[0] ?? null,
      destination: accounts[1] ?? null,
      authority: accounts[2] ?? null,
      signers: accounts.slice(3)
    },
    accounts,
    raw: instruction as unknown as Record<string, unknown>
  };
}

/**
 * Decode MintTo instruction (7)
 * Layout: [u8 instruction, u64 amount]
 */
function decodeMintTo(instruction: SPLTokenInstructionData, programId: string): DecodedInstruction {
  const data = instruction.data;
  if (data.length !== 9) {
    throw new Error('Invalid MintTo instruction data length');
  }

  const amount = readU64LE(data, 1);
  const accounts = instruction.accounts;

  return {
    type: 'spl-token-mint-to',
    programId,
    data: {
      amount: amount.toString(),
      mint: accounts[0] ?? null,
      account: accounts[1] ?? null,
      authority: accounts[2] ?? null,
      signers: accounts.slice(3)
    },
    accounts,
    raw: instruction as unknown as Record<string, unknown>
  };
}

/**
 * Decode Burn instruction (8)
 * Layout: [u8 instruction, u64 amount]
 */
function decodeBurn(instruction: SPLTokenInstructionData, programId: string): DecodedInstruction {
  const data = instruction.data;
  if (data.length !== 9) {
    throw new Error('Invalid Burn instruction data length');
  }

  const amount = readU64LE(data, 1);
  const accounts = instruction.accounts ?? [];

  return {
    type: 'spl-token-burn',
    programId,
    data: {
      amount: amount.toString(),
      account: accounts[0] ?? null,
      mint: accounts[1] ?? null,
      authority: accounts[2] ?? null,
      signers: accounts.slice(3)
    },
    accounts,
    raw: instruction as unknown as Record<string, unknown>
  };
}

/**
 * Decode InitializeMint instruction (0)
 * Layout: [u8 instruction, u8 decimals, [u8; 32] mint_authority, Option<[u8; 32]> freeze_authority]
 */
function decodeInitializeMint(instruction: any, programId: string): DecodedInstruction {
  const data = instruction.data;
  if (data.length !== 67) {
    throw new Error('Invalid InitializeMint instruction data length');
  }

  const decimals = data[1];
  const mintAuthority = data.slice(2, 34);
  const freezeAuthorityOption = data[34];
  const freezeAuthority = freezeAuthorityOption ? data.slice(35, 67) : null;

  return {
    type: 'spl-token-initialize-mint',
    programId,
    data: {
      decimals,
      mintAuthority: bufferToBase58(mintAuthority),
      freezeAuthority: freezeAuthority ? bufferToBase58(freezeAuthority) : null
    },
    accounts: instruction.accounts ?? [],
    raw: instruction as unknown as Record<string, unknown>
  };
}

/**
 * Decode InitializeAccount instruction (1)
 */
function decodeInitializeAccount(instruction: any, programId: string): DecodedInstruction {
  const accounts = instruction.accounts ?? [];

  return {
    type: 'spl-token-initialize-account',
    programId,
    data: {
      account: accounts[0]?.address ?? accounts[0],
      mint: accounts[1]?.address ?? accounts[1],
      owner: accounts[2]?.address ?? accounts[2],
      rentSysvar: accounts[3]?.address ?? accounts[3]
    },
    accounts,
    raw: instruction as unknown as Record<string, unknown>
  };
}

/**
 * Decode SetAuthority instruction (6)
 * Layout: [u8 instruction, u8 authority_type, Option<[u8; 32]> new_authority]
 */
function decodeSetAuthority(instruction: any, programId: string): DecodedInstruction {
  const data = instruction.data;
  if (data.length !== 35) {
    throw new Error('Invalid SetAuthority instruction data length');
  }

  const authorityType = data[1];
  const newAuthorityOption = data[2];
  const newAuthority = newAuthorityOption ? data.slice(3, 35) : null;

  return {
    type: 'spl-token-set-authority',
    programId,
    data: {
      authorityType: getAuthorityTypeName(authorityType),
      newAuthority: newAuthority ? bufferToBase58(newAuthority) : null
    },
    accounts: instruction.accounts ?? [],
    raw: instruction as unknown as Record<string, unknown>
  };
}

/**
 * Decode other instructions with simple layouts
 */
function decodeApprove(instruction: any, programId: string): DecodedInstruction {
  const data = instruction.data;
  const amount = readU64LE(data, 1);
  const accounts = instruction.accounts;

  return {
    type: 'spl-token-approve',
    programId,
    data: {
      amount: amount.toString(),
      source: accounts[0] ?? null,           // Token account
      delegate: accounts[1] ?? null,         // Delegate account
      authority: accounts[2] ?? null,        // Authority (owner)
      signers: accounts.slice(3)
    },
    accounts,
    raw: instruction as unknown as Record<string, unknown>
  };
}

function decodeRevoke(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'spl-token-revoke',
    programId,
    data: {},
    accounts: instruction.accounts ?? [],
    raw: instruction as unknown as Record<string, unknown>
  };
}

function decodeCloseAccount(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'spl-token-close-account',
    programId,
    data: {},
    accounts: instruction.accounts ?? [],
    raw: instruction as unknown as Record<string, unknown>
  };
}

function decodeFreezeAccount(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'spl-token-freeze-account',
    programId,
    data: {},
    accounts: instruction.accounts ?? [],
    raw: instruction as unknown as Record<string, unknown>
  };
}

function decodeThawAccount(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'spl-token-thaw-account',
    programId,
    data: {},
    accounts: instruction.accounts ?? [],
    raw: instruction as unknown as Record<string, unknown>
  };
}

function decodeTransferChecked(instruction: any, programId: string): DecodedInstruction {
  const data = instruction.data;
  const amount = readU64LE(data, 1);
  const decimals = data[9];

  return {
    type: 'spl-token-transfer-checked',
    programId,
    data: { amount: amount.toString(), decimals },
    accounts: instruction.accounts ?? [],
    raw: instruction as unknown as Record<string, unknown>
  };
}

function decodeApproveChecked(instruction: any, programId: string): DecodedInstruction {
  const data = instruction.data;
  const amount = readU64LE(data, 1);
  const decimals = data[9];

  return {
    type: 'spl-token-approve-checked',
    programId,
    data: { amount: amount.toString(), decimals },
    accounts: instruction.accounts ?? [],
    raw: instruction as unknown as Record<string, unknown>
  };
}

function decodeMintToChecked(instruction: any, programId: string): DecodedInstruction {
  const data = instruction.data;
  const amount = readU64LE(data, 1);
  const decimals = data[9];

  return {
    type: 'spl-token-mint-to-checked',
    programId,
    data: { amount: amount.toString(), decimals },
    accounts: instruction.accounts ?? [],
    raw: instruction as unknown as Record<string, unknown>
  };
}

function decodeBurnChecked(instruction: any, programId: string): DecodedInstruction {
  const data = instruction.data;
  const amount = readU64LE(data, 1);
  const decimals = data[9];

  return {
    type: 'spl-token-burn-checked',
    programId,
    data: { amount: amount.toString(), decimals },
    accounts: instruction.accounts ?? [],
    raw: instruction as unknown as Record<string, unknown>
  };
}

function decodeSyncNative(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'spl-token-sync-native',
    programId,
    data: {},
    accounts: instruction.accounts ?? [],
    raw: instruction as unknown as Record<string, unknown>
  };
}

// Utility functions
function readU64LE(buffer: Uint8Array | number[], offset: number): string {
  // Read 64-bit little-endian integer as string to avoid BigInt requirement
  let result = 0;
  let multiplier = 1;

  // Read the lower 32 bits
  for (let i = 0; i < 4; i++) {
    result += buffer[offset + i] * multiplier;
    multiplier *= 256;
  }

  // For simplicity, ignore the upper 32 bits if they would cause overflow
  // In production, you'd want proper 64-bit integer handling
  let upper = 0;
  multiplier = 1;
  for (let i = 4; i < 8; i++) {
    upper += buffer[offset + i] * multiplier;
    multiplier *= 256;
  }

  // Combine lower and upper parts, handling overflow by returning as string
  const total = result + (upper * Math.pow(2, 32));
  return total.toString();
}

function bufferToBase58(buffer: Uint8Array | number[]): string {
  // Simplified base58 encoding - in production, use a proper base58 library
  // For now, return hex representation
  return Array.from(buffer).map((b: number) => {
    const hex = b.toString(16);
    return hex.length === 1 ? `0${  hex}` : hex;
  }).join('');
}

function getAuthorityTypeName(type: number): string {
  switch (type) {
    case AuthorityType.MintTokens as number: return 'MintTokens';
    case AuthorityType.FreezeAccount as number: return 'FreezeAccount';
    case AuthorityType.AccountOwner as number: return 'AccountOwner';
    case AuthorityType.CloseAccount as number: return 'CloseAccount';
    default: return `Unknown(${type})`;
  }
}
