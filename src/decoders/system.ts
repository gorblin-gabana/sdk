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
  UpgradeNonceAccount = 12,
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
  programId: string;
  accounts: string[];
}

/**
 * Simple byte reader utility for robust data parsing
 */
class ByteReader {
  private data: Uint8Array;
  private offset: number = 0;

  constructor(data: Uint8Array) {
    this.data = data;
  }

  /**
   * Read a 32-bit unsigned integer (little-endian)
   */
  readUint32(): number {
    if (this.offset + 4 > this.data.length) {
      throw new Error(
        `Cannot read uint32 at offset ${this.offset}, data length: ${this.data.length}`,
      );
    }

    const byte0 = this.data[this.offset];
    const byte1 = this.data[this.offset + 1];
    const byte2 = this.data[this.offset + 2];
    const byte3 = this.data[this.offset + 3];

    const value = byte0 | (byte1 << 8) | (byte2 << 16) | (byte3 << 24);

    this.offset += 4;
    return value >>> 0; // Ensure unsigned
  }

  /**
   * Read a 64-bit unsigned integer (little-endian) as bigint
   */
  readBigUint64(): bigint {
    if (this.offset + 8 > this.data.length) {
      throw new Error(
        `Cannot read uint64 at offset ${this.offset}, data length: ${this.data.length}`,
      );
    }

    const low =
      this.data[this.offset] |
      (this.data[this.offset + 1] << 8) |
      (this.data[this.offset + 2] << 16) |
      (this.data[this.offset + 3] << 24);

    const high =
      this.data[this.offset + 4] |
      (this.data[this.offset + 5] << 8) |
      (this.data[this.offset + 6] << 16) |
      (this.data[this.offset + 7] << 24);

    this.offset += 8;
    return BigInt(low >>> 0) | (BigInt(high >>> 0) << BigInt(32));
  }

  /**
   * Check if we can read the specified number of bytes
   */
  canRead(bytes: number): boolean {
    return this.offset + bytes <= this.data.length;
  }

  /**
   * Get remaining bytes
   */
  remaining(): number {
    const result = this.data.length - this.offset;
    return result;
  }
}

/**
 * Decode system program instruction from raw data
 */
export function decodeSystemInstruction(
  data: Uint8Array,
): DecodedSystemInstruction {
  if (data.length === 0) {
    return {
      type: "system-unknown",
      instruction: "Unknown system instruction",
      programId: "11111111111111111111111111111111",
      accounts: [],
    };
  }

  if (data.length < 4) {
    return {
      type: "system-unknown",
      instruction: "Invalid system instruction - too short",
      programId: "11111111111111111111111111111111",
      accounts: [],
    };
  }

  try {
    const reader = new ByteReader(data);
    const instructionType = reader.readUint32();

    switch (instructionType) {
      case SystemInstructionType.Transfer as number:
        if (reader.canRead(8)) {
          const lamports = reader.readBigUint64();
          return {
            type: "system-transfer",
            instruction: `Transfer ${Number(lamports) / 1e9} SOL`,
            lamports,
            programId: "11111111111111111111111111111111",
            accounts: [],
          };
        }
        return {
          type: "system-transfer-incomplete",
          instruction: "Transfer instruction (incomplete data)",
          programId: "11111111111111111111111111111111",
          accounts: [],
        };

      case SystemInstructionType.CreateAccount as number:
        if (reader.canRead(16)) {
          // 8 bytes lamports + 8 bytes space
          const lamports = reader.readBigUint64();
          const space = reader.readBigUint64();
          return {
            type: "system-create-account",
            instruction: `Create account with ${Number(lamports) / 1e9} SOL and ${space} bytes`,
            lamports,
            space,
            programId: "11111111111111111111111111111111",
            accounts: [],
          };
        }
        return {
          type: "system-create-account-incomplete",
          instruction: "Create account instruction (incomplete data)",
          programId: "11111111111111111111111111111111",
          accounts: [],
        };

      case SystemInstructionType.Assign as number:
        return {
          type: "system-assign",
          instruction: "Assign account to program",
          programId: "11111111111111111111111111111111",
          accounts: [],
        };

      case SystemInstructionType.Allocate as number:
        if (reader.canRead(8)) {
          const space = reader.readBigUint64();
          return {
            type: "system-allocate",
            instruction: `Allocate ${space} bytes`,
            space,
            programId: "11111111111111111111111111111111",
            accounts: [],
          };
        }
        return {
          type: "system-allocate-incomplete",
          instruction: "Allocate instruction (incomplete data)",
          programId: "11111111111111111111111111111111",
          accounts: [],
        };

      case SystemInstructionType.CreateAccountWithSeed as number:
        return {
          type: "system-create-account-with-seed",
          instruction: "Create account with seed",
          programId: "11111111111111111111111111111111",
          accounts: [],
        };

      case SystemInstructionType.TransferWithSeed as number:
        if (reader.canRead(8)) {
          const lamports = reader.readBigUint64();
          return {
            type: "system-transfer-with-seed",
            instruction: `Transfer ${Number(lamports) / 1e9} SOL with seed`,
            lamports,
            programId: "11111111111111111111111111111111",
            accounts: [],
          };
        }
        return {
          type: "system-transfer-with-seed-incomplete",
          instruction: "Transfer with seed instruction (incomplete data)",
          programId: "11111111111111111111111111111111",
          accounts: [],
        };

      case SystemInstructionType.InitializeNonceAccount as number:
        return {
          type: "system-initialize-nonce",
          instruction: "Initialize nonce account",
          programId: "11111111111111111111111111111111",
          accounts: [],
        };

      case SystemInstructionType.AdvanceNonceAccount as number:
        return {
          type: "system-advance-nonce",
          instruction: "Advance nonce account",
          programId: "11111111111111111111111111111111",
          accounts: [],
        };

      case SystemInstructionType.WithdrawNonceAccount as number:
        if (reader.canRead(8)) {
          const lamports = reader.readBigUint64();
          return {
            type: "system-withdraw-nonce",
            instruction: `Withdraw ${Number(lamports) / 1e9} SOL from nonce account`,
            lamports,
            programId: "11111111111111111111111111111111",
            accounts: [],
          };
        }
        return {
          type: "system-withdraw-nonce-incomplete",
          instruction: "Withdraw nonce instruction (incomplete data)",
          programId: "11111111111111111111111111111111",
          accounts: [],
        };

      case SystemInstructionType.AuthorizeNonceAccount as number:
        return {
          type: "system-authorize-nonce",
          instruction: "Authorize nonce account",
          programId: "11111111111111111111111111111111",
          accounts: [],
        };

      case SystemInstructionType.UpgradeNonceAccount as number:
        return {
          type: "system-upgrade-nonce",
          instruction: "Upgrade nonce account",
          programId: "11111111111111111111111111111111",
          accounts: [],
        };

      default:
        return {
          type: "system-unknown",
          instruction: `Unknown system instruction (type: ${instructionType})`,
          programId: "11111111111111111111111111111111",
          accounts: [],
        };
    }
  } catch (error) {
    return {
      type: "system-error",
      instruction: `Error decoding system instruction: ${error instanceof Error ? error.message : "Unknown error"}`,
      programId: "11111111111111111111111111111111",
      accounts: [],
    };
  }

  return {
    type: "system-unknown",
    instruction: "Unknown system instruction",
    programId: "11111111111111111111111111111111",
    accounts: [],
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
