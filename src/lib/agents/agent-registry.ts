import { AgentProfile, DiscoveryQuery, AgentCapability, ServiceTier } from "./types";
import { API_ENDPOINTS } from "@/lib/config";

/**
 * Client-Side Registry Wrapper
 * Queries the Discovery Service to find available agents.
 * 
 * PHASE A: Integrates Reap Protocol for real agent discovery!
 * PHASE D: Adds service tier filtering and availability checks
 * Falls back to mock data if service is unavailable.
 */
export class AgentRegistry {
    /**
     * Find agents matching specific criteria
     * Phase A: Queries Reap Protocol for real specialist agents
     * Phase D: Supports tier filtering and SLA constraints
     */
    static async findAgents(query: DiscoveryQuery): Promise<AgentProfile[]> {
        try {
            const params = new URLSearchParams();
            if (query.capability) params.append("capability", query.capability);
            if (query.tier) params.append("tier", query.tier);
            if (query.minReputation) params.append("minReputation", query.minReputation.toString());
            if (query.maxResponseTime) params.append("maxResponseTime", query.maxResponseTime.toString());

            const response = await fetch(`${API_ENDPOINTS.AGENT_DISCOVERY}?${params.toString()}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            if (!response.ok) {
                console.warn("Discovery Query Failed:", response.statusText);
                return this.getMockAgents(query);
            }

            const data = await response.json();
            
            // Phase A telemetry
            if (data.discoverySource) {
                console.log(`🌐 Agent Discovery Source: ${data.discoverySource}`);
                console.log(`   Found ${data.agents?.length || 0} agents at ${data.timestamp}`);
            }
            
            // Phase D: Filter by tier and SLA if requested
            let agents = data.agents || [];
            if (query.tier || query.minReputation || query.maxResponseTime) {
                agents = this.filterAgentsByTierAndSLA(agents, query);
            }
            
            return agents;
        } catch (error) {
            console.error("Agent Registry Error:", error);
            return this.getMockAgents(query);
        }
    }

    /**
     * Filter agents by service tier and SLA constraints (Phase D)
     */
    private static filterAgentsByTierAndSLA(agents: AgentProfile[], query: DiscoveryQuery): AgentProfile[] {
        return agents.filter(agent => {
            // Filter by reputation
            if (query.minReputation && agent.reputationScore < query.minReputation) {
                return false;
            }

            // Filter by service tier availability
            if (query.tier && agent.serviceAvailability) {
                const tierAvailability = agent.serviceAvailability[query.tier];
                if (!tierAvailability) return false;

                // Check SLA if specified
                if (query.maxResponseTime && tierAvailability.responseSLA > query.maxResponseTime) {
                    return false;
                }

                // Check if slots available
                if (tierAvailability.slotsFilled >= tierAvailability.slots) {
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * Get a specific agent by ID
     * Phase D: Used for booking orchestrator
     */
    static async getAgent(id: string): Promise<AgentProfile | null> {
        try {
            const response = await fetch(`${API_ENDPOINTS.AGENT_DISCOVERY}/agents/${id}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            if (!response.ok) {
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error("Failed to fetch agent:", error);
            return null;
        }
    }

    /**
     * Get available service tiers for an agent
     * Phase D: Used by booking UI
     */
    static getAvailableTiers(agent: AgentProfile): ServiceTier[] {
        if (!agent.serviceAvailability) {
            return ["basic", "pro", "premium"];
        }

        return (Object.keys(agent.serviceAvailability) as ServiceTier[]).filter(tier => {
            const availability = agent.serviceAvailability![tier];
            return availability && availability.slotsFilled < availability.slots;
        });
    }

    /**
     * Book a service slot (Phase D)
     * Called by BookingOrchestrator
     */
    static async bookServiceSlot(agentId: string, tier: ServiceTier, capability: AgentCapability): Promise<{ bookingId: string; expiresAt: number } | null> {
        try {
            const response = await fetch(`${API_ENDPOINTS.AGENT_DISCOVERY}/agents/${agentId}/book`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tier, capability })
            });

            if (!response.ok) {
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error("Booking failed:", error);
            return null;
        }
    }

