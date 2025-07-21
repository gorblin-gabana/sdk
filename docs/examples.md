# GorbchainSDK V1.3+ Examples

This document provides comprehensive examples of how to use GorbchainSDK V1.3+ for blockchain operations and cryptography.

## Table of Contents

1. [🔐 NEW: Cryptography Examples](#-new-cryptography-examples)
   - [Personal Encryption](#personal-encryption)
   - [Direct Encryption (1-on-1)](#direct-encryption-1-on-1)
   - [Group & Signature-Based Encryption](#group--signature-based-encryption)
   - [Shared Key Management](#shared-key-management)
   - [Scalable Encryption Contexts](#scalable-encryption-contexts)
   - [Digital Signatures](#digital-signatures)
2. [Setup and Initialization](#setup-and-initialization)
3. [Transaction Decoding](#transaction-decoding)
4. [Token Creation](#token-creation)
5. [NFT Creation](#nft-creation)
6. [Balance and Cost Management](#balance-and-cost-management)
7. [Custom Decoders](#custom-decoders)
8. [Error Handling](#error-handling)
9. [Batch Operations](#batch-operations)
10. [Real-World Applications](#real-world-applications)

## 🔐 NEW: Cryptography Examples

### Personal Encryption

Encrypt data with your private key for personal storage:

```typescript
import { encryptPersonal, decryptPersonalString } from '@gorbchain-xyz/chaindecode';
import { Keypair } from '@solana/web3.js';

async function personalEncryptionExample() {
  const user = Keypair.generate();
  
  // Encrypt sensitive data
  const sensitiveData = 'My private notes and secrets';
  const encrypted = await encryptPersonal(
    sensitiveData,
    user.secretKey,
    { 
      compress: true,
      metadata: { category: 'notes', created: Date.now() }
    }
  );
  
  console.log('Encrypted data:', {
    method: encrypted.method,
    size: encrypted.encryptedData.length,
    compressed: encrypted.metadata.compressed
  });
  
  // Decrypt the data
  const decrypted = await decryptPersonalString(encrypted, user.secretKey);
  console.log('Decrypted:', decrypted);
  
  return { encrypted, decrypted };
}
```

### Direct Encryption (1-on-1)

Secure communication between two parties:

```typescript
import { encryptDirect, decryptDirectString } from '@gorbchain-xyz/chaindecode';
import { Keypair } from '@solana/web3.js';

async function directMessagingExample() {
  const alice = Keypair.generate();
  const bob = Keypair.generate();
  
  // Alice sends encrypted message to Bob
  const message = 'Secret meeting at 3 PM. API key: sk_live_abc123';
  const encrypted = await encryptDirect(
    message,
    bob.publicKey.toBase58(),
    alice.secretKey,
    { compress: true }
  );
  
  console.log('Alice encrypted message for Bob');
  console.log('Ephemeral key used:', encrypted.metadata.ephemeralPublicKey);
  
  // Bob decrypts Alice's message
  const decrypted = await decryptDirectString(encrypted, bob.secretKey);
  console.log('Bob decrypted:', decrypted);
  
  return { encrypted, decrypted };
}

// Real-world: Secure API key sharing
async function secureApiKeySharing(apiKey: string, recipientPublicKey: string, senderPrivateKey: Uint8Array) {
  const encrypted = await encryptDirect(
    `API_KEY=${apiKey}`,
    recipientPublicKey,
    senderPrivateKey,
    { metadata: { type: 'api_key', expires: Date.now() + 86400000 } }
  );
  
  return encrypted;
}
```

### Group & Signature-Based Encryption

Dynamic groups with role-based access control:

```typescript
import {
  createSignatureGroup,
  encryptForSignatureGroup,
  decryptSignatureGroupData,
  addMemberToSignatureGroup,
  removeMemberFromSignatureGroup,
  MemberRole
} from '@gorbchain-xyz/chaindecode';
import { Keypair } from '@solana/web3.js';

async function teamCommunicationExample() {
  const alice = Keypair.generate(); // Team lead
  const bob = Keypair.generate();   // Developer
  const charlie = Keypair.generate(); // Designer
  const diana = Keypair.generate();   // New member
  
  // Alice creates a team group
  const group = await createSignatureGroup(
    'Development Team',
    alice.secretKey,
    [
      { publicKey: bob.publicKey.toBase58(), role: MemberRole.ADMIN },
      { publicKey: charlie.publicKey.toBase58(), role: MemberRole.MEMBER }
    ],
    {
      allowDynamicMembership: true,
      maxMembers: 10,
      requireSignatureVerification: true
    }
  );
  
  console.log(`Created group: ${group.groupName}`);
  console.log(`Members: ${group.members.length}`);
  
  // Alice sends encrypted message to group
  const teamMessage = 'New feature requirements attached. Please review by EOD.';
  const encrypted = await encryptForSignatureGroup(
    teamMessage,
    group,
    alice.secretKey,
    alice.publicKey.toBase58()
  );
  
  console.log('Alice sent encrypted team message');
  
  // Bob (Admin) decrypts the message
  const bobDecrypted = await decryptSignatureGroupData(
    encrypted,
    bob.secretKey,
    bob.publicKey.toBase58()
  );
  console.log('Bob decrypted:', Buffer.from(bobDecrypted).toString());
  
  // Charlie (Member) decrypts the message
  const charlieDecrypted = await decryptSignatureGroupData(
    encrypted,
    charlie.secretKey,
    charlie.publicKey.toBase58()
  );
  console.log('Charlie decrypted:', Buffer.from(charlieDecrypted).toString());
  
  // Add Diana to the group
  const updatedGroup = await addMemberToSignatureGroup(
    group,
    { publicKey: diana.publicKey.toBase58(), role: MemberRole.VIEWER },
    alice.secretKey,
    alice.publicKey.toBase58()
  );
  
  console.log(`Diana added to group. Total members: ${updatedGroup.members.length}`);
  
  // Send another message after Diana joined
  const newMessage = 'Welcome Diana! Here are the project details.';
  const newEncrypted = await encryptForSignatureGroup(
    newMessage,
    updatedGroup,
    alice.secretKey,
    alice.publicKey.toBase58()
  );
  
  // Diana can now decrypt new messages
  const dianaDecrypted = await decryptSignatureGroupData(
    newEncrypted,
    diana.secretKey,
    diana.publicKey.toBase58()
  );
  console.log('Diana decrypted:', Buffer.from(dianaDecrypted).toString());
  
  return { group: updatedGroup, messages: [encrypted, newEncrypted] };
}
```

### Shared Key Management

Manage shared encryption keys with granular permissions:

```typescript
import { SharedKeyManager } from '@gorbchain-xyz/chaindecode';
import { Keypair } from '@solana/web3.js';

async function documentSharingExample() {
  const admin = Keypair.generate();
  const lawyer1 = Keypair.generate();
  const lawyer2 = Keypair.generate();
  const client = Keypair.generate();
  
  const manager = new SharedKeyManager();
  
  // Create shared key for legal documents
  const sharedKey = await manager.createSharedKey(
    {
      name: 'Legal Documents Access',
      purpose: 'Contract negotiation and review',
      creator: admin.publicKey.toBase58(),
      algorithm: 'AES-256-GCM',
      derivationMethod: 'ECDH',
      properties: { classification: 'confidential' }
    },
    [
      {
        publicKey: admin.publicKey.toBase58(),
        permissions: { canDecrypt: true, canEncrypt: true, canShare: true, canRevoke: true }
      },
      {
        publicKey: lawyer1.publicKey.toBase58(),
        permissions: { canDecrypt: true, canEncrypt: true, canShare: true, canRevoke: false }
      },
      {
        publicKey: lawyer2.publicKey.toBase58(),
        permissions: { canDecrypt: true, canEncrypt: true, canShare: false, canRevoke: false }
      },
      {
        publicKey: client.publicKey.toBase58(),
        permissions: { canDecrypt: true, canEncrypt: false, canShare: false, canRevoke: false }
      }
    ],
    admin.secretKey
  );
  
  console.log(`Created shared key: ${sharedKey.keyId}`);
  console.log(`Key holders: ${sharedKey.holders.length}`);
  
  // Admin encrypts a contract
  const contractContent = 'CONFIDENTIAL CONTRACT\n\nThis agreement between parties...';
  const encrypted = await manager.encryptWithSharedKey(
    contractContent,
    sharedKey.keyId,
    admin.secretKey,
    admin.publicKey.toBase58()
  );
  
  console.log('Admin encrypted contract document');
  
  // Lawyer1 decrypts and reviews
  const lawyer1Decrypted = await manager.decryptWithSharedKey(
    encrypted,
    lawyer1.secretKey,
    lawyer1.publicKey.toBase58()
  );
  console.log('Lawyer1 accessed document:', Buffer.from(lawyer1Decrypted).toString().substring(0, 50) + '...');
  
  // Client (read-only) decrypts
  const clientDecrypted = await manager.decryptWithSharedKey(
    encrypted,
    client.secretKey,
    client.publicKey.toBase58()
  );
  console.log('Client accessed document:', Buffer.from(clientDecrypted).toString().substring(0, 50) + '...');
  
  // Add new external counsel
  const externalCounsel = Keypair.generate();
  const updatedKey = await manager.addRecipientsToSharedKey(
    sharedKey.keyId,
    [{
      publicKey: externalCounsel.publicKey.toBase58(),
      permissions: { canDecrypt: true, canEncrypt: false, canShare: false, canRevoke: false }
    }],
    admin.secretKey,
    admin.publicKey.toBase58()
  );
  
  console.log(`Added external counsel. Total holders: ${updatedKey.holders.length}`);
  
  return { sharedKey: updatedKey, encrypted };
}
```

### Scalable Encryption Contexts

Auto-scaling encryption for growing teams:

```typescript
import { ScalableEncryptionManager, createScalableEncryption } from '@gorbchain-xyz/chaindecode';
import { Keypair } from '@solana/web3.js';

async function startupGrowthExample() {
  const founder = Keypair.generate();
  const cofounder = Keypair.generate();
  const employee1 = Keypair.generate();
  const employee2 = Keypair.generate();
  const employee3 = Keypair.generate();
  
  // Create scalable context for startup communications
  const { manager, context } = await createScalableEncryption(
    'Startup Communications',
    'Internal team messaging that grows with the company',
    cofounder.publicKey.toBase58(),
    founder.secretKey,
    {
      autoTransitionThreshold: 3, // Switch to shared key at 3+ recipients
      defaultPermissions: {
        canEncrypt: true,
        canDecrypt: true,
        canAddRecipients: false
      }
    }
  );
  
  console.log(`Created scalable context: ${context.contextId}`);
  console.log(`Current method: ${context.currentMethod}`);
  console.log(`Recipients: ${context.recipients.length}`);
  
  // Send message (uses direct encryption with 1 recipient)
  const message1 = 'Congrats on the seed funding! Ready to hire our first employees?';
  const encrypted1 = await manager.encryptInContext(
    context.contextId,
    message1,
    founder.secretKey
  );
  
  console.log(`Message 1 encrypted using: ${encrypted1.method}`);
  
  // Add first employee (still direct encryption)
  let updatedContext = await manager.addRecipientsToContext(
    context.contextId,
    [employee1.publicKey.toBase58()],
    founder.secretKey,
    founder.publicKey.toBase58()
  );
  
  console.log(`After adding employee1 - Method: ${updatedContext.currentMethod}, Recipients: ${updatedContext.recipients.length}`);
  
  // Add second employee (still direct encryption)
  updatedContext = await manager.addRecipientsToContext(
    context.contextId,
    [employee2.publicKey.toBase58()],
    founder.secretKey,
    founder.publicKey.toBase58()
  );
  
  console.log(`After adding employee2 - Method: ${updatedContext.currentMethod}, Recipients: ${updatedContext.recipients.length}`);
  
  // Add third employee (auto-transitions to shared key!)
  updatedContext = await manager.addRecipientsToContext(
    context.contextId,
    [employee3.publicKey.toBase58()],
    founder.secretKey,
    founder.publicKey.toBase58()
  );
  
  console.log(`After adding employee3 - Method: ${updatedContext.currentMethod}, Recipients: ${updatedContext.recipients.length}`);
  console.log('🚀 Auto-transitioned to shared key encryption!');
  
  // Send company-wide message (now uses shared key)
  const message2 = 'Team all-hands meeting tomorrow at 10 AM. Agenda: Q3 roadmap, new product features, team expansion plans.';
  const encrypted2 = await manager.encryptInContext(
    context.contextId,
    message2,
    founder.secretKey
  );
  
  console.log(`Message 2 encrypted using: ${encrypted2.method}`);
  
  // All employees can decrypt
  const employee1Decrypted = await manager.decryptInContext(
    context.contextId,
    encrypted2,
    employee1.secretKey,
    employee1.publicKey.toBase58()
  );
  console.log('Employee1 decrypted:', Buffer.from(employee1Decrypted).toString().substring(0, 50) + '...');
  
  const employee3Decrypted = await manager.decryptInContext(
    context.contextId,
    encrypted2,
    employee3.secretKey,
    employee3.publicKey.toBase58()
  );
  console.log('Employee3 decrypted:', Buffer.from(employee3Decrypted).toString().substring(0, 50) + '...');
  
  return { context: updatedContext, messages: [encrypted1, encrypted2] };
}
```

### Digital Signatures

Sign and verify important documents:

```typescript
import { signData, verifySignature, signWithMetadata, verifyWithMetadata } from '@gorbchain-xyz/chaindecode';
import { Keypair } from '@solana/web3.js';

async function contractSigningExample() {
  const ceo = Keypair.generate();
  const cfo = Keypair.generate();
  const legalCounsel = Keypair.generate();
  
  const contractDocument = `
SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into on ${new Date().toDateString()}.

PARTIES:
- Service Provider: [Company Name]
- Client: [Client Name]

TERMS:
1. Service Description: [Service details]
2. Payment Terms: [Payment details]
3. Duration: [Contract duration]

By signing below, parties agree to the terms outlined above.
  `.trim();
  
  console.log('Document to sign:');
  console.log(contractDocument);
  console.log('\n' + '='.repeat(50) + '\n');
  
  // CEO signs the document
  const ceoSignature = signData(contractDocument, ceo.secretKey);
  console.log('✅ CEO signed the document');
  
  // CFO signs with metadata
  const cfoSignatureWithMetadata = signWithMetadata(
    contractDocument,
    cfo.secretKey,
    {
      role: 'Chief Financial Officer',
      department: 'Finance',
      signedAt: new Date().toISOString(),
      ipAddress: '192.168.1.100',
      approved: true
    }
  );
  console.log('✅ CFO signed with metadata');
  
  // Legal counsel signs
  const legalSignature = signWithMetadata(
    contractDocument,
    legalCounsel.secretKey,
    {
      role: 'Legal Counsel',
      department: 'Legal',
      signedAt: new Date().toISOString(),
      reviewCompleted: true,
      complianceVerified: true
    }
  );
  console.log('✅ Legal Counsel signed with metadata');
  
  // Verify all signatures
  const ceoValid = verifySignature(
    contractDocument,
    ceoSignature,
    ceo.publicKey.toBase58()
  );
  console.log(`CEO signature valid: ${ceoValid}`);
  
  const cfoVerification = verifyWithMetadata(
    cfoSignatureWithMetadata,
    cfo.publicKey.toBase58()
  );
  console.log(`CFO signature valid: ${cfoVerification.valid}`);
  console.log(`CFO metadata:`, cfoVerification.metadata);
  
  const legalVerification = verifyWithMetadata(
    legalSignature,
    legalCounsel.publicKey.toBase58()
  );
  console.log(`Legal signature valid: ${legalVerification.valid}`);
  console.log(`Legal metadata:`, legalVerification.metadata);
  
  // Create signature summary
  const signatureSummary = {
    document: contractDocument,
    signatures: [
      {
        signer: 'CEO',
        publicKey: ceo.publicKey.toBase58(),
        signature: ceoSignature,
        valid: ceoValid
      },
      {
        signer: 'CFO',
        publicKey: cfo.publicKey.toBase58(),
        signatureWithMetadata: cfoSignatureWithMetadata,
        valid: cfoVerification.valid,
        metadata: cfoVerification.metadata
      },
      {
        signer: 'Legal Counsel',
        publicKey: legalCounsel.publicKey.toBase58(),
        signatureWithMetadata: legalSignature,
        valid: legalVerification.valid,
        metadata: legalVerification.metadata
      }
    ],
    allSignaturesValid: ceoValid && cfoVerification.valid && legalVerification.valid,
    completedAt: new Date().toISOString()
  };
  
  console.log('\n📋 Signature Summary:');
  console.log(`All signatures valid: ${signatureSummary.allSignaturesValid}`);
  console.log(`Total signers: ${signatureSummary.signatures.length}`);
  
  return signatureSummary;
}
```

## Crypto Real-World Application Examples

### Secure Messaging Application

```typescript
import {
  encryptDirect,
  decryptDirectString,
  createSignatureGroup,
  encryptForSignatureGroup,
  decryptSignatureGroupData,
  MemberRole
} from '@gorbchain-xyz/chaindecode';

class SecureMessagingApp {
  private userKeypair: Keypair;
  private groups: Map<string, any> = new Map();
  
  constructor(userKeypair: Keypair) {
    this.userKeypair = userKeypair;
  }
  
  // Send direct message
  async sendDirectMessage(recipientPublicKey: string, message: string) {
    const encrypted = await encryptDirect(
      JSON.stringify({
        type: 'direct_message',
        content: message,
        timestamp: Date.now(),
        sender: this.userKeypair.publicKey.toBase58()
      }),
      recipientPublicKey,
      this.userKeypair.secretKey
    );
    
    return {
      messageId: crypto.randomUUID(),
      encrypted,
      recipientPublicKey,
      sentAt: Date.now()
    };
  }
  
  // Receive direct message
  async receiveDirectMessage(encryptedMessage: any) {
    const decrypted = await decryptDirectString(encryptedMessage, this.userKeypair.secretKey);
    const messageData = JSON.parse(decrypted);
    
    return {
      type: messageData.type,
      content: messageData.content,
      sender: messageData.sender,
      timestamp: messageData.timestamp,
      receivedAt: Date.now()
    };
  }
  
  // Create group chat
  async createGroupChat(groupName: string, members: Array<{publicKey: string, role: MemberRole}>) {
    const group = await createSignatureGroup(
      groupName,
      this.userKeypair.secretKey,
      members
    );
    
    this.groups.set(group.groupId, group);
    return group;
  }
  
  // Send group message
  async sendGroupMessage(groupId: string, message: string) {
    const group = this.groups.get(groupId);
    if (!group) throw new Error('Group not found');
    
    const encrypted = await encryptForSignatureGroup(
      JSON.stringify({
        type: 'group_message',
        content: message,
        timestamp: Date.now(),
        sender: this.userKeypair.publicKey.toBase58(),
        groupId
      }),
      group,
      this.userKeypair.secretKey,
      this.userKeypair.publicKey.toBase58()
    );
    
    return {
      messageId: crypto.randomUUID(),
      encrypted,
      groupId,
      sentAt: Date.now()
    };
  }
  
  // Receive group message
  async receiveGroupMessage(encryptedMessage: any) {
    const decrypted = await decryptSignatureGroupData(
      encryptedMessage,
      this.userKeypair.secretKey,
      this.userKeypair.publicKey.toBase58()
    );
    
    const messageData = JSON.parse(Buffer.from(decrypted).toString());
    
    return {
      type: messageData.type,
      content: messageData.content,
      sender: messageData.sender,
      groupId: messageData.groupId,
      timestamp: messageData.timestamp,
      receivedAt: Date.now()
    };
  }
}

// Usage example
async function messagingAppDemo() {
  const alice = new SecureMessagingApp(Keypair.generate());
  const bob = new SecureMessagingApp(Keypair.generate());
  const charlie = new SecureMessagingApp(Keypair.generate());
  
  // Alice sends direct message to Bob
  const directMessage = await alice.sendDirectMessage(
    bob.userKeypair.publicKey.toBase58(),
    'Hey Bob, want to grab coffee later?'
  );
  
  // Bob receives and decrypts the message
  const receivedMessage = await bob.receiveDirectMessage(directMessage.encrypted);
  console.log('Bob received:', receivedMessage.content);
  
  // Alice creates a group chat
  const group = await alice.createGroupChat('Coffee Plans', [
    { publicKey: bob.userKeypair.publicKey.toBase58(), role: MemberRole.MEMBER },
    { publicKey: charlie.userKeypair.publicKey.toBase58(), role: MemberRole.MEMBER }
  ]);
  
  // Alice sends group message
  const groupMessage = await alice.sendGroupMessage(
    group.groupId,
    'Let\'s meet at the coffee shop at 3 PM!'
  );
  
  console.log('Secure messaging app demo completed!');
  return { directMessage, groupMessage };
}
```

---

## Setup and Initialization

### Basic Setup
```typescript
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode';

// Basic initialization
const sdk = new GorbchainSDK();

// Custom configuration
const sdk = new GorbchainSDK({
  rpcEndpoint: 'https://rpc.gorbchain.xyz',
  network: 'mainnet',
  timeout: 30000,
  retries: 3,
  richDecoding: {
    enabled: true,
    includeTokenMetadata: true,
    includeNftMetadata: true,
    maxConcurrentRequests: 10
  }
});
```

### Environment-Based Setup
```typescript
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode';

// Using environment variables
const sdk = new GorbchainSDK({
  rpcEndpoint: process.env.GORBCHAIN_RPC_URL || 'https://rpc.gorbchain.xyz',
  network: (process.env.GORBCHAIN_NETWORK as any) || 'mainnet',
  timeout: parseInt(process.env.RPC_TIMEOUT || '30000'),
  retries: parseInt(process.env.RPC_RETRIES || '3')
});
```

## Transaction Decoding

### Basic Transaction Decoding
```typescript
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode';

async function analyzeTransaction(signature: string) {
  const sdk = new GorbchainSDK({
    richDecoding: { enabled: true }
  });
  
  try {
    const richTransaction = await sdk.getAndDecodeTransaction(signature);
    
    console.log('Transaction Analysis:');
    console.log('- Signature:', richTransaction.signature);
    console.log('- Status:', richTransaction.status);
    console.log('- Fee:', richTransaction.fee / 1e9, 'SOL');
    console.log('- Block Time:', new Date(richTransaction.blockTime! * 1000));
    console.log('- Instructions:', richTransaction.instructions.length);
    
    richTransaction.instructions.forEach((instruction, index) => {
      console.log(`  ${index + 1}. ${instruction.decoded.type}`);
      console.log(`     Program: ${instruction.programName || 'Unknown'}`);
      console.log(`     Description: ${instruction.decoded.description}`);
    });
    
    return richTransaction;
  } catch (error) {
    console.error('Failed to analyze transaction:', error);
    throw error;
  }
}

// Usage
analyzeTransaction('5a7f8c9d...')
  .then(result => console.log('Analysis complete'))
  .catch(err => console.error('Analysis failed:', err));
```

### Advanced Transaction Analysis
```typescript
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode';

async function deepAnalyzeTransaction(signature: string) {
  const sdk = new GorbchainSDK({
    richDecoding: {
      enabled: true,
      includeTokenMetadata: true,
      includeNftMetadata: true
    }
  });
  
  const richTransaction = await sdk.getAndDecodeTransaction(signature);
  
  // Analyze token transfers
  const tokenTransfers = richTransaction.instructions.filter(
    inst => inst.decoded.type.includes('transfer')
  );
  
  console.log('\nToken Transfers:');
  tokenTransfers.forEach((transfer, index) => {
    console.log(`  ${index + 1}. Type: ${transfer.decoded.type}`);
    console.log(`     Amount: ${transfer.decoded.data?.amount || 'N/A'}`);
    console.log(`     From: ${transfer.decoded.data?.source || 'N/A'}`);
    console.log(`     To: ${transfer.decoded.data?.destination || 'N/A'}`);
    
    if (transfer.decoded.tokenMetadata) {
      console.log(`     Token: ${transfer.decoded.tokenMetadata.name} (${transfer.decoded.tokenMetadata.symbol})`);
    }
  });
  
  // Analyze account changes
  if (richTransaction.tokenAccounts) {
    console.log('\nToken Account Changes:');
    Object.entries(richTransaction.tokenAccounts).forEach(([address, info]) => {
      console.log(`  ${address}:`);
      console.log(`    Balance: ${info.balance || 'N/A'}`);
      console.log(`    Owner: ${info.owner || 'N/A'}`);
    });
  }
  
  return richTransaction;
}
```

### Batch Transaction Analysis
```typescript
async function analyzeMultipleTransactions(signatures: string[]) {
  const sdk = new GorbchainSDK();
  
  const results = await Promise.allSettled(
    signatures.map(signature => 
      sdk.getAndDecodeTransaction(signature)
    )
  );
  
  const successful = results
    .filter(result => result.status === 'fulfilled')
    .map(result => (result as PromiseFulfilledResult<any>).value);
  
  const failed = results
    .filter(result => result.status === 'rejected')
    .map((result, index) => ({
      signature: signatures[index],
      error: (result as PromiseRejectedResult).reason
    }));
  
  console.log(`Analyzed ${successful.length} successful transactions`);
  console.log(`Failed to analyze ${failed.length} transactions`);
  
  return { successful, failed };
}
```

## Token Creation

### Simple Token Creation
```typescript
import { 
  GorbchainSDK, 
  createToken22TwoTx, 
  estimateTokenCreationCost 
} from '@gorbchain-xyz/chaindecode';
import { Keypair, Connection } from '@solana/web3.js';

async function createSimpleToken() {
  const sdk = new GorbchainSDK();
  const connection = new Connection(sdk.config.rpcEndpoint);
  const payer = Keypair.generate(); // In real app, load from wallet
  
  const tokenParams = {
    name: 'My Awesome Token',
    symbol: 'MAT',
    supply: 1000000,
    decimals: 6,
    uri: 'https://example.com/token-metadata.json',
    description: 'A token for my awesome project'
  };
  
  try {
    // Estimate cost first
    const estimatedCost = await estimateTokenCreationCost(connection, tokenParams);
    console.log(`Estimated cost: ${estimatedCost / 1e9} SOL`);
    
    // Create the token
    const result = await createToken22TwoTx(connection, payer, tokenParams);
    
    console.log('Token created successfully!');
    console.log('- Token Address:', result.tokenAddress);
    console.log('- Associated Token Address:', result.associatedTokenAddress);
    console.log('- Transaction Signature:', result.signature);
    
    return result;
  } catch (error) {
    console.error('Token creation failed:', error);
    throw error;
  }
}
```

### Advanced Token Creation with Validation
```typescript
import { 
  createToken22TwoTx, 
  checkSufficientBalance, 
  estimateTokenCreationCost,
  validateTokenParameters 
} from '@gorbchain-xyz/chaindecode';

async function createValidatedToken(payer: Keypair, params: TokenCreationParams) {
  const connection = new Connection('https://rpc.gorbchain.xyz');
  
  try {
    // Validate parameters
    validateTokenParameters(params);
    console.log('✓ Token parameters valid');
    
    // Estimate cost
    const estimatedCost = await estimateTokenCreationCost(connection, params);
    console.log(`✓ Estimated cost: ${estimatedCost / 1e9} SOL`);
    
    // Check balance
    const balanceCheck = await checkSufficientBalance(
      connection,
      payer.publicKey,
      estimatedCost
    );
    
    if (!balanceCheck.sufficient) {
      throw new Error(
        `Insufficient balance. Required: ${balanceCheck.required / 1e9} SOL, ` +
        `Available: ${balanceCheck.balance / 1e9} SOL`
      );
    }
    console.log('✓ Sufficient balance confirmed');
    
    // Create token
    const result = await createToken22TwoTx(connection, payer, params, {
      commitment: 'confirmed',
      maxRetries: 3
    });
    
    console.log('✓ Token created successfully!');
    return result;
    
  } catch (error) {
    console.error('Token creation failed:', error);
    throw error;
  }
}
```

## NFT Creation

### Simple NFT Creation
```typescript
import { createNFT, estimateNFTCreationCost } from '@gorbchain-xyz/chaindecode';

async function createSimpleNFT(wallet: any) {
  const connection = new Connection('https://rpc.gorbchain.xyz');
  
  const nftParams = {
    name: 'My Cool NFT',
    uri: 'https://example.com/nft-metadata.json',
    description: 'A really cool NFT',
    royaltyBasisPoints: 500, // 5% royalty
    attributes: [
      { trait_type: 'Color', value: 'Blue' },
      { trait_type: 'Rarity', value: 'Rare' },
      { trait_type: 'Power', value: 85, display_type: 'number' }
    ]
  };
  
  try {
    const estimatedCost = await estimateNFTCreationCost(connection, nftParams);
    console.log(`Estimated NFT creation cost: ${estimatedCost / 1e9} SOL`);
    
    const result = await createNFT(connection, wallet, nftParams);
    
    console.log('NFT created successfully!');
    console.log('- Asset Address:', result.assetAddress);
    console.log('- Transaction Signature:', result.signature);
    
    return result;
  } catch (error) {
    console.error('NFT creation failed:', error);
    throw error;
  }
}
```

### NFT Collection Creation
```typescript
import { createNFT } from '@gorbchain-xyz/chaindecode';

async function createNFTCollection(wallet: any, nftCount: number) {
  const connection = new Connection('https://rpc.gorbchain.xyz');
  const results = [];
  
  for (let i = 0; i < nftCount; i++) {
    const nftParams = {
      name: `Collection NFT #${i + 1}`,
      uri: `https://example.com/collection-metadata/${i + 1}.json`,
      description: `NFT #${i + 1} from my collection`,
      royaltyBasisPoints: 250, // 2.5% royalty
      creators: [
        { address: wallet.publicKey.toString(), percentage: 100 }
      ],
      attributes: [
        { trait_type: 'Collection', value: 'My Collection' },
        { trait_type: 'Edition', value: i + 1, display_type: 'number' },
        { trait_type: 'Rarity', value: i < 10 ? 'Rare' : 'Common' }
      ]
    };
    
    try {
      const result = await createNFT(connection, wallet, nftParams);
      results.push(result);
      
      console.log(`Created NFT ${i + 1}/${nftCount}: ${result.assetAddress}`);
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Failed to create NFT ${i + 1}:`, error);
    }
  }
  
  return results;
}
```

## Balance and Cost Management

### Comprehensive Balance Checker
```typescript
import { checkSufficientBalance, estimateTokenCreationCost, estimateNFTCreationCost } from '@gorbchain-xyz/chaindecode';

class BalanceManager {
  private connection: Connection;
  
  constructor(rpcEndpoint: string) {
    this.connection = new Connection(rpcEndpoint);
  }
  
  async checkBalanceForTokenCreation(
    payer: PublicKey, 
    tokenParams: TokenCreationParams
  ): Promise<{ canAfford: boolean; details: any }> {
    const estimatedCost = await estimateTokenCreationCost(this.connection, tokenParams);
    const balanceCheck = await checkSufficientBalance(
      this.connection,
      payer,
      estimatedCost
    );
    
    return {
      canAfford: balanceCheck.sufficient,
      details: {
        estimatedCost: estimatedCost / 1e9,
        currentBalance: balanceCheck.balance / 1e9,
        shortfall: balanceCheck.sufficient ? 0 : (estimatedCost - balanceCheck.balance) / 1e9
      }
    };
  }
  
  async checkBalanceForNFTCreation(
    payer: PublicKey, 
    nftParams: NFTCreationParams
  ): Promise<{ canAfford: boolean; details: any }> {
    const estimatedCost = await estimateNFTCreationCost(this.connection, nftParams);
    const balanceCheck = await checkSufficientBalance(
      this.connection,
      payer,
      estimatedCost
    );
    
    return {
      canAfford: balanceCheck.sufficient,
      details: {
        estimatedCost: estimatedCost / 1e9,
        currentBalance: balanceCheck.balance / 1e9,
        shortfall: balanceCheck.sufficient ? 0 : (estimatedCost - balanceCheck.balance) / 1e9
      }
    };
  }
}
```

## Custom Decoders

### Simple Custom Decoder
```typescript
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode';

function createCustomDecoder() {
  const sdk = new GorbchainSDK();
  
  // Register a custom decoder for a DEX program
  sdk.registerDecoder(
    'my-dex',
    'DEXProgram1111111111111111111111111111111111',
    (instruction) => {
      const data = instruction.data;
      
      // Parse different instruction types
      switch (data[0]) {
        case 0: // Initialize
          return {
            type: 'dex-initialize',
            programId: instruction.programId,
            data: {
              instructionType: 'initialize',
              authority: instruction.accounts[0]?.address
            },
            accounts: instruction.accounts,
            raw: instruction
          };
          
        case 1: // Swap
          return {
            type: 'dex-swap',
            programId: instruction.programId,
            data: {
              instructionType: 'swap',
              tokenA: instruction.accounts[0]?.address,
              tokenB: instruction.accounts[1]?.address,
              trader: instruction.accounts[2]?.address,
              amount: readUint64(data, 1) // Custom parsing function
            },
            accounts: instruction.accounts,
            raw: instruction
          };
          
        default:
          return {
            type: 'dex-unknown',
            programId: instruction.programId,
            data: { instructionType: 'unknown' },
            accounts: instruction.accounts,
            raw: instruction
          };
      }
    }
  );
  
  return sdk;
}

// Helper function to read uint64 from bytes
function readUint64(data: Uint8Array, offset: number): string {
  const view = new DataView(data.buffer, data.byteOffset + offset, 8);
  const low = view.getUint32(0, true);
  const high = view.getUint32(4, true);
  return (BigInt(high) << 32n | BigInt(low)).toString();
}
```

### Advanced Custom Decoder with Validation
```typescript
class CustomDEXDecoder {
  static register(sdk: GorbchainSDK) {
    sdk.registerDecoder(
      'advanced-dex',
      'ADEXProgram111111111111111111111111111111111',
      this.decode
    );
  }
  
  static decode(instruction: any) {
    try {
      const data = instruction.data;
      
      if (data.length < 1) {
        throw new Error('Invalid instruction data length');
      }
      
      const instructionType = data[0];
      
      switch (instructionType) {
        case 0x00:
          return this.decodeInitialize(instruction, data);
        case 0x01:
          return this.decodeSwap(instruction, data);
        case 0x02:
          return this.decodeAddLiquidity(instruction, data);
        case 0x03:
          return this.decodeRemoveLiquidity(instruction, data);
        default:
          return this.decodeUnknown(instruction, data);
      }
    } catch (error) {
      return {
        type: 'dex-error',
        programId: instruction.programId,
        data: {
          error: error.message,
          instructionType: 'error'
        },
        accounts: instruction.accounts,
        raw: instruction
      };
    }
  }
  
  private static decodeSwap(instruction: any, data: Uint8Array) {
    if (data.length < 17) {
      throw new Error('Invalid swap instruction data length');
    }
    
    const amount = readUint64(data, 1);
    const minimumAmountOut = readUint64(data, 9);
    
    return {
      type: 'dex-swap',
      programId: instruction.programId,
      data: {
        instructionType: 'swap',
        amount,
        minimumAmountOut,
        tokenA: instruction.accounts[0]?.address,
        tokenB: instruction.accounts[1]?.address,
        trader: instruction.accounts[2]?.address,
        description: `Swap ${amount} tokens with minimum ${minimumAmountOut} output`
      },
      accounts: instruction.accounts,
      raw: instruction
    };
  }
  
  // ... other decode methods
}
```

## Error Handling

### Comprehensive Error Handler
```typescript
import { 
  RpcNetworkError, 
  RpcTimeoutError, 
  RpcServerError, 
  RpcConnectionError 
} from '@gorbchain-xyz/chaindecode';

class SDKErrorHandler {
  static async handleOperation<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error(`${context} failed:`, error);
      
      if (error instanceof RpcTimeoutError) {
        console.error('Request timed out. Try again later.');
        throw new Error('Operation timed out');
      }
      
      if (error instanceof RpcNetworkError) {
        console.error('Network error. Check your connection.');
        throw new Error('Network error');
      }
      
      if (error instanceof RpcServerError) {
        console.error('Server error:', error.message);
        throw new Error('Server error');
      }
      
      if (error instanceof RpcConnectionError) {
        console.error('Connection error:', error.message);
        throw new Error('Connection error');
      }
      
      // Generic error
      throw error;
    }
  }
}

// Usage
async function safeTransactionDecoding(signature: string) {
  const sdk = new GorbchainSDK();
  
  return SDKErrorHandler.handleOperation(
    () => sdk.getAndDecodeTransaction(signature),
    'Transaction decoding'
  );
}
```

## Batch Operations

### Batch Token Creation
```typescript
async function createTokensBatch(
  payer: Keypair,
  tokenConfigs: TokenCreationParams[]
): Promise<{ successful: TokenMintResult[]; failed: any[] }> {
  const connection = new Connection('https://rpc.gorbchain.xyz');
  const successful: TokenMintResult[] = [];
  const failed: any[] = [];
  
  // Process in batches to avoid overwhelming the network
  const batchSize = 3;
  for (let i = 0; i < tokenConfigs.length; i += batchSize) {
    const batch = tokenConfigs.slice(i, i + batchSize);
    
    const batchResults = await Promise.allSettled(
      batch.map(async (config, index) => {
        try {
          const result = await createToken22TwoTx(connection, payer, config);
          console.log(`Created token ${i + index + 1}/${tokenConfigs.length}: ${result.tokenAddress}`);
          return result;
        } catch (error) {
          console.error(`Failed to create token ${i + index + 1}:`, error);
          throw error;
        }
      })
    );
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push({
          config: batch[index],
          error: result.reason
        });
      }
    });
    
    // Add delay between batches
    if (i + batchSize < tokenConfigs.length) {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  return { successful, failed };
}
```

## Real-World Applications

### Token Portfolio Analyzer
```typescript
class TokenPortfolioAnalyzer {
  private sdk: GorbchainSDK;
  
  constructor() {
    this.sdk = new GorbchainSDK({
      richDecoding: {
        enabled: true,
        includeTokenMetadata: true
      }
    });
  }
  
  async analyzeWalletTransactions(
    walletAddress: string,
    transactionSignatures: string[]
  ): Promise<{
    totalTransactions: number;
    tokenTransfers: number;
    nftTransfers: number;
    totalFeesSpent: number;
    tokenBreakdown: Record<string, any>;
  }> {
    const results = await Promise.allSettled(
      transactionSignatures.map(sig => 
        this.sdk.getAndDecodeTransaction(sig)
      )
    );
    
    const successful = results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<any>).value);
    
    let totalFeesSpent = 0;
    let tokenTransfers = 0;
    let nftTransfers = 0;
    const tokenBreakdown: Record<string, any> = {};
    
    successful.forEach(tx => {
      totalFeesSpent += tx.fee;
      
      tx.instructions.forEach(instruction => {
        if (instruction.decoded.type.includes('transfer')) {
          if (instruction.decoded.type.includes('nft')) {
            nftTransfers++;
          } else {
            tokenTransfers++;
            
            // Track token activity
            if (instruction.decoded.tokenMetadata) {
              const symbol = instruction.decoded.tokenMetadata.symbol;
              if (!tokenBreakdown[symbol]) {
                tokenBreakdown[symbol] = {
                  name: instruction.decoded.tokenMetadata.name,
                  transferCount: 0,
                  totalAmount: 0
                };
              }
              tokenBreakdown[symbol].transferCount++;
              tokenBreakdown[symbol].totalAmount += 
                parseFloat(instruction.decoded.data.amount || '0');
            }
          }
        }
      });
    });
    
    return {
      totalTransactions: successful.length,
      tokenTransfers,
      nftTransfers,
      totalFeesSpent: totalFeesSpent / 1e9,
      tokenBreakdown
    };
  }
}
```

### Trading Bot Integration
```typescript
class TradingBotIntegration {
  private sdk: GorbchainSDK;
  
  constructor() {
    this.sdk = new GorbchainSDK({
      richDecoding: { enabled: true }
    });
  }
  
  async monitorDEXTransactions(
    dexProgramId: string,
    onSwapDetected: (swap: any) => void
  ): Promise<void> {
    // This would typically be integrated with a websocket listener
    // For demo purposes, we'll show how to decode DEX transactions
    
    const mockTransactionSignatures = [
      '5VqRpL...',
      '7sNmTx...',
      '9kPfWe...'
    ];
    
    for (const signature of mockTransactionSignatures) {
      try {
        const richTx = await this.sdk.getAndDecodeTransaction(signature);
        
        const swapInstructions = richTx.instructions.filter(
          inst => inst.programId === dexProgramId && 
                  inst.decoded.type === 'dex-swap'
        );
        
        swapInstructions.forEach(swap => {
          onSwapDetected({
            signature: richTx.signature,
            timestamp: richTx.blockTime,
            tokenA: swap.decoded.data.tokenA,
            tokenB: swap.decoded.data.tokenB,
            amount: swap.decoded.data.amount,
            trader: swap.decoded.data.trader
          });
        });
      } catch (error) {
        console.error('Failed to analyze transaction:', error);
      }
    }
  }
}
```

This comprehensive examples documentation provides practical, real-world usage patterns for GorbchainSDK V1.3+. Each example includes complete, runnable code with proper error handling and best practices.

## 🔐 Crypto Integration Patterns

### Enterprise Document Management

```typescript
class EnterpriseDocumentManager {
  private sharedKeyManager: SharedKeyManager;
  private userKeypair: Keypair;
  
  constructor(userKeypair: Keypair) {
    this.userKeypair = userKeypair;
    this.sharedKeyManager = new SharedKeyManager();
  }
  
  async createSecureProjectSpace(projectName: string, teamMembers: Array<{publicKey: string, role: string}>) {
    const permissions = this.mapRoleToPermissions;
    
    const sharedKey = await this.sharedKeyManager.createSharedKey(
      {
        name: `${projectName} Documents`,
        purpose: 'Project document sharing and collaboration',
        creator: this.userKeypair.publicKey.toBase58(),
        algorithm: 'AES-256-GCM',
        derivationMethod: 'ECDH',
        properties: { project: projectName, created: Date.now() }
      },
      teamMembers.map(member => ({
        publicKey: member.publicKey,
        permissions: permissions(member.role)
      })),
      this.userKeypair.secretKey
    );
    
    return {
      projectName,
      keyId: sharedKey.keyId,
      teamSize: teamMembers.length,
      createdAt: Date.now()
    };
  }
  
  private mapRoleToPermissions(role: string) {
    switch (role.toLowerCase()) {
      case 'admin':
        return { canDecrypt: true, canEncrypt: true, canShare: true, canRevoke: true };
      case 'editor':
        return { canDecrypt: true, canEncrypt: true, canShare: false, canRevoke: false };
      case 'viewer':
        return { canDecrypt: true, canEncrypt: false, canShare: false, canRevoke: false };
      default:
        return { canDecrypt: true, canEncrypt: false, canShare: false, canRevoke: false };
    }
  }
}
```

### Healthcare Data Encryption

```typescript
class HealthcareDataManager {
  async encryptPatientRecord(patientData: any, authorizedPersonnel: string[]) {
    const group = await createSignatureGroup(
      `Patient-${patientData.patientId}`,
      doctorPrivateKey,
      authorizedPersonnel.map(pubKey => ({ publicKey: pubKey, role: MemberRole.MEMBER }))
    );
    
    const hipaaCompliantData = {
      ...patientData,
      encryptedAt: Date.now(),
      hipaaCompliant: true,
      accessLog: []
    };
    
    return await encryptForSignatureGroup(
      JSON.stringify(hipaaCompliantData),
      group,
      doctorPrivateKey,
      doctorPublicKey
    );
  }
}
``` 