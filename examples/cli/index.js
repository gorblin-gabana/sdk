#!/usr/bin/env node
// Example CLI for ChainDecode SDK
const { DecoderRegistry } = require('../src/registry');
const { fetchAndDecodeTransaction } = require('../src/node');

const rpcUrl = process.env.RPC_URL || 'https://rpc.gorbchain.xyz';
const registry = new DecoderRegistry();

async function main() {
  const [,, sig] = process.argv;
  if (!sig) {
    console.log('Usage: chaindecode <transaction_signature>');
    process.exit(1);
  }
  try {
    const tx = await fetchAndDecodeTransaction(sig, rpcUrl, registry);
    console.dir(tx.decodedInstructions, { depth: 10 });
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

main();
