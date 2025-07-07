// Token-2022 Program Decoders - Enhanced token standard with additional features
import type { DecodedInstruction } from './registry.js';
import { getGorbchainConfig } from '../utils/gorbchainConfig.js';

// Get Token-2022 program ID from config
function getToken2022ProgramId(): string {
  const config = getGorbchainConfig();
  return config.programIds?.token2022 ?? 'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn';
}

interface Token2022InstructionData {
  programId: string;
  data: Uint8Array;
  accounts: string[];
}

// Token-2022 Instruction Types (discriminators)
export enum Token2022Instruction {
  // Standard SPL Token instructions
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

  // Token-2022 specific instructions
  GetAccountDataSize = 21,
  InitializeImmutableOwner = 22,
  AmountToUiAmount = 23,
  UiAmountToAmount = 24,
  InitializeMintCloseAuthority = 25,
  TransferFeeExtension = 26,
  ConfidentialTransferExtension = 27,
  DefaultAccountStateExtension = 28,
  Reallocate = 29,
  MemoTransferExtension = 30,
  CreateNativeMint = 31,
  InitializeNonTransferableMint = 32,
  InterestBearingMintExtension = 33,
  CpiGuardExtension = 34,
  InitializePermanentDelegate = 35,
  TransferHookExtension = 36,
  ConfidentialTransferFeeExtension = 37,
  WithdrawExcessLamports = 38,
  MetadataPointerExtension = 39,

  // NFT/Metadata instructions (custom extensions)
  InitializeNFTMetadata = 210,
}

// Authority Types for Token-2022
export enum AuthorityType {
  MintTokens = 0,
  FreezeAccount = 1,
  AccountOwner = 2,
  CloseAccount = 3,
  TransferFeeConfig = 4,
  WithheldWithdraw = 5,
  CloseMint = 6,
  InterestRate = 7,
  PermanentDelegate = 8,
  ConfidentialTransferMint = 9,
  TransferHookProgramId = 10,
  ConfidentialTransferFeeConfig = 11,
  MetadataPointer = 12,
}

/**
 * Main Token-2022 decoder function
 */
