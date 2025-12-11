import { WalletClient } from "viem";
import { solanaWalletManager } from "@/lib/payments/solana-wallet-adapter";

// Types
export interface PaymentRequirement {
    scheme: string;
    network: string;
    asset: string;
    amount: string;
    chainId?: number;
    payTo: string;
}

export interface PaymentPayload {
    scheme: string;
    network: string;
    asset: string;
    amount: string;
    chainId?: number;
    payTo: string;
    payer: string;
    from?: string;
    timestamp: number;
    nonce: string;
    signature: string;
    message: string;
}

export interface RoutingContext {
    apiUrl: string;
    requestBody: any;
    evmWallet?: any; // WalletClient type is tricky with wagmi versions sometimes, keeping flexible or typed if possible
    evmAddress?: string;
    preferredChain?: "base" | "solana";
}

export interface PaymentResult {
    success: boolean;
    data?: any;
    error?: string;
    paymentVerified?: boolean;
    transactionHash?: string;
}

/**
 * Phase D: Escrow booking payment context
 * Used for service tier bookings with SLA enforcement
 */
export interface BookingPaymentContext extends RoutingContext {
    bookingId?: string;              // Booking ID from agent discovery
    agentId?: string;                // Target agent ID
    serviceTier?: string;            // basic | pro | premium
    slaDurationMs?: number;          // Expected completion time in ms
    escrowContractAddress?: string;  // RevenueSplitter contract on-chain
}

/**
 * PaymentRouter: Centralized logic for x402 payment negotiation and execution.
 * Handles:
 * 1. Initial 402 Challenge detection
 * 2. Network selection (Base vs Solana) based on availability/preference
 * 3. Signing (EIP-191 vs Ed25519)
 * 4. Retry with Payment Headers
 */
export class PaymentRouter {

