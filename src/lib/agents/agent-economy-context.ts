/**
 * Agent Economy Context
 * 
 * Static definitions of available agents in the economy.
 * This serves as the single source of truth for agent information
 * used across the UI for visualization and cost breakdowns.
 */

import { AgentEconomyProfile, AgentCoordinationResult, AgentContribution, ContributionStatus } from './types';

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
    },
    recovery: {
        id: 'agent-recovery',
        name: 'Recovery Specialist',
        emoji: '💆',
        role: 'specialist',
        description: 'Recommends rest periods and active recovery protocols',
        baseCost: '0.01',
        capability: 'recovery_planning',
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
