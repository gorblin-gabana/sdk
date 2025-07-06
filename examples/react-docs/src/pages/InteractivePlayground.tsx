import { useState, useEffect } from 'react'
import { SDKMethod } from '../types/playground'

// Test Categories organized by functionality
const testCategories = {
  'Core SDK': [
    {
      id: 'network-health',
      name: 'Network Health',
      description: 'Check network connectivity and health',
      method: 'getNetworkHealth',
      params: [],
      example: 'await sdk.getNetworkHealth()'
    },
    {
      id: 'rpc-client',
      name: 'RPC Client',
      description: 'Access direct RPC client functionality',
      method: 'getRpcClient',
      params: [],
      example: 'const client = sdk.getRpcClient()'
    }
  ],
  'Transaction Decoding': [
    {
      id: 'decode-transaction',
      name: 'Decode Transaction',
      description: 'Fetch and decode a complete transaction',
      method: 'getAndDecodeTransaction',
      params: [
        {
          name: 'signature',
          type: 'string',
          placeholder: '4sLFPwfFFkQknYGKnueZFENbfUTGyZVPucREyZoS7Gp5U7UfWVynuThGmZ1Du74swuQ7nr6U1nKCpEwLsAr3ipXt',
          required: true
        }
      ],
      example: 'await sdk.getAndDecodeTransaction(signature)'
    },
    {
      id: 'decode-instructions',
      name: 'Decode Instructions',
      description: 'Decode raw instruction data',
      method: 'decodeInstructions',
      params: [
        {
          name: 'instructions',
          type: 'json',
          placeholder: '[{"programId": "11111111111111111111111111111111", "data": "AgAAAOgDAAAAAAAA"}]',
          required: true
        }
      ],
      example: 'await sdk.decodeInstructions(instructions)'
    }
  ],
  'Decoder Registry': [
    {
      id: 'system-decoder',
      name: 'System Program',
      description: 'Test system program instruction decoding',
      method: 'testSystemDecoder',
      params: [],
      example: 'Test system transfer, create account, etc.'
    },
    {
      id: 'spl-token-decoder',
      name: 'SPL Token',
      description: 'Test SPL Token instruction decoding',
      method: 'testSPLTokenDecoder',
      params: [],
      example: 'Test token transfer, mint, burn, etc.'
    },
    {
      id: 'token2022-decoder',
      name: 'Token-2022',
      description: 'Test Token-2022 instruction decoding',
      method: 'testToken2022Decoder',
      params: [],
      example: 'Test advanced token operations'
    },
    {
      id: 'ata-decoder',
      name: 'Associated Token Account',
      description: 'Test ATA instruction decoding',
      method: 'testATADecoder',
      params: [],
      example: 'Test ATA creation and management'
    },
    {
      id: 'nft-decoder',
      name: 'NFT/Metaplex',
      description: 'Test NFT instruction decoding',
      method: 'testNFTDecoder',
      params: [],
      example: 'Test NFT mint, transfer, metadata'
    },
    {
      id: 'name-service-decoder',
      name: 'Name Service',
      description: 'Test name service instruction decoding',
      method: 'testNameServiceDecoder',
      params: [],
      example: 'Test name registration, transfer'
    },
    {
      id: 'swap-decoder',
      name: 'Swap/DEX',
      description: 'Test swap instruction decoding',
      method: 'testSwapDecoder',
      params: [],
      example: 'Test swap, liquidity operations'
    }
  ],
  'RPC Operations': [
    {
      id: 'fetch-transaction',
      name: 'Fetch Transaction',
      description: 'Fetch raw transaction data',
      method: 'fetchTransaction',
      params: [
        {
          name: 'signature',
          type: 'string',
          placeholder: '4sLFPwfFFkQknYGKnueZFENbfUTGyZVPucREyZoS7Gp5U7UfWVynuThGmZ1Du74swuQ7nr6U1nKCpEwLsAr3ipXt',
          required: true
        }
      ],
      example: 'await sdk.fetchTransaction(signature)'
    },
    {
      id: 'get-account-info',
      name: 'Get Account Info',
      description: 'Fetch account information',
      method: 'getAccountInfo',
      params: [
        {
          name: 'address',
          type: 'string',
          placeholder: '2o1oEPUXhNMLu8HQihgXtXu1Vv5zTTvpX5uVZV6f2Jxa',
          required: true
        }
      ],
      example: 'await sdk.getAccountInfo(address)'
    }
  ],
  'Utilities': [
    {
      id: 'base64-to-hex',
      name: 'Base64 to Hex',
      description: 'Convert base64 data to hex format',
      method: 'base64ToHex',
      params: [
        {
          name: 'base64Data',
          type: 'string',
          placeholder: 'SGVsbG8gV29ybGQ=',
          required: true
        }
      ],
      example: 'base64ToHex(data)'
    },
    {
      id: 'fetch-program-account',
      name: 'Fetch Program Account',
      description: 'Fetch accounts owned by a program',
      method: 'fetchProgramAccount',
      params: [
        {
          name: 'programId',
          type: 'string',
          placeholder: '11111111111111111111111111111111',
          required: true
        }
      ],
      example: 'await fetchProgramAccount(programId)'
    }
  ]
}

