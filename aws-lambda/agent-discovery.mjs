/**
 * Agent Discovery Service (Lambda)
 * 
 * Acts as the centralized registry for the Agent Economy.
 * Allows agents to Register, Heartbeat, and perform Discovery.
 * 
 * In a production version, this would be backed by DynamoDB/Redis.
 * For this phase, we use an in-memory store initialized with Core Agents.
 * Note: Lambda cold starts will reset dynamic registrations, so we rely on Core Agents for persistence.
 */

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Agent-ID, X-Signature",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// --- CORE AGENTS (Always available) ---
const CORE_AGENTS = [
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
        reputationScore: 98,
        tags: ["official", "bedrock", "core"]
    },
    {
        id: "agent-nutrition-planner-01",
        name: "Nutrition Planner",
        description: "Specialized in post-workout nutrition plans.",
        capabilities: ["nutrition_planning"],
        pricing: {
            nutrition_planning: { baseFee: "0.03", asset: "USDC", chain: "base-sepolia" }
        },
        endpoint: "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/nutrition-agent", // Placeholder
        status: "active",
        reputationScore: 95,
        tags: ["official", "nutrition"]
    },
    {
        id: "agent-massage-booking-01",
        name: "Recovery Booking",
        description: "Books massage and physiotherapy sessions.",
        capabilities: ["massage_booking"],
        pricing: {
            massage_booking: { baseFee: "0.50", asset: "USDC", chain: "avalanche-c-chain" }
        },
        endpoint: "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/booking-agent", // Placeholder
        status: "active", // Simulate busy state occasionally?
        reputationScore: 92,
        tags: ["partner", "booking"]
    }
];

// In-memory store for dynamic agents (ephemeral)
let dynamicAgents = new Map();

export const handler = async (event) => {
    console.log("🔍 Discovery Event:", event.httpMethod, event.path);

    // CORS Preflight
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers: CORS_HEADERS, body: "" };
    }

    const { httpMethod, path, queryStringParameters, body } = event;

    try {
        // 1. DISCOVERY (GET /agents)
        // Example: GET /agents?capability=nutrition_planning
        if (httpMethod === "GET" && (path === "/agents" || path.endsWith("/agents"))) {
            const capability = queryStringParameters?.capability;
            const minScore = queryStringParameters?.minScore ? parseInt(queryStringParameters.minScore) : 0;

            // Combine Core + Dynamic
            const allAgents = [...CORE_AGENTS, ...Array.from(dynamicAgents.values())];

            // Filter
            const matches = allAgents.filter(agent => {
                if (capability && !agent.capabilities.includes(capability)) return false;
                if (agent.reputationScore < minScore) return false;
                return true;
            });

            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    success: true,
                    count: matches.length,
                    agents: matches
                })
            };
        }

        // 2. REGISTRATION (POST /agents/register)
        if (httpMethod === "POST" && (path === "/agents/register" || path.endsWith("/register"))) {
            const data = JSON.parse(body || "{}");
            const { profile, signature } = data;

            if (!profile || !profile.id || !profile.endpoint) {
                return {
                    statusCode: 400,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ error: "Invalid profile data" })
                };
            }

            // Verify signature (Mock for Phase 2, implement verify in Phase 3)
            // verifyAgentIdentity(profile.id, signature);

            const newAgent = {
                ...profile,
                lastHeartbeat: Date.now(),
                reputationScore: 50, // Start neutral
                status: "active"
            };

            dynamicAgents.set(profile.id, newAgent);
            console.log(`✅ Registered new agent: ${profile.name} (${profile.id})`);

            return {
                statusCode: 201,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    success: true,
                    message: "Agent registered successfully",
                    agent: newAgent
                })
            };
        }

        // 3. HEARTBEAT (POST /agents/heartbeat)
        if (httpMethod === "POST" && (path === "/agents/heartbeat" || path.endsWith("/heartbeat"))) {
            const data = JSON.parse(body || "{}");
            const { id } = data;

            if (dynamicAgents.has(id)) {
                const agent = dynamicAgents.get(id);
                agent.lastHeartbeat = Date.now();
                agent.status = "active";
                dynamicAgents.set(id, agent);
                return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true }) };
            }

            // Core agents don't need heartbeat, but acknowledge
            const isCore = CORE_AGENTS.find(a => a.id === id);
            if (isCore) {
                return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, type: "core" }) };
            }

            return {
                statusCode: 404,
                headers: CORS_HEADERS,
                body: JSON.stringify({ error: "Agent not found" })
            };
        }

        return {
            statusCode: 404,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Route not found" })
        };

    } catch (error) {
        console.error("Discovery Error:", error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Internal Discovery Error" })
        };
    }
};
