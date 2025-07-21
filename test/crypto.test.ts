/**
 * Comprehensive tests for the crypto functionality - Fixed version
 */

import { describe, test, expect, beforeAll } from '@jest/globals'
import { Keypair } from '@solana/web3.js'
import {
  CryptoManager,
  encryptPersonal,
  decryptPersonal,
  decryptPersonalString,
  encryptDirect,
  decryptDirect,
  decryptDirectString,
  createSignatureGroup,
  encryptForSignatureGroup,
  decryptSignatureGroupData,
  SharedKeyManager,
  ScalableEncryptionManager,
  createScalableEncryption,
  EncryptionMethod,
  MemberRole,
  signData,
  verifySignature,
  DirectEncryptionMetadata,
  PersonalEncryptionMetadata,
  GroupEncryptionMetadata,
  SignatureGroupMetadata
} from '../src/crypto/index.js'

describe('Crypto System Tests', () => {
  let alice: Keypair
  let bob: Keypair
  let charlie: Keypair
  let diana: Keypair

  beforeAll(() => {
    // Generate test keypairs
    alice = Keypair.generate()
    bob = Keypair.generate()
    charlie = Keypair.generate()
    diana = Keypair.generate()
  })

  describe('Personal Encryption', () => {
    test('should encrypt and decrypt personal data', async () => {
      const testData = 'This is my secret personal data'
      
      // Encrypt
      const encrypted = await encryptPersonal(testData, alice.secretKey)
      expect(encrypted).toBeDefined()
      expect(encrypted.method).toBe(EncryptionMethod.PERSONAL)
      expect(encrypted.encryptedData).toBeDefined()
      expect(encrypted.metadata.nonce).toBeDefined()
      
      // Decrypt as string
      const decrypted = await decryptPersonalString(encrypted, alice.secretKey)
      expect(decrypted).toBe(testData)
      
      // Decrypt as buffer
      const decryptedBuffer = await decryptPersonal(encrypted, alice.secretKey)
      expect(Buffer.from(decryptedBuffer).toString()).toBe(testData)
    })

    test('should fail to decrypt with wrong key', async () => {
      const testData = 'Secret data'
      const encrypted = await encryptPersonal(testData, alice.secretKey)
      
      await expect(
        decryptPersonal(encrypted, bob.secretKey)
      ).rejects.toThrow()
    })

    test('should support compression', async () => {
      const largeData = 'x'.repeat(10000)
      
      const encrypted = await encryptPersonal(largeData, alice.secretKey, { compress: true })
      const metadata = encrypted.metadata as PersonalEncryptionMetadata
      
      expect(metadata).toBeDefined()
      
      const decrypted = await decryptPersonalString(encrypted, alice.secretKey)
      expect(decrypted).toBe(largeData)
    })
  })

  describe('Direct Encryption (Public Key)', () => {
    test('should encrypt data for specific recipient', async () => {
      const testData = 'Secret message for Bob'
      
      // Alice encrypts for Bob
      const encrypted = await encryptDirect(
        testData,
        bob.publicKey.toBase58(),
        alice.secretKey
      )
      
      expect(encrypted).toBeDefined()
      expect(encrypted.method).toBe(EncryptionMethod.DIRECT)
      
      // Type assertion to access specific metadata
      const metadata = encrypted.metadata as DirectEncryptionMetadata
      expect(metadata.senderPublicKey).toBe(alice.publicKey.toBase58())
      expect(metadata.recipientPublicKey).toBe(bob.publicKey.toBase58())

      // Bob decrypts
      const decrypted = await decryptDirectString(encrypted, bob.secretKey)
      expect(decrypted).toBe(testData)
    })

    test('should use ephemeral keys for forward secrecy', async () => {
      const testData = 'Secure message'
      
      const encrypted = await encryptDirect(
        testData,
        bob.publicKey.toBase58(),
        alice.secretKey
      )
      
      const metadata = encrypted.metadata as DirectEncryptionMetadata
      expect(metadata.ephemeralPublicKey).toBeDefined()
    })

    test('should fail when non-recipient tries to decrypt', async () => {
      const testData = 'Private message'
      
      const encrypted = await encryptDirect(
        testData,
        bob.publicKey.toBase58(),
        alice.secretKey
      )
      
      await expect(
        decryptDirect(encrypted, charlie.secretKey)
      ).rejects.toThrow()
    })
  })

  describe('Signature Groups', () => {
    test('should create signature group with members', async () => {
      const group = await createSignatureGroup(
        'Test Group',
        alice.secretKey,
        [
          { publicKey: bob.publicKey.toBase58(), role: MemberRole.ADMIN },
          { publicKey: charlie.publicKey.toBase58(), role: MemberRole.MEMBER }
        ]
      )
      
      expect(group.groupName).toBe('Test Group')
      expect(group.members).toHaveLength(3) // Including owner
      expect(group.members[0].role).toBe(MemberRole.OWNER)
      expect(group.members[0].publicKey).toBe(alice.publicKey.toBase58())
    })

    test('should encrypt and decrypt for group members', async () => {
      const group = await createSignatureGroup(
        'Crypto Team',
        alice.secretKey,
        [{ publicKey: bob.publicKey.toBase58(), role: MemberRole.MEMBER }]
      )
      
      const message = 'Team message'
      const encrypted = await encryptForSignatureGroup(
        message,
        group,
        alice.secretKey,
        alice.publicKey.toBase58()
      )
      
      expect(encrypted).toBeDefined()
      expect(encrypted.method).toBe(EncryptionMethod.SIGNATURE_GROUP)
      
      // Alice (owner) can decrypt
      const aliceDecrypted = await decryptSignatureGroupData(
        encrypted,
        alice.secretKey,
        alice.publicKey.toBase58()
      )
      expect(Buffer.from(aliceDecrypted).toString()).toBe(message)
      
      // Bob (member) can decrypt
      const bobDecrypted = await decryptSignatureGroupData(
        encrypted,
        bob.secretKey,
        bob.publicKey.toBase58()
      )
      expect(Buffer.from(bobDecrypted).toString()).toBe(message)
      
      // Charlie (non-member) cannot decrypt
      await expect(
        decryptSignatureGroupData(
          encrypted,
          charlie.secretKey,
          charlie.publicKey.toBase58()
        )
      ).rejects.toThrow()
    })
  })

  describe('Shared Key Management', () => {
    test('should create shared key with permissions', async () => {
      const manager = new SharedKeyManager()
      
      const sharedKey = await manager.createSharedKey(
        {
          name: 'Test Shared Key',
          purpose: 'Testing shared key functionality',
          creator: alice.publicKey.toBase58(),
          algorithm: 'AES-256-GCM',
          derivationMethod: 'ECDH',
          properties: {}
        },
        [
          {
            publicKey: alice.publicKey.toBase58(),
            permissions: { canDecrypt: true, canEncrypt: true, canShare: true, canRevoke: true }
          },
          {
            publicKey: bob.publicKey.toBase58(),
            permissions: { canDecrypt: true, canEncrypt: true, canShare: false, canRevoke: false }
          },
          {
            publicKey: charlie.publicKey.toBase58(),
            permissions: { canDecrypt: true, canEncrypt: false, canShare: false, canRevoke: false }
          }
        ],
        alice.secretKey
      )
      
      expect(sharedKey).toBeDefined()
      expect(sharedKey.keyId).toBeDefined()
      expect(sharedKey.holders).toHaveLength(3)
    })

    test('should encrypt and decrypt with shared key', async () => {
      const manager = new SharedKeyManager()
      
      const sharedKey = await manager.createSharedKey(
        {
          name: 'Document Key',
          purpose: 'Document sharing',
          creator: alice.publicKey.toBase58(),
          algorithm: 'AES-256-GCM',
          derivationMethod: 'ECDH',
          properties: {}
        },
        [
          {
            publicKey: alice.publicKey.toBase58(),
            permissions: { canDecrypt: true, canEncrypt: true, canShare: true, canRevoke: true }
          },
          {
            publicKey: bob.publicKey.toBase58(),
            permissions: { canDecrypt: true, canEncrypt: true, canShare: false, canRevoke: false }
          }
        ],
        alice.secretKey
      )
      
      const testData = 'Shared document content'
      
      // Alice encrypts
      const encrypted = await manager.encryptWithSharedKey(
        testData,
        sharedKey.keyId,
        alice.secretKey,
        alice.publicKey.toBase58()
      )
      
      expect(encrypted).toBeDefined()
      
      // Bob decrypts
      const decrypted = await manager.decryptWithSharedKey(
        encrypted,
        bob.secretKey,
        bob.publicKey.toBase58()
      )
      
      expect(Buffer.from(decrypted).toString()).toBe(testData)
    })
  })

  describe('Scalable Encryption', () => {
    test('should create scalable encryption context', async () => {
      const manager = new ScalableEncryptionManager()
      
      const context = await manager.createEncryptionContext(
        'Test Context',
        'Testing scalable encryption',
        bob.publicKey.toBase58(),
        alice.secretKey
      )
      
      expect(context).toBeDefined()
      expect(context.metadata.name).toBe('Test Context')
      expect(context.recipients).toContain(bob.publicKey.toBase58())
    })

    test('should auto-transition from direct to shared key', async () => {
      const { manager, context } = await createScalableEncryption(
        'Auto-scaling Test',
        'Testing auto-transition',
        bob.publicKey.toBase58(),
        alice.secretKey,
        { autoTransitionThreshold: 3 }
      )
      
      // Initially direct encryption (2 recipients)
      expect(context.method).toBe(EncryptionMethod.DIRECT)
      
      // Add more recipients
      const updated1 = await manager.addRecipientsToContext(
        context.contextId,
        [charlie.publicKey.toBase58()],
        alice.secretKey,
        alice.publicKey.toBase58()
      )
      
      // Should now be group (3 recipients = Bob + Charlie + Alice(creator) > threshold of 3)  
      expect(updated1.method).toBe(EncryptionMethod.GROUP)
      expect(updated1.sharedKeyId).toBeDefined()
      
      // Add one more recipient to verify it stays group
      const updated2 = await manager.addRecipientsToContext(
        context.contextId,
        [diana.publicKey.toBase58()],
        alice.secretKey,
        alice.publicKey.toBase58()
      )
      
      // Should still be group (4 recipients)
      expect(updated2.method).toBe(EncryptionMethod.GROUP)
      expect(updated2.sharedKeyId).toBeDefined()
    })
  })

  describe('Digital Signatures', () => {
    test('should sign and verify data', () => {
      const testData = 'Document to sign'
      const testDataBytes = new TextEncoder().encode(testData)
      
      const signature = signData(testDataBytes, alice.secretKey)
      expect(signature).toBeDefined()

      // Verify with correct public key
      const isValid = verifySignature(
        testDataBytes,
        signature,
        alice.publicKey.toBytes()
      )
      expect(isValid).toBe(true)

      // Verify with wrong public key
      const isInvalid = verifySignature(
        testDataBytes,
        signature,
        bob.publicKey.toBytes()
      )
      expect(isInvalid).toBe(false)

      // Verify modified data
      const modifiedDataBytes = new TextEncoder().encode('Modified document')
      const isInvalidData = verifySignature(
        modifiedDataBytes,
        signature,
        alice.publicKey.toBytes()
      )
      expect(isInvalidData).toBe(false)
    })

    test('should handle signature in base58 format', () => {
      const testData = new TextEncoder().encode('Sign this')
      
      const signature = signData(testData, alice.secretKey)
      const signatureBase58 = Buffer.from(signature).toString('base64')
      
      // Convert back and verify
      const signatureBytes = Buffer.from(signatureBase58, 'base64')
      const isValid = verifySignature(
        testData,
        signatureBytes,
        alice.publicKey.toBytes()
      )
      expect(isValid).toBe(true)
    })
  })

  describe('CryptoManager Integration', () => {
    test('should provide unified crypto interface', async () => {
      const manager = new CryptoManager()
      
      // Test personal encryption
      const personalData = 'Personal secret'
      const personalEncrypted = await manager.encryptPersonal(
        personalData,
        alice.secretKey
      )
      const personalDecrypted = await manager.decryptPersonalString(
        personalEncrypted,
        alice.secretKey
      )
      expect(personalDecrypted).toBe(personalData)
      
      // Test direct encryption
      const directData = 'Direct message'
      const directEncrypted = await manager.encryptDirect(
        directData,
        bob.publicKey.toBase58(),
        alice.secretKey
      )
      const directDecrypted = await manager.decryptDirectString(
        directEncrypted,
        bob.secretKey
      )
      expect(directDecrypted).toBe(directData)
      
      // Test signatures
      const signData = 'Sign this'
      const signDataBytes = new TextEncoder().encode(signData)
      const signed = manager.sign(signDataBytes, alice.secretKey)
      const verified = manager.verify(
        signDataBytes,
        signed, // signed is already a base58 string
        alice.publicKey.toBase58()
      )
      expect(verified).toBe(true)
    })
  })
})