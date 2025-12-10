import { AgentProfile, DiscoveryQuery, AgentCapability } from "./types";

/**
 * Client-Side Registry Wrapper
 * Allows the frontend (and other agents) to query the Discovery Service.
 */
export class AgentRegistry {
    // Use the actual deployed endpoint or local depending on env.
    // For now, hardcode the base API path, assuming it will be deployed to the same API Gateway stage.
    // In development, this points to localhost or a mock if needed.

    // NOTE: This URL needs to match the deployed Lambda URL. 
    // We'll trust the user has configured this or we use a relative path if proxied.
    // For hackathon/demo, we can default to the known robust endpoint or a variable.
    private static DISCOVERY_URL = "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/discovery"; // Hypothetical new path

    /**
     * Find agents matching specific criteria
     */
    static async findAgents(query: DiscoveryQuery): Promise<AgentProfile[]> {
        try {
            const params = new URLSearchParams();
            if (query.capability) params.append("capability", query.capability);

            const response = await fetch(`${this.DISCOVERY_URL}?${params.toString()}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            if (!response.ok) {
                console.warn("Discovery Query Failed:", response.statusText);
                // Fallback: If the endpoint isn't deployed yet, return local mock data for UI testing.
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
     * Fallback for UI testing before full deployment
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
                endpoint: "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout",
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
