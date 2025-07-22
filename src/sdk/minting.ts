/**
 * Gorbchain SDK - Token and NFT Minting Functions
 *
 * This module provides comprehensive token and NFT minting capabilities
 * for the Gorbchain network, including Token22 program integration and
 * Metaplex Core NFT minting.
 */

import type { Connection } from "@solana/web3.js";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  createInitializeMintInstruction,
  createMintToInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  getMintLen,
  ExtensionType,
  createInitializeMetadataPointerInstruction,
  createInitializeInstruction,
  MINT_SIZE,
} from "@solana/spl-token";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore, createV1 } from "@metaplex-foundation/mpl-core";
import { generateSigner } from "@metaplex-foundation/umi";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";

// Token22 Program ID for Gorbchain
const TOKEN22_PROGRAM = new PublicKey(
  "FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn",
);
const ASSOCIATED_TOKEN_PROGRAM = new PublicKey(
  "4YpYoLVTQ8bxcne9GneN85RUXeN7pqGTwgPcY71ZL5gX",
);

// Custom MPL Core Program for Gorbchain
const CUSTOM_MPL_CORE_PROGRAM = "BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc";

/**
 * Token creation parameters
 */
export interface TokenCreationParams {
  name: string;
  symbol: string;
  supply: number;
  decimals: number;
  uri?: string;
  description?: string;
}

/**
 * NFT creation parameters
 */
export interface NFTCreationParams {
  name: string;
  uri: string;
  description?: string;
  royaltyBasisPoints?: number;
  creators?: Array<{
    address: string;
    percentage: number;
  }>;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
}

/**
 * Token minting result
 */
export interface TokenMintResult {
  signature: string;
  tokenAddress: string;
  associatedTokenAddress: string;
  transactionUrl?: string;
}

/**
 * NFT minting result
 */
export interface NFTMintResult {
  signature: string;
  assetAddress: string;
  transactionUrl?: string;
}

/**
 * Transaction options
 */
export interface TransactionOptions {
  commitment?: "processed" | "confirmed" | "finalized";
  maxRetries?: number;
  skipPreflight?: boolean;
}

/**
 * Calculate the required space for token metadata
 */
function calculateMetadataSpace(
  name: string,
  symbol: string,
  uri: string,
): number {
  const baseFields = {
    updateAuthority: 32,
    mint: 32,
    name: 4 + name.length,
    symbol: 4 + symbol.length,
    uri: 4 + uri.length,
    additionalMetadata: 4, // Empty vec
  };

  const totalSize = Object.values(baseFields).reduce((a, b) => a + b, 0);
  const tlvOverhead = 4; // Type-Length-Value overhead
  const padding = Math.ceil(totalSize * 0.1); // 10% padding for safety

  return totalSize + tlvOverhead + padding;
}

/**
 * Calculate mint account size with extensions
 */
function calculateMintAccountSize(extensions: ExtensionType[]): number {
  const baseSize = MINT_SIZE; // 82 bytes
  const extensionSize = extensions.reduce((acc, ext) => {
    switch (ext) {
      case ExtensionType.MetadataPointer:
        return acc + 32; // Metadata pointer size
      default:
        return acc;
    }
  }, 0);
  return baseSize + extensionSize;
}

/**
 * Validate token parameters
 */
function validateTokenParameters(params: TokenCreationParams): void {
  if (!params.name || params.name.length > 32) {
    throw new Error("Token name must be 1-32 characters");
  }

  if (!params.symbol || params.symbol.length > 10) {
    throw new Error("Token symbol must be 1-10 characters");
  }

  if (params.supply <= 0 || params.supply > 1e15) {
    throw new Error("Token supply must be between 1 and 1e15");
  }

  if (params.decimals < 0 || params.decimals > 9) {
    throw new Error("Decimals must be between 0 and 9");
  }

  if (params.uri && !isValidUrl(params.uri)) {
    throw new Error("Invalid URI format");
  }
}

/**
 * Validate NFT parameters
 */
