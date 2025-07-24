/**
 * Simple Token Balance Operations - Direct RPC approach
 * 
 * This module provides a simplified approach to getting token balances
 * using the direct getTokenAccountsByOwner RPC method with jsonParsed encoding.
 */

import type { RpcClient } from "../rpc/client.js";

/**
 * Simple token account information from getTokenAccountsByOwner
 */
export interface SimpleTokenAccount {
  /** Token account address */
  address: string;
  /** Token mint address */
  mint: string;
  /** Owner wallet address */
  owner: string;
  /** Raw token amount */
  amount: string;
  /** Token decimals */
  decimals: number;
  /** UI amount (formatted with decimals) */
  uiAmount: number;
  /** UI amount as string */
  uiAmountString: string;
  /** Account state */
  state: string;
  /** Whether account is frozen */
  frozen: boolean;
  /** Token extensions (if any) */
  extensions?: Array<{ extension: string }>;
  /** Program that owns this token */
  program: string;
}

/**
 * Token balance response with summary
 */
export interface TokenBalanceResponse {
  /** Array of token accounts */
  accounts: SimpleTokenAccount[];
  /** Summary information */
  summary: {
    /** Total number of token accounts */
    totalAccounts: number;
    /** Total number of unique tokens */
    uniqueTokens: number;
    /** Accounts with non-zero balance */
    nonZeroAccounts: number;
  };
  /** Metadata about the operation */
  meta: {
    /** Program ID used for the query */
    programId: string;
    /** Duration in milliseconds */
    duration: number;
    /** Timestamp of the operation */
    timestamp: number;
  };
}

/**
 * Get token balances using direct getTokenAccountsByOwner RPC call
 * 
 * This is the simplest and most reliable way to get token balances.
 * It uses the native Solana RPC method with jsonParsed encoding.
 * 
 * @param rpcClient - RPC client instance
 * @param ownerAddress - Wallet address to get token accounts for
 * @param programId - Token program ID (SPL Token or Token-2022)
 * @returns Promise resolving to token balance response
 * 
 * @example
 * ```typescript
 * import { getSimpleTokenBalances } from '@gorbchain-xyz/chaindecode';
 * 
 * // Get Token-2022 balances
 * const token2022Balances = await getSimpleTokenBalances(
 *   rpcClient,
 *   '9x5kYbJgJ6WoHQayADmTYGh94SbLdbnecKP8bRr7x9uM',
 *   'G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD2CVKSTut7oZ6'
 * );
 * 
 * // Get SPL Token balances
 * const splBalances = await getSimpleTokenBalances(
 *   rpcClient,
 *   '9x5kYbJgJ6WoHQayADmTYGh94SbLdbnecKP8bRr7x9uM',
 *   'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
 * );
 * 
 * console.log(`Found ${token2022Balances.accounts.length} Token-2022 accounts`);
 * console.log(`Found ${splBalances.accounts.length} SPL Token accounts`);
 * 
 * // Access individual token data
 * token2022Balances.accounts.forEach(token => {
 *   console.log(`Token: ${token.mint}`);
 *   console.log(`Balance: ${token.uiAmountString} (${token.decimals} decimals)`);
 *   console.log(`Account: ${token.address}`);
 * });
 * ```
 */
