/**
 * Scalable Encryption Example
 *
 * Demonstrates how to seamlessly transition from single recipient to group encryption
 * and manage shared encryption keys that can be distributed among multiple recipients.
 */

import {
  ScalableEncryptionManager,
  SharedKeyManager,
  createScalableEncryption,
  type SharePermissions,
} from "@gorbchain-xyz/chaindecode";
import { Keypair } from "@solana/web3.js";

async function main() {
  console.log("🚀 Scalable Encryption System Demo\n");

  // Generate participants
  const alice = Keypair.generate();
  const bob = Keypair.generate();
  const charlie = Keypair.generate();
  const diana = Keypair.generate();
  const eve = Keypair.generate();

  console.log("👥 Participants:");
  console.log("Alice (Creator):", alice.publicKey.toBase58());
  console.log("Bob:", bob.publicKey.toBase58());
  console.log("Charlie:", charlie.publicKey.toBase58());
  console.log("Diana:", diana.publicKey.toBase58());
  console.log("Eve:", eve.publicKey.toBase58());
  console.log();

  // ============================================
  // 1. Start with Single Recipient Encryption
  // ============================================
  console.log("1️⃣ Creating Scalable Encryption Context (Single Recipient)");
  console.log("--------------------------------------------------------");

  const { manager, context } = await createScalableEncryption(
    "Project Alpha Communications",
    "Secure team communication for Project Alpha",
    bob.publicKey.toBase58(), // Start with just Bob
    alice.secretKey,
    {
      autoTransitionThreshold: 2, // Transition to shared key when 2+ recipients
      defaultRecipientPermissions: {
        canDecrypt: true,
        canEncrypt: true,
        canShare: false,
        canRevoke: false,
      },
    },
  );

  console.log("Context created:", context.contextId);
  console.log("Initial method:", context.method);
  console.log("Recipients:", context.recipients.length);
  console.log();

  // Alice encrypts a message for Bob
  const message1 = "Hello Bob! Welcome to Project Alpha.";
  const encrypted1 = await manager.encryptInContext(
    context.contextId,
    message1,
    alice.secretKey,
  );

  console.log("Alice encrypted message for Bob (direct encryption)");
  console.log(
    "Encrypted data:",
    encrypted1.encryptedData.substring(0, 50) + "...",
  );

  // Bob decrypts
  const decrypted1 = await manager.decryptInContext(
    context.contextId,
    encrypted1,
    bob.secretKey,
    bob.publicKey.toBase58(),
  );

  console.log("Bob decrypted:", Buffer.from(decrypted1).toString());
  console.log();

  // ============================================
  // 2. Add Recipients - Automatic Transition
  // ============================================
  console.log("2️⃣ Adding Recipients (Automatic Transition to Shared Key)");
  console.log("--------------------------------------------------------");

  // Add Charlie - this will trigger automatic transition to shared key encryption
  const updatedContext1 = await manager.addRecipientsToContext(
    context.contextId,
    [charlie.publicKey.toBase58()],
    alice.secretKey,
    alice.publicKey.toBase58(),
  );

  console.log("Added Charlie. Context updated:");
  console.log("New method:", updatedContext1.method);
  console.log("Recipients:", updatedContext1.recipients.length);
  console.log(
    "Shared key ID:",
    updatedContext1.sharedKeyId?.substring(0, 16) + "...",
  );
  console.log();

  // Now encrypt with shared key (automatic)
  const message2 = "Welcome Charlie! This is now using shared key encryption.";
  const encrypted2 = await manager.encryptInContext(
    context.contextId,
    message2,
    alice.secretKey,
  );

  console.log("Alice encrypted message for group (shared key encryption)");

  // Both Bob and Charlie can decrypt
  const bobDecrypted2 = await manager.decryptInContext(
    context.contextId,
    encrypted2,
    bob.secretKey,
    bob.publicKey.toBase58(),
  );

  const charlieDecrypted2 = await manager.decryptInContext(
    context.contextId,
    encrypted2,
    charlie.secretKey,
    charlie.publicKey.toBase58(),
  );

  console.log("Bob decrypted:", Buffer.from(bobDecrypted2).toString());
  console.log("Charlie decrypted:", Buffer.from(charlieDecrypted2).toString());
  console.log();

  // ============================================
  // 3. Advanced Shared Key Management
  // ============================================
  console.log("3️⃣ Advanced Shared Key Management");
  console.log("----------------------------------");

  // Create a standalone shared key manager
  const sharedKeyManager = new SharedKeyManager();

  // Create a shared key for a different purpose
  const meetingKey = await sharedKeyManager.createSharedKey(
    {
      name: "Weekly Team Meeting",
      purpose: "Encrypted meeting notes and recordings",
      creator: alice.publicKey.toBase58(),
      algorithm: "AES-256-GCM",
      derivationMethod: "ECDH",
      properties: {
        department: "Engineering",
        classification: "Confidential",
      },
    },
    [
      {
        publicKey: alice.publicKey.toBase58(),
        permissions: {
          canDecrypt: true,
          canEncrypt: true,
          canShare: true,
          canRevoke: true,
        },
      },
      {
        publicKey: bob.publicKey.toBase58(),
        permissions: {
          canDecrypt: true,
          canEncrypt: true,
          canShare: false,
          canRevoke: false,
        },
      },
      {
        publicKey: charlie.publicKey.toBase58(),
        permissions: {
          canDecrypt: true,
          canEncrypt: false, // Charlie can only decrypt
          canShare: false,
          canRevoke: false,
        },
      },
    ],
    alice.secretKey,
  );

  console.log(
    "Created shared key for meetings:",
    meetingKey.keyId.substring(0, 16) + "...",
  );
  console.log("Initial key holders:", meetingKey.holders.length);

  // Encrypt meeting notes
  const meetingNotes = `
Weekly Team Meeting - ${new Date().toISOString()}
================================
Agenda:
1. Project Alpha progress update
2. Security protocols review
3. New team member onboarding

Action Items:
- Alice: Complete authentication module
- Bob: Review encryption implementation
- Charlie: Prepare documentation
  `;

  const encryptedNotes = await sharedKeyManager.encryptWithSharedKey(
    meetingNotes,
    meetingKey.keyId,
    alice.secretKey,
    alice.publicKey.toBase58(),
  );

  console.log("Meeting notes encrypted by Alice");

  // Bob and Charlie decrypt
  const bobNotes = await sharedKeyManager.decryptWithSharedKey(
    encryptedNotes,
    bob.secretKey,
    bob.publicKey.toBase58(),
  );

  const charlieNotes = await sharedKeyManager.decryptWithSharedKey(
    encryptedNotes,
    charlie.secretKey,
    charlie.publicKey.toBase58(),
  );

  console.log("Bob decrypted meeting notes successfully");
  console.log("Charlie decrypted meeting notes successfully");
  console.log();

  // ============================================
  // 4. Adding New Team Members
  // ============================================
  console.log("4️⃣ Adding New Team Members to Existing Keys");
  console.log("--------------------------------------------");

  // Add Diana and Eve to the meeting key
  const expandedMeetingKey = await sharedKeyManager.addRecipientsToSharedKey(
    meetingKey.keyId,
    [
      {
        publicKey: diana.publicKey.toBase58(),
        permissions: {
          canDecrypt: true,
          canEncrypt: true,
          canShare: false,
          canRevoke: false,
        },
      },
      {
        publicKey: eve.publicKey.toBase58(),
        permissions: {
          canDecrypt: true,
          canEncrypt: false,
          canShare: false,
          canRevoke: false,
        },
      },
    ],
    alice.secretKey, // Alice has sharing permissions
    alice.publicKey.toBase58(),
  );

  console.log("Added Diana and Eve to meeting key");
  console.log("Total key holders:", expandedMeetingKey.holders.length);

  // Also add them to the main project context
  const finalContext = await manager.addRecipientsToContext(
    context.contextId,
    [diana.publicKey.toBase58(), eve.publicKey.toBase58()],
    alice.secretKey,
    alice.publicKey.toBase58(),
  );

  console.log("Added Diana and Eve to project context");
  console.log("Total project recipients:", finalContext.recipients.length);

  // Encrypt a message for the entire team
  const teamMessage =
    "Welcome Diana and Eve! You now have access to all project communications.";
  const encryptedTeamMessage = await manager.encryptInContext(
    context.contextId,
    teamMessage,
    alice.secretKey,
  );

  console.log("Alice sent team-wide message");

  // All team members can decrypt
  const teamMembers = [
    { name: "Bob", keypair: bob },
    { name: "Charlie", keypair: charlie },
    { name: "Diana", keypair: diana },
    { name: "Eve", keypair: eve },
  ];

  console.log("Team decryption results:");
  for (const member of teamMembers) {
    const decryptedMessage = await manager.decryptInContext(
      context.contextId,
      encryptedTeamMessage,
      member.keypair.secretKey,
      member.keypair.publicKey.toBase58(),
    );
    console.log(`${member.name}:`, Buffer.from(decryptedMessage).toString());
  }
  console.log();

  // ============================================
  // 5. Key Export/Import for Backup
  // ============================================
  console.log("5️⃣ Key Backup and Recovery");
  console.log("---------------------------");

  // Export the meeting key for backup
  const backupPassword = "super-secure-backup-password-2024";
  const exportedKey = await sharedKeyManager.exportSharedKey(
    meetingKey.keyId,
    alice.secretKey,
    alice.publicKey.toBase58(),
    backupPassword,
  );

  console.log("Meeting key exported for backup");
  console.log("Export size:", exportedKey.length, "characters");

  // Simulate importing on a new device/manager
  const recoveryManager = new SharedKeyManager();
  const recoveredKey = await recoveryManager.importSharedKey(
    exportedKey,
    backupPassword,
  );

  console.log("Key successfully recovered");
  console.log(
    "Recovered key ID:",
    recoveredKey.keyId === meetingKey.keyId ? "MATCH" : "MISMATCH",
  );
  console.log("Recovered holders count:", recoveredKey.holders.length);
  console.log();

  // ============================================
  // 6. Dynamic Permissions and Key Rotation
  // ============================================
  console.log("6️⃣ Security: Remove Member and Rotate Keys");
  console.log("-------------------------------------------");

  // Remove Charlie from the project (with key rotation for security)
  const contextAfterRemoval = await manager.removeRecipientsFromContext(
    context.contextId,
    [charlie.publicKey.toBase58()],
    alice.secretKey,
    alice.publicKey.toBase58(),
    true, // Rotate keys
  );

  console.log("Removed Charlie from project context");
  console.log("Remaining recipients:", contextAfterRemoval.recipients.length);

  // Try to encrypt a new message
  const sensitiveMessage =
    "This is sensitive information that Charlie should not see.";
  const encryptedSensitive = await manager.encryptInContext(
    context.contextId,
    sensitiveMessage,
    alice.secretKey,
  );

  console.log("Encrypted sensitive message with rotated keys");

  // Remaining members can still decrypt
  console.log("Remaining team can decrypt:");
  const remainingMembers = [
    { name: "Bob", keypair: bob },
    { name: "Diana", keypair: diana },
    { name: "Eve", keypair: eve },
  ];

  for (const member of remainingMembers) {
    try {
      const decryptedSensitive = await manager.decryptInContext(
        context.contextId,
        encryptedSensitive,
        member.keypair.secretKey,
        member.keypair.publicKey.toBase58(),
      );
      console.log(`${member.name}: ✅ Can decrypt`);
    } catch (error) {
      console.log(`${member.name}: ❌ Cannot decrypt`);
    }
  }

  // Charlie can no longer decrypt (since he was removed and keys rotated)
  try {
    await manager.decryptInContext(
      context.contextId,
      encryptedSensitive,
      charlie.secretKey,
      charlie.publicKey.toBase58(),
    );
    console.log("Charlie: ❌ This should not work!");
  } catch (error) {
    console.log("Charlie: ✅ Correctly blocked (no longer has access)");
  }
  console.log();

  // ============================================
  // Summary
  // ============================================
  console.log("🎉 Scalable Encryption Demo Complete!");
  console.log("=====================================");
  console.log();
  console.log("Key Features Demonstrated:");
  console.log("✅ Single recipient → group encryption (seamless transition)");
  console.log("✅ Shared encryption keys with granular permissions");
  console.log("✅ Dynamic member addition/removal");
  console.log("✅ Automatic key rotation for security");
  console.log("✅ Key backup and recovery");
  console.log("✅ Role-based access control");
  console.log();
  console.log("This system handles:");
  console.log("• Starting with 1 recipient, scaling to N recipients");
  console.log("• Shared encryption keys distributed across team members");
  console.log("• Granular permissions (decrypt, encrypt, share, revoke)");
  console.log("• Forward/backward secrecy through key rotation");
  console.log("• Secure key backup and recovery");
}

// Run the example
main().catch(console.error);
