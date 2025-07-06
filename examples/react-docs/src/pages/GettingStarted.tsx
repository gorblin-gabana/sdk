import { useState } from 'react'
import CodeBlock from '../components/CodeBlock'
import { 
  CheckCircleIcon,
  CubeIcon,
  WifiIcon,
  ShieldCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

export default function GettingStarted() {
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({})

  const copyToClipboard = (code: string, id?: string) => {
    navigator.clipboard.writeText(code)
    if (id) {
      setCopied(prev => ({ ...prev, [id]: true }))
      setTimeout(() => {
        setCopied(prev => ({ ...prev, [id]: false }))
      }, 2000)
    }
  }

  const installCode = `npm install @gorbchain-xyz/chaindecode`

  const basicUsageCode = `import { GorbchainSDK } from '@gorbchain-xyz/chaindecode'

// Initialize SDK with your configuration
const sdk = new GorbchainSDK({
  rpcEndpoint: 'https://rpc.gorbchain.xyz',
  network: 'custom',
  timeout: 30000,
  retries: 3,
  programIds: {
    token2022: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
    ata: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
    metaplex: 'MetaXBxVGQ65bF5QVWsRxYLVYxE8PFJrMLAojEbhUwz'
  }
})

// Check network health
const health = await sdk.getNetworkHealth()
console.log('Network:', health.status) // 'healthy' | 'degraded' | 'down'`

  const quickExampleCode = `// Assume SDK is already initialized as above...

// Example 1: Decode a transaction
const transaction = await sdk.getAndDecodeTransaction(
  'your-signature-here',
  { richDecoding: true }
)

// Example 2: Create a token
const tokenResult = await sdk.createToken22TwoTx({
  name: 'My Token',
  symbol: 'MTK',
  decimals: 6,
  supply: 1000000
})

// Example 3: Get RPC client for advanced operations
const rpcClient = sdk.getRpcClient()
const slot = await rpcClient.getSlot()`

  const errorHandlingCode = `// Import specific error types
import { 
  RpcNetworkError,
  TransactionNotFoundError,
  DecoderNotFoundError
} from '@gorbchain-xyz/chaindecode'

try {
  const transaction = await sdk.getAndDecodeTransaction(signature)
  // Handle successful response
} catch (error) {
  if (error instanceof TransactionNotFoundError) {
    console.log('Transaction not found - may not be finalized')
  } else if (error instanceof RpcNetworkError) {
    console.log('Network issue - automatic retry will occur')
  } else if (error instanceof DecoderNotFoundError) {
    console.log('No decoder found - raw data available')
  }
}`

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <div>
        <h1 className="text-3xl font-bold text-docs-heading mb-4">Getting Started</h1>
        <p className="text-lg text-gray-600 mb-6">
          Get up and running with the Gorbchain SDK in minutes. This guide covers installation, 
          basic setup, and your first API calls.
        </p>
      </div>

      {/* Quick Setup Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="docs-card text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-blue-600">1</span>
          </div>
          <h3 className="text-lg font-semibold text-docs-heading mb-2">Install</h3>
          <p className="text-sm text-gray-600">Install the SDK via npm</p>
        </div>
        <div className="docs-card text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-green-600">2</span>
          </div>
          <h3 className="text-lg font-semibold text-docs-heading mb-2">Initialize</h3>
          <p className="text-sm text-gray-600">Configure your SDK instance</p>
        </div>
        <div className="docs-card text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-purple-600">3</span>
          </div>
          <h3 className="text-lg font-semibold text-docs-heading mb-2">Use</h3>
          <p className="text-sm text-gray-600">Start making API calls</p>
        </div>
      </div>

      {/* Prerequisites */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">Prerequisites</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-gray-700">Node.js 16+ and npm/yarn</span>
            </div>
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-gray-700">TypeScript knowledge (recommended)</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-gray-700">Gorbchain RPC endpoint access</span>
            </div>
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-gray-700">Basic blockchain understanding</span>
            </div>
          </div>
        </div>
      </div>

      {/* Installation */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">
          <span className="inline-flex items-center">
            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-sm font-bold text-blue-600">1</span>
            </span>
            Installation
          </span>
        </h2>
        <p className="text-gray-600 mb-4">
          Install the SDK using your preferred package manager:
        </p>
        <CodeBlock 
          code={installCode} 
          id="install" 
          title="Terminal" 
          language="bash"
          onCopy={copyToClipboard}
          copied={copied["install"]}
        />
      </div>

      {/* SDK Initialization */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">
          <span className="inline-flex items-center">
            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-sm font-bold text-green-600">2</span>
            </span>
            SDK Initialization
          </span>
        </h2>
        <p className="text-gray-600 mb-4">
          Configure the SDK with your Gorbchain network settings:
        </p>
        <CodeBlock 
          code={basicUsageCode} 
          id="init" 
          title="Initialize SDK" 
          language="typescript"
          onCopy={copyToClipboard}
          copied={copied["init"]}
        />
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              <CubeIcon className="w-5 h-5 inline mr-2" />
              Core Configuration
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li><strong>rpcEndpoint:</strong> Your Gorbchain RPC URL</li>
              <li><strong>network:</strong> 'mainnet' | 'testnet' | 'custom'</li>
              <li><strong>timeout:</strong> Request timeout (default: 30s)</li>
            </ul>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">
              <WifiIcon className="w-5 h-5 inline mr-2" />
              Optional Settings
            </h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li><strong>retries:</strong> Auto-retry attempts (default: 3)</li>
              <li><strong>programIds:</strong> Custom program addresses</li>
              <li><strong>fallbackEndpoints:</strong> Backup RPC URLs</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Examples */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">
          <span className="inline-flex items-center">
            <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-sm font-bold text-purple-600">3</span>
            </span>
            Quick Examples
          </span>
        </h2>
        <p className="text-gray-600 mb-4">
          Try these common operations (SDK assumed to be initialized):
        </p>
        <CodeBlock 
          code={quickExampleCode} 
          id="examples" 
          title="Common Operations" 
          language="typescript"
          onCopy={copyToClipboard}
          copied={copied["examples"]}
        />
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Transaction Decoding</h4>
            <p className="text-sm text-gray-600">
              Decode any transaction with rich metadata and instruction analysis
            </p>
          </div>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Token Creation</h4>
            <p className="text-sm text-gray-600">
              Create SPL tokens and NFTs with metadata using Token-2022 standard
            </p>
          </div>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">RPC Operations</h4>
            <p className="text-sm text-gray-600">
              Direct blockchain queries with automatic retry and error handling
            </p>
          </div>
        </div>
      </div>

      {/* Error Handling */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">
          <ShieldCheckIcon className="w-6 h-6 inline mr-2" />
          Error Handling
        </h2>
        <p className="text-gray-600 mb-4">
          The SDK provides comprehensive error handling with specific error types:
        </p>
        <CodeBlock 
          code={errorHandlingCode} 
          id="errors" 
          title="Error Handling" 
          language="typescript"
          onCopy={copyToClipboard}
          copied={copied["errors"]}
        />
        
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">
            <ClockIcon className="w-5 h-5 inline mr-2" />
            Automatic Recovery
          </h4>
          <p className="text-sm text-yellow-800">
            The SDK automatically retries network errors and handles circuit breaker patterns. 
            Only catch errors that require application-specific handling.
          </p>
        </div>
      </div>

      {/* Key Features */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <CubeIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-docs-heading">Rich Transaction Decoding</h4>
                <p className="text-sm text-gray-600">
                  Decode instructions from 12+ programs with metadata enrichment
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <WifiIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-docs-heading">Production-Ready RPC</h4>
                <p className="text-sm text-gray-600">
                  Circuit breaker, retry logic, and connection pooling
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShieldCheckIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-docs-heading">Comprehensive Errors</h4>
                <p className="text-sm text-gray-600">
                  7 error categories with specific recovery strategies
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-docs-heading">Token & NFT Creation</h4>
                <p className="text-sm text-gray-600">
                  Create tokens and NFTs with cost estimation and validation
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-docs-heading mb-4 text-center">
          🚀 You're Ready to Build!
        </h2>
        <p className="text-gray-600 text-center mb-6">
          Now that you have the SDK set up, explore these resources to build your application:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a 
            href="/api-reference" 
            className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <h3 className="font-semibold text-docs-heading mb-2">📚 API Reference</h3>
            <p className="text-sm text-gray-600">Complete function documentation with examples</p>
          </a>
          <a 
            href="/playground" 
            className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <h3 className="font-semibold text-docs-heading mb-2">🎮 Interactive Playground</h3>
            <p className="text-sm text-gray-600">Test SDK methods live with real examples</p>
          </a>
          <a 
            href="/examples" 
            className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <h3 className="font-semibold text-docs-heading mb-2">💡 Code Examples</h3>
            <p className="text-sm text-gray-600">Real-world patterns and use cases</p>
          </a>
        </div>
      </div>
    </div>
  )
} 