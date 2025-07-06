/**
 * Transaction processing utilities for the GorbchainSDK
 *
 * This module contains helper functions for processing and analyzing
 * blockchain transactions and instructions.
 */

import type { DecodedInstruction } from '../decoders/registry.js';
import type { SimpleInstruction } from '../sdk/types.js';

export interface AccountChange {
  solTransfers?: any[];
  tokenTransfers?: any[];
  accountsCreated?: string[];
}

/**
 * Get human-readable description for instruction types
 */
export function getInstructionDescription(type: string, data: any): string {
  const descriptions: Record<string, string> = {
    'system-transfer': `Transfer ${data?.lamports || 'unknown amount'} lamports`,
    'system-create-account': `Create account with ${data?.lamports || 'unknown'} lamports and ${data?.space || 'unknown'} bytes`,
    'system-assign': 'Assign account to program',
    'system-allocate': `Allocate ${data?.space || 'unknown'} bytes`,
    'spl-token-transfer': `Transfer ${data?.amount || 'unknown amount'} tokens`,
    'spl-token-mint-to': `Mint ${data?.amount || 'unknown amount'} tokens`,
    'spl-token-burn': `Burn ${data?.amount || 'unknown amount'} tokens`,
    'spl-token-approve': `Approve ${data?.amount || 'unknown amount'} tokens`,
    'spl-token-revoke': 'Revoke token approval',
    'spl-token-close-account': 'Close token account',
    'spl-token-freeze-account': 'Freeze token account',
    'spl-token-thaw-account': 'Thaw token account',
    'spl-token-initialize-mint': `Initialize mint with ${data?.decimals || 'unknown'} decimals`,
    'spl-token-initialize-account': 'Initialize token account',
    'token2022-transfer': `Transfer ${data?.amount || 'unknown amount'} Token-2022 tokens`,
    'token2022-mint-to': `Mint ${data?.amount || 'unknown amount'} Token-2022 tokens`,
    'token2022-burn': `Burn ${data?.amount || 'unknown amount'} Token-2022 tokens`,
    'token2022-initialize-mint': `Initialize Token-2022 mint with ${data?.decimals || 'unknown'} decimals`,
    'ata-create': 'Create Associated Token Account',
    'nft-create': `Create NFT: ${data?.metadata?.name || 'Unknown NFT'}`,
    'nft-mint': `Mint NFT: ${data?.metadata?.name || 'Unknown NFT'}`,
    'nft-transfer': `Transfer NFT: ${data?.metadata?.name || 'Unknown NFT'}`
  };

  return descriptions[type] || `${type} instruction`;
}

/**
 * Check if instruction is token-related
 */
export function isTokenRelatedInstruction(type: string): boolean {
  return type.includes('token') || type.includes('mint') || type.includes('burn') ||
         type.includes('transfer') || type.includes('approve');
}

/**
 * Check if instruction is NFT-related
 */
export function isNftRelatedInstruction(type: string): boolean {
  return type.includes('nft') || type.includes('metadata') || type.includes('edition');
}

/**
 * Classify transaction type based on instructions
 */
export function classifyTransactionType(instructions: any[], accountKeys: string[]): { type: string; subtype: string } {
  const instructionTypes = instructions.map(inst => inst.type || 'unknown');

  // Check for NFT operations
  if (instructionTypes.some(type => isNftRelatedInstruction(type))) {
    if (instructionTypes.some(type => type.includes('create') || type.includes('mint'))) {
      return { type: 'NFT Transaction', subtype: 'NFT Creation' };
    }
    return { type: 'NFT Transaction', subtype: 'NFT Operation' };
  }

  // Check for token operations
  if (instructionTypes.some(type => isTokenRelatedInstruction(type))) {
    if (instructionTypes.some(type => type.includes('mint'))) {
      return { type: 'Token Transaction', subtype: 'Token Minting' };
    }
    if (instructionTypes.some(type => type.includes('transfer'))) {
      return { type: 'Token Transaction', subtype: 'Token Transfer' };
    }
    return { type: 'Token Transaction', subtype: 'Token Operation' };
  }

  // Check for system operations
  if (instructionTypes.some(type => type.includes('system'))) {
    if (instructionTypes.some(type => type.includes('transfer'))) {
      return { type: 'System Transaction', subtype: 'SOL Transfer' };
    }
    if (instructionTypes.some(type => type.includes('create'))) {
      return { type: 'System Transaction', subtype: 'Account Creation' };
    }
    return { type: 'System Transaction', subtype: 'System Operation' };
  }

  return { type: 'Unknown Transaction', subtype: 'Mixed Operations' };
}