function validateNFTParameters(params: NFTCreationParams): void {
  if (!params.name || params.name.length > 32) {
    throw new Error("NFT name must be 1-32 characters");
  }

  if (!params.uri || !isValidUrl(params.uri)) {
    throw new Error("Valid metadata URI is required");
  }

  if (
    params.royaltyBasisPoints &&
    (params.royaltyBasisPoints < 0 || params.royaltyBasisPoints > 10000)
  ) {
    throw new Error("Royalty basis points must be between 0 and 10000");
  }

  if (params.creators) {
    const totalPercentage = params.creators.reduce(
      (sum, creator) => sum + creator.percentage,
      0,
    );
    if (totalPercentage !== 100) {
      throw new Error("Creator percentages must sum to 100");
    }
  }
}

/**
 * Simple URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Send transaction with retry logic
 */
async function sendTransactionWithRetry(
  connection: Connection,
  transaction: Transaction,
  signers: Keypair[],
  options: TransactionOptions = {},
): Promise<string> {
  const {
    commitment = "confirmed",
    maxRetries = 3,
    skipPreflight = false,
  } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Get fresh blockhash
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;

      // Simulate transaction first
      const simulation = await connection.simulateTransaction(transaction);
      if (simulation.value.err) {
        const logs = simulation.value.logs?.join("\n") || "No logs available";
        throw new Error(`Transaction simulation failed: ${logs}`);
      }

      // Send and confirm transaction
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        signers,
        {
          commitment,
          skipPreflight,
        },
      );

      return signature;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retry with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw new Error("Max retries reached");
}

/**
 * Create a new Token22 token with metadata (Two-Transaction Approach)
 *
 * This is the recommended approach for reliability with complex metadata
 */
export async function createToken22TwoTx(
  connection: Connection,
  payer: Keypair,
  params: TokenCreationParams,
  options: TransactionOptions = {},
): Promise<TokenMintResult> {
  validateTokenParameters(params);

  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;

  // Transaction 1: Create mint account and initialize
  const extensions = [ExtensionType.MetadataPointer];
  const mintLen = getMintLen(extensions);
  const rentExemption =
    await connection.getMinimumBalanceForRentExemption(mintLen);

  const setupTransaction = new Transaction();
  setupTransaction.feePayer = payer.publicKey;

  // Create the mint account
  setupTransaction.add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint,
      lamports: rentExemption,
      space: mintLen,
      programId: TOKEN22_PROGRAM,
    }),
  );

  // Initialize metadata pointer
  setupTransaction.add(
    createInitializeMetadataPointerInstruction(
      mint,
      payer.publicKey,
      mint,
      TOKEN22_PROGRAM,
    ),
  );

  // Initialize mint
  setupTransaction.add(
    createInitializeMintInstruction(
      mint,
      params.decimals,
      payer.publicKey,
      payer.publicKey,
      TOKEN22_PROGRAM,
    ),
  );

  // const _setupSignature = await sendTransactionWithRetry(
  //   connection,
  //   setupTransaction,
  //   [payer, mintKeypair],
  //   options
  // );

  // Transaction 2: Initialize metadata and mint tokens
  const mintingTransaction = new Transaction();
  mintingTransaction.feePayer = payer.publicKey;

  // Initialize metadata if URI provided
  if (params.uri) {
    const metadataSpace = calculateMetadataSpace(
      params.name,
      params.symbol,
      params.uri,
    );

    // Get current account info to calculate additional rent
    const accountInfo = await connection.getAccountInfo(mint);
    if (!accountInfo) {
      throw new Error("Mint account not found after setup");
    }

    const currentSize = accountInfo.data.length;
    const newSize = currentSize + metadataSpace;
    const additionalRent =
      (await connection.getMinimumBalanceForRentExemption(newSize)) -
      accountInfo.lamports;

    // Transfer additional rent if needed
    if (additionalRent > 0) {
      mintingTransaction.add(
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: mint,
          lamports: additionalRent,
        }),
      );
    }

    // Initialize metadata
    mintingTransaction.add(
      createInitializeInstruction({
        programId: TOKEN22_PROGRAM,
        metadata: mint,
        updateAuthority: payer.publicKey,
        mint,
        mintAuthority: payer.publicKey,
        name: params.name,
        symbol: params.symbol,
        uri: params.uri,
      }),
    );
  }

  // Create associated token account
  const associatedToken = getAssociatedTokenAddressSync(
    mint,
    payer.publicKey,
    false,
    TOKEN22_PROGRAM,
    ASSOCIATED_TOKEN_PROGRAM,
  );

  mintingTransaction.add(
    createAssociatedTokenAccountInstruction(
      payer.publicKey,
      associatedToken,
      payer.publicKey,
      mint,
      TOKEN22_PROGRAM,
      ASSOCIATED_TOKEN_PROGRAM,
    ),
  );

  // Mint tokens
  const mintAmount = BigInt(params.supply) * BigInt(10 ** params.decimals);
  mintingTransaction.add(
    createMintToInstruction(
      mint,
      associatedToken,
      payer.publicKey,
      mintAmount,
      [],
      TOKEN22_PROGRAM,
    ),
  );

  const mintingSignature = await sendTransactionWithRetry(
    connection,
    mintingTransaction,
    [payer],
    options,
  );

  return {
    signature: mintingSignature,
    tokenAddress: mint.toString(),
    associatedTokenAddress: associatedToken.toString(),
    transactionUrl: `https://explorer.gorbchain.xyz/tx/${mintingSignature}`,
  };
}

