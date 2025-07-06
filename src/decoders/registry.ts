/**
 * Central registry for managing blockchain program instruction decoders
 *
 * This module provides the core functionality for registering, managing,
 * and executing instruction decoders for various blockchain programs.
 */

/**
 * Represents a decoded blockchain instruction with structured data
 */
export interface DecodedInstruction {
  /** The type/name of the decoded instruction */
  type: string;
  /** The program ID that owns this instruction */
  programId: string;
  /** Parsed instruction data specific to the instruction type */
  data: any;
  /** Array of account information used by this instruction */
  accounts: any[];
  /** Optional raw instruction data for debugging/reference */
  raw?: any;
}

/**
 * Function signature for instruction decoder implementations
 *
 * @param instruction - Raw instruction object to decode
 * @returns Decoded instruction with structured data
 */
export type DecoderFunction = (instruction: any) => DecodedInstruction;

/**
 * Registry for managing instruction decoders across multiple programs
 *
 * The DecoderRegistry maintains a mapping between program IDs and their
 * corresponding decoder functions, enabling automatic instruction decoding
 * based on the program that created the instruction.
 *
 * @example
 * ```typescript
 * const registry = new DecoderRegistry();
 *
 * // Register a decoder for SPL Token instructions
 * registry.register('spl-token', 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
 *   (instruction) => ({
 *     type: 'spl-token-transfer',
 *     programId: instruction.programId,
 *     data: { amount: instruction.amount },
 *     accounts: instruction.accounts
 *   })
 * );
 *
 * // Decode an instruction
 * const decoded = registry.decode(instruction);
 * ```
 */
export class DecoderRegistry {
  /** Internal map of program names to decoder functions */
  private decoders = new Map<string, DecoderFunction>();

  /** Internal map of program IDs to program names for lookup */
  private programIdToName = new Map<string, string>();

  /**
   * Register a decoder function for a specific blockchain program
   *
   * @param programName - Human-readable name for the program
   * @param programId - The program's public key address
   * @param decoder - Function that decodes instructions for this program
   *
   * @example
   * ```typescript
   * registry.register(
   *   'my-custom-program',
   *   'ProgramId12345...',
   *   (instruction) => ({
   *     type: 'custom-action',
   *     programId: instruction.programId,
   *     data: parseCustomData(instruction.data),
   *     accounts: instruction.accounts
   *   })
   * );
   * ```
   */
  register(programName: string, programId: string, decoder: DecoderFunction): void {
    this.decoders.set(programName, decoder);
    this.programIdToName.set(programId, programName);
  }

  /**
   * Decode an instruction using the appropriate decoder
   */
  decode(instruction: any): DecodedInstruction {
    console.log('🔥 DECODER: decode() called with instruction:', instruction);
    console.log('🔥 DECODER: instruction.programId:', instruction.programId);
    console.log('🔥 DECODER: instruction.data type:', typeof instruction.data);
    console.log('🔥 DECODER: instruction.data:', instruction.data);
    
    // First map programId to programName
    const programName = this.programIdToName.get(instruction.programId);
    console.log('🔥 DECODER: Mapped programId to programName:', programName);
    
    if (!programName) {
      console.log('🔥 DECODER: No program name found for programId, returning unknown');
      return {
        type: 'unknown',
        programId: instruction.programId,
        data: instruction.data,
        accounts: instruction.accounts || [],
        raw: instruction
      };
    }
    
    // Now get the decoder using the program name
    const decoder = this.decoders.get(programName);
    console.log('🔥 DECODER: Found decoder for program name?', !!decoder);
    
    if (!decoder) {
      console.log('🔥 DECODER: No decoder found for program name, returning unknown');
      return {
        type: 'unknown',
        programId: instruction.programId,
        data: instruction.data,
        accounts: instruction.accounts || [],
        raw: instruction
      };
    }

    try {
      console.log('🔥 DECODER: Attempting to decode instruction...');
      const result = decoder(instruction);
      console.log('🔥 DECODER: Decode successful:', result);
      return result;
    } catch (error) {
      console.error('🔥 DECODER: Decode failed with error:', error);
      console.error('🔥 DECODER: Error stack:', (error as Error)?.stack);
      return {
        type: 'error',
        programId: instruction.programId,
        data: {
          error: (error as Error).message,
          originalData: instruction.data
        },
        accounts: instruction.accounts || [],
        raw: instruction
      };
    }
  }

  /**
   * Check if a decoder is registered for a specific program ID
   *
   * @param programId - The program's public key address to check
   * @returns True if a decoder is registered for this program ID
   *
   * @example
   * ```typescript
   * if (registry.hasDecoder('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')) {
   *   console.log('SPL Token decoder is available');
   * }
   * ```
   */
  hasDecoder(programId: string): boolean {
    return this.programIdToName.has(programId);
  }

  /**
   * Get a list of all registered program names
   *
   * @returns Array of program names that have registered decoders
   *
   * @example
   * ```typescript
   * const programs = registry.getRegisteredPrograms();
   * console.log('Supported programs:', programs);
   * // Output: ['spl-token', 'gorba-token', 'custom-program']
   * ```
   */
  getRegisteredPrograms(): string[] {
    return Array.from(this.decoders.keys());
  }

  private createRawResult(instruction: any): DecodedInstruction {
    const data = instruction.data || new Uint8Array(0);
    return {
      type: 'unknown',
      programId: instruction.programAddress?.toString() || instruction.programId,
      data: {
        raw: Array.from(data),
        hex: this.toHexString(data)
      },
      accounts: instruction.accounts || [],
      raw: instruction
    };
  }

  private createErrorResult(instruction: any, error: string): DecodedInstruction {
    return {
      type: 'error',
      programId: instruction.programAddress?.toString() || instruction.programId,
      data: { error },
      accounts: instruction.accounts || [],
      raw: instruction
    };
  }

  private toHexString(data: Uint8Array | number[]): string {
    return Array.from(data).map(b => {
      const hex = b.toString(16);
      return hex.length === 1 ? `0${  hex}` : hex;
    }).join('');
  }
}
