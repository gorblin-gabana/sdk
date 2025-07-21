import { useState } from 'react'
import { Keypair } from '@solana/web3.js'
import { CryptoMethodExecutor } from '../components/CryptoMethodExecutor'

// Crypto test categories for the playground
const cryptoTestCategories = {
  'Personal Encryption': [
    {
      id: 'personal-encrypt',
      name: 'Personal Encrypt',
      description: 'Encrypt data with your private key (only you can decrypt)',
      method: 'encryptPersonal',
      params: [
        {
          name: 'data',
          type: 'string',
          placeholder: 'My secret message',
          required: true
        },
        {
          name: 'privateKey',
          type: 'string',
          placeholder: 'Click "Generate Keys" to get a private key',
          required: true
        },
        {
          name: 'compress',
          type: 'boolean',
          placeholder: 'true',
          required: false
        }
      ],
      example: `
import { encryptPersonal } from '@gorbchain-xyz/chaindecode';

const encrypted = await encryptPersonal(
  'My secret data',
  privateKey,
  { compress: true }
);
console.log('Encrypted:', encrypted);`
    },
    {
      id: 'personal-decrypt',
      name: 'Personal Decrypt',
      description: 'Decrypt data encrypted with your private key',
      method: 'decryptPersonal',
      params: [
        {
          name: 'encryptedResult',
          type: 'object',
          placeholder: 'Paste encrypted result from Personal Encrypt',
          required: true
        },
        {
          name: 'privateKey',
          type: 'string',
          placeholder: 'Your private key',
          required: true
        }
      ],
      example: `
import { decryptPersonalString } from '@gorbchain-xyz/chaindecode';

const decrypted = await decryptPersonalString(
  encryptedResult,
  privateKey
);
console.log('Decrypted:', decrypted);`
    }
  ],

  'Direct Encryption': [
    {
      id: 'direct-encrypt',
      name: 'Encrypt to Recipient',
      description: 'Encrypt data for a specific recipient using their public key',
      method: 'encryptDirect',
      params: [
        {
          name: 'data',
          type: 'string',
          placeholder: 'Hello Bob!',
          required: true
        },
        {
          name: 'recipientPublicKey',
          type: 'string',
          placeholder: 'Recipient public key',
          required: true
        },
        {
          name: 'senderPrivateKey',
          type: 'string',
          placeholder: 'Your private key',
          required: true
        },
        {
          name: 'compress',
          type: 'boolean',
          placeholder: 'true',
          required: false
        }
      ],
      example: `
import { encryptDirect } from '@gorbchain-xyz/chaindecode';

const encrypted = await encryptDirect(
  'Secret message for Bob',
  bobPublicKey,
  alicePrivateKey,
  { compress: true }
);`
    },
    {
      id: 'direct-decrypt',
      name: 'Decrypt from Sender',
      description: 'Decrypt data encrypted for you by another party',
      method: 'decryptDirect',
      params: [
        {
          name: 'encryptedResult',
          type: 'object',
          placeholder: 'Encrypted result from direct encryption',
          required: true
        },
        {
          name: 'recipientPrivateKey',
          type: 'string',
          placeholder: 'Your private key',
          required: true
        }
      ],
      example: `
import { decryptDirectString } from '@gorbchain-xyz/chaindecode';

const decrypted = await decryptDirectString(
  encryptedResult,
  recipientPrivateKey
);`
    }
  ],

  'Signature Groups': [
    {
      id: 'create-signature-group',
      name: 'Create Dynamic Group',
      description: 'Create a signature-based group with role-based permissions',
      method: 'createSignatureGroup',
      params: [
        {
          name: 'groupName',
          type: 'string',
          placeholder: 'My Secure Team',
          required: true
        },
        {
          name: 'creatorPrivateKey',
          type: 'string',
          placeholder: 'Your private key',
          required: true
        },
        {
          name: 'initialMembers',
          type: 'array',
          placeholder: '[{"publicKey": "...", "role": "ADMIN"}]',
          required: false
        },
        {
          name: 'allowDynamicMembership',
          type: 'boolean',
          placeholder: 'true',
          required: false
        },
        {
          name: 'maxMembers',
          type: 'number',
          placeholder: '10',
          required: false
        }
      ],
      example: `
import { createSignatureGroup, MemberRole } from '@gorbchain-xyz/chaindecode';

const group = await createSignatureGroup(
  'Project Alpha Team',
  creatorPrivateKey,
  [{ publicKey: bobPublicKey, role: MemberRole.ADMIN }],
  { allowDynamicMembership: true, maxMembers: 20 }
);`
    },
    {
      id: 'encrypt-signature-group',
      name: 'Encrypt for Group',
      description: 'Encrypt data for all members of a signature group',
      method: 'encryptForSignatureGroup',
      params: [
        {
          name: 'data',
          type: 'string',
          placeholder: 'Team announcement',
          required: true
        },
        {
          name: 'groupMetadata',
          type: 'object',
          placeholder: 'Group metadata from createSignatureGroup',
          required: true
        },
        {
          name: 'senderPrivateKey',
          type: 'string',
          placeholder: 'Your private key',
          required: true
        },
        {
          name: 'senderPublicKey',
          type: 'string',
          placeholder: 'Your public key',
          required: true
        }
      ],
      example: `
import { encryptForSignatureGroup } from '@gorbchain-xyz/chaindecode';

const encrypted = await encryptForSignatureGroup(
  'Important team update',
  groupMetadata,
  senderPrivateKey,
  senderPublicKey,
  { compress: true }
);`
    },
    {
      id: 'add-group-member',
      name: 'Add Group Member',
      description: 'Add a new member to an existing signature group',
      method: 'addMemberToSignatureGroup',
      params: [
        {
          name: 'groupMetadata',
          type: 'object',
          placeholder: 'Existing group metadata',
          required: true
        },
        {
          name: 'newMemberPublicKey',
          type: 'string',
          placeholder: 'New member public key',
          required: true
        },
        {
          name: 'newMemberRole',
          type: 'string',
          placeholder: 'MEMBER',
          required: true
        },
        {
          name: 'authorizerPrivateKey',
          type: 'string',
          placeholder: 'Authorizer private key',
          required: true
        },
        {
          name: 'authorizerPublicKey',
          type: 'string',
          placeholder: 'Authorizer public key',
          required: true
        }
      ],
      example: `
import { addMemberToSignatureGroup, MemberRole } from '@gorbchain-xyz/chaindecode';

const updatedGroup = await addMemberToSignatureGroup(
  groupMetadata,
  { publicKey: charliePublicKey, role: MemberRole.MEMBER },
  authorizerPrivateKey,
  authorizerPublicKey
);`
    }
  ],

  'Scalable Encryption': [
    {
      id: 'create-scalable-context',
      name: 'Create Scalable Context',
      description: 'Create encryption context that scales from 1 to N recipients',
      method: 'createScalableEncryption',
      params: [
        {
          name: 'contextName',
          type: 'string',
          placeholder: 'Project Communications',
          required: true
        },
        {
          name: 'purpose',
          type: 'string',
          placeholder: 'Secure team messaging',
          required: true
        },
        {
          name: 'initialRecipient',
          type: 'string',
          placeholder: 'Initial recipient public key',
          required: true
        },
        {
          name: 'creatorPrivateKey',
          type: 'string',
          placeholder: 'Your private key',
          required: true
        },
        {
          name: 'autoTransitionThreshold',
          type: 'number',
          placeholder: '3',
          required: false
        }
      ],
      example: `
import { createScalableEncryption } from '@gorbchain-xyz/chaindecode';

const { manager, context } = await createScalableEncryption(
  'Project Alpha',
  'Team communications',
  initialRecipientPublicKey,
  creatorPrivateKey,
  { autoTransitionThreshold: 3 }
);`
    },
    {
      id: 'encrypt-in-context',
      name: 'Encrypt in Context',
      description: 'Encrypt data within a scalable context (auto-scales method)',
      method: 'encryptInContext',
      params: [
        {
          name: 'contextId',
          type: 'string',
          placeholder: 'Context ID from createScalableEncryption',
          required: true
        },
        {
          name: 'data',
          type: 'string',
          placeholder: 'Message for the team',
          required: true
        },
        {
          name: 'senderPrivateKey',
          type: 'string',
          placeholder: 'Your private key',
          required: true
        }
      ],
      example: `
// Uses direct encryption for 1-2 recipients
// Automatically switches to shared key for 3+ recipients
const encrypted = await manager.encryptInContext(
  contextId,
  'Hello team!',
  senderPrivateKey
);`
    },
    {
      id: 'add-context-recipients',
      name: 'Add Context Recipients',
      description: 'Add recipients to context (triggers auto-scaling)',
      method: 'addRecipientsToContext',
      params: [
        {
          name: 'contextId',
          type: 'string',
          placeholder: 'Context ID',
          required: true
        },
        {
          name: 'newRecipients',
          type: 'array',
          placeholder: '["publicKey1", "publicKey2"]',
          required: true
        },
        {
          name: 'authorizerPrivateKey',
          type: 'string',
          placeholder: 'Your private key',
          required: true
        },
        {
          name: 'authorizerPublicKey',
          type: 'string',
          placeholder: 'Your public key',
          required: true
        }
      ],
      example: `
const updatedContext = await manager.addRecipientsToContext(
  contextId,
  [charliePublicKey, dianaPublicKey],
  authorizerPrivateKey,
  authorizerPublicKey
);
// Context automatically transitions to shared key encryption`
    }
  ],

  'Shared Keys': [
    {
      id: 'create-shared-key',
      name: 'Create Shared Key',
      description: 'Create a shared encryption key with granular permissions',
      method: 'createSharedKey',
      params: [
        {
          name: 'keyName',
          type: 'string',
          placeholder: 'Team Meeting Key',
          required: true
        },
        {
          name: 'purpose',
          type: 'string',
          placeholder: 'Meeting notes encryption',
          required: true
        },
        {
          name: 'recipients',
          type: 'array',
          placeholder: '[{"publicKey": "...", "permissions": {...}}]',
          required: true
        },
        {
          name: 'creatorPrivateKey',
          type: 'string',
          placeholder: 'Your private key',
          required: true
        }
      ],
      example: `
import { SharedKeyManager } from '@gorbchain-xyz/chaindecode';

const sharedKeyManager = new SharedKeyManager();
const sharedKey = await sharedKeyManager.createSharedKey(
  { name: 'Team Key', purpose: 'Secure docs', creator: creatorPublicKey },
  [
    { publicKey: alicePublicKey, permissions: { canDecrypt: true, canEncrypt: true, canShare: true } },
    { publicKey: bobPublicKey, permissions: { canDecrypt: true, canEncrypt: true, canShare: false } }
  ],
  creatorPrivateKey
);`
    },
    {
      id: 'encrypt-shared-key',
      name: 'Encrypt with Shared Key',
      description: 'Encrypt data using a shared key',
      method: 'encryptWithSharedKey',
      params: [
        {
          name: 'data',
          type: 'string',
          placeholder: 'Confidential document',
          required: true
        },
        {
          name: 'keyId',
          type: 'string',
          placeholder: 'Shared key ID',
          required: true
        },
        {
          name: 'senderPrivateKey',
          type: 'string',
          placeholder: 'Your private key',
          required: true
        },
        {
          name: 'senderPublicKey',
          type: 'string',
          placeholder: 'Your public key',
          required: true
        }
      ],
      example: `
const encrypted = await sharedKeyManager.encryptWithSharedKey(
  'Confidential team data',
  sharedKey.keyId,
  senderPrivateKey,
  senderPublicKey
);`
    },
    {
      id: 'add-shared-key-recipients',
      name: 'Add Shared Key Recipients',
      description: 'Add new recipients to an existing shared key',
      method: 'addRecipientsToSharedKey',
      params: [
        {
          name: 'keyId',
          type: 'string',
          placeholder: 'Shared key ID',
          required: true
        },
        {
          name: 'newRecipients',
          type: 'array',
          placeholder: '[{"publicKey": "...", "permissions": {...}}]',
          required: true
        },
        {
          name: 'authorizerPrivateKey',
          type: 'string',
          placeholder: 'Authorizer private key',
          required: true
        },
        {
          name: 'authorizerPublicKey',
          type: 'string',
          placeholder: 'Authorizer public key',
          required: true
        }
      ],
      example: `
const updatedKey = await sharedKeyManager.addRecipientsToSharedKey(
  keyId,
  [{ publicKey: charliePublicKey, permissions: { canDecrypt: true, canEncrypt: false } }],
  authorizerPrivateKey,
  authorizerPublicKey
);`
    }
  ],

  'Utilities': [
    {
      id: 'generate-keypair',
      name: 'Generate Keypair',
      description: 'Generate a new Solana keypair for testing',
      method: 'generateKeypair',
      params: [],
      example: `
import { Keypair } from '@solana/web3.js';

const keypair = Keypair.generate();
console.log('Public Key:', keypair.publicKey.toBase58());
console.log('Private Key:', Buffer.from(keypair.secretKey).toString('base64'));`
    },
    {
      id: 'sign-data',
      name: 'Sign Data',
      description: 'Create a digital signature for data',
      method: 'signData',
      params: [
        {
          name: 'data',
          type: 'string',
          placeholder: 'Data to sign',
          required: true
        },
        {
          name: 'privateKey',
          type: 'string',
          placeholder: 'Your private key',
          required: true
        }
      ],
      example: `
import { signData } from '@gorbchain-xyz/chaindecode';

const signature = signData(
  'Document to authorize',
  privateKey
);`
    },
    {
      id: 'verify-signature',
      name: 'Verify Signature',
      description: 'Verify a digital signature',
      method: 'verifySignature',
      params: [
        {
          name: 'data',
          type: 'string',
          placeholder: 'Original data',
          required: true
        },
        {
          name: 'signature',
          type: 'string',
          placeholder: 'Signature to verify',
          required: true
        },
        {
          name: 'publicKey',
          type: 'string',
          placeholder: 'Signer public key',
          required: true
        }
      ],
      example: `
import { verifySignature } from '@gorbchain-xyz/chaindecode';

const isValid = verifySignature(
  originalData,
  signature,
  signerPublicKey
);`
    }
  ]
}

