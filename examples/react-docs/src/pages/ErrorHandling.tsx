
import { 
  ExclamationTriangleIcon, 
  ShieldCheckIcon, 
  ClockIcon, 
  WifiIcon,
  XCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

export default function ErrorHandling() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-docs-heading mb-4">Error Handling</h1>
      <p className="text-lg text-gray-600 mb-6">
        Comprehensive error handling strategies and error types in the Gorbchain SDK for building robust applications.
      </p>
      
      {/* Overview */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">
          <ShieldCheckIcon className="w-6 h-6 inline mr-2" />
          Error Handling Philosophy
        </h2>
        <p className="text-gray-600 mb-4">
          The Gorbchain SDK implements a comprehensive error taxonomy with 7 distinct error categories, 
          each designed to provide specific context and enable appropriate recovery strategies:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <CheckCircleIcon className="w-8 h-8 text-green-600 mb-2" />
            <h4 className="font-semibold text-green-800">Recoverable Errors</h4>
            <p className="text-sm text-green-700">Automatic retry with exponential backoff</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <ClockIcon className="w-8 h-8 text-yellow-600 mb-2" />
            <h4 className="font-semibold text-yellow-800">Transient Errors</h4>
            <p className="text-sm text-yellow-700">Circuit breaker protection</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <XCircleIcon className="w-8 h-8 text-red-600 mb-2" />
            <h4 className="font-semibold text-red-800">Fatal Errors</h4>
            <p className="text-sm text-red-700">Immediate failure with context</p>
          </div>
        </div>
      </div>

      {/* Error Categories */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-6">7 Error Categories</h2>
        <div className="space-y-6">
          
          {/* Network Errors */}
          <div className="border-l-4 border-red-500 pl-4">
            <h3 className="font-semibold text-docs-heading mb-2">
              <WifiIcon className="w-5 h-5 inline mr-2" />
              1. Network Errors
            </h3>
            <p className="text-gray-600 mb-3">
              Connection failures, timeouts, and network unavailability issues.
            </p>
            <div className="bg-gray-50 rounded p-4">
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">ConnectionError:</span> Failed to establish connection</div>
                <div><span className="font-medium">TimeoutError:</span> Request exceeded timeout limit</div>
                <div><span className="font-medium">NetworkUnavailableError:</span> Network interface down</div>
              </div>
            </div>
            <div className="mt-3 p-3 bg-blue-50 rounded">
              <span className="text-sm font-medium text-blue-800">Recovery Strategy:</span>
              <span className="text-sm text-blue-700 ml-2">Automatic retry with exponential backoff</span>
            </div>
          </div>

          {/* RPC Errors */}
          <div className="border-l-4 border-orange-500 pl-4">
            <h3 className="font-semibold text-docs-heading mb-2">
              <ExclamationTriangleIcon className="w-5 h-5 inline mr-2" />
              2. RPC Errors
            </h3>
            <p className="text-gray-600 mb-3">
              Server-side RPC failures, invalid methods, and rate limiting.
            </p>
            <div className="bg-gray-50 rounded p-4">
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">RpcMethodNotFoundError:</span> Invalid RPC method</div>
                <div><span className="font-medium">RpcInvalidParamsError:</span> Invalid parameters</div>
                <div><span className="font-medium">RateLimitError:</span> Too many requests</div>
                <div><span className="font-medium">RpcServerError:</span> Internal server error</div>
              </div>
            </div>
            <div className="mt-3 p-3 bg-blue-50 rounded">
              <span className="text-sm font-medium text-blue-800">Recovery Strategy:</span>
              <span className="text-sm text-blue-700 ml-2">Context-specific retry or immediate failure</span>
            </div>
          </div>

          {/* Decoder Errors */}
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-semibold text-docs-heading mb-2">
              <InformationCircleIcon className="w-5 h-5 inline mr-2" />
              3. Decoder Errors
            </h3>
            <p className="text-gray-600 mb-3">
              Instruction decoding failures, missing decoders, and data format issues.
            </p>
            <div className="bg-gray-50 rounded p-4">
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">DecoderNotFoundError:</span> No decoder for program</div>
                <div><span className="font-medium">InvalidInstructionDataError:</span> Malformed instruction data</div>
                <div><span className="font-medium">DecodingFailedError:</span> Decoding process failed</div>
              </div>
            </div>
            <div className="mt-3 p-3 bg-blue-50 rounded">
              <span className="text-sm font-medium text-blue-800">Recovery Strategy:</span>
              <span className="text-sm text-blue-700 ml-2">Fallback to raw data or custom decoder</span>
            </div>
          </div>

          {/* Transaction Errors */}
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold text-docs-heading mb-2">
              <CheckCircleIcon className="w-5 h-5 inline mr-2" />
              4. Transaction Errors
            </h3>
            <p className="text-gray-600 mb-3">
              Transaction-specific failures, not found errors, and processing issues.
            </p>
            <div className="bg-gray-50 rounded p-4">
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">TransactionNotFoundError:</span> Transaction signature not found</div>
                <div><span className="font-medium">TransactionFailedError:</span> Transaction execution failed</div>
                <div><span className="font-medium">InvalidSignatureError:</span> Invalid transaction signature</div>
              </div>
            </div>
            <div className="mt-3 p-3 bg-blue-50 rounded">
              <span className="text-sm font-medium text-blue-800">Recovery Strategy:</span>
              <span className="text-sm text-blue-700 ml-2">Application-specific handling, no automatic retry</span>
            </div>
          </div>

          {/* Validation Errors */}
          <div className="border-l-4 border-yellow-500 pl-4">
            <h3 className="font-semibold text-docs-heading mb-2">
              <ExclamationTriangleIcon className="w-5 h-5 inline mr-2" />
              5. Validation Errors
            </h3>
            <p className="text-gray-600 mb-3">
              Input validation failures and parameter errors.
            </p>
            <div className="bg-gray-50 rounded p-4">
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">InvalidAddressError:</span> Invalid public key format</div>
                <div><span className="font-medium">InvalidParameterError:</span> Parameter validation failed</div>
                <div><span className="font-medium">ConfigurationError:</span> Invalid SDK configuration</div>
              </div>
            </div>
            <div className="mt-3 p-3 bg-blue-50 rounded">
              <span className="text-sm font-medium text-blue-800">Recovery Strategy:</span>
              <span className="text-sm text-blue-700 ml-2">Immediate failure, fix input and retry</span>
            </div>
          </div>

          {/* Authentication Errors */}
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="font-semibold text-docs-heading mb-2">
              <ShieldCheckIcon className="w-5 h-5 inline mr-2" />
              6. Authentication Errors
            </h3>
            <p className="text-gray-600 mb-3">
              Authentication and authorization failures.
            </p>
            <div className="bg-gray-50 rounded p-4">
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">UnauthorizedError:</span> Missing or invalid credentials</div>
                <div><span className="font-medium">ForbiddenError:</span> Insufficient permissions</div>
                <div><span className="font-medium">ApiKeyError:</span> Invalid or expired API key</div>
              </div>
            </div>
            <div className="mt-3 p-3 bg-blue-50 rounded">
              <span className="text-sm font-medium text-blue-800">Recovery Strategy:</span>
              <span className="text-sm text-blue-700 ml-2">Refresh credentials or contact administrator</span>
            </div>
          </div>

          {/* General SDK Errors */}
          <div className="border-l-4 border-gray-500 pl-4">
            <h3 className="font-semibold text-docs-heading mb-2">
              <InformationCircleIcon className="w-5 h-5 inline mr-2" />
              7. General SDK Errors
            </h3>
            <p className="text-gray-600 mb-3">
              SDK-specific errors, initialization failures, and unexpected conditions.
            </p>
            <div className="bg-gray-50 rounded p-4">
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">SDKNotInitializedError:</span> SDK not properly initialized</div>
                <div><span className="font-medium">InternalError:</span> Unexpected internal error</div>
                <div><span className="font-medium">VersionMismatchError:</span> API version compatibility issue</div>
              </div>
            </div>
            <div className="mt-3 p-3 bg-blue-50 rounded">
              <span className="text-sm font-medium text-blue-800">Recovery Strategy:</span>
              <span className="text-sm text-blue-700 ml-2">Check SDK configuration and version compatibility</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Handling Best Practices */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">Best Practices</h2>
        <div className="space-y-6">
          
          <div>
            <h3 className="text-lg font-semibold text-docs-heading mb-3">1. Structured Error Handling</h3>
            <div className="code-block">
              <pre><code>{`import { 
  NetworkConnectionError, 
  RpcNetworkError, 
  DecoderError, 
  TransactionNotFoundError 
} from '@gorbchain-xyz/chaindecode'

try {
  const result = await sdk.getAndDecodeTransaction(signature)
  return result
} catch (error) {
  if (error instanceof NetworkConnectionError) {
    // Network issues - retry with backoff
    console.log('Network error:', error.message)
    return await retryWithBackoff(() => 
      sdk.getAndDecodeTransaction(signature)
    )
  } else if (error instanceof RpcNetworkError) {
    // RPC-specific handling
    console.log('RPC network error:', error.message)
    // Retry with exponential backoff
  } else if (error instanceof DecoderError) {
    // Fallback to raw transaction data
    console.log('Decoder failed, using raw data')
    return await sdk.getTransaction(signature)
  } else if (error instanceof TransactionNotFoundError) {
    // Transaction-specific logic
    console.log('Transaction not found:', error.message)
    throw error // Don't retry transaction errors
  }
}`}</code></pre>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-docs-heading mb-3">2. Retry Configuration</h3>
            <div className="code-block">
              <pre><code>{`// Configure retry behavior
const sdk = new GorbchainSDK({
  rpcEndpoint: 'https://rpc.gorbchain.xyz',
  retryConfig: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true
  },
  circuitBreaker: {
    threshold: 5,
    timeout: 60000,
    resetTimeout: 30000
  }
})`}</code></pre>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-docs-heading mb-3">3. Graceful Degradation</h3>
            <div className="code-block">
              <pre><code>{`async function getTransactionWithFallback(signature: string) {
  try {
    // Try full decoding first
    return await sdk.getAndDecodeTransaction(signature, {
      richDecoding: true
    })
  } catch (error) {
    if (error instanceof DecoderError) {
      // Fallback to basic decoding
      console.warn('Rich decoding failed, using basic decoding')
      return await sdk.getAndDecodeTransaction(signature, {
        richDecoding: false
      })
    }
    
    if (error instanceof NetworkError) {
      // Fallback to cached data if available
      const cached = await cache.get(signature)
      if (cached) {
        console.warn('Using cached transaction data')
        return cached
      }
    }
    
    throw error
  }
}`}</code></pre>
            </div>
          </div>
        </div>
      </div>

      {/* Error Context and Debugging */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">Error Context & Debugging</h2>
        <div className="space-y-4">
          <p className="text-gray-600">
            All SDK errors include rich context information to help with debugging:
          </p>
          
          <div className="code-block">
            <pre><code>{`// Error objects include comprehensive context
try {
  await sdk.getAccountInfo(invalidAddress)
} catch (error) {
  console.log('Error details:', {
    type: error.constructor.name,
    message: error.message,
    code: error.code,
    context: error.context,
    timestamp: error.timestamp,
    requestId: error.requestId,
    stack: error.stack
  })
  
  // Example output:
  // {
  //   type: 'ValidationError',
  //   message: 'Invalid public key format',
  //   code: 'INVALID_ADDRESS',
  //   context: {
  //     address: 'invalid-address',
  //     expectedFormat: 'Base58 encoded string',
  //     actualLength: 15,
  //     expectedLength: 44
  //   },
  //   timestamp: '2024-01-15T10:30:00.000Z',
  //   requestId: 'req_123456789'
  // }
}`}</code></pre>
          </div>
        </div>
      </div>

      {/* Monitoring and Observability */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-4">
          📊 Monitoring & Observability
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-purple-800 mb-2">Error Metrics</h4>
            <ul className="text-purple-700 space-y-1">
              <li>• Error rate by category</li>
              <li>• Retry success/failure rates</li>
              <li>• Circuit breaker state changes</li>
              <li>• Response time percentiles</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-purple-800 mb-2">Logging Integration</h4>
            <ul className="text-purple-700 space-y-1">
              <li>• Structured error logging</li>
              <li>• Request correlation IDs</li>
              <li>• Performance tracing</li>
              <li>• Custom event handlers</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-white rounded border border-purple-200">
          <code className="text-sm">
            sdk.on('error', (error) = logger.error(error))
          </code>
        </div>
      </div>
    </div>
  )
} 