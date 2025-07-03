// NFT (Metaplex) decoders and builders
import { Address, address } from '@solana/addresses';
import { IInstruction } from '@solana/instructions';
import { decodeNFT, DecodedNFTMetadata } from '../utils/decodeNFT.js';
import { getGorbchainConfig } from '../utils/gorbchainConfig.js';

export function decodeCreateMetadata(ix: IInstruction, programId?: Address): { type: string; metadata: DecodedNFTMetadata } {
  if (!ix.data) throw new Error('Instruction missing data');
  const metadata = decodeNFT(new Uint8Array(ix.data));
  return {
    type: 'createMetadata',
    metadata,
  };
}

export function decodeUpdateMetadata(ix: IInstruction, programId?: Address) {
  // TODO: Implement UpdateMetadata decoding using decodeNFT if needed
  return { type: 'updateMetadata', data: {} };
}

export interface CreateMetadataArgs {
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators?: Array<{ address: string; verified: boolean; share: number }>;
  collection?: { verified: boolean; key: string };
  updateAuthority: string;
  mint: string;
  payer: string;
}

export function buildCreateMetadataInstruction(args: CreateMetadataArgs): IInstruction {
  // Use programId from config
  const programAddress = address(getGorbchainConfig().programIds?.metaplex || 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
  // TODO: Implement full serialization using Beet or manual
  return {
    programAddress,
    accounts: [
      { address: address(args.mint), role: 1 }, // writable
      { address: address(args.payer), role: 2 }, // writable signer
      { address: address(args.updateAuthority), role: 1 }, // writable
    ],
    data: new Uint8Array(0), // TODO: serialize args
  };
}
