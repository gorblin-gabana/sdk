// Associated Token Account Program Decoder
import type { DecodedInstruction } from './registry.js';

// ATA Instruction Types
export enum ATAInstruction {
  Create = 0,
  CreateIdempotent = 1,
}

/**
 * Main ATA decoder function
 */
export function decodeATAInstruction(instruction: any): DecodedInstruction {
  const data = instruction.data;
  if (!data || data.length === 0) {
    throw new Error('Invalid ATA instruction: no data');
  }

  const instructionType = data[0];
  const programId = instruction.programId;

  switch (instructionType) {
    case ATAInstruction.Create:
      return decodeCreate(instruction, programId);
    case ATAInstruction.CreateIdempotent:
      return decodeCreateIdempotent(instruction, programId);
    default:
      return {
        type: 'ata-unknown',
        programId,
        data: {
          instructionType,
          error: `Unknown ATA instruction type: ${instructionType}`
        },
        accounts: instruction.accounts || [],
        raw: instruction
      };
  }
}

/**
 * Decode Create ATA instruction
 */
function decodeCreate(instruction: any, programId: string): DecodedInstruction {
  const accounts = instruction.accounts || [];
  
  return {
    type: 'ata-create',
    programId,
    data: {
      payer: accounts[0] || null,
      associatedTokenAccount: accounts[1] || null,
      owner: accounts[2] || null,
      mint: accounts[3] || null,
      systemProgram: accounts[4] || null,
      tokenProgram: accounts[5] || null
    },
    accounts,
    raw: instruction
  };
}

/**
 * Decode Create Idempotent ATA instruction
 */
function decodeCreateIdempotent(instruction: any, programId: string): DecodedInstruction {
  const accounts = instruction.accounts || [];
  
  return {
    type: 'ata-create-idempotent',
    programId,
    data: {
      payer: accounts[0] || null,
      associatedTokenAccount: accounts[1] || null,
      owner: accounts[2] || null,
      mint: accounts[3] || null,
      systemProgram: accounts[4] || null,
      tokenProgram: accounts[5] || null
    },
    accounts,
    raw: instruction
  };
} 