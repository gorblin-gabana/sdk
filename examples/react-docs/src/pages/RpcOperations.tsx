
import { WifiIcon, ShieldCheckIcon, ClockIcon, CubeIcon, DocumentTextIcon, ServerIcon } from '@heroicons/react/24/outline'

export default function RpcOperations() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-docs-heading mb-4">RPC Operations</h1>
      <p className="text-lg text-gray-600 mb-6">
        Comprehensive guide to RPC operations and network interactions with the Gorbchain blockchain.
      </p>
      
      {/* Overview */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">Overview</h2>
        <p className="text-gray-600 mb-4">
          The Gorbchain SDK provides a robust RPC client with advanced features for production applications:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <ShieldCheckIcon className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Automatic Retry Logic</h4>
              <p className="text-xs text-gray-600">Exponential backoff with jitter</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <ClockIcon className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Circuit Breaker Pattern</h4>
              <p className="text-xs text-gray-600">Prevents cascade failures</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <WifiIcon className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Connection Pooling</h4>
              <p className="text-xs text-gray-600">Efficient resource management</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <ServerIcon className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Load Balancing</h4>
              <p className="text-xs text-gray-600">Multiple endpoint support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Usage */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">Basic Usage</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-docs-heading mb-3">Initialize RPC Client</h3>
            <div className="code-block">
              <pre><code>{`import { RpcClient } from '@gorbchain-xyz/chaindecode'

// Basic initialization
const client = new RpcClient('https://rpc.gorbchain.xyz')

// With advanced configuration
const client = new RpcClient('https://rpc.gorbchain.xyz', {
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  circuitBreakerThreshold: 5
})`}</code></pre>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-docs-heading mb-3">Making RPC Calls</h3>
            <div className="code-block">
              <pre><code>{`// Get account info
const accountInfo = await client.getAccountInfo(publicKey)

// Get transaction
const transaction = await client.getTransaction(signature, {
  encoding: 'jsonParsed',
  maxSupportedTransactionVersion: 0
})

// Get multiple accounts
const accounts = await client.getMultipleAccounts([pubkey1, pubkey2])`}</code></pre>
            </div>
          </div>
        </div>
      </div>

      {/* Core RPC Methods */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">Core RPC Methods</h2>
        <div className="space-y-6">
          
          {/* Account Methods */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-docs-heading mb-2">
              <CubeIcon className="w-5 h-5 inline mr-2" />
              Account Methods
            </h3>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded p-3">
                <code className="text-sm font-medium">getAccountInfo(publicKey, options?)</code>
                <p className="text-xs text-gray-600 mt-1">Get account information for a given public key</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <code className="text-sm font-medium">getMultipleAccounts(publicKeys, options?)</code>
                <p className="text-xs text-gray-600 mt-1">Get account information for multiple public keys</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <code className="text-sm font-medium">getTokenAccountsByOwner(owner, filter, options?)</code>
                <p className="text-xs text-gray-600 mt-1">Get token accounts owned by a specific account</p>
              </div>
            </div>
          </div>

          {/* Transaction Methods */}
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold text-docs-heading mb-2">
              <DocumentTextIcon className="w-5 h-5 inline mr-2" />
              Transaction Methods
            </h3>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded p-3">
                <code className="text-sm font-medium">getTransaction(signature, options?)</code>
                <p className="text-xs text-gray-600 mt-1">Get transaction details by signature</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <code className="text-sm font-medium">getSignaturesForAddress(address, options?)</code>
                <p className="text-xs text-gray-600 mt-1">Get confirmed signatures for transactions involving an address</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <code className="text-sm font-medium">sendTransaction(transaction, options?)</code>
                <p className="text-xs text-gray-600 mt-1">Submit a transaction to the network</p>
              </div>
            </div>
          </div>

          {/* Network Methods */}
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-semibold text-docs-heading mb-2">
              <WifiIcon className="w-5 h-5 inline mr-2" />
              Network Methods
            </h3>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded p-3">
                <code className="text-sm font-medium">getSlot(options?)</code>
                <p className="text-xs text-gray-600 mt-1">Get the current slot the node is processing</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <code className="text-sm font-medium">getBlockHeight()</code>
                <p className="text-xs text-gray-600 mt-1">Get the current block height</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <code className="text-sm font-medium">getHealth()</code>
                <p className="text-xs text-gray-600 mt-1">Get the current health of the node</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Configuration */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">Advanced Configuration</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-docs-heading mb-3">Connection Pool Settings</h3>
            <div className="code-block">
              <pre><code>{`const client = new RpcClient('https://rpc.gorbchain.xyz', {
  // Connection pool configuration
  maxConnections: 10,
  connectionTimeout: 5000,
  idleTimeout: 30000,
  
  // Retry configuration
  retryAttempts: 3,
  retryDelay: 1000,
  retryBackoffMultiplier: 2,
  
  // Circuit breaker configuration
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 60000,
  circuitBreakerResetTimeout: 30000
})`}</code></pre>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-docs-heading mb-3">Multiple Endpoints</h3>
            <div className="code-block">
              <pre><code>{`// Load balancing across multiple RPC endpoints
const client = new RpcClient([
  'https://rpc.gorbchain.xyz',
  'https://rpc2.gorbchain.xyz',
  'https://rpc3.gorbchain.xyz'
], {
  loadBalancingStrategy: 'round-robin', // or 'random'
  healthCheckInterval: 30000
})`}</code></pre>
            </div>
          </div>
        </div>
      </div>

      {/* Error Handling */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">Error Handling</h2>
        <div className="space-y-4">
          <p className="text-gray-600">
            The RPC client provides comprehensive error handling with different error types:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <h4 className="font-semibold text-red-800 mb-2">Network Errors</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Connection timeouts</li>
                <li>• DNS resolution failures</li>
                <li>• Network unavailability</li>
              </ul>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded p-4">
              <h4 className="font-semibold text-orange-800 mb-2">RPC Errors</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Invalid method calls</li>
                <li>• Parameter validation</li>
                <li>• Rate limit exceeded</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-docs-heading mb-3">Error Handling Example</h3>
            <div className="code-block">
              <pre><code>{`try {
  const accountInfo = await client.getAccountInfo(publicKey)
  console.log('Account info:', accountInfo)
} catch (error) {
  if (error instanceof NetworkError) {
    console.log('Network issue:', error.message)
    // Implement fallback logic
  } else if (error instanceof RpcError) {
    console.log('RPC error:', error.code, error.message)
    // Handle specific RPC errors
  } else {
    console.log('Unexpected error:', error)
  }
}`}</code></pre>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          ⚡ Performance Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Batch Operations</h4>
            <p className="text-blue-700">
              Use <code>getMultipleAccounts()</code> instead of multiple single account calls to reduce RPC overhead.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Connection Reuse</h4>
            <p className="text-blue-700">
              Reuse the same client instance across your application to benefit from connection pooling.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Appropriate Timeouts</h4>
            <p className="text-blue-700">
              Set reasonable timeouts based on your application's requirements and network conditions.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Monitor Health</h4>
            <p className="text-blue-700">
              Use <code>getHealth()</code> to monitor RPC endpoint status and implement failover logic.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 