export function decodeToken2022Instruction(instruction: Token2022InstructionData): DecodedInstruction {
  const data = instruction.data;
  if (!data || data.length === 0) {
    return {
      type: 'token2022-generic',
      programId: getToken2022ProgramId(),
      accounts: instruction.accounts,
      data: {
        type: 'token2022-generic',
        description: 'Token-2022 operation (no instruction data)',
        error: 'No instruction data available'
      }
    };
  }

  let instructionType: number;

  if (data instanceof Uint8Array) {
    instructionType = data[0];
  } else if (typeof data === 'string') {
    throw new Error('Invalid Token-2022 instruction: data is string, expected Uint8Array');
  } else if (Array.isArray(data)) {
    instructionType = data[0];
  } else {
    throw new Error('Invalid Token-2022 instruction: unknown data type');
  }

  const programId = getToken2022ProgramId();

  switch (instructionType) {
    case Token2022Instruction.Transfer as number:
      return decodeTransfer(instruction, programId);
    case Token2022Instruction.MintTo as number:
      return decodeMintTo(instruction, programId);
    case Token2022Instruction.Burn as number:
      return decodeBurn(instruction, programId);
    case Token2022Instruction.InitializeMint as number:
      return decodeInitializeMint(instruction, programId);
    case Token2022Instruction.InitializeAccount as number:
      return decodeInitializeAccount(instruction, programId);
    case Token2022Instruction.SetAuthority as number:
      return decodeSetAuthority(instruction, programId);
    case Token2022Instruction.Approve as number:
      return decodeApprove(instruction, programId);
    case Token2022Instruction.Revoke as number:
      return decodeRevoke(instruction, programId);
    case Token2022Instruction.CloseAccount as number:
      return decodeCloseAccount(instruction, programId);
    case Token2022Instruction.FreezeAccount as number:
      return decodeFreezeAccount(instruction, programId);
    case Token2022Instruction.ThawAccount as number:
      return decodeThawAccount(instruction, programId);
    case Token2022Instruction.TransferChecked as number:
      return decodeTransferChecked(instruction, programId);
    case Token2022Instruction.ApproveChecked as number:
      return decodeApproveChecked(instruction, programId);
    case Token2022Instruction.MintToChecked as number:
      return decodeMintToChecked(instruction, programId);
    case Token2022Instruction.BurnChecked as number:
      return decodeBurnChecked(instruction, programId);
    case Token2022Instruction.InitializeMint2 as number:
      return decodeInitializeMint2(instruction, programId);
    case Token2022Instruction.InitializeAccount2 as number:
      return decodeInitializeAccount2(instruction, programId);
    case Token2022Instruction.InitializeAccount3 as number:
      return decodeInitializeAccount3(instruction, programId);
    case Token2022Instruction.SyncNative as number:
      return decodeSyncNative(instruction, programId);

    // Token-2022 specific instructions
    case Token2022Instruction.GetAccountDataSize as number:
      return decodeGetAccountDataSize(instruction, programId);
    case Token2022Instruction.InitializeImmutableOwner as number:
      return decodeInitializeImmutableOwner(instruction, programId);
    case Token2022Instruction.AmountToUiAmount as number:
      return decodeAmountToUiAmount(instruction, programId);
    case Token2022Instruction.UiAmountToAmount as number:
      return decodeUiAmountToAmount(instruction, programId);
    case Token2022Instruction.InitializeMintCloseAuthority as number:
      return decodeInitializeMintCloseAuthority(instruction, programId);
    case Token2022Instruction.Reallocate as number:
      return decodeReallocate(instruction, programId);
    case Token2022Instruction.CreateNativeMint as number:
      return decodeCreateNativeMint(instruction, programId);
    case Token2022Instruction.InitializeNonTransferableMint as number:
      return decodeInitializeNonTransferableMint(instruction, programId);
    case Token2022Instruction.WithdrawExcessLamports as number:
      return decodeWithdrawExcessLamports(instruction, programId);
    case Token2022Instruction.InitializePermanentDelegate as number:
      return decodeInitializePermanentDelegate(instruction, programId);

    // NFT/Metadata instructions
    case Token2022Instruction.InitializeNFTMetadata as number:
      return decodeInitializeNFTMetadata(instruction, programId);

    // Extended Token-2022 instructions (beyond standard range)
    case 219:
      return {
        type: 'token2022-extension-219',
        programId,
        data: {
          instructionType: 219,
          name: 'TokenExtension219',
          description: 'Token-2022 extension operation (type 219)',
          rawData: Array.from(instruction.data ?? [])
        },
        accounts: instruction.accounts,
        raw: instruction as unknown as Record<string, unknown>
      };

    case 232:
      return {
        type: 'token2022-extension-232',
        programId,
        data: {
          instructionType: 232,
          name: 'TokenExtension232',
          description: 'Token-2022 extension operation (type 232)',
          rawData: Array.from(instruction.data)
        },
        accounts: instruction.accounts,
        raw: instruction as unknown as Record<string, unknown>
      };

    default:
      return {
        type: 'token2022-unknown',
        programId,
        data: {
          instructionType,
          name: `UnknownToken2022Instruction${instructionType}`,
          description: `Unknown Token-2022 instruction type: ${instructionType}`,
          error: `Unknown Token-2022 instruction type: ${instructionType}`,
          rawData: Array.from(instruction.data ?? [])
        },
        accounts: instruction.accounts ?? [],
        raw: instruction as unknown as Record<string, unknown>
      };
  }
}

/**
 * Enhanced Token-2022 instruction decoder with amount extraction
 */
