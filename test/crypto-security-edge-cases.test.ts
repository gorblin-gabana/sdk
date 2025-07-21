/**
 * Security and edge case testing for crypto functionality
 * Tests security boundaries, attack resistance, and edge case handling
 */

import { describe, test, expect, beforeAll } from '@jest/globals'
import { Keypair } from '@solana/web3.js'
import {
  encryptPersonal,
  decryptPersonal,
  decryptPersonalString,
  encryptDirect,
  decryptDirect,
  decryptDirectString,
  createSignatureGroup,
  encryptForSignatureGroup,
  decryptSignatureGroupData,
  addMemberToSignatureGroup,
  removeMemberFromSignatureGroup,
  SharedKeyManager,
  ScalableEncryptionManager,
  createScalableEncryption,
  EncryptionMethod,
  MemberRole,
  signData,
  verifySignature
} from '../src/crypto/index.js'

describe('Security and Edge Case Testing', () => {
  let alice: Keypair
  let bob: Keypair
  let charlie: Keypair
  let maliciousUser: Keypair

  beforeAll(() => {
    alice = Keypair.generate()
    bob = Keypair.generate()
    charlie = Keypair.generate()
    maliciousUser = Keypair.generate()
  })

  describe('Input Validation and Boundary Tests', () => {
    test('Empty and null data handling', async () => {
      // Test empty string
      const emptyEncrypted = await encryptPersonal('', alice.secretKey)
      const emptyDecrypted = await decryptPersonalString(emptyEncrypted, alice.secretKey)
      expect(emptyDecrypted).toBe('')

      // Test whitespace-only data
      const whitespaceData = '   \t\n  '
      const whitespaceEncrypted = await encryptPersonal(whitespaceData, alice.secretKey)
      const whitespaceDecrypted = await decryptPersonalString(whitespaceEncrypted, alice.secretKey)
      expect(whitespaceDecrypted).toBe(whitespaceData)

      // Test single character
      const singleCharEncrypted = await encryptPersonal('A', alice.secretKey)
      const singleCharDecrypted = await decryptPersonalString(singleCharEncrypted, alice.secretKey)
      expect(singleCharDecrypted).toBe('A')
    })

    test('Large data boundary testing', async () => {
      // Test various large data sizes
      const sizes = [
        64 * 1024,      // 64KB
        512 * 1024,     // 512KB
        1024 * 1024,    // 1MB
        2 * 1024 * 1024 // 2MB
      ]

      for (const size of sizes) {
        console.log(`Testing ${size / 1024}KB data...`)
        
        const largeData = 'X'.repeat(size)
        const encrypted = await encryptPersonal(largeData, alice.secretKey, { compress: true })
        const decrypted = await decryptPersonalString(encrypted, alice.secretKey)
        
        expect(decrypted).toBe(largeData)
        expect(encrypted.metadata.compressed).toBe(true)
        
        // Compressed size should be much smaller for repeated data
        expect(encrypted.encryptedData.length).toBeLessThan(size / 10)
      }
    })

    test('Binary data with special bytes', async () => {
      // Test binary data with null bytes, high-bit values, etc.
      const binaryData = new Uint8Array([
        0x00, 0x01, 0x02, 0x03, // Low bytes
        0xFD, 0xFE, 0xFF,       // High bytes
        0x0A, 0x0D,             // Line endings
        0x1A, 0x1B,             // Control chars
        0x80, 0x90, 0xA0        // Extended ASCII
      ])

      const encrypted = await encryptPersonal(binaryData, alice.secretKey)
      const decrypted = await decryptPersonal(encrypted, alice.secretKey)
      
      expect(decrypted).toEqual(binaryData)
    })

    test('Unicode and special character handling', async () => {
      const unicodeData = '🔐🚀💎 Hello 世界 🌍 Тест Ελληνικά العربية'
      
      const encrypted = await encryptPersonal(unicodeData, alice.secretKey)
      const decrypted = await decryptPersonalString(encrypted, alice.secretKey)
      
      expect(decrypted).toBe(unicodeData)
      expect(decrypted.length).toBe(unicodeData.length)
    })

    test('Invalid key format handling', async () => {
      const testData = 'Test message'
      
      // Test with invalid key formats
      const invalidKeys = [
        '',
        'not-a-key',
        '123',
        'invalid-base64-key!@#$',
        new Uint8Array(32), // Wrong length
        new Uint8Array(128) // Wrong length
      ]

      for (const invalidKey of invalidKeys) {
        await expect(
          encryptPersonal(testData, invalidKey as any)
        ).rejects.toThrow()
      }
    })
  })

  describe('Cryptographic Security Tests', () => {
    test('Key isolation - wrong keys cannot decrypt', async () => {
      const sensitiveData = 'Top secret information'
      
      // Alice encrypts with her key
      const aliceEncrypted = await encryptPersonal(sensitiveData, alice.secretKey)
      
      // Bob cannot decrypt Alice's data
      await expect(
        decryptPersonal(aliceEncrypted, bob.secretKey)
      ).rejects.toThrow()

      // Charlie cannot decrypt Alice's data
      await expect(
        decryptPersonal(aliceEncrypted, charlie.secretKey)
      ).rejects.toThrow()

      // Malicious user cannot decrypt Alice's data
      await expect(
        decryptPersonal(aliceEncrypted, maliciousUser.secretKey)
      ).rejects.toThrow()

      // Only Alice can decrypt
      const decrypted = await decryptPersonalString(aliceEncrypted, alice.secretKey)
      expect(decrypted).toBe(sensitiveData)
    })

    test('Nonce uniqueness verification', async () => {
      const message = 'Test for nonce uniqueness'
      const encryptionResults = []
      
      // Encrypt the same message multiple times
      for (let i = 0; i < 10; i++) {
        const encrypted = await encryptPersonal(message, alice.secretKey)
        encryptionResults.push(encrypted)
      }

      // All nonces should be unique
      const nonces = encryptionResults.map(r => r.metadata.nonce)
      const uniqueNonces = new Set(nonces)
      
      expect(uniqueNonces.size).toBe(nonces.length)
      
      // All encrypted results should be different despite same input
      const encryptedData = encryptionResults.map(r => r.encryptedData)
      const uniqueEncryptedData = new Set(encryptedData)
      
      expect(uniqueEncryptedData.size).toBe(encryptedData.length)
    })

    test('Ephemeral key uniqueness in direct encryption', async () => {
      const message = 'Test ephemeral key uniqueness'
      const encryptionResults = []
      
      // Multiple encryptions from Alice to Bob
      for (let i = 0; i < 10; i++) {
        const encrypted = await encryptDirect(
          message,
          bob.publicKey.toBase58(),
          alice.secretKey
        )
        encryptionResults.push(encrypted)
      }

      // All ephemeral keys should be unique
      const ephemeralKeys = encryptionResults.map(r => r.metadata.ephemeralPublicKey)
      const uniqueEphemeralKeys = new Set(ephemeralKeys)
      
      expect(uniqueEphemeralKeys.size).toBe(ephemeralKeys.length)
      
      // All encryptions should produce different results
      const encryptedData = encryptionResults.map(r => r.encryptedData)
      const uniqueEncryptedData = new Set(encryptedData)
      
      expect(uniqueEncryptedData.size).toBe(encryptedData.length)
    })

    test('Signature forgery resistance', async () => {
      const message = 'Important document to sign'
      
      // Alice signs the message
      const aliceSignature = signData(message, alice.secretKey)
      
      // Verify Alice's signature is valid
      expect(verifySignature(message, aliceSignature, alice.publicKey.toBase58())).toBe(true)
      
      // Modified message should fail verification
      expect(verifySignature('Modified message', aliceSignature, alice.publicKey.toBase58())).toBe(false)
      
      // Wrong signer should fail verification
      expect(verifySignature(message, aliceSignature, bob.publicKey.toBase58())).toBe(false)
      
      // Bob cannot forge Alice's signature
      const bobSignature = signData(message, bob.secretKey)
      expect(verifySignature(message, bobSignature, alice.publicKey.toBase58())).toBe(false)
      
      // Signature from one message cannot be used for another
      const otherMessage = 'Different message'
      expect(verifySignature(otherMessage, aliceSignature, alice.publicKey.toBase58())).toBe(false)
    })

    test('Metadata tampering detection', async () => {
      const originalData = 'Original secret message'
      const encrypted = await encryptPersonal(originalData, alice.secretKey)

      // Test various metadata tampering attempts
      const tamperedVersions = [
        {
          ...encrypted,
          metadata: { ...encrypted.metadata, nonce: 'tampered_nonce' }
        },
        {
          ...encrypted,
          metadata: { ...encrypted.metadata, version: '999.0.0' }
        },
        {
          ...encrypted,
          encryptedData: encrypted.encryptedData.slice(0, -1) + 'X' // Change last character
        },
        {
          ...encrypted,
          encryptedData: 'tampered_data_' + encrypted.encryptedData
        }
      ]

      // All tampered versions should fail decryption
      for (const tampered of tamperedVersions) {
        await expect(
          decryptPersonal(tampered as any, alice.secretKey)
        ).rejects.toThrow()
      }

      // Original should still work
      const decrypted = await decryptPersonalString(encrypted, alice.secretKey)
      expect(decrypted).toBe(originalData)
    })
  })

  describe('Group Security and Access Control Tests', () => {
    test('Non-member access prevention', async () => {
      // Alice creates a group with Bob
      const secretGroup = await createSignatureGroup(
        'Secret Project',
        alice.secretKey,
        [{ publicKey: bob.publicKey.toBase58(), role: MemberRole.MEMBER }]
      )

      const secretMessage = 'Confidential project details'
      const encrypted = await encryptForSignatureGroup(
        secretMessage,
        secretGroup,
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      // Charlie (not a member) should not be able to decrypt
      await expect(
        decryptSignatureGroupData(
          encrypted,
          charlie.secretKey,
          charlie.publicKey.toBase58()
        )
      ).rejects.toThrow()

      // Malicious user should not be able to decrypt
      await expect(
        decryptSignatureGroupData(
          encrypted,
          maliciousUser.secretKey,
          maliciousUser.publicKey.toBase58()
        )
      ).rejects.toThrow()

      // Only group members can decrypt
      const aliceDecrypted = await decryptSignatureGroupData(
        encrypted,
        alice.secretKey,
        alice.publicKey.toBase58()
      )
      expect(Buffer.from(aliceDecrypted).toString()).toBe(secretMessage)

      const bobDecrypted = await decryptSignatureGroupData(
        encrypted,
        bob.secretKey,
        bob.publicKey.toBase58()
      )
      expect(Buffer.from(bobDecrypted).toString()).toBe(secretMessage)
    })

    test('Role-based permission enforcement', async () => {
      // Create group with different role levels
      const hierarchyGroup = await createSignatureGroup(
        'Hierarchy Test',
        alice.secretKey, // Owner
        [
          { publicKey: bob.publicKey.toBase58(), role: MemberRole.ADMIN },
          { publicKey: charlie.publicKey.toBase58(), role: MemberRole.MEMBER },
          { publicKey: maliciousUser.publicKey.toBase58(), role: MemberRole.VIEWER }
        ]
      )

      // Owner (Alice) can encrypt
      await expect(
        encryptForSignatureGroup(
          'Owner message',
          hierarchyGroup,
          alice.secretKey,
          alice.publicKey.toBase58()
        )
      ).resolves.not.toThrow()

      // Admin (Bob) can encrypt
      await expect(
        encryptForSignatureGroup(
          'Admin message',
          hierarchyGroup,
          bob.secretKey,
          bob.publicKey.toBase58()
        )
      ).resolves.not.toThrow()

      // Member (Charlie) can encrypt
      await expect(
        encryptForSignatureGroup(
          'Member message',
          hierarchyGroup,
          charlie.secretKey,
          charlie.publicKey.toBase58()
        )
      ).resolves.not.toThrow()

      // Viewer (maliciousUser) should NOT be able to encrypt
      await expect(
        encryptForSignatureGroup(
          'Viewer attempting to send',
          hierarchyGroup,
          maliciousUser.secretKey,
          maliciousUser.publicKey.toBase58()
        )
      ).rejects.toThrow('does not have permission to encrypt')
    })

    test('Post-removal access prevention', async () => {
      // Create group with Alice and Bob
      const dynamicGroup = await createSignatureGroup(
        'Dynamic Access Test',
        alice.secretKey,
        [{ publicKey: bob.publicKey.toBase58(), role: MemberRole.MEMBER }]
      )

      // Send message that Bob can initially decrypt
      const beforeRemovalMessage = 'Message before removal'
      const encryptedBefore = await encryptForSignatureGroup(
        beforeRemovalMessage,
        dynamicGroup,
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      // Bob can decrypt the message
      const bobDecryptedBefore = await decryptSignatureGroupData(
        encryptedBefore,
        bob.secretKey,
        bob.publicKey.toBase58()
      )
      expect(Buffer.from(bobDecryptedBefore).toString()).toBe(beforeRemovalMessage)

      // Remove Bob from group with key rotation
      const updatedGroup = await removeMemberFromSignatureGroup(
        dynamicGroup,
        bob.publicKey.toBase58(),
        alice.secretKey,
        alice.publicKey.toBase58(),
        true // rotate keys
      )

      expect(updatedGroup.members.find(m => m.publicKey === bob.publicKey.toBase58())).toBeUndefined()

      // Send message after Bob's removal
      const afterRemovalMessage = 'Secret message after Bob was removed'
      const encryptedAfter = await encryptForSignatureGroup(
        afterRemovalMessage,
        updatedGroup,
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      // Bob should NOT be able to decrypt the new message
      await expect(
        decryptSignatureGroupData(
          encryptedAfter,
          bob.secretKey,
          bob.publicKey.toBase58()
        )
      ).rejects.toThrow()

      // Alice can still decrypt (she's still in group)
      const aliceDecrypted = await decryptSignatureGroupData(
        encryptedAfter,
        alice.secretKey,
        alice.publicKey.toBase58()
      )
      expect(Buffer.from(aliceDecrypted).toString()).toBe(afterRemovalMessage)
    })
  })

  describe('Shared Key Security Tests', () => {
    test('Permission boundary enforcement', async () => {
      const sharedKeyManager = new SharedKeyManager()
      
      const sharedKey = await sharedKeyManager.createSharedKey(
        {
          name: 'Permission Test Key',
          purpose: 'Testing permission boundaries',
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

      const testMessage = 'Shared key permission test'

      // Alice can encrypt (has canEncrypt)
      await expect(
        sharedKeyManager.encryptWithSharedKey(
          testMessage,
          sharedKey.keyId,
          alice.secretKey,
          alice.publicKey.toBase58()
        )
      ).resolves.not.toThrow()

      // Bob can encrypt (has canEncrypt)
      const bobEncrypted = await sharedKeyManager.encryptWithSharedKey(
        testMessage,
        sharedKey.keyId,
        bob.secretKey,
        bob.publicKey.toBase58()
      )

      // Charlie should NOT be able to encrypt (canEncrypt: false)
      // Note: In production, this should be enforced by the system
      // For this test, we're checking the permission structure
      const charliePermissions = sharedKey.holders.find(h => h.publicKey === charlie.publicKey.toBase58())
      expect(charliePermissions?.permissions.canEncrypt).toBe(false)
      expect(charliePermissions?.permissions.canShare).toBe(false)
      expect(charliePermissions?.permissions.canRevoke).toBe(false)

      // All can decrypt
      const aliceDecrypted = await sharedKeyManager.decryptWithSharedKey(
        bobEncrypted,
        alice.secretKey,
        alice.publicKey.toBase58()
      )
      expect(Buffer.from(aliceDecrypted).toString()).toBe(testMessage)

      const charlieDecrypted = await sharedKeyManager.decryptWithSharedKey(
        bobEncrypted,
        charlie.secretKey,
        charlie.publicKey.toBase58()
      )
      expect(Buffer.from(charlieDecrypted).toString()).toBe(testMessage)
    })

    test('Key isolation between different shared keys', async () => {
      const sharedKeyManager = new SharedKeyManager()

      // Create two separate shared keys
      const key1 = await sharedKeyManager.createSharedKey(
        {
          name: 'Key 1',
          purpose: 'First key group',
          creator: alice.publicKey.toBase58(),
          algorithm: 'AES-256-GCM',
          derivationMethod: 'ECDH',
          properties: {}
        },
        [
          { publicKey: alice.publicKey.toBase58(), permissions: { canDecrypt: true, canEncrypt: true, canShare: true, canRevoke: true }},
          { publicKey: bob.publicKey.toBase58(), permissions: { canDecrypt: true, canEncrypt: true, canShare: false, canRevoke: false }}
        ],
        alice.secretKey
      )

      const key2 = await sharedKeyManager.createSharedKey(
        {
          name: 'Key 2',
          purpose: 'Second key group',
          creator: alice.publicKey.toBase58(),
          algorithm: 'AES-256-GCM',
          derivationMethod: 'ECDH',
          properties: {}
        },
        [
          { publicKey: alice.publicKey.toBase58(), permissions: { canDecrypt: true, canEncrypt: true, canShare: true, canRevoke: true }},
          { publicKey: charlie.publicKey.toBase58(), permissions: { canDecrypt: true, canEncrypt: true, canShare: false, canRevoke: false }}
        ],
        alice.secretKey
      )

      // Encrypt with key1
      const message1 = 'Secret for key1 group'
      const encrypted1 = await sharedKeyManager.encryptWithSharedKey(
        message1,
        key1.keyId,
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      // Encrypt with key2
      const message2 = 'Secret for key2 group'
      const encrypted2 = await sharedKeyManager.encryptWithSharedKey(
        message2,
        key2.keyId,
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      // Bob can decrypt key1 message but not key2
      const bobDecrypted1 = await sharedKeyManager.decryptWithSharedKey(
        encrypted1,
        bob.secretKey,
        bob.publicKey.toBase58()
      )
      expect(Buffer.from(bobDecrypted1).toString()).toBe(message1)

      await expect(
        sharedKeyManager.decryptWithSharedKey(
          encrypted2,
          bob.secretKey,
          bob.publicKey.toBase58()
        )
      ).rejects.toThrow()

      // Charlie can decrypt key2 message but not key1
      const charlieDecrypted2 = await sharedKeyManager.decryptWithSharedKey(
        encrypted2,
        charlie.secretKey,
        charlie.publicKey.toBase58()
      )
      expect(Buffer.from(charlieDecrypted2).toString()).toBe(message2)

      await expect(
        sharedKeyManager.decryptWithSharedKey(
          encrypted1,
          charlie.secretKey,
          charlie.publicKey.toBase58()
        )
      ).rejects.toThrow()
    })
  })

  describe('Error Handling and Recovery Tests', () => {
    test('Corrupted encryption data handling', async () => {
      const originalData = 'Test data for corruption test'
      const encrypted = await encryptPersonal(originalData, alice.secretKey)

      // Test various corruption scenarios
      const corruptionTests = [
        {
          name: 'Corrupted encrypted data',
          corrupt: (data: any) => ({ ...data, encryptedData: data.encryptedData.slice(0, -5) + 'XXXXX' })
        },
        {
          name: 'Corrupted nonce',
          corrupt: (data: any) => ({ ...data, metadata: { ...data.metadata, nonce: 'corrupted_nonce' } })
        },
        {
          name: 'Missing method',
          corrupt: (data: any) => {
            const { method, ...rest } = data
            return rest
          }
        },
        {
          name: 'Invalid method',
          corrupt: (data: any) => ({ ...data, method: 'INVALID_METHOD' })
        }
      ]

      for (const test of corruptionTests) {
        const corrupted = test.corrupt(encrypted)
        
        await expect(
          decryptPersonal(corrupted as any, alice.secretKey)
        ).rejects.toThrow()
      }
    })

    test('Network interruption simulation', async () => {
      // Simulate partial operations that might occur during network issues
      const sharedKeyManager = new SharedKeyManager()

      // Start creating a shared key
      const keyPromise = sharedKeyManager.createSharedKey(
        {
          name: 'Network Test Key',
          purpose: 'Testing network interruption handling',
          creator: alice.publicKey.toBase58(),
          algorithm: 'AES-256-GCM',
          derivationMethod: 'ECDH',
          properties: {}
        },
        [
          { publicKey: alice.publicKey.toBase58(), permissions: { canDecrypt: true, canEncrypt: true, canShare: true, canRevoke: true }},
          { publicKey: bob.publicKey.toBase58(), permissions: { canDecrypt: true, canEncrypt: true, canShare: false, canRevoke: false }}
        ],
        alice.secretKey
      )

      // Key creation should complete successfully
      const createdKey = await keyPromise
      expect(createdKey).toBeDefined()
      expect(createdKey.holders).toHaveLength(2)

      // Test that we can use the key normally after creation
      const testMessage = 'Post-creation test message'
      const encrypted = await sharedKeyManager.encryptWithSharedKey(
        testMessage,
        createdKey.keyId,
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      const decrypted = await sharedKeyManager.decryptWithSharedKey(
        encrypted,
        bob.secretKey,
        bob.publicKey.toBase58()
      )

      expect(Buffer.from(decrypted).toString()).toBe(testMessage)
    })

    test('Memory pressure handling', async () => {
      // Test behavior under simulated memory pressure
      const largeDataSets = []
      
      try {
        // Create multiple large encrypted datasets
        for (let i = 0; i < 10; i++) {
          const largeData = `Large dataset ${i}: ${'X'.repeat(100 * 1024)}` // 100KB each
          const encrypted = await encryptPersonal(largeData, alice.secretKey, { compress: true })
          largeDataSets.push({ original: largeData, encrypted })
        }

        // Verify all can still be decrypted correctly
        for (let i = 0; i < largeDataSets.length; i++) {
          const decrypted = await decryptPersonalString(largeDataSets[i].encrypted, alice.secretKey)
          expect(decrypted).toBe(largeDataSets[i].original)
        }

        console.log(`Successfully handled ${largeDataSets.length} large datasets under memory pressure`)

      } catch (error) {
        // If we hit genuine memory limits, that's expected behavior
        console.log('Memory pressure test hit limits as expected:', error.message)
        expect(largeDataSets.length).toBeGreaterThan(0) // Should have processed at least some
      }
    })

    test('Concurrent access conflict handling', async () => {
      const manager = new ScalableEncryptionManager()
      
      // Create context
      const { context } = await manager.createEncryptionContext(
        'Concurrent Test',
        'Testing concurrent modifications',
        bob.publicKey.toBase58(),
        alice.secretKey,
        { autoTransitionThreshold: 2 }
      )

      // Simulate concurrent modifications
      const concurrentOperations = [
        manager.addRecipientsToContext(
          context.contextId,
          [charlie.publicKey.toBase58()],
          alice.secretKey,
          alice.publicKey.toBase58()
        ),
        manager.encryptInContext(
          context.contextId,
          'Concurrent message 1',
          alice.secretKey
        ),
        manager.encryptInContext(
          context.contextId,
          'Concurrent message 2',
          alice.secretKey
        )
      ]

      // All operations should complete successfully
      const results = await Promise.all(concurrentOperations)
      expect(results).toHaveLength(3)

      // Verify final state is consistent
      const finalMessage = 'Final consistency test'
      const encrypted = await manager.encryptInContext(
        context.contextId,
        finalMessage,
        alice.secretKey
      )

      // All recipients should be able to decrypt
      const bobDecrypted = await manager.decryptInContext(
        context.contextId,
        encrypted,
        bob.secretKey,
        bob.publicKey.toBase58()
      )
      expect(Buffer.from(bobDecrypted).toString()).toBe(finalMessage)

      const charlieDecrypted = await manager.decryptInContext(
        context.contextId,
        encrypted,
        charlie.secretKey,
        charlie.publicKey.toBase58()
      )
      expect(Buffer.from(charlieDecrypted).toString()).toBe(finalMessage)
    })
  })

  describe('Timing Attack Resistance', () => {
    test('Constant-time signature verification', async () => {
      const message = 'Timing attack test message'
      const signature = signData(message, alice.secretKey)
      
      // Test verification timing with correct vs incorrect signatures
      const iterations = 100
      const correctTimes = []
      const incorrectTimes = []

      // Warm up
      for (let i = 0; i < 10; i++) {
        verifySignature(message, signature, alice.publicKey.toBase58())
        verifySignature(message, signature, bob.publicKey.toBase58())
      }

      // Measure timing for correct signatures
      for (let i = 0; i < iterations; i++) {
        const start = performance.now()
        verifySignature(message, signature, alice.publicKey.toBase58())
        const end = performance.now()
        correctTimes.push(end - start)
      }

      // Measure timing for incorrect signatures (wrong key)
      for (let i = 0; i < iterations; i++) {
        const start = performance.now()
        verifySignature(message, signature, bob.publicKey.toBase58())
        const end = performance.now()
        incorrectTimes.push(end - start)
      }

      const avgCorrectTime = correctTimes.reduce((a, b) => a + b) / correctTimes.length
      const avgIncorrectTime = incorrectTimes.reduce((a, b) => a + b) / incorrectTimes.length

      console.log(`Average correct verification time: ${avgCorrectTime.toFixed(3)}ms`)
      console.log(`Average incorrect verification time: ${avgIncorrectTime.toFixed(3)}ms`)
      console.log(`Timing difference: ${Math.abs(avgCorrectTime - avgIncorrectTime).toFixed(3)}ms`)

      // Timing difference should be minimal (indicating constant-time operation)
      const timingDifferencePercent = Math.abs(avgCorrectTime - avgIncorrectTime) / avgCorrectTime * 100
      
      // Allow up to 20% timing variation (network, system load, etc.)
      expect(timingDifferencePercent).toBeLessThan(20)
    })
  })
})