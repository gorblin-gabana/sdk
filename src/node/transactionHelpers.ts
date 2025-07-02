// Transaction helpers for SDK (browser/node)
// Now using @solana/kit for all Solana primitives (plain objects, not classes)

// Types are generic; update as you integrate deeper with @solana/kit

/**
 * @typedef {Object} Instruction - A plain Solana instruction object
 * @typedef {Object} Signer - An object with a signMessage(Uint8Array) method
 * @typedef {Object} Rpc - An object with sendTransaction/simulateTransaction methods
 */

// Create a transaction message (plain object)
export async function createTransaction(
  instructions: any[], // Replace 'any' with your instruction type
  payer: string, // base58 address
  recentBlockhash?: string
): Promise<any> {
  return {
    version: 'legacy',
    feePayer: payer,
    recentBlockhash,
    instructions,
  };
}

// Compile and serialize a transaction message (stub, update for @solana/kit)
export async function createRawTransaction(
  instructions: any[],
  payer: string,
  recentBlockhash?: string
): Promise<Uint8Array> {
  const message = await createTransaction(instructions, payer, recentBlockhash);
  // TODO: Use @solana/kit's compileTransactionMessage or similar
  // return compileTransactionMessage(message);
  return new Uint8Array(); // placeholder
}

// Sign a transaction message (stub, update for @solana/kit)
export async function signTransaction(
  message: any,
  signer: { signMessage: (msg: Uint8Array) => Promise<Uint8Array> }
): Promise<Uint8Array> {
  // TODO: Use @solana/kit's signing helpers
  // return signer.signMessage(compileTransactionMessage(message));
  return new Uint8Array(); // placeholder
}

// Send a transaction using Rpc and signers (stub, update for @solana/kit)
export async function sendTransaction(
  rpc: any,
  message: any,
  signers: any[]
): Promise<string> {
  // TODO: Use @solana/kit's sendAndConfirmTransactionFactory or similar
  return '';
}

// Simulate a transaction using Rpc (stub, update for @solana/kit)
export async function simulateTransaction(
  rpc: any,
  message: any
): Promise<any> {
  // TODO: Use @solana/kit's simulateTransaction
  return {};
}
