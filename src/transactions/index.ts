// Transaction utilities for fetching, sending, and building transactions
import type { Address } from "@solana/addresses";
import { address } from "@solana/addresses";
import type { IInstruction } from "@solana/instructions";
import { createTransactionMessage } from "@solana/transaction-messages";
import { setTransactionMessageFeePayer } from "@solana/transaction-messages";
import { setTransactionMessageLifetimeUsingBlockhash } from "@solana/transaction-messages";
import { appendTransactionMessageInstruction } from "@solana/transaction-messages";
import type { Transaction } from "@solana/transactions";
import { compileTransaction, signTransaction } from "@solana/transactions";
import type { RpcClient } from "../rpc/client.js";
import { pipe } from "@solana/functional";

/**
 * Create and sign a transaction from instructions and feePayer.
 * Automatically fetches recentBlockhash and lastValidBlockHeight.
 */
export async function createTransaction({
  connection,
  instructions,
  feePayer,
  signers,
}: {
  connection: RpcClient;
  instructions: IInstruction[];
  feePayer: string | Address;
  signers: CryptoKeyPair[];
}): Promise<Transaction> {
  const result = await connection.request("getLatestBlockhash", []);
  const { blockhash, lastValidBlockHeight } = result as { 
    blockhash: string; 
    lastValidBlockHeight: number; 
  };
  const msg = pipe(
    createTransactionMessage({ version: 0 }),
    (m) =>
      setTransactionMessageFeePayer(
        typeof feePayer === "string" ? address(feePayer) : feePayer,
        m,
      ),
    (m) =>
      setTransactionMessageLifetimeUsingBlockhash(
        {
          blockhash: blockhash as any, // Cast to any to satisfy branded type
          lastValidBlockHeight: BigInt(lastValidBlockHeight),
        },
        m,
      ),
    (m) => {
      let out = m as any;
      for (const ix of instructions) {
        out = appendTransactionMessageInstruction(ix, out);
      }
      return out as typeof m;
    },
  );
  const compiled = compileTransaction(msg);
  const signed = await signTransaction(signers, compiled);
  return signed;
}

/**
 * Return transaction metadata and raw instructions for UI or API
 */
export function getTransactionMetadata(tx: Transaction): {
  signatures: any;
  messageBytes: any;
} {
  return {
    signatures: tx.signatures,
    messageBytes: tx.messageBytes,
    // No direct feePayer/recentBlockhash/instructions on Transaction type in kit
  };
}

export * from "./getAndDecodeTransaction.js";
