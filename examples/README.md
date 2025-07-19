# GorbchainSDK V1 Examples 🚀

This directory contains comprehensive examples demonstrating the key capabilities of GorbchainSDK V1 for rapid Solana application development.

## 🎯 Examples Overview

| Example | Description | Key Features |
|---------|-------------|--------------|
| [01-basic-usage.ts](./01-basic-usage.ts) | SDK setup and basic operations | Initialization, network health, capabilities |
| [02-rich-token-analysis.ts](./02-rich-token-analysis.ts) | Token portfolio analysis | Metadata resolution, portfolio insights |
| [03-transaction-analysis.ts](./03-transaction-analysis.ts) | Enhanced transaction decoding | Instruction analysis, token transfers |
| [04-wallet-integration.ts](./04-wallet-integration.ts) | Universal wallet connection | Multi-wallet support, auto-connect |
| [05-advanced-portfolio.ts](./05-advanced-portfolio.ts) | Portfolio management | Risk analysis, comparisons, insights |

## 🚀 Quick Start

```bash
# Run all examples
npm run example

# Run individual examples
npm run example:basic
npm run example:tokens
npm run example:transactions
npm run example:wallets
npm run example:portfolio
```

## 📚 Example Details

### 01. Basic Usage & Setup

Learn how to initialize and configure GorbchainSDK V1:

```typescript
const sdk = new GorbchainSDK({
  rpcEndpoint: 'https://api.mainnet-beta.solana.com',
  network: 'solana-mainnet'
});
```

**What you'll learn:**
- SDK initialization and configuration
- Network health monitoring
- Capability detection
- Direct RPC access patterns

### 02. Rich Token Analysis

Analyze token portfolios with complete metadata:

```typescript
const portfolio = await sdk.getRichTokenAccounts(address, {
  includeMetadata: true,
  includeNFTs: true
});
```

**What you'll learn:**
- Portfolio analysis with metadata
- Token vs NFT categorization
- Performance optimization techniques
- Portfolio diversity scoring

### 03. Transaction Analysis

Decode transactions with human-readable context:

```typescript
const richTx = await sdk.getRichTransaction(signature, {
  includeTokenMetadata: true,
  includeBalanceChanges: true
});
```

**What you'll learn:**
- Instruction decoding with context
- Token transfer analysis
- Balance change tracking
- Transaction categorization

### 04. Wallet Integration

Connect to all Solana wallets universally:

```typescript
const walletManager = sdk.createWalletManager();
const wallet = await walletManager.autoConnect();
```

**What you'll learn:**
- Universal wallet discovery
- Auto-connect functionality
- Portfolio analysis for connected wallets
- Event-driven wallet management

### 05. Advanced Portfolio

Advanced portfolio operations and insights:

```typescript
const analysis = await sdk.analyzePortfolio(address);
const comparison = await sdk.comparePortfolios(wallet1, wallet2);
```

**What you'll learn:**
- Risk analysis and concentration metrics
- Portfolio comparison techniques
- Advanced insights generation
- Rebalancing suggestions

## 🌐 Framework Integration

### React Integration

```typescript
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode';

function usePortfolio(address: string) {
  const [portfolio, setPortfolio] = useState(null);
  const sdk = new GorbchainSDK({ rpcEndpoint: '...' });

  useEffect(() => {
    sdk.getRichTokenAccounts(address).then(setPortfolio);
  }, [address]);

  return portfolio;
}
```

### Vue Integration

```typescript
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode';

export default {
  setup() {
    const sdk = new GorbchainSDK({ rpcEndpoint: '...' });
    const portfolio = ref(null);

    const loadPortfolio = async (address) => {
      portfolio.value = await sdk.getRichTokenAccounts(address);
    };

    return { portfolio, loadPortfolio };
  }
};
```

### Next.js Integration

```typescript
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode';

export async function getServerSideProps({ params }) {
  const sdk = new GorbchainSDK({ rpcEndpoint: '...' });
  const portfolio = await sdk.getRichTokenAccounts(params.address);

  return { props: { portfolio } };
}
```

## 💡 Tips for Success

### 1. Replace Example Data

The examples use placeholder addresses and signatures. Replace them with real data:

```typescript
// Replace with real wallet address
const walletAddress = 'your_real_wallet_address_here';

// Replace with real transaction signature
const txSignature = 'your_real_transaction_signature_here';
```

### 2. Configure RPC Endpoints

Use appropriate RPC endpoints for your needs:

```typescript
// Mainnet
const sdk = new GorbchainSDK({
  rpcEndpoint: 'https://api.mainnet-beta.solana.com'
});

// Custom RPC (faster)
const sdk = new GorbchainSDK({
  rpcEndpoint: 'https://your-premium-rpc-endpoint.com'
});
```

### 3. Optimize Performance

Configure concurrency for better performance:

```typescript
const portfolio = await sdk.getRichTokenAccounts(address, {
  maxConcurrentRequests: 10, // Increase for faster fetching
  includeMetadata: false     // Skip if not needed
});
```

### 4. Handle Errors Gracefully

Always implement proper error handling:

```typescript
try {
  const portfolio = await sdk.getRichTokenAccounts(address);
  // Handle success
} catch (error) {
  console.error('Portfolio analysis failed:', error.message);
  // Handle error appropriately
}
```

## 🔧 Development Setup

1. **Install Dependencies:**
   ```bash
   npm install @gorbchain-xyz/chaindecode
   ```

2. **TypeScript Configuration:**
   Ensure your `tsconfig.json` includes:
   ```json
   {
     "compilerOptions": {
       "moduleResolution": "node16",
       "allowSyntheticDefaultImports": true,
       "esModuleInterop": true
     }
   }
   ```

3. **Environment Setup:**
   Create a `.env` file for configuration:
   ```env
   RPC_ENDPOINT=https://api.mainnet-beta.solana.com
   NETWORK=solana-mainnet
   ```

## 📊 Performance Notes

GorbchainSDK V1 is optimized for production use:

- **Metadata Caching:** 5-10 minute cache for token metadata
- **Concurrent Requests:** Configurable parallel processing
- **Selective Fetching:** Only fetch needed data
- **Memory Management:** Automatic cache cleanup

## 🆘 Troubleshooting

### Common Issues

1. **Network Timeouts:**
   ```typescript
   const sdk = new GorbchainSDK({
     rpcEndpoint: '...',
     timeout: 60000 // Increase timeout
   });
   ```

2. **Rate Limiting:**
   ```typescript
   const portfolio = await sdk.getRichTokenAccounts(address, {
     maxConcurrentRequests: 3 // Reduce concurrency
   });
   ```

3. **Browser Environment:**
   Some examples work best in browser environments for wallet integration.

## 🎯 Next Steps

1. **Run the Examples:** Start with `npm run example`
2. **Modify for Your Use Case:** Replace example data with real addresses
3. **Build Your App:** Use the patterns shown in your application
4. **Optimize Performance:** Configure caching and concurrency
5. **Deploy:** Your super app is ready!

## 📚 Additional Resources

- [Main README](../README.md) - Complete SDK documentation
- [API Reference](../docs/api.md) - Detailed API documentation
- [GitHub](https://github.com/gorbchain-xyz/chaindecode) - Source code and issues
- [Discord](https://discord.gg/gorbchain) - Community support

---

**Build super apps within seconds with GorbchainSDK V1!** 🚀