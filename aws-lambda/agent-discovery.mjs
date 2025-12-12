/**
 * Agent Discovery Service (Lambda)
 * 
 * PHASE A: Reap Protocol Integration
 * Now queries real specialists via Reap Protocol, falls back to Core Agents.
 * 
 * PHASE D: Multi-Service Marketplace
 * Adds service tier filtering, availability checks, and booking support.
 * 
 * Features:
 * - Real agent discovery from Reap registries (x402 and A2A)
 * - Service tier filtering (basic/pro/premium)
 * - SLA and availability constraints
 * - Dynamic agent registration with service tiers
 * - Service booking orchestration
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
    // Support both REST API (httpMethod) and HTTP API v2 (requestContext.http.method) formats
    const httpMethod = event.httpMethod || event.requestContext?.http?.method;
    const path = event.path || event.rawPath;

    console.log("🔍 Discovery Event:", httpMethod, path);

    // CORS Preflight
    if (httpMethod === "OPTIONS") {
        return { statusCode: 200, headers: CORS_HEADERS, body: "" };
    }

    const { queryStringParameters, body } = event;

    try {
        // 1. DISCOVERY (GET /agents)
        // Example: GET /agents?capability=nutrition_planning&tier=pro&minReputation=90
        // Phase A: Now queries real agents via Reap Protocol!
        // Phase D: Supports tier filtering and SLA constraints
        if (httpMethod === "GET" && (path === "/agents" || path.endsWith("/agents"))) {
            const capability = queryStringParameters?.capability;
            const minScore = queryStringParameters?.minScore ? parseInt(queryStringParameters.minScore) : 0;
            const tier = queryStringParameters?.tier;  // Phase D
            const minReputation = queryStringParameters?.minReputation ? parseInt(queryStringParameters.minReputation) : 0;  // Phase D
            const maxResponseTime = queryStringParameters?.maxResponseTime ? parseInt(queryStringParameters.maxResponseTime) : null;  // Phase D

            // Phase A: Discover real agents via Reap (falls back to Core agents)
            let discoveredAgents = [];
            if (capability) {
                discoveredAgents = await discoverAgentsHybrid(capability, true);
            } else {
                // If no capability specified, return core agents
                discoveredAgents = [...CORE_AGENTS, ...Array.from(dynamicAgents.values())];
            }

            // Apply filters
            const matches = discoveredAgents.filter(agent => {
                // Reputation filter
                if (agent.reputationScore < minScore) return false;
                if (agent.reputationScore < minReputation) return false;  // Phase D

                // Phase D: Service tier filtering
                if (tier && agent.serviceAvailability) {
                    const tierAvailability = agent.serviceAvailability[tier];
                    if (!tierAvailability) return false;

                    // Check if slots available
                    if (tierAvailability.slotsFilled >= tierAvailability.slots) {
                        return false;
                    }

                    // Check SLA constraint
                    if (maxResponseTime && tierAvailability.responseSLA > maxResponseTime) {
                        return false;
                    }
                }

                return true;
            });

            console.log(`📊 Discovery Response: Found ${matches.length} agents (capability=${capability}, tier=${tier || "all"}, minRep=${minReputation})`);

            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    success: true,
                    count: matches.length,
                    agents: matches,
                    // Phase A telemetry
                    discoverySource: capability ? "reap-protocol-hybrid" : "core-agents",
                    // Phase D filter info
                    filters: { capability, tier, minReputation, maxResponseTime },
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

        // 4. BOOKING (POST /agents/{id}/book) - Phase D
        // Example: POST /agents/agent-nutrition-mock/book
        // Body: { tier: "pro", capability: "nutrition_planning", requestData: {...} }
        if (httpMethod === "POST" && path.includes("/agents/") && path.endsWith("/book")) {
            const agentId = path.split("/")[2];
            const data = JSON.parse(body || "{}");
            const { tier, capability, requestData } = data;

            // Find agent (dynamic or core)
            let agent = dynamicAgents.get(agentId) || CORE_AGENTS.find(a => a.id === agentId);

            if (!agent) {
                return {
                    statusCode: 404,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ error: "Agent not found" })
                };
            }

            // Phase D: Validate tier and availability
            if (!agent.serviceAvailability || !agent.serviceAvailability[tier]) {
                return {
                    statusCode: 400,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ error: `Agent does not offer ${tier} tier` })
                };
            }

            const tierAvailability = agent.serviceAvailability[tier];

            // Check slots
            if (tierAvailability.slotsFilled >= tierAvailability.slots) {
                return {
                    statusCode: 409,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({
                        error: "No slots available",
                        nextAvailable: tierAvailability.nextAvailable
                    })
                };
            }

            // Check SLA capability match
            if (!agent.capabilities.includes(capability)) {
                return {
                    statusCode: 400,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ error: `Agent does not offer ${capability}` })
                };
            }

            // Reserve slot
            tierAvailability.slotsFilled++;

            // Get pricing for tier
            const tieredPrice = agent.tieredPricing?.[capability]?.[tier] ||
                agent.pricing?.[capability] ||
                { baseFee: "0.01", asset: "USDC", chain: "base-sepolia" };

            // Generate booking ID (timestamp + random)
            const bookingId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            console.log(`📅 Booking Created: ${bookingId} for agent ${agent.name} (${tier} tier)`);

            return {
                statusCode: 201,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    success: true,
                    bookingId,
                    agent: {
                        id: agent.id,
                        name: agent.name,
                        emoji: agent.emoji
                    },
                    tier,
                    capability,
                    pricing: tieredPrice,
                    sla: {
                        responseSLA: tierAvailability.responseSLA,
                        uptime: tierAvailability.uptime
                    },
                    expiryTime: Date.now() + 3600000, // 1 hour
                    requestData
                })
            };
        }

        // 5. BOOKING STATUS (GET /agents/{id}/booking/{bookingId}) - Phase D
        // Get booking status and progress
        if (httpMethod === "GET" && path.includes("/agents/") && path.includes("/booking/")) {
            const parts = path.split("/");
            const agentId = parts[2];
            const bookingId = parts.pop();

            // In production, would query database/blockchain
            // For now, return mock response
            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    success: true,
                    bookingId,
                    agentId,
                    status: "processing",
                    progress: 50,
                    message: "Agent is processing your request..."
                })
            };
        }

        // 6. UPDATE AVAILABILITY (POST /agents/{id}/availability) - Phase D
        // Agent updates its tier availability (slots, next available, etc)
        if (httpMethod === "POST" && path.includes("/agents/") && path.endsWith("/availability")) {
            const agentId = path.split("/")[2];
            const data = JSON.parse(body || "{}");
            const { tier, slotsFilled, nextAvailable } = data;

            let agent = dynamicAgents.get(agentId);
            if (!agent) {
                return {
                    statusCode: 404,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ error: "Dynamic agent not found" })
                };
            }

            // Update availability
            if (!agent.serviceAvailability) {
                agent.serviceAvailability = {};
            }

            if (agent.serviceAvailability[tier]) {
                agent.serviceAvailability[tier].slotsFilled = slotsFilled;
                if (nextAvailable) {
                    agent.serviceAvailability[tier].nextAvailable = nextAvailable;
                }
            }

            dynamicAgents.set(agentId, agent);

            console.log(`📊 Updated ${agent.name} ${tier} tier: ${slotsFilled} slots filled`);

            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    success: true,
                    message: "Availability updated"
                })
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
