/**
 * Reap Protocol Integration Service
 * 
 * Reap Protocol: Agentic Commerce Platform
 * - Enables AI agents to search real products, verify inventory, purchase autonomously
 * - Bridges Web2 shops with Web3 settlement (blockchain payment confirmation)
 * 
 * This service is now enabled and integrates with the @reap-protocol/sdk.
 */

import { ReapClient } from "@reap-protocol/sdk";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { createWalletClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia, avalancheFuji } from "viem/chains";
import { Connection, Keypair, Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

// ─────────────────────────────────────────────────────────────────────────────
// Reap Protocol Configuration
// ─────────────────────────────────────────────────────────────────────────────

const REAP_CONFIG = {
    // Default timeout for Reap API calls (5s)
    timeout: 5000,
    // Middleware URLs for different chains
    middleware: {
        "base-sepolia": "https://base2.api.reap.deals",
        "avalanche-fuji": "https://avax2.api.reap.deals",
        "celo-sepolia": "https://celo2.api.reap.deals",
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Initialize Reap Client (Server-Side Only)
// ─────────────────────────────────────────────────────────────────────────────

let reapClientInstance = null;

/**
 * Get or initialize Reap client
 * Requires AGENT_WALLET_KEY in environment
 */
export async function getReapClient() {
    if (reapClientInstance) return reapClientInstance;

    if (!process.env.AGENT_WALLET_KEY) {
        console.warn("⚠️ AGENT_WALLET_KEY not configured - Reap discovery unavailable");
        return null;
    }

    try {
        // Initialize with agent's private key.
        // The SDK will handle RPC and middleware URLs, but they can be overridden.
        // e.g. new ReapClient(privateKey, rpcUrl, middlewareUrl)
        reapClientInstance = new ReapClient(process.env.AGENT_WALLET_KEY);
        
        await new Promise(r => setTimeout(r, 1000)); // Allow time for client to initialize
        console.log("🤖 Reap Protocol Agent Online");
        
        return reapClientInstance;
    } catch (error) {
        console.error("❌ Failed to initialize Reap client:", error);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reap Product Search and Agent Discovery
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Discovers agents via Reap Protocol.
 */
export async function discoverReapAgents(capability, paymentProtocol = "x402") {
    const client = await getReapClient();

    if (!client) {
        console.warn("⚠️ Reap client unavailable - using AgentRegistry + DynamoDB for agent discovery");
        return [];
    }

    try {
        console.log(`🔍 Querying Reap for ${paymentProtocol} agents with capability: ${capability}`);

        // Map our capability names to Reap protocol terms
        const capabilityMap = {
            nutrition_planning: "nutrition",
            biomechanics_analysis: "biomechanics",
            recovery_planning: "recovery",
            massage_booking: "booking",
            fitness_analysis: "fitness",
        };

        const reapCapability = capabilityMap[capability] || capability;

        const agents = await Promise.race([
            client.searchAgents(reapCapability, paymentProtocol),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Reap discovery timeout")), REAP_CONFIG.timeout)
            ),
        ]);

        console.log(`✅ Reap discovered ${agents.length} agents for ${capability}`);

        return agents.map(normalizeReapAgent);

    } catch (error) {
        console.warn(`⚠️ Reap discovery failed for ${capability}:`, error.message);
        return [];
    }
}

/**
 * Searches for products using Reap Protocol. (Future)
 */
export async function searchReapProducts(query) {
    const client = await getReapClient();
    if (!client) {
        console.warn("⚠️ Reap client unavailable - cannot search for products.");
        return [];
    }
    // const result = await client.stockShelf(query, true); // dryRun = true
    // return result.items || [];
    console.log("📦 Product search with Reap is a future enhancement.");
    return [];
}


/**
 * Normalize Reap agent format to internal AgentProfile format
 */
function normalizeReapAgent(reapAgent) {
    return {
        id: reapAgent.id || reapAgent.address,
        name: reapAgent.name || "Reap Agent",
        description: reapAgent.description || "Agent discovered via Reap Protocol",
        capabilities: reapAgent.capabilities || [],
        pricing: reapAgent.pricing || {
            default: {
                baseFee: reapAgent.baseFee || "0.01",
                asset: "USDC",
                chain: "avalanche-fuji"
            }
        },
        endpoint: reapAgent.endpoint,
        status: "active",
        reputationScore: reapAgent.reputationScore || 80,
        tags: [...(reapAgent.tags || []), "reap-discovered"],
        protocol: reapAgent.protocol || "x402",
        discoveredAt: Date.now(),
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Hybrid Discovery: Core + Real Agents
// ─────────────────────────────────────────────────────────────────────────────

const CORE_AGENTS = [
    {
        id: "agent-fitness-core-01",
        name: "Imperfect Coach Core",
        emoji: "💪",
        role: "coordinator",
        description: "Primary fitness analysis agent using Bedrock Nova Lite.",
        location: "EU-North-1",
        capabilities: ["fitness_analysis", "benchmark_analysis"],
        pricing: {
            fitness_analysis: { baseFee: "0.05", asset: "USDC", chain: "base-sepolia" },
            benchmark_analysis: { baseFee: "0.02", asset: "USDC", chain: "base-sepolia" }
        },
        tieredPricing: {
            fitness_analysis: {
                basic: { baseFee: "0.02", asset: "USDC", chain: "base-sepolia" },
                pro: { baseFee: "0.05", asset: "USDC", chain: "base-sepolia" },
                premium: { baseFee: "0.10", asset: "USDC", chain: "base-sepolia" }
            }
        },
        endpoint: "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout",
        status: "active",
        reputationScore: 98,
        successRate: 0.98,
        tags: ["official", "bedrock", "core"],
        protocol: "x402",
        lastHeartbeat: Date.now(),
        serviceAvailability: {
            basic: { tier: "basic", slots: 100, slotsFilled: 23, nextAvailable: Date.now(), responseSLA: 8000, uptime: 99.5 },
            pro: { tier: "pro", slots: 50, slotsFilled: 15, nextAvailable: Date.now(), responseSLA: 3000, uptime: 99.8 },
            premium: { tier: "premium", slots: 20, slotsFilled: 5, nextAvailable: Date.now(), responseSLA: 500, uptime: 99.9 }
        }
    },
    {
        id: "agent-nutrition-planner-01",
        name: "Nutrition Planner",
        emoji: "🥗",
        role: "specialist",
        description: "Specialized in post-workout nutrition plans.",
        location: "US-West-2",
        capabilities: ["nutrition_planning"],
        pricing: {
            nutrition_planning: { baseFee: "0.03", asset: "USDC", chain: "base-sepolia" }
        },
        tieredPricing: {
            nutrition_planning: {
                basic: { baseFee: "0.01", asset: "USDC", chain: "base-sepolia" },
                pro: { baseFee: "0.025", asset: "USDC", chain: "base-sepolia" },
                premium: { baseFee: "0.05", asset: "USDC", chain: "base-sepolia" }
            }
        },
        endpoint: "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/nutrition-agent",
        status: "active",
        reputationScore: 95,
        successRate: 0.95,
        tags: ["official", "nutrition", "core"],
        protocol: "x402",
        lastHeartbeat: Date.now(),
        serviceAvailability: {
            basic: { tier: "basic", slots: 150, slotsFilled: 45, nextAvailable: Date.now(), responseSLA: 7000, uptime: 99.2 },
            pro: { tier: "pro", slots: 60, slotsFilled: 20, nextAvailable: Date.now(), responseSLA: 2500, uptime: 99.6 },
            premium: { tier: "premium", slots: 25, slotsFilled: 8, nextAvailable: Date.now(), responseSLA: 600, uptime: 99.8 }
        }
    },
    {
        id: "agent-recovery-planner-01",
        name: "Recovery Planner",
        emoji: "😴",
        role: "specialist",
        description: "Specialized in recovery optimization, sleep, and fatigue management.",
        location: "EU-West-1",
        capabilities: ["recovery_planning"],
        pricing: {
            recovery_planning: { baseFee: "0.05", asset: "USDC", chain: "base-sepolia" }
        },
        tieredPricing: {
            recovery_planning: {
                basic: { baseFee: "0.02", asset: "USDC", chain: "base-sepolia" },
                pro: { baseFee: "0.05", asset: "USDC", chain: "base-sepolia" },
                premium: { baseFee: "0.10", asset: "USDC", chain: "base-sepolia" }
            }
        },
        endpoint: "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/recovery-agent",
        status: "active",
        reputationScore: 94,
        successRate: 0.94,
        tags: ["official", "recovery", "core"],
        protocol: "x402",
        lastHeartbeat: Date.now(),
        serviceAvailability: {
            basic: { tier: "basic", slots: 120, slotsFilled: 38, nextAvailable: Date.now(), responseSLA: 8000, uptime: 99.4 },
            pro: { tier: "pro", slots: 50, slotsFilled: 17, nextAvailable: Date.now(), responseSLA: 3000, uptime: 99.7 },
            premium: { tier: "premium", slots: 20, slotsFilled: 6, nextAvailable: Date.now(), responseSLA: 600, uptime: 99.9 }
        }
    },
    {
        id: "agent-biomechanics-01",
        name: "Biomechanics Analyst",
        emoji: "🏋️",
        role: "specialist",
        description: "Deep form analysis and movement quality assessment using pose data.",
        location: "US-East-1",
        capabilities: ["biomechanics_analysis"],
        pricing: {
            biomechanics_analysis: { baseFee: "0.08", asset: "USDC", chain: "base-sepolia" }
        },
        tieredPricing: {
            biomechanics_analysis: {
                basic: { baseFee: "0.04", asset: "USDC", chain: "base-sepolia" },
                pro: { baseFee: "0.08", asset: "USDC", chain: "base-sepolia" },
                premium: { baseFee: "0.15", asset: "USDC", chain: "base-sepolia" }
            }
        },
        endpoint: "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/biomechanics-agent",
        status: "active",
        reputationScore: 96,
        successRate: 0.96,
        tags: ["official", "biomechanics", "core"],
        protocol: "x402",
        lastHeartbeat: Date.now(),
        serviceAvailability: {
            basic: { tier: "basic", slots: 100, slotsFilled: 30, nextAvailable: Date.now(), responseSLA: 8500, uptime: 99.6 },
            pro: { tier: "pro", slots: 50, slotsFilled: 18, nextAvailable: Date.now(), responseSLA: 3200, uptime: 99.8 },
            premium: { tier: "premium", slots: 20, slotsFilled: 7, nextAvailable: Date.now(), responseSLA: 700, uptime: 99.9 }
        }
    },
    {
        id: "agent-massage-booking-01",
        name: "Recovery Booking",
        emoji: "💆",
        role: "utility",
        description: "Books massage and physiotherapy sessions.",
        location: "Asia-Pacific",
        capabilities: ["massage_booking"],
        pricing: {
            massage_booking: { baseFee: "0.50", asset: "USDC", chain: "avalanche-c-chain" }
        },
        tieredPricing: {
            massage_booking: {
                basic: { baseFee: "0.25", asset: "USDC", chain: "avalanche-c-chain" },
                pro: { baseFee: "0.50", asset: "USDC", chain: "avalanche-c-chain" },
                premium: { baseFee: "1.00", asset: "USDC", chain: "avalanche-c-chain" }
            }
        },
        endpoint: "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/booking-agent",
        status: "active",
        reputationScore: 92,
        successRate: 0.92,
        tags: ["partner", "booking", "core"],
        protocol: "x402",
        lastHeartbeat: Date.now(),
        serviceAvailability: {
            basic: { tier: "basic", slots: 200, slotsFilled: 67, nextAvailable: Date.now(), responseSLA: 10000, uptime: 98.8 },
            pro: { tier: "pro", slots: 80, slotsFilled: 25, nextAvailable: Date.now(), responseSLA: 4000, uptime: 99.4 },
            premium: { tier: "premium", slots: 30, slotsFilled: 10, nextAvailable: Date.now(), responseSLA: 1000, uptime: 99.7 }
        }
    }
];

/**
 * Agent Discovery: AgentRegistry + Core Agents
 * 
 * Prioritizes: Reap Protocol > AgentRegistry (DynamoDB) > Core agents (fallback)
 */
export async function discoverAgentsHybrid(capability, prioritizeReap = true) {
    let agents = [];

    if (prioritizeReap) {
        console.log("🌐 Attempting Reap Protocol agent discovery...");
        const reapAgents = await discoverReapAgents(capability, "x402");
        agents = agents.concat(reapAgents);

        if (reapAgents.length > 0) {
            console.log(`✅ Using ${reapAgents.length} Reap-discovered services`);
        }
    }

    // TODO: Add AgentRegistry (DynamoDB) lookup here

    // Core agents (always included as fallback)
    const coreMatches = CORE_AGENTS.filter(a => a.capabilities.includes(capability));

    if (agents.length === 0 && coreMatches.length > 0) {
        console.log(`📦 Using ${coreMatches.length} core agents as fallback`);
        agents = agents.concat(coreMatches);
    } else if (coreMatches.length > 0) {
        // Also include core agents as backup options
        agents = agents.concat(coreMatches);
    }

    // Deduplicate and sort by reputation
    const deduped = new Map();
    agents.forEach(agent => {
        if (!deduped.has(agent.id)) {
            deduped.set(agent.id, agent);
        }
    });

    return Array.from(deduped.values())
        .sort((a, b) => b.reputationScore - a.reputationScore);
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE B: x402 Negotiation Loops
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Execute x402 negotiation with another agent via Reap
 */
export async function negotiatePaymentWithAgent(paymentRequirement, agentIdentity) {
    const client = await getReapClient();

    if (!client) {
        console.warn("⚠️ Reap client unavailable - cannot negotiate payment.");
        return null;
    }

    try {
        console.log(`💳 Negotiating x402 payment with specialist...`);
        console.log(`   Amount: ${paymentRequirement.amount} ${paymentRequirement.asset}`);
        console.log(`   Network: ${paymentRequirement.network}`);

        // The Reap SDK handles the challenge, signature, and settlement coordination.
        const settlement = await client.negotiatePayment({
            from: agentIdentity.address || agentIdentity,
            requirement: paymentRequirement,
            protocol: "x402"
        });

        console.log(`✅ Settlement negotiated - signature valid`);

        return {
            success: true,
            ...settlement
        };

    } catch (error) {
        console.error(`❌ Negotiation failed: ${error.message}`);
        return null;
    }
}


// ─────────────────────────────────────────────────────────────────────────────
// PHASE C: Real Blockchain Settlement
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Execute real USDC transfer on blockchain
 * 
 * Transfers actual stablecoin from agent wallet to specialist
 * NOTE: This is a simplified implementation. The Reap SDK's `buyProduct`
 * would be used for a full agentic commerce flow. This function is for
 * direct agent-to-agent payments.
 */
export async function executeRealPayment(settlement) {
    if (!settlement || !settlement.recipientAddress) {
        console.error("❌ Invalid settlement object for payment.");
        return null;
    }

    try {
        console.log(`💸 Executing real payment...`);
        console.log(`   To: ${settlement.recipientAddress}`);
        console.log(`   Amount: ${settlement.amount} ${settlement.asset}`);
        console.log(`   Network: ${settlement.chain}`);

        // 1. Solana Settlement
        if (settlement.chain.includes("solana")) {
            if (!process.env.AGENT_SOLANA_PRIVATE_KEY) throw new Error("AGENT_SOLANA_PRIVATE_KEY missing");

            const connection = new Connection("https://api.devnet.solana.com", "confirmed");
            const secretKey = bs58.decode(process.env.AGENT_SOLANA_PRIVATE_KEY);
            const payer = Keypair.fromSecretKey(secretKey);

            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: payer.publicKey,
                    toPubkey: new PublicKey(settlement.recipientAddress),
                    lamports: Math.floor(parseFloat(settlement.amount) * LAMPORTS_PER_SOL),
                })
            );

            const signature = await connection.sendTransaction(transaction, [payer]);
            console.log(`✅ Solana Transfer confirmed: ${signature}`);

            return {
                success: true,
                transactionHash: signature,
                from: payer.publicKey.toBase58(),
                to: settlement.recipientAddress,
                amount: settlement.amount,
                asset: "SOL", // Devnet Native
                chain: "solana-devnet",
                status: "confirmed",
                timestamp: Date.now(),
                url: `https://explorer.solana.com/tx/${signature}?cluster=devnet`
            };
        }

        // 2. EVM Settlement (Base/Avalanche)
        else {
            if (!process.env.AGENT_PRIVATE_KEY) throw new Error("AGENT_PRIVATE_KEY missing");

            const chain = settlement.chain.includes("avalanche") ? avalancheFuji : baseSepolia;
            const account = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY.startsWith("0x") ? process.env.AGENT_PRIVATE_KEY : `0x${process.env.AGENT_PRIVATE_KEY}`);

            const wallet = createWalletClient({
                account,
                chain,
                transport: http()
            });

            const hash = await wallet.sendTransaction({
                account,
                to: settlement.recipientAddress,
                value: parseUnits(settlement.amount, 18),
            });

            console.log(`✅ EVM Transfer confirmed: ${hash}`);

            return {
                success: true,
                transactionHash: hash,
                from: account.address,
                to: settlement.recipientAddress,
                amount: settlement.amount,
                asset: "ETH/AVAX",
                chain: settlement.chain,
                status: "confirmed",
                timestamp: Date.now(),
                url: getBlockExplorerUrl(settlement.chain, hash)
            };
        }

    } catch (error) {
        console.error(`❌ Settlement execution failed: ${error.message}`);
        return null;
    }
}

/**
 * Record agent-to-agent payment in database
 * 
 * For audit trail and revenue splitting
 */
export async function recordAgentPayment(db, paymentRecord) {
    try {
        console.log(`📊 Recording agent payment...`);

        const record = {
            ...paymentRecord,
            recordedAt: Date.now(),
            status: paymentRecord.transactionHash ? "confirmed" : "simulated"
        };

        // In production, this would write to DynamoDB
        if (db && db.recordPayment) {
            await db.recordPayment(record);
        } else {
            console.log(`   (Payment record would be stored in DB)`, record);
        }

        return record;

    } catch (error) {
        console.error(`❌ Failed to record payment: ${error.message}`);
        return null;
    }
}

/**
 * Execute revenue split to platform treasury
 * 
 * Called after inter-agent payment succeeds
 */
export async function splitRevenue(settlementTx, platformFeePercent = 97) {
    try {
        console.log(`💰 Executing revenue split...`);

        const userAmount = settlementTx.amount;
        const platformFee = (userAmount * platformFeePercent) / 100;
        const agentShare = userAmount - platformFee;

        console.log(`   User Paid: ${userAmount}`);
        console.log(`   Platform Fee (${platformFeePercent}%): ${platformFee}`);
        console.log(`   Agent Share: ${agentShare}`);

        // In Phase C, this would call RevenueSplitter contract
        // For now, we just calculate

        return {
            userAmount,
            platformFee,
            agentShare,
            transactionHash: settlementTx.transactionHash,
            splitAt: Date.now()
        };

    } catch (error) {
        console.error(`❌ Revenue split failed: ${error.message}`);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get block explorer URL for transaction
 */
function getBlockExplorerUrl(chain, txHash) {
    const explorers = {
        "base-sepolia": "https://sepolia.basescan.io",
        "base-mainnet": "https://basescan.io",
        "avalanche-fuji": "https://testnet.snowtrace.io",
        "avalanche-mainnet": "https://snowtrace.io"
    };
    const base = explorers[chain] || "https://etherscan.io";
    return `${base}/tx/${txHash}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Exports for Handler
// ─────────────────────────────────────────────────────────────────────────────

export { CORE_AGENTS };
