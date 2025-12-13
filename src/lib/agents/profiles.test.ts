/**
 * Agent Profiles Enhanced Capabilities Tests
 * Tests for Core Principles implementation
 */

import { 
    DEFAULT_FEATURE_FLAGS, 
    AGENT_PROFILES, 
    canUseEnhancedCoordination, 
    getAgentEnhancedCapabilities,
    checkEnhancedSystemHealth 
} from './profiles';

describe('Agent Profiles - Core Principles Implementation', () => {
    
    describe('ENHANCEMENT FIRST: Extended Existing Components', () => {
        it('should have enhanced capabilities in existing agent profiles', () => {
            const fitnessCoach = AGENT_PROFILES.fitness_coach;
            const biomechanics = AGENT_PROFILES.biomechanics;
            const recovery = AGENT_PROFILES.recovery;

            // Verify enhanced capabilities are added to existing agents
            expect(fitnessCoach).toHaveProperty('supportsKestraSynthesis');
            expect(biomechanics).toHaveProperty('supportsOumiEnhancement');
            expect(recovery).toHaveProperty('supportsKestraSynthesis');
            
            // Verify existing properties are preserved
            expect(fitnessCoach).toHaveProperty('id', 'agent-fitness-core');
            expect(biomechanics).toHaveProperty('capability', 'biomechanics_analysis');
        });

        it('should maintain backward compatibility', () => {
            const nutrition = AGENT_PROFILES.nutrition;
            
            // Agents without enhancements should still work
            expect(nutrition).toHaveProperty('id');
            expect(nutrition).toHaveProperty('name');
            expect(nutrition).toHaveProperty('capability');
            // No enhanced capabilities required
        });
    });

    describe('AGGRESSIVE CONSOLIDATION: Feature Flags', () => {
        it('should have centralized feature flag management', () => {
            expect(DEFAULT_FEATURE_FLAGS).toHaveProperty('enableKestraOrchestration');
            expect(DEFAULT_FEATURE_FLAGS).toHaveProperty('enableOumiEnhancements');
            expect(DEFAULT_FEATURE_FLAGS).toHaveProperty('enableRealPayments');
            expect(DEFAULT_FEATURE_FLAGS).toHaveProperty('enableAgentMarketplace');
            expect(DEFAULT_FEATURE_FLAGS).toHaveProperty('fallbackToLegacy');
        });

        it('should read feature flags from environment variables', () => {
            // Mock environment variables
            process.env.ENABLE_KESTRA_ORCHESTRATION = 'true';
            process.env.ENABLE_OUMI_ENHANCEMENTS = 'false';

            // Reload module to pick up new env vars
            const { DEFAULT_FEATURE_FLAGS: updatedFlags } = require('./profiles');
            
            expect(updatedFlags.enableKestraOrchestration).toBe(true);
            expect(updatedFlags.enableOumiEnhancements).toBe(false);
            
            // Clean up
            delete process.env.ENABLE_KESTRA_ORCHESTRATION;
            delete process.env.ENABLE_OUMI_ENHANCEMENTS;
        });
    });

    describe('DRY: Single Source of Truth', () => {
        it('should provide single function for capability checking', () => {
            const canUse = canUseEnhancedCoordination();
            expect(typeof canUse).toBe('boolean');
        });

        it('should provide single function for agent capability lookup', () => {
            const capabilities = getAgentEnhancedCapabilities('agent-fitness-core');
            
            expect(capabilities).toHaveProperty('supportsKestraSynthesis');
            expect(capabilities).toHaveProperty('supportsOumiEnhancement');
            expect(capabilities).toHaveProperty('supportsRealPayments');
        });
    });

    describe('CLEAN: Separation of Concerns', () => {
        it('should have clear function responsibilities', () => {
            // canUseEnhancedCoordination - checks overall capability
            expect(typeof canUseEnhancedCoordination()).toBe('boolean');
            
            // getAgentEnhancedCapabilities - gets specific agent capabilities
            const caps = getAgentEnhancedCapabilities('agent-biomechanics');
            expect(caps).toBeDefined();
            
            // checkEnhancedSystemHealth - checks runtime health
            expect(typeof checkEnhancedSystemHealth()).toBe('object');
        });
    });

    describe('MODULAR: Composable Features', () => {
        it('should allow overriding feature flags', () => {
            const customFlags = {
                enableKestraOrchestration: true,
                enableOumiEnhancements: true
            };
            
            const result = canUseEnhancedCoordination(customFlags);
            expect(result).toBe(true);
        });

        it('should handle missing agent gracefully', () => {
            const capabilities = getAgentEnhancedCapabilities('non-existent-agent');
            
            // Should return default capabilities, not throw
            expect(capabilities.supportsKestraSynthesis).toBe(false);
            expect(capabilities.supportsOumiEnhancement).toBe(false);
        });
    });

    describe('PERFORMANT: Caching and Optimization', () => {
        it('should cache health check results', async () => {
            // Mock fetch
            global.fetch = jest.fn(() => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({})
                })
            );

            // First call
            const firstResult = await checkEnhancedSystemHealth();
            expect(global.fetch).toHaveBeenCalled();
            
            // Second call should use cache
            const secondResult = await checkEnhancedSystemHealth();
            // Fetch should not be called again (cached)
            expect(global.fetch).toHaveBeenCalledTimes(1);
            
            // Results should be identical
            expect(firstResult).toEqual(secondResult);
        });

        it('should handle health check failures gracefully', async () => {
            // Mock failed fetch
            global.fetch = jest.fn(() => 
                Promise.reject(new Error('Network error'))
            );

            // Should not throw, just return unavailable status
            const result = await checkEnhancedSystemHealth();
            
            expect(result.kestraAvailable).toBe(false);
            expect(result.oumiAvailable).toBe(false);
            expect(result.recommendations).toContain('connection failed');
        });
    });

    describe('ORGANIZED: Domain-Driven Design', () => {
        it('should maintain consistent agent profile structure', () => {
            const agents = Object.values(AGENT_PROFILES);
            
            agents.forEach(agent => {
                // All agents should have core properties
                expect(agent).toHaveProperty('id');
                expect(agent).toHaveProperty('name');
                expect(agent).toHaveProperty('role');
                expect(agent).toHaveProperty('capability');
                
                // Enhanced capabilities are optional
                if (agent.supportsKestraSynthesis) {
                    expect(agent).toHaveProperty('kestraConfig');
                }
                if (agent.supportsOumiEnhancement) {
                    expect(agent).toHaveProperty('oumiConfig');
                }
            });
        });
    });

    describe('Core Principles Integration', () => {
        it('should demonstrate ENHANCEMENT FIRST principle', () => {
            // Existing agents are enhanced, not replaced
            const fitnessCoach = AGENT_PROFILES.fitness_coach;
            expect(fitnessCoach).toHaveProperty('supportsKestraSynthesis');
            expect(fitnessCoach).toHaveProperty('kestraConfig');
            
            // Original properties preserved
            expect(fitnessCoach.role).toBe('coordinator');
            expect(fitnessCoach.capability).toBe('fitness_analysis');
        });

        it('should demonstrate AGGRESSIVE CONSOLIDATION principle', () => {
            // All capabilities in single module
            expect(DEFAULT_FEATURE_FLAGS).toBeDefined();
            expect(canUseEnhancedCoordination).toBeDefined();
            expect(getAgentEnhancedCapabilities).toBeDefined();
            expect(checkEnhancedSystemHealth).toBeDefined();
            
            // All in the same file (profiles.ts)
        });

        it('should demonstrate DRY principle', () => {
            // Single source for agent capabilities
            const caps1 = getAgentEnhancedCapabilities('agent-fitness-core');
            const caps2 = getAgentEnhancedCapabilities('agent-fitness-core');
            
            expect(caps1).toEqual(caps2);
        });

        it('should demonstrate CLEAN principle', () => {
            // Clear separation: feature flags vs agent capabilities vs health checks
            expect(typeof DEFAULT_FEATURE_FLAGS).toBe('object');
            expect(typeof canUseEnhancedCoordination).toBe('function');
            expect(typeof getAgentEnhancedCapabilities).toBe('function');
            expect(typeof checkEnhancedSystemHealth).toBe('function');
        });

        it('should demonstrate MODULAR principle', () => {
            // Functions can be used independently
            expect(() => canUseEnhancedCoordination()).not.toThrow();
            expect(() => getAgentEnhancedCapabilities('agent-fitness-core')).not.toThrow();
            expect(() => checkEnhancedSystemHealth()).not.toThrow();
        });

        it('should demonstrate PERFORMANT principle', () => {
            // Health checks are async and cached
            expect(checkEnhancedSystemHealth()).toBeInstanceOf(Promise);
        });

        it('should demonstrate ORGANIZED principle', () => {
            // All agent-related functionality in profiles module
            expect(AGENT_PROFILES).toBeDefined();
            expect(DEFAULT_FEATURE_FLAGS).toBeDefined();
            expect(canUseEnhancedCoordination).toBeDefined();
        });
    });
});