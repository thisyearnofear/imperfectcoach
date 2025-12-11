export type AgentCapability =
    | "fitness_analysis"
    | "nutrition_planning"
    | "massage_booking"
    | "calendar_coordination"
    | "benchmark_analysis"
    | "biomechanics_analysis"
    | "recovery_planning";

export type AgentRole = "coordinator" | "specialist" | "utility";

export interface AgentPricing {
    baseFee: string; // USDC amount string (e.g. "0.05")
    asset: string;   // Token address or symbol
    chain: string;   // "base-sepolia" | "avalanche-c-chain" | "solana-devnet"
}

export interface AgentProfile {
    id: string;
    name: string;
    emoji: string;
    role: AgentRole;
    description: string;
    capabilities: AgentCapability[];
    pricing: Partial<Record<AgentCapability, AgentPricing>>;
    endpoint: string; // Public URL to call the agent
    status: "active" | "busy" | "offline";
    lastHeartbeat: number;
    reputationScore: number; // 0-100
    tags: string[];
}

export interface DiscoveryQuery {
    capability?: AgentCapability;
    maxPrice?: number;
    chain?: string;
}

export interface RegistrationRequest {
    profile: Omit<AgentProfile, "lastHeartbeat" | "reputationScore">;
    signature: string; // Proof of identity
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent Economy Types - For tracking multi-agent coordination
// ─────────────────────────────────────────────────────────────────────────────

export type ContributionStatus = 'pending' | 'discovering' | 'negotiating' | 'processing' | 'complete' | 'failed';

/**
 * Represents a single agent's contribution to a coordinated result
 */
export interface AgentContribution {
    agentId: string;
    agentName: string;
    emoji: string;
    role: AgentRole;
    capability: AgentCapability;
    cost: string;              // USDC amount (e.g., "0.03")
    status: ContributionStatus;
    statusMessage?: string;    // Human-readable status (e.g., "Analyzing protein needs...")
    result?: string;           // Summary of what the agent contributed
    chain: string;             // Which chain this was settled on
    transactionHash?: string;
    startTime?: number;
    endTime?: number;
}

/**
 * Full result of a multi-agent coordination
 */
export interface AgentCoordinationResult {
    // The coordinating agent (e.g., Fitness Coach)
    coordinator: AgentContribution;

    // Specialist agents that were consulted
    contributors: AgentContribution[];

    // Cost summary
    totalCost: string;         // Actual user cost (e.g., "0.10")
    estimatedValue: string;    // Traditional equivalent (e.g., "350.00")
    savingsPercent: number;    // e.g., 99.97

    // Network info
    primaryNetwork: string;    // e.g., "avalanche-c-chain"
    routingReason: string;     // e.g., "Selected for lowest fees"

    // Timing
    startTime: number;
    endTime?: number;

    // Overall status
    status: 'in_progress' | 'complete' | 'partial' | 'failed';
}

/**
 * Simulated agent profiles for UI demonstration
 * In production, these come from the Agent Registry
 */
export interface AgentEconomyProfile {
    id: string;
    name: string;
    emoji: string;
    role: AgentRole;
    description: string;
    baseCost: string;
    capability: AgentCapability;
}
