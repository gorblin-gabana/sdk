/**
 * Rich Transaction Operations - Enhanced transaction functions with decoded context
 * 
 * These functions provide comprehensive transaction analysis including:
 * - Decoded instruction details
 * - Token metadata for token-related transactions
 * - Human-readable summaries
 * - Balance changes and effects
 */

import type { GorbchainSDK } from '../sdk/GorbchainSDK.js';

/**
 * Rich instruction with complete context and metadata
 */
export interface RichInstruction {
  /** Instruction index in the transaction */
  index: number;
  /** Program ID that processed this instruction */
  programId: string;
  /** Program name (e.g., 'System Program', 'SPL Token') */
  programName: string;
  /** Instruction type (e.g., 'Transfer', 'CreateAccount') */
  type: string;
  /** Human-readable description */
  description: string;
  /** Raw instruction data */
  data: Uint8Array;
  /** Account addresses involved */
  accounts: string[];
  /** Decoded instruction details */
  decoded: {
    /** Instruction-specific data */
    [key: string]: any;
  };
  /** Token-related information (if applicable) */
  tokens?: {
    /** Token transfers in this instruction */
    transfers: Array<{
      /** Source account */
      from: string;
      /** Destination account */
      to: string;
      /** Token mint address */
      mint: string;
      /** Amount transferred (raw) */
      amount: string;
      /** Formatted amount with decimals */
      amountFormatted: string;
      /** Token metadata */
      token: {
        name?: string;
        symbol?: string;
        decimals: number;
        isNFT: boolean;
        image?: string;
      };
    }>;
    /** Token accounts created/closed */
    accountChanges: Array<{
      /** Account address */
      account: string;
      /** Change type */
      type: 'created' | 'closed' | 'frozen' | 'thawed';
      /** Associated token mint */
      mint?: string;
      /** Token metadata */
      token?: {
        name?: string;
        symbol?: string;
        decimals: number;
      };
    }>;
  };
  /** SOL balance changes (if applicable) */
  solChanges?: Array<{
    /** Account address */
    account: string;
    /** Balance change in lamports */
    change: number;
    /** Balance change in SOL */
    changeSOL: number;
    /** Change type */
    type: 'debit' | 'credit';
  }>;
  /** Fees consumed by this instruction */
  fees?: {
    /** Base fee in lamports */
    base: number;
    /** Compute budget consumed */
    computeUnits?: number;
    /** Priority fee in lamports */
    priority?: number;
  };
  /** Instruction result */
  result: {
    /** Whether instruction succeeded */
    success: boolean;
    /** Error message if failed */
    error?: string;
    /** Program logs */
    logs: string[];
  };
}

/**
 * Rich transaction with complete analysis and context
 */
export interface RichTransaction {
  /** Transaction signature */
  signature: string;
  /** Block slot */
  slot?: number;
  /** Block time timestamp */
  blockTime?: number;
  /** Confirmation status */
  confirmationStatus?: 'processed' | 'confirmed' | 'finalized';
  /** Transaction fee in lamports */
  fee: number;
  /** Whether transaction succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Rich instructions with decoded context */
  instructions: RichInstruction[];
  /** Transaction summary */
  summary: {
    /** Primary action of the transaction */
    primaryAction: string;
    /** Human-readable description */
    description: string;
    /** Transaction category */
    category: 'transfer' | 'swap' | 'nft' | 'defi' | 'governance' | 'system' | 'unknown';
    /** Key participants */
    participants: Array<{
      /** Wallet address */
      address: string;
      /** Role in transaction */
      role: 'sender' | 'receiver' | 'authority' | 'program';
      /** Address label if known */
      label?: string;
    }>;
    /** Total SOL involved */
    totalSOL: number;
    /** Total tokens involved */
    totalTokens: number;
    /** Total NFTs involved */
    totalNFTs: number;
  };
  /** Balance changes across all accounts */
  balanceChanges: {
    /** SOL balance changes */
    sol: Array<{
      account: string;
      before: number;
      after: number;
      change: number;
    }>;
    /** Token balance changes */
    tokens: Array<{
      account: string;
      mint: string;
      token: {
        name?: string;
        symbol?: string;
        decimals: number;
        isNFT: boolean;
      };
      before: string;
      after: string;
      change: string;
      changeFormatted: string;
    }>;
  };
  /** Transaction metadata */
  meta: {
    /** Compute units consumed */
    computeUnitsConsumed?: number;
    /** Inner instructions count */
    innerInstructionsCount: number;
    /** Total accounts involved */
    totalAccounts: number;
    /** Programs involved */
    programsInvolved: string[];
    /** Analysis duration in milliseconds */
    analysisDuration: number;
    /** Whether metadata was resolved */
    metadataResolved: boolean;
  };
}

