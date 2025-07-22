/**
 * Account data decoding utilities for the GorbchainSDK
 *
 * This module contains functions for decoding various types of account data
 * from the blockchain, including token accounts, mint accounts, and metadata.
 */

import { bytesToBase58, normalizeDataToUint8Array } from "./dataProcessing.js";

/**
 * Decode token account data
 */
export async function decodeTokenAccount(data: any): Promise<any> {
  try {
    const bytes = normalizeDataToUint8Array(data);

    // Token account structure (165 bytes for standard accounts)
    if (bytes.length >= 165) {
      const view = new DataView(bytes.buffer, bytes.byteOffset);

      // Read mint address (32 bytes at offset 0)
      const mintBytes = bytes.slice(0, 32);
      const mint = bytesToBase58(mintBytes);

      // Read owner address (32 bytes at offset 32)
      const ownerBytes = bytes.slice(32, 64);
      const owner = bytesToBase58(ownerBytes);

      // Read amount (8 bytes at offset 64, little endian)
      const amount = view.getBigUint64(64, true);

      // Read delegate option (1 + 32 bytes at offset 72)
      const hasDelegateOption = view.getUint8(72) === 1;
      let delegate = null;
      if (hasDelegateOption) {
        const delegateBytes = bytes.slice(73, 105);
        delegate = bytesToBase58(delegateBytes);
      }

      // Read state (1 byte at offset 105)
      const state = view.getUint8(105);
      const isInitialized = state === 1;
      const isFrozen = state === 2;

      // Read delegated amount (8 bytes at offset 106)
      const delegatedAmount = view.getBigUint64(106, true);

      // Read close authority option (1 + 32 bytes at offset 114)
      const hasCloseAuthority = view.getUint8(114) === 1;
      let closeAuthority = null;
      if (hasCloseAuthority) {
        const closeAuthorityBytes = bytes.slice(115, 147);
        closeAuthority = bytesToBase58(closeAuthorityBytes);
      }

      return {
        type: "token-account",
        data: {
          mint,
          owner,
          amount: amount.toString(),
          delegate,
          state: isInitialized
            ? "initialized"
            : isFrozen
              ? "frozen"
              : "uninitialized",
          delegatedAmount: delegatedAmount.toString(),
          closeAuthority,
          isNative: amount === BigInt(0), // Simplified check
        },
        dataLength: bytes.length,
      };
    }

    return {
      type: "token-account",
      error: "Invalid token account data length",
      dataLength: bytes.length,
    };
  } catch (_error) {
    return {
      type: "token-account",
      error: `Failed to decode: ${_error}`,
    };
  }
}

/**
 * Decode mint account data
 */
export async function decodeMintAccount(data: any): Promise<any> {
  try {
    const bytes = normalizeDataToUint8Array(data);

    // Mint account structure (82 bytes)
    if (bytes.length >= 82) {
      const view = new DataView(bytes.buffer, bytes.byteOffset);

      // Read mint authority option (1 + 32 bytes at offset 0)
      const hasMintAuthority = view.getUint8(0) === 1;
      let mintAuthority = null;
      if (hasMintAuthority) {
        const mintAuthorityBytes = bytes.slice(1, 33);
        mintAuthority = bytesToBase58(mintAuthorityBytes);
      }

      // Read supply (8 bytes at offset 33)
      const supply = view.getBigUint64(33, true);

      // Read decimals (1 byte at offset 41)
      const decimals = view.getUint8(41);

      // Read is_initialized (1 byte at offset 42)
      const isInitialized = view.getUint8(42) === 1;

      // Read freeze authority option (1 + 32 bytes at offset 43)
      const hasFreezeAuthority = view.getUint8(43) === 1;
      let freezeAuthority = null;
      if (hasFreezeAuthority) {
        const freezeAuthorityBytes = bytes.slice(44, 76);
        freezeAuthority = bytesToBase58(freezeAuthorityBytes);
      }

      return {
        type: "mint-account",
        data: {
          mintAuthority,
          supply: supply.toString(),
          decimals,
          isInitialized,
          freezeAuthority,
        },
        dataLength: bytes.length,
      };
    }

    return {
      type: "mint-account",
      error: "Invalid mint account data length",
      dataLength: bytes.length,
    };
  } catch (_error) {
    return {
      type: "mint-account",
      error: `Failed to decode: ${_error}`,
    };
  }
}

/**
 * Decode account data based on account type
 */
export async function decodeAccountData(
  account: string,
  accountInfo: any,
  isMint: boolean,
): Promise<any> {
  if (!accountInfo?.data) {
    return {
      type: "unknown-account",
      error: "No account data available",
      address: account,
    };
  }

  try {
    if (isMint) {
      return await decodeMintAccount(accountInfo.data);
    } else {
      return await decodeTokenAccount(accountInfo.data);
    }
  } catch (error) {
    return {
      type: "account-decode-error",
      error: `Failed to decode account: ${error}`,
      address: account,
    };
  }
}