export function decodeToken2022InstructionWithDetails(data: Uint8Array): {
  type: string;
  instruction: string;
  amount?: bigint;
  decimals?: number;
  accounts: any[];
  extensions?: string[];
} {
  if (data.length === 0) {
    return {
      type: 'token2022-unknown',
      instruction: 'Unknown Token-2022 instruction',
      accounts: []
    };
  }

  const instructionType = data[0];

  switch (instructionType) {
    case 3: // Transfer
      if (data.length >= 9) {
        const amount = new DataView(data.buffer, data.byteOffset + 1, 8).getBigUint64(0, true);
        return {
          type: 'token2022-transfer',
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
          type: 'token2022-mint-to',
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
          type: 'token2022-burn',
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
          type: 'token2022-approve',
          instruction: 'Approve token spending',
          amount,
          accounts: []
        };
      }
      break;

    case 0: // InitializeMint
      return {
        type: 'token2022-initialize-mint',
        instruction: 'Initialize token mint',
        accounts: []
      };

    case 1: // InitializeAccount
      return {
        type: 'token2022-initialize-account',
        instruction: 'Initialize token account',
        accounts: []
      };

    case 22: // InitializeImmutableOwner
      return {
        type: 'token2022-initialize-immutable-owner',
        instruction: 'Initialize immutable owner',
        accounts: [],
        extensions: ['ImmutableOwner']
      };

    case 25: // InitializeMintCloseAuthority
      return {
        type: 'token2022-initialize-mint-close-authority',
        instruction: 'Initialize mint close authority',
        accounts: [],
        extensions: ['MintCloseAuthority']
      };

    case 32: // InitializeNonTransferableMint
      return {
        type: 'token2022-initialize-non-transferable-mint',
        instruction: 'Initialize non-transferable mint',
        accounts: [],
        extensions: ['NonTransferable']
      };

    case 35: // InitializePermanentDelegate
      return {
        type: 'token2022-initialize-permanent-delegate',
        instruction: 'Initialize permanent delegate',
        accounts: [],
        extensions: ['PermanentDelegate']
      };

    default:
      return {
        type: 'token2022-unknown',
        instruction: `Unknown Token-2022 instruction (type: ${instructionType})`,
        accounts: []
      };
  }

  return {
    type: 'token2022-unknown',
    instruction: 'Unknown Token-2022 instruction',
    accounts: []
  };
}

