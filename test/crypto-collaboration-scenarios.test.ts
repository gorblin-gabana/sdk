/**
 * Real-world document sharing and team collaboration test scenarios
 * Tests the crypto functionality for document management, file sharing, and collaborative workflows
 */

import { describe, test, expect, beforeAll } from "@jest/globals";
import { Keypair } from "@solana/web3.js";
import {
  SharedKeyManager,
  ScalableEncryptionManager,
  createSignatureGroup,
  encryptForSignatureGroup,
  decryptSignatureGroupData,
  addMemberToSignatureGroup,
  removeMemberFromSignatureGroup,
  encryptDirect,
  decryptDirectString,
  EncryptionMethod,
  MemberRole,
  signData,
  verifySignature,
} from "../src/crypto/index.js";

describe("Real-World Collaboration Scenarios", () => {
  let alice: Keypair; // Project Manager / Team Lead
  let bob: Keypair; // Senior Developer
  let charlie: Keypair; // UI/UX Designer
  let diana: Keypair; // Legal Counsel
  let eve: Keypair; // External Client
  let frank: Keypair; // External Auditor
  let grace: Keypair; // Intern / Junior Developer

  beforeAll(() => {
    alice = Keypair.generate(); // Project Manager
    bob = Keypair.generate(); // Senior Developer
    charlie = Keypair.generate(); // UI/UX Designer
    diana = Keypair.generate(); // Legal Counsel
    eve = Keypair.generate(); // External Client
    frank = Keypair.generate(); // External Auditor
    grace = Keypair.generate(); // Intern / Junior Developer
  });

  describe("Document Management System", () => {
    test("Confidential document sharing with hierarchical access", async () => {
      const sharedKeyManager = new SharedKeyManager();

      // Create shared key for confidential project documents
      const projectDocsKey = await sharedKeyManager.createSharedKey(
        {
          name: "Project Phoenix Documents",
          purpose: "Confidential project documentation",
          creator: alice.publicKey.toBase58(),
          algorithm: "AES-256-GCM",
          derivationMethod: "ECDH",
          properties: {
            classification: "confidential",
            department: "product",
            retention_period: "7_years",
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
              canShare: true, // Senior dev can share with team
              canRevoke: false,
            },
          },
          {
            publicKey: charlie.publicKey.toBase58(),
            permissions: {
              canDecrypt: true,
              canEncrypt: true,
              canShare: false, // Designer can't add new people
              canRevoke: false,
            },
          },
        ],
        alice.secretKey,
      );

      // Alice creates project requirements document
      const requirementsDoc = {
        title: "Project Phoenix - Technical Requirements",
        version: "1.0",
        classification: "confidential",
        content: `
          CONFIDENTIAL - PROJECT PHOENIX REQUIREMENTS
          
          1. User Authentication System
             - OAuth 2.0 integration
             - Multi-factor authentication
             - Session management
          
          2. Database Requirements
             - PostgreSQL for user data
             - Redis for session storage
             - Encryption at rest required
          
          3. Security Requirements
             - All data must be encrypted in transit
             - PII data requires additional encryption
             - Regular security audits required
        `,
        authors: [alice.publicKey.toBase58()],
        reviewers: [bob.publicKey.toBase58(), charlie.publicKey.toBase58()],
        created_at: new Date().toISOString(),
        classification_level: 3,
      };

      const encryptedDoc = await sharedKeyManager.encryptWithSharedKey(
        JSON.stringify(requirementsDoc),
        projectDocsKey.keyId,
        alice.secretKey,
        alice.publicKey.toBase58(),
      );

      // Bob (senior dev) can access and decrypt
      const bobDecrypted = await sharedKeyManager.decryptWithSharedKey(
        encryptedDoc,
        bob.secretKey,
        bob.publicKey.toBase58(),
      );

      const bobDoc = JSON.parse(Buffer.from(bobDecrypted).toString());
      expect(bobDoc.title).toContain("Project Phoenix");
      expect(bobDoc.classification).toBe("confidential");

      // Charlie (designer) can also access
      const charlieDecrypted = await sharedKeyManager.decryptWithSharedKey(
        encryptedDoc,
        charlie.secretKey,
        charlie.publicKey.toBase58(),
      );

      const charlieDoc = JSON.parse(Buffer.from(charlieDecrypted).toString());
      expect(charlieDoc.content).toContain("User Authentication");
    });

    test("Version-controlled document updates with audit trail", async () => {
      const sharedKeyManager = new SharedKeyManager();

      // Create shared key for versioned documents
      const versionedDocsKey = await sharedKeyManager.createSharedKey(
        {
          name: "API Documentation",
          purpose: "Versioned API documentation",
          creator: alice.publicKey.toBase58(),
          algorithm: "AES-256-GCM",
          derivationMethod: "ECDH",
          properties: {},
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
        ],
        alice.secretKey,
      );

      // Version 1.0 of API docs
      const apiDocsV1 = {
        version: "1.0.0",
        title: "REST API Documentation",
        last_modified: new Date().toISOString(),
        modified_by: alice.publicKey.toBase58(),
        signature: "", // Will be set below
        content: {
          endpoints: [
            { method: "GET", path: "/api/users", description: "Get all users" },
            {
              method: "POST",
              path: "/api/users",
              description: "Create new user",
            },
          ],
        },
        changelog: [
          {
            version: "1.0.0",
            date: new Date().toISOString(),
            changes: "Initial version",
          },
        ],
      };

      // Alice signs the document
      apiDocsV1.signature = signData(
        JSON.stringify(apiDocsV1.content),
        alice.secretKey,
      );

      const encryptedV1 = await sharedKeyManager.encryptWithSharedKey(
        JSON.stringify(apiDocsV1),
        versionedDocsKey.keyId,
        alice.secretKey,
        alice.publicKey.toBase58(),
      );

      // Bob makes updates for version 1.1
      const bobDecryptedV1 = await sharedKeyManager.decryptWithSharedKey(
        encryptedV1,
        bob.secretKey,
        bob.publicKey.toBase58(),
      );

      const originalDoc = JSON.parse(Buffer.from(bobDecryptedV1).toString());

      // Bob creates version 1.1 with updates
      const apiDocsV11 = {
        ...originalDoc,
        version: "1.1.0",
        last_modified: new Date().toISOString(),
        modified_by: bob.publicKey.toBase58(),
        content: {
          endpoints: [
            ...originalDoc.content.endpoints,
            {
              method: "PUT",
              path: "/api/users/:id",
              description: "Update user",
            },
            {
              method: "DELETE",
              path: "/api/users/:id",
              description: "Delete user",
            },
          ],
        },
        changelog: [
          ...originalDoc.changelog,
          {
            version: "1.1.0",
            date: new Date().toISOString(),
            changes: "Added PUT and DELETE endpoints",
            author: bob.publicKey.toBase58(),
          },
        ],
      };

      // Bob signs his version
      apiDocsV11.signature = signData(
        JSON.stringify(apiDocsV11.content),
        bob.secretKey,
      );

      const encryptedV11 = await sharedKeyManager.encryptWithSharedKey(
        JSON.stringify(apiDocsV11),
        versionedDocsKey.keyId,
        bob.secretKey,
        bob.publicKey.toBase58(),
      );

      // Alice can decrypt and verify Bob's signature
      const aliceDecryptedV11 = await sharedKeyManager.decryptWithSharedKey(
        encryptedV11,
        alice.secretKey,
        alice.publicKey.toBase58(),
      );

      const updatedDoc = JSON.parse(Buffer.from(aliceDecryptedV11).toString());

      // Verify Bob's signature on the updated content
      const isBobSignatureValid = verifySignature(
        JSON.stringify(updatedDoc.content),
        updatedDoc.signature,
        bob.publicKey.toBase58(),
      );

      expect(isBobSignatureValid).toBe(true);
      expect(updatedDoc.version).toBe("1.1.0");
      expect(updatedDoc.content.endpoints).toHaveLength(4);
      expect(updatedDoc.changelog).toHaveLength(2);
    });

    test("Temporary document access for external parties", async () => {
      const sharedKeyManager = new SharedKeyManager();

      // Create internal project key
      const internalKey = await sharedKeyManager.createSharedKey(
        {
          name: "Internal Project Docs",
          purpose: "Internal team documentation",
          creator: alice.publicKey.toBase58(),
          algorithm: "AES-256-GCM",
          derivationMethod: "ECDH",
          properties: { access_level: "internal" },
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
        ],
        alice.secretKey,
      );

      // Internal project document
      const internalDoc = {
        title: "Q4 Product Roadmap - Internal",
        classification: "internal",
        content:
          "Detailed roadmap with internal metrics and confidential initiatives...",
        access_granted: [alice.publicKey.toBase58(), bob.publicKey.toBase58()],
        created_at: new Date().toISOString(),
      };

      const encryptedInternal = await sharedKeyManager.encryptWithSharedKey(
        JSON.stringify(internalDoc),
        internalKey.keyId,
        alice.secretKey,
        alice.publicKey.toBase58(),
      );

      // Need to share excerpt with external client (Eve)
      // Create temporary key for client access
      const clientAccessKey = await sharedKeyManager.createSharedKey(
        {
          name: "Client Presentation - Temporary Access",
          purpose: "Limited client access to presentation materials",
          creator: alice.publicKey.toBase58(),
          algorithm: "AES-256-GCM",
          derivationMethod: "ECDH",
          properties: {
            access_level: "client_limited",
            expires_at: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000,
            ).toISOString(), // 7 days
          },
        },
        [
          {
            publicKey: alice.publicKey.toBase58(),
            permissions: {
              canDecrypt: true,
              canEncrypt: true,
              canShare: false,
              canRevoke: true,
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
          }, // Client read-only
        ],
        alice.secretKey,
      );

      // Create client-safe version of document
      const clientDoc = {
        title: "Q4 Product Overview - Client Presentation",
        classification: "client_accessible",
        content: "High-level product roadmap and timeline for client review...",
        note: "This is a summary version prepared for client review",
        access_granted: [eve.publicKey.toBase58()],
        expires_at: clientAccessKey.metadata.properties.expires_at,
        created_at: new Date().toISOString(),
      };

      const encryptedClientDoc = await sharedKeyManager.encryptWithSharedKey(
        JSON.stringify(clientDoc),
        clientAccessKey.keyId,
        alice.secretKey,
        alice.publicKey.toBase58(),
      );

      // Eve (client) can access the client version
      const eveDecrypted = await sharedKeyManager.decryptWithSharedKey(
        encryptedClientDoc,
        eve.secretKey,
        eve.publicKey.toBase58(),
      );

      const eveDoc = JSON.parse(Buffer.from(eveDecrypted).toString());
      expect(eveDoc.title).toContain("Client Presentation");
      expect(eveDoc.classification).toBe("client_accessible");

      // Eve cannot access the internal document (different key)
      await expect(
        sharedKeyManager.decryptWithSharedKey(
          encryptedInternal,
          eve.secretKey,
          eve.publicKey.toBase58(),
        ),
      ).rejects.toThrow();

      // Later: Revoke Eve's access by removing from client key
      const revokedClientKey =
        await sharedKeyManager.removeRecipientsFromSharedKey(
          clientAccessKey.keyId,
          [eve.publicKey.toBase58()],
          alice.secretKey,
          alice.publicKey.toBase58(),
          true, // rotate key
        );

      expect(revokedClientKey.holders).toHaveLength(1); // Only Alice remains
    });
  });

  describe("Code Review and Technical Documentation", () => {
    test("Secure code review process with encrypted comments", async () => {
      // Create code review group
      const codeReviewGroup = await createSignatureGroup(
        "Feature Branch Review",
        alice.secretKey, // Alice is the reviewer
        [
          { publicKey: bob.publicKey.toBase58(), role: MemberRole.MEMBER }, // Bob is the author
          { publicKey: grace.publicKey.toBase58(), role: MemberRole.VIEWER }, // Grace is learning
        ],
        {
          allowDynamicMembership: false, // Fixed review team
          maxMembers: 5,
        },
      );

      // Bob submits code for review with sensitive security information
      const codeReviewRequest = {
        pull_request_id: "PR-1234",
        title: "Add OAuth authentication system",
        author: bob.publicKey.toBase58(),
        files_changed: [
          "src/auth/oauth.js",
          "src/middleware/auth.js",
          "config/oauth-secrets.js",
        ],
        security_notes: `
          SECURITY REVIEW REQUIRED:
          
          This PR implements OAuth 2.0 authentication with:
          - Client secrets stored in config/oauth-secrets.js
          - JWT token generation with HS256 algorithm
          - Session management with Redis
          
          Please review the secret management approach carefully.
          The OAuth client secret is: oauth_secret_abc123xyz
        `,
        line_comments: [
          {
            file: "src/auth/oauth.js",
            line: 45,
            comment:
              "Using hardcoded secret temporarily - will fix before merge",
          },
        ],
        status: "review_requested",
        created_at: new Date().toISOString(),
      };

      const encryptedReview = await encryptForSignatureGroup(
        JSON.stringify(codeReviewRequest),
        codeReviewGroup,
        bob.secretKey,
        bob.publicKey.toBase58(),
      );

      // Alice reviews and provides encrypted feedback
      const aliceDecrypted = await decryptSignatureGroupData(
        encryptedReview,
        alice.secretKey,
        alice.publicKey.toBase58(),
      );

      const reviewData = JSON.parse(Buffer.from(aliceDecrypted).toString());
      expect(reviewData.security_notes).toContain("oauth_secret_abc123xyz");

      // Alice provides detailed security feedback
      const reviewFeedback = {
        pull_request_id: "PR-1234",
        reviewer: alice.publicKey.toBase58(),
        status: "changes_requested",
        security_concerns: [
          {
            severity: "high",
            file: "config/oauth-secrets.js",
            issue: "Hardcoded secrets detected",
            recommendation:
              "Use environment variables or secret management service",
          },
          {
            severity: "medium",
            file: "src/auth/oauth.js",
            issue: "JWT algorithm should be configurable",
            recommendation: "Consider RS256 for production use",
          },
        ],
        line_comments: [
          {
            file: "src/auth/oauth.js",
            line: 45,
            comment:
              "CRITICAL: Remove hardcoded secret before merge. Use process.env.OAUTH_SECRET",
            type: "security",
          },
        ],
        overall_comment:
          "Good implementation, but security issues must be addressed before merge.",
        reviewed_at: new Date().toISOString(),
      };

      const encryptedFeedback = await encryptForSignatureGroup(
        JSON.stringify(reviewFeedback),
        codeReviewGroup,
        alice.secretKey,
        alice.publicKey.toBase58(),
      );

      // Bob receives and addresses feedback
      const bobDecryptedFeedback = await decryptSignatureGroupData(
        encryptedFeedback,
        bob.secretKey,
        bob.publicKey.toBase58(),
      );

      const feedback = JSON.parse(Buffer.from(bobDecryptedFeedback).toString());
      expect(feedback.security_concerns).toHaveLength(2);
      expect(feedback.status).toBe("changes_requested");

      // Grace (intern) can see the review for learning but cannot comment
      const graceDecrypted = await decryptSignatureGroupData(
        encryptedFeedback,
        grace.secretKey,
        grace.publicKey.toBase58(),
      );

      const graceFeedback = JSON.parse(Buffer.from(graceDecrypted).toString());
      expect(graceFeedback.overall_comment).toContain("Good implementation");
    });

    test("API documentation with encrypted implementation details", async () => {
      const sharedKeyManager = new SharedKeyManager();

      // Create key for technical documentation
      const techDocsKey = await sharedKeyManager.createSharedKey(
        {
          name: "API Implementation Docs",
          purpose: "Technical documentation with implementation details",
          creator: alice.publicKey.toBase58(),
          algorithm: "AES-256-GCM",
          derivationMethod: "ECDH",
          properties: {},
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
              canEncrypt: false,
              canShare: false,
              canRevoke: false,
            },
          }, // Designer read-only
        ],
        alice.secretKey,
      );

      // Technical implementation document with sensitive details
      const techDoc = {
        title: "Payment Processing API - Internal Implementation",
        version: "2.0",
        classification: "technical_confidential",
        implementation_details: {
          payment_gateway: "Stripe",
          api_keys: {
            test: "sk_test_abc123...",
            live: "sk_live_xyz789...", // Sensitive production key
          },
          webhook_secrets: {
            endpoint_secret: "whsec_secretkey123",
          },
          database_schema: {
            payments_table: "encrypted_payments",
            encryption_key_field: "payment_data_key",
            salt_field: "encryption_salt",
          },
          security_measures: [
            "All payment data encrypted at rest with AES-256",
            "PCI DSS compliance maintained",
            "Regular security audits by third party",
            "Zero-knowledge architecture for sensitive data",
          ],
        },
        endpoints: [
          {
            path: "/api/v2/payments",
            method: "POST",
            description: "Process payment",
            internal_notes: "Uses double encryption for card data",
          },
        ],
        deployment_notes: "Production keys must be rotated quarterly",
        last_audit: "2024-Q3",
        next_audit: "2024-Q4",
      };

      const encryptedTechDoc = await sharedKeyManager.encryptWithSharedKey(
        JSON.stringify(techDoc),
        techDocsKey.keyId,
        alice.secretKey,
        alice.publicKey.toBase58(),
      );

      // Bob (senior dev) can access all technical details
      const bobDecrypted = await sharedKeyManager.decryptWithSharedKey(
        encryptedTechDoc,
        bob.secretKey,
        bob.publicKey.toBase58(),
      );

      const bobTechDoc = JSON.parse(Buffer.from(bobDecrypted).toString());
      expect(bobTechDoc.implementation_details.api_keys.live).toContain(
        "sk_live_xyz789",
      );

      // Charlie (designer) can read for UI context but can't modify
      const charlieDecrypted = await sharedKeyManager.decryptWithSharedKey(
        encryptedTechDoc,
        charlie.secretKey,
        charlie.publicKey.toBase58(),
      );

      const charlieTechDoc = JSON.parse(
        Buffer.from(charlieDecrypted).toString(),
      );
      expect(charlieTechDoc.endpoints[0].description).toBe("Process payment");

      // Test that Charlie cannot encrypt new versions (read-only access)
      // In a real implementation, this would be enforced by checking permissions
      const charliePermissions = techDocsKey.holders.find(
        (h) => h.publicKey === charlie.publicKey.toBase58(),
      );
      expect(charliePermissions?.permissions.canEncrypt).toBe(false);
    });
  });

  describe("Legal and Compliance Documentation", () => {
    test("Multi-party contract negotiation with encrypted drafts", async () => {
      // Diana (Legal) manages contract negotiation
      const contractGroup = await createSignatureGroup(
        "Software License Negotiation",
        diana.secretKey,
        [
          { publicKey: alice.publicKey.toBase58(), role: MemberRole.ADMIN }, // Alice represents company
          { publicKey: eve.publicKey.toBase58(), role: MemberRole.VIEWER }, // Eve represents client
        ],
        {
          allowDynamicMembership: true,
          maxMembers: 10,
        },
      );

      // Initial contract draft
      const contractDraft = {
        contract_id: "SLA-2024-001",
        title: "Software Licensing Agreement",
        version: "draft_1.0",
        parties: {
          licensor: "SecureChat Inc.",
          licensee: "Client Corp.",
          licensor_rep: alice.publicKey.toBase58(),
          licensee_rep: eve.publicKey.toBase58(),
        },
        terms: {
          license_fee: "$50,000 annually",
          payment_terms: "Net 30",
          term_length: "3 years",
          renewal_option: "Automatic with 90-day notice",
          liability_cap: "$100,000",
          termination_clause: "30-day notice required",
        },
        negotiation_points: [
          {
            clause: "liability_cap",
            company_position: "$100,000 maximum liability",
            client_position: "Unlimited liability",
            status: "under_negotiation",
            priority: "high",
          },
          {
            clause: "source_code_escrow",
            company_position: "No escrow required",
            client_position: "Escrow required for critical systems",
            status: "under_negotiation",
            priority: "medium",
          },
        ],
        confidential_notes: `
          Internal negotiation strategy:
          - Client is willing to pay premium for unlimited liability
          - We can accept source code escrow if fee increased by 15%
          - Competitor bid was $45,000 - we have room to negotiate
        `,
        status: "draft",
        created_by: diana.publicKey.toBase58(),
        created_at: new Date().toISOString(),
      };

      const encryptedDraft = await encryptForSignatureGroup(
        JSON.stringify(contractDraft),
        contractGroup,
        diana.secretKey,
        diana.publicKey.toBase58(),
      );

      // Alice (company rep) reviews and provides input
      const aliceDecrypted = await decryptSignatureGroupData(
        encryptedDraft,
        alice.secretKey,
        alice.publicKey.toBase58(),
      );

      const aliceDraft = JSON.parse(Buffer.from(aliceDecrypted).toString());
      expect(aliceDraft.confidential_notes).toContain(
        "Competitor bid was $45,000",
      );

      // Alice provides business input
      const businessInput = {
        contract_id: "SLA-2024-001",
        from: alice.publicKey.toBase58(),
        role: "company_representative",
        input_type: "business_guidance",
        comments: [
          {
            clause: "liability_cap",
            business_comment:
              "We can increase to $250,000 if client pays premium",
            risk_assessment: "medium",
          },
          {
            clause: "license_fee",
            business_comment: "Can reduce to $47,500 if they sign 5-year term",
            strategic_note: "Long-term client retention more valuable",
          },
        ],
        confidential_strategy:
          "Focus on multi-year commitment over per-year pricing",
        approval_limits: {
          max_liability: "$250,000",
          min_annual_fee: "$45,000",
          max_discount: "10%",
        },
        timestamp: new Date().toISOString(),
      };

      const encryptedBusinessInput = await encryptForSignatureGroup(
        JSON.stringify(businessInput),
        contractGroup,
        alice.secretKey,
        alice.publicKey.toBase58(),
      );

      // Diana incorporates feedback into new draft
      const dianaDecryptedInput = await decryptSignatureGroupData(
        encryptedBusinessInput,
        diana.secretKey,
        diana.publicKey.toBase58(),
      );

      const businessFeedback = JSON.parse(
        Buffer.from(dianaDecryptedInput).toString(),
      );
      expect(businessFeedback.approval_limits.max_liability).toBe("$250,000");

      // Eve (client) can see the negotiation positions but not internal strategy
      // Note: In production, you'd filter out confidential sections for client view
      await expect(
        decryptSignatureGroupData(
          encryptedBusinessInput,
          eve.secretKey,
          eve.publicKey.toBase58(),
        ),
      ).rejects.toThrow(); // Eve has VIEWER role, cannot decrypt business strategy docs
    });

    test("Compliance audit trail with encrypted audit logs", async () => {
      const sharedKeyManager = new SharedKeyManager();

      // Create audit documentation key
      const auditKey = await sharedKeyManager.createSharedKey(
        {
          name: "SOC 2 Audit Documentation",
          purpose: "Compliance audit documentation and evidence",
          creator: alice.publicKey.toBase58(),
          algorithm: "AES-256-GCM",
          derivationMethod: "ECDH",
          properties: {
            audit_type: "SOC2_Type2",
            audit_period: "2024-Q1-Q4",
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
            publicKey: diana.publicKey.toBase58(),
            permissions: {
              canDecrypt: true,
              canEncrypt: true,
              canShare: false,
              canRevoke: false,
            },
          }, // Legal
          {
            publicKey: frank.publicKey.toBase58(),
            permissions: {
              canDecrypt: true,
              canEncrypt: false,
              canShare: false,
              canRevoke: false,
            },
          }, // External auditor
        ],
        alice.secretKey,
      );

      // Audit evidence document
      const auditEvidence = {
        audit_id: "SOC2-2024-001",
        evidence_type: "access_controls_review",
        audit_period: "2024-Q1-Q4",
        findings: [
          {
            control_id: "CC6.1",
            control_name: "Logical Access Controls",
            status: "effective",
            evidence: [
              "Multi-factor authentication implemented for all admin accounts",
              "Regular access reviews performed quarterly",
              "Privileged access monitoring in place",
            ],
            test_results: "No exceptions identified",
            auditor_notes: "Strong access control framework observed",
          },
          {
            control_id: "CC6.7",
            control_name: "Data Encryption",
            status: "effective",
            evidence: [
              "All data encrypted in transit using TLS 1.3",
              "Database encryption at rest using AES-256",
              "Key management procedures documented and followed",
            ],
            sensitive_finding:
              "One legacy system using TLS 1.2 - remediation scheduled",
            remediation_date: "2024-12-31",
          },
        ],
        confidential_observations: `
          Internal control deficiencies noted (not disclosed to client):
          1. Some developers have excessive database privileges
          2. Backup encryption keys stored in same facility as primary
          3. Incident response plan not tested in Q3
          
          Management responses received and remediation plans approved.
        `,
        external_auditor: frank.publicKey.toBase58(),
        internal_reviewer: diana.publicKey.toBase58(),
        report_date: new Date().toISOString(),
        classification: "audit_confidential",
      };

      const encryptedAuditDoc = await sharedKeyManager.encryptWithSharedKey(
        JSON.stringify(auditEvidence),
        auditKey.keyId,
        alice.secretKey,
        alice.publicKey.toBase58(),
      );

      // Frank (external auditor) can access for review
      const frankDecrypted = await sharedKeyManager.decryptWithSharedKey(
        encryptedAuditDoc,
        frank.secretKey,
        frank.publicKey.toBase58(),
      );

      const frankAudit = JSON.parse(Buffer.from(frankDecrypted).toString());
      expect(frankAudit.findings).toHaveLength(2);
      expect(frankAudit.confidential_observations).toContain(
        "excessive database privileges",
      );

      // Diana (legal) can review for legal implications
      const dianaDecrypted = await sharedKeyManager.decryptWithSharedKey(
        encryptedAuditDoc,
        diana.secretKey,
        diana.publicKey.toBase58(),
      );

      const dianaAudit = JSON.parse(Buffer.from(dianaDecrypted).toString());
      expect(dianaAudit.audit_id).toBe("SOC2-2024-001");
      expect(dianaAudit.classification).toBe("audit_confidential");
    });
  });

  describe("Performance and Scalability Testing", () => {
    test("Large document encryption performance", async () => {
      const sharedKeyManager = new SharedKeyManager();

      // Create shared key for large documents
      const largeDocs = await sharedKeyManager.createSharedKey(
        {
          name: "Large Document Test",
          purpose: "Performance testing with large documents",
          creator: alice.publicKey.toBase58(),
          algorithm: "AES-256-GCM",
          derivationMethod: "ECDH",
          properties: {},
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
        ],
        alice.secretKey,
      );

      // Generate large document (simulate 1MB document)
      const largeContent =
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(
          20000,
        ); // ~1MB

      const largeDocument = {
        title: "Large Technical Specification",
        size_bytes: largeContent.length,
        content: largeContent,
        metadata: {
          pages: 100,
          sections: 50,
          images: 25,
          tables: 15,
        },
        created_at: new Date().toISOString(),
      };

      const startTime = Date.now();

      // Test encryption performance
      const encrypted = await sharedKeyManager.encryptWithSharedKey(
        JSON.stringify(largeDocument),
        largeDocs.keyId,
        alice.secretKey,
        alice.publicKey.toBase58(),
      );

      const encryptTime = Date.now() - startTime;

      // Test decryption performance
      const decryptStart = Date.now();

      const bobDecrypted = await sharedKeyManager.decryptWithSharedKey(
        encrypted,
        bob.secretKey,
        bob.publicKey.toBase58(),
      );

      const decryptTime = Date.now() - decryptStart;

      const recoveredDoc = JSON.parse(Buffer.from(bobDecrypted).toString());

      expect(recoveredDoc.size_bytes).toBe(largeContent.length);
      expect(recoveredDoc.content.length).toBeGreaterThan(1000000); // ~1MB

      // Performance assertions (these will vary by hardware)
      expect(encryptTime).toBeLessThan(5000); // Should encrypt in under 5 seconds
      expect(decryptTime).toBeLessThan(5000); // Should decrypt in under 5 seconds

      console.log(`Large document performance:`);
      console.log(
        `  Document size: ${(largeContent.length / 1024 / 1024).toFixed(2)} MB`,
      );
      console.log(`  Encryption time: ${encryptTime}ms`);
      console.log(`  Decryption time: ${decryptTime}ms`);
    });

    test("Many recipients performance test", async () => {
      // Test scalability with many recipients
      const manyRecipients: Keypair[] = [];

      // Generate 10 additional keypairs
      for (let i = 0; i < 10; i++) {
        manyRecipients.push(Keypair.generate());
      }

      const sharedKeyManager = new SharedKeyManager();

      const startTime = Date.now();

      // Create shared key with many recipients
      const manyRecipientsKey = await sharedKeyManager.createSharedKey(
        {
          name: "Company All-Hands Documents",
          purpose: "Documents accessible by all employees",
          creator: alice.publicKey.toBase58(),
          algorithm: "AES-256-GCM",
          derivationMethod: "ECDH",
          properties: {},
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
          ...manyRecipients.map((recipient) => ({
            publicKey: recipient.publicKey.toBase58(),
            permissions: {
              canDecrypt: true,
              canEncrypt: false,
              canShare: false,
              canRevoke: false,
            },
          })),
        ],
        alice.secretKey,
      );

      const keyCreationTime = Date.now() - startTime;

      // Test encryption with many recipients
      const testDocument = {
        title: "Company All-Hands Meeting Notes",
        date: new Date().toISOString(),
        content:
          "Meeting notes with financial updates and strategic direction...",
        attendees: manyRecipients.length + 1,
      };

      const encryptStart = Date.now();

      const encrypted = await sharedKeyManager.encryptWithSharedKey(
        JSON.stringify(testDocument),
        manyRecipientsKey.keyId,
        alice.secretKey,
        alice.publicKey.toBase58(),
      );

      const encryptTime = Date.now() - encryptStart;

      // Test that multiple recipients can decrypt
      const decryptPromises = manyRecipients
        .slice(0, 5)
        .map(async (recipient) => {
          const decrypted = await sharedKeyManager.decryptWithSharedKey(
            encrypted,
            recipient.secretKey,
            recipient.publicKey.toBase58(),
          );
          return JSON.parse(Buffer.from(decrypted).toString());
        });

      const decryptStart = Date.now();
      const results = await Promise.all(decryptPromises);
      const decryptTime = Date.now() - decryptStart;

      // Verify all recipients could decrypt successfully
      results.forEach((result) => {
        expect(result.title).toBe("Company All-Hands Meeting Notes");
        expect(result.attendees).toBe(manyRecipients.length + 1);
      });

      console.log(`Many recipients performance:`);
      console.log(`  Recipients count: ${manyRecipients.length + 1}`);
      console.log(`  Key creation time: ${keyCreationTime}ms`);
      console.log(`  Encryption time: ${encryptTime}ms`);
      console.log(
        `  Parallel decryption time (5 recipients): ${decryptTime}ms`,
      );

      // Performance assertions
      expect(keyCreationTime).toBeLessThan(10000); // Key creation should complete in under 10s
      expect(encryptTime).toBeLessThan(1000); // Encryption should be fast regardless of recipient count
      expect(decryptTime).toBeLessThan(5000); // 5 parallel decryptions should complete in under 5s
    });
  });
});
