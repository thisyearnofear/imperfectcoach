/**
 * Agent Discovery Service (Lambda)
 * 
 * PHASE A: Reap Protocol Integration
 * Now queries real specialists via Reap Protocol, falls back to Core Agents.
 * 
 * Features:
 * - Real agent discovery from Reap registries (x402 and A2A)
 * - Dynamic agent registration
 * - Local heartbeat tracking
 * 
 * Note: Reap query results are cached per request. Dynamic agents via local API.
 */

import { discoverAgentsHybrid, CORE_AGENTS } from "./lib/reap-integration.mjs";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Agent-ID, X-Signature",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

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
        // Phase A: Now queries real agents via Reap Protocol!
        if (httpMethod === "GET" && (path === "/agents" || path.endsWith("/agents"))) {
            const capability = queryStringParameters?.capability;
            const minScore = queryStringParameters?.minScore ? parseInt(queryStringParameters.minScore) : 0;

            // Phase A: Discover real agents via Reap (falls back to Core agents)
            let discoveredAgents = [];
            if (capability) {
                discoveredAgents = await discoverAgentsHybrid(capability, true);
            } else {
                // If no capability specified, return core agents
                discoveredAgents = [...CORE_AGENTS, ...Array.from(dynamicAgents.values())];
            }

            // Apply reputation filter
            const matches = discoveredAgents.filter(agent => {
                if (agent.reputationScore < minScore) return false;
                return true;
            });

            console.log(`📊 Discovery Response: Found ${matches.length} agents for capability=${capability}`);

            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    success: true,
                    count: matches.length,
                    agents: matches,
                    // Phase A telemetry
                    discoverySource: capability ? "reap-protocol-hybrid" : "core-agents",
                    timestamp: new Date().toISOString(),
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
