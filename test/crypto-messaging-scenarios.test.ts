/**
 * Real-world messaging application test scenarios
 * Tests the crypto functionality in practical messaging contexts
 */

import { describe, test, expect, beforeAll } from '@jest/globals'
import { Keypair } from '@solana/web3.js'
import {
  encryptPersonal,
  decryptPersonalString,
  encryptDirect,
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

describe('Real-World Messaging Scenarios', () => {
  let alice: Keypair // Team lead
  let bob: Keypair   // Developer
  let charlie: Keypair // Designer
  let diana: Keypair   // Product manager
  let eve: Keypair     // External contractor
  let frank: Keypair   // HR representative

  beforeAll(() => {
    // Generate realistic user keypairs
    alice = Keypair.generate()   // Team lead
    bob = Keypair.generate()     // Developer
    charlie = Keypair.generate() // Designer  
    diana = Keypair.generate()   // Product manager
    eve = Keypair.generate()     // External contractor
    frank = Keypair.generate()   // HR representative
  })

  describe('Private Personal Notes & Drafts', () => {
    test('Personal message drafts - encrypted locally', async () => {
      // Alice saves personal message drafts encrypted
      const draftMessages = [
        'Meeting notes: Need to discuss budget with Diana',
        'Todo: Review Bob\'s code changes before Friday',
        'Personal reminder: Update team on project timeline'
      ]

      const encryptedDrafts = []
      
      for (const draft of draftMessages) {
        const encrypted = await encryptPersonal(draft, alice.secretKey, {
          compress: true,
          metadata: {
            type: 'message_draft',
            timestamp: Date.now(),
            app: 'SecureMessaging'
          }
        })
        encryptedDrafts.push(encrypted)
      }

      // Alice can retrieve and read all her drafts
      for (let i = 0; i < encryptedDrafts.length; i++) {
        const decrypted = await decryptPersonalString(encryptedDrafts[i], alice.secretKey)
        expect(decrypted).toBe(draftMessages[i])
        expect(encryptedDrafts[i].metadata.type).toBe('message_draft')
      }
    })

    test('Personal conversation history encryption', async () => {
      // Store conversation history locally with personal encryption
      const conversationHistory = {
        participants: [alice.publicKey.toBase58(), bob.publicKey.toBase58()],
        messages: [
          { sender: alice.publicKey.toBase58(), content: 'Hey Bob, can you help with the API?', timestamp: Date.now() - 3600000 },
          { sender: bob.publicKey.toBase58(), content: 'Sure! I\'ll take a look this afternoon', timestamp: Date.now() - 3000000 },
          { sender: alice.publicKey.toBase58(), content: 'Thanks! The endpoint is /api/users', timestamp: Date.now() - 1800000 }
        ]
      }

      const encrypted = await encryptPersonal(
        JSON.stringify(conversationHistory), 
        alice.secretKey,
        {
          compress: true,
          metadata: {
            type: 'conversation_history',
            participants: conversationHistory.participants,
            messageCount: conversationHistory.messages.length
          }
        }
      )

      const decrypted = await decryptPersonalString(encrypted, alice.secretKey)
      const recoveredHistory = JSON.parse(decrypted)

      expect(recoveredHistory.participants).toEqual(conversationHistory.participants)
      expect(recoveredHistory.messages).toHaveLength(3)
      expect(recoveredHistory.messages[0].content).toBe('Hey Bob, can you help with the API?')
    })
  })

  describe('Direct Messaging (1-on-1 Chat)', () => {
    test('Basic secure messaging between Alice and Bob', async () => {
      // Alice sends secure message to Bob
      const message = 'The API key for the new service is: sk_live_abc123xyz'
      
      const encrypted = await encryptDirect(
        message,
        bob.publicKey.toBase58(),
        alice.secretKey,
        {
          compress: false,
          includeMetadata: true,
          metadata: {
            messageType: 'secure_api_key',
            urgency: 'high',
            expiresAt: Date.now() + 86400000 // 24 hours
          }
        }
      )

      expect(encrypted.metadata.senderPublicKey).toBe(alice.publicKey.toBase58())
      expect(encrypted.metadata.recipientPublicKey).toBe(bob.publicKey.toBase58())

      // Bob receives and decrypts
      const decrypted = await decryptDirectString(encrypted, bob.secretKey)
      expect(decrypted).toBe(message)
    })

    test('Confidential HR conversation', async () => {
      // Frank (HR) sends sensitive info to Alice (Team Lead)
      const hrMessage = {
        subject: 'Performance Review - Confidential',
        content: 'Alice, here are the salary adjustment details for your team members...',
        salaryAdjustments: [
          { employee: 'Bob Developer', adjustment: '+$5000' },
          { employee: 'Charlie Designer', adjustment: '+$3000' }
        ],
        effective_date: '2024-01-01'
      }

      const encrypted = await encryptDirect(
        JSON.stringify(hrMessage),
        alice.publicKey.toBase58(),
        frank.secretKey,
        {
          compress: true,
          metadata: {
            classification: 'confidential',
            department: 'HR',
            requiresSignature: true
          }
        }
      )

      const decrypted = await decryptDirectString(encrypted, alice.secretKey)
      const recoveredMessage = JSON.parse(decrypted)

      expect(recoveredMessage.subject).toContain('Confidential')
      expect(recoveredMessage.salaryAdjustments).toHaveLength(2)
    })

    test('Technical discussion with code snippets', async () => {
      // Bob sends code review to Alice with sensitive implementation details
      const codeReview = `
        // Security vulnerability found in authentication
        if (user.password === req.body.password) {
          // NEVER do this in production!
          // Use bcrypt.compare instead
        }
        
        Proposed fix:
        const isValid = await bcrypt.compare(req.body.password, user.hashedPassword);
      `

      const encrypted = await encryptDirect(
        codeReview,
        alice.publicKey.toBase58(),
        bob.secretKey,
        {
          compress: true,
          metadata: {
            messageType: 'code_review',
            severity: 'critical',
            file: 'auth.js',
            line: 42
          }
        }
      )

      const decrypted = await decryptDirectString(encrypted, alice.secretKey)
      expect(decrypted).toContain('bcrypt.compare')
      expect(decrypted).toContain('NEVER do this')
    })

    test('Image/file sharing simulation', async () => {
      // Simulate encrypted file sharing - in real app would encrypt file chunks
      const fileMetadata = {
        filename: 'project_mockups_v2.png',
        size: 2048576, // 2MB
        hash: 'sha256:abc123def456',
        uploadedBy: charlie.publicKey.toBase58(),
        timestamp: Date.now(),
        mimeType: 'image/png'
      }

      // Charlie shares design file with Alice
      const encrypted = await encryptDirect(
        JSON.stringify(fileMetadata),
        alice.publicKey.toBase58(),
        charlie.secretKey,
        {
          metadata: {
            messageType: 'file_share',
            fileType: 'image',
            originalFileName: fileMetadata.filename
          }
        }
      )

      const decrypted = await decryptDirectString(encrypted, alice.secretKey)
      const recoveredMetadata = JSON.parse(decrypted)

      expect(recoveredMetadata.filename).toBe('project_mockups_v2.png')
      expect(recoveredMetadata.uploadedBy).toBe(charlie.publicKey.toBase58())
    })
  })

  describe('Group Messaging - Small Team Chat', () => {
    test('Development team group chat', async () => {
      // Alice creates development team group
      const devTeam = await createSignatureGroup(
        'Development Team',
        alice.secretKey,
        [
          { publicKey: bob.publicKey.toBase58(), role: MemberRole.MEMBER },
          { publicKey: charlie.publicKey.toBase58(), role: MemberRole.MEMBER }
        ],
        {
          allowDynamicMembership: true,
          maxMembers: 10,
          requireSignatureVerification: true
        }
      )

      expect(devTeam.members).toHaveLength(3) // Alice (owner) + Bob + Charlie
      
      // Alice sends announcement to the team
      const announcement = 'Sprint planning meeting tomorrow at 10 AM. Please review the tickets in advance.'
      
      const encrypted = await encryptForSignatureGroup(
        announcement,
        devTeam,
        alice.secretKey,
        alice.publicKey.toBase58(),
        {
          metadata: {
            messageType: 'announcement',
            priority: 'normal',
            channelId: 'dev-general'
          }
        }
      )

      // All team members can decrypt
      const bobDecrypted = await decryptSignatureGroupData(
        encrypted,
        bob.secretKey,
        bob.publicKey.toBase58()
      )

      const charlieDecrypted = await decryptSignatureGroupData(
        encrypted,
        charlie.secretKey,
        charlie.publicKey.toBase58()
      )

      expect(Buffer.from(bobDecrypted).toString()).toBe(announcement)
      expect(Buffer.from(charlieDecrypted).toString()).toBe(announcement)
    })

    test('Adding new team member to existing conversation', async () => {
      // Start with Alice and Bob
      const projectTeam = await createSignatureGroup(
        'Project Alpha',
        alice.secretKey,
        [{ publicKey: bob.publicKey.toBase58(), role: MemberRole.MEMBER }]
      )

      // Send initial message
      const initialMessage = 'Welcome to Project Alpha! We\'ll be working on the new authentication system.'
      
      const encrypted1 = await encryptForSignatureGroup(
        initialMessage,
        projectTeam,
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      // Add Diana (Product Manager) to the group
      const expandedTeam = await addMemberToSignatureGroup(
        projectTeam,
        { publicKey: diana.publicKey.toBase58(), role: MemberRole.ADMIN },
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      expect(expandedTeam.members).toHaveLength(3)

      // Send new message that Diana can decrypt
      const updateMessage = 'Diana has joined the team! She\'ll help with requirements gathering.'
      
      const encrypted2 = await encryptForSignatureGroup(
        updateMessage,
        expandedTeam,
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      // All three members can decrypt the new message
      const bobDecrypted = await decryptSignatureGroupData(
        encrypted2,
        bob.secretKey,
        bob.publicKey.toBase58()
      )

      const dianaDecrypted = await decryptSignatureGroupData(
        encrypted2,
        diana.secretKey,
        diana.publicKey.toBase58()
      )

      expect(Buffer.from(bobDecrypted).toString()).toBe(updateMessage)
      expect(Buffer.from(dianaDecrypted).toString()).toBe(updateMessage)
    })

    test('Removing team member with key rotation for security', async () => {
      // Create team with external contractor
      const projectTeam = await createSignatureGroup(
        'Client Project',
        alice.secretKey,
        [
          { publicKey: bob.publicKey.toBase58(), role: MemberRole.MEMBER },
          { publicKey: eve.publicKey.toBase58(), role: MemberRole.VIEWER } // External contractor
        ]
      )

      // Send message that everyone can see
      const publicMessage = 'Project kickoff meeting is scheduled for Monday.'
      const encrypted1 = await encryptForSignatureGroup(
        publicMessage,
        projectTeam,
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      // Eve can decrypt public message
      const eveDecrypted1 = await decryptSignatureGroupData(
        encrypted1,
        eve.secretKey,
        eve.publicKey.toBase58()
      )
      expect(Buffer.from(eveDecrypted1).toString()).toBe(publicMessage)

      // Remove Eve (contractor work completed) with key rotation
      const updatedTeam = await removeMemberFromSignatureGroup(
        projectTeam,
        eve.publicKey.toBase58(),
        alice.secretKey,
        alice.publicKey.toBase58(),
        true // rotate keys for security
      )

      expect(updatedTeam.members).toHaveLength(2) // Only Alice and Bob
      expect(updatedTeam.members.find(m => m.publicKey === eve.publicKey.toBase58())).toBeUndefined()

      // Send sensitive message after contractor removal
      const sensitiveMessage = 'Now that the contractor is gone, let\'s discuss the budget constraints...'
      const encrypted2 = await encryptForSignatureGroup(
        sensitiveMessage,
        updatedTeam,
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      // Bob can still decrypt
      const bobDecrypted = await decryptSignatureGroupData(
        encrypted2,
        bob.secretKey,
        bob.publicKey.toBase58()
      )
      expect(Buffer.from(bobDecrypted).toString()).toBe(sensitiveMessage)

      // Eve should NOT be able to decrypt (keys were rotated)
      await expect(
        decryptSignatureGroupData(
          encrypted2,
          eve.secretKey,
          eve.publicKey.toBase58()
        )
      ).rejects.toThrow()
    })

    test('Role-based permissions in group chat', async () => {
      // Create team with different roles
      const corporateTeam = await createSignatureGroup(
        'Corporate Communications',
        alice.secretKey, // Alice is owner
        [
          { publicKey: bob.publicKey.toBase58(), role: MemberRole.ADMIN },
          { publicKey: charlie.publicKey.toBase58(), role: MemberRole.MEMBER },
          { publicKey: diana.publicKey.toBase58(), role: MemberRole.VIEWER }
        ]
      )

      // Alice (owner) can send messages
      const ownerMessage = 'Quarterly results will be announced next week.'
      const encrypted1 = await encryptForSignatureGroup(
        ownerMessage,
        corporateTeam,
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      // Bob (admin) can send messages
      const adminMessage = 'Please prepare your department reports by Friday.'
      const encrypted2 = await encryptForSignatureGroup(
        adminMessage,
        corporateTeam,
        bob.secretKey,
        bob.publicKey.toBase58()
      )

      // Charlie (member) can send messages
      const memberMessage = 'Design team report is ready for review.'
      const encrypted3 = await encryptForSignatureGroup(
        memberMessage,
        corporateTeam,
        charlie.secretKey,
        charlie.publicKey.toBase58()
      )

      // Diana (viewer) should NOT be able to send messages
      await expect(
        encryptForSignatureGroup(
          'I want to contribute too!',
          corporateTeam,
          diana.secretKey,
          diana.publicKey.toBase58()
        )
      ).rejects.toThrow('does not have permission to encrypt')

      // But Diana can decrypt and read all messages
      const dianaDecrypted1 = await decryptSignatureGroupData(
        encrypted1,
        diana.secretKey,
        diana.publicKey.toBase58()
      )
      
      expect(Buffer.from(dianaDecrypted1).toString()).toBe(ownerMessage)
    })
  })

  describe('Scalable Group Messaging - Growing Teams', () => {
    test('Startup team growth - auto-scaling encryption', async () => {
      const manager = new ScalableEncryptionManager()

      // Start small - Alice and Bob (startup founders)
      const { context } = await manager.createEncryptionContext(
        'Startup Communications',
        'Internal team chat that will grow',
        bob.publicKey.toBase58(),
        alice.secretKey,
        {
          autoTransitionThreshold: 3, // Switch to shared key when 3+ members
          maxMembers: 50
        }
      )

      expect(context.method).toBe(EncryptionMethod.DIRECT)

      // Early stage message
      const earlyMessage = 'We got our first customer! Time to celebrate 🎉'
      const encrypted1 = await manager.encryptInContext(
        context.contextId,
        earlyMessage,
        alice.secretKey
      )

      expect(encrypted1.method).toBe(EncryptionMethod.DIRECT)

      // Hire Charlie (designer) - still under threshold
      await manager.addRecipientsToContext(
        context.contextId,
        [charlie.publicKey.toBase58()],
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      // Hire Diana (product manager) - triggers transition to shared key
      const growingContext = await manager.addRecipientsToContext(
        context.contextId,
        [diana.publicKey.toBase58()],
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      expect(growingContext.method).toBe(EncryptionMethod.GROUP)
      expect(growingContext.sharedKeyId).toBeDefined()

      // Growth stage message - now uses shared key encryption
      const growthMessage = 'Team update: We\'re now 4 people! Let\'s plan our next quarter.'
      const encrypted2 = await manager.encryptInContext(
        context.contextId,
        growthMessage,
        alice.secretKey
      )

      expect(encrypted2.method).toBe(EncryptionMethod.GROUP)

      // All team members can decrypt
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

      const dianaDecrypted = await manager.decryptInContext(
        context.contextId,
        encrypted2,
        diana.secretKey,
        diana.publicKey.toBase58()
      )

      expect(Buffer.from(bobDecrypted).toString()).toBe(growthMessage)
      expect(Buffer.from(charlieDecrypted).toString()).toBe(growthMessage)
      expect(Buffer.from(dianaDecrypted).toString()).toBe(growthMessage)
    })

    test('Department reorganization - member transitions', async () => {
      const manager = new ScalableEncryptionManager()

      // Marketing department chat
      const { context } = await manager.createEncryptionContext(
        'Marketing Department',
        'Marketing team communications',
        bob.publicKey.toBase58(), // Marketing Manager
        alice.secretKey, // Alice is HR managing the setup
        { autoTransitionThreshold: 2 }
      )

      // Add marketing team members
      await manager.addRecipientsToContext(
        context.contextId,
        [charlie.publicKey.toBase58(), diana.publicKey.toBase58()],
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      // Marketing campaign message
      const campaignMessage = 'Q1 campaign budget approved: $50k. Let\'s plan the social media strategy.'
      const encrypted1 = await manager.encryptInContext(
        context.contextId,
        campaignMessage,
        bob.secretKey
      )

      // Department reorganization - Charlie moves to Design team
      await manager.removeRecipientsFromContext(
        context.contextId,
        [charlie.publicKey.toBase58()],
        alice.secretKey, // HR removes
        alice.publicKey.toBase58(),
        true // Rotate keys for security
      )

      // Add new marketing specialist Eve
      await manager.addRecipientsToContext(
        context.contextId,
        [eve.publicKey.toBase58()],
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      // New campaign message after reorganization
      const newCampaignMessage = 'Welcome Eve! Let\'s discuss the new product launch strategy.'
      const encrypted2 = await manager.encryptInContext(
        context.contextId,
        newCampaignMessage,
        bob.secretKey
      )

      // Current team members (Bob, Diana, Eve) can decrypt
      const bobDecrypted = await manager.decryptInContext(
        context.contextId,
        encrypted2,
        bob.secretKey,
        bob.publicKey.toBase58()
      )

      const dianaDecrypted = await manager.decryptInContext(
        context.contextId,
        encrypted2,
        diana.secretKey,
        diana.publicKey.toBase58()
      )

      const eveDecrypted = await manager.decryptInContext(
        context.contextId,
        encrypted2,
        eve.secretKey,
        eve.publicKey.toBase58()
      )

      expect(Buffer.from(bobDecrypted).toString()).toBe(newCampaignMessage)
      expect(Buffer.from(dianaDecrypted).toString()).toBe(newCampaignMessage)
      expect(Buffer.from(eveDecrypted).toString()).toBe(newCampaignMessage)

      // Charlie should not be able to decrypt new messages (key rotated)
      await expect(
        manager.decryptInContext(
          context.contextId,
          encrypted2,
          charlie.secretKey,
          charlie.publicKey.toBase58()
        )
      ).rejects.toThrow()
    })
  })

  describe('Message Signing and Verification', () => {
    test('Important announcements with signature verification', async () => {
      // Alice (CEO) signs important company announcement
      const announcement = `
        Company Update - Q4 2024
        
        Team,
        
        I'm excited to announce that we've secured Series A funding of $10M!
        This will help us scale our engineering team and expand to new markets.
        
        Best regards,
        Alice Thompson
        CEO & Founder
      `

      const signature = signData(announcement, alice.secretKey)
      
      // Create signed message package
      const signedMessage = {
        content: announcement,
        signature: signature,
        signer: alice.publicKey.toBase58(),
        title: 'Series A Funding Announcement',
        timestamp: Date.now(),
        importance: 'high'
      }

      // Encrypt and send to team
      const devTeam = await createSignatureGroup(
        'All Hands',
        alice.secretKey,
        [
          { publicKey: bob.publicKey.toBase58(), role: MemberRole.MEMBER },
          { publicKey: charlie.publicKey.toBase58(), role: MemberRole.MEMBER },
          { publicKey: diana.publicKey.toBase58(), role: MemberRole.MEMBER }
        ]
      )

      const encrypted = await encryptForSignatureGroup(
        JSON.stringify(signedMessage),
        devTeam,
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      // Team members decrypt and verify signature
      const bobDecrypted = await decryptSignatureGroupData(
        encrypted,
        bob.secretKey,
        bob.publicKey.toBase58()
      )

      const recoveredMessage = JSON.parse(Buffer.from(bobDecrypted).toString())
      
      // Bob verifies the CEO's signature
      const isVerified = verifySignature(
        recoveredMessage.content,
        recoveredMessage.signature,
        alice.publicKey.toBase58()
      )

      expect(isVerified).toBe(true)
      expect(recoveredMessage.title).toBe('Series A Funding Announcement')
      expect(recoveredMessage.importance).toBe('high')
    })

    test('Legal document approval workflow', async () => {
      // Multi-party contract approval with signatures
      const contract = `
        SOFTWARE DEVELOPMENT AGREEMENT
        
        This agreement is between:
        - Company: SecureChat Inc.
        - Contractor: External Developer
        
        Terms:
        - Duration: 3 months
        - Payment: $15,000
        - Deliverables: Mobile app development
      `

      // Alice (CEO) signs first
      const aliceSignature = signData(contract, alice.secretKey)
      
      // Bob (CTO) reviews and signs
      const bobSignature = signData(contract, bob.secretKey)
      
      // Eve (External contractor) signs
      const eveSignature = signData(contract, eve.secretKey)

      const fullySignedContract = {
        document: contract,
        signatures: [
          { signer: alice.publicKey.toBase58(), signature: aliceSignature, role: 'CEO', timestamp: Date.now() },
          { signer: bob.publicKey.toBase58(), signature: bobSignature, role: 'CTO', timestamp: Date.now() + 1000 },
          { signer: eve.publicKey.toBase58(), signature: eveSignature, role: 'Contractor', timestamp: Date.now() + 2000 }
        ],
        status: 'fully_executed',
        contractId: 'CTR-2024-001'
      }

      // Store securely with all parties
      const legalGroup = await createSignatureGroup(
        'Legal Documents',
        alice.secretKey,
        [
          { publicKey: bob.publicKey.toBase58(), role: MemberRole.ADMIN },
          { publicKey: eve.publicKey.toBase58(), role: MemberRole.VIEWER }
        ]
      )

      const encrypted = await encryptForSignatureGroup(
        JSON.stringify(fullySignedContract),
        legalGroup,
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      // All parties can access and verify all signatures
      const eveDecrypted = await decryptSignatureGroupData(
        encrypted,
        eve.secretKey,
        eve.publicKey.toBase58()
      )

      const recoveredContract = JSON.parse(Buffer.from(eveDecrypted).toString())

      // Verify all signatures
      for (const sig of recoveredContract.signatures) {
        const isValid = verifySignature(
          recoveredContract.document,
          sig.signature,
          sig.signer
        )
        expect(isValid).toBe(true)
      }

      expect(recoveredContract.status).toBe('fully_executed')
      expect(recoveredContract.signatures).toHaveLength(3)
    })
  })

  describe('Message Threading and Conversation Management', () => {
    test('Threaded conversations with encrypted replies', async () => {
      // Original message in team channel
      const originalMessage = {
        id: 'msg_001',
        content: 'Should we use React or Vue for the new dashboard?',
        author: alice.publicKey.toBase58(),
        timestamp: Date.now(),
        threadId: null,
        channelId: 'tech-discussion'
      }

      // Create tech discussion group
      const techGroup = await createSignatureGroup(
        'Tech Discussion',
        alice.secretKey,
        [
          { publicKey: bob.publicKey.toBase58(), role: MemberRole.MEMBER },
          { publicKey: charlie.publicKey.toBase58(), role: MemberRole.MEMBER }
        ]
      )

      const encryptedOriginal = await encryptForSignatureGroup(
        JSON.stringify(originalMessage),
        techGroup,
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      // Bob replies in thread
      const bobReply = {
        id: 'msg_002',
        content: 'I vote for React. We have more experience with it.',
        author: bob.publicKey.toBase58(),
        timestamp: Date.now() + 1000,
        threadId: 'msg_001', // Reply to original
        replyTo: 'msg_001',
        channelId: 'tech-discussion'
      }

      const encryptedBobReply = await encryptForSignatureGroup(
        JSON.stringify(bobReply),
        techGroup,
        bob.secretKey,
        bob.publicKey.toBase58()
      )

      // Charlie replies in same thread
      const charlieReply = {
        id: 'msg_003',
        content: 'React sounds good. I can help with the component library.',
        author: charlie.publicKey.toBase58(),
        timestamp: Date.now() + 2000,
        threadId: 'msg_001',
        replyTo: 'msg_001',
        channelId: 'tech-discussion'
      }

      const encryptedCharlieReply = await encryptForSignatureGroup(
        JSON.stringify(charlieReply),
        techGroup,
        charlie.secretKey,
        charlie.publicKey.toBase58()
      )

      // Alice can decrypt and see the full thread
      const decryptedOriginal = JSON.parse(Buffer.from(await decryptSignatureGroupData(
        encryptedOriginal, alice.secretKey, alice.publicKey.toBase58()
      )).toString())

      const decryptedBobReply = JSON.parse(Buffer.from(await decryptSignatureGroupData(
        encryptedBobReply, alice.secretKey, alice.publicKey.toBase58()
      )).toString())

      const decryptedCharlieReply = JSON.parse(Buffer.from(await decryptSignatureGroupData(
        encryptedCharlieReply, alice.secretKey, alice.publicKey.toBase58()
      )).toString())

      // Verify thread structure
      expect(decryptedOriginal.threadId).toBeNull()
      expect(decryptedBobReply.threadId).toBe('msg_001')
      expect(decryptedCharlieReply.threadId).toBe('msg_001')
      expect(decryptedBobReply.replyTo).toBe('msg_001')
    })
  })

  describe('Emergency and Security Scenarios', () => {
    test('Emergency key rotation after security incident', async () => {
      // Normal operation - team chat
      const incidentResponse = await createSignatureGroup(
        'Incident Response Team',
        alice.secretKey,
        [
          { publicKey: bob.publicKey.toBase58(), role: MemberRole.ADMIN },
          { publicKey: charlie.publicKey.toBase58(), role: MemberRole.MEMBER }
        ]
      )

      // Normal message
      const normalMessage = 'Weekly security review scheduled for tomorrow.'
      const encryptedNormal = await encryptForSignatureGroup(
        normalMessage,
        incidentResponse,
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      // Security incident detected - need to rotate all keys
      const emergencyMessage = 'SECURITY ALERT: Suspicious activity detected. All keys being rotated.'
      
      // Remove and re-add all members to force key rotation
      let updatedGroup = await removeMemberFromSignatureGroup(
        incidentResponse,
        bob.publicKey.toBase58(),
        alice.secretKey,
        alice.publicKey.toBase58(),
        true // force key rotation
      )

      updatedGroup = await removeMemberFromSignatureGroup(
        updatedGroup,
        charlie.publicKey.toBase58(),
        alice.secretKey,
        alice.publicKey.toBase58(),
        true
      )

      // Re-add members with new keys
      updatedGroup = await addMemberToSignatureGroup(
        updatedGroup,
        { publicKey: bob.publicKey.toBase58(), role: MemberRole.ADMIN },
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      updatedGroup = await addMemberToSignatureGroup(
        updatedGroup,
        { publicKey: charlie.publicKey.toBase58(), role: MemberRole.MEMBER },
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      // Send post-incident message with new keys
      const postIncidentMessage = 'Security incident resolved. New keys distributed. All clear.'
      const encryptedPostIncident = await encryptForSignatureGroup(
        postIncidentMessage,
        updatedGroup,
        alice.secretKey,
        alice.publicKey.toBase58()
      )

      // Team can decrypt new message
      const bobDecrypted = await decryptSignatureGroupData(
        encryptedPostIncident,
        bob.secretKey,
        bob.publicKey.toBase58()
      )

      expect(Buffer.from(bobDecrypted).toString()).toBe(postIncidentMessage)
    })
  })
})