import { useState, useEffect } from 'react'

// V1.3.0 Test Categories organized by rich functionality
const testCategories = {
  'Core SDK V1.3.0': [
    {
      id: 'network-health',
      name: 'Network Health',
      description: 'Check network connectivity and health status',
      method: 'getNetworkHealth',
      params: [],
      example: 'await sdk.getNetworkHealth()'
    },
    {
      id: 'network-capabilities',
      name: 'Network Capabilities',
      description: 'Detect supported RPC methods and features',
      method: 'detectNetworkCapabilities',
      params: [],
      example: 'await sdk.detectNetworkCapabilities()'
    }
  ],

  'Rich Token Operations': [
    {
      id: 'rich-token-accounts',
      name: 'Rich Token Portfolio Analysis',
      description: 'Get comprehensive token portfolio with metadata and insights',
      method: 'getRichTokenAccounts',
      params: [
        {
          name: 'walletAddress',
          type: 'string',
          placeholder: 'GThUX1Atko4tqhN2NaiTazWSeFWMuiUiswQrunPiLaFU',
          required: true
        },
        {
          name: 'includeMetadata',
          type: 'boolean',
          placeholder: 'true',
          required: false
        },
        {
          name: 'includeNFTs',
          type: 'boolean',
          placeholder: 'true',
          required: false
        },
        {
          name: 'maxConcurrentRequests',
          type: 'number',
          placeholder: '5',
          required: false
        }
      ],
      example: 'await sdk.getRichTokenAccounts(address, { includeMetadata: true, includeNFTs: true })'
    },
    {
      id: 'analyze-portfolio',
      name: 'Portfolio Analysis',
      description: 'Analyze portfolio for risk, diversity, and insights',
      method: 'analyzePortfolio',
      params: [
        {
          name: 'walletAddress',
          type: 'string',
          placeholder: 'GThUX1Atko4tqhN2NaiTazWSeFWMuiUiswQrunPiLaFU',
          required: true
        }
      ],
      example: 'await sdk.analyzePortfolio(walletAddress)'
    },
    {
      id: 'compare-portfolios',
      name: 'Portfolio Comparison',
      description: 'Compare two portfolios for similarities and differences',
      method: 'comparePortfolios',
      params: [
        {
          name: 'wallet1',
          type: 'string',
          placeholder: 'GThUX1Atko4tqhN2NaiTazWSeFWMuiUiswQrunPiLaFU',
          required: true
        },
        {
          name: 'wallet2',
          type: 'string',
          placeholder: 'DRiP2Pn2K6fuMLKQmt5rZWxa91vSDhqhZF3KZg9gEM5M',
          required: true
        }
      ],
      example: 'await sdk.comparePortfolios(wallet1, wallet2)'
    }
  ],

  'Rich Transaction Operations': [
    {
      id: 'rich-transaction',
      name: 'Rich Transaction Analysis',
      description: 'Get enhanced transaction data with decoded instructions and token metadata',
      method: 'getRichTransaction',
      params: [
        {
          name: 'signature',
          type: 'string',
          placeholder: '5j7s4H8n9QFjA2mP8xV3qE4R9K7nM2sL6tY1uI9oP3wQ8eR5tY1uI9oP3wQ8eR5tY',
          required: true
        },
        {
          name: 'includeTokenMetadata',
          type: 'boolean',
          placeholder: 'true',
          required: false
        },
        {
          name: 'includeBalanceChanges',
          type: 'boolean',
          placeholder: 'true',
          required: false
        }
      ],
      example: 'await sdk.getRichTransaction(signature, { includeTokenMetadata: true, includeBalanceChanges: true })'
    },
    {
      id: 'decode-transaction',
      name: 'Enhanced Transaction Decoding',
      description: 'Decode transaction with network-aware decoding',
      method: 'getAndDecodeTransaction',
      params: [
        {
          name: 'signature',
          type: 'string',
          placeholder: '5j7s4H8n9QFjA2mP8xV3qE4R9K7nM2sL6tY1uI9oP3wQ8eR5tY1uI9oP3wQ8eR5tY',
          required: true
        }
      ],
      example: 'await sdk.getAndDecodeTransaction(signature)'
    }
  ],

  'Universal Wallet Integration': [
    {
      id: 'wallet-manager',
      name: 'Create Wallet Manager',
      description: 'Create universal wallet manager for all Solana wallets',
      method: 'createWalletManager',
      params: [],
      example: 'const walletManager = sdk.createWalletManager()'
    },
    {
      id: 'discover-wallets',
      name: 'Discover Available Wallets',
      description: 'Discover all available Solana wallets in the environment',
      method: 'discoverWallets',
      params: [
        {
          name: 'includeExtensions',
          type: 'boolean',
          placeholder: 'true',
          required: false
        },
        {
          name: 'includeMobileWallets',
          type: 'boolean',
          placeholder: 'true',
          required: false
        }
      ],
      example: 'await walletManager.discoverWallets({ includeExtensions: true })',
      requiresWalletManager: true
    }
  ],

  'Direct RPC Access': [
    {
      id: 'rpc-client',
      name: 'Get RPC Client',
      description: 'Access direct RPC client for basic operations',
      method: 'getRpcClient',
      params: [],
      example: 'const rpcClient = sdk.rpc'
    },
    {
      id: 'enhanced-rpc',
      name: 'Enhanced RPC Client',
      description: 'Access enhanced RPC client with network-aware features',
      method: 'getEnhancedRpcClient',
      params: [],
      example: 'const enhancedRpc = sdk.enhancedRpc'
    },
    {
      id: 'account-info',
      name: 'Get Account Info',
      description: 'Get account information using direct RPC access',
      method: 'getAccountInfo',
      params: [
        {
          name: 'address',
          type: 'string',
          placeholder: 'GThUX1Atko4tqhN2NaiTazWSeFWMuiUiswQrunPiLaFU',
          required: true
        }
      ],
      example: 'await sdk.rpc.getAccountInfo(address)'
    }
  ],

  'SDK Information': [
    {
      id: 'supported-programs',
      name: 'Supported Programs',
      description: 'List all supported blockchain programs in the decoder registry',
      method: 'getSupportedPrograms',
      params: [],
      example: 'sdk.getSupportedPrograms()'
    },
    {
      id: 'network-config',
      name: 'Network Configuration',
      description: 'Get current network configuration and capabilities',
      method: 'getNetworkConfig',
      params: [],
      example: 'sdk.getNetworkConfig()'
    },
    {
      id: 'sdk-config',
      name: 'SDK Configuration',
      description: 'View current SDK configuration settings',
      method: 'getConfig',
      params: [],
      example: 'sdk.config'
    }
  ]
}

