/**
 * Wallet Integration Utilities - Universal wallet connection and management
 *
 * This module provides comprehensive wallet integration for:
 * - Solana web3 providers (Phantom, Solflare, etc.)
 * - Deep link wallet providers
 * - Custom injected scripts
 * - WalletConnect protocol
 * - Hardware wallets
 */

import type { GorbchainSDK } from "../sdk/GorbchainSDK.js";

/**
 * Supported wallet types
 */
export type WalletType =
  | "trashpack" // Official Gorbchain wallet
  | "phantom"
  | "solflare"
  | "backpack"
  | "glow"
  | "slope"
  | "sollet"
  | "walletconnect"
  | "ledger"
  | "custom"
  | "injected";

/**
 * Wallet connection status
 */
export type WalletStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error"
  | "locked";

/**
 * Wallet provider interface
 */
export interface WalletProvider {
  /** Whether the wallet is connected */
  isConnected: boolean;
  /** Public key of connected wallet */
  publicKey: string | null;
  /** Sign transaction */
  signTransaction: (transaction: any) => Promise<any>;
  /** Sign message */
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  /** Connect wallet */
  connect: () => Promise<void>;
  /** Disconnect wallet */
  disconnect: () => Promise<void>;
  /** Wallet-specific features */
  features?: string[];
}

/**
 * Rich wallet information with portfolio and metadata
 */
export interface RichWallet {
  /** Wallet address */
  address: string;
  /** Wallet type */
  type: WalletType;
  /** Wallet name */
  name: string;
  /** Connection status */
  status: WalletStatus;
  /** Wallet provider instance */
  provider?: WalletProvider;
  /** Portfolio summary */
  portfolio: {
    /** Total SOL balance */
    solBalance: number;
    /** Formatted SOL balance */
    solBalanceFormatted: string;
    /** Total USD value (if available) */
    totalValueUsd?: number;
    /** Number of tokens */
    totalTokens: number;
    /** Number of NFTs */
    totalNFTs: number;
    /** Number of recent transactions */
    recentTransactions: number;
    /** Top token holdings */
    topTokens: Array<{
      symbol: string;
      balance: string;
      valueUsd?: number;
    }>;
  };
  /** Wallet metadata */
  metadata: {
    /** Wallet icon URL */
    icon?: string;
    /** Wallet website */
    website?: string;
    /** Supported features */
    features: string[];
    /** Last connected timestamp */
    lastConnected?: number;
    /** Connection count */
    connectionCount: number;
  };
  /** Network information */
  network: {
    /** Current network */
    current: string;
    /** Supported networks */
    supported: string[];
    /** Custom RPC endpoints */
    customRPC?: string[];
  };
}

/**
 * Wallet discovery result
 */
export interface WalletDiscovery {
  /** Available wallets */
  available: Array<{
    type: WalletType;
    name: string;
    icon?: string;
    installed: boolean;
    deepLink?: string;
    downloadUrl?: string;
  }>;
  /** Recommended wallets */
  recommended: WalletType[];
  /** Previously connected wallets */
  previouslyConnected: WalletType[];
}

/**
 * Universal wallet manager for comprehensive wallet integration
 *
 * @example
 * ```typescript
 * const sdk = new GorbchainSDK({ rpcEndpoint: 'https://rpc.gorbchain.xyz' });
 * const walletManager = new UniversalWalletManager(sdk);
 *
 * // Discover available wallets
 * const discovery = await walletManager.discoverWallets();
 * console.log(`Found ${discovery.available.length} wallets`);
 *
 * // Connect to a specific wallet
 * const wallet = await walletManager.connectWallet('phantom');
 * console.log(`Connected to ${wallet.name}: ${wallet.address}`);
 * console.log(`Portfolio value: $${wallet.portfolio.totalValueUsd}`);
 *
 * // Auto-connect to best available wallet
 * const autoWallet = await walletManager.autoConnect({
 *   preferredWallets: ['phantom', 'solflare'],
 *   includePortfolio: true
 * });
 * ```
 */
export class UniversalWalletManager {
  private sdk: GorbchainSDK;
  private connectedWallet: RichWallet | null = null;
  private providers: Map<WalletType, WalletProvider> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(sdk: GorbchainSDK) {
    this.sdk = sdk;
    this.initializeProviders();
  }

