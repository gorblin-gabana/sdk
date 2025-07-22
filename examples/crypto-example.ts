/**
 * Crypto Example - Demonstrating encryption/decryption functionality
 *
 * This example shows how to use the GorbchainSDK crypto features:
 * - Personal encryption (private key based)
 * - Direct encryption (public key based)
 * - Group encryption (static groups)
 * - Signature-based groups (dynamic membership)
 */

import {
  GorbchainSDK,
  CryptoManager,
  EncryptionMethod,
  MemberRole,
  type SignatureGroupMetadata,
} from "@gorbchain-xyz/chaindecode";
import { Keypair } from "@solana/web3.js";

async function main() {
  console.log("🔐 GorbchainSDK Crypto Example\n");

  // Initialize SDK
  const sdk = new GorbchainSDK({
    rpcEndpoint: "https://api.mainnet-beta.solana.com",
  });

  // Create crypto manager
  const crypto = new CryptoManager({
    defaultMethod: EncryptionMethod.PERSONAL,
    debug: true,
  });

  // Generate keypairs for demo
  const alice = Keypair.generate();
  const bob = Keypair.generate();
  const charlie = Keypair.generate();

  console.log("Generated keypairs:");
  console.log("Alice:", alice.publicKey.toBase58());
  console.log("Bob:", bob.publicKey.toBase58());
  console.log("Charlie:", charlie.publicKey.toBase58());
  console.log();

  // ============================================
  // 1. Personal Encryption
  // ============================================
  console.log("1️⃣ Personal Encryption (Private Key Based)");
  console.log("----------------------------------------");

  const personalMessage = "This is my personal encrypted data";

  // Encrypt with Alice's private key
  const personalEncrypted = await crypto.encrypt(personalMessage, {
    method: EncryptionMethod.PERSONAL,
    privateKey: alice.secretKey,
    compress: true,
  });

  console.log(
    "Encrypted:",
    personalEncrypted.encryptedData.substring(0, 50) + "...",
  );

  // Decrypt with same private key
  const personalDecrypted = await crypto.decryptString(
    personalEncrypted,
    alice.secretKey,
  );

  console.log("Decrypted:", personalDecrypted);
  console.log();

  // ============================================
  // 2. Direct Encryption (Public Key)
  // ============================================
  console.log("2️⃣ Direct Encryption (Public Key Based)");
  console.log("----------------------------------------");

  const directMessage = "Secret message from Alice to Bob";

  // Alice encrypts for Bob
  const directEncrypted = await crypto.encrypt(directMessage, {
    method: EncryptionMethod.DIRECT,
    privateKey: alice.secretKey,
    recipientPublicKey: bob.publicKey.toBase58(),
  });

  console.log(
    "Encrypted by Alice for Bob:",
    directEncrypted.encryptedData.substring(0, 50) + "...",
  );

  // Bob decrypts
  const directDecrypted = await crypto.decryptString(
    directEncrypted,
    bob.secretKey,
  );

  console.log("Decrypted by Bob:", directDecrypted);
  console.log();

  // ============================================
  // 3. Secure Channel
  // ============================================
  console.log("3️⃣ Secure Channel (Bidirectional Communication)");
  console.log("----------------------------------------");

  // Create secure channels
  const aliceChannel = crypto.createSecureChannel(
    alice.secretKey,
    bob.publicKey.toBase58(),
  );

  const bobChannel = crypto.createSecureChannel(
    bob.secretKey,
    alice.publicKey.toBase58(),
  );

  // Alice sends message
  const channelMsg1 = await aliceChannel.encryptMessage(
    "Hello Bob! How are you?",
  );
  const bobReceived1 = await bobChannel.decryptMessage(channelMsg1);
  console.log("Alice -> Bob:", new TextDecoder().decode(bobReceived1.message));

  // Bob responds
  const channelMsg2 = await bobChannel.encryptMessage(
    "Hi Alice! I'm doing great!",
  );
  const aliceReceived2 = await aliceChannel.decryptMessage(channelMsg2);
  console.log(
    "Bob -> Alice:",
    new TextDecoder().decode(aliceReceived2.message),
  );
  console.log();

  // ============================================
  // 4. Signature-Based Group
  // ============================================
  console.log("4️⃣ Signature-Based Group (Dynamic Membership)");
  console.log("----------------------------------------");

  // Alice creates a group
  const group = await crypto.createSignatureGroup(
    "Secret Project Team",
    alice.secretKey,
    [{ publicKey: bob.publicKey.toBase58(), role: MemberRole.ADMIN }],
    {
      allowDynamicMembership: true,
      maxMembers: 10,
      requireSignatureVerification: true,
    },
  );

  console.log("Group created:", group.groupId);
  console.log("Initial members:", group.members.length);

  // Store group for later use
  await crypto.storeGroupMetadata(group);

  // Encrypt message for the group
  const groupMessage = "Welcome to the secret project!";
  const groupEncrypted = await crypto.encrypt(groupMessage, {
    method: EncryptionMethod.SIGNATURE_GROUP,
    groupId: group.groupId,
    privateKey: alice.secretKey,
  });

  console.log(
    "Encrypted for group:",
    groupEncrypted.encryptedData.substring(0, 50) + "...",
  );

  // Bob decrypts as a member
  const bobDecryptedGroup = await crypto.decryptString(
    groupEncrypted,
    bob.secretKey,
    { publicKey: bob.publicKey.toBase58() },
  );

  console.log("Bob decrypted:", bobDecryptedGroup);

  // Add Charlie to the group (Bob is admin)
  const updatedGroup = await crypto.addMemberToGroup(
    group.groupId,
    { publicKey: charlie.publicKey.toBase58(), role: MemberRole.MEMBER },
    bob.secretKey,
    bob.publicKey.toBase58(),
  );

  console.log("Charlie added. Total members:", updatedGroup.members.length);

  // New message encrypted by Bob
  const newGroupMessage = "Charlie just joined us!";
  const newGroupEncrypted = await crypto.encrypt(newGroupMessage, {
    method: EncryptionMethod.SIGNATURE_GROUP,
    groupId: group.groupId,
    privateKey: bob.secretKey,
  });

  // Charlie can now decrypt
  const charlieDecrypted = await crypto.decryptString(
    newGroupEncrypted,
    charlie.secretKey,
    { publicKey: charlie.publicKey.toBase58() },
  );

  console.log("Charlie decrypted:", charlieDecrypted);
  console.log();

  // ============================================
  // 5. Personal Encryption Session
  // ============================================
  console.log("5️⃣ Personal Encryption Session");
  console.log("----------------------------------------");

  const session = crypto.createPersonalSession(alice.secretKey);
  console.log("Session created:", session.getSessionInfo().keyId);

  // Encrypt multiple messages in the session
  const messages = [
    "First secret note",
    "Second secret note",
    "Third secret note",
  ];

  const encryptedMessages = await Promise.all(
    messages.map((msg) => session.encrypt(msg)),
  );

  console.log("Encrypted", messages.length, "messages in session");

  // Decrypt them
  const decryptedMessages = await Promise.all(
    encryptedMessages.map((enc) => crypto.decryptString(enc, alice.secretKey)),
  );

  decryptedMessages.forEach((msg, i) => {
    console.log(`Message ${i + 1}:`, msg);
  });
  console.log();

  // ============================================
  // 6. Signatures
  // ============================================
  console.log("6️⃣ Digital Signatures");
  console.log("----------------------------------------");

  const documentToSign = "I hereby authorize this transaction";

  // Alice signs
  const signature = crypto.sign(documentToSign, alice.secretKey);
  console.log("Alice's signature:", signature);

  // Verify with Alice's public key
  const isValid = crypto.verify(
    documentToSign,
    signature,
    alice.publicKey.toBase58(),
  );
  console.log("Signature valid:", isValid);

  // Try with wrong public key
  const isInvalid = crypto.verify(
    documentToSign,
    signature,
    bob.publicKey.toBase58(),
  );
  console.log("Signature with wrong key:", isInvalid);
  console.log();

  // ============================================
  // Summary
  // ============================================
  console.log("✅ Crypto Examples Complete!");
  console.log("\nKey Features Demonstrated:");
  console.log("- Personal encryption for private data");
  console.log("- Direct encryption between two parties");
  console.log("- Secure channels for ongoing communication");
  console.log("- Dynamic groups with role-based permissions");
  console.log("- Digital signatures for authentication");
  console.log("\nAll encryption methods support:");
  console.log("- Optional compression");
  console.log("- Forward secrecy");
  console.log("- Authenticated encryption (AEAD)");
}

// Run the example
main().catch(console.error);
