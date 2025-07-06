// Default decoder registry factory
import { DecoderRegistry } from './registry.js';
import { decodeSPLTokenInstruction } from './splToken.js';
import { decodeToken2022Instruction } from './token2022.js';
import { decodeNFTInstruction } from './nft.js';
import { getGorbchainConfig } from '../utils/gorbchainConfig.js';

/**
 * Create a pre-configured decoder registry with common decoders
 */
export function createDefaultDecoderRegistry(): DecoderRegistry {
  const registry = new DecoderRegistry();

  // Get gorbchain config to access program IDs
  const config = getGorbchainConfig();

  // Register SPL Token decoder
  const splTokenProgramId = config.programIds?.splToken ?? 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
  registry.register('spl-token', splTokenProgramId, decodeSPLTokenInstruction);

  // Register Token-2022 decoder
  const token2022ProgramId = config.programIds?.token2022 ?? 'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn';
  registry.register('token-2022', token2022ProgramId, decodeToken2022Instruction);

  // Register NFT/Metaplex decoder
  const metaplexProgramId = config.programIds?.metaplex ?? 'BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc';
  registry.register('nft', metaplexProgramId, decodeNFTInstruction);

  return registry;
}