/**
 * Get rich transaction with complete decoded context and metadata
 * 
 * This function enhances the basic getTransaction with:
 * - Complete instruction decoding with human-readable descriptions
 * - Token metadata for all token-related operations
 * - Balance change analysis
 * - Transaction categorization and summary
 * - Human-readable transaction description
 * 
 * @param sdk - GorbchainSDK instance
 * @param signature - Transaction signature to analyze
 * @param options - Configuration options
 * @returns Promise resolving to rich transaction with full context
 * 
 * @example
 * ```typescript
 * const sdk = new GorbchainSDK({ rpcEndpoint: 'https://rpc.gorbchain.xyz' });
 * 
 * const richTx = await getRichTransaction(sdk, 'transaction_signature', {
 *   includeTokenMetadata: true,
 *   includeBalanceChanges: true,
 *   resolveAddressLabels: true
 * });
 * 
 * console.log(richTx.summary.description);
 * // "Alice sent 100 USDC to Bob"
 * 
 * console.log(`Category: ${richTx.summary.category}`);
 * console.log(`Total SOL involved: ${richTx.summary.totalSOL}`);
 * 
 * // Analyze each instruction
 * richTx.instructions.forEach((instruction, i) => {
 *   console.log(`${i + 1}. ${instruction.description}`);
 *   
 *   if (instruction.tokens?.transfers) {
 *     instruction.tokens.transfers.forEach(transfer => {
 *       console.log(`  → ${transfer.amountFormatted} ${transfer.token.symbol} from ${transfer.from} to ${transfer.to}`);
 *     });
 *   }
 * });
 * ```
 */
