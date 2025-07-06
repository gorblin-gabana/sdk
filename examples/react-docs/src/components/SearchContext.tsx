import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface SearchItem {
  id: string
  title: string
  path: string
  content: string
  tags: string[]
  keywords: string[]
  section?: string
  type: 'page' | 'section' | 'code'
}

interface SearchContextType {
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchResults: SearchItem[]
  isSearchOpen: boolean
  setIsSearchOpen: (open: boolean) => void
  selectedIndex: number
  setSelectedIndex: React.Dispatch<React.SetStateAction<number>>
  navigateToResult: (result: SearchItem) => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

// Comprehensive search data with tags and keywords
const searchData: SearchItem[] = [
  // Home page
  {
    id: 'home',
    title: 'Gorbchain ChainDecode SDK',
    path: '/',
    content: 'TypeScript SDK for decoding blockchain transactions, handling RPC operations, and building applications on the Gorbchain network. Production ready with comprehensive error handling.',
    tags: ['overview', 'introduction', 'home', 'sdk'],
    keywords: ['gorbchain', 'sdk', 'typescript', 'blockchain', 'transactions', 'rpc', 'decoding', 'production'],
    type: 'page'
  },
  
  // Getting Started
  {
    id: 'getting-started',
    title: 'Getting Started',
    path: '/getting-started',
    content: 'Learn how to integrate the Gorbchain ChainDecode SDK into your application. Installation, basic setup, transaction decoding, RPC operations, and error handling examples.',
    tags: ['setup', 'installation', 'tutorial', 'beginner'],
    keywords: ['install', 'npm', 'setup', 'configuration', 'tutorial', 'basic', 'example'],
    type: 'page'
  },
  {
    id: 'installation',
    title: 'Installation',
    path: '/getting-started',
    content: 'npm install @gorbchain-xyz/chaindecode',
    tags: ['install', 'npm', 'setup'],
    keywords: ['npm', 'install', 'package', 'manager', 'yarn'],
    section: 'Installation',
    type: 'code'
  },
  {
    id: 'basic-setup',
    title: 'Basic SDK Setup',
    path: '/getting-started',
    content: 'Initialize SDK with GorbchainSDK constructor, RPC endpoint configuration, network settings, and program IDs',
    tags: ['configuration', 'initialization', 'setup'],
    keywords: ['config', 'rpc', 'endpoint', 'network', 'initialization'],
    section: 'Basic Setup',
    type: 'section'
  },

  // API Reference
  {
    id: 'api-reference',
    title: 'API Reference',
    path: '/api-reference',
    content: 'Complete API documentation for the Gorbchain ChainDecode SDK. Core classes, methods, and Gorbscan API integration coming soon.',
    tags: ['api', 'reference', 'documentation', 'methods'],
    keywords: ['api', 'reference', 'methods', 'classes', 'gorbscan', 'documentation'],
    type: 'page'
  },
  {
    id: 'gorbchain-sdk-class',
    title: 'GorbchainSDK Class',
    path: '/api-reference',
    content: 'Main SDK class for interacting with Gorbchain network. Provides high-level methods for transaction decoding, account fetching, and RPC operations.',
    tags: ['sdk', 'class', 'api', 'main'],
    keywords: ['GorbchainSDK', 'class', 'constructor', 'methods'],
    section: 'Core Classes',
    type: 'section'
  },
  {
    id: 'rpc-client-class',
    title: 'RpcClient Class',
    path: '/api-reference',
    content: 'Low-level RPC client with automatic retry logic, circuit breaker patterns, and comprehensive error handling.',
    tags: ['rpc', 'client', 'class', 'api'],
    keywords: ['RpcClient', 'rpc', 'retry', 'circuit', 'breaker'],
    section: 'Core Classes',
    type: 'section'
  },

  // Examples
  {
    id: 'examples',
    title: 'Examples',
    path: '/examples',
    content: 'Code examples and patterns for using the Gorbchain ChainDecode SDK. Transaction decoding, RPC operations, error handling, and more.',
    tags: ['examples', 'code', 'patterns', 'tutorial'],
    keywords: ['examples', 'code', 'patterns', 'tutorial', 'sample'],
    type: 'page'
  },

  // RPC Operations
  {
    id: 'rpc-operations',
    title: 'RPC Operations',
    path: '/rpc-operations',
    content: 'Comprehensive RPC client with connection pooling, retry logic, circuit breaker patterns, account methods, transaction methods, and network operations.',
    tags: ['rpc', 'operations', 'network', 'client'],
    keywords: ['rpc', 'operations', 'client', 'account', 'transaction', 'network', 'pooling', 'retry'],
    type: 'page'
  },
  {
    id: 'account-methods',
    title: 'Account Methods',
    path: '/rpc-operations',
    content: 'getAccountInfo, getMultipleAccounts, getTokenAccountsByOwner - methods for fetching account information',
    tags: ['rpc', 'account', 'methods'],
    keywords: ['getAccountInfo', 'getMultipleAccounts', 'getTokenAccountsByOwner', 'account'],
    section: 'Account Methods',
    type: 'section'
  },
  {
    id: 'transaction-methods',
    title: 'Transaction Methods',
    path: '/rpc-operations',
    content: 'getTransaction, getSignaturesForAddress, sendTransaction - methods for transaction operations',
    tags: ['rpc', 'transaction', 'methods'],
    keywords: ['getTransaction', 'getSignaturesForAddress', 'sendTransaction', 'transaction'],
    section: 'Transaction Methods',
    type: 'section'
  },
  {
    id: 'network-methods',
    title: 'Network Methods',
    path: '/rpc-operations',
    content: 'getSlot, getBlockHeight, getHealth - methods for network status and information',
    tags: ['rpc', 'network', 'methods'],
    keywords: ['getSlot', 'getBlockHeight', 'getHealth', 'network', 'status'],
    section: 'Network Methods',
    type: 'section'
  },

  // Transaction Decoding
  {
    id: 'transaction-decoding',
    title: 'Transaction Decoding',
    path: '/transaction-decoding',
    content: 'Decode complex blockchain transactions with support for SPL tokens, NFTs, and custom program instructions. Rich transaction analysis and metadata.',
    tags: ['decoding', 'transactions', 'spl', 'nft'],
    keywords: ['decode', 'transaction', 'spl', 'token', 'nft', 'instructions', 'metadata'],
    type: 'page'
  },

  // Error Handling
  {
    id: 'error-handling',
    title: 'Error Handling',
    path: '/error-handling',
    content: 'Comprehensive error handling with 7 error categories: Network, RPC, Decoder, Transaction, Validation, Authentication, and General SDK errors.',
    tags: ['error', 'handling', 'errors', 'exceptions'],
    keywords: ['error', 'handling', 'network', 'rpc', 'decoder', 'transaction', 'validation', 'authentication'],
    type: 'page'
  },
  {
    id: 'network-errors',
    title: 'Network Errors',
    path: '/error-handling',
    content: 'Connection failures, timeouts, and network unavailability issues. ConnectionError, TimeoutError, NetworkUnavailableError',
    tags: ['error', 'network', 'connection'],
    keywords: ['ConnectionError', 'TimeoutError', 'NetworkUnavailableError', 'network', 'timeout'],
    section: '1. Network Errors',
    type: 'section'
  },
  {
    id: 'rpc-errors',
    title: 'RPC Errors',
    path: '/error-handling',
    content: 'Server-side RPC failures, invalid methods, and rate limiting. RpcMethodNotFoundError, RpcInvalidParamsError, RateLimitError',
    tags: ['error', 'rpc', 'server'],
    keywords: ['RpcMethodNotFoundError', 'RpcInvalidParamsError', 'RateLimitError', 'rpc', 'server'],
    section: '2. RPC Errors',
    type: 'section'
  },
  {
    id: 'decoder-errors',
    title: 'Decoder Errors',
    path: '/error-handling',
    content: 'Instruction decoding failures, missing decoders, and data format issues. DecoderNotFoundError, InvalidInstructionDataError',
    tags: ['error', 'decoder', 'instruction'],
    keywords: ['DecoderNotFoundError', 'InvalidInstructionDataError', 'decoder', 'instruction'],
    section: '3. Decoder Errors',
    type: 'section'
  },

  // Interactive Playground
  {
    id: 'interactive-playground',
    title: 'Interactive Playground',
    path: '/playground',
    content: 'Test SDK functionality live with transaction decoding, network health checks, and account analysis. Interactive examples and real-time testing.',
    tags: ['playground', 'interactive', 'testing', 'demo'],
    keywords: ['playground', 'interactive', 'testing', 'demo', 'live', 'examples'],
    type: 'page'
  }
]

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchItem[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()

  // Fuzzy search function
  const searchItems = (query: string): SearchItem[] => {
    if (!query.trim()) return []

    const normalizedQuery = query.toLowerCase().trim()
    const results: Array<SearchItem & { score: number }> = []

    searchData.forEach(item => {
      let score = 0

      // Title match (highest priority)
      if (item.title.toLowerCase().includes(normalizedQuery)) {
        score += 100
      }

      // Tag exact match (high priority)
      if (item.tags.some(tag => tag.toLowerCase() === normalizedQuery)) {
        score += 80
      }

      // Tag partial match
      if (item.tags.some(tag => tag.toLowerCase().includes(normalizedQuery))) {
        score += 60
      }

      // Keyword exact match
      if (item.keywords.some(keyword => keyword.toLowerCase() === normalizedQuery)) {
        score += 70
      }

      // Keyword partial match
      if (item.keywords.some(keyword => keyword.toLowerCase().includes(normalizedQuery))) {
        score += 50
      }

      // Content match
      if (item.content.toLowerCase().includes(normalizedQuery)) {
        score += 30
      }

      // Section match
      if (item.section && item.section.toLowerCase().includes(normalizedQuery)) {
        score += 40
      }

      if (score > 0) {
        results.push({ ...item, score })
      }
    })

    // Sort by score and return top 8 results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(({ score, ...item }) => item)
  }

  // Update search results when query changes
  useEffect(() => {
    const results = searchItems(searchQuery)
    setSearchResults(results)
    setSelectedIndex(0)
  }, [searchQuery])

  // Navigate to selected result
  const navigateToResult = (result: SearchItem) => {
    navigate(result.path)
    if (result.section) {
      // Scroll to section after navigation
      setTimeout(() => {
        const element = document.querySelector(`h2:contains("${result.section}"), h3:contains("${result.section}")`)
        element?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
    setIsSearchOpen(false)
    setSearchQuery('')
  }

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const value: SearchContextType = {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearchOpen,
    setIsSearchOpen,
    selectedIndex,
    setSelectedIndex,
    navigateToResult
  }

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return context
} 