  /**
   * Discover all available wallets on the device/browser
   *
   * @param options - Discovery options
   * @returns Promise resolving to wallet discovery results
   */
  async discoverWallets(
    options: {
      /** Whether to check for deep link support */
      includeDeepLinks?: boolean;
      /** Whether to check for mobile wallets */
      includeMobile?: boolean;
      /** Whether to check for hardware wallets */
      includeHardware?: boolean;
    } = {},
  ): Promise<WalletDiscovery> {
    const {
      includeDeepLinks = true,
      includeMobile = true,
      includeHardware = true,
    } = options;

    const available: WalletDiscovery["available"] = [];
    const recommended: WalletType[] = [];
    const previouslyConnected: WalletType[] = [];

    // Check for browser extension wallets
    const browserWallets: Array<{
      type: WalletType;
      name: string;
      key: string;
      icon?: string;
      downloadUrl?: string;
    }> = [
      {
        type: "trashpack",
        name: "TrashPack",
        key: "trashpack",
        icon: "https://trashpack.tech/icon.png",
        downloadUrl: "https://trashpack.tech/",
      },
      {
        type: "phantom",
        name: "Phantom",
        key: "phantom",
        icon: "https://phantom.app/img/logo.png",
        downloadUrl: "https://phantom.app/",
      },
      {
        type: "solflare",
        name: "Solflare",
        key: "solflare",
        icon: "https://solflare.com/assets/logo.svg",
        downloadUrl: "https://solflare.com/",
      },
      {
        type: "backpack",
        name: "Backpack",
        key: "backpack",
        downloadUrl: "https://backpack.app/",
      },
      {
        type: "glow",
        name: "Glow",
        key: "glow",
        downloadUrl: "https://glow.app/",
      },
      {
        type: "slope",
        name: "Slope",
        key: "slope",
        downloadUrl: "https://slope.finance/",
      },
      {
        type: "sollet",
        name: "Sollet",
        key: "sollet",
        downloadUrl: "https://www.sollet.io/",
      },
    ];

    for (const wallet of browserWallets) {
      const isInstalled = await this.checkWalletInstalled(wallet.type);

      available.push({
        type: wallet.type,
        name: wallet.name,
        icon: wallet.icon,
        installed: isInstalled,
        downloadUrl: wallet.downloadUrl,
      });

      if (isInstalled) {
        recommended.push(wallet.type);
      }

      // Check if previously connected
      if (this.wasWalletPreviouslyConnected(wallet.type)) {
        previouslyConnected.push(wallet.type);
      }
    }

    // Add WalletConnect for mobile support
    if (includeMobile) {
      available.push({
        type: "walletconnect",
        name: "WalletConnect",
        installed: true, // Always available
        deepLink: "wc:",
      });
    }

    // Add hardware wallet support
    if (includeHardware) {
      available.push({
        type: "ledger",
        name: "Ledger",
        installed: await this.checkLedgerSupport(),
      });
    }

    return {
      available,
      recommended,
      previouslyConnected,
    };
  }

  /**
   * Connect to a specific wallet and get rich wallet information
   *
   * @param walletType - Type of wallet to connect to
   * @param options - Connection options
   * @returns Promise resolving to rich wallet information
   */
  async connectWallet(
    walletType: WalletType,
    options: {
      /** Whether to include portfolio analysis */
      includePortfolio?: boolean;
      /** Whether to remember this connection */
      rememberConnection?: boolean;
      /** Custom connection parameters */
      connectionParams?: Record<string, any>;
    } = {},
  ): Promise<RichWallet> {
    const {
      includePortfolio = true,
      rememberConnection = true,
      connectionParams = {},
    } = options;

    try {
      // Get wallet provider
      const provider = await this.getWalletProvider(
        walletType,
        connectionParams,
      );

      if (!provider) {
        throw new Error(`Wallet provider not available: ${walletType}`);
      }

      // Connect to wallet
      await provider.connect();

      if (!provider.publicKey) {
        throw new Error("Failed to get wallet public key");
      }

      // Create rich wallet object
      const richWallet: RichWallet = {
        address: provider.publicKey,
        type: walletType,
        name: this.getWalletName(walletType),
        status: "connected",
        provider,
        portfolio: {
          solBalance: 0,
          solBalanceFormatted: "0 SOL",
          totalTokens: 0,
          totalNFTs: 0,
          recentTransactions: 0,
          topTokens: [],
        },
        metadata: {
          icon: this.getWalletIcon(walletType),
          website: this.getWalletWebsite(walletType),
          features: provider.features || [],
          lastConnected: Date.now(),
          connectionCount: this.getConnectionCount(walletType) + 1,
        },
        network: {
          current: "gorbchain",
          supported: ["gorbchain", "solana-mainnet", "solana-devnet"],
          customRPC: [this.sdk.config.rpcEndpoint],
        },
      };

      // Load portfolio if requested
      if (includePortfolio) {
        richWallet.portfolio = await this.loadWalletPortfolio(
          provider.publicKey,
        );
      }

      // Remember connection if requested
      if (rememberConnection) {
        this.rememberWalletConnection(walletType);
      }

      // Store connected wallet
      this.connectedWallet = richWallet;
      this.providers.set(walletType, provider);

      // Emit connection event
      this.emit("wallet:connected", richWallet);

      return richWallet;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Emit error event
      this.emit("wallet:error", { type: walletType, error: errorMessage });

      throw new Error(`Failed to connect to ${walletType}: ${errorMessage}`);
    }
  }