    /**
     * Fallback mock data for UI testing
     */
    private static getMockAgents(query: DiscoveryQuery): AgentProfile[] {
        const MOCK_AGENTS: AgentProfile[] = [
            {
                id: "agent-fitness-core-01",
                name: "Imperfect Coach Core",
                emoji: "🏋️",
                role: "coordinator",
                description: "Primary fitness analysis agent using Bedrock Nova Lite.",
                capabilities: ["fitness_analysis", "benchmark_analysis"],
                pricing: {
                    fitness_analysis: { baseFee: "0.05", asset: "USDC", chain: "base-sepolia" },
                    benchmark_analysis: { baseFee: "0.02", asset: "USDC", chain: "base-sepolia" }
                },
                tieredPricing: {
                    fitness_analysis: {
                        basic: { baseFee: "0.02", asset: "USDC", chain: "base-sepolia" },
                        pro: { baseFee: "0.05", asset: "USDC", chain: "base-sepolia" },
                        premium: { baseFee: "0.10", asset: "USDC", chain: "base-sepolia" }
                    }
                },
                endpoint: API_ENDPOINTS.PREMIUM_ANALYSIS,
                status: "active",
                lastHeartbeat: Date.now(),
                reputationScore: 98,
                tags: ["official", "core"],
                serviceAvailability: {
                    basic: {
                        tier: "basic",
                        slots: 100,
                        slotsFilled: 45,
                        nextAvailable: Date.now(),
                        responseSLA: 5000,
                        uptime: 99.9
                    },
                    pro: {
                        tier: "pro",
                        slots: 50,
                        slotsFilled: 28,
                        nextAvailable: Date.now(),
                        responseSLA: 2000,
                        uptime: 99.95
                    },
                    premium: {
                        tier: "premium",
                        slots: 20,
                        slotsFilled: 8,
                        nextAvailable: Date.now(),
                        responseSLA: 500,
                        uptime: 99.99
                    }
                }
            },
            {
                id: "agent-nutrition-mock",
                name: "Nutrition Planner",
                emoji: "🥗",
                role: "specialist",
                description: "Specialized in post-workout nutrition.",
                capabilities: ["nutrition_planning"],
                pricing: {
                    nutrition_planning: { baseFee: "0.03", asset: "USDC", chain: "base-sepolia" }
                },
                tieredPricing: {
                    nutrition_planning: {
                        basic: { baseFee: "0.01", asset: "USDC", chain: "base-sepolia" },
                        pro: { baseFee: "0.03", asset: "USDC", chain: "base-sepolia" },
                        premium: { baseFee: "0.07", asset: "USDC", chain: "base-sepolia" }
                    }
                },
                endpoint: "mock-url",
                status: "active",
                lastHeartbeat: Date.now(),
                reputationScore: 95,
                tags: ["official"],
                serviceAvailability: {
                    basic: {
                        tier: "basic",
                        slots: 200,
                        slotsFilled: 120,
                        nextAvailable: Date.now(),
                        responseSLA: 8000,
                        uptime: 99.8
                    },
                    pro: {
                        tier: "pro",
                        slots: 75,
                        slotsFilled: 42,
                        nextAvailable: Date.now(),
                        responseSLA: 3000,
                        uptime: 99.9
                    },
                    premium: {
                        tier: "premium",
                        slots: 25,
                        slotsFilled: 12,
                        nextAvailable: Date.now(),
                        responseSLA: 1000,
                        uptime: 99.98
                    }
                }
            }
        ];

        // Phase D: Apply tier and SLA filters
        let agents = MOCK_AGENTS;
        if (query.tier || query.minReputation || query.maxResponseTime) {
            agents = this.filterAgentsByTierAndSLA(agents, query);
        }

        if (query.capability) {
            agents = agents.filter(a => a.capabilities.includes(query.capability!));
        }

        return agents;
    }
}