export default function InteractivePlayground() {
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set(['Core SDK']))
  const [activeTests, setActiveTests] = useState<Set<string>>(new Set())
  const [parameterValues, setParameterValues] = useState<{ [key: string]: { [key: string]: string } }>({})
  const [results, setResults] = useState<{ [key: string]: any }>({})
  const [loading, setLoading] = useState<Set<string>>(new Set())
  const [sdk, setSdk] = useState<any>(null)
  const [sdkError, setSdkError] = useState<string | null>(null)

  // Initialize SDK
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        console.log('🔄 Initializing browser-compatible SDK...')
        
        // Import the browser-compatible SDK
        const { GorbchainSDK } = await import('../../../../dist/src/browser.js')
        
        console.log('✅ Browser SDK imported successfully')
        
        const sdkInstance = new GorbchainSDK({
          rpcEndpoint: 'https://rpc.gorbchain.xyz',
          richDecoding: {
            enabled: true,
            includeTokenMetadata: true,
            includeNftMetadata: true
          }
        })

        console.log('✅ SDK initialized:', sdkInstance)
        setSdk(sdkInstance)
        
        console.log('🎉 Browser-compatible SDK ready!')
      } catch (error) {
        console.error('❌ Failed to initialize SDK:', error)
        setSdkError(error instanceof Error ? error.message : 'Unknown error')
      }
    }

    initializeSDK()
  }, [])

  const toggleCategory = (categoryName: string) => {
    const newActiveCategories = new Set(activeCategories)
    if (newActiveCategories.has(categoryName)) {
      newActiveCategories.delete(categoryName)
    } else {
      newActiveCategories.add(categoryName)
    }
    setActiveCategories(newActiveCategories)
  }

  const toggleTest = (testId: string) => {
    const newActiveTests = new Set(activeTests)
    if (newActiveTests.has(testId)) {
      newActiveTests.delete(testId)
    } else {
      newActiveTests.add(testId)
      
      // Auto-populate parameters with default values when opening a test
      const test = Object.values(testCategories).flat().find(t => t.id === testId)
      if (test && test.params && test.params.length > 0) {
        const defaultParams: { [key: string]: string } = {}
        test.params.forEach(param => {
          defaultParams[param.name] = param.placeholder || ''
        })
        setParameterValues(prev => ({
          ...prev,
          [testId]: defaultParams
        }))
      }
    }
    setActiveTests(newActiveTests)
  }

  const handleParameterChange = (testId: string, paramName: string, value: string) => {
    setParameterValues(prev => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        [paramName]: value
      }
    }))
  }

  const executeTest = async (test: any) => {
    if (!sdk) {
      console.error('SDK not initialized')
      return
    }

    setLoading(prev => new Set(prev).add(test.id))
    
    try {
      let result: any
      const params = parameterValues[test.id] || {}

      // Validate required parameters
      if (test.params) {
        for (const param of test.params) {
          if (param.required && (!params[param.name] || params[param.name].trim() === '')) {
            throw new Error(`Required parameter '${param.name}' is missing. Please provide a value.`)
          }
        }
      }

      switch (test.method) {
        case 'getNetworkHealth':
          result = await sdk.getNetworkHealth()
          break
          
        case 'getRpcClient':
          const client = sdk.getRpcClient()
          result = {
            success: true,
            data: {
              endpoint: client.endpoint,
              methods: ['getHealth', 'getSlot', 'getTransaction', 'getAccountInfo'],
              initialized: true
            }
          }
          break
          
        case 'getAndDecodeTransaction':
          const signature = params.signature || '4sLFPwfFFkQknYGKnueZFENbfUTGyZVPucREyZoS7Gp5U7UfWVynuThGmZ1Du74swuQ7nr6U1nKCpEwLsAr3ipXt'
          result = await sdk.getAndDecodeTransaction(signature, {
            richDecoding: true,
            includeTokenMetadata: true
          })
          break
          
        case 'decodeInstructions':
          const instructions = JSON.parse(params.instructions || '[{"programId": "11111111111111111111111111111111", "data": "AgAAAOgDAAAAAAAA"}]')
          result = await sdk.decodeInstructions(instructions)
          break
          
        case 'fetchTransaction':
          const client2 = sdk.getRpcClient()
          const sig2 = params.signature || '4sLFPwfFFkQknYGKnueZFENbfUTGyZVPucREyZoS7Gp5U7UfWVynuThGmZ1Du74swuQ7nr6U1nKCpEwLsAr3ipXt'
          result = await client2.getTransaction(sig2)
          break
          
        case 'getAccountInfo':
          const client3 = sdk.getRpcClient()
          const address = params.address || '2o1oEPUXhNMLu8HQihgXtXu1Vv5zTTvpX5uVZV6f2Jxa'
          result = await client3.getAccountInfo(address)
          break
          
        // Decoder tests
        case 'testSystemDecoder':
          result = await testSystemDecoder(sdk)
          break
          
        case 'testSPLTokenDecoder':
          result = await testSPLTokenDecoder(sdk)
          break
          
        case 'testToken2022Decoder':
          result = await testToken2022Decoder(sdk)
          break
          
        case 'testATADecoder':
          result = await testATADecoder(sdk)
          break
          
        case 'testNFTDecoder':
          result = await testNFTDecoder(sdk)
          break
          
        case 'testNameServiceDecoder':
          result = await testNameServiceDecoder(sdk)
          break
          
        case 'testSwapDecoder':
          result = await testSwapDecoder(sdk)
          break
          
        // Utility tests
        case 'base64ToHex':
          const { base64ToHex } = await import('../../../../dist/src/browser.js')
          const base64Data = params.base64Data || 'SGVsbG8gV29ybGQ='
          result = {
            success: true,
            data: base64ToHex(base64Data)
          }
          break
          
        case 'fetchProgramAccount':
          const { fetchProgramAccount } = await import('../../../../dist/src/browser.js')
          const programId = params.programId || '11111111111111111111111111111111'
          result = await fetchProgramAccount(programId)
          break
          
        default:
          result = {
            success: false,
            error: `Test method '${test.method}' not implemented`
          }
      }

      setResults(prev => ({ ...prev, [test.id]: result }))
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [test.id]: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        } 
      }))
    } finally {
      setLoading(prev => {
        const newLoading = new Set(prev)
        newLoading.delete(test.id)
        return newLoading
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Interactive SDK Playground</h1>
        <p className="text-lg text-gray-600">
          Comprehensive testing environment for all Gorbchain SDK functionality. 
          Organized by categories with all 12 decoders available.
        </p>
        
        {sdkError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">❌ SDK initialization failed: {sdkError}</p>
          </div>
        )}
        
        {!sdk && !sdkError && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">🔄 Initializing browser-compatible SDK...</p>
          </div>
        )}
        
        {sdk && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">✅ SDK initialized successfully!</p>
            <p className="text-green-700 text-sm mt-1">
              Browser-compatible version with all decoders (excludes minting functions)
            </p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {Object.entries(testCategories).map(([categoryName, tests]) => (
          <div key={categoryName} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory(categoryName)}
              className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 border-b border-gray-200 text-left transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-semibold text-gray-900">{categoryName}</span>
                  <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded">
                    {tests.length} tests
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {activeCategories.has(categoryName) ? 'Collapse' : 'Expand'}
                  </span>
                  <svg 
                    className={`w-5 h-5 transition-transform ${activeCategories.has(categoryName) ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>

            {activeCategories.has(categoryName) && (
              <div className="p-6 space-y-4">
                {tests.map((test: any) => (
                  <div key={test.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleTest(test.id)}
                      className="w-full px-4 py-3 bg-white hover:bg-gray-50 border-b border-gray-200 text-left transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{test.name}</h3>
                          <p className="text-sm text-gray-500">{test.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{test.method}</code>
                          <svg 
                            className={`w-4 h-4 transition-transform ${activeTests.has(test.id) ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </button>

                    {activeTests.has(test.id) && (
                      <div className="p-4 bg-gray-50 border-t border-gray-200">
                        <div className="space-y-4">
                          <div className="bg-gray-900 rounded-lg p-3">
                            <code className="text-green-400 text-sm font-mono">{test.example}</code>
                          </div>

                          {test.params && test.params.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="font-medium text-gray-900">Parameters:</h4>
                              {test.params.map((param: any) => (
                                <div key={param.name} className="space-y-1">
                                  <label className="block text-sm font-medium text-gray-700">
                                    {param.name} {param.required && <span className="text-red-500">*</span>}
                                  </label>
                                  <input
                                    type="text"
                                    placeholder={param.placeholder}
                                    value={parameterValues[test.id]?.[param.name] || ''}
                                    onChange={(e) => handleParameterChange(test.id, param.name, e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex space-x-3">
                            <button
                              onClick={() => executeTest(test)}
                              disabled={loading.has(test.id) || !sdk}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {loading.has(test.id) ? 'Running...' : 'Execute Test'}
                            </button>
                            
                            {results[test.id] && (
                              <button
                                onClick={() => copyToClipboard(JSON.stringify(results[test.id], null, 2))}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                              >
                                Copy Result
                              </button>
                            )}
                          </div>

                          {results[test.id] && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-gray-900">Result:</h4>
                              <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                                <pre className="text-green-400 text-sm font-mono">
                                  {JSON.stringify(results[test.id], null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Decoder test functions
async function testSystemDecoder(sdk: any) {
  const testInstructions = [
    {
      programId: '11111111111111111111111111111111',
      data: new Uint8Array([2, 0, 0, 0, 0, 0, 0, 0, 64, 66, 15, 0, 0, 0, 0, 0]), // Transfer 1 SOL
      accounts: ['sender', 'recipient']
    },
    {
      programId: '11111111111111111111111111111111', 
      data: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 64, 66, 15, 0, 0, 0, 0, 0, 165, 0, 0, 0, 0, 0, 0, 0]), // Create account
      accounts: ['payer', 'newAccount']
    }
  ]

  const results = []
  for (const instruction of testInstructions) {
    const decoded = await sdk.decodeInstruction(instruction)
    results.push(decoded)
  }
  
  return {
    success: true,
    data: {
      testedInstructions: testInstructions.length,
      results: results
    }
  }
}

async function testSPLTokenDecoder(sdk: any) {
  return {
    success: true,
    data: {
      message: 'SPL Token decoder test - implementation pending',
      supportedInstructions: ['InitializeMint', 'Transfer', 'Approve', 'Burn', 'MintTo']
    }
  }
}

async function testToken2022Decoder(sdk: any) {
  return {
    success: true,
    data: {
      message: 'Token-2022 decoder test - implementation pending',
      supportedInstructions: ['InitializeMint', 'Transfer', 'TransferChecked', 'Burn', 'MintTo', 'SetAuthority']
    }
  }
}

async function testATADecoder(sdk: any) {
  return {
    success: true,
    data: {
      message: 'ATA decoder test - implementation pending',
      supportedInstructions: ['CreateAssociatedTokenAccount']
    }
  }
}

async function testNFTDecoder(sdk: any) {
  return {
    success: true,
    data: {
      message: 'NFT decoder test - implementation pending',
      supportedInstructions: ['CreateV1', 'Transfer', 'Update', 'Burn']
    }
  }
}

async function testNameServiceDecoder(sdk: any) {
  return {
    success: true,
    data: {
      message: 'Name Service decoder test - implementation pending',
      supportedInstructions: ['RegisterName', 'UpdateName', 'TransferName']
    }
  }
}

async function testSwapDecoder(sdk: any) {
  return {
    success: true,
    data: {
      message: 'Swap decoder test - implementation pending',
      supportedInstructions: ['Swap', 'AddLiquidity', 'RemoveLiquidity', 'InitializePool']
    }
  }
} 