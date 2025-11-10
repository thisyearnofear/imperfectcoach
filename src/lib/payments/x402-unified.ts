// Unified x402 Handler - CONSOLIDATION of existing scattered logic
// Following DRY principle: Single source of truth for all x402 payments

import type { 
  PaymentRequest, 
  PaymentResponse, 
  PaymentChain, 
  X402PaymentPayload,
  BasePaymentDetails,
  SolanaPaymentDetails 
} from './payment-types';
import { paymentRouter } from './payment-router';

export class X402UnifiedHandler {
  private facilitatorUrl: string;
  
  constructor() {
    this.facilitatorUrl = import.meta.env.VITE_FACILITATOR_URL || "https://x402.org/facilitator";
  }

  /**
   * MAIN PAYMENT PROCESSING ENTRY POINT
   * Consolidates logic from BedrockAnalysisSection, AgentCoachUpsell, PremiumAnalysisUpsell
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      console.log("🚀 Starting unified x402 payment processing...", request);
      
      // Step 1: Smart chain selection using our router
      const routingDecision = await paymentRouter.selectOptimalChain(request);
      console.log(`💡 Selected ${routingDecision.selectedChain} chain:`, routingDecision.reason);

      // Step 2: Create payment payload for selected chain
      const paymentPayload = await this.createPaymentPayload(request, routingDecision.selectedChain);
      
      // Step 3: Process payment on selected chain
      const result = await this.executePayment(paymentPayload);
      
      return {
        ...result,
        chain: routingDecision.selectedChain
      };
      
    } catch (error) {
      console.error("❌ Unified payment processing failed:", error);
      
      // Fallback to Base if Solana fails (ENHANCEMENT FIRST principle)
      if (request.preferredChain !== 'base') {
        console.log("🔄 Attempting fallback to Base...");
        try {
          const fallbackPayload = await this.createPaymentPayload(request, 'base');
          const fallbackResult = await this.executePayment(fallbackPayload);
          
          return {
            ...fallbackResult,
            chain: 'base',
            fallbackUsed: true
          };
        } catch (fallbackError) {
          console.error("❌ Fallback also failed:", fallbackError);
        }
      }
      
      return {
        success: false,
        chain: request.preferredChain || 'base',
        error: error instanceof Error ? error.message : 'Payment processing failed'
      };
    }
  }

  /**
   * CREATE PAYMENT PAYLOAD
   * Generates appropriate payload for Base or Solana
   */
  private async createPaymentPayload(request: PaymentRequest, chain: PaymentChain): Promise<X402PaymentPayload> {
    if (chain === 'base') {
      return this.createBasePaymentPayload(request);
    } else {
      return this.createSolanaPaymentPayload(request);
    }
  }

  /**
   * BASE PAYMENT PAYLOAD (ENHANCED existing logic)
   * Consolidates logic from existing components
   */
  private async createBasePaymentPayload(request: PaymentRequest): Promise<X402PaymentPayload> {
    // REUSE existing Base payment message format
    const x402Message = `x402 Payment Authorization
Scheme: CDP_WALLET
Network: base-sepolia
Asset: USDC
Amount: ${paymentRouter.formatAmount(request.amount, 'base')}
PayTo: ${import.meta.env.VITE_CDP_TREASURY_ADDRESS || '0x7011910452cA4ab9e5c3047aA4a25297C144158a'}
Payer: ${request.userAddress}
Timestamp: ${request.timestamp}
Nonce: ${request.nonce}`;

    // Get wallet client (would integrate with existing wallet logic)
    const walletClient = await this.getWalletClient();
    
    // Sign the payment message
    const signature = await walletClient.signMessage({
      account: request.userAddress as `0x${string}`,
      message: x402Message,
    });

    const paymentDetails: BasePaymentDetails = {
      scheme: 'CDP_WALLET',
      network: 'base-sepolia',
      asset: 'USDC',
      amount: paymentRouter.formatAmount(request.amount, 'base'),
      payTo: import.meta.env.VITE_CDP_TREASURY_ADDRESS || '0x7011910452cA4ab9e5c3047aA4a25297C144158a',
      payer: request.userAddress,
      timestamp: request.timestamp,
      nonce: request.nonce,
      signature,
      message: x402Message
    };

    const encoded = btoa(JSON.stringify(paymentDetails));

    return {
      chain: 'base',
      paymentDetails,
      encoded
    };
  }

