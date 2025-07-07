// Associated Token Account Program Decoder
import type { DecodedInstruction } from './registry.js';

// ATA Instruction Types
export enum ATAInstruction {
  Create = 0,
  CreateIdempotent = 1,
}

interface ATAInstructionData {
  programId: string;
  data: Uint8Array;
  accounts: string[];
}

/**
 * Main ATA decoder function
 */
export function decodeATAInstruction(instruction: ATAInstructionData): DecodedInstruction {
  const data = instruction.data;
  const programId = instruction.programId;
  const accounts = instruction.accounts;

  // Handle empty data case - common for ATA create instructions
  if (!data || data.length === 0) {
    // For empty data, infer instruction type from account structure
    if (accounts.length >= 6) {
      // Standard ATA create instruction has 6 accounts:
      // [payer, associatedTokenAccount, owner, mint, systemProgram, tokenProgram]
      return decodeCreate(instruction, programId);
    } else {
      // Unknown ATA instruction with empty data
      return {
        type: 'ata-unknown',
        programId,
        data: {
          error: 'Unknown ATA instruction: empty data with unexpected account structure',
          accountCount: accounts.length,
          expectedAccounts: 6
        },
        accounts,
        raw: instruction as unknown as Record<string, unknown>
      };
    }
  }

  const instructionType = data[0];

  switch (instructionType) {
    case ATAInstruction.Create as number:
      return decodeCreate(instruction, programId);
    case ATAInstruction.CreateIdempotent as number:
      return decodeCreateIdempotent(instruction, programId);
    default:
      return {
        type: 'ata-unknown',
        programId,
        data: {
          instructionType,
          error: `Unknown ATA instruction type: ${instructionType}`
        },
        accounts,
        raw: instruction as unknown as Record<string, unknown>
      };
  }
}

/**
 * Decode Create ATA instruction
 */
function decodeCreate(instruction: ATAInstructionData, programId: string): DecodedInstruction {
  const accounts = instruction.accounts;

  return {
    type: 'ata-create',
    programId,
    data: {
      payer: accounts[0] ?? null,
      associatedTokenAccount: accounts[1] ?? null,
      owner: accounts[2] ?? null,
      mint: accounts[3] ?? null,
      systemProgram: accounts[4] ?? null,
      tokenProgram: accounts[5] ?? null
    },
    accounts,
    raw: instruction as unknown as Record<string, unknown>
  };
}

/**
 * Decode Create Idempotent ATA instruction
 */
function decodeCreateIdempotent(
  instruction: ATAInstructionData, 
  programId: string
): DecodedInstruction {
  const accounts = instruction.accounts;

  return {
    type: 'ata-create-idempotent',
    programId,
    data: {
      payer: accounts[0] ?? null,
      associatedTokenAccount: accounts[1] ?? null,
      owner: accounts[2] ?? null,
      mint: accounts[3] ?? null,
      systemProgram: accounts[4] ?? null,
      tokenProgram: accounts[5] ?? null
    },
    accounts,
    raw: instruction as unknown as Record<string, unknown>
  };
}