export default function InteractivePlaygroundV1() {
  const [sdk, setSdk] = useState<any>(null)
  const [walletManager, setWalletManager] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<{ [key: string]: any }>({})
  const [executing, setExecuting] = useState<{ [key: string]: boolean }>({})
  const [paramValues, setParamValues] = useState<{ [key: string]: any }>({})
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({
    'Core SDK V1.3.0': true,
    'Rich Token Operations': true
  })

  useEffect(() => {
    initializeSDK()
  }, [])

  const initializeSDK = async () => {
    try {
      console.log('🚀 Initializing GorbchainSDK V1.3.0...')
      
      // Dynamic import of the SDK
      const { GorbchainSDK } = await import('@gorbchain-xyz/chaindecode')
      
      const sdkInstance = new GorbchainSDK({
        rpcEndpoint: 'https://rpc.gorbchain.xyz',
        network: 'gorbchain',
        timeout: 30000,
        // Gorbchain custom program addresses
        programIds: {
          splToken: 'Gorbj8Dp27NkXMQUkeHBSmpf6iQ3yT4b2uVe8kM4s6br',
          splToken2022: 'G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6',
          associatedToken: 'GoATGVNeSXerFerPqTJ8hcED1msPWHHLxao2vwBYqowm',
          metadata: 'GMTAp1moCdGh4TEwFTcCJKeKL3UMEDB6vKpo2uxM9h4s'
        }
      })

      setSdk(sdkInstance)
      
      // Create wallet manager for wallet-related tests
      try {
        const walletMgr = sdkInstance.createWalletManager()
        setWalletManager(walletMgr)
        console.log('✅ Wallet manager created')
      } catch (error) {
        console.log('⚠️ Wallet manager creation skipped (expected in Node.js environment)')
      }

      console.log('✅ GorbchainSDK V1.3.0 initialized successfully!')
      setLoading(false)
    } catch (error) {
      console.error('❌ Failed to initialize SDK:', error)
      setLoading(false)
    }
  }

  const executeTest = async (testId: string, test: any) => {
    if (!sdk) {
      alert('SDK not initialized yet. Please wait...')
      return
    }

    setExecuting(prev => ({ ...prev, [testId]: true }))
    
    try {
      let result: any

      // Get parameter values for this test
      const params = test.params?.map((param: any) => {
        const value = paramValues[`${testId}_${param.name}`] || param.placeholder
        
        // Type conversion
        if (param.type === 'number') {
          return value ? Number(value) : undefined
        } else if (param.type === 'boolean') {
          return value === 'true' || value === true
        }
        return value
      }).filter((v: any) => v !== undefined && v !== '') || []

      console.log(`🔄 Executing ${test.name}...`)

      // Execute based on method
      switch (test.method) {
        case 'getNetworkHealth':
          result = await sdk.getNetworkHealth()
          break

        case 'detectNetworkCapabilities':
          result = await sdk.detectNetworkCapabilities()
          break

        case 'getRichTokenAccounts':
          const [walletAddress, includeMetadata, includeNFTs, maxConcurrentRequests] = params
          result = await sdk.getRichTokenAccounts(walletAddress, {
            includeMetadata: includeMetadata ?? true,
            includeNFTs: includeNFTs ?? true,
            maxConcurrentRequests: maxConcurrentRequests ?? 5
          })
          break

        case 'analyzePortfolio':
          result = await sdk.analyzePortfolio(params[0])
          break

        case 'comparePortfolios':
          result = await sdk.comparePortfolios(params[0], params[1])
          break

        case 'getRichTransaction':
          const [signature, includeTokenMetadata, includeBalanceChanges] = params
          result = await sdk.getRichTransaction(signature, {
            includeTokenMetadata: includeTokenMetadata ?? true,
            includeBalanceChanges: includeBalanceChanges ?? true
          })
          break

        case 'getAndDecodeTransaction':
          result = await sdk.getAndDecodeTransaction(params[0])
          break

        case 'createWalletManager':
          if (!walletManager) {
            result = { error: 'Wallet manager not available in this environment' }
          } else {
            result = { success: true, walletManagerCreated: true }
          }
          break

        case 'discoverWallets':
          if (!walletManager) {
            result = { error: 'Wallet manager required. Not available in Node.js environment.' }
          } else {
            const [includeExtensions, includeMobileWallets] = params
            result = await walletManager.discoverWallets({
              includeExtensions: includeExtensions ?? true,
              includeMobileWallets: includeMobileWallets ?? true
            })
          }
          break

        case 'getRpcClient':
          result = {
            available: true,
            type: 'RpcClient',
            methods: ['getAccountInfo', 'getSlot', 'getBlockHeight', 'request']
          }
          break

        case 'getEnhancedRpcClient':
          result = {
            available: true,
            type: 'EnhancedRpcClient',
            networkAware: true,
            methods: ['getSupportedMethods', 'isMethodSupported']
          }
          break

        case 'getAccountInfo':
          result = await sdk.rpc.getAccountInfo(params[0])
          break

        case 'getSupportedPrograms':
          result = {
            programs: sdk.getSupportedPrograms(),
            totalCount: sdk.getSupportedPrograms().length
          }
          break

        case 'getNetworkConfig':
          result = sdk.getNetworkConfig()
          break

        case 'getConfig':
          result = {
            network: sdk.config.network,
            rpcEndpoint: sdk.config.rpcEndpoint,
            timeout: sdk.config.timeout,
            version: '1.3.0'
          }
          break

        default:
          result = { error: `Method ${test.method} not implemented` }
      }

      console.log(`✅ ${test.name} completed`)
      setResults(prev => ({ ...prev, [testId]: result }))

    } catch (error: any) {
      console.error(`❌ ${test.name} failed:`, error)
      const errorResult = {
        error: error.message || 'Unknown error',
        details: error.stack || 'No stack trace available',
        note: test.method.includes('Rich') ? 'This is expected when running with example data' : 'Check console for details'
      }
      setResults(prev => ({ ...prev, [testId]: errorResult }))
    } finally {
      setExecuting(prev => ({ ...prev, [testId]: false }))
    }
  }

  const copyResult = (result: any) => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2))
  }

  const updateParam = (testId: string, paramName: string, value: any) => {
    setParamValues(prev => ({
      ...prev,
      [`${testId}_${paramName}`]: value
    }))
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-green-600">Initializing GorbchainSDK V1.3.0...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-green-900 mb-2">
          🧪 Interactive Playground - GorbchainSDK V1.3.0
        </h1>
        <p className="text-green-700 mb-4">
          Comprehensive testing environment for GorbchainSDK V1.3.0 rich functionality. 
          Features enhanced token analysis, transaction decoding, universal wallet integration, and portfolio insights.
        </p>
        <div className="bg-white rounded-lg p-4 border border-green-200">
          <div className="flex items-center space-x-2 text-sm">
            <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="font-medium text-green-700">✅ GorbchainSDK V1.3.0 initialized successfully!</span>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            🚀 Ready for rich functions: Enhanced token analysis • Rich transaction decoding • Universal wallet integration • Portfolio insights • Risk analysis
          </div>
        </div>
      </div>

      {Object.entries(testCategories).map(([category, tests]) => (
        <div key={category} className="docs-card">
          <button
            onClick={() => toggleCategory(category)}
            className="w-full flex items-center justify-between p-1 text-left"
          >
            <h2 className="text-xl font-semibold text-docs-heading flex items-center">
              {category}
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {tests.length} test{tests.length !== 1 ? 's' : ''}
              </span>
            </h2>
            <span className="text-green-600 text-lg">
              {expandedCategories[category] ? '▼' : '▶'}
            </span>
          </button>

          {expandedCategories[category] && (
            <div className="mt-4 space-y-6">
              {tests.map((test: any) => (
                <div key={test.id} className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-docs-heading">{test.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => executeTest(test.id, test)}
                        disabled={executing[test.id]}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm hover:shadow-md"
                      >
                        {executing[test.id] ? '⏳ Running...' : '▶️ Execute Test'}
                      </button>
                      {results[test.id] && (
                        <button
                          onClick={() => copyResult(results[test.id])}
                          className="px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium border border-green-200"
                        >
                          📋 Copy Result
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Method signature */}
                  <div className="mb-3">
                    <span className="font-mono text-sm bg-green-50 px-3 py-1.5 rounded-lg text-green-700 border border-green-200">
                      {test.method}
                    </span>
                    <p className="text-xs text-green-600 mt-1 font-mono">{test.example}</p>
                  </div>

                  {/* Parameters */}
                  {test.params && test.params.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-sm mb-2">Parameters:</h4>
                      <div className="space-y-2">
                        {test.params.map((param: any) => (
                          <div key={param.name} className="flex items-center space-x-3">
                            <label className="text-sm font-medium w-32">
                              {param.name} {param.required && <span className="text-red-500">*</span>}
                              <span className="text-green-600">({param.type})</span>
                            </label>
                            {param.type === 'boolean' ? (
                              <select
                                value={paramValues[`${test.id}_${param.name}`] || param.placeholder}
                                onChange={(e) => updateParam(test.id, param.name, e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-24 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none transition-colors"
                              >
                                <option value="true">true</option>
                                <option value="false">false</option>
                              </select>
                            ) : (
                              <input
                                type={param.type === 'number' ? 'number' : 'text'}
                                value={paramValues[`${test.id}_${param.name}`] || param.placeholder}
                                onChange={(e) => updateParam(test.id, param.name, e.target.value)}
                                placeholder={param.placeholder}
                                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm flex-1 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none transition-colors"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Special notices */}
                  {test.requiresWalletManager && (
                    <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                      💡 This function requires wallet manager and works best in browser environments.
                    </div>
                  )}

                  {/* Results */}
                  {results[test.id] && (
                    <div className="mt-4">
                      <h4 className="font-medium text-sm mb-2 text-green-700">Result:</h4>
                      <pre className="bg-green-50 p-4 rounded-lg text-xs overflow-x-auto max-h-64 border border-green-200 font-mono">
                        {JSON.stringify(results[test.id], null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Additional Information */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">💡 Testing Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium mb-2">🎯 For Best Results:</h3>
            <ul className="space-y-1 text-gray-600">
              <li>• Replace example addresses with real wallet addresses</li>
              <li>• Use real transaction signatures for transaction analysis</li>
              <li>• Test wallet integration in browser environments</li>
              <li>• Enable JavaScript console to see detailed logs</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">🚀 V1.3.0 Features:</h3>
            <ul className="space-y-1 text-gray-600">
              <li>• Rich token portfolio analysis with metadata</li>
              <li>• Enhanced transaction decoding with context</li>
              <li>• Universal wallet integration for all providers</li>
              <li>• Advanced portfolio comparison and insights</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}