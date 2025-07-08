import { SDKError } from './base.js';

/**
 * Retry configuration options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts?: number;
  /** Initial delay between retries in milliseconds */
  initialDelay?: number;
  /** Maximum delay between retries in milliseconds */
  maxDelay?: number;
  /** Backoff multiplier for exponential backoff */
  backoffMultiplier?: number;
  /** Add jitter to prevent thundering herd */
  jitter?: boolean;
  /** Custom retry condition function */
  retryCondition?: (error: Error) => boolean;
  /** Callback called before each retry */
  onRetry?: (error: Error, attempt: number) => void;
}

/**
 * Default retry options
 */
export const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
  retryCondition: (error) => error instanceof SDKError && error.isRetryable(),
  onRetry: () => {
    // Default no-op
  }
};

/**
 * Circuit breaker states
 */
export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half-open'
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerOptions {
  /** Number of failures before opening circuit */
  failureThreshold?: number;
  /** Time in milliseconds to wait before attempting to close circuit */
  resetTimeout?: number;
  /** Number of successful calls needed to close circuit from half-open state */
  successThreshold?: number;
  /** Time window in milliseconds for monitoring failures */
  monitoringWindow?: number;
}

/**
 * Default circuit breaker options
 */
export const DEFAULT_CIRCUIT_BREAKER_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,
  resetTimeout: 60000,
  successThreshold: 2,
  monitoringWindow: 60000
};

/**
 * Circuit breaker implementation
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private readonly options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = { ...DEFAULT_CIRCUIT_BREAKER_OPTIONS, ...options };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime < this.options.resetTimeout) {
        throw new Error('Circuit breaker is open');
      }
      this.state = CircuitBreakerState.HALF_OPEN;
      this.successCount = 0;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.state = CircuitBreakerState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
    }
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;

  // Ensure at least one attempt is made
  const attempts = Math.max(1, config.maxAttempts);

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      if (!config.retryCondition(lastError)) {
        throw lastError;
      }

      // If this is the last attempt, throw the error
      if (attempt === attempts) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = calculateDelay(attempt, config);

      // Call onRetry callback
      config.onRetry(lastError, attempt);

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Calculate retry delay with exponential backoff
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const exponentialDelay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt - 1);
  const delay = Math.min(exponentialDelay, options.maxDelay);

  if (options.jitter) {
    // Add jitter to prevent thundering herd
    const jitterRange = delay * 0.1; // 10% jitter
    const jitter = Math.random() * jitterRange * 2 - jitterRange;
    return Math.max(0, delay + jitter);
  }

  return delay;
}

/**
 * Sleep for the specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry with circuit breaker
 */
export async function retryWithCircuitBreaker<T>(
  fn: () => Promise<T>,
  circuitBreaker: CircuitBreaker,
  retryOptions: RetryOptions = {}
): Promise<T> {
  return circuitBreaker.execute(async () => {
    return retry(fn, retryOptions);
  });
}

/**
 * Batch retry - retry multiple operations with shared circuit breaker
 */
export async function batchRetry<T>(
  operations: (() => Promise<T>)[],
  options: {
    retryOptions?: RetryOptions;
    circuitBreakerOptions?: CircuitBreakerOptions;
    maxConcurrency?: number;
  } = {}
): Promise<T[]> {
  const { retryOptions = {}, circuitBreakerOptions = {}, maxConcurrency = 5 } = options;
  const circuitBreaker = new CircuitBreaker(circuitBreakerOptions);

  // Limit concurrency
  const results: T[] = [];
  const chunks = chunkArray(operations, maxConcurrency);

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(op => retryWithCircuitBreaker(op, circuitBreaker, retryOptions))
    );
    results.push(...chunkResults);
  }

  return results;
}

/**
 * Chunk array into smaller arrays
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Retry decorator for class methods
 */
export function Retryable(options: RetryOptions = {}) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]) {
      return retry(async () => {
        return originalMethod?.apply(this, args);
      }, options);
    } as T;

    return descriptor;
  };
}

/**
 * Circuit breaker decorator for class methods
 */
export function WithCircuitBreaker(options: CircuitBreakerOptions = {}) {
  const circuitBreaker = new CircuitBreaker(options);

  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]) {
      return circuitBreaker.execute(async () => {
        return originalMethod?.apply(this, args);
      });
    } as T;

    return descriptor;
  };
}

/**
 * Retry manager for coordinating multiple retry operations
 */
export class RetryManager {
  private readonly circuitBreakers = new Map<string, CircuitBreaker>();
  private readonly defaultRetryOptions: RetryOptions;
  private readonly defaultCircuitBreakerOptions: CircuitBreakerOptions;

  constructor(
    defaultRetryOptions: RetryOptions = {},
    defaultCircuitBreakerOptions: CircuitBreakerOptions = {}
  ) {
    this.defaultRetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...defaultRetryOptions };
    this.defaultCircuitBreakerOptions = { ...DEFAULT_CIRCUIT_BREAKER_OPTIONS, ...defaultCircuitBreakerOptions };
  }

  /**
   * Get or create circuit breaker for a specific key
   */
  getCircuitBreaker(key: string, options?: CircuitBreakerOptions): CircuitBreaker {
    if (!this.circuitBreakers.has(key)) {
      this.circuitBreakers.set(key, new CircuitBreaker({
        ...this.defaultCircuitBreakerOptions,
        ...options
      }));
    }
    return this.circuitBreakers.get(key)!;
  }

  /**
   * Execute operation with retry and circuit breaker
   */
  async execute<T>(
    key: string,
    fn: () => Promise<T>,
    options: {
      retryOptions?: RetryOptions;
      circuitBreakerOptions?: CircuitBreakerOptions;
    } = {}
  ): Promise<T> {
    const circuitBreaker = this.getCircuitBreaker(key, options.circuitBreakerOptions);
    const retryOptions = { ...this.defaultRetryOptions, ...options.retryOptions };

    return retryWithCircuitBreaker(fn, circuitBreaker, retryOptions);
  }

  /**
   * Reset circuit breaker for a specific key
   */
  resetCircuitBreaker(key: string): void {
    const circuitBreaker = this.circuitBreakers.get(key);
    if (circuitBreaker) {
      circuitBreaker.reset();
    }
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    Array.from(this.circuitBreakers.values()).forEach(circuitBreaker => {
      circuitBreaker.reset();
    });
  }

  /**
   * Get status of all circuit breakers
   */
  getStatus(): Record<string, CircuitBreakerState> {
    const status: Record<string, CircuitBreakerState> = {};
    Array.from(this.circuitBreakers.entries()).forEach(([key, circuitBreaker]) => {
      status[key] = circuitBreaker.getState();
    });
    return status;
  }
}