  /**
   * Auto-connect to the best available wallet
   *
   * @param options - Auto-connection options
   * @returns Promise resolving to connected wallet or null
   */
  async autoConnect(
    options: {
      /** Preferred wallet types in order */
      preferredWallets?: WalletType[];
      /** Whether to include portfolio */
      includePortfolio?: boolean;
      /** Whether to only try previously connected wallets */
      onlyPrevious?: boolean;
    } = {},
  ): Promise<RichWallet | null> {
    const {
      preferredWallets = ["trashpack", "phantom", "solflare", "backpack"],
      includePortfolio = true,
      onlyPrevious = false,
    } = options;

    try {
      const discovery = await this.discoverWallets();

      // Build priority list
      let priorityList: WalletType[] = [];

      if (onlyPrevious) {
        priorityList = discovery.previouslyConnected;
      } else {
        // Start with preferred wallets that are available
        priorityList = preferredWallets.filter((type) =>
          discovery.available.some((w) => w.type === type && w.installed),
        );

        // Add other recommended wallets
        const otherRecommended = discovery.recommended.filter(
          (type) => !preferredWallets.includes(type),
        );
        priorityList.push(...otherRecommended);
      }

      // Try to connect to wallets in priority order
      for (const walletType of priorityList) {
        try {
          const wallet = await this.connectWallet(walletType, {
            includePortfolio,
            rememberConnection: true,
          });

          return wallet;
        } catch (error) {
          console.warn(`Failed to auto-connect to ${walletType}:`, error);
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error("Auto-connect failed:", error);
      return null;
    }
  }

  /**
   * Disconnect from current wallet
   */
  async disconnect(): Promise<void> {
    if (!this.connectedWallet) {
      return;
    }

    try {
      if (this.connectedWallet.provider?.disconnect) {
        await this.connectedWallet.provider.disconnect();
      }

      const disconnectedWallet = this.connectedWallet;
      this.connectedWallet = null;

      // Emit disconnection event
      this.emit("wallet:disconnected", disconnectedWallet);
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  }

  /**
   * Get current connected wallet
   */
  getConnectedWallet(): RichWallet | null {
    return this.connectedWallet;
  }

  /**
   * Sign transaction with connected wallet
   */
  async signTransaction(transaction: any): Promise<any> {
    if (!this.connectedWallet?.provider) {
      throw new Error("No wallet connected");
    }

    return this.connectedWallet.provider.signTransaction(transaction);
  }

  /**
   * Sign message with connected wallet
   */
  async signMessage(message: string | Uint8Array): Promise<Uint8Array> {
    if (!this.connectedWallet?.provider) {
      throw new Error("No wallet connected");
    }

    const messageBytes =
      typeof message === "string" ? new TextEncoder().encode(message) : message;

    return this.connectedWallet.provider.signMessage(messageBytes);
  }

  /**
   * Add event listener
   */
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  /**
   * Remove event listener
   */
  off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Private methods

  private async initializeProviders(): Promise<void> {
    // Initialize wallet providers
    // This would be expanded to include actual wallet provider initialization
  }

  private async checkWalletInstalled(walletType: WalletType): Promise<boolean> {
    if (typeof window === "undefined") return false;

    // Optimized wallet detection with standardized checks
    const globalWindow = window as any;

    switch (walletType) {
      case "trashpack":
        return !!globalWindow.trashpack?.isTrashPack;
      case "phantom":
        return !!globalWindow.phantom?.solana?.isPhantom;
      case "solflare":
        return !!globalWindow.solflare?.isSolflare;
      case "backpack":
        return !!globalWindow.backpack?.isBackpack;
      case "glow":
        return !!globalWindow.glow?.isGlow;
      case "slope":
        return !!globalWindow.slope?.isSlope;
      case "sollet":
        return !!globalWindow.sollet;
      case "walletconnect":
        return true; // Always available as a protocol
      case "ledger":
        return await this.checkLedgerSupport();
      case "custom":
      case "injected":
        return false;
      default:
        return false;
    }
  }

  private async checkLedgerSupport(): Promise<boolean> {
    // Check for WebUSB/WebHID support
    return !!(navigator as any)?.usb || !!(navigator as any)?.hid;
  }

  // Cache for localStorage operations to avoid repeated parsing
  private connectionCache: Set<WalletType> | null = null;
  private readonly STORAGE_KEY = "gorbchain_wallet_connections";

  private wasWalletPreviouslyConnected(walletType: WalletType): boolean {
    const connections = this.getCachedConnections();
    return connections.has(walletType);
  }

  private rememberWalletConnection(walletType: WalletType): void {
    if (typeof localStorage === "undefined") return;

    const connections = this.getCachedConnections();
    if (!connections.has(walletType)) {
      connections.add(walletType);
      this.saveConnections(connections);
    }
  }

  private getCachedConnections(): Set<WalletType> {
    if (this.connectionCache === null) {
      this.connectionCache = this.loadConnectionsFromStorage();
    }
    return this.connectionCache;
  }

  private loadConnectionsFromStorage(): Set<WalletType> {
    if (typeof localStorage === "undefined") return new Set();

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return new Set();

      const parsed = JSON.parse(stored) as WalletType[];
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
      return new Set();
    }
  }

  private saveConnections(connections: Set<WalletType>): void {
    if (typeof localStorage === "undefined") return;

    try {
      const array = Array.from(connections);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(array));
      this.connectionCache = connections; // Update cache
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  private getPreviousConnections(): WalletType[] {
    return Array.from(this.getCachedConnections());
  }

  private getConnectionCount(walletType: WalletType): number {
    if (typeof localStorage === "undefined") return 0;

    const key = `gorbchain_wallet_count_${walletType}`;
    const count = localStorage.getItem(key);
    return count ? parseInt(count, 10) : 0;
  }

  private async getWalletProvider(
    walletType: WalletType,
    params: Record<string, any>,
  ): Promise<WalletProvider | null> {
    if (typeof window === "undefined") return null;

    try {
      // Get the actual wallet provider based on type
      let provider = null;
      const globalWindow = window as any;

      switch (walletType) {
        case "trashpack":
          provider = globalWindow.trashpack;
          break;
        case "phantom":
          provider = globalWindow.phantom?.solana;
          break;
        case "solflare":
          provider = globalWindow.solflare;
          break;
        case "backpack":
          provider = globalWindow.backpack;
          break;
        case "glow":
          provider = globalWindow.glow;
          break;
        case "slope":
          provider = globalWindow.slope;
          break;
        case "sollet":
          provider = globalWindow.sollet;
          break;
        default:
          return null;
      }

      if (!provider) return null;

      // Create standardized wallet provider interface
      return {
        isConnected: provider.isConnected || false,
        publicKey: provider.publicKey?.toString() || null,
        signTransaction: async (tx) => {
          if (!provider.signTransaction) {
            throw new Error(
              `${walletType} does not support transaction signing`,
            );
          }
          return await provider.signTransaction(tx);
        },
        signMessage: async (msg) => {
          if (!provider.signMessage) {
            throw new Error(`${walletType} does not support message signing`);
          }
          return await provider.signMessage(msg);
        },
        connect: async () => {
          if (!provider.connect) {
            throw new Error(`${walletType} does not support connection`);
          }
          const response = await provider.connect();
          return response;
        },
        disconnect: async () => {
          if (provider.disconnect) {
            await provider.disconnect();
          }
        },
        features: provider.features || this.getWalletFeatures(walletType),
      };
    } catch (error) {
      console.warn(`Failed to get wallet provider for ${walletType}:`, error);
      return null;
    }
  }

  private getWalletFeatures(walletType: WalletType): string[] {
    const features: Record<WalletType, string[]> = {
      trashpack: [
        "signTransaction",
        "signMessage",
        "signAllTransactions",
        "signAndSendTransaction",
        "connect",
        "disconnect",
      ],
      phantom: ["signTransaction", "signMessage", "connect", "disconnect"],
      solflare: ["signTransaction", "signMessage", "connect", "disconnect"],
      backpack: ["signTransaction", "signMessage", "connect", "disconnect"],
      glow: ["signTransaction", "signMessage", "connect", "disconnect"],
      slope: ["signTransaction", "signMessage", "connect", "disconnect"],
      sollet: ["signTransaction", "connect", "disconnect"],
      walletconnect: [
        "signTransaction",
        "signMessage",
        "connect",
        "disconnect",
      ],
      ledger: ["signTransaction", "connect", "disconnect"],
      custom: [],
      injected: [],
    };
    return features[walletType] || [];
  }

  private async loadWalletPortfolio(
    address: string,
  ): Promise<RichWallet["portfolio"]> {
    try {
      // Get SOL balance
      const accountInfo = await this.sdk.rpc.getAccountInfo(address);
      const solBalance = accountInfo?.lamports || 0;

      // Get token holdings
      const holdings = await this.sdk.getAllTokenHoldings(address);

      // Get recent transactions count
      const signatures = await this.sdk.rpc.request("getSignaturesForAddress", [
        address,
        { limit: 50 },
      ]);

      return {
        solBalance: solBalance / 1e9,
        solBalanceFormatted: `${(solBalance / 1e9).toFixed(4)} SOL`,
        totalTokens: holdings.holdings.filter((h) => !h.isNFT).length,
        totalNFTs: holdings.holdings.filter((h) => h.isNFT).length,
        recentTransactions: Array.isArray(signatures) ? signatures.length : 0,
        topTokens: holdings.holdings
          .filter((h) => !h.isNFT)
          .slice(0, 5)
          .map((h) => ({
            symbol: h.metadata?.symbol || "UNKNOWN",
            balance: h.balance?.formatted || h.balance?.toString() || "0",
          })),
      };
    } catch (error) {
      console.warn("Failed to load wallet portfolio:", error);
      return {
        solBalance: 0,
        solBalanceFormatted: "0 SOL",
        totalTokens: 0,
        totalNFTs: 0,
        recentTransactions: 0,
        topTokens: [],
      };
    }
  }

  private getWalletName(walletType: WalletType): string {
    const names: Record<WalletType, string> = {
      trashpack: "TrashPack",
      phantom: "Phantom",
      solflare: "Solflare",
      backpack: "Backpack",
      glow: "Glow",
      slope: "Slope",
      sollet: "Sollet",
      walletconnect: "WalletConnect",
      ledger: "Ledger",
      custom: "Custom Wallet",
      injected: "Injected Wallet",
    };
    return names[walletType] || walletType;
  }

  private getWalletIcon(walletType: WalletType): string | undefined {
    const icons: Record<WalletType, string | undefined> = {
      trashpack: "/trashpack.png", // As defined in injected.js
      phantom: "https://phantom.app/img/logo.png",
      solflare: "https://solflare.com/assets/logo.svg",
      backpack: "https://backpack.app/icon.png",
      glow: "https://glow.app/icon.png",
      slope: "https://slope.finance/icon.png",
      sollet: "https://www.sollet.io/icon.png",
      walletconnect: "https://walletconnect.org/walletconnect-logo.svg",
      ledger: "https://ledger.com/icon.png",
      custom: undefined,
      injected: undefined,
    };
    return icons[walletType];
  }

  private getWalletWebsite(walletType: WalletType): string | undefined {
    const websites: Record<WalletType, string | undefined> = {
      trashpack: "https://trashpack.tech",
      phantom: "https://phantom.app/",
      solflare: "https://solflare.com/",
      backpack: "https://backpack.app/",
      glow: "https://glow.app/",
      slope: "https://slope.finance/",
      sollet: "https://www.sollet.io/",
      walletconnect: "https://walletconnect.org/",
      ledger: "https://ledger.com/",
      custom: undefined,
      injected: undefined,
    };
    return websites[walletType];
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error("Error in event listener:", error);
        }
      });
    }
  }
}
