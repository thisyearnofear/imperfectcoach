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
        "https://r03m1wznai.execute-api.eu-north-1.amazonaws.com/prod/agents",
} as const;

// Network Configuration
export const NETWORKS = {
    BASE_MAINNET: "base-mainnet",
    BASE_SEPOLIA: "base-sepolia",
    AVALANCHE_MAINNET: "avalanche-mainnet",
    AVALANCHE_FUJI: "avalanche-fuji",
    SOLANA_DEVNET: "solana-devnet",
} as const;

// Chain ID mappings for EVM networks
export const CHAIN_IDS = {
    BASE_MAINNET: 8453,
    BASE_SEPOLIA: 84532,
    AVALANCHE_MAINNET: 43114,
    AVALANCHE_FUJI: 43113,
} as const;

// Visual configuration for chains (colors, display)
export const CHAIN_COLORS = {
    [CHAIN_IDS.BASE_SEPOLIA]: {
        name: 'blue',
        displayName: 'Base',
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-200',
    },
    [CHAIN_IDS.AVALANCHE_FUJI]: {
        name: 'red',
        displayName: 'Avalanche',
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-200',
    },
} as const;

// Supported networks - single source of truth
export const SUPPORTED_EVM_NETWORKS = {
    [CHAIN_IDS.BASE_SEPOLIA]: {
        name: "Base Sepolia",
        networkKey: NETWORKS.BASE_SEPOLIA,
        status: "supported" as const,
        features: ["leaderboards", "passport", "agents"],
        description: "Testnet - all features available",
    },
    [CHAIN_IDS.AVALANCHE_FUJI]: {
        name: "Avalanche Fuji",
        networkKey: NETWORKS.AVALANCHE_FUJI,
        status: "supported" as const,
        features: ["agents"],
        description: "Testnet - agent services available",
    },
    [CHAIN_IDS.AVALANCHE_MAINNET]: {
        name: "Avalanche C-Chain",
        networkKey: NETWORKS.AVALANCHE_MAINNET,
        status: "coming_soon" as const,
        features: ["leaderboards", "passport", "agents"],
        description: "Mainnet support launching Q1 2025",
    },
    [CHAIN_IDS.BASE_MAINNET]: {
        name: "Base Mainnet",
        networkKey: NETWORKS.BASE_MAINNET,
        status: "coming_soon" as const,
        features: ["leaderboards", "passport", "agents"],
        description: "Mainnet support launching Q1 2025",
    },
} as const;

// Default network (can be overridden via env)
export const DEFAULT_NETWORK = import.meta.env.VITE_DEFAULT_NETWORK || NETWORKS.BASE_SEPOLIA;

// Feature flags
export const FEATURES = {
    ENABLE_PREMIUM_ANALYSIS: import.meta.env.VITE_ENABLE_PREMIUM !== "false",
    ENABLE_AGENT_DISCOVERY: import.meta.env.VITE_ENABLE_DISCOVERY !== "false",
    ENABLE_MULTI_NETWORK: import.meta.env.VITE_ENABLE_MULTI_NETWORK !== "false",
} as const;

// Network utilities
export const isNetworkSupported = (chainId: number): boolean => {
    return chainId in SUPPORTED_EVM_NETWORKS;
};

export const getNetworkConfig = (chainId: number) => {
    return SUPPORTED_EVM_NETWORKS[chainId as keyof typeof SUPPORTED_EVM_NETWORKS];
};

export const getAvailableSupportedNetworks = () => {
    return Object.entries(SUPPORTED_EVM_NETWORKS)
        .filter(([_, config]) => config.status === "supported")
        .map(([chainId, config]) => ({ chainId: parseInt(chainId), ...config }));
};

/**
 * Get block explorer URL for a transaction on a given chain
 */
export const getExplorerUrl = (txHash: string, chainId?: number): string => {
    const id = chainId || CHAIN_IDS.BASE_SEPOLIA;
    
    switch (id) {
        case CHAIN_IDS.BASE_SEPOLIA:
            return `https://sepolia.basescan.org/tx/${txHash}`;
        case CHAIN_IDS.BASE_MAINNET:
            return `https://basescan.org/tx/${txHash}`;
        case CHAIN_IDS.AVALANCHE_FUJI:
            return `https://testnet.snowscan.xyz/tx/${txHash}`;
        case CHAIN_IDS.AVALANCHE_MAINNET:
            return `https://snowscan.xyz/tx/${txHash}`;
        default:
            return `https://sepolia.basescan.org/tx/${txHash}`; // fallback to Base Sepolia
    }
};
