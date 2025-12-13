/**
 * Agent Profiles & Economy Context - ENHANCED
 *
 * Single source of truth for agent economy with enhanced capabilities:
 * - Agent profile information used in UI
 * - Cost calculations and value comparisons
 * - Processing messages during agent coordination
 * - Kestra AI orchestration configuration
 * - Oumi model enhancement capabilities
 * - Feature flag management
 *
 * PRINCIPLE: ENHANCEMENT FIRST - Extending existing system rather than creating parallel structures
 * PRINCIPLE: DRY - Single source of truth for all agent capabilities
 */

import { AgentEconomyProfile, AgentCoordinationResult, AgentContribution, ContributionStatus } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Feature Flags - Centralized configuration for enhanced capabilities
// ─────────────────────────────────────────────────────────────────────────────

interface AgentEconomyFeatureFlags {
  enableKestraOrchestration: boolean;
  enableOumiEnhancements: boolean;
  enableRealPayments: boolean;
  enableAgentMarketplace: boolean;
  fallbackToLegacy: boolean;
}

// Default feature flags with safe defaults
// PRINCIPLE: CLEAN - Explicit configuration with sensible defaults
export const DEFAULT_FEATURE_FLAGS: AgentEconomyFeatureFlags = {
  enableKestraOrchestration: process.env.ENABLE_KESTRA_ORCHESTRATION === 'true',
  enableOumiEnhancements: process.env.ENABLE_OUMI_ENHANCEMENTS === 'true',
  enableRealPayments: process.env.ENABLE_REAL_X402_PAYMENTS === 'true',
  enableAgentMarketplace: true, // Marketplace is safer to enable by default
  fallbackToLegacy: true // Always have fallback for production safety
};

// ─────────────────────────────────────────────────────────────────────────────
// Enhanced Agent Capabilities - Extending existing profiles
// ─────────────────────────────────────────────────────────────────────────────

