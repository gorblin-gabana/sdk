/**
 * Error severity levels for the SDK
 */
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  NETWORK = "network",
  RPC = "rpc",
  DECODER = "decoder",
  TRANSACTION = "transaction",
  VALIDATION = "validation",
  CONFIGURATION = "configuration",
  AUTHENTICATION = "authentication",
  RATE_LIMIT = "rate_limit",
  TIMEOUT = "timeout",
  UNKNOWN = "unknown",
}

/**
 * Error context information
 */
export interface ErrorContext {
  /** Transaction signature if applicable */
  transactionSignature?: string;
  /** Program ID if applicable */
  programId?: string;
  /** Account address if applicable */
  account?: string;
  /** RPC endpoint if applicable */
  rpcEndpoint?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Timestamp when error occurred */
  timestamp?: Date;
  /** SDK version */
  sdkVersion?: string;
  /** Network being used */
  network?: string;
}

/**
 * Base SDK error class with enhanced error information
 */
export abstract class SDKError extends Error {
  public readonly code: string;
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly context: ErrorContext;
  public readonly retryable: boolean;
  public readonly solution?: string;
  public readonly cause?: Error;

  constructor(
    message: string,
    code: string,
    severity: ErrorSeverity,
    category: ErrorCategory,
    context: ErrorContext = {},
    options: {
      retryable?: boolean;
      solution?: string;
      cause?: Error;
    } = {},
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.severity = severity;
    this.category = category;
    this.context = {
      ...context,
      timestamp: context.timestamp ?? new Date(),
      sdkVersion: context.sdkVersion ?? "0.1.0",
    };
    this.retryable = options.retryable ?? false;
    this.solution = options.solution;
    this.cause = options.cause;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);

    // Capture stack trace if available
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON for logging/reporting
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      category: this.category,
      context: this.context,
      retryable: this.retryable,
      solution: this.solution,
      stack: this.stack,
      cause: this.cause?.message,
    };
  }

  /**
   * Get detailed error message with context
   */
  getDetailedMessage(): string {
    let detailed = `${this.message} (Code: ${this.code})`;

    if (this.context.rpcEndpoint) {
      detailed += `\nRPC Endpoint: ${this.context.rpcEndpoint}`;
    }

    if (this.context.transactionSignature) {
      detailed += `\nTransaction: ${this.context.transactionSignature}`;
    }

    if (this.context.programId) {
      detailed += `\nProgram ID: ${this.context.programId}`;
    }

    if (this.solution) {
      detailed += `\nSolution: ${this.solution}`;
    }

    return detailed;
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return this.retryable;
  }

  /**
   * Check if error is critical
   */
  isCritical(): boolean {
    return this.severity === ErrorSeverity.CRITICAL;
  }
}

/**
 * Generic SDK error for unknown/unclassified errors
 */
export class GorbchainSDKError extends SDKError {
  constructor(
    message: string,
    context: ErrorContext = {},
    options: {
      retryable?: boolean;
      solution?: string;
      cause?: Error;
    } = {},
  ) {
    super(
      message,
      "GORBCHAIN_SDK_ERROR",
      ErrorSeverity.MEDIUM,
      ErrorCategory.UNKNOWN,
      context,
      options,
    );
  }
}

/**
 * Configuration error for invalid SDK setup
 */
export class ConfigurationError extends SDKError {
  constructor(
    message: string,
    context: ErrorContext = {},
    options: {
      solution?: string;
      cause?: Error;
    } = {},
  ) {
    super(
      message,
      "CONFIGURATION_ERROR",
      ErrorSeverity.HIGH,
      ErrorCategory.CONFIGURATION,
      context,
      {
        ...options,
        retryable: false,
      },
    );
  }
}
