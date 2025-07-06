// NFT and Metaplex Program Decoders
import type { DecodedInstruction } from './registry.js';
import { getGorbchainConfig } from '../utils/gorbchainConfig.js';

// Get Metaplex program ID from config
function getMetaplexProgramId(): string {
  const config = getGorbchainConfig();
  return config.programIds?.metaplex || 'BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc';
}

// NFT Metadata account structure
export interface NFTMetadata {
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators: Array<{
    address: string;
    verified: boolean;
    share: number;
  }>;
  collection?: {
    verified: boolean;
    key: string;
  };
  uses?: {
    useMethod: string;
    remaining: number;
    total: number;
  };
}

// NFT Token characteristics
export interface NFTTokenInfo {
  isNFT: boolean;
  mintAddress: string;
  supply: string;
  decimals: number;
  metadata?: NFTMetadata;
  isCollection?: boolean;
  isMasterEdition?: boolean;
}

// Metaplex Instruction Types
export enum MetaplexInstruction {
  CreateMetadataAccount = 0,
  UpdateMetadataAccount = 1,
  DeprecatedCreateMasterEdition = 2,
  DeprecatedMintNewEditionFromMasterEditionViaPrintingToken = 3,
  UpdatePrimarySaleHappenedViaToken = 4,
  DeprecatedSetReservationList = 5,
  DeprecatedCreateReservationList = 6,
  SignMetadata = 7,
  DeprecatedMintPrintingTokensViaToken = 8,
  DeprecatedMintPrintingTokens = 9,
  CreateMasterEdition = 10,
  MintNewEditionFromMasterEditionViaToken = 11,
  ConvertMasterEditionV1ToV2 = 12,
  MintNewEditionFromMasterEditionViaVaultProxy = 13,
  PuffMetadata = 14,
  UpdateMetadataAccountV2 = 15,
  CreateMetadataAccountV2 = 16,
  CreateMasterEditionV3 = 17,
  VerifyCollection = 18,
  Utilize = 19,
  ApproveUseAuthority = 20,
  RevokeUseAuthority = 21,
  UnverifyCollection = 22,
  ApproveCollectionAuthority = 23,
  RevokeCollectionAuthority = 24,
  SetAndVerifyCollection = 25,
  FreezeDelegatedAccount = 26,
  ThawDelegatedAccount = 27,
  RemoveCreatorVerification = 28,
  BurnNft = 29,
  VerifyCreator = 30,
  UnverifyCreator = 31,
  CreateMetadataAccountV3 = 32,
  SetCollectionSize = 33,
  SetTokenStandard = 34,
  BubblegumSetCollectionSize = 35,
  BurnEditionNft = 36,
  CreateEscrowAccount = 37,
  CloseEscrowAccount = 38,
  TransferOutOfEscrow = 39,
  Burn = 40,
  Create = 41,
  Mint = 42,
  Delegate = 43,
  Revoke = 44,
  Lock = 45,
  Unlock = 46,
  Migrate = 47,
  Transfer = 48,
  Update = 49,
  Use = 50,
  Verify = 51,
  Unverify = 52,
}

/**
 * Main NFT/Metaplex decoder function
 */
