/**
 * Simple crypto test without setup dependencies
 */

import { describe, test, expect } from '@jest/globals'
import { Keypair } from '@solana/web3.js'
import {
  encryptPersonal,
  decryptPersonalString
} from '../src/crypto/index.js'

describe('Simple Crypto Test', () => {
  test('should encrypt and decrypt personal data', async () => {
    const keypair = Keypair.generate()
    const testData = 'Hello, crypto world!'
    
    // Encrypt
    const encrypted = await encryptPersonal(testData, keypair.secretKey)
    expect(encrypted).toBeDefined()
    expect(encrypted.encryptedData).toBeDefined()
    
    // Decrypt
    const decrypted = await decryptPersonalString(encrypted, keypair.secretKey)
    expect(decrypted).toBe(testData)
  })
})