  /**
   * SOLANA PAYMENT PAYLOAD (NEW implementation)
   * Following existing pattern but for Solana
   */
  private async createSolanaPaymentPayload(request: PaymentRequest): Promise<X402PaymentPayload> {
    // NEW: Solana-specific payment message format
    const solanaMessage = `Solana x402 Payment Authorization
Amount: ${paymentRouter.formatAmount(request.amount, 'solana')} SOL
Recipient: ${import.meta.env.VITE_SOLANA_TREASURY_ADDRESS || 'CmGgLQL36Y9ubtTsy2zmE46TAxwCBm66onZmPPhUWNqv'}
Payer: ${request.userAddress}
Timestamp: ${request.timestamp}
Nonce: ${request.nonce}
Context: ${request.context}`;

    // Get Solana wallet (would integrate with Solana wallet adapter)
    const solanaWallet = await this.getSolanaWallet();
    
    // Sign the message (Solana-specific signing)
    const encodedMessage = new TextEncoder().encode(solanaMessage);
    const signature = await solanaWallet.signMessage(encodedMessage);

    const paymentDetails: SolanaPaymentDetails = {
      amount: request.amount,
      recipient: import.meta.env.VITE_SOLANA_TREASURY_ADDRESS || 'CmGgLQL36Y9ubtTsy2zmE46TAxwCBm66onZmPPhUWNqv',
      reference: request.nonce,
      label: `Imperfect Coach ${request.context}`,
      message: solanaMessage,
      memo: `IC-${request.context}-${request.timestamp}`,
      signature: Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join('')
    };

    const encoded = btoa(JSON.stringify(paymentDetails));

    return {
      chain: 'solana',
      paymentDetails,
      encoded
    };
  }

  /**
   * EXECUTE PAYMENT
   * Sends x402 payment to appropriate endpoint
   */
  private async executePayment(payload: X402PaymentPayload): Promise<PaymentResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Payment': payload.encoded,
      'X-Chain': payload.chain
    };

    // Use existing AWS Lambda endpoint (it can handle both chains)
    const endpoint = import.meta.env.VITE_PREMIUM_ANALYSIS_URL || 
                    'https://your-lambda-url.execute-api.eu-north-1.amazonaws.com/premium-analysis';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          chain: payload.chain,
          paymentVerified: true, // x402 payment included
          context: 'unified_payment'
        })
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          chain: payload.chain,
          transactionHash: result.transactionHash,
          signature: this.extractSignature(payload)
        };
      } else {
        throw new Error(`Payment processing failed: ${response.status}`);
      }
      
    } catch (error) {
      throw new Error(`Network error during payment: ${error}`);
    }
  }

  /**
   * WALLET INTEGRATION HELPERS
   * Would integrate with existing wallet infrastructure
   */
  private async getWalletClient(): Promise<any> {
    // REUSE existing wallet client from wagmi
    // This would integrate with your existing UnifiedWallet component
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      // Return wagmi wallet client
      throw new Error('Integrate with existing wagmi wallet client');
    }
    throw new Error('No Base wallet available');
  }

  private async getSolanaWallet(): Promise<any> {
    // NEW: Solana wallet integration
    // This would integrate with Solana wallet adapter
    if (typeof window !== 'undefined' && (window as any).solana) {
      return (window as any).solana;
    }
    throw new Error('No Solana wallet available');
  }

  private extractSignature(payload: X402PaymentPayload): string {
    if (payload.chain === 'base') {
      return (payload.paymentDetails as BasePaymentDetails).signature;
    } else {
      return (payload.paymentDetails as SolanaPaymentDetails).signature || '';
    }
  }

  /**
   * VERIFICATION HELPERS
   * For testing and debugging
   */
  async verifyPayment(chain: PaymentChain, signature: string): Promise<boolean> {
    try {
      if (chain === 'base') {
        // REUSE existing Base verification logic
        return this.verifyBasePayment(signature);
      } else {
        // NEW: Solana verification
        return this.verifySolanaPayment(signature);
      }
    } catch (error) {
      console.error(`Payment verification failed for ${chain}:`, error);
      return false;
    }
  }

  private async verifyBasePayment(signature: string): Promise<boolean> {
    // Would integrate with existing Base verification
    // This exists in your current aws-lambda/index.mjs
    return true; // Placeholder
  }

  private async verifySolanaPayment(signature: string): Promise<boolean> {
    // NEW: Solana transaction verification
    return true; // Placeholder - would check Solana blockchain
  }
}

// Export singleton instance following existing pattern
export const x402UnifiedHandler = new X402UnifiedHandler();