export function decodeNFTInstruction(instruction: any): DecodedInstruction {
  const data = instruction.data;
  if (!data || data.length === 0) {
    throw new Error('Invalid NFT instruction: no data');
  }

  const instructionType = data[0];
  const programId = getMetaplexProgramId();

  switch (instructionType) {
    case MetaplexInstruction.CreateMetadataAccount:
      return decodeCreateMetadataAccount(instruction, programId);
    case MetaplexInstruction.UpdateMetadataAccount:
      return decodeUpdateMetadataAccount(instruction, programId);
    case MetaplexInstruction.CreateMasterEdition:
      return decodeCreateMasterEdition(instruction, programId);
    case MetaplexInstruction.MintNewEditionFromMasterEditionViaToken:
      return decodeMintNewEdition(instruction, programId);
    case MetaplexInstruction.UpdateMetadataAccountV2:
      return decodeUpdateMetadataAccountV2(instruction, programId);
    case MetaplexInstruction.CreateMetadataAccountV2:
      return decodeCreateMetadataAccountV2(instruction, programId);
    case MetaplexInstruction.CreateMasterEditionV3:
      return decodeCreateMasterEditionV3(instruction, programId);
    case MetaplexInstruction.VerifyCollection:
      return decodeVerifyCollection(instruction, programId);
    case MetaplexInstruction.UnverifyCollection:
      return decodeUnverifyCollection(instruction, programId);
    case MetaplexInstruction.VerifyCreator:
      return decodeVerifyCreator(instruction, programId);
    case MetaplexInstruction.UnverifyCreator:
      return decodeUnverifyCreator(instruction, programId);
    case MetaplexInstruction.BurnNft:
      return decodeBurnNft(instruction, programId);
    case MetaplexInstruction.CreateMetadataAccountV3:
      return decodeCreateMetadataAccountV3(instruction, programId);
    case MetaplexInstruction.SetCollectionSize:
      return decodeSetCollectionSize(instruction, programId);
    case MetaplexInstruction.SetTokenStandard:
      return decodeSetTokenStandard(instruction, programId);
    case MetaplexInstruction.Transfer:
      return decodeNFTTransfer(instruction, programId);
    case MetaplexInstruction.Mint:
      return decodeNFTMint(instruction, programId);
    case MetaplexInstruction.Burn:
      return decodeNFTBurn(instruction, programId);
    case MetaplexInstruction.Lock:
      return decodeNFTLock(instruction, programId);
    case MetaplexInstruction.Unlock:
      return decodeNFTUnlock(instruction, programId);
    default:
      return {
        type: 'nft-unknown',
        programId,
        data: {
          instructionType,
          error: `Unknown NFT instruction type: ${instructionType}`
        },
        accounts: instruction.accounts || [],
        raw: instruction
      };
  }
}

/**
 * Enhanced NFT instruction decoder with metadata extraction
 */
export function decodeNFTInstructionWithDetails(data: Uint8Array): {
  type: string;
  instruction: string;
  nftDetails?: {
    metadataUri?: string;
    name?: string;
    symbol?: string;
    isCollection?: boolean;
    isMasterEdition?: boolean;
  };
  accounts: any[];
} {
  if (data.length === 0) {
    return {
      type: 'nft-unknown',
      instruction: 'Unknown NFT instruction',
      accounts: []
    };
  }

  const instructionType = data[0];

  switch (instructionType) {
    case 0: // CreateMetadataAccount
      return {
        type: 'nft-create-metadata',
        instruction: 'Create NFT metadata account',
        nftDetails: {
          isCollection: false,
          isMasterEdition: false
        },
        accounts: []
      };

    case 10: // CreateMasterEdition
      return {
        type: 'nft-create-master-edition',
        instruction: 'Create NFT master edition',
        nftDetails: {
          isMasterEdition: true,
          isCollection: false
        },
        accounts: []
      };

    case 16: // CreateMetadataAccountV2
      return {
        type: 'nft-create-metadata-v2',
        instruction: 'Create NFT metadata account V2',
        nftDetails: {
          isCollection: false,
          isMasterEdition: false
        },
        accounts: []
      };

    case 17: // CreateMasterEditionV3
      return {
        type: 'nft-create-master-edition-v3',
        instruction: 'Create NFT master edition V3',
        nftDetails: {
          isMasterEdition: true,
          isCollection: false
        },
        accounts: []
      };

    case 18: // VerifyCollection
      return {
        type: 'nft-verify-collection',
        instruction: 'Verify NFT collection',
        nftDetails: {
          isCollection: true,
          isMasterEdition: false
        },
        accounts: []
      };

    case 29: // BurnNft
      return {
        type: 'nft-burn',
        instruction: 'Burn NFT',
        accounts: []
      };

    case 32: // CreateMetadataAccountV3
      return {
        type: 'nft-create-metadata-v3',
        instruction: 'Create NFT metadata account V3',
        nftDetails: {
          isCollection: false,
          isMasterEdition: false
        },
        accounts: []
      };

    case 48: // Transfer
      return {
        type: 'nft-transfer',
        instruction: 'Transfer NFT',
        accounts: []
      };

    case 42: // Mint
      return {
        type: 'nft-mint',
        instruction: 'Mint NFT',
        accounts: []
      };

    default:
      return {
        type: 'nft-unknown',
        instruction: `Unknown NFT instruction (type: ${instructionType})`,
        accounts: []
      };
  }
}

