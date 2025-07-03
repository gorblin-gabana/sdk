// Fetch a transaction by signature using the provided connection (rpc client)
export async function fetchTransactionBySignature(connection: any, signature: string): Promise<any> {
  // This assumes the connection has a getTransaction method compatible with Solana RPC
  return await connection.getTransaction(signature, { maxSupportedTransactionVersion: 0 });
}
