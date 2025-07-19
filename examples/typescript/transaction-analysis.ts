/**
 * GorbchainSDK V1 - Rich Transaction Analysis Example
 * 
 * This example demonstrates how to analyze transactions with complete decoded
 * context, token metadata, and human-readable summaries using GorbchainSDK V1.
 */

import { GorbchainSDK, getRichTransaction } from '@gorbchain-xyz/chaindecode';
import { EXAMPLE_SDK_CONFIG, EXAMPLE_TRANSACTIONS, GORBCHAIN_PROGRAMS } from '../shared/example-data.js';

async function richTransactionAnalysisExample() {
  console.log('🔍 GorbchainSDK V1 - Rich Transaction Analysis Example\n');

  // Initialize SDK with Gorbchain custom program addresses
  const sdk = new GorbchainSDK(EXAMPLE_SDK_CONFIG);

  console.log('🔧 Using Gorbchain Custom Programs for Transaction Analysis:');
  console.log(`  SPL Token: ${GORBCHAIN_PROGRAMS.SPL_TOKEN.substring(0, 8)}...`);
  console.log(`  Metadata: ${GORBCHAIN_PROGRAMS.METADATA.substring(0, 8)}...\n`);

  // Example transaction signatures (replace with real signatures for testing)
  const exampleTransactions = [
    EXAMPLE_TRANSACTIONS.tokenTransfer,
    EXAMPLE_TRANSACTIONS.nftMint,
    EXAMPLE_TRANSACTIONS.defiSwap
  ];

  console.log('📜 Analyzing Transaction Examples...\n');

  for (const [index, txExample] of exampleTransactions.entries()) {
    console.log(`${index + 1}. ${txExample.type} Analysis:`);
    console.log(`   Description: ${txExample.description}`);
    console.log(`   Signature: ${txExample.signature.substring(0, 20)}...`);

    try {
      // Method 1: Using SDK instance method
      const richTx = await sdk.getRichTransaction(txExample.signature, {
        includeTokenMetadata: true,
        includeBalanceChanges: true,
        resolveAddressLabels: false, // Set to true if you have address labeling service
        commitment: 'finalized'
      });

      console.log('\n   📊 Transaction Summary:');
      console.log(`     Primary Action: ${richTx.summary.primaryAction}`);
      console.log(`     Description: ${richTx.summary.description}`);
      console.log(`     Category: ${richTx.summary.category}`);
      console.log(`     Success: ${richTx.success ? '✅' : '❌'}`);
      console.log(`     Fee: ${richTx.fee / 1e9} SOL`);

      if (richTx.blockTime) {
        const date = new Date(richTx.blockTime);
        console.log(`     Time: ${date.toLocaleString()}`);
      }

      console.log('\n   🔧 Instructions Analysis:');
      console.log(`     Total Instructions: ${richTx.instructions.length}`);

      richTx.instructions.forEach((instruction, i) => {
        console.log(`     ${i + 1}. ${instruction.description}`);
        console.log(`        Program: ${instruction.programName}`);
        console.log(`        Type: ${instruction.type}`);
        console.log(`        Success: ${instruction.result.success ? '✅' : '❌'}`);

        // Token transfer details
        if (instruction.tokens?.transfers && instruction.tokens.transfers.length > 0) {
          console.log('        Token Transfers:');
          instruction.tokens.transfers.forEach(transfer => {
            console.log(`          • ${transfer.amountFormatted} ${transfer.token.symbol || 'TOKEN'}`);
            console.log(`            From: ${transfer.from.substring(0, 8)}...`);
            console.log(`            To: ${transfer.to.substring(0, 8)}...`);
            if (transfer.token.isNFT) {
              console.log(`            Type: NFT 🎨`);
            }
          });
        }

        // SOL transfers
        if (instruction.solChanges && instruction.solChanges.length > 0) {
          console.log('        SOL Changes:');
          instruction.solChanges.forEach(change => {
            console.log(`          • ${change.type === 'credit' ? '+' : '-'}${Math.abs(change.changeSOL)} SOL`);
            console.log(`            Account: ${change.account.substring(0, 8)}...`);
          });
        }
      });

      console.log('\n   💰 Balance Changes:');
      if (richTx.balanceChanges.sol.length > 0) {
        console.log('     SOL Changes:');
        richTx.balanceChanges.sol.forEach(change => {
          const changeSOL = change.change / 1e9;
          console.log(`       ${change.account.substring(0, 8)}...: ${changeSOL > 0 ? '+' : ''}${changeSOL.toFixed(6)} SOL`);
        });
      }

      if (richTx.balanceChanges.tokens.length > 0) {
        console.log('     Token Changes:');
        richTx.balanceChanges.tokens.forEach(change => {
          console.log(`       ${change.account.substring(0, 8)}...: ${change.changeFormatted} ${change.token.symbol || 'TOKEN'}`);
        });
      }

      console.log('\n   📈 Participants:');
      richTx.summary.participants.slice(0, 3).forEach(participant => {
        console.log(`     ${participant.role}: ${participant.address.substring(0, 8)}...`);
        if (participant.label) {
          console.log(`       Label: ${participant.label}`);
        }
      });

      console.log('\n   ⚡ Performance Metrics:');
      console.log(`     Analysis Duration: ${richTx.meta.analysisDuration}ms`);
      console.log(`     Programs Involved: ${richTx.meta.programsInvolved.length}`);
      console.log(`     Metadata Resolved: ${richTx.meta.metadataResolved ? '✅' : '❌'}`);

    } catch (error) {
      console.log(`   ❌ Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log('   💡 This is expected with example signatures.');
    }

    console.log('\n' + '='.repeat(60) + '\n');
  }

  // Demonstrate standalone function usage
  console.log('📚 Alternative Usage - Standalone Function:');
  console.log('```typescript');
  console.log('import { getRichTransaction } from "@gorbchain-xyz/chaindecode";');
  console.log('');
  console.log('const richTx = await getRichTransaction(sdk, signature, {');
  console.log('  includeTokenMetadata: true,');
  console.log('  includeBalanceChanges: true');
  console.log('});');
  console.log('```');

  console.log('\n✨ Rich transaction analysis complete!');
  console.log('\n🎯 Key Features Demonstrated:');
  console.log('  • Complete instruction decoding with human descriptions');
  console.log('  • Token metadata resolution for transfers');
  console.log('  • Balance change analysis across all accounts');
  console.log('  • Transaction categorization and participant identification');
  console.log('  • Performance metrics and analysis timing');
  console.log('  • Multiple usage patterns (SDK method vs standalone function)');
}

// Utility function to create a simulated instruction for demo
export function createSimulatedInstruction() {
  return {
    programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    data: new Uint8Array([3, 64, 66, 15, 0, 0, 0, 0, 0]), // Transfer instruction
    accounts: [
      'sender_account_address_here',
      'recipient_account_address_here',
      'authority_account_address_here'
    ]
  };
}

// Run the example
if (require.main === module) {
  richTransactionAnalysisExample().catch(console.error);
}

export { richTransactionAnalysisExample };