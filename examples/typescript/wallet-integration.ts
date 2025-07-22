/**
 * GorbchainSDK V1 - Universal Wallet Integration Example
 *
 * This example demonstrates comprehensive wallet integration across all Solana
 * providers with automatic portfolio analysis using GorbchainSDK V1.
 */

import {
  GorbchainSDK,
  UniversalWalletManager,
} from "@gorbchain-xyz/chaindecode";
import {
  EXAMPLE_SDK_CONFIG,
  GORBCHAIN_PROGRAMS,
} from "../shared/example-data.js";

async function walletIntegrationExample() {
  console.log("👛 GorbchainSDK V1 - Universal Wallet Integration Example\n");

  // Initialize SDK with Gorbchain custom program addresses
  const sdk = new GorbchainSDK(EXAMPLE_SDK_CONFIG);

  console.log("🔧 Using Gorbchain Custom Programs for Wallet Integration:");
  console.log(
    `  SPL Token: ${GORBCHAIN_PROGRAMS.SPL_TOKEN.substring(0, 8)}...`,
  );
  console.log(
    `  Associated Token: ${GORBCHAIN_PROGRAMS.ASSOCIATED_TOKEN.substring(0, 8)}...`,
  );
  console.log(
    `  Metadata: ${GORBCHAIN_PROGRAMS.METADATA.substring(0, 8)}...\n`,
  );

  console.log("🎯 Official Gorbchain Wallet: TrashPack");
  console.log("  • Injected via custom script for secure connection");
  console.log("  • Full support for all Gorbchain features");
  console.log("  • Prioritized in auto-connect\n");

  // Method 1: Using SDK instance method
  console.log("Method 1: Using SDK instance method");
  const walletManager = sdk.createWalletManager();

  // Method 2: Using standalone class
  console.log("Method 2: Using standalone class");
  const standaloneWalletManager = new UniversalWalletManager(sdk);

  console.log("✅ Wallet managers initialized\n");

  // Discover available wallets
  console.log("🔍 Discovering Available Wallets...");
  try {
    const discovery = await walletManager.discoverWallets({
      includeDeepLinks: true,
      includeMobile: true,
      includeHardware: true,
    });

    console.log("\n📱 Wallet Discovery Results:");
    console.log(`  Total Available: ${discovery.available.length}`);
    console.log(`  Recommended: ${discovery.recommended.length}`);
    console.log(
      `  Previously Connected: ${discovery.previouslyConnected.length}`,
    );

    console.log("\n📋 Available Wallets:");
    discovery.available.forEach((wallet, index) => {
      console.log(`  ${index + 1}. ${wallet.name}`);
      console.log(`     Type: ${wallet.type}`);
      console.log(`     Installed: ${wallet.installed ? "✅" : "❌"}`);
      if (wallet.downloadUrl && !wallet.installed) {
        console.log(`     Download: ${wallet.downloadUrl}`);
      }
      if (wallet.deepLink) {
        console.log(`     Deep Link: ${wallet.deepLink}`);
      }
    });

    // Show recommended wallets
    if (discovery.recommended.length > 0) {
      console.log("\n⭐ Recommended Wallets (Installed):");
      discovery.recommended.forEach((walletType) => {
        const wallet = discovery.available.find((w) => w.type === walletType);
        console.log(`  • ${wallet?.name || walletType}`);
      });
    }

    // Show previously connected wallets
    if (discovery.previouslyConnected.length > 0) {
      console.log("\n🔄 Previously Connected:");
      discovery.previouslyConnected.forEach((walletType) => {
        const wallet = discovery.available.find((w) => w.type === walletType);
        console.log(`  • ${wallet?.name || walletType}`);
      });
    }
  } catch (error) {
    console.log("❌ Wallet discovery failed (expected in Node.js environment)");
    console.log("💡 This example works best in a browser environment");
  }

  // Demonstrate auto-connect functionality
  console.log("\n🤖 Auto-Connect Demonstration:");
  try {
    const autoConnectedWallet = await walletManager.autoConnect({
      preferredWallets: ["phantom", "solflare", "backpack"],
      includePortfolio: true,
      onlyPrevious: false,
    });

    if (autoConnectedWallet) {
      console.log("✅ Auto-connected successfully!");
      displayWalletInfo(autoConnectedWallet);

      if (autoConnectedWallet.type === "trashpack") {
        console.log("\n🚀 Connected to TrashPack - Official Gorbchain Wallet!");
        console.log("  • Full Gorbchain network integration");
        console.log("  • Optimized for Gorbchain transactions");
        console.log("  • Enhanced security features");
      }
    } else {
      console.log("ℹ️  No wallets available for auto-connect");
    }
  } catch (error) {
    console.log("❌ Auto-connect failed (expected in Node.js environment)");
  }

  // Demonstrate manual connection
  console.log("\n🔗 Manual Connection Demonstration:");
  const supportedWallets = [
    "trashpack",
    "phantom",
    "solflare",
    "backpack",
    "glow",
  ];

  for (const walletType of supportedWallets) {
    try {
      console.log(`\nAttempting to connect to ${walletType}...`);

      const connectedWallet = await walletManager.connectWallet(walletType, {
        includePortfolio: true,
        rememberConnection: true,
      });

      console.log(`✅ Connected to ${connectedWallet.name}!`);
      displayWalletInfo(connectedWallet);

      // Demonstrate wallet operations
      console.log("\n🔧 Wallet Operations:");
      console.log("  Available operations:");
      console.log("  • Sign Transaction");
      console.log("  • Sign Message");
      console.log("  • Portfolio Analysis");
      console.log("  • Event Handling");

      // Demonstrate event handling
      walletManager.on("wallet:connected", (wallet) => {
        console.log(`📡 Event: Wallet connected - ${wallet.name}`);
      });

      walletManager.on("wallet:disconnected", (wallet) => {
        console.log(`📡 Event: Wallet disconnected - ${wallet.name}`);
      });

      walletManager.on("wallet:error", (error) => {
        console.log(`📡 Event: Wallet error - ${error.error}`);
      });

      // Clean disconnect
      await walletManager.disconnect();
      console.log("✅ Wallet disconnected cleanly");

      break; // Exit after first successful connection
    } catch (error) {
      console.log(
        `❌ Failed to connect to ${walletType} (expected in Node.js)`,
      );
    }
  }

  console.log("\n📚 Integration Patterns:");

  console.log("\n1. Browser Integration:");
  console.log("```html");
  console.log('<script type="module">');
  console.log('  import { GorbchainSDK } from "@gorbchain-xyz/chaindecode";');
  console.log("  ");
  console.log('  const sdk = new GorbchainSDK({ rpcEndpoint: "..." });');
  console.log("  const walletManager = sdk.createWalletManager();");
  console.log("  ");
  console.log("  // Discover and connect");
  console.log("  const wallets = await walletManager.discoverWallets();");
  console.log('  const wallet = await walletManager.connectWallet("phantom");');
  console.log("</script>");
  console.log("```");

  console.log("\n2. React Integration:");
  console.log("```typescript");
  console.log("const WalletConnector: React.FC = () => {");
  console.log(
    "  const [walletManager] = useState(() => sdk.createWalletManager());",
  );
  console.log(
    "  const [wallet, setWallet] = useState<RichWallet | null>(null);",
  );
  console.log("  ");
  console.log("  const connectWallet = async (type: WalletType) => {");
  console.log("    const connected = await walletManager.connectWallet(type);");
  console.log("    setWallet(connected);");
  console.log("  };");
  console.log("  ");
  console.log("  return (");
  console.log('    <button onClick={() => connectWallet("phantom")}>');
  console.log("      Connect Phantom");
  console.log("    </button>");
  console.log("  );");
  console.log("};");
  console.log("```");

  console.log("\n3. Vue Integration:");
  console.log("```typescript");
  console.log("export default {");
  console.log("  setup() {");
  console.log("    const walletManager = sdk.createWalletManager();");
  console.log("    const wallet = ref<RichWallet | null>(null);");
  console.log("    ");
  console.log("    const connectWallet = async (type: string) => {");
  console.log("      wallet.value = await walletManager.connectWallet(type);");
  console.log("    };");
  console.log("    ");
  console.log("    return { wallet, connectWallet };");
  console.log("  }");
  console.log("};");
  console.log("```");

  console.log("\n✨ Universal wallet integration complete!");
  console.log("\n🎯 Key Features Demonstrated:");
  console.log("  • Universal wallet discovery across all providers");
  console.log("  • Auto-connect with preferred wallet prioritization");
  console.log("  • Portfolio analysis for connected wallets");
  console.log("  • Event-driven architecture for wallet state changes");
  console.log("  • Framework-agnostic integration patterns");
  console.log("  • Hardware wallet support (Ledger)");
  console.log("  • Mobile wallet support via deep links");
}

