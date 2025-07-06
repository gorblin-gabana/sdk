
import { Link, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  RocketLaunchIcon,
  CodeBracketIcon,
  CubeIcon,
  SignalIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import Logo from './Logo'
import SearchResults from './SearchResults'
import { useSearch } from './SearchContext'

const navigation = [
  {
    name: 'Home',
    href: '/',
    icon: HomeIcon,
    description: 'SDK overview and introduction'
  },
  {
    name: 'Getting Started',
    href: '/getting-started',
    icon: RocketLaunchIcon,
    description: 'Quick setup guide'
  },
  {
    name: 'API Reference',
    href: '/api-reference',
    icon: CodeBracketIcon,
    description: 'Complete API documentation'
  },
  {
    name: 'Examples',
    href: '/examples',
    icon: CubeIcon,
    description: 'Code examples and patterns'
  },
  {
    name: 'RPC Operations',
    href: '/rpc-operations',
    icon: SignalIcon,
    description: 'Blockchain RPC methods'
  },
  {
    name: 'Transaction Decoding',
    href: '/transaction-decoding',
    icon: DocumentTextIcon,
    description: 'Decode blockchain transactions'
  },
  {
    name: 'Error Handling',
    href: '/error-handling',
    icon: ExclamationTriangleIcon,
    description: 'Error types and handling'
  },
  {
    name: 'Interactive Playground',
    href: '/playground',
    icon: PlayIcon,
    description: 'Test SDK functionality live',
    highlight: true
  },
]

export default function Sidebar() {
  const location = useLocation()
  const { searchQuery, setSearchQuery, setIsSearchOpen } = useSearch()

  return (
    <div className="fixed top-0 left-0 w-80 h-screen bg-white border-r border-docs-border shadow-docs-lg overflow-hidden">
      <div className="flex flex-col h-full">
        {/* Sidebar Header with Logo and Version */}
        <div className="p-6 border-b border-docs-border bg-gradient-to-r from-gorbchain-light to-white">
          <div className="flex items-center justify-between mb-3">
            <Logo size="lg" showText={true} />
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gorbchain-primary to-gorbchain-secondary text-white shadow-sm">
              v1.0.0
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-docs-border bg-gray-50/50">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setIsSearchOpen(true)
              }}
              onFocus={() => searchQuery && setIsSearchOpen(true)}
              className="block w-full pl-10 pr-16 py-2.5 border border-gray-200 rounded-lg text-sm bg-white placeholder-gray-500 focus:outline-none focus:border-gorbchain-primary focus:ring-2 focus:ring-gorbchain-primary/20 transition-all"
              placeholder="Search documentation..."
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <kbd className="px-2 py-1 text-xs text-gray-400 bg-gray-100 rounded border border-gray-200">
                ⌘K
              </kbd>
            </div>
            <SearchResults />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  group flex items-start p-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-gorbchain-primary/10 to-gorbchain-secondary/10 text-gorbchain-primary border-l-4 border-gorbchain-primary shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gorbchain-primary'
                  }
                  ${item.highlight ? 'ring-2 ring-gorbchain-accent/20 bg-gradient-to-r from-gorbchain-accent/5 to-gorbchain-primary/5' : ''}
                `}
              >
                <Icon 
                  className={`
                    w-6 h-6 mr-3 mt-0.5 flex-shrink-0 transition-colors
                    ${isActive ? 'text-gorbchain-primary' : 'text-gray-400 group-hover:text-gorbchain-primary'}
                    ${item.highlight ? 'text-gorbchain-accent' : ''}
                  `}
                />
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold ${item.highlight ? 'text-gorbchain-accent' : ''}`}>
                    {item.name}
                    {item.highlight && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gorbchain-accent/10 text-gorbchain-accent">
                        New
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {item.description}
                  </div>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Footer Section - Compact with Social Links */}
        <div className="p-4 border-t border-docs-border bg-gradient-to-r from-gorbchain-light/50 to-white">
          {/* Help Section with Social Links */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-6 h-6 bg-gradient-to-br from-gorbchain-primary to-gorbchain-secondary rounded-lg flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-3 h-3 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-900">Need Help?</h3>
                <p className="text-xs text-gray-500">Join our community</p>
              </div>
            </div>
            
            <a
              href="https://discord.gg/gorbchain"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-gorbchain-primary to-gorbchain-secondary rounded-md hover:shadow-md transition-all duration-200 transform hover:scale-105 mb-3 w-full justify-center"
            >
              Join Discord →
            </a>

            {/* Social Links Row */}
            <div className="flex items-center justify-center space-x-3 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500">Follow us:</span>
              
              {/* Discord */}
              <a
                href="https://discord.gg/gorbchain"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-gray-400 hover:text-gorbchain-primary transition-colors rounded"
                title="Discord"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>

              {/* GitHub */}
              <a
                href="https://github.com/gorbchain-xyz/chaindecode"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-gray-400 hover:text-gorbchain-primary transition-colors rounded"
                title="GitHub"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>

              {/* X (Twitter) */}
              <a
                href="https://x.com/gorbchain"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-gray-400 hover:text-gorbchain-primary transition-colors rounded"
                title="X (Twitter)"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 