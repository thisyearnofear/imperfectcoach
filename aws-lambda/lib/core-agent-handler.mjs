/**
 * Core Agent Handler
 * 
 * Manages communication with CORE_AGENTS (Fitness Coach, Nutrition, Recovery)
 * Handles x402 payment negotiation and SLA tracking
 * 
 * Used by Bedrock's call_specialist_agent tool
 */

import { CORE_AGENTS } from "./reap-integration.mjs";
import { verifyMessage, formatUnits } from "viem";
import { base, baseSepolia, avalancheFuji } from "viem/chains";

// ─────────────────────────────────────────────────────────────────────────────
// Agent Discovery & Selection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find agents matching a capability from CORE_AGENTS
 * 
 * Sorted by reputation (highest first)
 */
export function findAgentsByCapability(capability) {
  console.log(`🔍 Searching CORE_AGENTS for capability: ${capability}`);

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
 * Get all CORE_AGENTS
 */
export function getAllAgents() {
  return CORE_AGENTS;
}

// ─────────────────────────────────────────────────────────────────────────────
// x402 Payment Verification & Settlement
// ─────────────────────────────────────────────────────────────────────────────

// Network-specific configurations
const NETWORK_CONFIGS = {
  "base-sepolia": {
    chain: baseSepolia,
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    explorerUrl: "https://base-sepolia.blockscout.com",
  },
  "base-mainnet": {
    chain: base,
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    explorerUrl: "https://basescan.org",
  },
  "avalanche-fuji": {
    chain: avalancheFuji,
    usdcAddress: "0x5425890298aed601595a70AB815c96711a31Bc65",
    explorerUrl: "https://testnet.snowtrace.io",
  },
};

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

    // Verify signature recovers to claimed payer address
    const isValid = await verifyMessage({
      address: decoded.payerAddress,
      message: decoded.message,
      signature: decoded.signature,
    });

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
 * Simulate x402 payment to a specialist agent (legacy/fallback)
 * 
 * For demo mode or when verification fails gracefully.
 * In production, use verifyX402Signature + executeRealPayment.
 */
export async function simulateX402Payment(specialist, amount, network = "base-sepolia") {
  console.log(`\n💳 Simulating x402 payment to ${specialist.name}`);
  console.log(`   Amount: ${amount} USDC`);
  console.log(`   Network: ${network}`);

  // Simulate payment processing time (50-200ms)
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 150 + 50));

  // Generate mock transaction hash
  const txHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
  const config = NETWORK_CONFIGS[network] || NETWORK_CONFIGS["base-sepolia"];

  const proof = {
    success: true,
    transactionHash: txHash,
    amount,
    network,
    recipient: specialist.walletAddress || specialist.id,
    timestamp: Date.now(),
    status: "simulated", // Mark as simulated
    isSimulated: true,
    blockExplorer: `${config.explorerUrl}/tx/${txHash}`,
  };

  console.log(`   ⚠️ Payment SIMULATED (not on-chain)`);
  console.log(`      TX: ${txHash}`);

  return proof;
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
    // In demo mode, we can still proceed with simulation
    if (process.env.DEMO_MODE === "true" || process.env.NODE_ENV === "development") {
      console.log(`   📌 Demo mode: Falling back to simulated payment`);
      return simulateX402Payment(specialist, amount, network);
    }
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
  simulateX402Payment,
  verifyAndSettleX402Payment,
  // Agent execution
  callSpecialistEndpoint,
  calculateSLAPerformance,
  recordAgentPayment,
};
