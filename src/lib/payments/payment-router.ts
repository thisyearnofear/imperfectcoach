// Unified Payment Router - ENHANCEMENT FIRST approach
// Consolidates existing x402 logic while adding Solana support

import type { 
  PaymentChain, 
  PaymentContext, 
  PaymentRequest, 
  ChainRoutingDecision, 
  FeeEstimate,
  NetworkStatus 
} from './payment-types';

export class UnifiedPaymentRouter {
  private networkStatus: NetworkStatus | null = null;
  private statusCacheTimeout = 30 * 1000; // 30 seconds
  private lastStatusUpdate = 0;

  /**
   * CORE ROUTING LOGIC
   * Smart chain selection based on amount, context, and network conditions
   */
  async selectOptimalChain(request: PaymentRequest): Promise<ChainRoutingDecision> {
    const { amount, context, preferredChain } = request;
    
    // Get current network status
    const networkStatus = await this.getNetworkStatus();
    
    // Generate fee estimates for both chains
    const estimates = await Promise.all([
      this.estimateFees('base', amount),
      this.estimateFees('solana', amount)
    ]);

    const [baseFee, solanaFee] = estimates;

    // Decision matrix based on enhancement-first principles
    const decision = this.makeRoutingDecision({
      amount,
      context,
      preferredChain,
      baseFee,
      solanaFee,
      networkStatus
    });

    return decision;
  }

  /**
   * ROUTING DECISION MATRIX
   * Following CLEAN separation of concerns
   */
  private makeRoutingDecision({
    amount,
    context,
    preferredChain,
    baseFee,
    solanaFee,
    networkStatus
  }: {
    amount: bigint;
    context: PaymentContext;
    preferredChain?: PaymentChain;
    baseFee: FeeEstimate;
    solanaFee: FeeEstimate;
    networkStatus: NetworkStatus;
  }): ChainRoutingDecision {
    
    // Rule 1: Micro-transactions always go to Solana (if healthy)
    if (amount < 10000n && solanaFee.networkHealth !== 'degraded') { // < $0.01
      return {
        selectedChain: 'solana',
        reason: 'cost_optimal',
        feeEstimate: solanaFee,
        alternatives: [baseFee]
      };
    }

    // Rule 2: Respect user preference when reasonable
    if (preferredChain && this.isChainViable(preferredChain, amount, networkStatus)) {
      const selectedEstimate = preferredChain === 'base' ? baseFee : solanaFee;
      const alternativeEstimate = preferredChain === 'base' ? solanaFee : baseFee;
      
      return {
        selectedChain: preferredChain,
        reason: 'user_preference',
        feeEstimate: selectedEstimate,
        alternatives: [alternativeEstimate]
      };
    }

    // Rule 3: Agent context prefers Base (established infrastructure)
    if (context === 'agent' && baseFee.networkHealth !== 'degraded') {
      return {
        selectedChain: 'base',
        reason: 'cost_optimal',
        feeEstimate: baseFee,
        alternatives: [solanaFee]
      };
    }

    // Rule 4: Cost optimization for premium
    if (context === 'premium') {
      const cheaperOption = solanaFee.estimatedFee < baseFee.estimatedFee ? 'solana' : 'base';
      const selectedEstimate = cheaperOption === 'base' ? baseFee : solanaFee;
      const alternativeEstimate = cheaperOption === 'base' ? solanaFee : baseFee;

      return {
        selectedChain: cheaperOption,
        reason: 'cost_optimal',
        feeEstimate: selectedEstimate,
        alternatives: [alternativeEstimate]
      };
    }

    // Rule 5: Fallback to Base (proven infrastructure)
    return {
      selectedChain: 'base',
      reason: 'fallback',
      feeEstimate: baseFee,
      alternatives: [solanaFee]
    };
  }

