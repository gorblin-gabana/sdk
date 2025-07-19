# Test Execution Guide - Gorbchain SDK

## 🚀 Quick Start

### 1. **Run All Tests**
```bash
npm test
```

### 2. **Run Tests Without Network Calls**
```bash
npm run test:no-network
```

### 3. **Run Tests with Verbose Output**
```bash
npm run test:verbose
```

---

## 📋 Test Categories

### **Unit Tests** (Fast, No Network)
```bash
npm run test:unit
```
- SDK initialization and configuration
- Type checking and validation
- Decoder functionality
- Error handling
- Performance benchmarks

### **Integration Tests** (Network-dependent)
```bash
npm run test:integration
```
- RPC client testing
- Network connectivity
- Real API calls to Gorbchain

### **Real User Journey Tests** (Requires Real Data)
```bash
npm run test:journeys
```
- Complete user workflows
- End-to-end scenarios
- Portfolio analysis
- NFT collection workflows

### **Optimized SDK Tests** (New Features)
```bash
npm run test:optimized
```
- Tests for optimized SDK structure
- Export organization validation
- Performance improvements
- Backwards compatibility

### **Real Data Tests** (Uses Your Addresses)
```bash
npm run test:real-data
```
- Tests with your actual wallets
- Real NFT analysis
- Actual token portfolios

---

## ⚙️ Configuration

### **1. Environment Setup**

Create a `.env` file from the example:
```bash
cp .env.example .env
```

Then fill in your real data:
```bash
# Example values - replace with your real data
TEST_WALLET_DIVERSE=7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
TEST_NFT_MPL_CORE=FWsWxqEjpy6B2Je5TwhUsB3aAqXHPgwApWEoHnmnsorZ
TEST_TX_TOKEN_TRANSFER=your_real_transaction_signature_here
```

### **2. Test Control Flags**

Control which tests run using environment variables:

```bash
# Skip network-dependent tests
SKIP_NETWORK_TESTS=true npm test

# Skip tests requiring real data
SKIP_REAL_DATA_TESTS=true npm test

# Enable detailed logging
VERBOSE_TESTS=true npm test
```

---

## 🎯 Providing Real Test Data

### **Required Data for Complete Testing:**

1. **Wallet Addresses** (4 addresses minimum)
   ```
   TEST_WALLET_DIVERSE=<wallet_with_mixed_holdings>
   TEST_WALLET_NFT=<wallet_with_nfts>
   TEST_WALLET_TOKEN=<wallet_with_tokens>
   TEST_WALLET_EMPTY=<empty_or_minimal_wallet>
   ```

2. **NFT Information**
   ```
   TEST_NFT_MPL_CORE=<real_nft_address>
   TEST_NFT_OWNER=<nft_owner_wallet>
   ```

3. **Token Information**
   ```
   TEST_TOKEN_CUSTOM=<custom_token_mint>
   TEST_TOKEN_SYMBOL=<token_symbol>
   ```

4. **Transaction Signatures**
   ```
   TEST_TX_TOKEN_TRANSFER=<token_transfer_tx>
   TEST_TX_NFT_MINT=<nft_mint_tx>
   TEST_TX_COMPLEX=<complex_multi_instruction_tx>
   ```

### **How to Get This Data:**

1. **Wallet Addresses**: Use existing wallets from your Gorbchain network
2. **NFT Addresses**: From your NFT creation scripts or existing NFTs
3. **Transaction Signatures**: From recent transactions on your network
4. **Token Addresses**: From your token deployment scripts

---

## 📊 Test Results & Coverage

### **Coverage Report**
```bash
npm run test:coverage
```
- Generates HTML report in `coverage/` directory
- Target: 90%+ coverage for core SDK functions

### **Performance Benchmarks**
Tests include performance expectations:
- SDK initialization: < 100ms
- RPC calls: < 5 seconds average
- Token analysis (100+ tokens): < 15 seconds
- Portfolio analysis: < 20 seconds

### **Expected Test Results**

With proper configuration, you should see:
```
✅ Optimized SDK Tests: ~15 tests passing
✅ Real User Journey Tests: ~20 tests passing  
✅ Integration Tests: ~25 tests passing
✅ Unit Tests: ~30 tests passing

Total: ~90+ tests passing
```

---

## 🐛 Troubleshooting

### **Common Issues:**

1. **"Network timeout" errors**
   ```bash
   # Run without network tests
   npm run test:no-network
   ```

2. **"Real data not provided" warnings**
   ```bash
   # Fill in your .env file or skip real data tests
   SKIP_REAL_DATA_TESTS=true npm test
   ```

3. **Jest timeout errors**
   ```bash
   # Tests have 30-second timeout for network calls
   # If needed, increase in jest.config.cjs
   ```

4. **Import/Module errors**
   ```bash
   # Rebuild the SDK
   npm run build
   npm test
   ```

### **Debug Mode:**
```bash
# Run with maximum verbosity
VERBOSE_TESTS=true npm run test:verbose
```

### **Individual Test Files:**
```bash
# Run specific test file
npx jest test/optimized-sdk.test.ts

# Run specific test suite
npx jest --testNamePattern="Journey 1"
```

---

## 🎉 Success Criteria

Your testing setup is successful when:

- ✅ All unit tests pass (no network required)
- ✅ Integration tests pass with network access
- ✅ Real data tests pass with your addresses
- ✅ Performance benchmarks meet targets
- ✅ Coverage > 90% for core SDK functions
- ✅ All user journeys complete successfully

---

## 🔄 Continuous Integration

For CI/CD environments:
```bash
# CI-friendly test command (no real data, no network)
SKIP_NETWORK_TESTS=true SKIP_REAL_DATA_TESTS=true npm test
```

Add to your CI pipeline:
```yaml
- name: Run SDK Tests
  run: |
    npm install
    npm run build
    SKIP_NETWORK_TESTS=true SKIP_REAL_DATA_TESTS=true npm test
```

---

**Once you provide real test data and run the tests, you'll have a comprehensive validation of your optimized SDK with actual user scenarios!**