import {
  SDKError,
  ErrorSeverity,
  ErrorCategory,
  GorbchainSDKError,
  ConfigurationError,
  type ErrorContext
} from '../src/errors/base.js';
import {
  RpcNetworkError,
  RpcTimeoutError,
  RpcServerError
} from '../src/errors/rpc.js';
import {
  DecoderError,
  DecoderNotFoundError
} from '../src/errors/decoder.js';
import {
  TransactionNotFoundError
} from '../src/errors/transaction.js';
import {
  InvalidAddressError
} from '../src/errors/validation.js';
import {
  retry,
  RetryManager,
  CircuitBreaker,
  CircuitBreakerState
} from '../src/errors/retry.js';

describe('Error Handling System', () => {
  describe('Base Error Classes', () => {
    it('should create SDKError with proper properties', () => {
      const error = new GorbchainSDKError(
        'Test error',
        { transactionSignature: 'test-signature' },
        { retryable: true, solution: 'Test solution' }
      );

      expect(error.name).toBe('GorbchainSDKError');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('GORBCHAIN_SDK_ERROR');
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.category).toBe(ErrorCategory.UNKNOWN);
      expect(error.retryable).toBe(true);
      expect(error.solution).toBe('Test solution');
      expect(error.context.transactionSignature).toBe('test-signature');
      expect(error.context.timestamp).toBeInstanceOf(Date);
    });

    it('should check error properties correctly', () => {
      const error = new ConfigurationError('Config error');
      
      expect(error.isRetryable()).toBe(false);
      expect(error.isCritical()).toBe(false);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
    });

    it('should convert error to JSON', () => {
      const error = new RpcNetworkError(
        'Network error',
        { rpcEndpoint: 'https://rpc.gorbchain.xyz' }
      );
      
      const json = error.toJSON();
      
      expect(json.name).toBe('RpcNetworkError');
      expect(json.message).toBe('Network error');
      expect(json.code).toBe('RPC_NETWORK_ERROR');
      expect(json.severity).toBe(ErrorSeverity.HIGH);
      expect(json.category).toBe(ErrorCategory.NETWORK);
      expect(json.retryable).toBe(true);
      expect(json.context).toEqual({
        rpcEndpoint: 'https://rpc.gorbchain.xyz',
        timestamp: expect.any(Date),
        sdkVersion: '0.1.0'
      });
    });

    it('should get detailed error message', () => {
      const error = new RpcTimeoutError(
        30000,
        { 
          rpcEndpoint: 'https://rpc.gorbchain.xyz',
          transactionSignature: 'test-tx'
        }
      );
      
      const detailed = error.getDetailedMessage();
      
      expect(detailed).toContain('RPC request timed out after 30000ms');
      expect(detailed).toContain('RPC Endpoint: https://rpc.gorbchain.xyz');
      expect(detailed).toContain('Transaction: test-tx');
      expect(detailed).toContain('Solution:');
    });
  });

  describe('Specific Error Types', () => {
    it('should create RPC errors with correct properties', () => {
      const serverError = new RpcServerError(
        'Server error',
        500,
        -32603,
        { rpcEndpoint: 'https://rpc.gorbchain.xyz' }
      );

      expect(serverError.httpStatus).toBe(500);
      expect(serverError.rpcErrorCode).toBe(-32603);
      expect(serverError.isRetryable()).toBe(true);
      expect(serverError.severity).toBe(ErrorSeverity.HIGH);
    });

    it('should create decoder errors with correct properties', () => {
      const decoderError = new DecoderNotFoundError(
        'test-program-id',
        { programId: 'test-program-id' }
      );

      expect(decoderError.programId).toBe('test-program-id');
      expect(decoderError.isRetryable()).toBe(false);
      expect(decoderError.severity).toBe(ErrorSeverity.LOW);
    });

    it('should create transaction errors with correct properties', () => {
      const txError = new TransactionNotFoundError(
        'test-signature',
        { transactionSignature: 'test-signature' }
      );

      expect(txError.signature).toBe('test-signature');
      expect(txError.isRetryable()).toBe(true);
      expect(txError.category).toBe(ErrorCategory.TRANSACTION);
    });

    it('should create validation errors with correct properties', () => {
      const validationError = new InvalidAddressError(
        'invalid-address',
        'base58',
        { account: 'invalid-address' }
      );

      expect(validationError.address).toBe('invalid-address');
      expect(validationError.expectedFormat).toBe('base58');
      expect(validationError.isRetryable()).toBe(false);
      expect(validationError.category).toBe(ErrorCategory.VALIDATION);
    });
  });

  describe('Retry Logic', () => {
    it('should retry retryable errors', async () => {
      let attempts = 0;
      const mockFn = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new RpcNetworkError('Network error');
        }
        return 'success';
      });

      const result = await retry(mockFn, {
        maxAttempts: 3,
        initialDelay: 10,
        jitter: false
      });

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should not retry non-retryable errors', async () => {
      const mockFn = jest.fn().mockImplementation(() => {
        throw new InvalidAddressError('invalid-address');
      });

      await expect(retry(mockFn, {
        maxAttempts: 3,
        initialDelay: 10
      })).rejects.toThrow(InvalidAddressError);

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should respect max attempts', async () => {
      const mockFn = jest.fn().mockImplementation(() => {
        throw new RpcNetworkError('Network error');
      });

      await expect(retry(mockFn, {
        maxAttempts: 2,
        initialDelay: 10
      })).rejects.toThrow(RpcNetworkError);

      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Circuit Breaker', () => {
    it('should start in closed state', () => {
      const circuitBreaker = new CircuitBreaker();
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('should open after failure threshold', async () => {
      const circuitBreaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 1000
      });

      const failingFn = jest.fn().mockRejectedValue(new Error('Test error'));

      // First failure
      await expect(circuitBreaker.execute(failingFn)).rejects.toThrow();
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);

      // Second failure - should open circuit
      await expect(circuitBreaker.execute(failingFn)).rejects.toThrow();
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);

      // Third call should fail immediately
      await expect(circuitBreaker.execute(failingFn)).rejects.toThrow('Circuit breaker is open');
    });

    it('should reset to closed state', () => {
      const circuitBreaker = new CircuitBreaker();
      circuitBreaker.reset();
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });
  });

  describe('RetryManager', () => {
    it('should manage multiple circuit breakers', () => {
      const retryManager = new RetryManager();
      
      const cb1 = retryManager.getCircuitBreaker('key1');
      const cb2 = retryManager.getCircuitBreaker('key2');
      const cb1Again = retryManager.getCircuitBreaker('key1');
      
      expect(cb1).toBe(cb1Again);
      expect(cb1).not.toBe(cb2);
    });

    it('should get status of all circuit breakers', () => {
      const retryManager = new RetryManager();
      
      retryManager.getCircuitBreaker('key1');
      retryManager.getCircuitBreaker('key2');
      
      const status = retryManager.getStatus();
      
      expect(status).toEqual({
        key1: CircuitBreakerState.CLOSED,
        key2: CircuitBreakerState.CLOSED
      });
    });

    it('should execute operations with retry and circuit breaker', async () => {
      const retryManager = new RetryManager();
      
      const mockFn = jest.fn().mockResolvedValue('success');
      
      const result = await retryManager.execute('test-key', mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });
}); 