  /**
   * FEE ESTIMATION
   * Cached for performance (PERFORMANT principle)
   */
  private async estimateFees(chain: PaymentChain, amount: bigint): Promise<FeeEstimate> {
    try {
      if (chain === 'base') {
        return await this.estimateBaseFees(amount);
      } else {
        return await this.estimateSolanaFees(amount);
      }
    } catch (error) {
      console.error(`Fee estimation failed for ${chain}:`, error);
      return {
        chain,
        estimatedFee: BigInt(0),
        estimatedTime: 999,
        networkHealth: 'degraded'
      };
    }
  }

  private async estimateBaseFees(amount: bigint): Promise<FeeEstimate> {
    // REUSE existing Base fee logic
    // This would integrate with your existing Base fee estimation
    const gasPrice = BigInt(1000000000); // 1 gwei - placeholder
    const gasLimit = BigInt(21000);
    const baseFee = gasPrice * gasLimit;

    return {
      chain: 'base',
      estimatedFee: baseFee,
      estimatedTime: 15, // seconds
      networkHealth: 'healthy' // Would check actual network status
    };
  }

  private async estimateSolanaFees(amount: bigint): Promise<FeeEstimate> {
    // NEW Solana fee estimation
    const lamportsPerSignature = BigInt(5000); // ~$0.00001

    return {
      chain: 'solana',
      estimatedFee: lamportsPerSignature,
      estimatedTime: 1, // seconds
      networkHealth: 'healthy' // Would check actual Solana network status
    };
  }

  /**
   * NETWORK HEALTH MONITORING
   * Cached with refresh mechanism (PERFORMANT principle)
   */
  private async getNetworkStatus(): Promise<NetworkStatus> {
    const now = Date.now();
    
    if (this.networkStatus && (now - this.lastStatusUpdate) < this.statusCacheTimeout) {
      return this.networkStatus;
    }

    try {
      const [baseStatus, solanaStatus] = await Promise.all([
        this.checkBaseNetwork(),
        this.checkSolanaNetwork()
      ]);

      this.networkStatus = {
        base: baseStatus,
        solana: solanaStatus
      };
      
      this.lastStatusUpdate = now;
      return this.networkStatus;
      
    } catch (error) {
      console.error('Network status check failed:', error);
      
      // Return safe defaults
      return {
        base: { healthy: true, avgFee: BigInt(21000000000000), avgConfirmationTime: 15 },
        solana: { healthy: false, avgFee: BigInt(5000), avgConfirmationTime: 1 }
      };
    }
  }

  private async checkBaseNetwork(): Promise<NetworkStatus['base']> {
    // Would implement actual Base network health check
    return {
      healthy: true,
      avgFee: BigInt(21000000000000), // ~$0.02
      avgConfirmationTime: 15
    };
  }

  private async checkSolanaNetwork(): Promise<NetworkStatus['solana']> {
    // Would implement actual Solana network health check
    return {
      healthy: true,
      avgFee: BigInt(5000), // ~$0.00001
      avgConfirmationTime: 1
    };
  }

  private isChainViable(chain: PaymentChain, amount: bigint, networkStatus: NetworkStatus): boolean {
    const chainStatus = networkStatus[chain];
    
    // Check if network is healthy
    if (!chainStatus.healthy) return false;
    
    // Check if fees make sense for the amount
    const feeRatio = Number(chainStatus.avgFee) / Number(amount);
    
    // Reject if fees are more than 20% of transaction amount
    return feeRatio < 0.2;
  }

  /**
   * UTILITY METHODS
   */
  async getPreferredChain(userAddress: string): Promise<PaymentChain | undefined> {
    // Would integrate with user preferences storage
    // For now, return undefined (no preference)
    return undefined;
  }

  formatAmount(amount: bigint, chain: PaymentChain): string {
    if (chain === 'base') {
      // USDC has 6 decimals
      return (Number(amount) / 1e6).toFixed(6);
    } else {
      // Solana SOL has 9 decimals
      return (Number(amount) / 1e9).toFixed(9);
    }
  }
}

// Export singleton instance for app-wide usage
export const paymentRouter = new UnifiedPaymentRouter();