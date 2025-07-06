import { SDKError, ErrorSeverity, ErrorCategory, type ErrorContext } from './base.js';

/**
 * Instruction decoding failed
 */
export class DecoderError extends SDKError {
  public readonly instructionData?: string;
  public readonly programId?: string;

  constructor(
    message: string,
    instructionData?: string,
    programId?: string,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {}
  ) {
    super(
      message,
      'DECODER_ERROR',
      ErrorSeverity.MEDIUM,
      ErrorCategory.DECODER,
      { ...context, programId },
      {
        ...options,
        retryable: false,
        solution: 'The instruction could not be decoded. This may indicate an unknown instruction type or corrupted data.'
      }
    );

    this.instructionData = instructionData;
    this.programId = programId;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      instructionData: this.instructionData,
      programId: this.programId
    };
  }
}

/**
 * No decoder registered for program
 */
export class DecoderNotFoundError extends SDKError {
  public readonly programId: string;

  constructor(
    programId: string,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {}
  ) {
    super(
      `No decoder found for program: ${programId}`,
      'DECODER_NOT_FOUND',
      ErrorSeverity.LOW,
      ErrorCategory.DECODER,
      { ...context, programId },
      {
        ...options,
        retryable: false,
        solution: `Register a decoder for program ${programId} using the DecoderRegistry.registerDecoder() method.`
      }
    );

    this.programId = programId;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      programId: this.programId
    };
  }
}

/**
 * Invalid instruction data format
 */
export class InvalidInstructionDataError extends SDKError {
  public readonly instructionData: string;
  public readonly expectedFormat?: string;

  constructor(
    instructionData: string,
    expectedFormat?: string,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {}
  ) {
    const message = expectedFormat
      ? `Invalid instruction data format. Expected: ${expectedFormat}`
      : 'Invalid instruction data format';

    super(
      message,
      'INVALID_INSTRUCTION_DATA',
      ErrorSeverity.MEDIUM,
      ErrorCategory.DECODER,
      context,
      {
        ...options,
        retryable: false,
        solution: 'The instruction data format is invalid. Check that the data is properly encoded and matches the expected format.'
      }
    );

    this.instructionData = instructionData;
    this.expectedFormat = expectedFormat;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      instructionData: this.instructionData,
      expectedFormat: this.expectedFormat
    };
  }
}

/**
 * Token metadata decoding failed
 */
export class TokenMetadataDecodingError extends SDKError {
  public readonly mintAddress?: string;
  public readonly metadataAccount?: string;

  constructor(
    message: string,
    mintAddress?: string,
    metadataAccount?: string,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {}
  ) {
    super(
      `Token metadata decoding failed: ${message}`,
      'TOKEN_METADATA_DECODING_ERROR',
      ErrorSeverity.MEDIUM,
      ErrorCategory.DECODER,
      { ...context, account: metadataAccount || mintAddress },
      {
        ...options,
        retryable: false,
        solution: 'The token metadata could not be decoded. This may indicate an invalid metadata account or unsupported metadata format.'
      }
    );

    this.mintAddress = mintAddress;
    this.metadataAccount = metadataAccount;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      mintAddress: this.mintAddress,
      metadataAccount: this.metadataAccount
    };
  }
}

/**
 * NFT metadata decoding failed
 */
export class NFTMetadataDecodingError extends SDKError {
  public readonly nftAddress?: string;
  public readonly metadataUri?: string;

  constructor(
    message: string,
    nftAddress?: string,
    metadataUri?: string,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {}
  ) {
    super(
      `NFT metadata decoding failed: ${message}`,
      'NFT_METADATA_DECODING_ERROR',
      ErrorSeverity.MEDIUM,
      ErrorCategory.DECODER,
      { ...context, account: nftAddress },
      {
        ...options,
        retryable: false,
        solution: 'The NFT metadata could not be decoded. Check that the metadata URI is accessible and contains valid JSON.'
      }
    );

    this.nftAddress = nftAddress;
    this.metadataUri = metadataUri;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      nftAddress: this.nftAddress,
      metadataUri: this.metadataUri
    };
  }
}

/**
 * Account data decoding failed
 */
export class AccountDataDecodingError extends SDKError {
  public readonly accountAddress?: string;
  public readonly accountType?: string;

  constructor(
    message: string,
    accountAddress?: string,
    accountType?: string,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {}
  ) {
    super(
      `Account data decoding failed: ${message}`,
      'ACCOUNT_DATA_DECODING_ERROR',
      ErrorSeverity.MEDIUM,
      ErrorCategory.DECODER,
      { ...context, account: accountAddress },
      {
        ...options,
        retryable: false,
        solution: 'The account data could not be decoded. This may indicate an unsupported account type or corrupted data.'
      }
    );

    this.accountAddress = accountAddress;
    this.accountType = accountType;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      accountAddress: this.accountAddress,
      accountType: this.accountType
    };
  }
}

/**
 * Swap instruction decoding failed
 */
export class SwapDecodingError extends SDKError {
  public readonly swapProgram?: string;
  public readonly swapType?: string;

  constructor(
    message: string,
    swapProgram?: string,
    swapType?: string,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {}
  ) {
    super(
      `Swap instruction decoding failed: ${message}`,
      'SWAP_DECODING_ERROR',
      ErrorSeverity.MEDIUM,
      ErrorCategory.DECODER,
      { ...context, programId: swapProgram },
      {
        ...options,
        retryable: false,
        solution: 'The swap instruction could not be decoded. This may indicate an unsupported swap program or instruction format.'
      }
    );

    this.swapProgram = swapProgram;
    this.swapType = swapType;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      swapProgram: this.swapProgram,
      swapType: this.swapType
    };
  }
}