/**
 * Check if a token is an NFT based on its characteristics
 */
export function isNFTToken(tokenInfo: {
  supply: string;
  decimals: number;
  mintAuthority?: string | null;
  freezeAuthority?: string | null;
}): boolean {
  // NFTs typically have:
  // - Supply of 1
  // - 0 decimals
  // - No mint authority (supply is fixed)
  const supply = BigInt(tokenInfo.supply);
  
  return (
    supply === BigInt(1) &&
    tokenInfo.decimals === 0 &&
    tokenInfo.mintAuthority === null
  );
}

/**
 * Get NFT metadata from URI
 */
export async function fetchNFTMetadata(uri: string): Promise<NFTMetadata | null> {
  try {
    const response = await fetch(uri);
    if (!response.ok) {
      return null;
    }
    
    const metadata = await response.json();
    return {
      name: metadata.name || 'Unknown NFT',
      symbol: metadata.symbol || '',
      uri: uri,
      sellerFeeBasisPoints: metadata.seller_fee_basis_points || 0,
      creators: metadata.properties?.creators || [],
      collection: metadata.collection || undefined,
      uses: metadata.uses || undefined
    };
  } catch (error) {
    console.error('Failed to fetch NFT metadata:', error);
    return null;
  }
}

// Individual instruction decoders
function decodeCreateMetadataAccount(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'nft-create-metadata',
    programId,
    data: {
      metadata: instruction.accounts[0],
      mint: instruction.accounts[1],
      mintAuthority: instruction.accounts[2],
      payer: instruction.accounts[3],
      updateAuthority: instruction.accounts[4]
    },
    accounts: instruction.accounts || []
  };
}

function decodeUpdateMetadataAccount(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'nft-update-metadata',
    programId,
    data: {
      metadata: instruction.accounts[0],
      updateAuthority: instruction.accounts[1]
    },
    accounts: instruction.accounts || []
  };
}

function decodeCreateMasterEdition(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'nft-create-master-edition',
    programId,
    data: {
      edition: instruction.accounts[0],
      mint: instruction.accounts[1],
      updateAuthority: instruction.accounts[2],
      mintAuthority: instruction.accounts[3],
      payer: instruction.accounts[4],
      metadata: instruction.accounts[5]
    },
    accounts: instruction.accounts || []
  };
}

function decodeMintNewEdition(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'nft-mint-new-edition',
    programId,
    data: {
      metadata: instruction.accounts[0],
      edition: instruction.accounts[1],
      masterEdition: instruction.accounts[2],
      mint: instruction.accounts[3],
      mintAuthority: instruction.accounts[4]
    },
    accounts: instruction.accounts || []
  };
}

function decodeUpdateMetadataAccountV2(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'nft-update-metadata-v2',
    programId,
    data: {
      metadata: instruction.accounts[0],
      updateAuthority: instruction.accounts[1]
    },
    accounts: instruction.accounts || []
  };
}

function decodeCreateMetadataAccountV2(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'nft-create-metadata-v2',
    programId,
    data: {
      metadata: instruction.accounts[0],
      mint: instruction.accounts[1],
      mintAuthority: instruction.accounts[2],
      payer: instruction.accounts[3],
      updateAuthority: instruction.accounts[4]
    },
    accounts: instruction.accounts || []
  };
}

function decodeCreateMasterEditionV3(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'nft-create-master-edition-v3',
    programId,
    data: {
      edition: instruction.accounts[0],
      mint: instruction.accounts[1],
      updateAuthority: instruction.accounts[2],
      mintAuthority: instruction.accounts[3],
      payer: instruction.accounts[4],
      metadata: instruction.accounts[5]
    },
    accounts: instruction.accounts || []
  };
}

