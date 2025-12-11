/**
 * CORE_AGENTS - Single Source of Truth
 * 
 * Mirrors backend CORE_AGENTS from aws-lambda/lib/reap-integration.mjs
 * Used for frontend display, pricing, and agent coordination UI
 * 
 * PRINCIPLE: DRY - Keep in sync with backend definition
 */

export interface CoreAgent {
  id: string;
  name: string;
  emoji: string;
  role: "coordinator" | "specialist" | "utility";
  description: string;
  capabilities: string[];
  endpoint: string;
  reputationScore: number;
  successRate: number;
  location: string;
  pricing: Record<string, { baseFee: string; asset: string; chain: string }>;
  tieredPricing?: Record<
    string,
    Record<string, { baseFee: string; asset: string; chain: string }>
  >;
}

export const CORE_AGENTS: CoreAgent[] = [
  {
    id: "agent-fitness-core-01",
    name: "Fitness Coach",
    emoji: "💪",
    role: "coordinator",
    description: "Primary fitness analysis agent using Bedrock Nova Lite.",
    location: "EU-North-1",
    capabilities: ["fitness_analysis", "benchmark_analysis"],
    endpoint: "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout",
    reputationScore: 98,
    successRate: 0.98,
    pricing: {
      fitness_analysis: { baseFee: "0.05", asset: "USDC", chain: "base-sepolia" },
      benchmark_analysis: { baseFee: "0.02", asset: "USDC", chain: "base-sepolia" },
    },
    tieredPricing: {
      fitness_analysis: {
        basic: { baseFee: "0.02", asset: "USDC", chain: "base-sepolia" },
        pro: { baseFee: "0.05", asset: "USDC", chain: "base-sepolia" },
        premium: { baseFee: "0.10", asset: "USDC", chain: "base-sepolia" },
      },
    },
  },
  {
    id: "agent-nutrition-planner-01",
    name: "Nutrition Planner",
    emoji: "🥗",
    role: "specialist",
    description: "Specialized in post-workout nutrition plans.",
    location: "US-West-2",
    capabilities: ["nutrition_planning"],
    endpoint: "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/nutrition-agent",
    reputationScore: 95,
    successRate: 0.95,
    pricing: {
      nutrition_planning: { baseFee: "0.03", asset: "USDC", chain: "base-sepolia" },
    },
    tieredPricing: {
      nutrition_planning: {
        basic: { baseFee: "0.01", asset: "USDC", chain: "base-sepolia" },
        pro: { baseFee: "0.025", asset: "USDC", chain: "base-sepolia" },
        premium: { baseFee: "0.05", asset: "USDC", chain: "base-sepolia" },
      },
    },
  },
  {
    id: "agent-recovery-planner-01",
    name: "Recovery Planner",
    emoji: "😴",
    role: "specialist",
    description: "Specialized in recovery optimization, sleep, and fatigue management.",
    location: "EU-West-1",
    capabilities: ["recovery_planning"],
    endpoint: "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/recovery-agent",
    reputationScore: 94,
    successRate: 0.94,
    pricing: {
      recovery_planning: { baseFee: "0.05", asset: "USDC", chain: "base-sepolia" },
    },
    tieredPricing: {
      recovery_planning: {
        basic: { baseFee: "0.02", asset: "USDC", chain: "base-sepolia" },
        pro: { baseFee: "0.05", asset: "USDC", chain: "base-sepolia" },
        premium: { baseFee: "0.10", asset: "USDC", chain: "base-sepolia" },
      },
    },
  },
  {
    id: "agent-biomechanics-01",
    name: "Biomechanics Analyst",
    emoji: "🏋️",
    role: "specialist",
    description: "Deep form analysis and movement quality assessment using pose data.",
    location: "US-East-1",
    capabilities: ["biomechanics_analysis"],
    endpoint: "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/biomechanics-agent",
    reputationScore: 96,
    successRate: 0.96,
    pricing: {
      biomechanics_analysis: { baseFee: "0.08", asset: "USDC", chain: "base-sepolia" },
    },
    tieredPricing: {
      biomechanics_analysis: {
        basic: { baseFee: "0.04", asset: "USDC", chain: "base-sepolia" },
        pro: { baseFee: "0.08", asset: "USDC", chain: "base-sepolia" },
        premium: { baseFee: "0.15", asset: "USDC", chain: "base-sepolia" },
      },
    },
  },
];

/**
 * Get agent by ID
 */
export function getAgent(agentId: string): CoreAgent | undefined {
  return CORE_AGENTS.find((a) => a.id === agentId);
}

/**
 * Get agents by capability
 */
export function getAgentsByCapability(capability: string): CoreAgent[] {
  return CORE_AGENTS.filter((a) => a.capabilities.includes(capability)).sort(
    (a, b) => b.reputationScore - a.reputationScore
  );
}

/**
 * Get all specialist agents (exclude coordinator)
 */
export function getSpecialists(): CoreAgent[] {
  return CORE_AGENTS.filter((a) => a.role === "specialist");
}

/**
 * Get specialist agents called in a typical flow
 * (Used for progress visualization)
 */
export function getTypicalSpecialistSequence(): CoreAgent[] {
  return getSpecialists().sort((a, b) => b.reputationScore - a.reputationScore);
}
