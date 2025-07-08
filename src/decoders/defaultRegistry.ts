// Default decoder registry factory
import { DecoderRegistry, type RawInstruction, type DecodedInstruction } from './registry.js';
import { decodeSPLTokenInstruction } from './splToken.js';
import { decodeToken2022Instruction } from './token2022.js';
import { decodeNFTInstruction } from './nft.js';
import { decodeSystemInstruction } from './system.js';
import { decodeATAInstruction } from './ata.js';
import { getGorbchainConfig } from '../utils/gorbchainConfig.js';

// Wrapper functions to convert RawInstruction to specific instruction types
function wrapSPLTokenDecoder(instruction: RawInstruction): DecodedInstruction {
  const convertedInstruction = {
    programId: instruction.programId,
    data: instruction.data ?? new Uint8Array(0),
    accounts: instruction.accounts ?? []
  };
  return decodeSPLTokenInstruction(convertedInstruction as any);
}

function wrapToken2022Decoder(instruction: RawInstruction): DecodedInstruction {
  const convertedInstruction = {
    programId: instruction.programId,
    data: instruction.data ?? new Uint8Array(0),
    accounts: instruction.accounts ?? []
  };
  return decodeToken2022Instruction(convertedInstruction as any);
}

function wrapNFTDecoder(instruction: RawInstruction): DecodedInstruction {
  const convertedInstruction = {
    programId: instruction.programId,
    data: instruction.data ?? new Uint8Array(0),
    accounts: instruction.accounts ?? []
  };
  return decodeNFTInstruction(convertedInstruction as any);
}

function wrapSystemDecoder(instruction: RawInstruction): DecodedInstruction {
  const data = instruction.data ?? new Uint8Array(0);
  // Ensure data is Uint8Array
  const uint8Data = data instanceof Uint8Array ? data : new Uint8Array(data);
  const systemResult = decodeSystemInstruction(uint8Data);
  return {
    type: systemResult.type,
    programId: instruction.programId,
    data: systemResult as unknown as Record<string, unknown>,
    accounts: instruction.accounts ?? [],
    raw: instruction as unknown as Record<string, unknown>
  };
}

function wrapATADecoder(instruction: RawInstruction): DecodedInstruction {
  const convertedInstruction = {
    programId: instruction.programId,
    data: instruction.data ?? new Uint8Array(0),
    accounts: instruction.accounts ?? []
  };
  return decodeATAInstruction(convertedInstruction as any);
}

/**
 * Create a pre-configured decoder registry with common decoders
 */
export function createDefaultDecoderRegistry(): DecoderRegistry {
  const registry = new DecoderRegistry();

  // Get gorbchain config to access program IDs
  const config = getGorbchainConfig();

  // Register SPL Token decoder
  const splTokenProgramId = config.programIds?.splToken ?? 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
  registry.register('spl-token', splTokenProgramId, wrapSPLTokenDecoder);

  // Register Token-2022 decoder
  const token2022ProgramId = config.programIds?.token2022 ?? 'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn';
  registry.register('token-2022', token2022ProgramId, wrapToken2022Decoder);

  // Register NFT/Metaplex decoder
  const metaplexProgramId = config.programIds?.metaplex ?? 'BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc';
  registry.register('nft', metaplexProgramId, wrapNFTDecoder);

  // Register System program decoder
  const systemProgramId = '11111111111111111111111111111111';
  registry.register('system', systemProgramId, wrapSystemDecoder);

  // Register ATA decoder
  const ataProgramId = config.programIds?.ata ?? 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
  registry.register('ata', ataProgramId, wrapATADecoder);

  return registry;
}
