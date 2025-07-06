import { SDKError, ErrorSeverity, ErrorCategory, type ErrorContext } from './base.js';

/**
 * Transaction not found
 */
export class TransactionNotFoundError extends SDKError {
  public readonly signature: string;

  constructor(
    signature: string,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {}
  ) {
    super(
      `Transaction not found: ${signature}`,
      'TRANSACTION_NOT_FOUND',
      ErrorSeverity.MEDIUM,
      ErrorCategory.TRANSACTION,
      { ...context, transactionSignature: signature },
      {
        ...options,
        retryable: true,
        solution: 'The transaction may not have been processed yet. Try again in a few seconds, or check if the signature is correct.'
      }
    );

    this.signature = signature;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      signature: this.signature
    };
  }
}

/**
 * Transaction failed to process
 */
export class TransactionFailedError extends SDKError {
  public readonly signature?: string;
  public readonly errorCode?: string;
  public readonly logs?: string[];

  constructor(
    message: string,
    signature?: string,
    errorCode?: string,
    logs?: string[],
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {}
  ) {
    super(
      message,
      'TRANSACTION_FAILED',
      ErrorSeverity.HIGH,
      ErrorCategory.TRANSACTION,
      { ...context, transactionSignature: signature },
      {
        ...options,
        retryable: false,
        solution: 'The transaction failed during execution. Check the transaction logs for more details about the failure.'
      }
    );

    this.signature = signature;
    this.errorCode = errorCode;
    this.logs = logs;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      signature: this.signature,
      errorCode: this.errorCode,
      logs: this.logs
    };
  }
}

/**
 * Transaction signature invalid
 */
export class InvalidTransactionSignatureError extends SDKError {
  public readonly signature: string;

  constructor(
    signature: string,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {}
  ) {
    super(
      `Invalid transaction signature format: ${signature}`,
      'INVALID_TRANSACTION_SIGNATURE',
      ErrorSeverity.MEDIUM,
      ErrorCategory.VALIDATION,
      { ...context, transactionSignature: signature },
      {
        ...options,
        retryable: false,
        solution: 'The transaction signature is not in the correct format. It should be a base58-encoded string.'
      }
    );

    this.signature = signature;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      signature: this.signature
    };
  }
}

/**
 * Transaction processing timeout
 */
export class TransactionTimeoutError extends SDKError {
  public readonly signature?: string;
  public readonly timeoutMs: number;

  constructor(
    timeoutMs: number,
    signature?: string,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {}
  ) {
    super(
      `Transaction processing timed out after ${timeoutMs}ms`,
      'TRANSACTION_TIMEOUT',
      ErrorSeverity.MEDIUM,
      ErrorCategory.TIMEOUT,
      { ...context, transactionSignature: signature },
      {
        ...options,
        retryable: true,
        solution: 'The transaction is taking longer than expected to process. It may still complete successfully.'
      }
    );

    this.signature = signature;
    this.timeoutMs = timeoutMs;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      signature: this.signature,
      timeoutMs: this.timeoutMs
    };
  }
}

/**
 * Transaction simulation failed
 */
export class TransactionSimulationError extends SDKError {
  public readonly error?: string;
  public readonly logs?: string[];

  constructor(
    message: string,
    error?: string,
    logs?: string[],
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {}
  ) {
    super(
      `Transaction simulation failed: ${message}`,
      'TRANSACTION_SIMULATION_ERROR',
      ErrorSeverity.MEDIUM,
      ErrorCategory.TRANSACTION,
      context,
      {
        ...options,
        retryable: false,
        solution: 'The transaction simulation failed. Check the transaction parameters and account states.'
      }
    );

    this.error = error;
    this.logs = logs;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      error: this.error,
      logs: this.logs
    };
  }
}

/**
 * Insufficient funds for transaction
 */
export class InsufficientFundsError extends SDKError {
  public readonly required?: number;
  public readonly available?: number;
  public readonly account?: string;

  constructor(
    required?: number,
    available?: number,
    account?: string,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {}
  ) {
    const message = required && available
      ? `Insufficient funds. Required: ${required}, Available: ${available}`
      : 'Insufficient funds for transaction';

    super(
      message,
      'INSUFFICIENT_FUNDS',
      ErrorSeverity.MEDIUM,
      ErrorCategory.TRANSACTION,
      { ...context, account },
      {
        ...options,
        retryable: false,
        solution: 'Ensure the account has sufficient funds to cover the transaction cost and any token transfers.'
      }
    );

    this.required = required;
    this.available = available;
    this.account = account;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      required: this.required,
      available: this.available,
      account: this.account
    };
  }
}

/**
 * Transaction too large
 */
export class TransactionTooLargeError extends SDKError {
  public readonly size?: number;
  public readonly maxSize?: number;

  constructor(
    size?: number,
    maxSize?: number,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {}
  ) {
    const message = size && maxSize
      ? `Transaction too large. Size: ${size} bytes, Max: ${maxSize} bytes`
      : 'Transaction exceeds maximum size limit';

    super(
      message,
      'TRANSACTION_TOO_LARGE',
      ErrorSeverity.MEDIUM,
      ErrorCategory.TRANSACTION,
      context,
      {
        ...options,
        retryable: false,
        solution: 'Reduce the number of instructions or accounts in the transaction, or split it into multiple transactions.'
      }
    );

    this.size = size;
    this.maxSize = maxSize;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      size: this.size,
      maxSize: this.maxSize
    };
  }
} 