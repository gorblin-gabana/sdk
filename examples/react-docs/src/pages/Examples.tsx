import { useState } from 'react'
import CodeBlock from '../components/CodeBlock'
import { 
  CubeIcon,
  WifiIcon,
  ShieldCheckIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

export default function Examples() {
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({})
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['basic']))

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopied(prev => ({ ...prev, [id]: true }))
    setTimeout(() => {
      setCopied(prev => ({ ...prev, [id]: false }))
    }, 2000)
  }

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const initializationCode = `// Basic SDK setup
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode'

const sdk = new GorbchainSDK({
  rpcEndpoint: 'https://rpc.gorbchain.xyz',
  network: 'custom',
  timeout: 30000,
  retries: 3,
  // Enable rich decoding for enhanced transaction analysis
  richDecoding: {
    enabled: true,
    includeTokenMetadata: true,
    includeNftMetadata: true,
    maxConcurrentRequests: 10,
    enableCache: true
  }
})

// Check network connectivity
const health = await sdk.getNetworkHealth()
if (health.status !== 'healthy') {
  console.warn('Network issues detected:', health)
}

// Now all getAndDecodeTransaction calls will automatically include
// rich metadata without requiring additional parameters!`

  const transactionAnalysisCode = `// Transaction Analysis Workflow
import { GorbchainSDK, RpcNetworkError, TransactionNotFoundError, NetworkConnectionError } from '@gorbchain-xyz/chaindecode'
import { PublicKey } from '@solana/web3.js'

async function analyzeTransaction(signature: string) {
  try {
    // Decode transaction with rich metadata (automatically fetches token metadata)
    const transaction = await sdk.getAndDecodeTransaction(signature, {
      richDecoding: true,
      includeTokenMetadata: true
    })

    console.log('📊 Transaction Analysis:')
    console.log('Status:', transaction.status)
    console.log('Type:', transaction.summary.type)
    console.log('Description:', transaction.summary.description)
    console.log('Fee:', transaction.fee, 'lamports')
    console.log('Instructions:', transaction.instructions.length)
    console.log('Programs used:', transaction.summary.programsUsed)
    console.log('Compute units:', transaction.summary.computeUnits)
    
    // Token information available automatically
    if (transaction.tokens) {
      console.log('\\n🪙 Token Information:')
      console.log('Operations:', transaction.tokens.operations.length)
      
      // Token operations analysis
      transaction.tokens.operations.forEach((op: any, index: number) => {
        console.log(\`Operation \${index + 1}: \${op.action}\`)
        console.log(\`  Type: \${op.type}\`)
        console.log(\`  Program: \${op.program}\`)
        if (op.data) console.log(\`  Data: \${JSON.stringify(op.data)}\`)
      })
      
      // Token transfers
      if (transaction.tokens.transferred) {
        console.log('\\n💸 Token Transfers:')
        transaction.tokens.transferred.forEach((transfer: any) => {
          console.log(\`  \${transfer.amount} \${transfer.tokenSymbol || 'tokens'} from \${transfer.from} to \${transfer.to}\`)
        })
      }
      
      // Created tokens
      if (transaction.tokens.created) {
        console.log('\\n🆕 Created Tokens:')
        transaction.tokens.created.forEach((token: any) => {
          console.log(\`  \${token.name} (\${token.symbol}) - \${token.mint}\`)
        })
      }
    }
    
    // Account changes
    if (transaction.accountChanges) {
      console.log('\\n📊 Account Changes:')
      if (transaction.accountChanges.solTransfers) {
        console.log('SOL Transfers:')
        transaction.accountChanges.solTransfers.forEach((transfer: any) => {
          console.log(\`  \${transfer.amount} SOL from \${transfer.from} to \${transfer.to}\`)
        })
      }
    }
    
    // Analyze each instruction
    transaction.instructions.forEach((instruction, index) => {
      console.log(\`\${index + 1}. \${instruction.program}: \${instruction.action}\`)
      console.log('   Description:', instruction.description)
      
      if (instruction.data) {
        console.log('   Data:', instruction.data)
      }
    })

    return {
      success: true,
      transactionType: transaction.summary.type,
      description: transaction.summary.description,
      fee: transaction.fee,
      instructionCount: transaction.instructions.length,
      programs: transaction.summary.programsUsed,
      computeUnits: transaction.summary.computeUnits,
      tokenOperations: transaction.tokens?.operations.length || 0
    }

  } catch (error) {
    if (error instanceof TransactionNotFoundError) {
      console.log('Transaction not found - may not be finalized yet')
      return { success: false, reason: 'not_found' }
    } else if (error instanceof RpcNetworkError) {
      console.log('Network error - retrying automatically')
      throw error // Let SDK handle retry
    } else {
      console.error('Unexpected error:', error)
      return { success: false, reason: 'unknown', error }
    }
  }
}

// Usage with a real transaction that has token metadata
const result = await analyzeTransaction('5Nm3CvXWYjDaeVPTXifXHFzpovVZo6pLQdMfZoBjBjHM8rHehcfT97MYTQv528LwrNDWDtwZeW5FoUK9z3vE4ABM')`

  const tokenCreationCode = `// Token Creation with Validation
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode'

async function createTokenSafely(params: {
  name: string
  symbol: string
  decimals: number
  supply: number
  walletPublicKey: string
}) {
  // 1. Estimate costs
  const costEstimate = await sdk.estimateTokenCreationCost({
    name: params.name,
    symbol: params.symbol,
    supply: params.supply,
    decimals: params.decimals
  })

  console.log('💰 Estimated cost:', costEstimate, 'SOL')

  // 2. Check wallet balance
  const balanceCheck = await sdk.checkSufficientBalance(
    new PublicKey(params.walletPublicKey),
    costEstimate + 0.001 // Buffer for fees
  )

  if (!balanceCheck.sufficient) {
    throw new Error(\`Insufficient balance. Need \${balanceCheck.required / 1e9} SOL, have \${balanceCheck.balance / 1e9} SOL\`)
  }

  // 3. Create token
  console.log('🪙 Creating token...')
  const result = await sdk.createToken22TwoTx(
    payer, // Keypair object
    {
      name: params.name,
      symbol: params.symbol,
      decimals: params.decimals,
      supply: params.supply
    }
  )

  console.log('✅ Token created successfully!')
  console.log('Token address:', result.tokenAddress)
  console.log('Associated token address:', result.associatedTokenAddress)
  console.log('Transaction signature:', result.signature)

  return result
}

// Usage
const tokenResult = await createTokenSafely({
  name: 'My Project Token',
  symbol: 'MPT',
  decimals: 6,
  supply: 1000000,
  walletPublicKey: 'your-wallet-address'
})`

  const nftCreationCode = `// NFT Creation with Metadata
async function createNFTWithMetadata(params: {
  name: string
  description: string
  image: string
  attributes?: Array<{ trait_type: string; value: string }>
  externalUrl?: string
}) {
  // 1. Prepare metadata
  const metadata = {
    name: params.name,
    description: params.description,
    image: params.image,
    attributes: params.attributes || [],
    external_url: params.externalUrl,
    properties: {
      category: 'image',
      files: [{ uri: params.image, type: 'image/png' }]
    }
  }

  // 2. Upload metadata (you'll need to implement this)
  const metadataUri = await uploadMetadata(metadata)
  console.log('📄 Metadata uploaded to:', metadataUri)

  // 3. Create NFT
  const result = await sdk.createNFT(
    wallet, // Wallet adapter
    {
      name: params.name,
      uri: metadataUri,
      description: params.description,
      royaltyBasisPoints: 500 // 5% royalty
    }
  )

  console.log('🎨 NFT created successfully!')
  console.log('Asset address:', result.assetAddress)
  console.log('Transaction signature:', result.signature)

  return result
}

// Mock upload function (replace with your storage solution)
async function uploadMetadata(metadata: any): Promise<string> {
  // Upload to IPFS, Arweave, or your preferred storage
  // This is just a placeholder
  return 'https://your-storage.com/metadata.json'
}

// Usage
const nftResult = await createNFTWithMetadata({
  name: 'My Cool NFT',
  description: 'This is an awesome NFT created with Gorbchain SDK',
  image: 'https://your-storage.com/image.png',
  attributes: [
    { trait_type: 'Rarity', value: 'Legendary' },
    { trait_type: 'Power', value: '100' }
  ]
})`

  const batchOperationsCode = `// Batch Operations for Efficiency
async function processBatchTransactions(signatures: string[]) {
  console.log(\`🔄 Processing \${signatures.length} transactions...\`)

  // Process in batches to avoid rate limits
  const batchSize = 5
  const results = []

  for (let i = 0; i < signatures.length; i += batchSize) {
    const batch = signatures.slice(i, i + batchSize)
    
    // Process batch concurrently
    const batchPromises = batch.map(async (signature) => {
      try {
        const transaction = await sdk.getAndDecodeTransaction(signature, {
          richDecoding: true,
          includeTokenMetadata: true
        })
        return {
          signature,
          success: true,
          fee: transaction.fee || 0,
          instructionCount: transaction.instructions.length,
          transactionType: transaction.summary.type,
          tokenOperations: transaction.tokens?.operations.length || 0,
          computeUnits: transaction.summary.computeUnits || 0
        }
      } catch (error) {
        return {
          signature,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
    
    console.log(\`Processed batch \${Math.floor(i / batchSize) + 1}/\${Math.ceil(signatures.length / batchSize)}\`)
    
    // Add delay between batches to respect rate limits
    if (i + batchSize < signatures.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  
  console.log(\`✅ Processed: \${successful.length} successful, \${failed.length} failed\`)
  
  // Enhanced batch summary
  const totalFees = successful.reduce((sum, r) => sum + r.fee, 0)
  const totalComputeUnits = successful.reduce((sum, r) => sum + r.computeUnits, 0)
  const totalTokenOperations = successful.reduce((sum, r) => sum + r.tokenOperations, 0)
  const transactionTypes = successful.reduce((types, r) => {
    types[r.transactionType] = (types[r.transactionType] || 0) + 1
    return types
  }, {} as Record<string, number>)
  
  console.log(\`💰 Total fees: \${totalFees} lamports\`)
  console.log(\`⚡ Total compute units: \${totalComputeUnits}\`)
  console.log(\`🪙 Total token operations: \${totalTokenOperations}\`)
  console.log('📊 Transaction types:', transactionTypes)
  
  return {
    successful,
    failed,
    totalFees,
    totalComputeUnits,
    totalTokenOperations,
    transactionTypes
  }
}

// Usage with real transaction signatures
const signatures = [
  '5Nm3CvXWYjDaeVPTXifXHFzpovVZo6pLQdMfZoBjBjHM8rHehcfT97MYTQv528LwrNDWDtwZeW5FoUK9z3vE4ABM',
  '3K7XxugEXv8CBQCaL1ZYB7cgYiCGE4THakb23hw3Ltv1XsYDCNctCEivhwCLvtyrfo3gsS9tS3CPqX6kYTe4WqZn',
  '2QhjK8Xr9QAb7G8K4mfCp3DdnJ7VvTrYbqR8Fg2N5HjLmW9Q'
]
const batchResult = await processBatchTransactions(signatures)`

  const tokenHoldingsCode = `// Token Holdings Analyzer - Get All Tokens for an Address
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode'
import { PublicKey } from '@solana/web3.js'

class TokenHoldingsAnalyzer {
  private sdk: GorbchainSDK
  private rpcClient: any

  constructor(sdk: GorbchainSDK) {
    this.sdk = sdk
    this.rpcClient = sdk.getRpcClient()
  }

  async getAllTokenHoldings(walletAddress: string) {
    console.log(\`🔍 Analyzing token holdings for: \${walletAddress}\`)
    
    try {
      // Get all token accounts owned by the address
      const tokenAccounts = await this.rpcClient.getTokenAccountsByOwner(
        walletAddress,
        { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' }, // SPL Token Program
        'confirmed'
      )

      // Also get Token-2022 accounts
      const token2022Accounts = await this.rpcClient.getTokenAccountsByOwner(
        walletAddress,
        { programId: 'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn' }, // Token-2022 Program
        'confirmed'
      )

      const allTokenAccounts = [...tokenAccounts, ...token2022Accounts]
      console.log(\`📊 Found \${allTokenAccounts.length} token accounts\`)

      const holdings = []
      const processedMints = new Set()

      // Process each token account
      for (const accountInfo of allTokenAccounts) {
        try {
          // Get detailed token account info
          const tokenAccountData = await this.rpcClient.getTokenAccountInfo(
            accountInfo.pubkey,
            'confirmed'
          )

          if (!tokenAccountData || !tokenAccountData.tokenAmount) {
            continue
          }

          const { mint, tokenAmount } = tokenAccountData
          
          // Skip if we already processed this mint
          if (processedMints.has(mint)) {
            continue
          }
          processedMints.add(mint)

          // Skip accounts with zero balance
          if (parseFloat(tokenAmount.amount) === 0) {
            continue
          }

          // Get comprehensive token info including metadata
          const tokenInfo = await this.rpcClient.getTokenInfo(mint)
          
          const holding = {
            mint: mint,
            tokenAccount: accountInfo.pubkey,
            balance: {
              raw: tokenAmount.amount,
              decimal: tokenAmount.uiAmount,
              formatted: tokenAmount.uiAmountString
            },
            decimals: tokenAmount.decimals,
            isNFT: tokenInfo?.isNFT || false,
            metadata: tokenInfo?.metadata || null,
            mintInfo: {
              supply: tokenInfo?.supply,
              mintAuthority: tokenInfo?.mintAuthority,
              freezeAuthority: tokenInfo?.freezeAuthority,
              isInitialized: tokenInfo?.isInitialized
            }
          }

          holdings.push(holding)
          
          console.log(\`  🪙 \${holding.metadata?.name || mint}: \${holding.balance.formatted} \${holding.metadata?.symbol || 'tokens'}\`)
          
                 } catch (error: any) {
           console.warn(\`⚠️  Error processing token account \${accountInfo.pubkey}:\`, error.message)
         }
      }

             // Sort holdings: NFTs first, then by balance value
       holdings.sort((a: any, b: any) => {
         if (a.isNFT && !b.isNFT) return -1
         if (!a.isNFT && b.isNFT) return 1
         return parseFloat(b.balance.decimal || '0') - parseFloat(a.balance.decimal || '0')
       })

      const summary = {
        totalTokens: holdings.length,
        totalNFTs: holdings.filter(h => h.isNFT).length,
        totalFungibleTokens: holdings.filter(h => !h.isNFT).length,
        uniqueMints: processedMints.size,
        hasMetadata: holdings.filter(h => h.metadata).length
      }

             console.log(\`\\n📈 Portfolio Summary:\`)
       console.log(\`  Total Holdings: \${summary.totalTokens}\`)
       console.log(\`  NFTs: \${summary.totalNFTs}\`)
       console.log(\`  Fungible Tokens: \${summary.totalFungibleTokens}\`)
       console.log(\`  With Metadata: \${summary.hasMetadata}\`)

      return {
        walletAddress,
        holdings,
        summary,
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      console.error('❌ Error fetching token holdings:', error)
      throw error
    }
  }

  async getTokensByCategory(walletAddress: string) {
    const allHoldings = await this.getAllTokenHoldings(walletAddress)
    
    return {
      nfts: allHoldings.holdings.filter(h => h.isNFT),
      fungibleTokens: allHoldings.holdings.filter(h => !h.isNFT && h.metadata),
      unknownTokens: allHoldings.holdings.filter(h => !h.isNFT && !h.metadata),
      summary: allHoldings.summary
    }
  }

  async getTopHoldings(walletAddress: string, limit: number = 10) {
    const allHoldings = await this.getAllTokenHoldings(walletAddress)
    
    return {
      topByBalance: allHoldings.holdings
        .filter(h => !h.isNFT)
        .slice(0, limit),
      allNFTs: allHoldings.holdings.filter(h => h.isNFT),
      summary: allHoldings.summary
    }
  }
}

// Usage Examples
const analyzer = new TokenHoldingsAnalyzer(sdk)

// Get all token holdings
const allHoldings = await analyzer.getAllTokenHoldings('wallet-address-here')

// Get categorized holdings
const categorized = await analyzer.getTokensByCategory('wallet-address-here')
console.log('NFTs:', categorized.nfts.length)
console.log('Fungible Tokens:', categorized.fungibleTokens.length)

// Get top holdings
const topHoldings = await analyzer.getTopHoldings('wallet-address-here', 5)`

  const simpleTokenHoldingsCode = `// Simple Token Holdings Example
async function getWalletTokens(walletAddress: string) {
  const rpcClient = sdk.getRpcClient()
  
  try {
    // Get all SPL token accounts
    const tokenAccounts = await rpcClient.getTokenAccountsByOwner(
      walletAddress,
      { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' }
    )

    console.log(\`Found \${tokenAccounts.length} token accounts\`)

    const tokens = []

    for (const account of tokenAccounts) {
      // Get token account details
      const tokenData = await rpcClient.getTokenAccountInfo(account.pubkey)
      
      if (tokenData && parseFloat(tokenData.tokenAmount.amount) > 0) {
        // Get token metadata
        const tokenInfo = await rpcClient.getTokenInfo(tokenData.mint)
        
        tokens.push({
          mint: tokenData.mint,
          account: account.pubkey,
          balance: tokenData.tokenAmount.uiAmountString,
          decimals: tokenData.tokenAmount.decimals,
          name: tokenInfo?.metadata?.name || 'Unknown',
          symbol: tokenInfo?.metadata?.symbol || 'UNKNOWN',
          isNFT: tokenInfo?.isNFT || false
        })
      }
    }

    return tokens
  } catch (error) {
    console.error('Error fetching tokens:', error)
    return []
  }
}

// Usage
const walletTokens = await getWalletTokens('your-wallet-address')
walletTokens.forEach(token => {
  console.log(\`\${token.name} (\${token.symbol}): \${token.balance}\`)
})`

  const portfolioAnalyzerCode = `// Portfolio Analyzer - Real-world Application
class PortfolioAnalyzer {
  private sdk: GorbchainSDK

  constructor(sdk: GorbchainSDK) {
    this.sdk = sdk
  }

  async analyzeWalletActivity(walletAddress: string, days: number = 30) {
    console.log(\`📈 Analyzing portfolio for \${walletAddress}\`)
    
    try {
      // Get recent transactions (you'd implement this with RPC calls)
      const signatures = await this.getRecentSignatures(walletAddress, days)
      
      const portfolio = {
        totalTransactions: 0,
        totalFees: 0,
        totalComputeUnits: 0,
        programUsage: new Map<string, number>(),
        tokenTransfers: 0,
        totalTokenOperations: 0,
        totalTokenValue: 0,
        nftActivity: 0,
        defiActivity: 0
      }

      // Analyze each transaction with enhanced metadata
      for (const signature of signatures) {
        try {
          const transaction = await this.sdk.getAndDecodeTransaction(signature, {
            richDecoding: true,
            includeTokenMetadata: true
          })
          
          portfolio.totalTransactions++
          portfolio.totalFees += transaction.fee || 0

          // Use enhanced analysis if available
          if (transaction.analysis) {
            portfolio.totalComputeUnits += transaction.analysis.computeUnitsUsed || 0
            
            // Count program usage from enhanced analysis
            transaction.analysis.programNames.forEach(programName => {
              const count = portfolio.programUsage.get(programName) || 0
              portfolio.programUsage.set(programName, count + 1)
            })

            // Use transaction type classification
            switch (transaction.transactionType) {
              case 'Token Transaction':
                portfolio.tokenTransfers++
                if (transaction.tokenInfo) {
                  portfolio.totalTokenOperations += transaction.tokenInfo.operations.length
                  portfolio.totalTokenValue += transaction.tokenInfo.totalValue || 0
                }
                break
              case 'NFT Transaction':
                portfolio.nftActivity++
                break
              case 'DeFi Transaction':
                portfolio.defiActivity++
                break
            }
          } else {
            // Fallback to instruction-level analysis
            transaction.instructions.forEach(instruction => {
              const count = portfolio.programUsage.get(instruction.programName) || 0
              portfolio.programUsage.set(instruction.programName, count + 1)

              // Categorize activity
              switch (instruction.programName) {
                case 'SPL Token':
                case 'Token-2022':
                  portfolio.tokenTransfers++
                  break
                case 'Metaplex Core':
                  portfolio.nftActivity++
                  break
                case 'Orca':
                case 'Raydium':
                  portfolio.defiActivity++
                  break
              }
            })
          }

        } catch (error) {
          console.warn(\`Failed to analyze transaction \${signature}:, error\`)
        }
      }

      return this.formatPortfolioReport(portfolio)
      
    } catch (error) {
      console.error('Portfolio analysis failed:', error)
      throw error
    }
  }

  private async getRecentSignatures(address: string, days: number): Promise<string[]> {
    // Implementation would use RPC to get transaction signatures
    // This is a placeholder
    const rpcClient = this.sdk.getRpcClient()
    
    // In real implementation, you'd paginate through signatures
    const response = await rpcClient.request('getSignaturesForAddress', [
      address,
      { limit: 1000 }
    ])
    
    return response.value.map((sig: any) => sig.signature)
  }

  private formatPortfolioReport(portfolio: any) {
    console.log('📊 Portfolio Report:')
    console.log(\`Total Transactions: \${portfolio.totalTransactions}\`)
    console.log(\`Total Fees Paid: \${portfolio.totalFees} lamports\`)
    console.log(\`Total Compute Units: \${portfolio.totalComputeUnits}\`)
    console.log(\`Token Transfers: \${portfolio.tokenTransfers}\`)
    console.log(\`Token Operations: \${portfolio.totalTokenOperations}\`)
    console.log(\`Total Token Value: \${portfolio.totalTokenValue}\`)
    console.log(\`NFT Activity: \${portfolio.nftActivity}\`)
    console.log(\`DeFi Activity: \${portfolio.defiActivity}\`)
    
    console.log('\\nProgram Usage:')
    Array.from(portfolio.programUsage.entries())
      .sort(([,a], [,b]) => b - a)
      .forEach(([program, count]) => {
        console.log(\`  \${program}: \${count} transactions\`)
      })

    return portfolio
  }
}

// Usage
const analyzer = new PortfolioAnalyzer(sdk)
const portfolio = await analyzer.analyzeWalletActivity('wallet-address', 30)`

  const errorHandlingCode = `// Comprehensive Error Handling Strategy
import { 
  RpcNetworkError,
  RpcTimeoutError,
  TransactionNotFoundError,
  DecoderNotFoundError,
  InvalidAddressError
} from '@gorbchain-xyz/chaindecode'

class SDKOperations {
  private sdk: GorbchainSDK
  private maxRetries = 3

  constructor(sdk: GorbchainSDK) {
    this.sdk = sdk
  }

  async safeDecodeTransaction(signature: string) {
    let attempts = 0
    
    while (attempts < this.maxRetries) {
      try {
        return await this.sdk.getAndDecodeTransaction(signature)
      } catch (error) {
        attempts++
        
        if (error instanceof TransactionNotFoundError) {
          console.log(\`Transaction \${signature} not found\`)
          return null
        } else if (error instanceof DecoderNotFoundError) {
          console.log('Decoder not found - returning raw transaction data')
          // Return with limited decoding
          return await this.sdk.getAndDecodeTransaction(signature, { 
            richDecoding: false 
          })
        } else if (error instanceof RpcNetworkError || error instanceof RpcTimeoutError) {
          console.log(\`Network error (attempt \${attempts}/\${this.maxRetries})\`)
          if (attempts === this.maxRetries) {
            throw new Error(\`Failed after \${this.maxRetries} attempts: \${error.message}\`)
          }
          // Exponential backoff
          await this.delay(Math.pow(2, attempts) * 1000)
        } else if (error instanceof InvalidAddressError) {
          console.error('Invalid address provided:', signature)
          throw error
        } else {
          console.error('Unexpected error:', error)
          throw error
        }
      }
    }
  }

  async safeTokenCreation(params: any) {
    try {
      // Pre-flight checks
      await this.performPreFlightChecks(params)
      
      // Attempt creation
      return await this.sdk.createToken22TwoTx(params)
      
    } catch (error) {
      return this.handleTokenCreationError(error, params)
    }
  }

  private async performPreFlightChecks(params: any) {
    // Check network health
    const health = await this.sdk.getNetworkHealth()
    if (health.status !== 'healthy') {
      throw new Error(\`Network unhealthy: \${health.status}\`)
    }

    // Validate parameters
    if (!params.name || params.name.length > 32) {
      throw new InvalidAddressError('Token name must be 1-32 characters')
    }

    if (!params.symbol || params.symbol.length > 10) {
      throw new InvalidAddressError('Token symbol must be 1-10 characters')
    }
  }

  private handleTokenCreationError(error: any, params: any) {
    if (error instanceof RpcNetworkError) {
      return {
        success: false,
        error: 'Network connectivity issues. Please try again later.',
        retryable: true
      }
    } else if (error.message.includes('insufficient funds')) {
      return {
        success: false,
        error: 'Insufficient SOL balance for token creation.',
        retryable: false,
        estimatedCost: 0.002 // Could get from estimation
      }
    } else {
      return {
        success: false,
        error: \`Token creation failed: \${error.message}\`,
        retryable: false
      }
    }
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Usage
const operations = new SDKOperations(sdk)
const result = await operations.safeDecodeTransaction('signature')
const tokenResult = await operations.safeTokenCreation({
  name: 'Test Token',
  symbol: 'TEST',
  decimals: 6,
  supply: 1000000
})`

  const examples = [
    {
      id: 'basic',
      title: 'Basic SDK Setup',
      description: 'Initialize the SDK and check network health',
      icon: <CubeIcon className="w-5 h-5" />,
      color: 'blue',
      code: initializationCode
    },
    {
      id: 'transaction',
      title: 'Transaction Analysis',
      description: 'Decode and analyze blockchain transactions',
      icon: <WifiIcon className="w-5 h-5" />,
      color: 'green',
      code: transactionAnalysisCode
    },
    {
      id: 'token',
      title: 'Safe Token Creation',
      description: 'Create tokens with validation and cost estimation',
      icon: <ShieldCheckIcon className="w-5 h-5" />,
      color: 'purple',
      code: tokenCreationCode
    },
    {
      id: 'nft',
      title: 'NFT Creation with Metadata',
      description: 'Create NFTs with rich metadata and attributes',
      icon: <ClockIcon className="w-5 h-5" />,
      color: 'orange',
      code: nftCreationCode
    },
    {
      id: 'batch',
      title: 'Batch Operations',
      description: 'Process multiple transactions efficiently',
      icon: <CubeIcon className="w-5 h-5" />,
      color: 'indigo',
      code: batchOperationsCode
    },
    {
      id: 'token-holdings',
      title: 'Token Holdings Analyzer',
      description: 'Get all token holdings for any wallet address',
      icon: <WifiIcon className="w-5 h-5" />,
      color: 'emerald',
      code: tokenHoldingsCode
    },
    {
      id: 'simple-holdings',
      title: 'Simple Token Holdings',
      description: 'Quick way to get wallet token balances',
      icon: <CubeIcon className="w-5 h-5" />,
      color: 'cyan',
      code: simpleTokenHoldingsCode
    },
    {
      id: 'portfolio',
      title: 'Portfolio Analyzer',
      description: 'Real-world application for wallet analysis',
      icon: <WifiIcon className="w-5 h-5" />,
      color: 'pink',
      code: portfolioAnalyzerCode
    },
    {
      id: 'errors',
      title: 'Error Handling Patterns',
      description: 'Comprehensive error handling strategies',
      icon: <ShieldCheckIcon className="w-5 h-5" />,
      color: 'red',
      code: errorHandlingCode
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-docs-heading mb-4">Code Examples</h1>
        <p className="text-lg text-gray-600 mb-6">
          Practical examples and patterns for building applications with the Gorbchain SDK. 
          All examples assume the SDK is imported and available.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Before You Start</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <div>• Install the SDK: <code className="bg-blue-100 px-1 rounded">npm install @gorbchain-xyz/chaindecode</code></div>
            <div>• Replace placeholder values with your actual data</div>
            <div>• All examples include proper error handling</div>
            <div>• Examples are production-ready patterns</div>
          </div>
        </div>
      </div>

      {examples.map((example) => {
        const isOpen = openSections.has(example.id)
        
        return (
          <div key={example.id} className="docs-card">
            <button
              onClick={() => toggleSection(example.id)}
              className="w-full flex items-center justify-between p-1 text-left"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 bg-${example.color}-100 rounded-lg flex items-center justify-center`}>
                  {example.icon}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-docs-heading">{example.title}</h2>
                  <p className="text-gray-600">{example.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`px-3 py-1 bg-${example.color}-100 text-${example.color}-800 rounded-full text-sm font-medium`}>
                  {example.id === 'portfolio' ? 'Advanced' : 'Ready to Use'}
                </div>
                {isOpen ? 
                  <ChevronDownIcon className="w-5 h-5 text-gray-400" /> : 
                  <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                }
              </div>
            </button>
            
            {isOpen && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-docs-heading">Implementation</h3>
                  <button
                    onClick={() => copyToClipboard(example.code, example.id)}
                    className="flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-md hover:border-blue-300 transition-colors"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                    <span>{copied[example.id] ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                
                <CodeBlock
                  code={example.code}
                  language="typescript"
                  title={example.title}
                  id={example.id}
                  onCopy={() => copyToClipboard(example.code, example.id)}
                  copied={copied[example.id] || false}
                />
                
                {example.id === 'basic' && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">✅ What This Does</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Initializes the SDK with your RPC endpoint</li>
                      <li>• Sets up automatic retry and timeout configuration</li>
                      <li>• Verifies network connectivity before proceeding</li>
                    </ul>
                  </div>
                )}
                
                {example.id === 'token-holdings' && (
                  <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <h4 className="font-medium text-emerald-900 mb-2">🪙 Token Holdings Features</h4>
                    <ul className="text-sm text-emerald-800 space-y-1">
                      <li>• Fetches both SPL Token and Token-2022 holdings</li>
                      <li>• Automatically detects NFTs vs fungible tokens</li>
                      <li>• Retrieves token metadata (name, symbol, URI)</li>
                      <li>• Provides portfolio summary and categorization</li>
                      <li>• Handles errors gracefully for problematic tokens</li>
                    </ul>
                  </div>
                )}
                
                {example.id === 'simple-holdings' && (
                  <div className="mt-4 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
                    <h4 className="font-medium text-cyan-900 mb-2">⚡ Quick Implementation</h4>
                    <p className="text-sm text-cyan-800">
                      A simplified version for basic token balance checking. Perfect for getting started 
                      or when you only need basic token information without detailed categorization.
                    </p>
                  </div>
                )}
                
                {example.id === 'portfolio' && (
                  <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">🚀 Advanced Pattern</h4>
                    <p className="text-sm text-purple-800">
                      This example shows how to build a complete application feature using the SDK. 
                      It demonstrates batch processing, error handling, and data aggregation patterns 
                      suitable for production applications.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Best Practices */}
      <div className="docs-card">
        <h2 className="text-xl font-semibold text-docs-heading mb-4">💡 Best Practices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-docs-heading mb-3">Performance</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Use batch operations for multiple transactions</li>
              <li>• Implement proper rate limiting (5 RPS recommended)</li>
              <li>• Cache network health checks</li>
              <li>• Use connection pooling for high-volume apps</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-docs-heading mb-3">Error Handling</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Always catch specific error types</li>
              <li>• Implement exponential backoff for retries</li>
              <li>• Validate inputs before API calls</li>
              <li>• Log errors with sufficient context</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-docs-heading mb-3">Security</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Never expose private keys in frontend code</li>
              <li>• Validate all user inputs</li>
              <li>• Use environment variables for configuration</li>
              <li>• Implement proper CORS policies</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-docs-heading mb-3">Monitoring</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Monitor RPC endpoint health</li>
              <li>• Track transaction success rates</li>
              <li>• Set up alerting for failures</li>
              <li>• Log performance metrics</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-docs-heading mb-4 text-center">
          🎯 Ready to Build?
        </h2>
        <p className="text-gray-600 text-center mb-6">
          These examples provide the foundation for building robust blockchain applications. 
          Combine patterns and adapt them to your specific use case.
        </p>
        <div className="flex justify-center space-x-4">
          <a 
            href="/playground" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>Try Interactive Playground</span>
          </a>
          <a 
            href="/api-reference" 
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span>View Full API Reference</span>
          </a>
        </div>
      </div>
    </div>
  )
} 