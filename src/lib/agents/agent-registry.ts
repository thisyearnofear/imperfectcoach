import { AgentProfile, DiscoveryQuery, AgentCapability } from "./types";
import { API_ENDPOINTS } from "@/lib/config";

/**
 * Client-Side Registry Wrapper
 * Queries the Discovery Service to find available agents.
 * Falls back to mock data if service is unavailable.
 */
export class AgentRegistry {
    /**
     * Find agents matching specific criteria
     */
    static async findAgents(query: DiscoveryQuery): Promise<AgentProfile[]> {
        try {
            const params = new URLSearchParams();
            if (query.capability) params.append("capability", query.capability);

            const response = await fetch(`${API_ENDPOINTS.AGENT_DISCOVERY}?${params.toString()}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            if (!response.ok) {
                console.warn("Discovery Query Failed:", response.statusText);
                return this.getMockAgents(query);
            }

            const data = await response.json();
            return data.agents || [];
        } catch (error) {
            console.error("Agent Registry Error:", error);
            return this.getMockAgents(query);
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
                description: "Primary fitness analysis agent using Bedrock Nova Lite.",
                capabilities: ["fitness_analysis", "benchmark_analysis"],
                pricing: {
                    fitness_analysis: { baseFee: "0.05", asset: "USDC", chain: "base-sepolia" },
                    benchmark_analysis: { baseFee: "0.02", asset: "USDC", chain: "base-sepolia" }
                },
                endpoint: API_ENDPOINTS.PREMIUM_ANALYSIS,
                status: "active",
                lastHeartbeat: Date.now(),
                reputationScore: 98,
                tags: ["official", "core"]
            },
            {
                id: "agent-nutrition-mock",
                name: "Nutrition Planner",
                description: "Specialized in post-workout nutrition.",
                capabilities: ["nutrition_planning"],
                pricing: {
                    nutrition_planning: { baseFee: "0.03", asset: "USDC", chain: "base-sepolia" }
                },
                endpoint: "mock-url",
                status: "active",
                lastHeartbeat: Date.now(),
                reputationScore: 95,
                tags: ["official"]
            }
        ];

        if (query.capability) {
            return MOCK_AGENTS.filter(a => a.capabilities.includes(query.capability!));
        }
        return MOCK_AGENTS;
    }
}
