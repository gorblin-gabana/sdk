// Default decoder registry factory
import {
  DecoderRegistry,
  type RawInstruction,
  type DecodedInstruction,
} from "./registry.js";
import { decodeSPLTokenInstruction } from "./splToken.js";
import { decodeToken2022Instruction } from "./token2022.js";
import { decodeNFTInstruction } from "./nft.js";
import { decodeSystemInstruction } from "./system.js";
import { decodeATAInstruction } from "./ata.js";
import { getGorbchainConfig } from "../utils/gorbchainConfig.js";

// Wrapper functions to convert RawInstruction to specific instruction types
function wrapSPLTokenDecoder(instruction: RawInstruction): DecodedInstruction {
  const convertedInstruction = {
    programId: instruction.programId,
    data: instruction.data ?? new Uint8Array(0),
    accounts: instruction.accounts ?? [],
  };
  return decodeSPLTokenInstruction(convertedInstruction as any);
}

function wrapToken2022Decoder(instruction: RawInstruction): DecodedInstruction {
  const convertedInstruction = {
    programId: instruction.programId,
    data: instruction.data ?? new Uint8Array(0),
    accounts: instruction.accounts ?? [],
  };
  return decodeToken2022Instruction(convertedInstruction as any);
}

function wrapNFTDecoder(instruction: RawInstruction): DecodedInstruction {
  const convertedInstruction = {
    programId: instruction.programId,
    data: instruction.data ?? new Uint8Array(0),
    accounts: instruction.accounts ?? [],
  };
  return decodeNFTInstruction(convertedInstruction as any);
}

function wrapSystemDecoder(instruction: RawInstruction): DecodedInstruction {
  const data = instruction.data ?? new Uint8Array(0);

  // Handle malformed data - if it's not Uint8Array or valid array, return unknown
  let uint8Data: Uint8Array;
  try {
    if (data instanceof Uint8Array) {
      uint8Data = data;
    } else if (Array.isArray(data)) {
      uint8Data = new Uint8Array(data);
    } else {
      // Invalid data type - return unknown instead of system-unknown
      return {
        type: "unknown",
        programId: instruction.programId,
        data: { error: "Invalid data type for system instruction" },
        accounts: instruction.accounts ?? [],
        raw: instruction as unknown as Record<string, unknown>,
      };
    }
  } catch (error) {
    return {
      type: "unknown",
      programId: instruction.programId,
      data: { error: "Failed to process system instruction data" },
      accounts: instruction.accounts ?? [],
      raw: instruction as unknown as Record<string, unknown>,
    };
  }

  const systemResult = decodeSystemInstruction(uint8Data);
  return {
    type: systemResult.type,
    programId: instruction.programId,
    data: systemResult as unknown as Record<string, unknown>,
    accounts: instruction.accounts ?? [],
    raw: instruction as unknown as Record<string, unknown>,
  };
}

function wrapATADecoder(instruction: RawInstruction): DecodedInstruction {
  const convertedInstruction = {
    programId: instruction.programId,
    data: instruction.data ?? new Uint8Array(0),
    accounts: instruction.accounts ?? [],
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
  const splTokenProgramId =
    config.programIds?.splToken ??
    "Gorbj8Dp27NkXMQUkeHBSmpf6iQ3yT4b2uVe8kM4s6br";
  registry.register("spl-token", splTokenProgramId, wrapSPLTokenDecoder);

  // Register Token-2022 decoder
  const token2022ProgramId =
    config.programIds?.token2022 ??
    "G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6";
  registry.register("token-2022", token2022ProgramId, wrapToken2022Decoder);

  // Register NFT/Metaplex decoder
  const metaplexProgramId =
    config.programIds?.metaplex ??
    "GMTAp1moCdGh4TEwFTcCJKeKL3UMEDB6vKpo2uxM9h4s";
  registry.register("nft", metaplexProgramId, wrapNFTDecoder);

  // Register System program decoder
  const systemProgramId = "11111111111111111111111111111111";
  registry.register("system", systemProgramId, wrapSystemDecoder);

  // Register ATA decoder
  const ataProgramId =
    config.programIds?.ata ?? "GoATGVNeSXerFerPqTJ8hcED1msPWHHLxao2vwBYqowm";
  registry.register("ata", ataProgramId, wrapATADecoder);

  return registry;
}
