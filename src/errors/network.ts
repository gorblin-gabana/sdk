import { SDKError, ErrorSeverity, ErrorCategory, type ErrorContext } from './base.js';

/**
 * Network connection failed
 */
export class NetworkConnectionError extends SDKError {
  public readonly endpoint?: string;
  public readonly networkType?: string;

  constructor(
    message: string,
    endpoint?: string,
    networkType?: string,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {}
  ) {
    super(
      message,
      'NETWORK_CONNECTION_ERROR',
      ErrorSeverity.HIGH,
      ErrorCategory.NETWORK,
      { ...context, rpcEndpoint: endpoint, network: networkType },
      {
        ...options,
        retryable: true,
        solution: 'Check your internet connection and verify the network endpoint is accessible.'
      }
    );

    this.endpoint = endpoint;
    this.networkType = networkType;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      endpoint: this.endpoint,
      networkType: this.networkType
    };
  }
}

/**
 * Network timeout
 */
export class NetworkTimeoutError extends SDKError {
  public readonly timeoutMs: number;
  public readonly endpoint?: string;

  constructor(
    timeoutMs: number,
    endpoint?: string,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {}
  ) {
    super(
      `Network request timed out after ${timeoutMs}ms`,
      'NETWORK_TIMEOUT',
      ErrorSeverity.MEDIUM,
      ErrorCategory.TIMEOUT,
      { ...context, rpcEndpoint: endpoint },
      {
        ...options,
        retryable: true,
        solution: 'The network request timed out. This may be due to slow network conditions or server issues.'
      }
    );

    this.timeoutMs = timeoutMs;
    this.endpoint = endpoint;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      timeoutMs: this.timeoutMs,
      endpoint: this.endpoint
    };
  }
}

/**
 * Network unavailable
 */
export class NetworkUnavailableError extends SDKError {
  public readonly networkType?: string;

  constructor(
    networkType?: string,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {}
  ) {
    super(
      networkType ? `Network ${networkType} is unavailable` : 'Network is unavailable',
      'NETWORK_UNAVAILABLE',
      ErrorSeverity.HIGH,
      ErrorCategory.NETWORK,
      { ...context, network: networkType },
      {
        ...options,
        retryable: true,
        solution: 'The network is currently unavailable. Please try again later or switch to a different network.'
      }
    );

    this.networkType = networkType;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      networkType: this.networkType
    };
  }
}

/**
 * Unsupported network
 */
export class UnsupportedNetworkError extends SDKError {
  public readonly networkType: string;
  public readonly supportedNetworks?: string[];

  constructor(
    networkType: string,
    supportedNetworks?: string[],
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {}
  ) {
    const message = supportedNetworks
      ? `Unsupported network: ${networkType}. Supported networks: ${supportedNetworks.join(', ')}`
      : `Unsupported network: ${networkType}`;

    super(
      message,
      'UNSUPPORTED_NETWORK',
      ErrorSeverity.HIGH,
      ErrorCategory.NETWORK,
      { ...context, network: networkType },
      {
        ...options,
        retryable: false,
        solution: supportedNetworks
          ? `Use one of the supported networks: ${supportedNetworks.join(', ')}`
          : 'Switch to a supported network type.'
      }
    );

    this.networkType = networkType;
    this.supportedNetworks = supportedNetworks;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      networkType: this.networkType,
      supportedNetworks: this.supportedNetworks
    };
  }
}

/**
 * Network congestion
 */
export class NetworkCongestionError extends SDKError {
  public readonly congestionLevel?: string;
  public readonly estimatedDelay?: number;

  constructor(
    congestionLevel?: string,
    estimatedDelay?: number,
    context: ErrorContext = {},
    options: {
      cause?: Error;
    } = {}
  ) {
    const message = congestionLevel
      ? `Network congestion detected: ${congestionLevel}`
      : 'Network congestion detected';

    super(
      message,
      'NETWORK_CONGESTION',
      ErrorSeverity.MEDIUM,
      ErrorCategory.NETWORK,
      context,
      {
        ...options,
        retryable: true,
        solution: estimatedDelay
          ? `Network is congested. Estimated delay: ${estimatedDelay}ms. The request will be retried.`
          : 'Network is congested. The request will be retried with backoff.'
      }
    );

    this.congestionLevel = congestionLevel;
    this.estimatedDelay = estimatedDelay;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      congestionLevel: this.congestionLevel,
      estimatedDelay: this.estimatedDelay
    };
  }
}