// Standard SPL Token instruction decoders (similar to SPL Token)
function decodeTransfer(instruction: any, programId: string): DecodedInstruction {
  const data = instruction.data;
  if (data.length < 9) {
    throw new Error('Invalid Transfer instruction: insufficient data');
  }

  const amount = readU64LE(data, 1);

  return {
    type: 'token2022-transfer',
    programId,
    data: {
      amount,
      source: instruction.accounts[0],
      destination: instruction.accounts[1],
      authority: instruction.accounts[2]
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeMintTo(instruction: any, programId: string): DecodedInstruction {
  const data = instruction.data;
  if (data.length < 9) {
    throw new Error('Invalid MintTo instruction: insufficient data');
  }

  const amount = readU64LE(data, 1);

  return {
    type: 'token2022-mint-to',
    programId,
    data: {
      amount,
      mint: instruction.accounts[0],
      destination: instruction.accounts[1],
      authority: instruction.accounts[2]
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeBurn(instruction: any, programId: string): DecodedInstruction {
  const data = instruction.data;
  if (data.length < 9) {
    throw new Error('Invalid Burn instruction: insufficient data');
  }

  const amount = readU64LE(data, 1);

  return {
    type: 'token2022-burn',
    programId,
    data: {
      amount,
      account: instruction.accounts[0],
      mint: instruction.accounts[1],
      authority: instruction.accounts[2]
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeInitializeMint(instruction: any, programId: string): DecodedInstruction {
  const data = instruction.data;
  if (data.length < 67) {
    throw new Error('Invalid InitializeMint instruction: insufficient data');
  }

  const decimals = data[1];
  const mintAuthority = bufferToBase58(data.slice(2, 34));
  const freezeAuthorityPresent = data[34] === 1;
  const freezeAuthority = freezeAuthorityPresent ? bufferToBase58(data.slice(35, 67)) : null;

  return {
    type: 'token2022-initialize-mint',
    programId,
    data: {
      decimals,
      mintAuthority,
      freezeAuthority,
      mint: instruction.accounts[0]
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeInitializeAccount(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'token2022-initialize-account',
    programId,
    data: {
      account: instruction.accounts[0],
      mint: instruction.accounts[1],
      owner: instruction.accounts[2],
      rent: instruction.accounts[3]
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeSetAuthority(instruction: any, programId: string): DecodedInstruction {
  const data = instruction.data;
  if (data.length < 3) {
    throw new Error('Invalid SetAuthority instruction: insufficient data');
  }

  const authorityType = data[1];
  const newAuthorityPresent = data[2] === 1;
  const newAuthority = newAuthorityPresent ? bufferToBase58(data.slice(3, 35)) : null;

  return {
    type: 'token2022-set-authority',
    programId,
    data: {
      authorityType: getAuthorityTypeName(authorityType),
      newAuthority,
      currentAuthority: instruction.accounts[1]
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeApprove(instruction: any, programId: string): DecodedInstruction {
  const data = instruction.data;
  if (data.length < 9) {
    throw new Error('Invalid Approve instruction: insufficient data');
  }

  const amount = readU64LE(data, 1);

  return {
    type: 'token2022-approve',
    programId,
    data: {
      amount,
      source: instruction.accounts[0],
      delegate: instruction.accounts[1],
      authority: instruction.accounts[2]
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeRevoke(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'token2022-revoke',
    programId,
    data: {
      source: instruction.accounts[0],
      authority: instruction.accounts[1]
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeCloseAccount(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'token2022-close-account',
    programId,
    data: {
      account: instruction.accounts[0],
      destination: instruction.accounts[1],
      authority: instruction.accounts[2]
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeFreezeAccount(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'token2022-freeze-account',
    programId,
    data: {
      account: instruction.accounts[0],
      mint: instruction.accounts[1],
      authority: instruction.accounts[2]
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeThawAccount(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'token2022-thaw-account',
    programId,
    data: {
      account: instruction.accounts[0],
      mint: instruction.accounts[1],
      authority: instruction.accounts[2]
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeTransferChecked(instruction: any, programId: string): DecodedInstruction {
  const data = instruction.data;
  if (data.length < 10) {
    throw new Error('Invalid TransferChecked instruction: insufficient data');
  }

  const amount = readU64LE(data, 1);
  const decimals = data[9];

  return {
    type: 'token2022-transfer-checked',
    programId,
    data: {
      amount,
      decimals,
      source: instruction.accounts[0],
      mint: instruction.accounts[1],
      destination: instruction.accounts[2],
      authority: instruction.accounts[3]
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeApproveChecked(instruction: any, programId: string): DecodedInstruction {
  const data = instruction.data;
  if (data.length < 10) {
    throw new Error('Invalid ApproveChecked instruction: insufficient data');
  }

  const amount = readU64LE(data, 1);
  const decimals = data[9];

  return {
    type: 'token2022-approve-checked',
    programId,
    data: {
      amount,
      decimals,
      source: instruction.accounts[0],
      mint: instruction.accounts[1],
      delegate: instruction.accounts[2],
      authority: instruction.accounts[3]
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeMintToChecked(instruction: any, programId: string): DecodedInstruction {
  const data = instruction.data;
  if (data.length < 10) {
    throw new Error('Invalid MintToChecked instruction: insufficient data');
  }

  const amount = readU64LE(data, 1);
  const decimals = data[9];

  return {
    type: 'token2022-mint-to-checked',
    programId,
    data: {
      amount,
      decimals,
      mint: instruction.accounts[0],
      destination: instruction.accounts[1],
      authority: instruction.accounts[2]
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeBurnChecked(instruction: any, programId: string): DecodedInstruction {
  const data = instruction.data;
  if (data.length < 10) {
    throw new Error('Invalid BurnChecked instruction: insufficient data');
  }

  const amount = readU64LE(data, 1);
  const decimals = data[9];

  return {
    type: 'token2022-burn-checked',
    programId,
    data: {
      amount,
      decimals,
      account: instruction.accounts[0],
      mint: instruction.accounts[1],
      authority: instruction.accounts[2]
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeInitializeMint2(instruction: any, programId: string): DecodedInstruction {
  const data = instruction.data;
  if (data.length < 35) {
    throw new Error('Invalid InitializeMint2 instruction: insufficient data');
  }

  const decimals = data[1];
  const mintAuthority = bufferToBase58(data.slice(2, 34));
  const freezeAuthorityPresent = data[34] === 1;
  const freezeAuthority = freezeAuthorityPresent ? bufferToBase58(data.slice(35, 67)) : null;

  return {
    type: 'token2022-initialize-mint2',
    programId,
    data: {
      decimals,
      mintAuthority,
      freezeAuthority,
      mint: instruction.accounts[0]
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeInitializeAccount2(instruction: any, programId: string): DecodedInstruction {
  const data = instruction.data;
  if (data.length < 33) {
    throw new Error('Invalid InitializeAccount2 instruction: insufficient data');
  }

  const owner = bufferToBase58(data.slice(1, 33));

  return {
    type: 'token2022-initialize-account2',
    programId,
    data: {
      account: instruction.accounts[0],
      mint: instruction.accounts[1],
      owner,
      rent: instruction.accounts[2]
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeInitializeAccount3(instruction: any, programId: string): DecodedInstruction {
  const data = instruction.data;
  if (data.length < 33) {
    throw new Error('Invalid InitializeAccount3 instruction: insufficient data');
  }

  const owner = bufferToBase58(data.slice(1, 33));

  return {
    type: 'token2022-initialize-account3',
    programId,
    data: {
      account: instruction.accounts[0],
      mint: instruction.accounts[1],
      owner
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeSyncNative(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'token2022-sync-native',
    programId,
    data: {
      account: instruction.accounts[0]
    },
    accounts: instruction.accounts ?? []
  };
}

// Token-2022 specific instruction decoders
function decodeGetAccountDataSize(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'token2022-get-account-data-size',
    programId,
    data: {
      mint: instruction.accounts[0]
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeInitializeImmutableOwner(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'token2022-initialize-immutable-owner',
    programId,
    data: {
      account: instruction.accounts[0],
      extension: 'ImmutableOwner'
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeAmountToUiAmount(instruction: any, programId: string): DecodedInstruction {
  const data = instruction.data;
  if (data.length < 9) {
    throw new Error('Invalid AmountToUiAmount instruction: insufficient data');
  }

  const amount = readU64LE(data, 1);

  return {
    type: 'token2022-amount-to-ui-amount',
    programId,
    data: {
      amount,
      mint: instruction.accounts[0]
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeUiAmountToAmount(instruction: any, programId: string): DecodedInstruction {
  const data = instruction.data;
  if (data.length < 9) {
    throw new Error('Invalid UiAmountToAmount instruction: insufficient data');
  }

  const uiAmount = readU64LE(data, 1);

  return {
    type: 'token2022-ui-amount-to-amount',
    programId,
    data: {
      uiAmount,
      mint: instruction.accounts[0]
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeInitializeMintCloseAuthority(instruction: any, programId: string): DecodedInstruction {
  const data = instruction.data;
  if (data.length < 33) {
    throw new Error('Invalid InitializeMintCloseAuthority instruction: insufficient data');
  }

  const closeAuthority = bufferToBase58(data.slice(1, 33));

  return {
    type: 'token2022-initialize-mint-close-authority',
    programId,
    data: {
      mint: instruction.accounts[0],
      closeAuthority,
      extension: 'MintCloseAuthority'
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeReallocate(instruction: any, programId: string): DecodedInstruction {
  const data = instruction.data;
  if (data.length < 9) {
    throw new Error('Invalid Reallocate instruction: insufficient data');
  }

  const extensionTypes = [];
  for (let i = 1; i < data.length; i += 2) {
    extensionTypes.push(data[i]);
  }

  return {
    type: 'token2022-reallocate',
    programId,
    data: {
      account: instruction.accounts[0],
      payer: instruction.accounts[1],
      systemProgram: instruction.accounts[2],
      extensionTypes
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeCreateNativeMint(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'token2022-create-native-mint',
    programId,
    data: {
      payer: instruction.accounts[0],
      nativeMint: instruction.accounts[1],
      systemProgram: instruction.accounts[2]
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeInitializeNonTransferableMint(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'token2022-initialize-non-transferable-mint',
    programId,
    data: {
      mint: instruction.accounts[0],
      extension: 'NonTransferable'
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeWithdrawExcessLamports(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'token2022-withdraw-excess-lamports',
    programId,
    data: {
      source: instruction.accounts[0],
      destination: instruction.accounts[1],
      authority: instruction.accounts[2]
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeInitializePermanentDelegate(instruction: any, programId: string): DecodedInstruction {
  const data = instruction.data;
  if (data.length < 33) {
    throw new Error('Invalid InitializePermanentDelegate instruction: insufficient data');
  }

  const delegate = bufferToBase58(data.slice(1, 33));

  return {
    type: 'token2022-initialize-permanent-delegate',
    programId,
    data: {
      mint: instruction.accounts[0],
      delegate,
      extension: 'PermanentDelegate'
    },
    accounts: instruction.accounts ?? []
  };
}

function decodeInitializeNFTMetadata(instruction: any, programId: string): DecodedInstruction {
  const data = instruction.data;

  try {
    // Skip instruction type byte (210) and read metadata fields
    let offset = 1;

    // Skip some header bytes (appears to be 8 bytes based on the data pattern)
    offset += 8;

    // Read name length (4 bytes, little-endian)
    const nameLength = (data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24));
    offset += 4;

    // Read name string
    const nameBytes = data.slice(offset, offset + nameLength);
    const name = String.fromCharCode(...nameBytes);
    offset += nameLength;

    // Read symbol length (4 bytes, little-endian)
    const symbolLength = (data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24));
    offset += 4;

    // Read symbol string
    const symbolBytes = data.slice(offset, offset + symbolLength);
    const symbol = String.fromCharCode(...symbolBytes);
    offset += symbolLength;

    // Read URI length (4 bytes, little-endian)
    const uriLength = (data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24));
    offset += 4;

    // Read URI string
    const uriBytes = data.slice(offset, offset + uriLength);
    const uri = String.fromCharCode(...uriBytes);

    return {
      type: 'token2022-initialize-nft-metadata',
      programId,
      data: {
        mint: instruction.accounts[0],
        metadata: {
          name,
          symbol,
          uri
        },
        extension: 'NFTMetadata'
      },
      accounts: instruction.accounts ?? []
    };
  } catch (error) {
    // Failed to parse NFT metadata
    return {
      type: 'token2022-initialize-nft-metadata-error',
      programId,
      data: {
        mint: instruction.accounts[0],
        error: (error as Error).message,
        rawData: Array.from(data),
        extension: 'NFTMetadata'
      },
      accounts: instruction.accounts ?? []
    };
  }
}

// Utility functions
function readU64LE(buffer: Uint8Array | number[], offset: number): string {
  const bytes = Array.isArray(buffer) ? buffer : Array.from(buffer);
  let result = BigInt(0);

  for (let i = 0; i < 8; i++) {
    result += BigInt(bytes[offset + i]) << BigInt(i * 8);
  }

  return result.toString();
}

function bufferToBase58(buffer: Uint8Array | number[]): string {
  // This is a simplified version - in production, use proper base58 encoding
  const bytes = Array.isArray(buffer) ? buffer : Array.from(buffer);
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getAuthorityTypeName(type: number): string {
  switch (type) {
    case AuthorityType.MintTokens as number: return 'MintTokens';
    case AuthorityType.FreezeAccount as number: return 'FreezeAccount';
    case AuthorityType.AccountOwner as number: return 'AccountOwner';
    case AuthorityType.CloseAccount as number: return 'CloseAccount';
    case AuthorityType.TransferFeeConfig as number: return 'TransferFeeConfig';
    case AuthorityType.WithheldWithdraw as number: return 'WithheldWithdraw';
    case AuthorityType.CloseMint as number: return 'CloseMint';
    case AuthorityType.InterestRate as number: return 'InterestRate';
    case AuthorityType.PermanentDelegate as number: return 'PermanentDelegate';
    case AuthorityType.ConfidentialTransferMint as number: return 'ConfidentialTransferMint';
    case AuthorityType.TransferHookProgramId as number: return 'TransferHookProgramId';
    case AuthorityType.ConfidentialTransferFeeConfig as number: return 'ConfidentialTransferFeeConfig';
    case AuthorityType.MetadataPointer as number: return 'MetadataPointer';
    default: return `Unknown (${type})`;
  }
}