/**
 * Build simple transaction summary
 */
export function buildSimpleTransactionSummary(simpleInstructions: any[]): { type: string; description: string } {
  if (simpleInstructions.length === 0) {
    return { type: 'Empty Transaction', description: 'No instructions found' };
  }

  const firstInstruction = simpleInstructions[0];
  const instructionCount = simpleInstructions.length;

  if (instructionCount === 1) {
    return {
      type: firstInstruction.action || 'Unknown Action',
      description: firstInstruction.description || getInstructionDescription(firstInstruction.action, firstInstruction.data)
    };
  }

  // Multiple instructions - provide a summary
  const actions = simpleInstructions.map(inst => inst.action).filter(Boolean);
  const uniqueActions = [...new Set(actions)];

  if (uniqueActions.length === 1) {
    return {
      type: `${uniqueActions[0]} (${instructionCount}x)`,
      description: `${instructionCount} ${uniqueActions[0]} operations`
    };
  }

  return {
    type: 'Complex Transaction',
    description: `${instructionCount} operations: ${uniqueActions.slice(0, 3).join(', ')}${uniqueActions.length > 3 ? '...' : ''}`
  };
}

/**
 * Extract account changes from raw transaction data
 */
export function extractAccountChanges(rawTransaction: Record<string, unknown>, simpleInstructions: SimpleInstruction[]): AccountChange | undefined {
  const changes: AccountChange = {};

  // Extract SOL transfers from system instructions
  const solTransfers = simpleInstructions
    .filter(inst => inst.action === 'Transfer SOL')
    .map(inst => ({
      amount: inst.data?.amount || '0',
      from: inst.data?.source || 'unknown',
      to: inst.data?.destination || 'unknown',
      lamports: inst.data?.lamports || 0
    }));

  if (solTransfers.length > 0) {
    changes.solTransfers = solTransfers;
  }

  // Extract token transfers
  const tokenTransfers = simpleInstructions
    .filter(inst => inst.action?.includes('Transfer') && inst.action?.includes('Token'))
    .map(inst => ({
      mint: inst.data?.mint || 'unknown',
      amount: inst.data?.amount || '0',
      from: inst.data?.source || 'unknown',
      to: inst.data?.destination || 'unknown',
      tokenName: inst.data?.tokenName,
      tokenSymbol: inst.data?.tokenSymbol,
      decimals: inst.data?.decimals
    }));

  if (tokenTransfers.length > 0) {
    changes.tokenTransfers = tokenTransfers;
  }

  // Extract created accounts
  const createdAccounts = simpleInstructions
    .filter(inst => inst.action?.includes('Create'))
    .map(inst => inst.data?.newAccount || inst.data?.account)
    .filter(Boolean) as string[];

  if (createdAccounts.length > 0) {
    changes.accountsCreated = createdAccounts;
  }

  return Object.keys(changes).length > 0 ? changes : undefined;
}

/**
 * Generate a transaction name based on instructions
 */
export function generateTransactionName(instructions: any[]): string {
  if (!instructions || instructions.length === 0) {
    return 'Empty Transaction';
  }

  const firstInstruction = instructions[0];

  if (firstInstruction.action) {
    return firstInstruction.action;
  }

  // Fallback to instruction type analysis
  const classification = classifyTransactionType(instructions, []);
  return classification.subtype || classification.type;
}
