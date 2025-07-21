# GorbchainSDK V1.3+ Test Suite

Comprehensive test suite for GorbchainSDK cryptography functionality with real-world scenarios, performance testing, and security validation.

## 📋 Test Structure

### Core Crypto Tests
- **`crypto.test.ts`** - Basic cryptography functionality tests
- **`crypto-messaging-scenarios.test.ts`** - Real-world messaging application tests
- **`crypto-collaboration-scenarios.test.ts`** - Document sharing and collaboration tests  
- **`crypto-performance-stress.test.ts`** - Performance benchmarking and stress tests
- **`crypto-security-edge-cases.test.ts`** - Security validation and edge case tests

## 🚀 Running Tests

### Quick Commands
```bash
# Run all crypto tests
npm run test:crypto-all

# Run specific test categories
npm run test:crypto                    # Basic functionality
npm run test:crypto-messaging          # Messaging scenarios
npm run test:crypto-collaboration      # Document sharing scenarios
npm run test:crypto-performance        # Performance & stress tests
npm run test:crypto-security          # Security & edge cases

# Run with coverage
npm run test:coverage -- test/crypto*.test.ts
```

### Test Environment
All tests use generated Solana keypairs and run in an isolated environment. No external network calls or real blockchain transactions are made.

## 📊 Test Categories

### 1. Real-World Messaging Scenarios (`crypto-messaging-scenarios.test.ts`)

#### 🔐 Private Personal Notes & Drafts
- Personal message drafts encrypted locally
- Conversation history encryption
- Draft management with metadata

#### 💬 Direct Messaging (1-on-1 Chat)
- Secure messaging between users
- Confidential HR conversations
- Technical discussions with code snippets
- Image/file sharing simulation
- API key and sensitive data sharing

#### 👥 Group Messaging - Small Team Chat
- Development team group chat
- Adding new team members to existing conversations
- Removing team members with key rotation for security
- Role-based permissions in group chat

#### 📈 Scalable Group Messaging - Growing Teams
- Startup team growth with auto-scaling encryption
- Department reorganization with member transitions
- Automatic transition from direct to group encryption

#### ✍️ Message Signing and Verification
- Important announcements with signature verification
- Legal document approval workflow
- Multi-party contract signing

#### 🧵 Message Threading and Conversation Management
- Threaded conversations with encrypted replies
- Reply-to functionality with encryption
- Channel-based organization

#### 🚨 Emergency and Security Scenarios
- Emergency key rotation after security incident
- Immediate access revocation
- Security breach response protocols

### 2. Document Sharing & Team Collaboration (`crypto-collaboration-scenarios.test.ts`)

#### 📄 Document Management System
- Confidential document sharing with hierarchical access
- Version-controlled document updates with audit trail
- Temporary document access for external parties
- Classification-based access control

#### 🔍 Code Review and Technical Documentation
- Secure code review process with encrypted comments
- API documentation with encrypted implementation details
- Technical specifications with sensitive details

#### ⚖️ Legal and Compliance Documentation
- Multi-party contract negotiation with encrypted drafts
- Compliance audit trail with encrypted audit logs
- Legal document workflow management

#### 📈 Performance and Scalability Testing
- Large document encryption performance
- Many recipients performance test
- Concurrent document access patterns

### 3. Performance & Stress Testing (`crypto-performance-stress.test.ts`)

#### ⚡ Encryption Performance Benchmarks
- Personal encryption with various data sizes (100 bytes to 1MB)
- Direct encryption performance scaling
- Signature verification performance
- Throughput measurements and timing analysis

#### 🏋️ Scalability Stress Tests
- Large group creation and message encryption (25+ members)
- Scalable encryption context rapid scaling
- Shared key manager concurrent operations
- Parallel encryption/decryption testing

#### 💾 Memory and Resource Usage Tests
- Memory usage during large group operations
- Resource cleanup after operations
- Memory leak detection
- Garbage collection testing

#### 🔄 Concurrent Operations Stress Test
- High concurrency mixed operations (50+ concurrent)
- Race condition testing
- Thread safety validation
- Performance under load

### 4. Security & Edge Cases (`crypto-security-edge-cases.test.ts`)

#### 🔒 Input Validation and Boundary Tests
- Empty and null data handling
- Large data boundary testing (64KB to 2MB)
- Binary data with special bytes
- Unicode and special character handling
- Invalid key format handling

#### 🛡️ Cryptographic Security Tests
- Key isolation verification
- Nonce uniqueness verification
- Ephemeral key uniqueness in direct encryption
- Signature forgery resistance
- Metadata tampering detection

#### 👥 Group Security and Access Control Tests
- Non-member access prevention
- Role-based permission enforcement
- Post-removal access prevention
- Key rotation security

#### 🔐 Shared Key Security Tests
- Permission boundary enforcement
- Key isolation between different shared keys
- Access control validation

#### 🚨 Error Handling and Recovery Tests
- Corrupted encryption data handling
- Network interruption simulation
- Memory pressure handling
- Concurrent access conflict handling

#### ⏱️ Timing Attack Resistance
- Constant-time signature verification
- Side-channel attack prevention

## 📋 Key Test Scenarios

### Messaging Application Use Cases
- **Personal Notes**: Encrypted local storage of sensitive drafts
- **1-on-1 Chat**: Secure direct messaging with forward secrecy
- **Team Chat**: Group messaging with dynamic membership
- **Company-wide**: Scalable messaging for large organizations
- **Emergency**: Security incident response with immediate key rotation

