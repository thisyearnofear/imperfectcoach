// CDP Configuration for client-side usage
interface CDPConfig {
  projectId?: string;
  apiKeyId?: string;
  clientApiKey?: string;
  apiKeySecret?: string;
}

interface TransactionMetadata {
  hash: string;
  timestamp: number;
  gasEstimate?: string;
  status?: "pending" | "confirmed" | "failed";
  type?: "payment" | "contract" | "transfer";
  amount?: string;
  currency?: string;
  description?: string;
  facilitator?: string;
}

class CDPManager {
  private config: CDPConfig;
  private initialized = false;
  private transactionHistory: Map<string, TransactionMetadata> = new Map();

  constructor() {
    this.config = {
      projectId: import.meta.env.VITE_COINBASE_PROJECT_ID,
      apiKeyId: import.meta.env.VITE_COINBASE_API_KEY_ID,
      clientApiKey: import.meta.env.VITE_COINBASE_CLIENT_API_KEY,
      apiKeySecret: import.meta.env.VITE_COINBASE_API_KEY_SECRET,
    };
  }

  /**
   * Initialize CDP features (client-side safe)
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Check if credentials are present (but don't initialize server-side SDK)
      if (!this.hasValidCredentials()) {
        console.log(
          "ℹ️ CDP credentials not configured - running in basic mode",
        );
        return false;
      }

      // Load transaction history from localStorage
      this.loadTransactionHistory();

      this.initialized = true;
      // console.log("✅ CDP features initialized (client-side)", {
      //   configured: this.hasValidCredentials(),
      //   features: this.getAvailableFeatures(),
      // });
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize CDP features:", error);
      return false;
    }
  }

  /**
   * Load transaction history from localStorage
   */
  private loadTransactionHistory(): void {
    try {
      const stored = localStorage.getItem("cdp-transaction-history");
      if (stored) {
        const data = JSON.parse(stored);
        this.transactionHistory = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error("Error loading transaction history:", error);
    }
  }

  /**
   * Save transaction history to localStorage
   */
  private saveTransactionHistory(): void {
    try {
      const data = Object.fromEntries(this.transactionHistory);
      localStorage.setItem("cdp-transaction-history", JSON.stringify(data));
    } catch (error) {
      console.error("Error saving transaction history:", error);
    }
  }

  /**
   * Check if we have valid CDP credentials
   */
  private hasValidCredentials(): boolean {
    const hasCredentials = !!(
      this.config.projectId &&
      this.config.apiKeyId &&
      this.config.clientApiKey &&
      this.config.apiKeySecret
    );

    // Temporarily disable CDP credential logging to reduce spam
    // if (hasCredentials) {
    //   console.log("✅ CDP credentials found:", {
    //     projectId: this.config.projectId ? "✓" : "✗",
    //     apiKeyId: this.config.apiKeyId ? "✓" : "✗",
    //     clientApiKey: this.config.clientApiKey ? "✓" : "✗",
    //     apiKeySecret: this.config.apiKeySecret ? "✓" : "✗",
    //   });
    // } else {
    //   console.log("❌ CDP credentials missing");
    // }

    return hasCredentials;
  }

  /**
   * Track a new transaction
   */
  trackTransaction(
    hash: string,
    metadata?: Partial<TransactionMetadata>,
  ): void {
    const txData: TransactionMetadata = {
      hash,
      timestamp: Date.now(),
      status: "pending",
      type: "payment",
      ...metadata,
    };

    this.transactionHistory.set(hash, txData);
    this.saveTransactionHistory();
    console.log("📝 Transaction tracked:", hash, txData.type || "unknown type");
  }

  /**
   * Track x402 payment transaction with enhanced metadata
   */
  trackPaymentTransaction(
    hash: string,
    amount: string,
    currency: string,
    description?: string,
    facilitator?: string
  ): void {
    this.trackTransaction(hash, {
      type: "payment",
      amount,
      currency,
      description: description || "x402 payment",
      facilitator: facilitator || "CDP",
      status: "confirmed"
    });
  }

  /**
   * Update transaction status
   */
  updateTransactionStatus(
    hash: string,
    status: TransactionMetadata["status"],
  ): void {
    const existing = this.transactionHistory.get(hash);
    if (existing) {
      existing.status = status;
      this.transactionHistory.set(hash, existing);
      this.saveTransactionHistory();
      console.log("📋 Transaction status updated:", hash, status);
    }
  }

  /**
   * Get transaction history for user
   */
  getTransactionHistory(): TransactionMetadata[] {
    return Array.from(this.transactionHistory.values()).sort(
      (a, b) => b.timestamp - a.timestamp,
    );
  }

  /**
   * Get enhanced wallet information (client-side safe)
   */
  async getWalletInfo(address: string): Promise<{
    recentTransactions: TransactionMetadata[];
    hasCredentials: boolean;
    features: string[];
  } | null> {
    if (!this.initialized) {
      return null;
    }

    try {
      const recentTransactions = this.getTransactionHistory().slice(0, 10);

      return {
        recentTransactions,
        hasCredentials: this.hasValidCredentials(),
        features: this.getAvailableFeatures(),
      };
    } catch (error) {
      console.error("Error fetching wallet info:", error);
      return null;
    }
  }

  /**
   * Get available features based on configuration
   */
  private getAvailableFeatures(): string[] {
    const features = ["Transaction Tracking", "Error Analysis"];

    if (this.hasValidCredentials()) {
      features.push("Enhanced Analytics", "Network Insights");
    }

    return features;
  }

  /**
   * Get enhanced transaction details
   */
  async getTransactionDetails(txHash: string): Promise<{
    status?: string;
    gasUsed?: string;
    blockNumber?: number;
    timestamp?: number;
    explorerUrl?: string;
  } | null> {
    if (!this.initialized) {
      return null;
    }

    try {
      // Check our local history first
      const localTx = this.transactionHistory.get(txHash);

      const explorerUrl = `https://sepolia.basescan.org/tx/${txHash}`;

      if (localTx) {
        return {
          status: localTx.status || "pending",
          gasUsed: localTx.gasEstimate || "unknown",
          timestamp: localTx.timestamp,
          explorerUrl,
        };
      }

      // If not in local history, return basic info
      return {
        status: "unknown",
        explorerUrl,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Error fetching transaction details:", error);
      return null;
    }
  }

  /**
   * Enhanced error reporting for transactions
   */
  async analyzeTransactionError(error: Error | { message?: string }): Promise<{
    category: string;
    suggestion: string;
    retryable: boolean;
    severity: "low" | "medium" | "high";
    helpUrl?: string;
  }> {
    // Enhanced error analysis with CDP insights
    const errorMessage = (error as Error).message?.toLowerCase() || "";

    if (errorMessage.includes("insufficient funds")) {
      return {
        category: "Insufficient Funds",
        suggestion:
          "Add more ETH to cover gas fees. Base Sepolia ETH is free from faucets.",
        retryable: false,
        severity: "high",
        helpUrl: "https://coinbase.com/faucets/base-ethereum-sepolia-faucet",
      };
    }

    if (
      errorMessage.includes("user rejected") ||
      errorMessage.includes("user denied")
    ) {
      return {
        category: "User Rejection",
        suggestion: "Transaction was cancelled. Try again when ready.",
        retryable: true,
        severity: "low",
      };
    }

    if (errorMessage.includes("nonce")) {
      return {
        category: "Nonce Error",
        suggestion: "Transaction order conflict. Refresh and try again.",
        retryable: true,
        severity: "medium",
      };
    }

    if (errorMessage.includes("gas")) {
      return {
        category: "Gas Error",
        suggestion: "Gas estimation failed. Network may be congested.",
        retryable: true,
        severity: "medium",
      };
    }

    if (errorMessage.includes("cooldown") || errorMessage.includes("wait")) {
      return {
        category: "Rate Limited",
        suggestion: "Please wait before submitting another score.",
        retryable: true,
        severity: "low",
      };
    }

    if (
      errorMessage.includes("wrong network") ||
      errorMessage.includes("switch")
    ) {
      return {
        category: "Wrong Network",
        suggestion: "Switch to Base Sepolia network to submit scores.",
        retryable: true,
        severity: "high",
        helpUrl: "https://docs.base.org/network-information",
      };
    }

    if (
      errorMessage.includes("unsupported chain") ||
      errorMessage.includes("chain")
    ) {
      return {
        category: "Network Error",
        suggestion: "Please connect to Base Sepolia network.",
        retryable: true,
        severity: "high",
        helpUrl: "https://chainlist.org/chain/84532",
      };
    }

    return {
      category: "Network Error",
      suggestion: "Connection issue. Check network and try again.",
      retryable: true,
      severity: "medium",
    };
  }

  /**
   * Get network status and recommendations
   */
  async getNetworkStatus(): Promise<{
    gasPrice?: string;
    congestion?: "low" | "medium" | "high";
    recommendation?: string;
    networkName?: string;
  } | null> {
    if (!this.initialized) {
      return null;
    }

    try {
      // Analyze recent transaction patterns
      const recentTxs = this.getTransactionHistory().slice(0, 5);
      const failedTxs = recentTxs.filter((tx) => tx.status === "failed").length;

      let congestion: "low" | "medium" | "high" = "low";
      let recommendation = "Network is operating normally";

      if (failedTxs > 2) {
        congestion = "high";
        recommendation = "High failure rate detected. Consider waiting.";
      } else if (failedTxs > 0) {
        congestion = "medium";
        recommendation = "Some issues detected. Monitor transaction status.";
      }

      return {
        gasPrice: "~0.001 ETH",
        congestion,
        recommendation,
        networkName: "Base Sepolia",
      };
    } catch (error) {
      console.error("Error getting network status:", error);
      return null;
    }
  }

  /**
   * Check if CDP features are available
   */
  isAvailable(): boolean {
    return this.initialized;
  }

  /**
   * Get configuration status
   */
  getStatus(): {
    configured: boolean;
    initialized: boolean;
    features: string[];
    credentials: {
      projectId: boolean;
      apiKeyId: boolean;
      clientApiKey: boolean;
      apiKeySecret: boolean;
    };
  } {
    const features = [];

    if (this.hasValidCredentials()) {
      features.push("Enhanced Analytics");
      features.push("Transaction Insights");
      features.push("Network Status");
      features.push("Basename Resolution");
    }

    if (this.initialized) {
      features.push("Real-time Data");
      features.push("Error Analysis");
      features.push("Transaction Tracking");
    }

    return {
      configured: this.hasValidCredentials(),
      initialized: this.initialized,
      features,
      credentials: {
        projectId: !!this.config.projectId,
        apiKeyId: !!this.config.apiKeyId,
        clientApiKey: !!this.config.clientApiKey,
        apiKeySecret: !!this.config.apiKeySecret,
      },
    };
  }
}

// Create singleton instance
export const cdpManager = new CDPManager();

// Auto-initialize on import
cdpManager.initialize().catch(console.error);

// Utility functions for easy access
export const getCDPStatus = () => cdpManager.getStatus();
export const isCDPAvailable = () => cdpManager.isAvailable();
export const getWalletInfo = (address: string) =>
  cdpManager.getWalletInfo(address);
export const getTransactionDetails = (txHash: string) =>
  cdpManager.getTransactionDetails(txHash);
export const analyzeTransactionError = (error: Error | { message?: string }) =>
  cdpManager.analyzeTransactionError(error);
export const getNetworkStatus = () => cdpManager.getNetworkStatus();
export const trackTransaction = (
  hash: string,
  metadata?: Partial<TransactionMetadata>,
) => cdpManager.trackTransaction(hash, metadata);
export const trackPaymentTransaction = (
  hash: string,
  amount: string,
  currency: string,
  description?: string,
  facilitator?: string
) => cdpManager.trackPaymentTransaction(hash, amount, currency, description, facilitator);
export const updateTransactionStatus = (
  hash: string,
  status: TransactionMetadata["status"],
) => cdpManager.updateTransactionStatus(hash, status);
export const getTransactionHistory = () => cdpManager.getTransactionHistory();

// Types for external use
export type CDPWalletInfo = Awaited<ReturnType<typeof getWalletInfo>>;
export type CDPTransactionDetails = Awaited<
  ReturnType<typeof getTransactionDetails>
>;
export type CDPNetworkStatus = Awaited<ReturnType<typeof getNetworkStatus>>;
export type { TransactionMetadata };
