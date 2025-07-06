
import { Link } from 'react-router-dom'
import { RocketLaunchIcon, CodeBracketIcon, WifiIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-docs-heading mb-4">
          Gorbchain ChainDecode SDK
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          The most comprehensive TypeScript SDK for decoding blockchain transactions, 
          handling RPC operations, and building applications on the Gorbchain network.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Link
            to="/getting-started"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
          >
            <RocketLaunchIcon className="w-5 h-5 mr-2" />
            Get Started
          </Link>
          <Link
            to="/api-reference"
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <CodeBracketIcon className="w-5 h-5 mr-2" />
            API Reference
          </Link>
        </div>
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="docs-card">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <CodeBracketIcon className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-docs-heading mb-2">
            Transaction Decoding
          </h3>
          <p className="text-gray-600 mb-4">
            Decode complex blockchain transactions with support for SPL tokens, NFTs, 
            and custom program instructions.
          </p>
          <Link
            to="/transaction-decoding"
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            Learn more →
          </Link>
        </div>

        <div className="docs-card">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <WifiIcon className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-docs-heading mb-2">
            RPC Operations
          </h3>
          <p className="text-gray-600 mb-4">
            Comprehensive RPC client with connection pooling, retry logic, 
            and circuit breaker patterns for production reliability.
          </p>
          <Link
            to="/rpc-operations"
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            Learn more →
          </Link>
        </div>

        <div className="docs-card">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <ShieldCheckIcon className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-docs-heading mb-2">
            Error Handling
          </h3>
          <p className="text-gray-600 mb-4">
            Robust error handling with comprehensive error taxonomy, 
            automatic retry logic, and detailed error context.
          </p>
          <Link
            to="/error-handling"
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            Learn more →
          </Link>
        </div>
      </div>

      {/* Quick start section */}
      <div className="docs-card">
        <h2 className="text-2xl font-bold text-docs-heading mb-6">Quick Start</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-docs-heading mb-3">Installation</h3>
            <div className="code-block">
              <pre><code>{`npm install @gorbchain-xyz/chaindecode`}</code></pre>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-docs-heading mb-3">Basic Usage</h3>
            <div className="code-block">
              <pre><code>{`import { GorbchainSDK } from '@gorbchain-xyz/chaindecode'

// Initialize the SDK
const sdk = new GorbchainSDK({
  rpcEndpoint: 'https://rpc.gorbchain.xyz',
  network: 'custom'
})

// Decode a transaction
const transaction = await sdk.getAndDecodeTransaction(signature)
console.log('Decoded instructions:', transaction.instructions)`}</code></pre>
            </div>
          </div>
        </div>
      </div>

      {/* Stats section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-docs-heading mb-6 text-center">
          Production Ready & Battle Tested
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-2">12+</div>
            <div className="text-sm text-gray-600">Program Decoders</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-2">64+</div>
            <div className="text-sm text-gray-600">Test Cases</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-2">7</div>
            <div className="text-sm text-gray-600">Error Categories</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-2">100%</div>
            <div className="text-sm text-gray-600">TypeScript Coverage</div>
          </div>
        </div>
      </div>

      {/* Documentation sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="docs-card">
          <h3 className="text-xl font-semibold text-docs-heading mb-4">
            📚 Documentation
          </h3>
          <ul className="space-y-3">
            <li>
              <Link 
                to="/getting-started" 
                className="flex items-center text-primary-600 hover:text-primary-700 font-medium"
              >
                Getting Started Guide →
              </Link>
            </li>
            <li>
              <Link 
                to="/api-reference" 
                className="flex items-center text-primary-600 hover:text-primary-700 font-medium"
              >
                Complete API Reference →
              </Link>
            </li>
            <li>
              <Link 
                to="/examples" 
                className="flex items-center text-primary-600 hover:text-primary-700 font-medium"
              >
                Code Examples →
              </Link>
            </li>
          </ul>
        </div>

        <div className="docs-card">
          <h3 className="text-xl font-semibold text-docs-heading mb-4">
            🛠️ Tools & Resources
          </h3>
          <ul className="space-y-3">
            <li>
              <Link 
                to="/playground" 
                className="flex items-center text-primary-600 hover:text-primary-700 font-medium"
              >
                Interactive Playground →
              </Link>
            </li>
            <li>
              <a 
                href="https://github.com/gorbchain-xyz/chaindecode" 
                className="flex items-center text-primary-600 hover:text-primary-700 font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub Repository →
              </a>
            </li>
            <li>
              <a 
                href="https://discord.gg/gorbchain" 
                className="flex items-center text-primary-600 hover:text-primary-700 font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                Discord Community →
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
} 