### Document Management Use Cases
- **Project Documents**: Hierarchical access control for project files
- **Code Reviews**: Secure technical discussions with sensitive details
- **Legal Documents**: Multi-party contract workflows with signatures
- **Audit Logs**: Compliance documentation with encrypted audit trails

### Performance Testing Scenarios
- **Small Data**: 100-byte messages (target: <50ms encryption)
- **Medium Data**: 10KB documents (target: <100ms encryption)
- **Large Data**: 1MB files (target: <2s encryption)
- **Many Recipients**: 25+ person groups (target: <5s setup)
- **High Concurrency**: 50+ simultaneous operations

### Security Testing Scenarios
- **Key Isolation**: Ensure wrong keys cannot decrypt data
- **Access Control**: Role-based permissions enforcement
- **Forward Secrecy**: Post-removal access prevention
- **Attack Resistance**: Protection against common cryptographic attacks

## 📊 Performance Targets

### Encryption Performance
| Operation | Target Time | Data Size |
|-----------|-------------|-----------|
| Personal Encrypt | < 50ms | 10KB |
| Direct Encrypt | < 50ms | 10KB |
| Group Encrypt | < 100ms | 10KB |
| Large File Encrypt | < 2s | 1MB |
| Signature Verify | < 10ms | Any |

### Scalability Targets
| Scenario | Target | Notes |
|----------|--------|-------|
| Group Creation | < 5s | 25 members |
| Add Recipients | < 2s | 10 new members |
| Parallel Decryption | < 3s | 10 concurrent users |
| Memory Usage | < 50MB | Large operations |
| Concurrent Operations | > 100 ops/s | Mixed operations |

## 🔧 Test Configuration

### Environment Variables
```bash
# Optional test configuration
VERBOSE_TESTS=true          # Enable detailed logging
SKIP_PERFORMANCE_TESTS=true # Skip time-intensive performance tests
PERFORMANCE_ITERATIONS=100   # Number of performance test iterations
```

### Test Data
- All tests use dynamically generated Solana keypairs
- Test messages range from empty strings to 2MB data
- Unicode, binary, and special character data included
- No real secrets or production data used

### Assertions
- **Functional**: All encryption/decryption operations must succeed
- **Security**: Wrong keys must never decrypt data
- **Performance**: Operations must complete within target times
- **Memory**: No memory leaks or excessive usage
- **Concurrent**: All parallel operations must succeed

## 🎯 Real-World Application Examples

### Secure Messaging App
```typescript
// Direct messaging
const message = await encryptDirect(
  'API key: sk_live_abc123',
  recipientPublicKey,
  senderPrivateKey
);

// Group chat with role permissions
const team = await createSignatureGroup('Dev Team', creatorKey, members);
const announcement = await encryptForSignatureGroup(message, team, senderKey);
```

### Document Management System
```typescript
// Shared document with access control
const docKey = await sharedKeyManager.createSharedKey(metadata, recipients, creatorKey);
const encryptedDoc = await sharedKeyManager.encryptWithSharedKey(document, docKey.keyId);

// Version control with signatures
const signedVersion = signData(JSON.stringify(documentContent), authorKey);
```

### Enterprise Collaboration
```typescript
// Auto-scaling team communication
const { manager, context } = await createScalableEncryption('Project Alpha', purpose, initialRecipient, creatorKey);

// Automatically transitions from direct to group encryption as team grows
await manager.addRecipientsToContext(contextId, newMembers, authorizerKey);
```

## 🚨 Security Validation

### Threat Model Coverage
- **Unauthorized Access**: Non-members cannot decrypt group messages
- **Key Compromise**: Compromised keys cannot decrypt other users' data
- **Replay Attacks**: Unique nonces prevent message replay
- **Tampering**: Metadata tampering is detected and rejected
- **Forward Secrecy**: Past messages remain secure after key rotation
- **Side Channels**: Timing attacks are mitigated

### Compliance Features
- **Audit Trails**: All operations include timestamps and actor identification
- **Key Rotation**: Emergency key rotation capabilities
- **Access Revocation**: Immediate removal of user access
- **Role-based Access**: Granular permission controls
- **Data Classification**: Support for confidentiality levels

## 📝 Contributing New Tests

### Adding Test Scenarios
1. **Identify Real Use Case**: Base tests on actual application needs
2. **Create Test Data**: Use realistic data sizes and structures  
3. **Test Security Boundaries**: Verify access controls and isolation
4. **Include Performance Validation**: Add timing assertions
5. **Document Expected Behavior**: Clear test descriptions and expectations

### Test Best Practices
- Use descriptive test names that explain the scenario
- Include both positive and negative test cases
- Test edge cases and boundary conditions
- Verify both functional and security requirements
- Include performance assertions where relevant
- Clean up resources after tests complete

## 🔍 Troubleshooting

### Common Issues
- **Memory Errors**: Reduce test data sizes or concurrent operations
- **Timeout Errors**: Increase Jest timeout for performance tests
- **Key Generation Slow**: Tests generate many keypairs - this is expected
- **Performance Variance**: Results may vary by hardware and system load

### Debug Mode
```bash
# Run with detailed logging
VERBOSE_TESTS=true npm run test:crypto-all

# Run specific test with debugging
npx jest --testNamePattern="messaging scenarios" --verbose
```

This comprehensive test suite ensures the GorbchainSDK cryptography functionality is robust, secure, and performant for real-world applications like messaging systems, document management, and team collaboration platforms.