function decodeVerifyCollection(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'nft-verify-collection',
    programId,
    data: {
      metadata: instruction.accounts[0],
      collectionAuthority: instruction.accounts[1],
      payer: instruction.accounts[2],
      collectionMint: instruction.accounts[3],
      collection: instruction.accounts[4]
    },
    accounts: instruction.accounts || []
  };
}

function decodeUnverifyCollection(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'nft-unverify-collection',
    programId,
    data: {
      metadata: instruction.accounts[0],
      collectionAuthority: instruction.accounts[1],
      collectionMint: instruction.accounts[2],
      collection: instruction.accounts[3]
    },
    accounts: instruction.accounts || []
  };
}

function decodeVerifyCreator(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'nft-verify-creator',
    programId,
    data: {
      metadata: instruction.accounts[0],
      creator: instruction.accounts[1]
    },
    accounts: instruction.accounts || []
  };
}

function decodeUnverifyCreator(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'nft-unverify-creator',
    programId,
    data: {
      metadata: instruction.accounts[0],
      creator: instruction.accounts[1]
    },
    accounts: instruction.accounts || []
  };
}

function decodeBurnNft(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'nft-burn',
    programId,
    data: {
      metadata: instruction.accounts[0],
      owner: instruction.accounts[1],
      mint: instruction.accounts[2],
      tokenAccount: instruction.accounts[3]
    },
    accounts: instruction.accounts || []
  };
}

function decodeCreateMetadataAccountV3(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'nft-create-metadata-v3',
    programId,
    data: {
      metadata: instruction.accounts[0],
      mint: instruction.accounts[1],
      mintAuthority: instruction.accounts[2],
      payer: instruction.accounts[3],
      updateAuthority: instruction.accounts[4]
    },
    accounts: instruction.accounts || []
  };
}

function decodeSetCollectionSize(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'nft-set-collection-size',
    programId,
    data: {
      collectionMetadata: instruction.accounts[0],
      collectionAuthority: instruction.accounts[1],
      collectionMint: instruction.accounts[2]
    },
    accounts: instruction.accounts || []
  };
}

function decodeSetTokenStandard(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'nft-set-token-standard',
    programId,
    data: {
      metadata: instruction.accounts[0],
      updateAuthority: instruction.accounts[1],
      mint: instruction.accounts[2]
    },
    accounts: instruction.accounts || []
  };
}

function decodeNFTTransfer(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'nft-transfer',
    programId,
    data: {
      tokenAccount: instruction.accounts[0],
      tokenOwner: instruction.accounts[1],
      destinationTokenAccount: instruction.accounts[2],
      destinationOwner: instruction.accounts[3],
      mint: instruction.accounts[4]
    },
    accounts: instruction.accounts || []
  };
}

function decodeNFTMint(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'nft-mint',
    programId,
    data: {
      tokenAccount: instruction.accounts[0],
      tokenOwner: instruction.accounts[1],
      metadata: instruction.accounts[2],
      masterEdition: instruction.accounts[3],
      mint: instruction.accounts[4]
    },
    accounts: instruction.accounts || []
  };
}

function decodeNFTBurn(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'nft-burn',
    programId,
    data: {
      tokenAccount: instruction.accounts[0],
      mint: instruction.accounts[1],
      authority: instruction.accounts[2]
    },
    accounts: instruction.accounts || []
  };
}

function decodeNFTLock(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'nft-lock',
    programId,
    data: {
      authority: instruction.accounts[0],
      tokenOwner: instruction.accounts[1],
      tokenAccount: instruction.accounts[2],
      mint: instruction.accounts[3]
    },
    accounts: instruction.accounts || []
  };
}

function decodeNFTUnlock(instruction: any, programId: string): DecodedInstruction {
  return {
    type: 'nft-unlock',
    programId,
    data: {
      authority: instruction.accounts[0],
      tokenOwner: instruction.accounts[1],
      tokenAccount: instruction.accounts[2],
      mint: instruction.accounts[3]
    },
    accounts: instruction.accounts || []
  };
}