function displayWalletInfo(wallet: any) {
  console.log(`\n📊 Wallet Information:`);
  console.log(`  Name: ${wallet.name}`);
  console.log(`  Type: ${wallet.type}`);
  console.log(
    `  Address: ${wallet.address.substring(0, 8)}...${wallet.address.substring(-8)}`,
  );
  console.log(`  Status: ${wallet.status}`);
  console.log(`  Network: ${wallet.network.current}`);

  console.log(`\n💰 Portfolio Summary:`);
  console.log(`  SOL Balance: ${wallet.portfolio.solBalanceFormatted}`);
  console.log(`  Total Tokens: ${wallet.portfolio.totalTokens}`);
  console.log(`  Total NFTs: ${wallet.portfolio.totalNFTs}`);
  console.log(`  Recent Transactions: ${wallet.portfolio.recentTransactions}`);

  if (wallet.portfolio.topTokens.length > 0) {
    console.log(`\n🏆 Top Token Holdings:`);
    wallet.portfolio.topTokens
      .slice(0, 3)
      .forEach((token: any, index: number) => {
        console.log(`    ${index + 1}. ${token.symbol}: ${token.balance}`);
      });
  }

  console.log(`\n🔧 Wallet Features:`);
  wallet.metadata.features.forEach((feature: string) => {
    console.log(`    • ${feature}`);
  });

  if (wallet.metadata.lastConnected) {
    const lastConnected = new Date(wallet.metadata.lastConnected);
    console.log(`  Last Connected: ${lastConnected.toLocaleString()}`);
  }
}

// Run the example if this file is executed directly
const isMainModule =
  process.argv[1] && process.argv[1].endsWith("wallet-integration.ts");
if (isMainModule) {
  walletIntegrationExample().catch(console.error);
}

export { walletIntegrationExample };