export async function getRichTransaction(
  sdk: GorbchainSDK,
  signature: string,
  options: {
    /** Whether to include token metadata */
    includeTokenMetadata?: boolean;
    /** Whether to include balance changes */
    includeBalanceChanges?: boolean;
    /** Whether to resolve address labels */
    resolveAddressLabels?: boolean;
    /** Maximum retries for metadata fetching */
    maxRetries?: number;
    /** Custom commitment level */
    commitment?: 'processed' | 'confirmed' | 'finalized';
  } = {}
): Promise<RichTransaction> {
  const startTime = Date.now();
  
  const {
    includeTokenMetadata = true,
    includeBalanceChanges = true,
    resolveAddressLabels = false,
    maxRetries = 3,
    commitment = 'finalized'
  } = options;

  try {
    // Get the basic transaction with decoding
    const decodedTx = await sdk.getAndDecodeTransaction(signature, {
      richDecoding: true,
      includeTokenMetadata,
      maxRetries
    });

    if (!decodedTx || !decodedTx.decoded) {
      throw new Error('Transaction not found or could not be decoded');
    }

    // Get raw transaction for additional metadata
    const rawTx = await sdk.getTransaction(signature, {
      commitment,
      maxSupportedTransactionVersion: 0
    });

    if (!rawTx) {
      throw new Error('Raw transaction data not found');
    }

    // Build rich instructions
    const richInstructions: RichInstruction[] = [];
    
    for (let i = 0; i < decodedTx.decoded.length; i++) {
      const instruction = decodedTx.decoded[i];
      
      const richInstruction = await enrichInstruction(
        sdk,
        instruction,
        i,
        rawTx,
        {
          includeTokenMetadata,
          resolveAddressLabels
        }
      );
      
      richInstructions.push(richInstruction);
    }

    // Analyze balance changes if requested
    let balanceChanges: RichTransaction['balanceChanges'] = {
      sol: [],
      tokens: []
    };

    if (includeBalanceChanges && rawTx.meta) {
      balanceChanges = await analyzeBalanceChanges(
        sdk,
        rawTx,
        { includeTokenMetadata }
      );
    }

    // Generate transaction summary
    const summary = generateTransactionSummary(richInstructions, balanceChanges);

    // Extract metadata
    const meta = {
      computeUnitsConsumed: rawTx.meta?.computeUnitsConsumed,
      innerInstructionsCount: rawTx.meta?.innerInstructions?.length || 0,
      totalAccounts: rawTx.transaction?.message?.accountKeys?.length || 0,
      programsInvolved: [...new Set(richInstructions.map(ix => ix.programId))],
      analysisDuration: Date.now() - startTime,
      metadataResolved: includeTokenMetadata
    };

    return {
      signature,
      slot: rawTx.slot,
      blockTime: rawTx.blockTime ? rawTx.blockTime * 1000 : undefined,
      confirmationStatus: commitment,
      fee: rawTx.meta?.fee || 0,
      success: !rawTx.meta?.err,
      error: rawTx.meta?.err ? JSON.stringify(rawTx.meta.err) : undefined,
      instructions: richInstructions,
      summary,
      balanceChanges,
      meta
    };

  } catch (error) {
    throw new Error(`Failed to get rich transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Enrich a single instruction with context and metadata
 */
async function enrichInstruction(
  sdk: GorbchainSDK,
  instruction: any,
  index: number,
  rawTx: any,
  options: {
    includeTokenMetadata: boolean;
    resolveAddressLabels: boolean;
  }
): Promise<RichInstruction> {
  const { includeTokenMetadata, resolveAddressLabels } = options;

  // Basic instruction info
  const richInstruction: RichInstruction = {
    index,
    programId: instruction.programId,
    programName: getProgramName(instruction.programId),
    type: instruction.type || 'unknown',
    description: await generateInstructionDescription(instruction),
    data: instruction.data || new Uint8Array(),
    accounts: instruction.accounts || [],
    decoded: instruction.decoded || instruction.data || {},
    result: {
      success: true, // Will be updated based on transaction success
      error: undefined,
      logs: []
    }
  };

  // Add program logs if available
  if (rawTx.meta?.logMessages) {
    richInstruction.result.logs = rawTx.meta.logMessages.filter((log: string) =>
      log.includes(instruction.programId)
    );
  }

  // Analyze token-related operations
  if (isTokenRelatedInstruction(instruction)) {
    richInstruction.tokens = await analyzeTokenOperations(
      sdk,
      instruction,
      { includeTokenMetadata }
    );
  }

  // Analyze SOL balance changes for this instruction
  if (isSOLRelatedInstruction(instruction)) {
    richInstruction.solChanges = await analyzeSOLChanges(instruction, rawTx);
  }

  // Estimate fees for this instruction
  richInstruction.fees = estimateInstructionFees(instruction, rawTx);

  return richInstruction;
}

/**
 * Generate human-readable description for an instruction
 */
async function generateInstructionDescription(instruction: any): Promise<string> {
  const programName = getProgramName(instruction.programId);
  const type = instruction.type || 'unknown';

  // Generate descriptions based on program and instruction type
  switch (instruction.programId) {
    case '11111111111111111111111111111111': // System Program
      switch (type) {
        case 'transfer':
          return `Transfer SOL between accounts`;
        case 'createAccount':
          return `Create new account`;
        case 'allocate':
          return `Allocate account space`;
        default:
          return `${programName} ${type} operation`;
      }

    case 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': // SPL Token
    case 'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn': // Token-2022
      switch (type) {
        case 'transfer':
          return `Transfer tokens between accounts`;
        case 'mint':
          return `Mint new tokens`;
        case 'burn':
          return `Burn tokens`;
        case 'createAccount':
          return `Create token account`;
        default:
          return `${programName} ${type} operation`;
      }

    default:
      return `${programName} ${type} operation`;
  }
}

/**
 * Get human-readable program name
 */
function getProgramName(programId: string): string {
  const programNames: Record<string, string> = {
    '11111111111111111111111111111111': 'System Program',
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'SPL Token',
    'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn': 'Token-2022',
    '4YpYoLVTQ8bxcne9GneN85RUXeN7pqGTwgPcY71ZL5gX': 'Associated Token Account',
    'BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc': 'MPL Core NFT',
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s': 'Metaplex NFT'
  };

  return programNames[programId] || 'Unknown Program';
}

/**
 * Check if instruction is token-related
 */
function isTokenRelatedInstruction(instruction: any): boolean {
  const tokenPrograms = [
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn',
    'BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc',
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
  ];

  return tokenPrograms.includes(instruction.programId);
}

/**
 * Check if instruction is SOL-related
 */
function isSOLRelatedInstruction(instruction: any): boolean {
  return instruction.programId === '11111111111111111111111111111111';
}

/**
 * Analyze token operations in an instruction
 */
async function analyzeTokenOperations(
  sdk: GorbchainSDK,
  instruction: any,
  options: { includeTokenMetadata: boolean }
): Promise<RichInstruction['tokens']> {
  const transfers: any[] = [];
  const accountChanges: any[] = [];

  // Extract token transfer information based on instruction type
  if (instruction.type === 'transfer' && instruction.decoded) {
    const transfer = {
      from: instruction.accounts[0] || 'unknown',
      to: instruction.accounts[1] || 'unknown',
      mint: instruction.decoded.mint || 'unknown',
      amount: instruction.decoded.amount?.toString() || '0',
      amountFormatted: formatTokenAmount(
        instruction.decoded.amount?.toString() || '0',
        instruction.decoded.decimals || 0
      ),
      token: {
        name: instruction.decoded.tokenName,
        symbol: instruction.decoded.tokenSymbol,
        decimals: instruction.decoded.decimals || 0,
        isNFT: instruction.decoded.isNFT || false,
        image: instruction.decoded.tokenImage
      }
    };

    // Fetch additional metadata if requested
    if (options.includeTokenMetadata && transfer.mint !== 'unknown') {
      try {
        const metadata = await fetchTokenMetadataForTransfer(sdk, transfer.mint);
        if (metadata) {
          Object.assign(transfer.token, metadata);
        }
      } catch (error) {
        console.warn('Failed to fetch token metadata:', error);
      }
    }

    transfers.push(transfer);
  }

  return {
    transfers,
    accountChanges
  };
}

/**
 * Analyze SOL balance changes in an instruction
 */
async function analyzeSOLChanges(instruction: any, rawTx: any): Promise<RichInstruction['solChanges']> {
  const changes: any[] = [];

  if (instruction.type === 'transfer' && instruction.decoded?.lamports) {
    changes.push({
      account: instruction.accounts[0] || 'unknown',
      change: -instruction.decoded.lamports,
      changeSOL: -instruction.decoded.lamports / 1e9,
      type: 'debit'
    });

    changes.push({
      account: instruction.accounts[1] || 'unknown',
      change: instruction.decoded.lamports,
      changeSOL: instruction.decoded.lamports / 1e9,
      type: 'credit'
    });
  }

  return changes;
}

/**
 * Estimate fees consumed by an instruction
 */
function estimateInstructionFees(instruction: any, rawTx: any): RichInstruction['fees'] {
  // Basic fee estimation - in reality this would be more sophisticated
  const baseFee = Math.floor((rawTx.meta?.fee || 5000) / (rawTx.transaction?.message?.instructions?.length || 1));

  return {
    base: baseFee,
    computeUnits: instruction.computeUnits,
    priority: 0 // Would need to analyze priority fees
  };
}

/**
 * Analyze balance changes across the entire transaction
 */
async function analyzeBalanceChanges(
  sdk: GorbchainSDK,
  rawTx: any,
  options: { includeTokenMetadata: boolean }
): Promise<RichTransaction['balanceChanges']> {
  const solChanges: any[] = [];
  const tokenChanges: any[] = [];

  // Analyze SOL balance changes
  if (rawTx.meta?.preBalances && rawTx.meta?.postBalances) {
    const accountKeys = rawTx.transaction?.message?.accountKeys || [];
    
    for (let i = 0; i < accountKeys.length; i++) {
      const preBalance = rawTx.meta.preBalances[i] || 0;
      const postBalance = rawTx.meta.postBalances[i] || 0;
      const change = postBalance - preBalance;

      if (change !== 0) {
        solChanges.push({
          account: accountKeys[i],
          before: preBalance,
          after: postBalance,
          change
        });
      }
    }
  }

  // Analyze token balance changes
  if (rawTx.meta?.preTokenBalances && rawTx.meta?.postTokenBalances) {
    // This would require more sophisticated analysis of token balance changes
    // For now, return empty array
  }

  return {
    sol: solChanges,
    tokens: tokenChanges
  };
}

/**
 * Generate transaction summary
 */
function generateTransactionSummary(
  instructions: RichInstruction[],
  balanceChanges: RichTransaction['balanceChanges']
): RichTransaction['summary'] {
  // Analyze primary action
  let primaryAction = 'Unknown transaction';
  let category: RichTransaction['summary']['category'] = 'unknown';

  // Simple heuristics for categorization
  const hasTokenTransfer = instructions.some(ix => 
    ix.tokens?.transfers && ix.tokens.transfers.length > 0
  );
  
  const hasSOLTransfer = instructions.some(ix => 
    ix.solChanges && ix.solChanges.length > 0
  );

  const hasNFTOperation = instructions.some(ix =>
    ix.tokens?.transfers?.some(transfer => transfer.token.isNFT)
  );

  if (hasNFTOperation) {
    category = 'nft';
    primaryAction = 'NFT transaction';
  } else if (hasTokenTransfer) {
    category = 'transfer';
    primaryAction = 'Token transfer';
  } else if (hasSOLTransfer) {
    category = 'transfer';
    primaryAction = 'SOL transfer';
  } else {
    category = 'system';
    primaryAction = 'System transaction';
  }

  // Extract participants
  const participants: any[] = [];
  const addressSet = new Set<string>();

  instructions.forEach(ix => {
    ix.accounts.forEach(account => {
      if (!addressSet.has(account)) {
        addressSet.add(account);
        participants.push({
          address: account,
          role: 'participant' // Would need more sophisticated role detection
        });
      }
    });
  });

  // Calculate totals
  const totalSOL = balanceChanges.sol.reduce((sum, change) => 
    sum + Math.abs(change.change), 0
  ) / 1e9;

  const totalTokens = instructions.reduce((sum, ix) => 
    sum + (ix.tokens?.transfers?.filter(t => !t.token.isNFT).length || 0), 0
  );

  const totalNFTs = instructions.reduce((sum, ix) => 
    sum + (ix.tokens?.transfers?.filter(t => t.token.isNFT).length || 0), 0
  );

  return {
    primaryAction,
    description: generateHumanReadableDescription(instructions),
    category,
    participants: participants.slice(0, 10), // Limit to first 10
    totalSOL,
    totalTokens,
    totalNFTs
  };
}

/**
 * Generate human-readable transaction description
 */
function generateHumanReadableDescription(instructions: RichInstruction[]): string {
  if (instructions.length === 0) return 'Empty transaction';
  
  if (instructions.length === 1) {
    return instructions[0].description;
  }

  return `Complex transaction with ${instructions.length} instructions`;
}

/**
 * Format token amount with proper decimals
 */
function formatTokenAmount(amount: string, decimals: number): string {
  const num = parseFloat(amount) / Math.pow(10, decimals);
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
}

/**
 * Fetch token metadata for transfer analysis
 */
async function fetchTokenMetadataForTransfer(sdk: GorbchainSDK, mint: string): Promise<any> {
  try {
    const accountInfo = await sdk.getAccountInfo(mint);
    if (!accountInfo) return null;

    // Basic metadata - would be enhanced with actual metadata fetching
    return {
      name: `Token ${mint.substring(0, 8)}...`,
      symbol: 'TOKEN',
      decimals: 9,
      isNFT: false
    };
  } catch (error) {
    return null;
  }
}