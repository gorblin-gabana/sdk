/**
 * Performance and stress testing for crypto functionality
 * Tests the limits and performance characteristics under various loads
 */

import { describe, test, expect, beforeAll } from "@jest/globals";
import { Keypair } from "@solana/web3.js";
import {
  encryptPersonal,
  decryptPersonalString,
  encryptDirect,
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
} from "../src/crypto/index.js";

describe("Performance and Stress Testing", () => {
  let testUsers: Keypair[];

  beforeAll(() => {
    // Generate a larger set of test users for stress testing
    testUsers = [];
    for (let i = 0; i < 50; i++) {
      testUsers.push(Keypair.generate());
    }
  });

  describe("Encryption Performance Benchmarks", () => {
    test("Personal encryption performance with various data sizes", async () => {
      const alice = testUsers[0];
      const testSizes = [
        { name: "Small text (100 bytes)", data: "A".repeat(100) },
        { name: "Medium text (10KB)", data: "B".repeat(10 * 1024) },
        { name: "Large text (100KB)", data: "C".repeat(100 * 1024) },
        { name: "Very large text (1MB)", data: "D".repeat(1024 * 1024) },
      ];

      const results = [];

      for (const testCase of testSizes) {
        const encryptStart = performance.now();

        const encrypted = await encryptPersonal(
          testCase.data,
          alice.secretKey,
          {
            compress: true,
          },
        );

        const encryptEnd = performance.now();
        const encryptTime = encryptEnd - encryptStart;

        const decryptStart = performance.now();
        const decrypted = await decryptPersonalString(
          encrypted,
          alice.secretKey,
        );
        const decryptEnd = performance.now();
        const decryptTime = decryptEnd - decryptStart;

        expect(decrypted).toBe(testCase.data);

        const result = {
          size: testCase.name,
          dataSize: testCase.data.length,
          encryptTime,
          decryptTime,
          throughputMBps:
            testCase.data.length / 1024 / 1024 / (encryptTime / 1000),
        };

        results.push(result);

        // Performance thresholds
        if (testCase.data.length <= 10 * 1024) {
          // <= 10KB
          expect(encryptTime).toBeLessThan(100); // Should encrypt in under 100ms
          expect(decryptTime).toBeLessThan(100);
        } else if (testCase.data.length <= 100 * 1024) {
          // <= 100KB
          expect(encryptTime).toBeLessThan(500); // Should encrypt in under 500ms
          expect(decryptTime).toBeLessThan(500);
        } else {
          // 1MB
          expect(encryptTime).toBeLessThan(2000); // Should encrypt in under 2s
          expect(decryptTime).toBeLessThan(2000);
        }
      }

      console.log("\nPersonal Encryption Performance:");
      results.forEach((result) => {
        console.log(`  ${result.size}:`);
        console.log(`    Encrypt: ${result.encryptTime.toFixed(2)}ms`);
        console.log(`    Decrypt: ${result.decryptTime.toFixed(2)}ms`);
        console.log(`    Throughput: ${result.throughputMBps.toFixed(2)} MB/s`);
      });
    });

    test("Direct encryption performance scaling", async () => {
      const alice = testUsers[0];
      const bob = testUsers[1];
      const message = "Performance test message for direct encryption";

      const iterations = 100;
      const encryptTimes = [];
      const decryptTimes = [];

      // Warm up
      for (let i = 0; i < 5; i++) {
        const encrypted = await encryptDirect(
          message,
          bob.publicKey.toBase58(),
          alice.secretKey,
        );
        await decryptDirectString(encrypted, bob.secretKey);
      }

      // Actual benchmark
      for (let i = 0; i < iterations; i++) {
        const encryptStart = performance.now();
        const encrypted = await encryptDirect(
          message,
          bob.publicKey.toBase58(),
          alice.secretKey,
        );
        const encryptEnd = performance.now();
        encryptTimes.push(encryptEnd - encryptStart);

        const decryptStart = performance.now();
        const decrypted = await decryptDirectString(encrypted, bob.secretKey);
        const decryptEnd = performance.now();
        decryptTimes.push(decryptEnd - decryptStart);

        expect(decrypted).toBe(message);
      }

      const avgEncryptTime =
        encryptTimes.reduce((a, b) => a + b) / encryptTimes.length;
      const avgDecryptTime =
        decryptTimes.reduce((a, b) => a + b) / decryptTimes.length;
      const minEncryptTime = Math.min(...encryptTimes);
      const maxEncryptTime = Math.max(...encryptTimes);

      console.log(
        `\nDirect Encryption Performance (${iterations} iterations):`,
      );
      console.log(`  Average encrypt time: ${avgEncryptTime.toFixed(2)}ms`);
      console.log(`  Average decrypt time: ${avgDecryptTime.toFixed(2)}ms`);
      console.log(`  Min encrypt time: ${minEncryptTime.toFixed(2)}ms`);
      console.log(`  Max encrypt time: ${maxEncryptTime.toFixed(2)}ms`);
      console.log(
        `  Operations per second: ${(1000 / avgEncryptTime).toFixed(0)} ops/s`,
      );

      // Performance assertions
      expect(avgEncryptTime).toBeLessThan(50); // Average should be under 50ms
      expect(avgDecryptTime).toBeLessThan(50);
      expect(maxEncryptTime).toBeLessThan(200); // No single operation should take over 200ms
    });

    test("Signature verification performance", async () => {
      const alice = testUsers[0];
      const message = "Test message for signature performance";
      const signature = signData(message, alice.secretKey);

      const iterations = 1000;
      const verificationTimes = [];

      // Warm up
      for (let i = 0; i < 10; i++) {
        verifySignature(message, signature, alice.publicKey.toBase58());
      }

      // Benchmark signature verification
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const isValid = verifySignature(
          message,
          signature,
          alice.publicKey.toBase58(),
        );
        const end = performance.now();

        verificationTimes.push(end - start);
        expect(isValid).toBe(true);
      }

      const avgVerifyTime =
        verificationTimes.reduce((a, b) => a + b) / verificationTimes.length;
      const minVerifyTime = Math.min(...verificationTimes);
      const maxVerifyTime = Math.max(...verificationTimes);

      console.log(
        `\nSignature Verification Performance (${iterations} iterations):`,
      );
      console.log(`  Average verify time: ${avgVerifyTime.toFixed(2)}ms`);
      console.log(`  Min verify time: ${minVerifyTime.toFixed(2)}ms`);
      console.log(`  Max verify time: ${maxVerifyTime.toFixed(2)}ms`);
      console.log(
        `  Verifications per second: ${(1000 / avgVerifyTime).toFixed(0)} ops/s`,
      );

      // Performance assertions
      expect(avgVerifyTime).toBeLessThan(10); // Should verify in under 10ms on average
      expect(maxVerifyTime).toBeLessThan(50); // No single verification should take over 50ms
    });
  });

  describe("Scalability Stress Tests", () => {
    test("Large group creation and message encryption stress test", async () => {
      const creator = testUsers[0];
      const groupSize = 25; // 25 members + creator = 26 total

      console.log(
        `\nCreating signature group with ${groupSize + 1} members...`,
      );

      const createGroupStart = performance.now();

      const largeGroup = await createSignatureGroup(
        "Large Test Group",
        creator.secretKey,
        testUsers.slice(1, groupSize + 1).map((user) => ({
          publicKey: user.publicKey.toBase58(),
          role: MemberRole.MEMBER,
        })),
        {
          allowDynamicMembership: true,
          maxMembers: 50,
        },
      );

      const createGroupEnd = performance.now();
      const groupCreationTime = createGroupEnd - createGroupStart;

      expect(largeGroup.members).toHaveLength(groupSize + 1);
      console.log(`  Group creation time: ${groupCreationTime.toFixed(2)}ms`);

      // Test message encryption for large group
      const testMessage =
        "Broadcasting to large group - performance test message";

      const encryptStart = performance.now();

      const encrypted = await encryptForSignatureGroup(
        testMessage,
        largeGroup,
        creator.secretKey,
        creator.publicKey.toBase58(),
      );

      const encryptEnd = performance.now();
      const encryptTime = encryptEnd - encryptStart;

      console.log(`  Message encryption time: ${encryptTime.toFixed(2)}ms`);

      // Test parallel decryption by multiple members
      const decryptionPromises = testUsers
        .slice(1, 11)
        .map(async (user, index) => {
          const start = performance.now();
          const decrypted = await decryptSignatureGroupData(
            encrypted,
            user.secretKey,
            user.publicKey.toBase58(),
          );
          const end = performance.now();

          return {
            index,
            decrypted: Buffer.from(decrypted).toString(),
            time: end - start,
          };
        });

      const parallelDecryptStart = performance.now();
      const decryptResults = await Promise.all(decryptionPromises);
      const parallelDecryptEnd = performance.now();
      const totalParallelTime = parallelDecryptEnd - parallelDecryptStart;

      console.log(
        `  Parallel decryption time (10 members): ${totalParallelTime.toFixed(2)}ms`,
      );

      // Verify all decryptions were successful
      decryptResults.forEach((result) => {
        expect(result.decrypted).toBe(testMessage);
      });

      const avgDecryptTime =
        decryptResults.reduce((sum, r) => sum + r.time, 0) /
        decryptResults.length;
      console.log(
        `  Average individual decrypt time: ${avgDecryptTime.toFixed(2)}ms`,
      );

      // Performance assertions
      expect(groupCreationTime).toBeLessThan(5000); // Group creation under 5s
      expect(encryptTime).toBeLessThan(1000); // Encryption under 1s
      expect(totalParallelTime).toBeLessThan(3000); // 10 parallel decryptions under 3s
    });

    test("Scalable encryption context stress test - rapid scaling", async () => {
      const manager = new ScalableEncryptionManager();
      const creator = testUsers[0];

      // Create context that will scale rapidly
      const { context } = await manager.createEncryptionContext(
        "Rapid Scaling Test",
        "Testing rapid addition of many recipients",
        testUsers[1].publicKey.toBase58(),
        creator.secretKey,
        {
          autoTransitionThreshold: 2,
        },
      );

      expect(context.method).toBe(EncryptionMethod.DIRECT);

      // Rapidly add recipients to trigger scaling
      const batchSizes = [5, 10, 15, 20]; // Add in batches
      let currentContext = context;

      for (const batchSize of batchSizes) {
        const startIndex = currentContext.recipients.length;
        const newRecipients = testUsers
          .slice(startIndex, startIndex + batchSize)
          .map((user) => user.publicKey.toBase58());

        console.log(
          `\nAdding ${batchSize} recipients (total will be ${startIndex + batchSize})...`,
        );

        const addStart = performance.now();

        currentContext = await manager.addRecipientsToContext(
          context.contextId,
          newRecipients,
          creator.secretKey,
          creator.publicKey.toBase58(),
        );

        const addEnd = performance.now();
        const addTime = addEnd - addStart;

        console.log(`  Add recipients time: ${addTime.toFixed(2)}ms`);
        console.log(`  Context method: ${currentContext.method}`);
        console.log(`  Total recipients: ${currentContext.recipients.length}`);

        // Test encryption after each batch
        const testMessage = `Message after adding batch of ${batchSize} - total recipients: ${currentContext.recipients.length}`;

        const encryptStart = performance.now();

        const encrypted = await manager.encryptInContext(
          context.contextId,
          testMessage,
          creator.secretKey,
        );

        const encryptEnd = performance.now();
        const encryptTime = encryptEnd - encryptStart;

        console.log(`  Encryption time: ${encryptTime.toFixed(2)}ms`);

        // Test decryption by a few random members
        const sampleSize = Math.min(5, currentContext.recipients.length);
        const sampleRecipients = testUsers.slice(1, sampleSize + 1);

        const decryptPromises = sampleRecipients.map(async (user) => {
          return manager.decryptInContext(
            context.contextId,
            encrypted,
            user.secretKey,
            user.publicKey.toBase58(),
          );
        });

        const decryptStart = performance.now();
        const decryptResults = await Promise.all(decryptPromises);
        const decryptEnd = performance.now();
        const decryptTime = decryptEnd - decryptStart;

        console.log(
          `  Sample decryption time (${sampleSize} users): ${decryptTime.toFixed(2)}ms`,
        );

        // Verify decryptions
        decryptResults.forEach((result) => {
          expect(Buffer.from(result).toString()).toBe(testMessage);
        });

        // Performance assertions scale with group size
        if (currentContext.recipients.length <= 10) {
          expect(addTime).toBeLessThan(2000);
          expect(encryptTime).toBeLessThan(500);
        } else if (currentContext.recipients.length <= 25) {
          expect(addTime).toBeLessThan(5000);
          expect(encryptTime).toBeLessThan(1000);
        } else {
          expect(addTime).toBeLessThan(10000);
          expect(encryptTime).toBeLessThan(2000);
        }
      }

      expect(currentContext.recipients.length).toBeGreaterThan(30);
      expect(currentContext.method).toBe(EncryptionMethod.GROUP); // Should have transitioned
    });

    test("Shared key manager stress test - many concurrent operations", async () => {
      const sharedKeyManager = new SharedKeyManager();
      const admin = testUsers[0];

      // Create multiple shared keys concurrently
      const keyCreationPromises = [];
      const numKeys = 10;

      for (let i = 0; i < numKeys; i++) {
        const promise = sharedKeyManager.createSharedKey(
          {
            name: `Stress Test Key ${i}`,
            purpose: `Testing concurrent key creation ${i}`,
            creator: admin.publicKey.toBase58(),
            algorithm: "AES-256-GCM",
            derivationMethod: "ECDH",
            properties: {},
          },
          testUsers.slice(1, 6).map((user) => ({
            publicKey: user.publicKey.toBase58(),
            permissions: {
              canDecrypt: true,
              canEncrypt: true,
              canShare: false,
              canRevoke: false,
            },
          })),
          admin.secretKey,
        );
        keyCreationPromises.push(promise);
      }

      console.log(`\nCreating ${numKeys} shared keys concurrently...`);
      const keyCreationStart = performance.now();

      const createdKeys = await Promise.all(keyCreationPromises);

      const keyCreationEnd = performance.now();
      const totalKeyCreationTime = keyCreationEnd - keyCreationStart;

      console.log(
        `  Total concurrent key creation time: ${totalKeyCreationTime.toFixed(2)}ms`,
      );
      console.log(
        `  Average time per key: ${(totalKeyCreationTime / numKeys).toFixed(2)}ms`,
      );

      expect(createdKeys).toHaveLength(numKeys);
      createdKeys.forEach((key) => {
        expect(key.holders).toHaveLength(6); // Admin + 5 users
      });

      // Test concurrent encryption with all keys
      const testMessage = "Concurrent encryption stress test message";

      const encryptionPromises = createdKeys.map((key, index) =>
        sharedKeyManager.encryptWithSharedKey(
          `${testMessage} - Key ${index}`,
          key.keyId,
          admin.secretKey,
          admin.publicKey.toBase58(),
        ),
      );

      console.log(`\nPerforming concurrent encryption with all keys...`);
      const encryptionStart = performance.now();

      const encryptedMessages = await Promise.all(encryptionPromises);

      const encryptionEnd = performance.now();
      const totalEncryptionTime = encryptionEnd - encryptionStart;

      console.log(
        `  Total concurrent encryption time: ${totalEncryptionTime.toFixed(2)}ms`,
      );
      console.log(
        `  Average time per encryption: ${(totalEncryptionTime / numKeys).toFixed(2)}ms`,
      );

      expect(encryptedMessages).toHaveLength(numKeys);

      // Test concurrent decryption by different users
      const decryptionPromises = [];

      encryptedMessages.forEach((encrypted, keyIndex) => {
        // Each key decrypted by a different user
        const userIndex = (keyIndex % 5) + 1; // Users 1-5
        const user = testUsers[userIndex];

        const promise = sharedKeyManager.decryptWithSharedKey(
          encrypted,
          user.secretKey,
          user.publicKey.toBase58(),
        );
        decryptionPromises.push(promise);
      });

      console.log(`\nPerforming concurrent decryption by different users...`);
      const decryptionStart = performance.now();

      const decryptedResults = await Promise.all(decryptionPromises);

      const decryptionEnd = performance.now();
      const totalDecryptionTime = decryptionEnd - decryptionStart;

      console.log(
        `  Total concurrent decryption time: ${totalDecryptionTime.toFixed(2)}ms`,
      );
      console.log(
        `  Average time per decryption: ${(totalDecryptionTime / numKeys).toFixed(2)}ms`,
      );

      // Verify all decryptions
      decryptedResults.forEach((result, index) => {
        const decrypted = Buffer.from(result).toString();
        expect(decrypted).toBe(`${testMessage} - Key ${index}`);
      });

      // Performance assertions
      expect(totalKeyCreationTime).toBeLessThan(15000); // 10 keys created concurrently in under 15s
      expect(totalEncryptionTime).toBeLessThan(5000); // 10 concurrent encryptions in under 5s
      expect(totalDecryptionTime).toBeLessThan(5000); // 10 concurrent decryptions in under 5s
    });
  });

  describe("Memory and Resource Usage Tests", () => {
    test("Memory usage during large group operations", async () => {
      const creator = testUsers[0];

      // Get initial memory usage (if available in test environment)
      const getMemoryUsage = () => {
        if (typeof process !== "undefined" && process.memoryUsage) {
          return process.memoryUsage();
        }
        return null;
      };

      const initialMemory = getMemoryUsage();

      // Create large group
      const largeGroup = await createSignatureGroup(
        "Memory Test Group",
        creator.secretKey,
        testUsers.slice(1, 31).map((user) => ({
          // 30 members
          publicKey: user.publicKey.toBase58(),
          role: MemberRole.MEMBER,
        })),
      );

      const afterGroupMemory = getMemoryUsage();

      // Encrypt many messages
      const messages = [];
      for (let i = 0; i < 50; i++) {
        const encrypted = await encryptForSignatureGroup(
          `Test message ${i} for memory usage testing`,
          largeGroup,
          creator.secretKey,
          creator.publicKey.toBase58(),
        );
        messages.push(encrypted);
      }

      const afterEncryptionMemory = getMemoryUsage();

      // Test cleanup by allowing garbage collection
      if (typeof global !== "undefined" && global.gc) {
        global.gc();
      }

      const afterGCMemory = getMemoryUsage();

      if (initialMemory && afterGroupMemory && afterEncryptionMemory) {
        console.log("\nMemory Usage Analysis:");
        console.log(
          `  Initial: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        );
        console.log(
          `  After group creation: ${(afterGroupMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        );
        console.log(
          `  After 50 encryptions: ${(afterEncryptionMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        );

        if (afterGCMemory) {
          console.log(
            `  After GC: ${(afterGCMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          );
        }

        const groupMemoryIncrease =
          (afterGroupMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
        const encryptionMemoryIncrease =
          (afterEncryptionMemory.heapUsed - afterGroupMemory.heapUsed) /
          1024 /
          1024;

        console.log(
          `  Group creation memory increase: ${groupMemoryIncrease.toFixed(2)} MB`,
        );
        console.log(
          `  Encryption operations memory increase: ${encryptionMemoryIncrease.toFixed(2)} MB`,
        );

        // Memory usage should be reasonable
        expect(groupMemoryIncrease).toBeLessThan(10); // Group creation should use less than 10MB
        expect(encryptionMemoryIncrease).toBeLessThan(20); // 50 encryptions should use less than 20MB
      }

      expect(largeGroup.members).toHaveLength(31);
      expect(messages).toHaveLength(50);
    });

    test("Resource cleanup after operations", async () => {
      const alice = testUsers[0];
      const bob = testUsers[1];

      // Perform many operations and verify no resource leaks
      const operations = 100;

      for (let i = 0; i < operations; i++) {
        // Personal encryption/decryption
        const personalEncrypted = await encryptPersonal(
          `Personal message ${i}`,
          alice.secretKey,
        );
        const personalDecrypted = await decryptPersonalString(
          personalEncrypted,
          alice.secretKey,
        );
        expect(personalDecrypted).toBe(`Personal message ${i}`);

        // Direct encryption/decryption
        const directEncrypted = await encryptDirect(
          `Direct message ${i}`,
          bob.publicKey.toBase58(),
          alice.secretKey,
        );
        const directDecrypted = await decryptDirectString(
          directEncrypted,
          bob.secretKey,
        );
        expect(directDecrypted).toBe(`Direct message ${i}`);

        // Signature operations
        const signature = signData(`Sign message ${i}`, alice.secretKey);
        const isValid = verifySignature(
          `Sign message ${i}`,
          signature,
          alice.publicKey.toBase58(),
        );
        expect(isValid).toBe(true);

        // Periodic memory check (every 25 operations)
        if (i > 0 && i % 25 === 0) {
          if (typeof global !== "undefined" && global.gc) {
            global.gc();
          }

          const memUsage =
            typeof process !== "undefined" && process.memoryUsage
              ? process.memoryUsage()
              : null;
          if (memUsage) {
            console.log(
              `  After ${i} operations: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB heap used`,
            );
          }
        }
      }

      console.log(
        `\nCompleted ${operations} mixed crypto operations successfully`,
      );

      // Force garbage collection if available
      if (typeof global !== "undefined" && global.gc) {
        global.gc();
      }
    });
  });

  describe("Concurrent Operations Stress Test", () => {
    test("High concurrency mixed operations", async () => {
      const numConcurrentOps = 50;
      const testMessage = "Concurrent operation test message";

      console.log(
        `\nRunning ${numConcurrentOps} concurrent mixed crypto operations...`,
      );

      const concurrentPromises = [];

      for (let i = 0; i < numConcurrentOps; i++) {
        const userA = testUsers[i % testUsers.length];
        const userB = testUsers[(i + 1) % testUsers.length];

        let promise;

        switch (i % 4) {
          case 0: // Personal encryption
            promise = (async () => {
              const encrypted = await encryptPersonal(
                `${testMessage} ${i}`,
                userA.secretKey,
              );
              const decrypted = await decryptPersonalString(
                encrypted,
                userA.secretKey,
              );
              return {
                type: "personal",
                success: decrypted === `${testMessage} ${i}`,
              };
            })();
            break;

          case 1: // Direct encryption
            promise = (async () => {
              const encrypted = await encryptDirect(
                `${testMessage} ${i}`,
                userB.publicKey.toBase58(),
                userA.secretKey,
              );
              const decrypted = await decryptDirectString(
                encrypted,
                userB.secretKey,
              );
              return {
                type: "direct",
                success: decrypted === `${testMessage} ${i}`,
              };
            })();
            break;

          case 2: // Signature operations
            promise = (async () => {
              const signature = signData(
                `${testMessage} ${i}`,
                userA.secretKey,
              );
              const isValid = verifySignature(
                `${testMessage} ${i}`,
                signature,
                userA.publicKey.toBase58(),
              );
              return { type: "signature", success: isValid };
            })();
            break;

          case 3: // Group operations
            promise = (async () => {
              const group = await createSignatureGroup(
                `Concurrent Group ${i}`,
                userA.secretKey,
                [
                  {
                    publicKey: userB.publicKey.toBase58(),
                    role: MemberRole.MEMBER,
                  },
                ],
              );
              const encrypted = await encryptForSignatureGroup(
                `${testMessage} ${i}`,
                group,
                userA.secretKey,
                userA.publicKey.toBase58(),
              );
              const decrypted = await decryptSignatureGroupData(
                encrypted,
                userA.secretKey,
                userA.publicKey.toBase58(),
              );
              return {
                type: "group",
                success:
                  Buffer.from(decrypted).toString() === `${testMessage} ${i}`,
              };
            })();
            break;
        }

        concurrentPromises.push(promise);
      }

      const startTime = performance.now();
      const results = await Promise.all(concurrentPromises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(
        `  Total concurrent operations time: ${totalTime.toFixed(2)}ms`,
      );
      console.log(
        `  Average time per operation: ${(totalTime / numConcurrentOps).toFixed(2)}ms`,
      );
      console.log(
        `  Operations per second: ${(numConcurrentOps / (totalTime / 1000)).toFixed(0)} ops/s`,
      );

      // Analyze results by type
      const resultsByType = results.reduce((acc, result) => {
        if (!acc[result.type]) acc[result.type] = [];
        acc[result.type].push(result.success);
        return acc;
      }, {});

      Object.entries(resultsByType).forEach(([type, successes]) => {
        const successCount = successes.filter(Boolean).length;
        console.log(
          `  ${type}: ${successCount}/${successes.length} successful`,
        );
        expect(successCount).toBe(successes.length); // All operations should succeed
      });

      // Performance assertions
      expect(totalTime).toBeLessThan(30000); // All operations should complete within 30s
      expect(results.every((r) => r.success)).toBe(true); // All operations should succeed
    });
  });
});
