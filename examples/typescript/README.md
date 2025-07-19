# GorbchainSDK TypeScript Examples

This directory contains comprehensive TypeScript examples for backend developers using GorbchainSDK V1. These examples demonstrate the rich capabilities of the SDK for building Solana applications.

## 📁 Directory Structure

```
typescript/
├── basic-usage.ts           # SDK initialization and basic operations
├── token-analysis.ts        # Rich token portfolio analysis
├── transaction-analysis.ts  # Enhanced transaction decoding
├── wallet-integration.ts    # Universal wallet integration
├── portfolio-management.ts  # Advanced portfolio management
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
```bash
npm install @gorbchain-xyz/chaindecode
```

### Running Examples

From the examples directory:

```bash
# Run individual examples
npm run example basic        # Basic SDK usage
npm run example tokens       # Token portfolio analysis
npm run example transactions # Transaction analysis
npm run example wallets      # Wallet integration
npm run example portfolio    # Portfolio management

# Run all examples
npm run example all
```

### Direct execution:
```bash
# Run specific example directly
npx tsx typescript/basic-usage.ts
```

## 📚 Example Descriptions

### 1. Basic Usage (`basic-usage.ts`)
- SDK initialization and configuration
- Network health checks and capability detection
- Basic RPC operations
- Error handling patterns

**Key Features:**
- Network connectivity validation
- Performance monitoring
- Configuration best practices

### 2. Token Analysis (`token-analysis.ts`)
- Rich token portfolio analysis with metadata
- NFT vs fungible token categorization
- Portfolio diversity scoring
- Performance-optimized concurrent requests

**Key Features:**
- Complete metadata resolution
- Portfolio insights and risk analysis
- Multiple usage patterns (SDK vs standalone functions)

### 3. Transaction Analysis (`transaction-analysis.ts`)
- Enhanced transaction decoding with human-readable context
- Token operation analysis
- Balance change tracking
- Instruction-level breakdown

**Key Features:**
- Complete instruction decoding
- Token metadata resolution
- Performance metrics
- Error handling for various transaction types

### 4. Wallet Integration (`wallet-integration.ts`)
- Universal wallet discovery across all Solana providers
- Auto-connect functionality with preferences
- Portfolio analysis for connected wallets
- Event-driven wallet management

**Key Features:**
- Support for 15+ wallet types (Phantom, Solflare, Backpack, etc.)
- Mobile wallet deep links
- Hardware wallet support
- Framework-agnostic integration patterns

### 5. Portfolio Management (`portfolio-management.ts`)
- Advanced portfolio analysis and comparison
- Risk assessment and concentration analysis
- Multi-wallet portfolio tracking
- Rebalancing suggestions

**Key Features:**
- Portfolio comparison and similarity scoring
- Risk metrics and diversification analysis
- Investment strategy identification
- Performance tracking framework

## 🔧 Configuration

### RPC Endpoints
All examples use Gorbchain RPC endpoints:
- **Mainnet**: `https://rpc.gorbchain.xyz`
- **Testnet**: `https://testnet.gorbchain.xyz`

### Customization
Replace example addresses and transaction signatures with real data for actual testing:

```typescript
// In your implementation
const sdk = new GorbchainSDK({
  rpcEndpoint: 'https://rpc.gorbchain.xyz',
  network: 'gorbchain'
});

// Use real wallet addresses
const realWalletAddress = 'YOUR_WALLET_ADDRESS_HERE';
const portfolio = await sdk.getRichTokenAccounts(realWalletAddress);
```

## 🏗️ Integration Patterns

### Node.js Backend
```typescript
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode';

const sdk = new GorbchainSDK({
  rpcEndpoint: 'https://rpc.gorbchain.xyz',
  network: 'gorbchain'
});

// Use for backend analytics, portfolio tracking, etc.
```

### Express.js API
```typescript
app.get('/api/portfolio/:address', async (req, res) => {
  try {
    const portfolio = await sdk.getRichTokenAccounts(req.params.address);
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Cron Jobs / Scheduled Tasks
```typescript
// Portfolio monitoring
setInterval(async () => {
  const portfolio = await sdk.getRichTokenAccounts(MONITORED_ADDRESS);
  if (portfolio.summary.diversityScore < 0.3) {
    // Send rebalancing alert
  }
}, 3600000); // Every hour
```

## 💡 Tips for Backend Developers

1. **Error Handling**: All examples include proper error handling for production use
2. **Performance**: Examples demonstrate concurrent request patterns for optimal performance
3. **Configuration**: Use environment variables for RPC endpoints and sensitive data
4. **Monitoring**: Implement logging and metrics collection for production deployments
5. **Rate Limiting**: Be mindful of RPC rate limits in high-frequency applications

## 🔗 Related Resources

- [GorbchainSDK Documentation](../../README.md)
- [React Examples](../react-docs/src/pages/)
- [API Reference](../../docs/api-reference.md)
- [Contributing Guidelines](../../CONTRIBUTING.md)

## 🤝 Support

For questions or issues:
1. Check the main SDK documentation
2. Review example implementations
3. Open an issue on GitHub
4. Join our Discord community

---

**Perfect for building:**
- DeFi backends and analytics
- Portfolio tracking services
- Transaction monitoring systems
- Wallet management APIs
- Trading bots and automation