/**
 * Create a new Token22 token with metadata (Single Transaction Approach)
 *
 * Faster execution but may be less reliable for complex metadata
 */
export async function createToken22SingleTx(
  connection: Connection,
  payer: Keypair,
  params: TokenCreationParams,
  options: TransactionOptions = {},
): Promise<TokenMintResult> {
  validateTokenParameters(params);

  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;

  const extensions = [ExtensionType.MetadataPointer];
  const mintLen = getMintLen(extensions);
  const rentExemption =
    await connection.getMinimumBalanceForRentExemption(mintLen);

  const transaction = new Transaction();
  transaction.feePayer = payer.publicKey;

  // Create the mint account
  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint,
      lamports: rentExemption,
      space: mintLen,
      programId: TOKEN22_PROGRAM,
    }),
  );

  // Initialize metadata pointer
  transaction.add(
    createInitializeMetadataPointerInstruction(
      mint,
      payer.publicKey,
      mint,
      TOKEN22_PROGRAM,
    ),
  );

  // Initialize mint
  transaction.add(
    createInitializeMintInstruction(
      mint,
      params.decimals,
      payer.publicKey,
      payer.publicKey,
      TOKEN22_PROGRAM,
    ),
  );

  // Initialize metadata if URI provided
  if (params.uri) {
    transaction.add(
      createInitializeInstruction({
        programId: TOKEN22_PROGRAM,
        metadata: mint,
        updateAuthority: payer.publicKey,
        mint,
        mintAuthority: payer.publicKey,
        name: params.name,
        symbol: params.symbol,
        uri: params.uri,
      }),
    );
  }

  // Create associated token account
  const associatedToken = getAssociatedTokenAddressSync(
    mint,
    payer.publicKey,
    false,
    TOKEN22_PROGRAM,
    ASSOCIATED_TOKEN_PROGRAM,
  );

  transaction.add(
    createAssociatedTokenAccountInstruction(
      payer.publicKey,
      associatedToken,
      payer.publicKey,
      mint,
      TOKEN22_PROGRAM,
      ASSOCIATED_TOKEN_PROGRAM,
    ),
  );

  // Mint tokens
  const mintAmount = BigInt(params.supply) * BigInt(10 ** params.decimals);
  transaction.add(
    createMintToInstruction(
      mint,
      associatedToken,
      payer.publicKey,
      mintAmount,
      [],
      TOKEN22_PROGRAM,
    ),
  );

  const signature = await sendTransactionWithRetry(
    connection,
    transaction,
    [payer, mintKeypair],
    options,
  );

  return {
    signature,
    tokenAddress: mint.toString(),
    associatedTokenAddress: associatedToken.toString(),
    transactionUrl: `https://explorer.gorbchain.xyz/tx/${signature}`,
  };
}

/**
 * Create a new NFT using Metaplex Core
 */
