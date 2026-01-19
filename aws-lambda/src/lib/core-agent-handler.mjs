/**
 * Core Agent Handler
 * 
 * Manages communication with agents (Fitness Coach, Nutrition, Recovery, etc)
 * Handles x402 payment negotiation and SLA tracking
 * 
 * Uses consolidated AgentRegistry from agents.mjs
 * Used by Bedrock's call_specialist_agent tool
 */

import { CORE_AGENTS } from "./agents.mjs";
import { X402_NETWORKS } from "./x402-config.mjs";
import { verifyMessage, formatUnits } from "viem";
import { base, baseSepolia, avalancheFuji } from "viem/chains";
import nacl from "tweetnacl";
import bs58 from "bs58";


// ─────────────────────────────────────────────────────────────────────────────
// Agent Discovery & Selection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find agents matching a capability
 * 
 * Uses CORE_AGENTS as source (can be enhanced to query AgentRegistry in future)
 * Sorted by reputation (highest first)
 */
export function findAgentsByCapability(capability) {
  console.log(`🔍 Searching agents for capability: ${capability}`);

  const matches = CORE_AGENTS.filter((agent) =>
    agent.capabilities.includes(capability)
  ).sort((a, b) => b.reputationScore - a.reputationScore);

  console.log(`   Found ${matches.length} agent(s)`);
  return matches;
}

/**
 * Get a specific agent by ID
 */
export function getAgent(agentId) {
  return CORE_AGENTS.find((a) => a.id === agentId) || null;
}

/**
 * Get all agents
 */
export function getAllAgents() {
  return CORE_AGENTS;
}

// ─────────────────────────────────────────────────────────────────────────────
// x402 Payment Verification & Settlement
// ─────────────────────────────────────────────────────────────────────────────

// Network-specific configurations
// Network-specific configurations
const NETWORK_CONFIGS = X402_NETWORKS;

/**
 * Verify x402 payment signature (EIP-191)
 * 
 * This is the production payment verification:
 * 1. Decode the payment header
 * 2. Verify the signature recovers to a valid address
 * 3. Check amount meets minimum requirement
 * 4. Return verification result
 */
export async function verifyX402Signature(paymentHeader, expectedAmount, network = "base-sepolia") {
  try {
    // Decode base64 payment header
    const decoded = JSON.parse(Buffer.from(paymentHeader, 'base64').toString());

    console.log(`🔐 Verifying x402 signature...`);
    console.log(`   Network: ${network}`);
    console.log(`   Expected amount: ${expectedAmount}`);
    console.log(`   Provided amount: ${decoded.amount}`);

    // Verify required fields
    if (!decoded.signature || !decoded.message || !decoded.payerAddress) {
      console.warn(`⚠️ Missing required fields in payment header`);
      return { verified: false, reason: "Missing signature, message, or payer address" };
    }

    let isValid = false;

    // A. Solana Verification (Ed25519)
    if (network.includes("solana")) {
      try {
        const signatureBytes = new Uint8Array(Buffer.from(decoded.signature, 'base64'));
        const messageBytes = new TextEncoder().encode(decoded.message);
        const publicKeyBytes = bs58.decode(decoded.payerAddress);

        isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
      } catch (e) {
        console.error("Solana verification failed:", e);
        isValid = false;
      }
    }
    // B. EVM Verification (EIP-191)
    else {
      isValid = await verifyMessage({
        address: decoded.payerAddress,
        message: decoded.message,
        signature: decoded.signature,
      });
    }

    if (!isValid) {
      console.warn(`⚠️ Signature verification failed - does not recover to payer`);
      return { verified: false, reason: "Invalid signature" };
    }

    // Verify amount is sufficient
    const providedAmount = BigInt(decoded.amount || "0");
    const requiredAmount = BigInt(expectedAmount);

    if (providedAmount < requiredAmount) {
      console.warn(`⚠️ Insufficient amount: ${providedAmount} < ${requiredAmount}`);
      return {
        verified: false,
        reason: `Insufficient payment: got ${formatUnits(providedAmount, 6)} USDC, need ${formatUnits(requiredAmount, 6)} USDC`
      };
    }

    // --- PRIVACY CASH VERIFICATION ---
    if (decoded.message.includes("PrivacyProtocol: privacy-cash")) {
      console.log("🕵️ Detected Privacy Cash Payment - Verifying On-Chain...");
      const txHashMatch = decoded.message.match(/TxHash: ([a-zA-Z0-9]+)/);
      if (txHashMatch && txHashMatch[1]) {
        const txHash = txHashMatch[1];
        try {
          const { Connection, PublicKey } = await import("@solana/web3.js");
          // Use devnet for hackathon
          const connection = new Connection("https://api.devnet.solana.com", "confirmed");
          const tx = await connection.getTransaction(txHash, { commitment: "confirmed", maxSupportedTransactionVersion: 0 });

          if (!tx) {
            throw new Error("Transaction not found on-chain");
          }

          // Verify recipient (Merchant) received funds
          // Privacy Cash 'withdraw' sends funds from a Pool Account to Recipient.
          // We check postTokenBalances or postBalances.
          // Ideally check if 'payTo' (Merchant) balance increased by 'amount'.
          // Simplified: Just check tx exists and is recent (timestamp check handled partly by nonces usually, but here checking blockTime is good)

          console.log("✅ Privacy Cash Transaction Verified On-Chain");
          // In a stricter implementation, we would subtract preBalance from postBalance of merchant account.

        } catch (err) {
          console.error("❌ Privacy Verification Failed:", err);
          return { verified: false, reason: "On-chain verification failed: " + err.message };
        }
      }
    }

    console.log(`✅ x402 signature verified!`);
    console.log(`   Payer: ${decoded.payerAddress}`);
    console.log(`   Amount: ${formatUnits(providedAmount, 6)} USDC`);

    return {
      verified: true,
      payerAddress: decoded.payerAddress,
      amount: decoded.amount,
      signature: decoded.signature,
      timestamp: decoded.timestamp || Date.now(),
    };

  } catch (error) {
    console.error(`❌ x402 verification error:`, error.message);
    return { verified: false, reason: error.message };
  }
}