interface EnhancedAgentCapabilities {
  supportsKestraSynthesis?: boolean;
  supportsOumiEnhancement?: boolean;
  supportsRealPayments?: boolean;
  kestraConfig?: {
    synthesisQuality: 'basic' | 'advanced' | 'expert';
    maxTokens: number;
    temperature: number;
  };
  oumiConfig?: {
    modelType: 'language' | 'vision-language';
    enhancementLevel: 'light' | 'medium' | 'heavy';
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent Profiles - The specialists that coordinate for each request
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Agent Profiles - The specialists that coordinate for each request
// ─────────────────────────────────────────────────────────────────────────────

export const AGENT_PROFILES: Record<string, AgentEconomyProfile> = {
    fitness_coach: {
        id: 'agent-fitness-core',
        name: 'Fitness Coach',
        emoji: '🏋️',
        role: 'coordinator',
        description: 'Coordinates specialists and synthesizes personalized insights',
        baseCost: '0.04',
        capability: 'fitness_analysis',
        // PRINCIPLE: ENHANCEMENT FIRST - Adding Kestra orchestration to coordinator
        supportsKestraSynthesis: true,
        supportsRealPayments: true,
        kestraConfig: {
            synthesisQuality: 'expert',
            maxTokens: 4096,
            temperature: 0.2
        }
    },
    nutrition: {
        id: 'agent-nutrition',
        name: 'Nutrition Advisor',
        emoji: '🥗',
        role: 'specialist',
        description: 'Analyzes protein and calorie needs for optimal recovery',
        baseCost: '0.03',
        capability: 'nutrition_planning',
    },
    biomechanics: {
        id: 'agent-biomechanics',
        name: 'Biomechanics Expert',
        emoji: '🦴',
        role: 'specialist',
        description: 'Evaluates joint angles and movement efficiency',
        baseCost: '0.02',
        capability: 'biomechanics_analysis',
        // PRINCIPLE: ENHANCEMENT FIRST - Adding Oumi VLM enhancement for pose analysis
        supportsOumiEnhancement: true,
        oumiConfig: {
            modelType: 'vision-language',
            enhancementLevel: 'heavy'
        }
    },
    recovery: {
        id: 'agent-recovery',
        name: 'Recovery Specialist',
        emoji: '💆',
        role: 'specialist',
        description: 'Recommends rest periods and active recovery protocols',
        baseCost: '0.01',
        capability: 'recovery_planning',
        // PRINCIPLE: ENHANCEMENT FIRST - Adding capabilities to existing agent
        supportsKestraSynthesis: true,
        supportsOumiEnhancement: true,
        kestraConfig: {
            synthesisQuality: 'advanced',
            maxTokens: 2048,
            temperature: 0.3
        },
        oumiConfig: {
            modelType: 'language',
            enhancementLevel: 'medium'
        }
    },
    calendar: {
        id: 'agent-calendar',
        name: 'Schedule Coordinator',
        emoji: '📅',
        role: 'utility',
        description: 'Optimizes workout timing for maximum results',
        baseCost: '0.00',
        capability: 'calendar_coordination',
    },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Cost Comparison - Traditional vs Agent Economy
// ─────────────────────────────────────────────────────────────────────────────

export const TRADITIONAL_COSTS = {
    personal_trainer: 75,      // Per session
    nutritionist: 100,         // Per consultation
    physical_therapist: 150,   // Per session
    massage_therapist: 80,     // Per session
    sports_coach: 60,          // Per session
    total_monthly: 900,        // Estimated monthly cost for regular use
} as const;

export const AGENT_ECONOMY_VALUE = {
    singleSession: '350.00',   // What 5 specialists would cost
    savingsPercent: 99.97,
    userCost: '0.10',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Processing Messages - What each agent says while working
// ─────────────────────────────────────────────────────────────────────────────

export const AGENT_PROCESSING_MESSAGES: Record<string, string[]> = {
    fitness_coach: [
        'Initializing coordination...',
        'Analyzing workout data...',
        'Synthesizing specialist insights...',
        'Generating personalized plan...',
    ],
    nutrition: [
        'Calculating protein requirements...',
        'Analyzing calorie expenditure...',
        'Generating meal recommendations...',
    ],
    biomechanics: [
        'Evaluating joint angles...',
        'Detecting movement patterns...',
        'Assessing form efficiency...',
    ],
    recovery: [
        'Analyzing muscle fatigue...',
        'Calculating recovery windows...',
        'Planning rest protocols...',
    ],
    calendar: [
        'Checking optimal workout times...',
        'Scheduling next sessions...',
    ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Enhanced Coordination Functions - Extending existing capabilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if enhanced coordination is available
 * PRINCIPLE: CLEAN - Single function for capability checking
 */
export function canUseEnhancedCoordination(flags: Partial<AgentEconomyFeatureFlags> = {}): boolean {
    const config = { ...DEFAULT_FEATURE_FLAGS, ...flags };
    return config.enableKestraOrchestration && config.enableOumiEnhancements;
}

/**
 * Get enhanced capabilities for an agent
 * PRINCIPLE: DRY - Single source for agent capability lookup
 */
export function getAgentEnhancedCapabilities(agentId: string): EnhancedAgentCapabilities {
    const agent = Object.values(AGENT_PROFILES).find(a => a.id === agentId);
    return {
        supportsKestraSynthesis: agent?.supportsKestraSynthesis || false,
        supportsOumiEnhancement: agent?.supportsOumiEnhancement || false,
        supportsRealPayments: agent?.supportsRealPayments || false,
        kestraConfig: agent?.kestraConfig,
        oumiConfig: agent?.oumiConfig
    };
}

/**
 * Check system health for enhanced features
 * PRINCIPLE: PERFORMANT - Async health checks with caching
 */
let healthCheckCache: {
    timestamp: number;
    result: {
        kestraAvailable: boolean;
        oumiAvailable: boolean;
        recommendations: string[];
    };
} | null = null;

export async function checkEnhancedSystemHealth(): Promise<{
    kestraAvailable: boolean;
    oumiAvailable: boolean;
    recommendations: string[];
}> {
    // PRINCIPLE: PERFORMANT - Cache health checks for 5 minutes
    if (healthCheckCache && (Date.now() - healthCheckCache.timestamp) < 300000) {
        return healthCheckCache.result;
    }

    const result = {
        kestraAvailable: false,
        oumiAvailable: false,
        recommendations: [] as string[]
    };

    // Only check if features are enabled
    if (DEFAULT_FEATURE_FLAGS.enableKestraOrchestration && process.env.KESTRA_API_URL) {
        try {
            const response = await fetch(`${process.env.KESTRA_API_URL}/api/v1/health`, {
                headers: {
                    'Authorization': `Bearer ${process.env.KESTRA_API_KEY}`,
                    'Timeout': '5000'
                }
            });
            result.kestraAvailable = response.ok;
            if (!result.kestraAvailable) {
                result.recommendations.push('Kestra API unavailable - check configuration');
            }
        } catch (error) {
            result.recommendations.push('Kestra connection failed - network issue');
        }
    }

    if (DEFAULT_FEATURE_FLAGS.enableOumiEnhancements && process.env.OUMI_API_KEY) {
        try {
            const response = await fetch('https://api.oumi.ai/models', {
                headers: {
                    'Authorization': `Bearer ${process.env.OUMI_API_KEY}`,
                    'Timeout': '5000'
                }
            });
            result.oumiAvailable = response.ok;
            if (!result.oumiAvailable) {
                result.recommendations.push('Oumi API unavailable - check credentials');
            }
        } catch (error) {
            result.recommendations.push('Oumi connection failed - network issue');
        }
    }

    // Cache the result
    healthCheckCache = {
        timestamp: Date.now(),
        result
    };

    return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all agent profiles as an array (for mapping in UI)
 */
export function getAgentProfilesList(): AgentEconomyProfile[] {
    return Object.values(AGENT_PROFILES);
}

/**
 * Get specialist agents only (excludes coordinator)
 */
export function getSpecialistAgents(): AgentEconomyProfile[] {
    return Object.values(AGENT_PROFILES).filter(a => a.role !== 'coordinator');
}

/**
 * Calculate total cost for all agents
 */
export function calculateTotalCost(): string {
    const total = Object.values(AGENT_PROFILES)
        .reduce((sum, agent) => sum + parseFloat(agent.baseCost), 0);
    return total.toFixed(2);
}

/**
 * Generate initial coordination state for UI
 */
export function createInitialCoordinationState(network: string = 'avalanche-c-chain'): AgentCoordinationResult {
    const profiles = Object.values(AGENT_PROFILES);
    const coordinator = profiles.find(p => p.role === 'coordinator')!;
    const specialists = profiles.filter(p => p.role !== 'coordinator');

    return {
        coordinator: {
            agentId: coordinator.id,
            agentName: coordinator.name,
            emoji: coordinator.emoji,
            role: coordinator.role,
            capability: coordinator.capability,
            cost: coordinator.baseCost,
            status: 'pending',
            chain: network,
        },
        contributors: specialists.map(s => ({
            agentId: s.id,
            agentName: s.name,
            emoji: s.emoji,
            role: s.role,
            capability: s.capability,
            cost: s.baseCost,
            status: 'pending' as ContributionStatus,
            chain: network,
        })),
        totalCost: AGENT_ECONOMY_VALUE.userCost,
        estimatedValue: AGENT_ECONOMY_VALUE.singleSession,
        savingsPercent: AGENT_ECONOMY_VALUE.savingsPercent,
        primaryNetwork: network,
        routingReason: 'Selected for speed and low fees',
        startTime: Date.now(),
        status: 'in_progress',
    };
}

/**
 * Get a random processing message for an agent
 */
export function getRandomProcessingMessage(agentKey: string): string {
    const messages = AGENT_PROCESSING_MESSAGES[agentKey] || ['Processing...'];
    return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Format network name for display
 */
export function formatNetworkName(network: string): string {
    const names: Record<string, string> = {
        'avalanche-c-chain': 'Avalanche',
        'base-sepolia': 'Base',
        'solana-devnet': 'Solana',
    };
    return names[network] || network;
}

/**
 * Get network selection reason based on conditions
 */
export function getNetworkRoutingReason(network: string): string {
    const reasons: Record<string, string> = {
        'avalanche-c-chain': 'Fastest finality today',
        'base-sepolia': 'Lowest gas fees',
        'solana-devnet': 'Optimal for micropayments',
    };
    return reasons[network] || 'Automatically selected';
}