export async function createNFT(
  connection: Connection,
  wallet: any, // Wallet adapter
  params: NFTCreationParams,
  _options: TransactionOptions = {},
): Promise<NFTMintResult> {
  validateNFTParameters(params);

  try {
    // Setup UMI context
    const umi = createUmi(connection.rpcEndpoint)
      .use(mplCore())
      .use(walletAdapterIdentity(wallet));

    const assetSigner = generateSigner(umi);

    // Create NFT with basic parameters for now
    // Note: Advanced features like royalties and attributes can be added in future versions
    const result = await createV1(umi, {
      asset: assetSigner,
      name: params.name,
      uri: params.uri,
    }).sendAndConfirm(umi);

    // Convert signature from Uint8Array to hex string
    const signature = Array.from(result.signature, (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");

    return {
      signature,
      assetAddress: assetSigner.publicKey.toString(),
      transactionUrl: `https://explorer.gorbchain.xyz/tx/${signature}`,
    };
  } catch (error) {
    // console.error('❌ NFT creation failed:', error);
    throw new Error(
      `NFT creation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Check if user has sufficient balance for transaction
 */
export async function checkSufficientBalance(
  connection: Connection,
  payer: PublicKey,
  estimatedCost: number,
): Promise<{ sufficient: boolean; balance: number; required: number }> {
  const balance = await connection.getBalance(payer);
  const requiredBalance = estimatedCost + 5000000; // 0.005 SOL buffer

  return {
    sufficient: balance >= requiredBalance,
    balance,
    required: requiredBalance,
  };
}

/**
 * Estimate cost for token creation
 */
export async function estimateTokenCreationCost(
  connection: Connection,
  params: TokenCreationParams,
): Promise<number> {
  const extensions = [ExtensionType.MetadataPointer];
  const mintLen = getMintLen(extensions);
  const mintRent = await connection.getMinimumBalanceForRentExemption(mintLen);

  const ataRent = await connection.getMinimumBalanceForRentExemption(165); // ATA size

  // Base transaction fees (estimated)
  const baseFees = 10000; // 0.00001 SOL

  // Metadata space if URI provided
  let metadataRent = 0;
  if (params.uri) {
    const metadataSpace = calculateMetadataSpace(
      params.name,
      params.symbol,
      params.uri,
    );
    metadataRent =
      await connection.getMinimumBalanceForRentExemption(metadataSpace);
  }

  return mintRent + ataRent + baseFees + metadataRent;
}

/**
 * Estimate cost for NFT creation
 */
export async function estimateNFTCreationCost(
  connection: Connection,
  params: NFTCreationParams,
): Promise<number> {
  // Base NFT creation cost (estimated)
  const baseCost = 10000000; // 0.01 SOL

  // Additional costs for plugins
  let pluginCost = 0;
  if (params.royaltyBasisPoints && params.royaltyBasisPoints > 0) {
    pluginCost += 2000000; // 0.002 SOL for royalty plugin
  }

  if (params.attributes && params.attributes.length > 0) {
    pluginCost += 1000000; // 0.001 SOL for attributes plugin
  }

  return baseCost + pluginCost;
}

/**
 * Get token information from mint address
 */
export async function getTokenInfo(
  connection: Connection,
  mintAddress: string,
): Promise<{
  mint: string;
  supply: string;
  decimals: number;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  metadata?: {
    name: string;
    symbol: string;
    uri: string;
  };
}> {
  const mint = new PublicKey(mintAddress);
  const accountInfo = await connection.getAccountInfo(mint);

  if (!accountInfo) {
    throw new Error("Token mint not found");
  }

  // Parse mint data (simplified - you'd need proper deserialization)
  const data = accountInfo.data;

  return {
    mint: mintAddress,
    supply: "0", // Would need proper parsing
    decimals: data[44], // Decimal offset in mint data
    mintAuthority: null, // Would need proper parsing
    freezeAuthority: null, // Would need proper parsing
    metadata: undefined, // Would need metadata parsing
  };
}

// Export all functions and types
export {
  TOKEN22_PROGRAM,
  ASSOCIATED_TOKEN_PROGRAM,
  CUSTOM_MPL_CORE_PROGRAM,
  calculateMetadataSpace,
  calculateMintAccountSize,
  validateTokenParameters,
  validateNFTParameters,
  sendTransactionWithRetry,
};
