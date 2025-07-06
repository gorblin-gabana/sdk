import { SDKError, ErrorSeverity, ErrorCategory, type ErrorContext } from './base.js';

/**
 * Invalid address format
 */
export class InvalidAddressError extends SDKError {
  public readonly address: string;
  public readonly expectedFormat?: string;

  constructor(
    address: string,
    expectedFormat?: string,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {}
  ) {
    const message = expectedFormat
      ? `Invalid address format: ${address}. Expected: ${expectedFormat}`
      : `Invalid address format: ${address}`;

    super(
      message,
      'INVALID_ADDRESS',
      ErrorSeverity.MEDIUM,
      ErrorCategory.VALIDATION,
      context,
      {
        ...options,
        retryable: false,
        solution: expectedFormat
          ? `Ensure the address is in the correct format: ${expectedFormat}`
          : 'Ensure the address is a valid base58-encoded public key.'
      }
    );

    this.address = address;
    this.expectedFormat = expectedFormat;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      address: this.address,
      expectedFormat: this.expectedFormat
    };
  }
}

/**
 * Invalid parameter value
 */
export class InvalidParameterError extends SDKError {
  public readonly parameterName: string;
  public readonly parameterValue: unknown;
  public readonly expectedType?: string;

  constructor(
    parameterName: string,
    parameterValue: unknown,
    expectedType?: string,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {}
  ) {
    const message = expectedType
      ? `Invalid parameter '${parameterName}': ${parameterValue}. Expected: ${expectedType}`
      : `Invalid parameter '${parameterName}': ${parameterValue}`;

    super(
      message,
      'INVALID_PARAMETER',
      ErrorSeverity.MEDIUM,
      ErrorCategory.VALIDATION,
      context,
      {
        ...options,
        retryable: false,
        solution: expectedType
          ? `Ensure the parameter '${parameterName}' is of type: ${expectedType}`
          : `Check the parameter '${parameterName}' value and format.`
      }
    );

    this.parameterName = parameterName;
    this.parameterValue = parameterValue;
    this.expectedType = expectedType;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      parameterName: this.parameterName,
      parameterValue: this.parameterValue,
      expectedType: this.expectedType
    };
  }
}

/**
 * Missing required parameter
 */
export class MissingParameterError extends SDKError {
  public readonly parameterName: string;

  constructor(
    parameterName: string,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {}
  ) {
    super(
      `Missing required parameter: ${parameterName}`,
      'MISSING_PARAMETER',
      ErrorSeverity.MEDIUM,
      ErrorCategory.VALIDATION,
      context,
      {
        ...options,
        retryable: false,
        solution: `Provide the required parameter: ${parameterName}`
      }
    );

    this.parameterName = parameterName;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      parameterName: this.parameterName
    };
  }
}

/**
 * Invalid configuration
 */
export class InvalidConfigurationError extends SDKError {
  public readonly configField?: string;
  public readonly configValue?: unknown;

  constructor(
    message: string,
    configField?: string,
    configValue?: unknown,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {}
  ) {
    super(
      message,
      'INVALID_CONFIGURATION',
      ErrorSeverity.HIGH,
      ErrorCategory.CONFIGURATION,
      context,
      {
        ...options,
        retryable: false,
        solution: 'Check the SDK configuration and ensure all required fields are properly set.'
      }
    );

    this.configField = configField;
    this.configValue = configValue;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      configField: this.configField,
      configValue: this.configValue
    };
  }
}

/**
 * Invalid token amount
 */
export class InvalidTokenAmountError extends SDKError {
  public readonly amount: unknown;
  public readonly mintAddress?: string;

  constructor(
    amount: unknown,
    mintAddress?: string,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {}
  ) {
    super(
      `Invalid token amount: ${amount}`,
      'INVALID_TOKEN_AMOUNT',
      ErrorSeverity.MEDIUM,
      ErrorCategory.VALIDATION,
      context,
      {
        ...options,
        retryable: false,
        solution: 'Ensure the token amount is a positive number and within the valid range.'
      }
    );

    this.amount = amount;
    this.mintAddress = mintAddress;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      amount: this.amount,
      mintAddress: this.mintAddress
    };
  }
}

/**
 * Invalid public key
 */
export class InvalidPublicKeyError extends SDKError {
  public readonly publicKey: string;

  constructor(
    publicKey: string,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {}
  ) {
    super(
      `Invalid public key: ${publicKey}`,
      'INVALID_PUBLIC_KEY',
      ErrorSeverity.MEDIUM,
      ErrorCategory.VALIDATION,
      context,
      {
        ...options,
        retryable: false,
        solution: 'Ensure the public key is a valid base58-encoded 32-byte public key.'
      }
    );

    this.publicKey = publicKey;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      publicKey: this.publicKey
    };
  }
}

/**
 * Invalid program ID
 */
export class InvalidProgramIdError extends SDKError {
  public readonly programId: string;

  constructor(
    programId: string,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {}
  ) {
    super(
      `Invalid program ID: ${programId}`,
      'INVALID_PROGRAM_ID',
      ErrorSeverity.MEDIUM,
      ErrorCategory.VALIDATION,
      context,
      {
        ...options,
        retryable: false,
        solution: 'Ensure the program ID is a valid base58-encoded public key.'
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
 * Invalid data format
 */
export class InvalidDataFormatError extends SDKError {
  public readonly data: unknown;
  public readonly expectedFormat?: string;

  constructor(
    data: unknown,
    expectedFormat?: string,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {}
  ) {
    const message = expectedFormat
      ? `Invalid data format. Expected: ${expectedFormat}`
      : 'Invalid data format';

    super(
      message,
      'INVALID_DATA_FORMAT',
      ErrorSeverity.MEDIUM,
      ErrorCategory.VALIDATION,
      context,
      {
        ...options,
        retryable: false,
        solution: expectedFormat
          ? `Ensure the data is in the expected format: ${expectedFormat}`
          : 'Check the data format and ensure it matches the expected structure.'
      }
    );

    this.data = data;
    this.expectedFormat = expectedFormat;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      data: this.data,
      expectedFormat: this.expectedFormat
    };
  }
} 