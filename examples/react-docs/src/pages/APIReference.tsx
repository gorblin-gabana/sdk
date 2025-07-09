
import { CodeBracketIcon, GlobeAltIcon, CubeIcon, WifiIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

export default function APIReference() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-docs-heading mb-4">API Reference</h1>
      <p className="text-lg text-gray-600 mb-6">
        Complete API documentation for the Gorbchain ChainDecode SDK.
      </p>

      {/* SDK Overview */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">SDK Overview</h2>
        <p className="text-gray-600 mb-4">
          The Gorbchain SDK provides a comprehensive set of tools for blockchain interaction, transaction decoding, and network operations.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <CubeIcon className="w-8 h-8 text-blue-600 mb-2" />
            <h4 className="font-semibold text-blue-800">Core SDK</h4>
            <p className="text-sm text-blue-700">Main class with 8+ methods</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <WifiIcon className="w-8 h-8 text-green-600 mb-2" />
            <h4 className="font-semibold text-green-800">RPC Client</h4>
            <p className="text-sm text-green-700">Advanced RPC operations</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <DocumentTextIcon className="w-8 h-8 text-purple-600 mb-2" />
            <h4 className="font-semibold text-purple-800">Token & NFT</h4>
            <p className="text-sm text-purple-700">Minting and metadata</p>
          </div>
        </div>
      </div>

      {/* Core SDK Methods */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-6">Core SDK Methods</h2>
        <div className="space-y-6">
          
          {/* GorbchainSDK Constructor */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-medium text-docs-heading mb-2">GorbchainSDK(config)</h3>
            <p className="text-gray-600 text-sm mb-3">
              Initialize the SDK with configuration options.
            </p>
            <div className="bg-gray-50 rounded p-3 mb-3">
              <code className="text-sm">{`const sdk = new GorbchainSDK({
  rpcEndpoint: 'https://rpc.gorbchain.xyz',
  network: 'custom',
  programIds: { ... }
})`}</code>
            </div>
            <div className="text-xs text-gray-500">
              <strong>Parameters:</strong> SDKConfig object with rpcEndpoint, network, programIds, timeout, retries
            </div>
          </div>

          {/* Transaction Decoding */}
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-medium text-docs-heading mb-2">getAndDecodeTransaction(signature, options?)</h3>
            <p className="text-gray-600 text-sm mb-3">
              Fetch and decode a transaction with rich metadata analysis.
            </p>
            <div className="bg-gray-50 rounded p-3 mb-3">
              <code className="text-sm">{`const transaction = await sdk.getAndDecodeTransaction(signature, {
  richDecoding: true,
  includeTokenMetadata: true
})`}</code>
            </div>
            <div className="text-xs text-gray-500">
              <strong>Returns:</strong> Promise&lt;RichTransaction&gt; with decoded instructions and metadata
            </div>
          </div>

          {/* Instruction Decoding */}
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-medium text-docs-heading mb-2">decodeInstruction(instruction)</h3>
            <p className="text-gray-600 text-sm mb-3">
              Decode a single instruction using registered decoders.
            </p>
            <div className="bg-gray-50 rounded p-3 mb-3">
              <code className="text-sm">{`const decoded = sdk.decodeInstruction(instruction)`}</code>
            </div>
            <div className="text-xs text-gray-500">
              <strong>Returns:</strong> DecodedInstruction with parsed data and program identification
            </div>
          </div>

          {/* Network Health */}
          <div className="border-l-4 border-orange-500 pl-4">
            <h3 className="font-medium text-docs-heading mb-2">getNetworkHealth()</h3>
            <p className="text-gray-600 text-sm mb-3">
              Check network connectivity and health status.
            </p>
            <div className="bg-gray-50 rounded p-3 mb-3">
              <code className="text-sm">{`const health = await sdk.getNetworkHealth()`}</code>
            </div>
            <div className="text-xs text-gray-500">
              <strong>Returns:</strong> Promise&lt;NetworkHealth&gt; with status, latency, and endpoint info
            </div>
          </div>
        </div>
      </div>

      {/* Token & NFT Methods */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-6">Token & NFT Creation</h2>
        <div className="space-y-6">
          
          {/* Token Creation */}
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-medium text-docs-heading mb-2">createToken22TwoTx(params)</h3>
            <p className="text-gray-600 text-sm mb-3">
              Create a Token-2022 token using two transactions (mint + metadata).
            </p>
            <div className="bg-gray-50 rounded p-3 mb-3">
              <code className="text-sm">{`const result = await sdk.createToken22TwoTx({
  name: 'My Token',
  symbol: 'MTK',
  decimals: 6,
  supply: 1000000
})`}</code>
            </div>
            <div className="text-xs text-gray-500">
              <strong>Returns:</strong> Promise&lt;TokenMintResult&gt; with transaction signatures and mint address
            </div>
          </div>

          {/* NFT Creation */}
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-medium text-docs-heading mb-2">createNFT(params)</h3>
            <p className="text-gray-600 text-sm mb-3">
              Create an NFT using Metaplex Core standard.
            </p>
            <div className="bg-gray-50 rounded p-3 mb-3">
              <code className="text-sm">{`const result = await sdk.createNFT({
  name: 'My NFT',
  uri: 'https://metadata.json',
  sellerFeeBasisPoints: 500
})`}</code>
            </div>
            <div className="text-xs text-gray-500">
              <strong>Returns:</strong> Promise&lt;NFTMintResult&gt; with transaction signature and asset address
            </div>
          </div>

          {/* Cost Estimation */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-medium text-docs-heading mb-2">estimateTokenCreationCost(params)</h3>
            <p className="text-gray-600 text-sm mb-3">
              Estimate the cost for creating a token.
            </p>
            <div className="bg-gray-50 rounded p-3 mb-3">
              <code className="text-sm">{`const cost = await sdk.estimateTokenCreationCost({
  decimals: 6,
  hasFreezeMint: true
})`}</code>
            </div>
            <div className="text-xs text-gray-500">
              <strong>Returns:</strong> Promise&lt;CostEstimate&gt; with SOL amounts and breakdown
            </div>
          </div>

          {/* Balance Check */}
          <div className="border-l-4 border-yellow-500 pl-4">
            <h3 className="font-medium text-docs-heading mb-2">checkSufficientBalance(publicKey, requiredAmount)</h3>
            <p className="text-gray-600 text-sm mb-3">
              Check if an account has sufficient SOL balance.
            </p>
            <div className="bg-gray-50 rounded p-3 mb-3">
              <code className="text-sm">{`const hasBalance = await sdk.checkSufficientBalance(
  publicKey, 
  0.1 // SOL amount
)`}</code>
            </div>
            <div className="text-xs text-gray-500">
              <strong>Returns:</strong> Promise&lt;boolean&gt; indicating sufficient balance
            </div>
          </div>
        </div>
      </div>

      {/* RPC Client Methods */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-6">RPC Client</h2>
        <div className="space-y-6">
          
          {/* RPC Client Access */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-medium text-docs-heading mb-2">getRpcClient()</h3>
            <p className="text-gray-600 text-sm mb-3">
              Get the underlying RPC client for advanced operations.
            </p>
            <div className="bg-gray-50 rounded p-3 mb-3">
              <code className="text-sm">{`const rpcClient = sdk.getRpcClient()
const slot = await rpcClient.getSlot()`}</code>
            </div>
            <div className="text-xs text-gray-500">
              <strong>Returns:</strong> RpcClient instance with retry logic and circuit breaker
            </div>
          </div>

          {/* Direct RPC */}
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-medium text-docs-heading mb-2">RpcClient.request(method, params)</h3>
            <p className="text-gray-600 text-sm mb-3">
              Make direct RPC calls with automatic retry and error handling.
            </p>
            <div className="bg-gray-50 rounded p-3 mb-3">
              <code className="text-sm">{`const response = await rpcClient.request('getAccountInfo', [
  publicKey,
  { encoding: 'base64' }
])`}</code>
            </div>
            <div className="text-xs text-gray-500">
              <strong>Returns:</strong> Promise&lt;RpcResponse&gt; with value and context
            </div>
          </div>
        </div>
      </div>

      {/* Decoder Registry */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-6">Decoder Registry</h2>
        <div className="space-y-6">
          
          {/* Registry Access */}
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-medium text-docs-heading mb-2">getDecoderRegistry()</h3>
            <p className="text-gray-600 text-sm mb-3">
              Access the decoder registry for custom decoder management.
            </p>
            <div className="bg-gray-50 rounded p-3 mb-3">
              <code className="text-sm">{`const registry = sdk.decoders
registry.register('programId', customDecoder)`}</code>
            </div>
            <div className="text-xs text-gray-500">
              <strong>Returns:</strong> DecoderRegistry instance with built-in and custom decoders
            </div>
          </div>

          {/* Supported Programs */}
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-medium text-docs-heading mb-2">Built-in Decoders</h3>
            <p className="text-gray-600 text-sm mb-3">
              Pre-configured decoders for common Solana programs.
            </p>
            <div className="bg-gray-50 rounded p-3 mb-3">
              <div className="text-sm grid grid-cols-2 gap-2">
                <div>• System Program</div>
                <div>• SPL Token</div>
                <div>• Token-2022</div>
                <div>• Associated Token</div>
                <div>• Metaplex Core</div>
                <div>• Name Service</div>
                <div>• Swap Programs</div>
                <div>• Custom Programs</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Utility Functions */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-6">Utility Functions</h2>
        <div className="space-y-6">
          
          {/* Base58 Utils */}
          <div className="border-l-4 border-gray-500 pl-4">
            <h3 className="font-medium text-docs-heading mb-2">Base58 Utilities</h3>
            <p className="text-gray-600 text-sm mb-3">
              Encoding and decoding utilities for Base58 data.
            </p>
            <div className="bg-gray-50 rounded p-3 mb-3">
              <code className="text-sm">{`import { bytesToBase58, base58ToBytes } from '@gorbchain-xyz/chaindecode'

const encoded = bytesToBase58(buffer)
const decoded = base58ToBytes(string)`}</code>
            </div>
          </div>

          {/* Base64 Utils */}
          <div className="border-l-4 border-gray-500 pl-4">
            <h3 className="font-medium text-docs-heading mb-2">base64ToHex(base64String)</h3>
            <p className="text-gray-600 text-sm mb-3">
              Convert Base64 encoded data to hexadecimal format.
            </p>
            <div className="bg-gray-50 rounded p-3 mb-3">
              <code className="text-sm">{`import { base64ToHex } from '@gorbchain-xyz/chaindecode'

const hex = base64ToHex(base64String)`}</code>
            </div>
          </div>
        </div>
      </div>

      {/* Type Definitions */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-6">Type Definitions</h2>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded p-4">
            <h4 className="font-medium text-docs-heading mb-2">Core Types</h4>
            <div className="text-sm space-y-1">
              <div>• <code>SDKConfig</code> - SDK configuration options</div>
              <div>• <code>RichTransaction</code> - Enhanced transaction data</div>
              <div>• <code>DecodedInstruction</code> - Decoded instruction result</div>
              <div>• <code>NetworkHealth</code> - Network status information</div>
            </div>
          </div>
          <div className="bg-gray-50 rounded p-4">
            <h4 className="font-medium text-docs-heading mb-2">Token & NFT Types</h4>
            <div className="text-sm space-y-1">
              <div>• <code>TokenMintResult</code> - Token creation result</div>
              <div>• <code>NFTMintResult</code> - NFT creation result</div>
              <div>• <code>CostEstimate</code> - Cost estimation data</div>
              <div>• <code>TokenCreationParams</code> - Token creation parameters</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Types */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-6">Error Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-2">Network Errors</h4>
            <div className="text-sm text-red-700 space-y-1">
              <div>• RpcNetworkError</div>
              <div>• RpcTimeoutError</div>
              <div>• NetworkConnectionError</div>
              <div>• NetworkTimeoutError</div>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Transaction Errors</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              <div>• TransactionNotFoundError</div>
              <div>• TransactionFailedError</div>
              <div>• InvalidTransactionSignatureError</div>
              <div>• TransactionTimeoutError</div>
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-800 mb-2">Decoder Errors</h4>
            <div className="text-sm text-purple-700 space-y-1">
              <div>• DecoderNotFoundError</div>
              <div>• DecoderError</div>
              <div>• InvalidInstructionDataError</div>
              <div>• TokenMetadataDecodingError</div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Validation Errors</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div>• InvalidAddressError</div>
              <div>• InvalidParameterError</div>
              <div>• InvalidConfigurationError</div>
              <div>• InvalidPublicKeyError</div>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Note */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <GlobeAltIcon className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              🚀 Gorbscan API Integration
            </h3>
            <p className="text-blue-700 mb-4">
              The SDK integrates with <strong>Gorbscan API</strong> to provide enhanced blockchain data, 
              transaction history, and account information, complementing on-chain decoding capabilities.
            </p>
          </div>
        </div>
      </div>

      {/* Contribution */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <CodeBracketIcon className="w-5 h-5 text-yellow-600" />
          <span className="font-semibold text-yellow-800">Need more details?</span>
        </div>
        <p className="text-yellow-700 text-sm mt-2">
          Check out the interactive playground to test functions live, or visit our 
          <a href="https://github.com/gorbchain-xyz/chaindecode" className="underline font-medium ml-1">
            GitHub repository
          </a> for source code and examples.
        </p>
      </div>
    </div>
  )
} 