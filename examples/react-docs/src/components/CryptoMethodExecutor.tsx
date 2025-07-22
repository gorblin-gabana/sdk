import { useState } from "react";
import { Keypair } from "@solana/web3.js";
import ResultDisplay from "./ResultDisplay";
import ParameterInput from "./ParameterInput";
import CodeBlock from "./CodeBlock";

interface CryptoMethod {
  id: string;
  name: string;
  description: string;
  method: string;
  params: Array<{
    name: string;
    type: string;
    placeholder: string;
    required: boolean;
  }>;
  example: string;
}

interface Props {
  method: CryptoMethod;
  generatedKeys?: Array<{ publicKey: string; privateKey: string }>;
}

export function CryptoMethodExecutor({ method, generatedKeys = [] }: Props) {
  const [params, setParams] = useState<{ [key: string]: string }>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleParamChange = (name: string, value: string) => {
    setParams((prev) => ({ ...prev, [name]: value }));
  };

  const fillWithGeneratedKey = (
    paramName: string,
    keyType: "publicKey" | "privateKey",
    keyIndex: number = 0,
  ) => {
    if (generatedKeys[keyIndex]) {
      setParams((prev) => ({
        ...prev,
        [paramName]:
          keyType === "privateKey"
            ? generatedKeys[keyIndex].privateKey
            : generatedKeys[keyIndex].publicKey,
      }));
    }
  };

  const executeMethod = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      let result: any;

      switch (method.id) {
        case "generate-keypair":
          const keypair = Keypair.generate();
          result = {
            success: true,
            publicKey: keypair.publicKey.toBase58(),
            privateKey: Buffer.from(keypair.secretKey).toString("base64"),
            timestamp: new Date().toISOString(),
          };
          break;

        case "personal-encrypt":
          if (!params.data || !params.privateKey) {
            throw new Error("Data and private key are required");
          }

          // Demo mode implementation (since crypto library may not be available in browser)
          result = {
            success: true,
            demoMode: true,
            encryptedData:
              "demo_encrypted_" + Buffer.from(params.data).toString("base64"),
            method: "personal",
            metadata: {
              nonce: "demo_nonce_" + Date.now(),
              timestamp: Math.floor(Date.now() / 1000),
              version: "1.0.0",
              salt: "demo_salt_" + Date.now(),
            },
            note: "Demo mode - In production, this would use real AES-256-GCM encryption",
          };
          break;

        case "personal-decrypt":
          if (!params.encryptedResult || !params.privateKey) {
            throw new Error("Encrypted result and private key are required");
          }

          // Demo mode fallback
          if (params.encryptedResult.includes("demo_encrypted_")) {
            const demoData = params.encryptedResult.replace(
              "demo_encrypted_",
              "",
            );
            result = {
              success: true,
              demoMode: true,
              decryptedData: Buffer.from(demoData, "base64").toString(),
              note: "Demo mode decryption - In production, this would use real AES-256-GCM decryption",
            };
          } else {
            try {
              JSON.parse(params.encryptedResult); // Just validate JSON format
              result = {
                success: false,
                demoMode: true,
                error: "Real decryption not available in demo mode",
                note: "Please use demo encrypted data or run with full crypto implementation",
              };
            } catch (e) {
              throw new Error("Invalid encrypted data format");
            }
          }
          break;

        case "direct-encrypt":
          if (
            !params.data ||
            !params.recipientPublicKey ||
            !params.senderPrivateKey
          ) {
            throw new Error(
              "Data, recipient public key, and sender private key are required",
            );
          }

          result = {
            success: true,
            demoMode: true,
            encryptedData:
              "demo_direct_encrypted_" +
              Buffer.from(params.data).toString("base64"),
            method: "direct",
            metadata: {
              senderPublicKey: "demo_sender_key",
              recipientPublicKey: params.recipientPublicKey,
              ephemeralPublicKey: "demo_ephemeral_" + Date.now(),
              nonce: "demo_nonce_" + Date.now(),
              timestamp: Math.floor(Date.now() / 1000),
              version: "1.0.0",
            },
            note: "Demo mode - In production, this would use ECDH key exchange and ephemeral keys",
          };
          break;

        case "direct-decrypt":
          if (!params.encryptedResult || !params.recipientPrivateKey) {
            throw new Error(
              "Encrypted result and recipient private key are required",
            );
          }

          if (params.encryptedResult.includes("demo_direct_encrypted_")) {
            const demoData = params.encryptedResult.replace(
              "demo_direct_encrypted_",
              "",
            );
            result = {
              success: true,
              demoMode: true,
              decryptedData: Buffer.from(demoData, "base64").toString(),
              note: "Demo mode decryption - In production, this would use ECDH key exchange",
            };
          } else {
            result = {
              success: false,
              demoMode: true,
              error: "Real decryption not available in demo mode",
              note: "Please use demo encrypted data",
            };
          }
          break;

        case "create-signature-group":
          if (!params.groupName || !params.creatorPrivateKey) {
            throw new Error("Group name and creator private key are required");
          }

          let initialMembers = [];
          if (params.initialMembers) {
            try {
              initialMembers = JSON.parse(params.initialMembers);
            } catch (e) {
              console.warn("Invalid JSON in initialMembers, using empty array");
            }
          }

          result = {
            success: true,
            demoMode: true,
            groupId: "demo_group_" + Date.now(),
            groupName: params.groupName,
            groupSignature: "demo_signature_" + Date.now(),
            members: [
              {
                publicKey: "demo_creator_public_key",
                role: "OWNER",
                joinedAt: Math.floor(Date.now() / 1000),
                addedBy: "demo_creator_public_key",
                permissions: {
                  canDecrypt: true,
                  canEncrypt: true,
                  canShare: true,
                  canRevoke: true,
                },
              },
              ...initialMembers.map((member: any, index: number) => ({
                publicKey: member.publicKey || `demo_member_${index}`,
                role: member.role || "MEMBER",
                joinedAt: Math.floor(Date.now() / 1000),
                addedBy: "demo_creator_public_key",
                permissions: {
                  canDecrypt: true,
                  canEncrypt: true,
                  canShare: false,
                  canRevoke: false,
                },
              })),
            ],
            permissions: {
              allowDynamicMembership: params.allowDynamicMembership !== "false",
              maxMembers: parseInt(params.maxMembers) || 10,
              requireSignatureVerification: true,
            },
            keyShares: [],
            epochs: [
              {
                epochNumber: 0,
                startTime: Math.floor(Date.now() / 1000),
                masterKeyId: "demo_key_" + Date.now(),
              },
            ],
            note: "Demo mode - In production, this would have real cryptographic signatures and key shares",
          };
          break;

        case "sign-data":
          if (!params.data || !params.privateKey) {
            throw new Error("Data and private key are required");
          }

          result = {
            success: true,
            demoMode: true,
            signature:
              "demo_signature_" +
              Buffer.from(params.data + Date.now()).toString("base64"),
            data: params.data,
            algorithm: "ed25519",
            timestamp: new Date().toISOString(),
            note: "Demo mode - In production, this would use real ed25519 signatures",
          };
          break;

        case "verify-signature":
          if (!params.data || !params.signature || !params.publicKey) {
            throw new Error("Data, signature, and public key are required");
          }

          const isValidDemo =
            params.signature?.includes("demo_signature_") &&
            params.signature?.includes(
              Buffer.from(params.data).toString("base64"),
            );

          result = {
            success: true,
            demoMode: true,
            valid: isValidDemo,
            data: params.data,
            signature: params.signature,
            publicKey: params.publicKey,
            algorithm: "ed25519",
            timestamp: new Date().toISOString(),
            note: "Demo mode - In production, this would use real ed25519 signature verification",
          };
          break;

        // Add more crypto methods as needed
        case "encrypt-signature-group":
        case "add-group-member":
        case "create-scalable-context":
        case "encrypt-in-context":
        case "add-context-recipients":
        case "create-shared-key":
        case "encrypt-shared-key":
        case "add-shared-key-recipients":
          result = {
            success: true,
            demoMode: true,
            message: `${method.name} demo functionality`,
            note: "This advanced feature is demonstrated in the full crypto implementation",
            timestamp: new Date().toISOString(),
            methodId: method.id,
          };
          break;

        default:
          result = {
            success: false,
            error: `Method ${method.id} not implemented in demo mode`,
            note: "This method requires the full SDK implementation",
            availableMethods: [
              "generate-keypair",
              "personal-encrypt",
              "personal-decrypt",
              "direct-encrypt",
              "direct-decrypt",
              "create-signature-group",
              "sign-data",
              "verify-signature",
            ],
          };
      }

      setResult({
        ...result,
        executionTime: Date.now() - Date.now(),
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      setError(err.message || "Unknown error occurred");
      setResult({
        success: false,
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="docs-card bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header - GorbchainSDK Theme */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2 text-white">
              {method.name}
            </h2>
            <p className="text-emerald-100 text-lg">{method.description}</p>
          </div>
          <div className="ml-4">
            <div className="bg-white/20 rounded-lg px-3 py-1 text-xs font-semibold text-white">
              Demo Mode
            </div>
          </div>
        </div>

        {/* Code Example - Consistent with docs theme */}
        <div className="mt-6 bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            Example Usage
          </h3>
          <div className="bg-gray-900 rounded-md overflow-hidden">
            <CodeBlock code={method.example} language="typescript" />
          </div>
        </div>
      </div>

      {/* Parameters - GorbchainSDK Theme */}
      {method.params.length > 0 && (
        <div className="bg-gray-50 p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Parameters</h3>
          <div className="space-y-4">
            {method.params.map((param) => (
              <div
                key={param.name}
                className="bg-white rounded-lg p-4 border border-gray-200"
              >
                <div className="mb-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {param.name}
                    {param.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  <p className="text-xs text-gray-500">{param.placeholder}</p>
                </div>

                <ParameterInput
                  parameter={{
                    name: param.name,
                    type: param.type as
                      | "string"
                      | "number"
                      | "boolean"
                      | "object"
                      | "array",
                    required: param.required,
                    description: param.placeholder,
                  }}
                  value={params[param.name] || ""}
                  onChange={(value) => handleParamChange(param.name, value)}
                />

                {/* Key helper buttons - GorbchainSDK styling */}
                {(param.name.includes("privateKey") ||
                  param.name.includes("publicKey")) &&
                  generatedKeys.length > 0 && (
                    <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <p className="text-xs font-medium text-emerald-800 mb-2">
                        Quick Fill with Generated Keys:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {generatedKeys.slice(0, 3).map((_, index) => (
                          <button
                            key={index}
                            onClick={() =>
                              fillWithGeneratedKey(
                                param.name,
                                param.name.includes("privateKey")
                                  ? "privateKey"
                                  : "publicKey",
                                index,
                              )
                            }
                            className="btn-primary text-xs px-3 py-2 rounded-lg transition-all duration-200"
                          >
                            Key {index + 1}{" "}
                            {param.name.includes("privateKey") ? "🔑" : "🔓"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execute Button - GorbchainSDK Theme */}
      <div className="bg-white p-6">
        <div className="flex items-center justify-center">
          <button
            onClick={executeMethod}
            disabled={loading}
            className={`btn-primary px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-200 ${
              loading
                ? "opacity-50 cursor-not-allowed"
                : "hover:shadow-lg transform hover:-translate-y-0.5"
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"></div>
                Executing...
              </div>
            ) : (
              `Execute ${method.name}`
            )}
          </button>
        </div>
      </div>

      {/* Results - GorbchainSDK Theme */}
      {(result || error) && (
        <div className="bg-gray-50 border-t border-gray-200">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Execution Results
            </h3>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">
                  Error Occurred
                </h4>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {result && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <ResultDisplay result={result} methodName={method.name} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
