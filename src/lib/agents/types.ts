export type AgentCapability =
    | "fitness_analysis"
    | "nutrition_planning"
    | "massage_booking"
    | "calendar_coordination"
    | "benchmark_analysis";

export interface AgentPricing {
    baseFee: string; // USDC amount string (e.g. "0.05")
    asset: string;   // Token address or symbol
    chain: string;   // "base-sepolia" | "avalanche-c-chain" | "solana-devnet"
}

export interface AgentProfile {
    id: string;
    name: string;
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
