/**
 * Decoder registry setup utilities for the GorbchainSDK
 *
 * This module contains functions for setting up and configuring
 * the decoder registry with various blockchain program decoders.
 */

import { DecoderRegistry } from '../decoders/registry.js';
import type { DecodedInstruction } from '../decoders/registry.js';
import type { GorbchainSDKConfig } from '../sdk/types.js';
import { base64ToUint8Array } from './dataProcessing.js';

// Import all decoders
import { decodeSystemInstruction } from '../decoders/system.js';
import { decodeSPLTokenInstruction } from '../decoders/splToken.js';
import { decodeToken2022Instruction } from '../decoders/token2022.js';
import { decodeATAInstruction } from '../decoders/ata.js';
import { decodeNFTInstruction } from '../decoders/nft.js';

// Internal instruction interface for decoder compatibility
interface InternalRawInstruction {
  programId: string;
  data?: Uint8Array | number[];
  accounts?: string[];
  programAddress?: { toString(): string };
}

/**
 * Create and configure a decoder registry with all supported program decoders
 */
export function createDecoderRegistry(config: GorbchainSDKConfig): DecoderRegistry {
  const registry = new DecoderRegistry();

  // Helper function to convert base64 string to Uint8Array
  const base64ToUint8Array = (base64: string): Uint8Array => {
    try {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } catch {
      return new Uint8Array(0);
    }
  };

  // Register System Program decoder
  const systemProgramId = '11111111111111111111111111111111';
  registry.register('system', systemProgramId, (instruction: InternalRawInstruction): DecodedInstruction => {
    const data = instruction.data ? (instruction.data instanceof Uint8Array ? instruction.data : new Uint8Array(instruction.data)) : new Uint8Array(0);
    const decoded = decodeSystemInstruction(data);
    return {
      type: decoded.type,
      programId: instruction.programId,
      data: {
        instruction: decoded.instruction,
        lamports: decoded.lamports,
        space: decoded.space,
        seed: decoded.seed
      } as Record<string, unknown>,
      accounts: instruction.accounts || [],
      raw: instruction as unknown as Record<string, unknown>
    };
  });

  // Register SPL Token decoder
  const splTokenProgramId = config.programIds?.splToken || 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
  registry.register('spl-token', splTokenProgramId, (instruction: any): DecodedInstruction => {
    const decoded = decodeSPLTokenInstruction(instruction);
    return {
      type: decoded.type,
      programId: instruction.programId,
      data: decoded.data,
      accounts: instruction.accounts || [],
      raw: instruction as unknown as Record<string, unknown>
    };
  });

  // Register Token-2022 decoder
  const token2022ProgramId = config.programIds?.token2022 || 'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn';
  registry.register('token-2022', token2022ProgramId, (instruction: any): DecodedInstruction => {
    const decoded = decodeToken2022Instruction(instruction);
    return {
      type: decoded.type,
      programId: instruction.programId,
      data: decoded.data,
      accounts: instruction.accounts || [],
      raw: instruction as unknown as Record<string, unknown>
    };
  });

  // Register ATA decoder
  const ataProgramId = config.programIds?.ata || '4YpYoLVTQ8bxcne9GneN85RUXeN7pqGTwgPcY71ZL5gX';
  registry.register('ata', ataProgramId, (instruction: any): DecodedInstruction => {
    const decoded = decodeATAInstruction(instruction);
    return {
      type: decoded.type,
      programId: instruction.programId,
      data: decoded.data,
      accounts: instruction.accounts || [],
      raw: instruction as unknown as Record<string, unknown>
    };
  });

  // Register NFT/Metaplex decoder
  const metaplexProgramId = config.programIds?.metaplex || 'BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc';
  registry.register('nft', metaplexProgramId, (instruction: any): DecodedInstruction => {
    const decoded = decodeNFTInstruction(instruction);
    return {
      type: decoded.type,
      programId: instruction.programId,
      data: decoded.data,
      accounts: instruction.accounts || [],
      raw: instruction as unknown as Record<string, unknown>
    };
  });

  return registry;
}

/**
 * Get program name from program ID
 */
export function getProgramName(programId: string): string {
  const programNames: Record<string, string> = {
    '11111111111111111111111111111111': 'System',
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'SPL Token',
    'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn': 'Token-2022',
    '4YpYoLVTQ8bxcne9GneN85RUXeN7pqGTwgPcY71ZL5gX': 'ATA',
    'BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc': 'Metaplex'
    // Add more program mappings as needed
  };

  return programNames[programId] || 'Unknown Program';
}
