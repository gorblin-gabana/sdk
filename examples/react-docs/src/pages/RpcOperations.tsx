import { useState } from "react";
import CodeBlock from "../components/CodeBlock";
import {
  WifiIcon,
  ShieldCheckIcon,
  ClockIcon,
  CubeIcon,
  DocumentTextIcon,
  ServerIcon,
} from "@heroicons/react/24/outline";

export default function RpcOperations() {
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopied((prev) => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const initCode = `import { RpcClient } from '@gorbchain-xyz/chaindecode'

// Basic initialization
const client = new RpcClient('https://rpc.gorbchain.xyz')

// With advanced configuration
const client = new RpcClient('https://rpc.gorbchain.xyz', {
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  circuitBreakerThreshold: 5
})`;

  const rpcCallsCode = `// Get account info
const accountInfo = await client.getAccountInfo(publicKey)

// Get transaction
const transaction = await client.getTransaction(signature, {
  encoding: 'jsonParsed',
  maxSupportedTransactionVersion: 0
})

// Get multiple accounts
const accounts = await client.getMultipleAccounts([pubkey1, pubkey2])`;

  const advancedConfigCode = `const client = new RpcClient('https://rpc.gorbchain.xyz', {
  // Connection configuration
  timeout: 30000,
  
  // Retry configuration
  retryAttempts: 3,
  retryDelay: 1000,
  retryBackoffMultiplier: 2,
  jitter: true,
  
  // Circuit breaker configuration
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 60000,
  circuitBreakerResetTimeout: 30000
})`;

  const endpointSwitchingCode = `// Manual endpoint switching for failover
const client = new RpcClient('https://rpc.gorbchain.xyz', {
  timeout: 30000,
  retryAttempts: 3
});

// Switch to backup endpoint on failure
try {
  const result = await client.getAccountInfo(publicKey);
} catch (error) {
  if (error instanceof NetworkError) {
    console.log('Primary endpoint failed, switching to backup');
    client.setRpcUrl('https://backup-rpc.gorbchain.xyz');
    
    // Retry with backup endpoint
    const result = await client.getAccountInfo(publicKey);
  }
}`;

  const errorHandlingCode = `try {
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
}`;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-docs-heading mb-4">
        RPC Operations
      </h1>
      <p className="text-lg text-gray-600 mb-6">
        Comprehensive guide to RPC operations and network interactions with the
        Gorbchain blockchain.
      </p>

      {/* Overview */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">
          Overview
        </h2>
        <p className="text-gray-600 mb-4">
          The Gorbchain SDK provides a robust RPC client with advanced features
          for production applications:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <ShieldCheckIcon className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Automatic Retry Logic</h4>
              <p className="text-xs text-gray-600">
                Exponential backoff with jitter
              </p>
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
              <h4 className="font-semibold text-sm">Connection Timeout</h4>
              <p className="text-xs text-gray-600">
                Configurable request timeouts
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <ServerIcon className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Manual Failover</h4>
              <p className="text-xs text-gray-600">Switch endpoints programmatically</p>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Usage */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">
          Basic Usage
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-docs-heading mb-3">
              Initialize RPC Client
            </h3>
            <CodeBlock
              code={initCode}
              id="init-rpc"
              title="Initialize RPC Client"
              language="typescript"
              onCopy={() => copyToClipboard(initCode, "init-rpc")}
              copied={copied["init-rpc"] || false}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-docs-heading mb-3">
              Making RPC Calls
            </h3>
            <CodeBlock
              code={rpcCallsCode}
              id="rpc-calls"
              title="Making RPC Calls"
              language="typescript"
              onCopy={() => copyToClipboard(rpcCallsCode, "rpc-calls")}
              copied={copied["rpc-calls"] || false}
            />
          </div>
        </div>
      </div>

      {/* Core RPC Methods */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">
          Core RPC Methods
        </h2>
        <div className="space-y-6">
          {/* Account Methods */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-docs-heading mb-2">
              <CubeIcon className="w-5 h-5 inline mr-2" />
              Account Methods
            </h3>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded p-3">
                <code className="text-sm font-medium">
                  getAccountInfo(publicKey, options?)
                </code>
                <p className="text-xs text-gray-600 mt-1">
                  Get account information for a given public key
                </p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <code className="text-sm font-medium">
                  getMultipleAccounts(publicKeys, options?)
                </code>
                <p className="text-xs text-gray-600 mt-1">
                  Get account information for multiple public keys
                </p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <code className="text-sm font-medium">
                  getTokenAccountsByOwner(owner, filter, options?)
                </code>
                <p className="text-xs text-gray-600 mt-1">
                  Get token accounts owned by a specific account
                </p>
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
                <code className="text-sm font-medium">
                  getTransaction(signature, options?)
                </code>
                <p className="text-xs text-gray-600 mt-1">
                  Get transaction details by signature
                </p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <code className="text-sm font-medium">
                  getSignaturesForAddress(address, options?)
                </code>
                <p className="text-xs text-gray-600 mt-1">
                  Get confirmed signatures for transactions involving an address
                </p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <code className="text-sm font-medium">
                  sendTransaction(transaction, options?)
                </code>
                <p className="text-xs text-gray-600 mt-1">
                  Submit a transaction to the network
                </p>
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
                <p className="text-xs text-gray-600 mt-1">
                  Get the current slot the node is processing
                </p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <code className="text-sm font-medium">getBlockHeight()</code>
                <p className="text-xs text-gray-600 mt-1">
                  Get the current block height
                </p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <code className="text-sm font-medium">getHealth()</code>
                <p className="text-xs text-gray-600 mt-1">
                  Get the current health of the node
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Configuration */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">
          Advanced Configuration
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-docs-heading mb-3">
              Advanced Configuration
            </h3>
            <CodeBlock
              code={advancedConfigCode}
              id="advanced-config"
              title="Advanced RPC Configuration"
              language="typescript"
              onCopy={() => copyToClipboard(advancedConfigCode, "advanced-config")}
              copied={copied["advanced-config"] || false}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-docs-heading mb-3">
              Endpoint Switching
            </h3>
            <p className="text-gray-600 mb-4">
              Manual endpoint switching for failover scenarios:
            </p>
            <CodeBlock
              code={endpointSwitchingCode}
              id="endpoint-switching"
              title="Manual Endpoint Switching"
              language="typescript"
              onCopy={() => copyToClipboard(endpointSwitchingCode, "endpoint-switching")}
              copied={copied["endpoint-switching"] || false}
            />
          </div>
        </div>
      </div>

      {/* Error Handling */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">
          Error Handling
        </h2>
        <div className="space-y-4">
          <p className="text-gray-600">
            The RPC client provides comprehensive error handling with different
            error types:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <h4 className="font-semibold text-red-800 mb-2">
                Network Errors
              </h4>
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
            <h3 className="text-lg font-semibold text-docs-heading mb-3">
              Error Handling Example
            </h3>
            <CodeBlock
              code={errorHandlingCode}
              id="error-handling"
              title="Error Handling Example"
              language="typescript"
              onCopy={() => copyToClipboard(errorHandlingCode, "error-handling")}
              copied={copied["error-handling"] || false}
            />
          </div>
        </div>
      </div>

      {/* Future Enhancements */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-4">
          🚀 Planned Enhancements
        </h3>
        <p className="text-purple-800 mb-4">
          The following features are planned for future versions of the SDK:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-purple-800 mb-2">
              Automatic Load Balancing
            </h4>
            <ul className="text-purple-700 space-y-1">
              <li>• Multiple RPC endpoints as array</li>
              <li>• Round-robin and weighted strategies</li>
              <li>• Automatic failover on endpoint failure</li>
              <li>• Health monitoring and recovery</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-purple-800 mb-2">
              Advanced Features
            </h4>
            <ul className="text-purple-700 space-y-1">
              <li>• Connection pooling and reuse</li>
              <li>• Request caching and deduplication</li>
              <li>• Geographic endpoint selection</li>
              <li>• Real-time performance metrics</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-white/70 rounded border border-purple-300">
          <p className="text-sm text-purple-800">
            <strong>Note:</strong> For now, implement failover manually using the <code>setRpcUrl()</code> method 
            as shown in the endpoint switching example above.
          </p>
        </div>
      </div>

      {/* Performance Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          ⚡ Performance Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">
              Batch Operations
            </h4>
            <p className="text-blue-700">
              Use <code>getMultipleAccounts()</code> instead of multiple single
              account calls to reduce RPC overhead.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">
              Client Reuse
            </h4>
            <p className="text-blue-700">
              Reuse the same client instance across your application for
              consistent configuration and error handling.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">
              Appropriate Timeouts
            </h4>
            <p className="text-blue-700">
              Set reasonable timeouts based on your application's requirements
              and network conditions.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Monitor Health</h4>
            <p className="text-blue-700">
              Use <code>getHealth()</code> to monitor RPC endpoint status and
              implement failover logic.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