// Key generation helper component
function KeyGenerationHelper({ onKeysGenerated }: { onKeysGenerated: (keys: { publicKey: string, privateKey: string }[]) => void }) {
  const [generatedKeys, setGeneratedKeys] = useState<{ publicKey: string, privateKey: string }[]>([])

  const generateKeys = (count: number = 3) => {
    const keys = []
    for (let i = 0; i < count; i++) {
      const keypair = Keypair.generate()
      keys.push({
        publicKey: keypair.publicKey.toBase58(),
        privateKey: Buffer.from(keypair.secretKey).toString('base64')
      })
    }
    setGeneratedKeys(keys)
    onKeysGenerated(keys)
  }

  return (
    <div className="mb-6 docs-card bg-white rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">🔑 Test Keys Generator</h3>
      <p className="text-sm text-gray-600 mb-3">
        Generate test keypairs for crypto operations. These are for testing only - never use in production!
      </p>
      
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => generateKeys(3)}
          className="btn-primary px-3 py-2 text-sm rounded-lg"
        >
          Generate 3 Keys
        </button>
        <button
          onClick={() => generateKeys(5)}
          className="btn-primary px-3 py-2 text-sm rounded-lg"
        >
          Generate 5 Keys
        </button>
        <button
          onClick={() => generateKeys(1)}
          className="btn-primary px-3 py-2 text-sm rounded-lg"
        >
          Generate 1 Key
        </button>
      </div>

      {generatedKeys.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-900">Generated Keys (click to copy):</p>
          {generatedKeys.map((key, index) => (
            <div key={index} className="text-xs bg-gray-50 p-2 rounded border border-gray-200">
              <div className="font-medium text-gray-700">Key {index + 1}:</div>
              <div 
                className="font-mono cursor-pointer hover:bg-gray-100 p-1 rounded"
                onClick={() => navigator.clipboard.writeText(key.publicKey)}
                title="Click to copy"
              >
                <span className="text-emerald-600">Public:</span> {key.publicKey}
              </div>
              <div 
                className="font-mono cursor-pointer hover:bg-gray-100 p-1 rounded"
                onClick={() => navigator.clipboard.writeText(key.privateKey)}
                title="Click to copy"
              >
                <span className="text-red-600">Private:</span> {key.privateKey.substring(0, 20)}...
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function CryptoPlayground() {
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [generatedKeys, setGeneratedKeys] = useState<{ publicKey: string, privateKey: string }[]>([])

  const allMethods = Object.values(cryptoTestCategories).flat()
  const selectedMethodData = allMethods.find(m => m.id === selectedMethod)

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🔐 Crypto Playground</h1>
        <p className="text-lg text-gray-600">
          Interactive testing environment for GorbchainSDK encryption and decryption features
        </p>
      </div>

      <KeyGenerationHelper onKeysGenerated={setGeneratedKeys} />

      {/* Demo Mode Notice - GorbchainSDK Theme */}
      <div className="mb-6 docs-card bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex items-start">
          <div className="text-yellow-500 mr-3 mt-1">⚡</div>
          <div>
            <h3 className="text-lg font-semibold text-yellow-900 mb-1">Demo Mode Active</h3>
            <p className="text-sm text-yellow-800 mb-2">
              This playground runs in demo mode with simulated encryption for browser compatibility. 
              All cryptographic operations are educational examples only.
            </p>
            <div className="text-xs text-yellow-700">
              <p>✅ <strong>Working features:</strong> Key generation, encryption/decryption simulation, signature demo</p>
              <p>🔒 <strong>Production use:</strong> Install the full SDK for real cryptographic operations</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Method Categories - GorbchainSDK Theme */}
        <div className="xl:col-span-2">
          <div className="docs-card bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-4">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6">
              <h2 className="text-xl font-bold mb-2">
                🔐 Crypto Methods
              </h2>
              <p className="text-emerald-100 text-sm">
                Choose a cryptographic operation to test
              </p>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              {Object.entries(cryptoTestCategories).map(([category, methods]) => (
                <div key={category} className="mb-6 last:mb-0">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {methods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                          selectedMethod === method.id
                            ? 'bg-emerald-500 text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-50 border border-transparent hover:border-gray-200'
                        }`}
                      >
                        <div className="font-medium text-sm">{method.name}</div>
                        <div className={`text-xs mt-1 ${
                          selectedMethod === method.id 
                            ? 'text-emerald-100' 
                            : 'text-gray-500'
                        }`}>
                          {method.description.substring(0, 60)}...
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Method Executor - GorbchainSDK Theme */}
        <div className="xl:col-span-3">
          {selectedMethodData ? (
            <CryptoMethodExecutor
              key={selectedMethod}
              method={selectedMethodData}
              generatedKeys={generatedKeys}
            />
          ) : (
            <div className="docs-card bg-white rounded-lg border border-gray-200 p-8 text-center">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <div className="text-3xl">🔐</div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Welcome to the Crypto Playground
              </h2>
              <p className="text-gray-600 mb-6 text-lg max-w-2xl mx-auto">
                Select a cryptographic method from the sidebar to start exploring encryption, decryption, and digital signatures.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="text-green-600 text-2xl mb-3">✅</div>
                  <h3 className="font-semibold text-green-900 mb-2">What Works</h3>
                  <ul className="text-sm text-green-800 space-y-1 text-left">
                    <li>• Key generation & validation</li>
                    <li>• Encryption/decryption demos</li>
                    <li>• Digital signature testing</li>
                    <li>• Group management simulation</li>
                  </ul>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="text-yellow-600 text-2xl mb-3">🔒</div>
                  <h3 className="font-semibold text-yellow-900 mb-2">Production Use</h3>
                  <ul className="text-sm text-yellow-800 space-y-1 text-left">
                    <li>• Install full SDK for real crypto</li>
                    <li>• Never use demo keys in production</li>
                    <li>• Follow security best practices</li>
                    <li>• Validate all implementations</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3">Available Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-700">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                    Personal Encryption
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full mr-2"></div>
                    Direct Encryption
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-700 rounded-full mr-2"></div>
                    Signature Groups
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Scalable Contexts
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                    Shared Keys
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-700 rounded-full mr-2"></div>
                    Digital Signatures
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CryptoPlayground