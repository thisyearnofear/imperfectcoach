/**
 * API Configuration
 * Centralized configuration for all API endpoints
 * Uses environment variables for flexibility across environments
 */

// Lambda/API Gateway Endpoints
export const API_ENDPOINTS = {
    // Premium Analysis (Bedrock + x402 Payment)
    PREMIUM_ANALYSIS: import.meta.env.VITE_PREMIUM_ANALYSIS_URL ||
        "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout",

    // Agent Core (Autonomous reasoning)
    AGENT_CORE: import.meta.env.VITE_AGENT_CORE_URL ||
        "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/agent-coach",

    // Agent Discovery Service
    AGENT_DISCOVERY: import.meta.env.VITE_AGENT_DISCOVERY_URL ||
        "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/discovery",
} as const;

// Network Configuration
export const NETWORKS = {
    BASE_MAINNET: "base-mainnet",
    BASE_SEPOLIA: "base-sepolia",
    AVALANCHE_MAINNET: "avalanche-mainnet",
    AVALANCHE_FUJI: "avalanche-fuji",
    SOLANA_DEVNET: "solana-devnet",
} as const;

// Default network (can be overridden via env)
export const DEFAULT_NETWORK = import.meta.env.VITE_DEFAULT_NETWORK || NETWORKS.BASE_MAINNET;

// Feature flags
export const FEATURES = {
    ENABLE_PREMIUM_ANALYSIS: import.meta.env.VITE_ENABLE_PREMIUM !== "false",
    ENABLE_AGENT_DISCOVERY: import.meta.env.VITE_ENABLE_DISCOVERY !== "false",
    ENABLE_MULTI_NETWORK: import.meta.env.VITE_ENABLE_MULTI_NETWORK !== "false",
} as const;
