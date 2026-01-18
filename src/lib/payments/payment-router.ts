import { WalletClient } from "viem";
import { solanaWalletManager } from "@/lib/payments/solana-wallet-adapter";
import { privacyCashService } from "@/lib/payments/privacy-cash-service";
import { CHAIN_IDS } from "@/lib/config";

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
    preferredChain?: "base" | "solana" | "avalanche";
    privacyMode?: boolean;
}

export interface PaymentResult {
    success: boolean;
    data?: any;
    error?: string;
    paymentVerified?: boolean;
    transactionHash?: string;
}

// DEPRECATED: BookingPaymentContext & Phase D booking methods removed
// Agent-to-agent payments are now immediate via x402 without escrow
// See: PaymentRouter.execute() for standard x402 negotiation

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
        const isEvmAvailable = !!evmWallet && !!evmAddress;

        if (!isSolanaAvailable && !isEvmAvailable) {
            throw new Error("No wallet connected. Please connect a wallet to proceed.");
        }

        // Determine actual chain by checking wallet client chain ID
        let chainHeader = "base-sepolia"; // Default to Base Sepolia

        // If EVM wallet is available, detect the actual chain
        if (isEvmAvailable && evmWallet?.chain) {
            const chainId = evmWallet.chain.id;
            if (chainId === CHAIN_IDS.AVALANCHE_FUJI) {
                chainHeader = "avalanche-fuji";
            } else if (chainId === CHAIN_IDS.BASE_SEPOLIA) {
                chainHeader = "base-sepolia";
            }
        } else if (isSolanaAvailable) {
            chainHeader = "solana-devnet";
        }

        // Override with preferredChain if explicitly specified
        if (preferredChain) {
            if (preferredChain === "solana" && isSolanaAvailable) {
                chainHeader = "solana-devnet";
            } else if (preferredChain === "base" && isEvmAvailable) {
                chainHeader = "base-sepolia";
            } else if (preferredChain === "avalanche" && isEvmAvailable) {
                chainHeader = "avalanche-fuji";
            }
        }

        // Privacy Mode Override
        if (context.privacyMode) {
            if (!isSolanaAvailable) {
                throw new Error("Privacy Mode requires Solana wallet.");
            }
            chainHeader = "solana-devnet";
            console.log("🔒 Privacy Mode Enabled: Enforcing Solana Devnet");
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
        } else if (targetChain.includes("avalanche")) {
            selectedRequirement = availableSchemes.find(s => s.network.includes("avalanche"));
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

            // PRIVACY MODE: Execute real private payment FIRST
            if (context.privacyMode) {
                console.log("🔒 Executing Private Payment via Privacy Cash...");
                try {
                    // Check balance and deposit if needed (simplified auto-deposit)
                    const currentPrivateBalance = await privacyCashService.getPrivateBalanceSOL();
                    const requiredAmount = parseFloat(selectedRequirement.amount);

                    if (currentPrivateBalance < requiredAmount) {
                        const deficit = requiredAmount - currentPrivateBalance;
                        // Add buffer for gas/fees if needed, here exact
                        console.log(`🔒 Insufficient private balance. Auto-depositing ${deficit} SOL...`);
                        await privacyCashService.depositSOL(deficit + 0.01); // simplistic buffer
                    }

                    // Withdraw to Target (Pay)
                    // We assume 'payTo' is the destination address
                    const txSignature = await privacyCashService.withdrawSOL(requiredAmount, selectedRequirement.payTo);

                    // Append Privacy Metadata to message for server awareness
                    message += `\nPrivacyProtocol: privacy-cash\nTxHash: ${txSignature}`;

                } catch (e) {
                    console.error("🔒 Privacy Payment Failed:", e);
                    throw new Error("Privacy Payment Failed: " + (e as any).message);
                }
            }

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
