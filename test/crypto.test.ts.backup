/**
 * Comprehensive tests for the crypto functionality
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
  verifySignature
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

      // Decrypt
      const decrypted = await decryptPersonalString(encrypted, alice.secretKey)
      expect(decrypted).toBe(testData)
    })

    test('should encrypt with compression', async () => {
      const testData = 'This is a longer message that should benefit from compression'.repeat(10)
      
      const encrypted = await encryptPersonal(testData, alice.secretKey, { compress: true })
      expect(encrypted.metadata).toHaveProperty('compressed', true)

      const decrypted = await decryptPersonalString(encrypted, alice.secretKey)
      expect(decrypted).toBe(testData)
    })

    test('should fail with wrong private key', async () => {
      const testData = 'Secret message'
      const encrypted = await encryptPersonal(testData, alice.secretKey)

      await expect(
        decryptPersonal(encrypted, bob.secretKey)
      ).rejects.toThrow()
    })
  })

  describe('Direct Encryption', () => {
    test('should encrypt and decrypt between two parties', async () => {
      const testData = 'Hello Bob, this is Alice!'
      
      // Alice encrypts for Bob
      const encrypted = await encryptDirect(
        testData,
        bob.publicKey.toBase58(),
        alice.secretKey
      )
      
      expect(encrypted).toBeDefined()
      expect(encrypted.method).toBe(EncryptionMethod.DIRECT)
      expect(encrypted.metadata.senderPublicKey).toBe(alice.publicKey.toBase58())
      expect(encrypted.metadata.recipientPublicKey).toBe(bob.publicKey.toBase58())

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
      
      expect(encrypted.metadata.ephemeralPublicKey).toBeDefined()
    })

    test('should fail with wrong recipient private key', async () => {
      const testData = 'Secret message'
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
    test('should create and use signature groups', async () => {
      // Alice creates a group with Bob as admin
      const group = await createSignatureGroup(
        'Test Team',
        alice.secretKey,
        [{ publicKey: bob.publicKey.toBase58(), role: MemberRole.ADMIN }],
        {
          allowDynamicMembership: true,
          maxMembers: 10
        }
      )

      expect(group).toBeDefined()
      expect(group.groupName).toBe('Test Team')
      expect(group.members).toHaveLength(2) // Alice (owner) + Bob (admin)
      expect(group.permissions.allowDynamicMembership).toBe(true)

      // Alice encrypts for the group
      const testData = 'Team announcement'
      const encrypted = await encryptForSignatureGroup(
        testData,
        group,
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      expect(encrypted.method).toBe(EncryptionMethod.SIGNATURE_GROUP)

      // Bob can decrypt
      const bobDecrypted = await decryptSignatureGroupData(
        encrypted,
        bob.secretKey,
        bob.publicKey.toBase58()
      )

      expect(Buffer.from(bobDecrypted).toString()).toBe(testData)

      // Alice can also decrypt
      const aliceDecrypted = await decryptSignatureGroupData(
        encrypted,
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      expect(Buffer.from(aliceDecrypted).toString()).toBe(testData)
    })

    test('should enforce permissions', async () => {
      const group = await createSignatureGroup(
        'Restricted Team',
        alice.secretKey,
        [{ publicKey: bob.publicKey.toBase58(), role: MemberRole.VIEWER }]
      )

      // Bob (viewer) should not be able to encrypt
      await expect(
        encryptForSignatureGroup(
          'Should fail',
          group,
          bob.secretKey,
          bob.publicKey.toBase58()
        )
      ).rejects.toThrow('does not have permission to encrypt')
    })
  })

  describe('Shared Key Manager', () => {
    test('should create and manage shared keys', async () => {
      const sharedKeyManager = new SharedKeyManager()
      
      const sharedKey = await sharedKeyManager.createSharedKey(
        {
          name: 'Team Key',
          purpose: 'Secure communications',
          creator: alice.publicKey.toBase58(),
          algorithm: 'AES-256-GCM',
          derivationMethod: 'ECDH',
          properties: {}
        },
        [
          {
            publicKey: alice.publicKey.toBase58(),
            permissions: {
              canDecrypt: true,
              canEncrypt: true,
              canShare: true,
              canRevoke: true
            }
          },
          {
            publicKey: bob.publicKey.toBase58(),
            permissions: {
              canDecrypt: true,
              canEncrypt: true,
              canShare: false,
              canRevoke: false
            }
          }
        ],
        alice.secretKey
      )

      expect(sharedKey).toBeDefined()
      expect(sharedKey.holders).toHaveLength(2)

      // Encrypt with shared key
      const testData = 'Shared secret'
      const encrypted = await sharedKeyManager.encryptWithSharedKey(
        testData,
        sharedKey.keyId,
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      // Both Alice and Bob can decrypt
      const aliceDecrypted = await sharedKeyManager.decryptWithSharedKey(
        encrypted,
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      const bobDecrypted = await sharedKeyManager.decryptWithSharedKey(
        encrypted,
        bob.secretKey,
        bob.publicKey.toBase58()
      )

      expect(Buffer.from(aliceDecrypted).toString()).toBe(testData)
      expect(Buffer.from(bobDecrypted).toString()).toBe(testData)
    })

    test('should add recipients to shared key', async () => {
      const sharedKeyManager = new SharedKeyManager()
      
      const sharedKey = await sharedKeyManager.createSharedKey(
        {
          name: 'Expandable Key',
          purpose: 'Growing team',
          creator: alice.publicKey.toBase58(),
          algorithm: 'AES-256-GCM',
          derivationMethod: 'ECDH',
          properties: {}
        },
        [
          {
            publicKey: alice.publicKey.toBase58(),
            permissions: {
              canDecrypt: true,
              canEncrypt: true,
              canShare: true,
              canRevoke: true
            }
          }
        ],
        alice.secretKey
      )

      // Add Bob to the key
      const expandedKey = await sharedKeyManager.addRecipientsToSharedKey(
        sharedKey.keyId,
        [
          {
            publicKey: bob.publicKey.toBase58(),
            permissions: {
              canDecrypt: true,
              canEncrypt: false,
              canShare: false,
              canRevoke: false
            }
          }
        ],
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      expect(expandedKey.holders).toHaveLength(2)

      // Test encryption/decryption
      const testData = 'Now Bob can access this'
      const encrypted = await sharedKeyManager.encryptWithSharedKey(
        testData,
        sharedKey.keyId,
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      const bobDecrypted = await sharedKeyManager.decryptWithSharedKey(
        encrypted,
        bob.secretKey,
        bob.publicKey.toBase58()
      )

      expect(Buffer.from(bobDecrypted).toString()).toBe(testData)
    })
  })

  describe('Scalable Encryption', () => {
    test('should transition from direct to shared encryption', async () => {
      const { manager, context } = await createScalableEncryption(
        'Growing Project',
        'Team collaboration',
        bob.publicKey.toBase58(),
        alice.secretKey,
        {
          autoTransitionThreshold: 2
        }
      )

      // Initially should use direct encryption
      expect(context.method).toBe(EncryptionMethod.DIRECT)
      expect(context.recipients).toHaveLength(1)

      // Encrypt first message
      const message1 = 'Hello Bob!'
      const encrypted1 = await manager.encryptInContext(
        context.contextId,
        message1,
        alice.secretKey
      )

      expect(encrypted1.method).toBe(EncryptionMethod.DIRECT)

      // Add Charlie - should trigger transition
      const updatedContext = await manager.addRecipientsToContext(
        context.contextId,
        [charlie.publicKey.toBase58()],
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      expect(updatedContext.method).toBe(EncryptionMethod.GROUP)
      expect(updatedContext.recipients).toHaveLength(2)
      expect(updatedContext.sharedKeyId).toBeDefined()

      // Now should use shared encryption
      const message2 = 'Welcome Charlie!'
      const encrypted2 = await manager.encryptInContext(
        context.contextId,
        message2,
        alice.secretKey
      )

      expect(encrypted2.method).toBe(EncryptionMethod.GROUP)

      // Both Bob and Charlie can decrypt
      const bobDecrypted = await manager.decryptInContext(
        context.contextId,
        encrypted2,
        bob.secretKey,
        bob.publicKey.toBase58()
      )

      const charlieDecrypted = await manager.decryptInContext(
        context.contextId,
        encrypted2,
        charlie.secretKey,
        charlie.publicKey.toBase58()
      )

      expect(Buffer.from(bobDecrypted).toString()).toBe(message2)
      expect(Buffer.from(charlieDecrypted).toString()).toBe(message2)
    })

    test('should remove recipients and rotate keys', async () => {
      const { manager, context } = await createScalableEncryption(
        'Security Test',
        'Key rotation test',
        bob.publicKey.toBase58(),
        alice.secretKey,
        { autoTransitionThreshold: 1 }
      )

      // Add Charlie and Diana
      await manager.addRecipientsToContext(
        context.contextId,
        [charlie.publicKey.toBase58(), diana.publicKey.toBase58()],
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      // Remove Charlie with key rotation
      const updatedContext = await manager.removeRecipientsFromContext(
        context.contextId,
        [charlie.publicKey.toBase58()],
        alice.secretKey,
        alice.publicKey.toBase58(),
        true // rotate keys
      )

      expect(updatedContext.recipients).toHaveLength(2) // Bob and Diana
      expect(updatedContext.recipients).not.toContain(charlie.publicKey.toBase58())

      // Encrypt new message with rotated keys
      const secretMessage = 'Charlie should not see this'
      const encrypted = await manager.encryptInContext(
        context.contextId,
        secretMessage,
        alice.secretKey
      )

      // Bob and Diana can decrypt
      const bobDecrypted = await manager.decryptInContext(
        context.contextId,
        encrypted,
        bob.secretKey,
        bob.publicKey.toBase58()
      )

      const dianaDecrypted = await manager.decryptInContext(
        context.contextId,
        encrypted,
        diana.secretKey,
        diana.publicKey.toBase58()
      )

      expect(Buffer.from(bobDecrypted).toString()).toBe(secretMessage)
      expect(Buffer.from(dianaDecrypted).toString()).toBe(secretMessage)

      // Charlie should not be able to decrypt
      await expect(
        manager.decryptInContext(
          context.contextId,
          encrypted,
          charlie.secretKey,
          charlie.publicKey.toBase58()
        )
      ).rejects.toThrow()
    })
  })

  describe('Crypto Manager Integration', () => {
    test('should handle all encryption methods through unified interface', async () => {
      const cryptoManager = new CryptoManager()

      // Personal encryption
      const personalResult = await cryptoManager.encrypt('Personal secret', {
        method: EncryptionMethod.PERSONAL,
        privateKey: alice.secretKey
      })

      const personalDecrypted = await cryptoManager.decryptString(
        personalResult,
        alice.secretKey
      )

      expect(personalDecrypted).toBe('Personal secret')

      // Direct encryption
      const directResult = await cryptoManager.encrypt('Direct message', {
        method: EncryptionMethod.DIRECT,
        privateKey: alice.secretKey,
        recipientPublicKey: bob.publicKey.toBase58()
      })

      const directDecrypted = await cryptoManager.decryptString(
        directResult,
        bob.secretKey
      )

      expect(directDecrypted).toBe('Direct message')
    })

    test('should generate and validate keypairs', () => {
      const cryptoManager = new CryptoManager()

      const keypair = cryptoManager.generateKeypair()
      expect(keypair.publicKey).toBeDefined()
      expect(keypair.privateKey).toBeDefined()
      expect(cryptoManager.validatePublicKey(keypair.publicKey)).toBe(true)
      expect(cryptoManager.validatePublicKey('invalid-key')).toBe(false)
    })
  })

  describe('Digital Signatures', () => {
    test('should sign and verify data', () => {
      const testData = 'Document to sign'
      
      const signature = signData(testData, alice.secretKey)
      expect(signature).toBeDefined()

      // Verify with correct public key
      const isValid = verifySignature(
        testData,
        signature,
        alice.publicKey.toBase58()
      )
      expect(isValid).toBe(true)

      // Verify with wrong public key
      const isInvalid = verifySignature(
        testData,
        signature,
        bob.publicKey.toBase58()
      )
      expect(isInvalid).toBe(false)

      // Verify modified data
      const isInvalidData = verifySignature(
        'Modified document',
        signature,
        alice.publicKey.toBase58()
      )
      expect(isInvalidData).toBe(false)
    })

    test('should use crypto manager for signatures', () => {
      const cryptoManager = new CryptoManager()
      const testData = 'Contract agreement'

      const signature = cryptoManager.sign(testData, alice.secretKey)
      expect(signature).toBeDefined()

      const isValid = cryptoManager.verify(
        testData,
        signature,
        alice.publicKey.toBase58()
      )
      expect(isValid).toBe(true)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty data', async () => {
      const emptyData = ''
      
      const encrypted = await encryptPersonal(emptyData, alice.secretKey)
      const decrypted = await decryptPersonalString(encrypted, alice.secretKey)
      
      expect(decrypted).toBe(emptyData)
    })

    test('should handle binary data', async () => {
      const binaryData = new Uint8Array([1, 2, 3, 4, 5, 255])
      
      const encrypted = await encryptPersonal(binaryData, alice.secretKey)
      const decrypted = await decryptPersonal(encrypted, alice.secretKey)
      
      expect(decrypted).toEqual(binaryData)
    })

    test('should handle invalid encryption results', async () => {
      const invalidResult = {
        encryptedData: 'invalid',
        method: EncryptionMethod.PERSONAL,
        metadata: {
          nonce: 'invalid',
          timestamp: Date.now(),
          version: '1.0.0'
        }
      }

      await expect(
        decryptPersonal(invalidResult as any, alice.secretKey)
      ).rejects.toThrow()
    })

    test('should validate group permissions', async () => {
      const group = await createSignatureGroup(
        'Permission Test',
        alice.secretKey,
        []
      )

      // Try to add member without permission
      await expect(
        encryptForSignatureGroup(
          'Test',
          group,
          bob.secretKey, // Bob is not a member
          bob.publicKey.toBase58()
        )
      ).rejects.toThrow('not a member')
    })
  })
})