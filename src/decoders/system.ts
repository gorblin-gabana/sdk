// System Program Decoder for Solana
// Handles SOL transfers, account creation, and other system operations

/**
 * System program instruction types
 */
export enum SystemInstructionType {
  CreateAccount = 0,
  Assign = 1,
  Transfer = 2,
  CreateAccountWithSeed = 3,
  AdvanceNonceAccount = 4,
  WithdrawNonceAccount = 5,
  InitializeNonceAccount = 6,
  AuthorizeNonceAccount = 7,
  Allocate = 8,
  AllocateWithSeed = 9,
  AssignWithSeed = 10,
  TransferWithSeed = 11,
  UpgradeNonceAccount = 12
}

/**
 * Decoded system instruction interface
 */
export interface DecodedSystemInstruction {
  type: string;
  instruction: string;
  lamports?: bigint;
  space?: bigint;
  seed?: string;
  programId?: string;
  accounts: string[];
}

/**
 * Decode system program instruction from raw data
 */
export function decodeSystemInstruction(data: Uint8Array): DecodedSystemInstruction {
  if (data.length === 0) {
    return {
      type: 'system-unknown',
      instruction: 'Unknown system instruction',
      accounts: []
    };
  }

  // System instructions use little-endian u32 for instruction type
  const instructionType = new DataView(data.buffer, data.byteOffset, 4).getUint32(0, true);

  switch (instructionType) {
    case SystemInstructionType.Transfer:
      if (data.length >= 12) {
        const lamports = new DataView(data.buffer, data.byteOffset + 4, 8).getBigUint64(0, true);
        return {
          type: 'system-transfer',
          instruction: `Transfer ${Number(lamports) / 1e9} SOL`,
          lamports,
          accounts: []
        };
      }
      break;

    case SystemInstructionType.CreateAccount:
      if (data.length >= 20) {
        const lamports = new DataView(data.buffer, data.byteOffset + 4, 8).getBigUint64(0, true);
        const space = new DataView(data.buffer, data.byteOffset + 12, 8).getBigUint64(0, true);
        return {
          type: 'system-create-account',
          instruction: `Create account with ${Number(lamports) / 1e9} SOL and ${space} bytes`,
          lamports,
          space,
          accounts: []
        };
      }
      break;

    case SystemInstructionType.Assign:
      return {
        type: 'system-assign',
        instruction: 'Assign account to program',
        accounts: []
      };

    case SystemInstructionType.Allocate:
      if (data.length >= 12) {
        const space = new DataView(data.buffer, data.byteOffset + 4, 8).getBigUint64(0, true);
        return {
          type: 'system-allocate',
          instruction: `Allocate ${space} bytes`,
          space,
          accounts: []
        };
      }
      break;

    case SystemInstructionType.CreateAccountWithSeed:
      return {
        type: 'system-create-account-with-seed',
        instruction: 'Create account with seed',
        accounts: []
      };

    case SystemInstructionType.TransferWithSeed:
      if (data.length >= 12) {
        const lamports = new DataView(data.buffer, data.byteOffset + 4, 8).getBigUint64(0, true);
        return {
          type: 'system-transfer-with-seed',
          instruction: `Transfer ${Number(lamports) / 1e9} SOL with seed`,
          lamports,
          accounts: []
        };
      }
      break;

    case SystemInstructionType.InitializeNonceAccount:
      return {
        type: 'system-initialize-nonce',
        instruction: 'Initialize nonce account',
        accounts: []
      };

    case SystemInstructionType.AdvanceNonceAccount:
      return {
        type: 'system-advance-nonce',
        instruction: 'Advance nonce account',
        accounts: []
      };

    case SystemInstructionType.WithdrawNonceAccount:
      if (data.length >= 12) {
        const lamports = new DataView(data.buffer, data.byteOffset + 4, 8).getBigUint64(0, true);
        return {
          type: 'system-withdraw-nonce',
          instruction: `Withdraw ${Number(lamports) / 1e9} SOL from nonce account`,
          lamports,
          accounts: []
        };
      }
      break;

    case SystemInstructionType.AuthorizeNonceAccount:
      return {
        type: 'system-authorize-nonce',
        instruction: 'Authorize nonce account',
        accounts: []
      };

    case SystemInstructionType.UpgradeNonceAccount:
      return {
        type: 'system-upgrade-nonce',
        instruction: 'Upgrade nonce account',
        accounts: []
      };

    default:
      return {
        type: 'system-unknown',
        instruction: `Unknown system instruction (type: ${instructionType})`,
        accounts: []
      };
  }

  return {
    type: 'system-unknown',
    instruction: 'Unknown system instruction',
    accounts: []
  };
}

/**
 * Helper function to format lamports as SOL
 */
export function lamportsToSol(lamports: bigint): string {
  return (Number(lamports) / 1e9).toFixed(9);
}

/**
 * Helper function to format bytes with units
 */
export function formatBytes(bytes: bigint): string {
  const num = Number(bytes);
  if (num < 1024) return `${num} bytes`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
} 