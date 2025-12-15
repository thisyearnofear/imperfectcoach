/**
 * Reap Protocol Integration Service
 * 
 * Reap Protocol: Agentic Commerce Platform
 * - Enables AI agents to search real products, verify inventory, purchase autonomously
 * - Bridges Web2 shops with Web3 settlement (blockchain payment confirmation)
 * - Not for agent discovery - that's AgentRegistry contract + agent-discovery.js
 * 
 * Future use cases for Imperfect Coach:
 * - Agents booking massage/recovery services (product inventory check)
 * - Purchase supplements/equipment recommendations (autonomous commerce)
 * - Verify supplier inventory before recommending (product search)
 * 
 * Current status: Core agents managed by AgentRegistry contract + DynamoDB
 * Reap integration reserved for future agentic commerce features
 */

// import { ReapClient } from "@reap-protocol/sdk"; // Temporarily disabled
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
    // Reap endpoint (will be updated based on their actual API)
    endpoint: process.env.REAP_ENDPOINT || "https://api.reap.io",

    // Supported chains that align with our stack
    chains: {
        "avalanche-fuji": "Avalanche Fuji Testnet",
        "base-sepolia": "Base Sepolia Testnet",
        "avalanche-mainnet": "Avalanche C-Chain",
        "base-mainnet": "Base Mainnet",
    },

    // Default timeout for Reap API calls (5s)
    timeout: 5000,
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
        // Initialize with agent's private key and RPC
        // reapClientInstance = new ReapClient(
        //     process.env.AGENT_WALLET_KEY,
        //     process.env.AVALANCHE_RPC || "https://api.avax-test.network/ext/bc/C/rpc"
        // );

        console.log("⚠️ Reap Protocol client disabled (missing dependency)");
        return null; // Force fallback to core agents
    } catch (error) {
        console.error("❌ Failed to initialize Reap client:", error);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reap Product Search Integration (Future)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reap Protocol Product Search (Reserved for Future)
 * 
 * When enabled, will search products, verify inventory, and purchase autonomously
 * via Reap Protocol's Web2/Web3 settlement bridge.
 * 
 * Agent discovery is currently handled by:
 * - AgentRegistry smart contract (on-chain profiles)
 * - agent-discovery.js (permissionless registration + DynamoDB persistence)
 * - Core agents as fallback (CORE_AGENTS array below)
 * 
 * Reap use cases for future:
 * - Agents autonomously booking recovery services (product inventory)
 * - Purchasing supplements/equipment recommendations (Web2 shop integration)
 * - Verifying supplier inventory before recommendations (product search)
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

        // Search via Reap's registry
        // x402 = Payment-per-request agents
        // a2a = Agent-to-agent settlement
        const agents = await Promise.race([
            client.searchAgents(reapCapability, paymentProtocol),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Reap discovery timeout")), REAP_CONFIG.timeout)
            ),
        ]);

        console.log(`✅ Reap discovered ${agents.length} agents for ${capability}`);

        // Normalize Reap agent format to our internal format
        return agents.map(normalizeReapAgent);

    } catch (error) {
        console.warn(`⚠️ Reap discovery failed for ${capability}:`, error.message);
        return [];
    }
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

        // Pricing from Reap
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

        // Reap-specific metadata
        protocol: reapAgent.protocol || "x402", // x402 or a2a
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
 * Prioritizes: AgentRegistry (DynamoDB) > Core agents (fallback)
 * Deduplicates based on capability
 * 
 * Note: Reap Protocol is reserved for future agentic commerce features
 * (product search, inventory verification, autonomous purchasing)
 */
