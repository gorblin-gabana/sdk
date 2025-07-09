import { useState } from 'react'
import CodeBlock from '../components/CodeBlock'
import { 
  CodeBracketIcon,
  WifiIcon,
  ShieldCheckIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'

export default function TransactionDecoding() {
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({})

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopied(prev => ({ ...prev, [id]: true }))
    setTimeout(() => {
      setCopied(prev => ({ ...prev, [id]: false }))
    }, 2000)
  }

  const basicDecodingCode = `// Basic Transaction Decoding
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode'

const sdk = new GorbchainSDK({
  rpcEndpoint: 'https://rpc.gorbchain.xyz',
  network: 'custom'
})

// Decode a transaction with rich analysis
const transaction = await sdk.getAndDecodeTransaction(signature, {
  richDecoding: true,
  includeTokenMetadata: true
})

console.log('Transaction Status:', transaction.status)
console.log('Fee:', transaction.fee, 'lamports')
console.log('Block Time:', new Date(transaction.blockTime * 1000))
console.log('Instructions:', transaction.instructions.length)
console.log('Transaction Type:', transaction.summary.type)
console.log('Description:', transaction.summary.description)

// Analyze each instruction
transaction.instructions.forEach((instruction, index) => {
  console.log(\`\${index + 1}. \${instruction.program}: \${instruction.action}\`)
  console.log('   Description:', instruction.description)
  if (instruction.data) {
    console.log('   Data:', instruction.data)
  }
})`

  const instructionDecodingCode = `// Individual Instruction Decoding
// Decode a single instruction
const instruction = {
  programId: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
  accounts: [/* account keys */],
  data: 'base64-encoded-data'
}

const decoded = sdk.decodeInstruction(instruction)

console.log('Program:', decoded.programName)        // 'Token-2022'
console.log('Instruction:', decoded.instructionName) // 'transfer'
console.log('Data:', decoded.data)                  // Parsed instruction data
console.log('Accounts:', decoded.accounts)           // Account roles and details

// Check if decoding was successful
if (decoded.success) {
  // Access specific instruction data
  switch (decoded.instructionName) {
    case 'transfer':
      console.log('Amount:', decoded.data.amount)
      console.log('Source:', decoded.accounts.source)
      console.log('Destination:', decoded.accounts.destination)
      break
    case 'mintTo':
      console.log('Amount:', decoded.data.amount)
      console.log('Mint:', decoded.accounts.mint)
      console.log('Account:', decoded.accounts.account)
      break
  }
} else {
  console.log('Raw data available:', decoded.rawData)
}`

  const decoderRegistryCode = `// Working with Decoder Registry
const registry = sdk.decoders

// Get list of supported programs
const supportedPrograms = registry.getRegisteredPrograms()
console.log('Supported programs:', supportedPrograms)

// Register a custom decoder
const customDecoder = (instruction: any) => {
  // Your custom decoding logic
  return {
    type: 'customInstruction',
    description: 'Custom instruction',
    data: parseCustomData(instruction.data),
    accounts: instruction.accounts
  }
}

registry.register('custom-program', 'YourCustomProgramId', customDecoder)

// Check if a decoder exists for a program
const hasDecoder = registry.hasDecoder('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb')
console.log('Has Token-2022 decoder:', hasDecoder) // true`

  const batchDecodingCode = `// Batch Transaction Decoding
async function decodeMultipleTransactions(signatures: string[]) {
  const results = []
  
  // Process in batches to respect rate limits
  const batchSize = 5
  
  for (let i = 0; i < signatures.length; i += batchSize) {
    const batch = signatures.slice(i, i + batchSize)
    
    const batchPromises = batch.map(async (signature) => {
      try {
        const transaction = await sdk.getAndDecodeTransaction(signature)
        
        return {
          signature,
          success: true,
          data: {
            fee: transaction.fee || 0,
            instructionCount: transaction.instructions.length,
            programs: transaction.summary.programsUsed,
            status: transaction.status
          }
        }
      } catch (error) {
        return {
          signature,
          success: false,
          error: error.message
        }
      }
    })
    
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
    
    console.log(\`Processed batch \${Math.floor(i / batchSize) + 1}\`)
    
    // Rate limiting
    if (i + batchSize < signatures.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return results
}

// Usage
const signatures = ['sig1...', 'sig2...', 'sig3...']
const decodedTransactions = await decodeMultipleTransactions(signatures)`

  const advancedAnalysisCode = `// Advanced Transaction Analysis
class TransactionAnalyzer {
  private sdk: GorbchainSDK
  
  constructor(sdk: GorbchainSDK) {
    this.sdk = sdk
  }
  
  async analyzeTransactionFlow(signature: string) {
    const transaction = await this.sdk.getAndDecodeTransaction(signature, {
      richDecoding: true,
      includeTokenMetadata: true
    })
    
    const analysis = {
      summary: this.generateSummary(transaction),
      tokenTransfers: this.extractTokenTransfers(transaction),
      programInteractions: this.analyzePrograms(transaction),
      accountActivity: this.analyzeAccounts(transaction),
      gasAnalysis: this.analyzeGas(transaction)
    }
    
    return analysis
  }
  
  private generateSummary(transaction: any) {
    const instructionTypes = transaction.instructions.map(i => i.action)
    
    return {
      status: transaction.status,
      instructionCount: transaction.instructions.length,
      uniquePrograms: transaction.summary.programsUsed.length,
      complexity: this.calculateComplexity(instructionTypes),
      category: this.categorizeTransaction(instructionTypes)
    }
  }
  
  private extractTokenTransfers(transaction: any) {
    const transfers = []
    
    transaction.instructions.forEach((instruction, index) => {
      const decoded = this.sdk.decodeInstruction(instruction)
      
      if (['transfer', 'transferChecked'].includes(decoded.instructionName)) {
        transfers.push({
          index,
          program: decoded.programName,
          amount: decoded.data?.amount,
          source: decoded.accounts?.source,
          destination: decoded.accounts?.destination,
          mint: decoded.accounts?.mint
        })
      }
    })
    
    return transfers
  }
  
  private analyzePrograms(transaction: any) {
    const programUsage = new Map()
    
    transaction.instructions.forEach(instruction => {
      const decoded = this.sdk.decodeInstruction(instruction)
      const count = programUsage.get(decoded.programName) || 0
      programUsage.set(decoded.programName, count + 1)
    })
    
    return Array.from(programUsage.entries()).map(([program, count]) => ({
      program,
      instructionCount: count,
      category: this.categorizePprogram(program)
    }))
  }
  
  private analyzeAccounts(transaction: any) {
    const accountActivity = new Map()
    
    transaction.instructions.forEach(instruction => {
      instruction.accounts.forEach(account => {
        if (!accountActivity.has(account)) {
          accountActivity.set(account, {
            reads: 0,
            writes: 0,
            signers: 0
          })
        }
        
        const activity = accountActivity.get(account)
        activity.reads++
        
        // You would analyze account metadata to determine writes/signers
        // This is simplified for the example
      })
    })
    
    return Array.from(accountActivity.entries()).map(([account, activity]) => ({
      account,
      ...activity
    }))
  }
  
  private analyzeGas(transaction: any) {
    return {
      totalFee: transaction.meta?.fee || 0,
      computeUnitsUsed: transaction.meta?.computeUnitsConsumed || 0,
      efficiency: this.calculateEfficiency(transaction)
    }
  }
  
  private calculateComplexity(instructions: string[]) {
    // Simplified complexity calculation
    const weights = {
      'transfer': 1,
      'createAccount': 3,
      'initializeMint': 5,
      'swap': 8
    }
    
    return instructions.reduce((total, inst) => total + (weights[inst] || 2), 0)
  }
  
  private categorizeTransaction(instructions: string[]) {
    if (instructions.some(i => i.includes('swap'))) return 'DeFi'
    if (instructions.some(i => i.includes('mint'))) return 'Token Creation'
    if (instructions.some(i => i.includes('transfer'))) return 'Transfer'
    return 'Other'
  }
  
  private categorizeProgram(program: string) {
    const categories = {
      'SPL Token': 'Token',
      'Token-2022': 'Token',
      'System Program': 'System',
      'Metaplex Core': 'NFT',
      'Associated Token Account': 'Token',
      'Orca': 'DeFi',
      'Raydium': 'DeFi'
    }
    
    return categories[program] || 'Custom'
  }
  
  private calculateEfficiency(transaction: any) {
    const fee = transaction.meta?.fee || 0
    const instructionCount = transaction.instructions.length
    return instructionCount > 0 ? fee / instructionCount : 0
  }
}

// Usage
const analyzer = new TransactionAnalyzer(sdk)
const analysis = await analyzer.analyzeTransactionFlow('signature')
console.log('Transaction Analysis:', analysis)`

  const supportedPrograms = [
    {
      name: 'System Program',
      id: '11111111111111111111111111111111',
      category: 'Core',
      instructions: ['createAccount', 'allocate', 'assign', 'transfer', 'createAccountWithSeed'],
      description: 'Core Solana system operations'
    },
    {
      name: 'SPL Token',
      id: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      category: 'Token',
      instructions: ['transfer', 'mintTo', 'burn', 'initializeMint', 'initializeAccount', 'approve'],
      description: 'Standard SPL token operations'
    },
    {
      name: 'Token-2022',
      id: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
      category: 'Token',
      instructions: ['transfer', 'transferChecked', 'mintTo', 'burn', 'initializeMint', 'reallocate'],
      description: 'Enhanced token program with additional features'
    },
    {
      name: 'Associated Token Account',
      id: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
      category: 'Token',
      instructions: ['create', 'createIdempotent'],
      description: 'Associated token account management'
    },
    {
      name: 'Metaplex Core',
      id: 'MetaXBxVGQ65bF5QVWsRxYLVYxE8PFJrMLAojEbhUwz',
      category: 'NFT',
      instructions: ['createMetadata', 'updateMetadata', 'verifyCreator', 'createMasterEdition'],
      description: 'NFT metadata and collection management'
    },
    {
      name: 'Name Service',
      id: 'namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX',
      category: 'Identity',
      instructions: ['create', 'update', 'transfer'],
      description: 'Solana name service operations'
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-docs-heading mb-4">Transaction Decoding</h1>
        <p className="text-lg text-gray-600 mb-6">
          Learn how to decode blockchain transactions and understand instruction data using 
          the Gorbchain SDK's comprehensive decoder registry.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">🔍 Rich Transaction Analysis</h3>
          <p className="text-sm text-blue-800">
            The SDK automatically decodes instructions from 12+ programs, providing human-readable 
            descriptions, parsed data, and account relationships for comprehensive transaction analysis.
          </p>
        </div>
      </div>

      {/* Overview */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">How Transaction Decoding Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <WifiIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-docs-heading mb-2">1. Fetch Transaction</h3>
            <p className="text-sm text-gray-600">
              Retrieve transaction data from the blockchain with all instructions and metadata
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CodeBracketIcon className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-docs-heading mb-2">2. Decode Instructions</h3>
            <p className="text-sm text-gray-600">
              Use program-specific decoders to parse instruction data into human-readable format
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <ShieldCheckIcon className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-docs-heading mb-2">3. Enrich Metadata</h3>
            <p className="text-sm text-gray-600">
              Add token metadata, account relationships, and program identification
            </p>
          </div>
        </div>
      </div>

      {/* Basic Decoding */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">Basic Transaction Decoding</h2>
        <p className="text-gray-600 mb-4">
          Start with the main decoding function to analyze any transaction:
        </p>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-docs-heading">Example</h3>
            <button
              onClick={() => copyToClipboard(basicDecodingCode, 'basic')}
              className="flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-md"
            >
              <DocumentDuplicateIcon className="w-4 h-4" />
              <span>{copied['basic'] ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <CodeBlock
            code={basicDecodingCode}
            language="typescript"
            title="Basic Transaction Decoding"
            id="basic-decoding"
            onCopy={() => {}}
            copied={false}
          />
        </div>
      </div>

      {/* Instruction Decoding */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">Individual Instruction Decoding</h2>
        <p className="text-gray-600 mb-4">
          Decode specific instructions for detailed analysis:
        </p>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-docs-heading">Example</h3>
            <button
              onClick={() => copyToClipboard(instructionDecodingCode, 'instruction')}
              className="flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-md"
            >
              <DocumentDuplicateIcon className="w-4 h-4" />
              <span>{copied['instruction'] ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <CodeBlock
            code={instructionDecodingCode}
            language="typescript"
            title="Instruction Decoding"
            id="instruction-decoding"
            onCopy={() => {}}
            copied={false}
          />
        </div>
      </div>

      {/* Supported Programs */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-6">Supported Programs</h2>
        <p className="text-gray-600 mb-6">
          The SDK includes built-in decoders for these Solana programs:
        </p>
        <div className="space-y-4">
          {supportedPrograms.map((program) => (
            <div key={program.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-docs-heading">{program.name}</h3>
                  <p className="text-sm text-gray-600">{program.description}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  program.category === 'Core' ? 'bg-blue-100 text-blue-800' :
                  program.category === 'Token' ? 'bg-green-100 text-green-800' :
                  program.category === 'NFT' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {program.category}
                </div>
              </div>
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Program ID:</h4>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">{program.id}</code>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Supported Instructions:</h4>
                <div className="flex flex-wrap gap-2">
                  {program.instructions.map((instruction) => (
                    <span
                      key={instruction}
                      className="px-2 py-1 bg-gray-50 text-gray-700 text-xs rounded border"
                    >
                      {instruction}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decoder Registry */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">Decoder Registry</h2>
        <p className="text-gray-600 mb-4">
          Manage decoders and add support for custom programs:
        </p>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-docs-heading">Registry Management</h3>
            <button
              onClick={() => copyToClipboard(decoderRegistryCode, 'registry')}
              className="flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-md"
            >
              <DocumentDuplicateIcon className="w-4 h-4" />
              <span>{copied['registry'] ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <CodeBlock
            code={decoderRegistryCode}
            language="typescript"
            title="Decoder Registry"
            id="decoder-registry"
            onCopy={() => {}}
            copied={false}
          />
        </div>
      </div>

      {/* Batch Decoding */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">Batch Transaction Decoding</h2>
        <p className="text-gray-600 mb-4">
          Efficiently decode multiple transactions with rate limiting:
        </p>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-docs-heading">Batch Processing</h3>
            <button
              onClick={() => copyToClipboard(batchDecodingCode, 'batch')}
              className="flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-md"
            >
              <DocumentDuplicateIcon className="w-4 h-4" />
              <span>{copied['batch'] ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <CodeBlock
            code={batchDecodingCode}
            language="typescript"
            title="Batch Decoding"
            id="batch-decoding"
            onCopy={() => {}}
            copied={false}
          />
        </div>
      </div>

      {/* Advanced Analysis */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">Advanced Transaction Analysis</h2>
        <p className="text-gray-600 mb-4">
          Build comprehensive transaction analysis tools:
        </p>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-docs-heading">Transaction Analyzer Class</h3>
            <button
              onClick={() => copyToClipboard(advancedAnalysisCode, 'advanced')}
              className="flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-md"
            >
              <DocumentDuplicateIcon className="w-4 h-4" />
              <span>{copied['advanced'] ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <CodeBlock
            code={advancedAnalysisCode}
            language="typescript"
            title="Advanced Analysis"
            id="advanced-analysis"
            onCopy={() => {}}
            copied={false}
          />
        </div>
        <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h4 className="font-medium text-purple-900 mb-2">🚀 Production-Ready Pattern</h4>
          <p className="text-sm text-purple-800">
            This analyzer class demonstrates how to build comprehensive transaction analysis tools 
            suitable for blockchain explorers, portfolio trackers, and compliance systems.
          </p>
        </div>
      </div>

      {/* Best Practices */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">Best Practices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-docs-heading mb-3">Performance</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Use batch processing for multiple transactions</li>
              <li>• Cache decoded results for repeated analysis</li>
              <li>• Implement rate limiting (5 RPS recommended)</li>
              <li>• Use rich decoding selectively for performance</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-docs-heading mb-3">Error Handling</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Handle TransactionNotFoundError gracefully</li>
              <li>• Fall back to raw data when decoders fail</li>
              <li>• Retry failed network requests</li>
              <li>• Log unknown instruction types for analysis</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-docs-heading mb-3">Custom Decoders</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Register decoders early in application lifecycle</li>
              <li>• Validate instruction data before parsing</li>
              <li>• Provide fallback for unknown instructions</li>
              <li>• Test decoders with real transaction data</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-docs-heading mb-3">Data Quality</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Verify transaction finality before analysis</li>
              <li>• Handle failed transactions appropriately</li>
              <li>• Validate decoded data structure</li>
              <li>• Monitor decoder success rates</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Resources */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-docs-heading mb-4 text-center">
          🔧 Ready to Decode?
        </h2>
        <p className="text-gray-600 text-center mb-6">
          Start building transaction analysis tools with the comprehensive decoding capabilities 
          of the Gorbchain SDK.
        </p>
        <div className="flex justify-center space-x-4">
          <a 
            href="/playground" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>Try in Playground</span>
          </a>
          <a 
            href="/examples" 
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span>View More Examples</span>
          </a>
        </div>
      </div>
    </div>
  )
} 