export async function getSimpleTokenBalances(
  rpcClient: RpcClient,
  ownerAddress: string,
  programId: string,
): Promise<TokenBalanceResponse> {
  const startTime = Date.now();

  try {
    // Make direct RPC call with jsonParsed encoding
    const response = await rpcClient.request<{
      value: Array<{
        pubkey: string;
        account: {
          data: {
            parsed: {
              info: {
                mint: string;
                owner: string;
                tokenAmount: {
                  amount: string;
                  decimals: number;
                  uiAmount: number;
                  uiAmountString: string;
                };
                state: string;
                extensions?: Array<{ extension: string }>;
              };
            };
            program: string;
          };
        };
      }>;
    }>("getTokenAccountsByOwner", [
      ownerAddress,
      { programId },
      { encoding: "jsonParsed" },
    ]);

    // Transform the response to our simple format
    const accounts: SimpleTokenAccount[] = response.value.map((account: any) => {
      const parsedInfo = account.account.data.parsed.info;
      const tokenAmount = parsedInfo.tokenAmount;

      return {
        address: account.pubkey,
        mint: parsedInfo.mint,
        owner: parsedInfo.owner,
        amount: tokenAmount.amount,
        decimals: tokenAmount.decimals,
        uiAmount: tokenAmount.uiAmount,
        uiAmountString: tokenAmount.uiAmountString,
        state: parsedInfo.state,
        frozen: parsedInfo.state === "frozen",
        extensions: parsedInfo.extensions || [],
        program: account.account.data.program,
      };
    });

    // Calculate summary
    const uniqueTokens = new Set(accounts.map(acc => acc.mint)).size;
    const nonZeroAccounts = accounts.filter(acc => parseFloat(acc.amount) > 0).length;

    const duration = Date.now() - startTime;

    return {
      accounts,
      summary: {
        totalAccounts: accounts.length,
        uniqueTokens,
        nonZeroAccounts,
      },
      meta: {
        programId,
        duration,
        timestamp: Date.now(),
      },
    };
  } catch (error) {
    throw new Error(
      `Failed to get token balances: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get all token balances (both SPL Token and Token-2022)
 * 
 * @param rpcClient - RPC client instance
 * @param ownerAddress - Wallet address to get token accounts for
 * @returns Promise resolving to combined token balance response
 * 
 * @example
 * ```typescript
 * const allBalances = await getAllTokenBalances(rpcClient, walletAddress);
 * 
 * console.log(`Total SPL tokens: ${allBalances.spl.accounts.length}`);
 * console.log(`Total Token-2022: ${allBalances.token2022.accounts.length}`);
 * ```
 */
export async function getAllTokenBalances(
  rpcClient: RpcClient,
  ownerAddress: string,
): Promise<{
  spl: TokenBalanceResponse;
  token2022: TokenBalanceResponse;
  combined: {
    totalAccounts: number;
    uniqueTokens: number;
    duration: number;
  };
}> {
  const startTime = Date.now();

  // Get both SPL Token and Token-2022 balances in parallel
  const [splBalances, token2022Balances] = await Promise.all([
    getSimpleTokenBalances(
      rpcClient,
      ownerAddress,
      "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" // SPL Token program
    ),
    getSimpleTokenBalances(
      rpcClient,
      ownerAddress,
      "G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6" // Token-2022 program (Gorbchain)
    ),
  ]);

  // Combine results
  const allAccounts = [...splBalances.accounts, ...token2022Balances.accounts];
  const uniqueTokens = new Set(allAccounts.map(acc => acc.mint)).size;

  return {
    spl: splBalances,
    token2022: token2022Balances,
    combined: {
      totalAccounts: allAccounts.length,
      uniqueTokens,
      duration: Date.now() - startTime,
    },
  };
}

/**
 * Get token balance for a specific mint
 * 
 * @param rpcClient - RPC client instance
 * @param ownerAddress - Wallet address
 * @param mintAddress - Token mint address to look for
 * @param programId - Token program ID (optional, will try both if not specified)
 * @returns Promise resolving to token account or null if not found
 * 
 * @example
 * ```typescript
 * const tokenBalance = await getTokenBalanceForMint(
 *   rpcClient,
 *   walletAddress,
 *   'CAp8xiciqCTdrVqu3nnANdzryWjYdMxE2VrvtgTzxeS7'
 * );
 * 
 * if (tokenBalance) {
 *   console.log(`Balance: ${tokenBalance.uiAmountString}`);
 * } else {
 *   console.log('Token not found');
 * }
 * ```
 */
export async function getTokenBalanceForMint(
  rpcClient: RpcClient,
  ownerAddress: string,
  mintAddress: string,
  programId?: string,
): Promise<SimpleTokenAccount | null> {
  if (programId) {
    // Search in specific program
    const balances = await getSimpleTokenBalances(rpcClient, ownerAddress, programId);
    return balances.accounts.find(acc => acc.mint === mintAddress) || null;
  }

  // Search in all programs
  const allBalances = await getAllTokenBalances(rpcClient, ownerAddress);
  const allAccounts = [...allBalances.spl.accounts, ...allBalances.token2022.accounts];
  return allAccounts.find(acc => acc.mint === mintAddress) || null;
}

/**
 * Check if a wallet has any tokens
 * 
 * @param rpcClient - RPC client instance  
 * @param ownerAddress - Wallet address to check
 * @returns Promise resolving to boolean
 */
export async function hasTokens(
  rpcClient: RpcClient,
  ownerAddress: string,
): Promise<boolean> {
  try {
    const allBalances = await getAllTokenBalances(rpcClient, ownerAddress);
    return allBalances.combined.totalAccounts > 0;
  } catch {
    return false;
  }
}

/**
 * Common token program IDs
 */
export const TOKEN_PROGRAMS = {
  /** Standard SPL Token program */
  SPL_TOKEN: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  /** Token-2022 program (Gorbchain specific) */
  TOKEN_2022: "G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6",
  /** Token-2022 program (Solana official) */
  TOKEN_2022_OFFICIAL: "G22oYgZ6LnVcy7v8eSNi2xpNk1NcZiPD8CVKSTut7oZ6",
} as const;