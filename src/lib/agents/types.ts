export type AgentCapability =
    | "fitness_analysis"
    | "nutrition_planning"
    | "massage_booking"
    | "calendar_coordination"
    | "benchmark_analysis"
    | "biomechanics_analysis"
    | "recovery_planning";

export type AgentRole = "coordinator" | "specialist" | "utility";

export type ServiceTier = "basic" | "pro" | "premium";

export interface ServiceTierConfig {
    name: ServiceTier;
    label: string;
    description: string;
    responseTime: number; // milliseconds SLA
    features: string[];
}

export interface AgentPricing {
    baseFee: string; // USDC amount string (e.g. "0.05")
    asset: string;   // Token address or symbol
    chain: string;   // "base-sepolia" | "avalanche-c-chain" | "solana-devnet"
}

export interface TieredPricing {
    basic: AgentPricing;
    pro: AgentPricing;
    premium: AgentPricing;
}

export interface AgentServiceAvailability {
    tier: ServiceTier;
    slots: number;           // Total concurrent slots available
    slotsFilled: number;     // Currently booked
    nextAvailable: number;   // Unix timestamp
    responseSLA: number;     // milliseconds
    uptime: number;          // 0-100 percentage
}

export interface AgentProfile {
    id: string;
    name: string;
    emoji: string;
    role: AgentRole;
    description: string;
    location?: string;          // Geographic location/region (e.g., "EU-North-1")
    capabilities: AgentCapability[];
    pricing: Partial<Record<AgentCapability, AgentPricing>>;
    tieredPricing?: Partial<Record<AgentCapability, TieredPricing>>; // Phase D
    endpoint: string; // Public URL to call the agent
    status: "active" | "busy" | "offline";
    lastHeartbeat: number;
    reputationScore: number; // 0-100
    successRate?: number;      // 0-1 success rate (e.g., 0.98 = 98%)
    tags: string[];
    serviceAvailability?: Partial<Record<ServiceTier, AgentServiceAvailability>>; // Phase D
}

export interface DiscoveryQuery {
    capability?: AgentCapability;
    maxPrice?: number;
    chain?: string;
    tier?: ServiceTier;           // Phase D: Filter by service tier
    minReputation?: number;       // Phase D: Reputation filter
    maxResponseTime?: number;     // Phase D: SLA filter (milliseconds)
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