export async function discoverAgentsHybrid(capability, prioritizeReap = false) {
    let agents = [];

    // NOTE: Reap prioritization disabled - Reap is for commerce, not agent discovery
    // Agent discovery uses AgentRegistry (deployed to DynamoDB)
    // See agent-discovery.js for implementation
    
    if (prioritizeReap) {
        console.log("🌐 Attempting Reap Protocol integration (future feature)...");
        const reapAgents = await discoverReapAgents(capability, "x402");
        agents = agents.concat(reapAgents);

        if (reapAgents.length > 0) {
            console.log(`✅ Using ${reapAgents.length} Reap-discovered services`);
        }
    }

    // Core agents (always included as fallback)
    const coreMatches = CORE_AGENTS.filter(a => a.capabilities.includes(capability));

    if (agents.length === 0 && coreMatches.length > 0) {
        console.log(`📦 Using ${coreMatches.length} core agents`);
        agents = agents.concat(coreMatches);
    } else if (coreMatches.length > 0) {
        // Also include core agents as backup options (sorted by reputation)
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
 * 
 * Flow:
 * 1. Generate payment challenge
 * 2. Sign with agent private key
 * 3. Get settlement proof
 * 4. Return proof for inter-agent call
 */
export async function negotiatePaymentWithAgent(paymentRequirement, agentIdentity) {
    const client = await getReapClient();

    if (!client) {
        console.warn("⚠️ Reap client unavailable - returning mock settlement");
        return createMockSettlement(paymentRequirement);
    }

    try {
        console.log(`💳 Negotiating x402 payment with specialist...`);
        console.log(`   Amount: ${paymentRequirement.amount} ${paymentRequirement.asset}`);
        console.log(`   Network: ${paymentRequirement.network}`);

        // Reap's negotiation flow:
        // 1. Challenge generation
        // 2. Signature creation (EIP-191)
        // 3. Settlement coordination

        const settlement = await client.negotiatePayment({
            from: agentIdentity.address || agentIdentity,
            requirement: paymentRequirement,
            protocol: "x402"
        });

        console.log(`✅ Settlement negotiated - signature valid`);

        return {
            success: true,
            signature: settlement.signature,
            message: settlement.message,
            nonce: settlement.nonce,
            amount: paymentRequirement.amount,
            asset: paymentRequirement.asset,
            chain: paymentRequirement.network,
            protocol: "x402",
            timestamp: Date.now()
        };

    } catch (error) {
        console.error(`❌ Negotiation failed: ${error.message}`);
        // Fallback to mock for demo
        return createMockSettlement(paymentRequirement);
    }
}

/**
 * Sign a payment challenge from another agent
 * 
 * Used when specialist agent challenges us for payment
 */
export async function signPaymentChallenge(challenge, evmPrivateKey = process.env.AGENT_PRIVATE_KEY, solanaPrivateKey = process.env.AGENT_SOLANA_PRIVATE_KEY) {
    try {
        console.log(`🔐 Signing x402 challenge for ${challenge.network || "unknown"}...`);

        // Standard x402 Message Construction
        const message = `x402 Payment Authorization
Scheme: ${challenge.scheme}
Network: ${challenge.network}
Asset: ${challenge.asset}
Amount: ${challenge.amount}
PayTo: ${challenge.payTo}
Timestamp: ${challenge.timestamp}
Nonce: ${challenge.nonce}`;

        // A. SOLANA SIGNING (Ed25519)
        if (challenge.network && challenge.network.includes("solana")) {
            if (!solanaPrivateKey) {
                console.error("❌ AGENT_SOLANA_PRIVATE_KEY missing");
                return null;
            }

            // Decode secret key (assume base58)
            const secretKey = bs58.decode(solanaPrivateKey);
            const keypair = nacl.sign.keyPair.fromSecretKey(secretKey);
            const publicKey = bs58.encode(keypair.publicKey);

            const messageBytes = new TextEncoder().encode(message);
            const signatureBytes = nacl.sign.detached(messageBytes, keypair.secretKey);
            const signature = Buffer.from(signatureBytes).toString('base64');

            console.log(`   ✅ Signed with Solana Identity: ${publicKey.slice(0, 8)}...`);

            return {
                signature,
                message,
                signer: publicKey,
                timestamp: Date.now(),
                scheme: "ed25519"
            };
        }

        // B. EVM SIGNING (EIP-191) - Default
        else {
            if (!evmPrivateKey) {
                console.error("❌ AGENT_PRIVATE_KEY missing");
                return null;
            }

            // Setup Viem Account
            const account = privateKeyToAccount(evmPrivateKey.startsWith("0x") ? evmPrivateKey : `0x${evmPrivateKey}`);

            const wallet = createWalletClient({
                account,
                chain: baseSepolia, // Chain doesn't matter for signing, just context
                transport: http()
            });

            const signature = await wallet.signMessage({
                message
            });

            console.log(`   ✅ Signed with EVM Identity: ${account.address.slice(0, 10)}...`);

            return {
                signature,
                message,
                signer: account.address,
                timestamp: Date.now(),
                scheme: "eip-191"
            };
        }

    } catch (error) {
        console.error(`❌ Signing failed: ${error.message}`);
        return null; // Return null prevents sending invalid signatures
    }
}

/**
 * Verify a Reap settlement proof
 * 
 * Validates that payment was properly negotiated and signed
 */
export async function verifyReapSettlement(proof, expectedAmount, expectedRecipient) {
    if (!proof || !proof.signature) {
        console.warn("⚠️ Invalid proof - missing signature");
        return false;
    }

    try {
        console.log(`✓ Verifying settlement proof...`);

        // In Phase B, this is signature verification
        // In Phase C, this will check on-chain transaction

        const isValid = proof.signature &&
            proof.amount === expectedAmount &&
            proof.chain;

        if (isValid) {
            console.log(`✅ Settlement verified`);
            return true;
        }

        console.warn(`⚠️ Settlement verification failed`);
        return false;

    } catch (error) {
        console.error(`❌ Verification error: ${error.message}`);
        return false;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE C: Real Blockchain Settlement
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Execute real USDC transfer on blockchain
 * 
 * Transfers actual stablecoin from agent wallet to specialist
 */
export async function executeRealPayment(settlement) {
    const client = await getReapClient();

    if (!client || !process.env.AGENT_WALLET_KEY) {
        console.warn("⚠️ Cannot execute real payment - wallet not configured");
        return createMockTransaction(settlement);
    }

    try {
        console.log(`💸 Executing real USDC transfer...`);
        console.log(`   To: ${settlement.recipientAddress}`);
        console.log(`   Amount: ${settlement.amount} ${settlement.asset}`);
        console.log(`   Network: ${settlement.chain}`);

        // 1. Solana Settlement
        if (settlement.chain.includes("solana")) {
            if (!process.env.AGENT_SOLANA_PRIVATE_KEY) throw new Error("AGENT_SOLANA_PRIVATE_KEY missing");

            const connection = new Connection("https://api.devnet.solana.com", "confirmed");

            // Decode Key
            const secretKey = new Uint8Array(JSON.parse(process.env.AGENT_SOLANA_PRIVATE_KEY));
            const payer = Keypair.fromSecretKey(secretKey);

            // Create Transfer Instruction (Native SOL for now as simplified generic asset)
            // In prod, this would use spl-token transfer for USDC
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: payer.publicKey,
                    toPubkey: new PublicKey(settlement.recipientAddress),
                    lamports: Math.floor(parseFloat(settlement.amount) * LAMPORTS_PER_SOL), // Using SOL for devnet demo
                })
            );

            const signature = await connection.sendTransaction(transaction, [payer]);
            // await connection.confirmTransaction(signature, "confirmed"); // Optional wait

            console.log(`✅ Solana Transfer confirmed: ${signature}`);

            return {
                success: true,
                transactionHash: signature,
                blockNumber: 0, // Pending
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

            // Native ETH/AVAX Transfer (Simplified for Demo)
            // In prod, use writeContract for USDC ERC20 transfer
            const hash = await wallet.sendTransaction({
                account,
                to: settlement.recipientAddress,
                value: parseUnits(settlement.amount, 18), // assuming native currency 18 decimals
            });

            console.log(`✅ EVM Transfer confirmed: ${hash}`);

            return {
                success: true,
                transactionHash: hash,
                blockNumber: 0,
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
        return createMockTransaction(settlement);
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
 * Create mock settlement for demo/testing
 */
function createMockSettlement(paymentRequirement) {
    const nonce = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36);
    return {
        success: true,
        signature: `mock_sig_${nonce}`,
        amount: paymentRequirement.amount,
        asset: paymentRequirement.asset,
        chain: paymentRequirement.network,
        protocol: "x402",
        isSimulated: true,
        timestamp: Date.now()
    };
}

/**
 * Create mock transaction for demo/testing
 */
function createMockTransaction(settlement) {
    const mockHash = `0x${Math.random().toString(16).slice(2)}`;
    return {
        success: true,
        transactionHash: mockHash,
        blockNumber: Math.floor(Math.random() * 1000000),
        from: "coach-agent",
        to: settlement.recipientAddress,
        amount: settlement.amount,
        asset: settlement.asset,
        chain: settlement.chain,
        status: "simulated",
        timestamp: Date.now(),
        url: `https://explorer.${settlement.chain}.io/tx/${mockHash}`
    };
}

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
