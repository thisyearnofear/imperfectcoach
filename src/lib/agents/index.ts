/**
 * Agent Library
 *
 * Organized agent-related types, profiles, and registry for agent discovery.
 * Single source of truth for agent economy operations.
 */

// Types: All agent-related interfaces
export * from './types';

// Profiles: Hardcoded agent profiles and economy context
export {
    AGENT_PROFILES,
    TRADITIONAL_COSTS,
    AGENT_ECONOMY_VALUE,
    AGENT_PROCESSING_MESSAGES,
    getAgentProfilesList,
    getSpecialistAgents,
    calculateTotalCost,
    createInitialCoordinationState,
    getRandomProcessingMessage,
    formatNetworkName,
    getNetworkRoutingReason,
} from './profiles';

// Registry: Agent discovery and registry operations
export { AgentRegistry } from './registry';

// Service Tiers: SLA and tier definitions
export * from './service-tiers';

// Enhanced Agent Economy: Advanced orchestration integrated into existing components
// PRINCIPLE: AGGRESSIVE CONSOLIDATION - Using enhanced profiles instead of separate files
export * from './kestra-orchestrator';
export * from './oumi-integration';
export * from './enhanced-orchestrator';
export * from './real-payments';
export * from './marketplace';

// Analysis Transformation: Converts raw JSON to structured data for visualization
export * from './analysis-transformer';
