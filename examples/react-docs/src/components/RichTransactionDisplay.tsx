
import React from 'react';
import { GorbchainSDK } from '@gorbchain-xyz/chaindecode';

interface RichTransactionDisplayProps {
  transaction: any;
  sdk: GorbchainSDK;
}

interface EnhancedInstruction {
  type: string;
  instruction: string;
  amount?: bigint;
  decimals?: number;
  programName: string;
  programId: string;
  accounts: string[];
  tokenDetails?: {
    name: string;
    symbol: string;
    decimals: number;
    supply: string;
    isNFT: boolean;
  };
  extensions?: string[];
}

const RichTransactionDisplay: React.FC<RichTransactionDisplayProps> = ({ transaction, sdk }) => {
  const [enhancedInstructions, setEnhancedInstructions] = React.useState<EnhancedInstruction[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (transaction) {
      analyzeTransaction();
    }
  }, [transaction]);

  const analyzeTransaction = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const instructions = transaction.transaction?.message?.instructions || [];
      const accountKeys = transaction.transaction?.message?.accountKeys || [];
      
      const enhanced: EnhancedInstruction[] = [];

      for (const instruction of instructions) {
        const programId = accountKeys[instruction.programIdIndex];
        const programName = getProgramName(programId);
        
        let enhancedInst: EnhancedInstruction = {
          type: 'unknown',
          instruction: 'Unknown instruction',
          programName,
          programId,
          accounts: instruction.accounts?.map((idx: number) => accountKeys[idx]) || []
        };

        // Decode based on program type
        if (programId === 'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn') {
          // Token-2022 program
          const decoded = await decodeToken2022Instruction(instruction.data);
          enhancedInst = {
            ...enhancedInst,
            type: decoded.type,
            instruction: decoded.instruction,
            amount: decoded.amount,
            decimals: decoded.decimals || 0,
            extensions: decoded.extensions
          };
          
          // Try to fetch token details
          if (instruction.accounts?.length > 0) {
            const mintAddress = accountKeys[instruction.accounts[0]];
            if (mintAddress) {
              try {
                const tokenInfo = await sdk.getRpcClient().getTokenInfo(mintAddress);
                if (tokenInfo) {
                  enhancedInst.tokenDetails = {
                    name: tokenInfo.metadata?.name || 'Unknown Token',
                    symbol: tokenInfo.metadata?.symbol || 'UNK',
                    decimals: tokenInfo.decimals,
                    supply: tokenInfo.supply,
                    isNFT: tokenInfo.isNFT
                  };
                }
              } catch (err) {
                console.error('Failed to fetch token info:', err);
              }
            }
          }
        } else if (programId === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
          // SPL Token program
          const decoded = await decodeSPLTokenInstruction(instruction.data);
          enhancedInst = {
            ...enhancedInst,
            type: decoded.type,
            instruction: decoded.instruction,
            amount: decoded.amount,
            decimals: decoded.decimals || 0
          };
        } else if (programId === '11111111111111111111111111111111') {
          // System program
          const decoded = await decodeSystemInstruction(instruction.data);
          enhancedInst = {
            ...enhancedInst,
            type: decoded.type,
            instruction: decoded.instruction,
            amount: decoded.amount
          };
        }
        
        enhanced.push(enhancedInst);
      }

      setEnhancedInstructions(enhanced);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze transaction');
    } finally {
      setLoading(false);
    }
  };

  const decodeToken2022Instruction = async (data: number[]): Promise<{
    type: string;
    instruction: string;
    amount?: bigint;
    decimals?: number;
    extensions?: string[];
  }> => {
    const instructionType = data[0];
    
    switch (instructionType) {
      case 1: // InitializeAccount
        return {
          type: 'token2022-initialize-account',
          instruction: 'Initialize token account',
          extensions: ['Token-2022']
        };
      case 22: // InitializeImmutableOwner
        return {
          type: 'token2022-initialize-immutable-owner',
          instruction: 'Initialize immutable owner',
          extensions: ['ImmutableOwner']
        };
      default:
        return {
          type: 'token2022-unknown',
          instruction: `Token-2022 instruction (type: ${instructionType})`,
          extensions: ['Token-2022']
        };
    }
  };

  const decodeSPLTokenInstruction = async (data: number[]): Promise<{
    type: string;
    instruction: string;
    amount?: bigint;
    decimals?: number;
  }> => {
    const instructionType = data[0];
    
    switch (instructionType) {
      case 3: // Transfer
        if (data.length >= 9) {
          const amount = new DataView(new Uint8Array(data).buffer, 1, 8).getBigUint64(0, true);
          return {
            type: 'spl-token-transfer',
            instruction: 'Transfer tokens',
            amount
          };
        }
        break;
      case 7: // MintTo
        if (data.length >= 9) {
          const amount = new DataView(new Uint8Array(data).buffer, 1, 8).getBigUint64(0, true);
          return {
            type: 'spl-token-mint',
            instruction: 'Mint tokens',
            amount
          };
        }
        break;
      default:
        return {
          type: 'spl-token-unknown',
          instruction: `SPL Token instruction (type: ${instructionType})`
        };
    }
    
    return {
      type: 'spl-token-unknown',
      instruction: 'Unknown SPL Token instruction'
    };
  };

  const decodeSystemInstruction = async (data: number[]): Promise<{
    type: string;
    instruction: string;
    amount?: bigint;
  }> => {
    const instructionType = data[0];
    
    switch (instructionType) {
      case 0: // CreateAccount
        if (data.length >= 49) {
          const lamportsArray = data.slice(1, 9);
          const amount = new DataView(new Uint8Array(lamportsArray).buffer).getBigUint64(0, true);
          return {
            type: 'system-create-account',
            instruction: 'Create account with lamports',
            amount
          };
        }
        break;
      case 2: // Transfer
        if (data.length >= 9) {
          const amount = new DataView(new Uint8Array(data).buffer, 1, 8).getBigUint64(0, true);
          return {
            type: 'system-transfer',
            instruction: 'Transfer SOL',
            amount
          };
        }
        break;
      default:
        return {
          type: 'system-unknown',
          instruction: `System instruction (type: ${instructionType})`
        };
    }
    
    return {
      type: 'system-unknown',
      instruction: 'Unknown system instruction'
    };
  };

  const getProgramName = (programId: string): string => {
    switch (programId) {
      case 'FGyzDo6bhE7gFmSYymmFnJ3SZZu3xWGBA7sNHXR7QQsn':
        return 'Token-2022';
      case 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA':
        return 'SPL Token';
      case 'BvoSmPBF6mBRxBMY9FPguw1zUoUg3xrc5CaWf7y5ACkc':
        return 'Metaplex NFT';
      case '11111111111111111111111111111111':
        return 'System';
      case '4YpYoLVTQ8bxcne9GneN85RUXeN7pqGTwgPcY71ZL5gX':
        return 'Associated Token';
      default:
        return 'Unknown';
    }
  };

  const formatAmount = (amount: bigint | undefined, decimals: number = 0): string => {
    if (!amount) return '0';
    
    const divisor = BigInt(10 ** decimals);
    const whole = amount / divisor;
    const remainder = amount % divisor;
    
    if (remainder === BigInt(0)) {
      return whole.toString();
    }
    
    const remainderStr = remainder.toString().padStart(decimals, '0').replace(/0+$/, '');
    return `${whole.toString()}.${remainderStr}`;
  };

  const getInstructionColor = (type: string): string => {
    if (type.includes('transfer')) return 'text-blue-600';
    if (type.includes('mint')) return 'text-green-600';
    if (type.includes('create')) return 'text-purple-600';
    if (type.includes('token2022')) return 'text-indigo-600';
    return 'text-gray-800';
  };

  const getBadgeColor = (programName: string): string => {
    switch (programName) {
      case 'Token-2022': return 'bg-purple-100 text-purple-800';
      case 'SPL Token': return 'bg-green-100 text-green-800';
      case 'Metaplex NFT': return 'bg-pink-100 text-pink-800';
      case 'System': return 'bg-gray-100 text-gray-800';
      case 'Associated Token': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">Analyzing transaction...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 font-medium">Analysis Error</p>
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Transaction Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Transaction Summary</h3>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            {transaction.meta?.err ? 'Failed' : 'Success'}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Signature</p>
            <p className="font-mono text-sm">{transaction.transaction?.signatures?.[0]?.slice(0, 8)}...</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Block Time</p>
            <p className="text-sm">{new Date(transaction.blockTime * 1000).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Fee</p>
            <p className="text-sm">{formatAmount(BigInt(Number(transaction.meta?.fee || 0)), 9)} SOL</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Slot</p>
            <p className="text-sm">{transaction.slot?.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Enhanced Instructions */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Instructions ({enhancedInstructions.length})
        </h3>
        
        <div className="space-y-4">
          {enhancedInstructions.map((inst, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className={`font-medium ${getInstructionColor(inst.type)}`}>
                      {inst.instruction}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getBadgeColor(inst.programName)}`}>
                        {inst.programName}
                      </span>
                      <span className="text-xs text-gray-500">{inst.type}</span>
                    </div>
                  </div>
                </div>
                
                <button className="text-sm text-purple-600 hover:text-purple-800 font-medium">
                  View Details
                </button>
              </div>
              
              {inst.amount && inst.amount > 0n ? (
                <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800">Amount</span>
                    <span className="text-sm font-mono text-blue-900">
                      {formatAmount(inst.amount, inst.decimals || 0)}
                      {inst.tokenDetails ? ` ${inst.tokenDetails.symbol}` : ''}
                    </span>
                  </div>
                </div>
              ) : null}
              
              {/* Token Details */}
              {inst.tokenDetails && (
                <div className="mb-3 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-800">Token Information</span>
                    {inst.tokenDetails.isNFT && (
                      <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded text-xs font-medium">
                        NFT
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-green-600">Name:</span>
                      <span className="ml-1 text-green-900">{inst.tokenDetails.name}</span>
                    </div>
                    <div>
                      <span className="text-green-600">Symbol:</span>
                      <span className="ml-1 text-green-900">{inst.tokenDetails.symbol}</span>
                    </div>
                    <div>
                      <span className="text-green-600">Supply:</span>
                      <span className="ml-1 text-green-900">{inst.tokenDetails.supply}</span>
                    </div>
                    <div>
                      <span className="text-green-600">Decimals:</span>
                      <span className="ml-1 text-green-900">{inst.tokenDetails.decimals}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Token-2022 Extensions */}
              {inst.extensions && inst.extensions.length > 0 && (
                <div className="mb-3 p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium text-purple-800">Token-2022 Extensions</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {inst.extensions.map((ext, idx) => (
                      <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                        {ext}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Accounts */}
              {inst.accounts.length > 0 && (
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Accounts:</span>
                  <div className="mt-1 space-y-1">
                    {inst.accounts.slice(0, 3).map((account, idx) => (
                      <div key={idx} className="font-mono">
                        #{idx}: {account}
                      </div>
                    ))}
                    {inst.accounts.length > 3 && (
                      <div className="text-gray-400">... and {inst.accounts.length - 3} more</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RichTransactionDisplay; 