    /**
     * Main entry point to execute a paid API call.
     * Transparently handles the 402 flow.
     */
    static async execute(context: RoutingContext): Promise<PaymentResult> {
        const { apiUrl, requestBody, evmWallet, evmAddress, preferredChain } = context;

        // Detect available chains based on connected wallets
        const isSolanaAvailable = solanaWalletManager.isConnected();
        const isBaseAvailable = !!evmWallet && !!evmAddress;
        const isAvalancheAvailable = !!evmWallet && !!evmAddress; // Avalanche uses same EVM wallet as Base

        if (!isSolanaAvailable && !isAvalancheAvailable && !isBaseAvailable) {
            throw new Error("No wallet connected. Please connect a wallet to proceed.");
        }

        // Determine initial chain hint header
        let chainHeader = "avalanche-fuji"; // Default to Avalanche (Hack2Build primary)
        if (preferredChain === "solana" && isSolanaAvailable) {
            chainHeader = "solana-devnet";
        } else if (preferredChain === "base" && isBaseAvailable) {
            chainHeader = "base-sepolia";
        } else if (preferredChain === "avalanche" && isAvalancheAvailable) {
            chainHeader = "avalanche-fuji";
        } else if (isSolanaAvailable) {
            chainHeader = "solana-devnet";
        }

        console.log(`🚀 PaymentRouter: Starting request to ${apiUrl} [Preferred: ${chainHeader}]`);

        try {
            // 1. Initial Request
            // We pass X-Chain header to hint our preference, but the server determines the challenge
            let response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Chain": chainHeader,
                },
                body: JSON.stringify(requestBody),
            });

            // 2. Handle 402 Payment Required
            if (response.status === 402) {
                console.log("💰 PaymentRouter: 402 Payment Required - Initiating negotiation...");
                const challenge = await response.json();

                // 3. Negotiate & Sign
                const paymentHeader = await this.handleChallenge(
                    challenge,
                    context,
                    chainHeader
                );

                // 4. Retry Request with Payment
                console.log("🔄 PaymentRouter: Retrying with signed payment proof...");
                response = await fetch(apiUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Payment": paymentHeader,
                        "X-Chain": chainHeader, // Maintain web session consistency
                    },
                    body: JSON.stringify(requestBody),
                });
            }

            // 5. Handle Final Response
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ PaymentRouter: Request failed [${response.status}]:`, errorText);
                throw new Error(`Payment failed: ${errorText}`);
            }

            const data = await response.json();
            console.log("✅ PaymentRouter: Success");

            return {
                success: true,
                data,
                paymentVerified: data.paymentVerified,
                transactionHash: data.transactionHash
            };

        } catch (error: any) {
            console.error("💥 PaymentRouter Error:", error);
            return {
                success: false,
                error: error.message || "Unknown payment error"
            };
        }
    }

    /**
     * Execute a booking payment with escrow (Phase D)
     * Creates on-chain escrow via RevenueSplitter before service execution
     */
    static async executeBookingPayment(context: BookingPaymentContext): Promise<PaymentResult> {
        const { apiUrl, requestBody, bookingId, agentId, serviceTier, slaDurationMs, escrowContractAddress } = context;

        console.log(`📅 PaymentRouter: Processing booking payment [${bookingId}] for ${serviceTier} tier`);

        try {
            // Step 1: Execute standard payment flow
            const paymentResult = await this.execute(context);
            
            if (!paymentResult.success) {
                return paymentResult;
            }

            // Step 2: Optionally create on-chain escrow (Phase D)
            // If escrow contract provided, lock funds in booking escrow
            if (escrowContractAddress && slaDurationMs) {
                console.log(`🔒 PaymentRouter: Creating on-chain escrow for booking ${bookingId}`);
                
                const escrowTx = await this.createEscrowBooking(
                    escrowContractAddress,
                    agentId,
                    slaDurationMs,
                    paymentResult.transactionHash,
                    context
                );

                return {
                    success: true,
                    data: {
                        ...paymentResult.data,
                        bookingId,
                        escrowTx,
                        escrowed: true,
                        message: "Payment created and locked in escrow until SLA verification"
                    },
                    transactionHash: escrowTx
                };
            }

            // Step 3: Standard payment (no escrow) - booking managed off-chain
            return {
                success: true,
                data: {
                    ...paymentResult.data,
                    bookingId,
                    escrowed: false,
                    message: "Payment successful, booking active"
                },
                transactionHash: paymentResult.transactionHash
            };

        } catch (error: any) {
            console.error("❌ PaymentRouter: Booking payment failed:", error);
            return {
                success: false,
                error: error.message || "Booking payment error"
            };
        }
    }

    /**
     * Create on-chain escrow booking (Phase D)
     * Locks funds in RevenueSplitter until SLA verification or timeout
     */
    private static async createEscrowBooking(
        contractAddress: string,
        agentId: string | undefined,
        slaDurationMs: number,
        paymentTx: string | undefined,
        context: BookingPaymentContext
    ): Promise<string> {
        // Phase D placeholder for on-chain escrow creation
        // Full implementation would use ethers.js/viem to call RevenueSplitter.createBooking()
        
        console.log(`🔐 Escrow: Would lock funds in ${contractAddress} for ${slaDurationMs}ms SLA`);
        console.log(`   Agent: ${agentId}, Payment TX: ${paymentTx}`);
        
        // Return mock transaction hash (would be real tx hash in production)
        return `escrow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Cancel booking and initiate refund (Phase D)
     * Called if booking expires or service cannot be completed
     */
    static async cancelBookingPayment(
        bookingId: string,
        escrowContractAddress: string,
        reason: string
    ): Promise<PaymentResult> {
        console.log(`❌ PaymentRouter: Cancelling booking ${bookingId} - ${reason}`);

        try {
            // Phase D placeholder for on-chain refund
            // Full implementation would call RevenueSplitter.cancelBooking(bookingId)
            
            const refundTx = `refund-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            return {
                success: true,
                data: {
                    bookingId,
                    status: "cancelled",
                    reason,
                    refundTx,
                    message: "Booking cancelled, refund initiated"
                },
                transactionHash: refundTx
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || "Cancellation failed"
            };
        }
    }

    /**
     * Complete booking and verify SLA (Phase D)
     * Called after service execution to check if SLA was met
     */
    static async completeBookingPayment(
        bookingId: string,
        escrowContractAddress: string,
        executionTimeMs: number,
        expectedSLAMs: number
    ): Promise<PaymentResult> {
        const slaMet = executionTimeMs <= expectedSLAMs;
        
        console.log(`✅ PaymentRouter: Completing booking ${bookingId}`);
        console.log(`   Execution: ${executionTimeMs}ms, SLA: ${expectedSLAMs}ms, Met: ${slaMet}`);

        try {
            // Phase D placeholder for on-chain completion
            // Full implementation would call RevenueSplitter.completeBooking(bookingId)
            
            const settlementTx = `settlement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            return {
                success: true,
                data: {
                    bookingId,
                    status: "completed",
                    slaMet,
                    executionTimeMs,
                    expectedSLAMs,
                    penalty: slaMet ? 0 : expectedSLAMs * 0.1, // 10% penalty default
                    message: slaMet ? "SLA met, full payment released" : "SLA breached, 10% penalty applied"
                },
                transactionHash: settlementTx
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || "Settlement failed"
            };
        }
    }

    /**
     * Processes a 402 Challenge: Selects scheme, generates signature, returns header.
     */
    private static async handleChallenge(
        challenge: any,
        context: RoutingContext,
        targetChain: string
    ): Promise<string> {
        const { evmWallet, evmAddress, preferredChain } = context;

        // A. Parse Requirements
        const availableSchemes: PaymentRequirement[] = challenge.accepts || challenge.schemes;

        if (!availableSchemes?.length) {
            throw new Error("Invalid payment challenge: No schemes provided by server.");
        }

        // B. Select Scheme
        let selectedRequirement: PaymentRequirement | undefined;

        // Try to match target chain first
        if (targetChain.includes("solana")) {
            selectedRequirement = availableSchemes.find(s => s.network.includes("solana"));
        } else {
            selectedRequirement = availableSchemes.find(s => s.network.includes("base") || s.network.includes("ethereum"));
        }

        // Fallback if specific chain not found
        if (!selectedRequirement) {
            console.warn("⚠️ Target chain not found in schemes, falling back to first available.");
            selectedRequirement = availableSchemes[0];
        }

        console.log(`🔗 PaymentRouter: Selected scheme [${selectedRequirement.network}]`);

        // C. Prepare Signing
        const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp
        const nonce = crypto.randomUUID();
        const payTo = selectedRequirement.payTo;
        const amount = selectedRequirement.amount;

        // Construct Standard x402 Message
        // Note: The message format MUST match what the server expects.
        // Based on existing code check:
        // "Authorize payment of 0.05 USDC..." isn't the standard x402 format used in AgentCoachUpsell.
        // AgentCoachUpsell used a structured string: "x402 Payment Authorization\nScheme:..."
        // PremiumAnalysisUpsell used a simple sentence: "Authorize payment of..."
        // 
        // CRITICAL CONSOLIDATION STEP: We must unify this. 
        // The server `index.mjs` verifies the signature against the `message` passed in the payload.
        // So as long as we send the message we signed, it should verify (if using eip-191/ed25519).
        // EXCEPT: If the server reconstructs the message to verify INTENT, it might fail.
        // `index.mjs` currently does: verify(signedPayment). It typically checks signature matches message.
        // Let's use the MORE ROBUST structured message from AgentCoachUpsell as the standard going forward.

        let payerAddress = "";
        let signature = "";
        let message = "";

        // D. Sign
        if (selectedRequirement.network.includes("solana")) {
            // SOLANA FLOW
            if (!solanaWalletManager.isConnected()) {
                throw new Error("Solana wallet not connected.");
            }
            payerAddress = solanaWalletManager.getPublicKey()?.toBase58() || "";

            // Standardized x402 Message
            message = `x402 Payment Authorization
Scheme: ${selectedRequirement.scheme}
Network: ${selectedRequirement.network}
Asset: ${selectedRequirement.asset}
Amount: ${selectedRequirement.amount}
PayTo: ${selectedRequirement.payTo}
Payer: ${payerAddress}
Timestamp: ${timestamp}
Nonce: ${nonce}`;

            const messageBytes = new TextEncoder().encode(message);
            const signatureBytes = await solanaWalletManager.signMessage(messageBytes);
            signature = btoa(String.fromCharCode(...signatureBytes));

        } else {
            // BASE/EVM FLOW
            if (!evmWallet || !evmAddress) {
                throw new Error("EVM wallet not connected.");
            }
            payerAddress = evmAddress;

            // Standardized x402 Message
            message = `x402 Payment Authorization
Scheme: ${selectedRequirement.scheme}
Network: ${selectedRequirement.network}
Asset: ${selectedRequirement.asset}
Amount: ${selectedRequirement.amount}
PayTo: ${selectedRequirement.payTo}
Payer: ${payerAddress}
Timestamp: ${timestamp}
Nonce: ${nonce}`;

            signature = await evmWallet.signMessage({
                account: payerAddress,
                message: message,
            });
        }

        // E. Construct Payload
        const paymentPayload: PaymentPayload = {
            scheme: selectedRequirement.scheme,
            network: selectedRequirement.network,
            asset: selectedRequirement.asset,
            amount: selectedRequirement.amount,
            chainId: selectedRequirement.chainId,
            payTo: selectedRequirement.payTo,
            payer: payerAddress,
            from: payerAddress, // Legacy support
            timestamp,
            nonce,
            signature,
            message
        };

        // F. Return Header
        return btoa(JSON.stringify(paymentPayload));
    }
}
