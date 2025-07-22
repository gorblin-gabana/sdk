import {
  SDKError,
  ErrorSeverity,
  ErrorCategory,
  type ErrorContext,
} from "./base.js";

/**
 * RPC request failed due to network issues
 */
export class RpcNetworkError extends SDKError {
  constructor(
    message: string,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {},
  ) {
    super(
      message,
      "RPC_NETWORK_ERROR",
      ErrorSeverity.HIGH,
      ErrorCategory.NETWORK,
      context,
      {
        ...options,
        retryable: true,
        solution:
          "Check your internet connection and RPC endpoint availability. The request will be retried automatically.",
      },
    );
  }
}

/**
 * RPC request timeout
 */
export class RpcTimeoutError extends SDKError {
  constructor(
    timeout: number,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {},
  ) {
    super(
      `RPC request timed out after ${timeout}ms`,
      "RPC_TIMEOUT",
      ErrorSeverity.MEDIUM,
      ErrorCategory.TIMEOUT,
      context,
      {
        ...options,
        retryable: true,
        solution:
          "The RPC server is responding slowly. Consider increasing the timeout or switching to a different RPC endpoint.",
      },
    );
  }
}

/**
 * RPC server returned an error response
 */
export class RpcServerError extends SDKError {
  public readonly httpStatus?: number;
  public readonly rpcErrorCode?: number;

  constructor(
    message: string,
    httpStatus?: number,
    rpcErrorCode?: number,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {},
  ) {
    const retryable = httpStatus
      ? httpStatus >= 500 || httpStatus === 429
      : false;
    const solution = RpcServerError.getSolution(httpStatus, rpcErrorCode);

    super(
      message,
      "RPC_SERVER_ERROR",
      httpStatus && httpStatus >= 500
        ? ErrorSeverity.HIGH
        : ErrorSeverity.MEDIUM,
      httpStatus === 429 ? ErrorCategory.RATE_LIMIT : ErrorCategory.RPC,
      context,
      {
        ...options,
        retryable,
        solution,
      },
    );

    this.httpStatus = httpStatus;
    this.rpcErrorCode = rpcErrorCode;
  }

  private static getSolution(
    httpStatus?: number,
    rpcErrorCode?: number,
  ): string {
    if (httpStatus === 429) {
      return "Rate limit exceeded. The request will be retried with exponential backoff.";
    }
    if (httpStatus && httpStatus >= 500) {
      return "RPC server error. This is typically temporary and the request will be retried.";
    }
    if (httpStatus === 404) {
      return "RPC endpoint not found. Check your RPC URL configuration.";
    }
    if (httpStatus === 401 || httpStatus === 403) {
      return "Authentication failed. Check your API key or authentication credentials.";
    }
    if (rpcErrorCode === -32601) {
      return "RPC method not found. The RPC server may not support this method.";
    }
    if (rpcErrorCode === -32602) {
      return "Invalid RPC parameters. Check the request parameters and try again.";
    }
    if (rpcErrorCode === -32603) {
      return "Internal RPC error. This is typically a server-side issue.";
    }
    return "RPC request failed. Check the error details and try again.";
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      httpStatus: this.httpStatus,
      rpcErrorCode: this.rpcErrorCode,
    };
  }
}

/**
 * RPC method not supported by the server
 */
export class RpcMethodNotSupportedError extends SDKError {
  constructor(
    method: string,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {},
  ) {
    super(
      `RPC method '${method}' is not supported by this server`,
      "RPC_METHOD_NOT_SUPPORTED",
      ErrorSeverity.MEDIUM,
      ErrorCategory.RPC,
      context,
      {
        ...options,
        retryable: false,
        solution: `The RPC server does not support the '${method}' method. Try using a different RPC endpoint or check if the method name is correct.`,
      },
    );
  }
}

/**
 * Invalid RPC response format
 */
export class RpcInvalidResponseError extends SDKError {
  constructor(
    message: string,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {},
  ) {
    super(
      `Invalid RPC response: ${message}`,
      "RPC_INVALID_RESPONSE",
      ErrorSeverity.HIGH,
      ErrorCategory.RPC,
      context,
      {
        ...options,
        retryable: false,
        solution:
          "The RPC server returned an invalid response format. This may indicate a server issue or API version mismatch.",
      },
    );
  }
}

/**
 * RPC rate limit exceeded
 */
export class RpcRateLimitError extends SDKError {
  public readonly retryAfter?: number;

  constructor(
    retryAfter?: number,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {},
  ) {
    super(
      retryAfter
        ? `Rate limit exceeded. Retry after ${retryAfter} seconds.`
        : "Rate limit exceeded.",
      "RPC_RATE_LIMIT",
      ErrorSeverity.MEDIUM,
      ErrorCategory.RATE_LIMIT,
      context,
      {
        ...options,
        retryable: true,
        solution:
          "Request rate limit exceeded. The SDK will automatically retry with exponential backoff.",
      },
    );

    this.retryAfter = retryAfter;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    };
  }
}

/**
 * RPC connection failed
 */
export class RpcConnectionError extends SDKError {
  constructor(
    endpoint: string,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {},
  ) {
    super(
      `Failed to connect to RPC endpoint: ${endpoint}`,
      "RPC_CONNECTION_ERROR",
      ErrorSeverity.HIGH,
      ErrorCategory.NETWORK,
      { ...context, rpcEndpoint: endpoint },
      {
        ...options,
        retryable: true,
        solution:
          "Unable to connect to the RPC endpoint. Check your internet connection and ensure the RPC URL is correct.",
      },
    );
  }
}