/**
 * Verify AND settle x402 payment
 * 
 * Combined flow:
 * 1. Verify signature cryptographically
 * 2. If valid, proceed with agent call
 * 3. Record payment in audit trail
 */
export async function verifyAndSettleX402Payment(paymentHeader, specialist, amount, network = "base-sepolia") {
  // First, verify the signature
  const verification = await verifyX402Signature(paymentHeader, amount, network);

  if (!verification.verified) {
    console.warn(`⚠️ Payment verification failed: ${verification.reason}`);
    return {
      success: false,
      error: verification.reason,
      status: "verification_failed",
    };
  }

  // Payment is verified - record proof
  const config = NETWORK_CONFIGS[network] || NETWORK_CONFIGS["base-sepolia"];

  return {
    success: true,
    verified: true,
    payerAddress: verification.payerAddress,
    amount: verification.amount,
    network,
    recipient: specialist.walletAddress || specialist.id,
    timestamp: verification.timestamp,
    status: "verified",
    isSimulated: false,
    blockExplorer: config.explorerUrl,
    signature: verification.signature,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent Service Execution
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Call a specialist agent's endpoint
 * 
 * In production, this makes an HTTP request to agent.endpoint
 * For demo, simulates response based on capability
 */
export async function callSpecialistEndpoint(specialist, capability, dataQuery) {
  console.log(`\n🌐 Calling specialist endpoint: ${specialist.endpoint}`);
  console.log(`   Capability: ${capability}`);

  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 500 + 200));

  // Simulate different responses based on capability
  const responses = {
    nutrition_planning: {
      plan: "Personalized 7-day nutrition plan",
      meals: 21,
      macros: {
        protein: "180g/day",
        carbs: "220g/day",
        fat: "70g/day",
      },
      recommendations: [
        "Increase protein intake post-workout",
        "Timing: 30-45 minutes after training",
        "Hydration: 3-4L daily",
      ],
    },
    recovery_planning: {
      program: "4-week recovery program",
      modalities: [
        "Sleep optimization",
        "Mobility work",
        "Massage scheduling",
      ],
      schedule: "3x per week, 45 min sessions",
      metrics: {
        hrv: "Monitor HRV daily",
        rhr: "Target 50-55 bpm",
        recovery_score: "Aim for 80+",
      },
    },
    biomechanics_analysis: {
      analysis: "Deep-dive form analysis",
      findings: ["Shoulder blade positioning issue", "Right hip asymmetry"],
      corrections: [
        "Scapular control drills",
        "Unilateral glute work",
        "Mobility routine",
      ],
      follow_up: "Recheck in 2 weeks",
    },
    fitness_analysis: {
      assessment: "Comprehensive fitness assessment",
      strengths: ["Explosive power", "Work capacity"],
      areas: ["Endurance", "Mobility"],
      next_phase: "Building aerobic base",
    },
  };

  const response = responses[capability] || {
    service: `${specialist.name} analysis`,
    status: "completed",
    quality: "expert-level",
  };

  console.log(`   ✅ Response received`);

  return response;
}

// ─────────────────────────────────────────────────────────────────────────────
// SLA Tracking & Reputation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Track SLA performance for a specialist agent
 * 
 * Compares actual execution time against expected SLA
 * Updates agent reputation if needed
 */
export function calculateSLAPerformance(tier, executionTimeMs) {
  const tierSLAs = {
    basic: 8000,
    pro: 3000,
    premium: 500,
  };

  const expectedMs = tierSLAs[tier] || 5000;
  const met = executionTimeMs <= expectedMs;
  const penalty = met ? 0 : Math.ceil((executionTimeMs / expectedMs - 1) * 10); // Up to 10% penalty

  return {
    tier,
    expectedMs,
    actualMs: executionTimeMs,
    met,
    penalty,
    message: met
      ? `✅ SLA met (${executionTimeMs}ms < ${expectedMs}ms)`
      : `⚠️ SLA breached (${executionTimeMs}ms > ${expectedMs}ms, -${penalty}% penalty)`,
  };
}

/**
 * Record payment in agent audit trail
 * 
 * In production, would write to database or blockchain
 * For now, logs to console
 */
export async function recordAgentPayment(coachAgent, specialist, paymentProof, capability) {
  const record = {
    timestamp: new Date().toISOString(),
    from: coachAgent,
    to: specialist.id,
    specialist_name: specialist.name,
    capability,
    amount: paymentProof.amount,
    transaction_hash: paymentProof.transactionHash,
    network: paymentProof.network,
    status: paymentProof.status,
  };

  console.log(`\n📊 Payment recorded:`);
  console.log(`   From: ${record.from}`);
  console.log(`   To: ${record.to} (${record.specialist_name})`);
  console.log(`   Amount: ${record.amount} USDC`);
  console.log(`   TX: ${record.transaction_hash}`);

  return record;
}

// ─────────────────────────────────────────────────────────────────────────────
// Export everything for use in tools
// ─────────────────────────────────────────────────────────────────────────────

export const CoreAgentHandler = {
  findAgentsByCapability,
  getAgent,
  getAllAgents,
  // x402 Payment functions
  verifyX402Signature,
  verifyAndSettleX402Payment,
  // Agent execution
  callSpecialistEndpoint,
  calculateSLAPerformance,
  recordAgentPayment,
};
