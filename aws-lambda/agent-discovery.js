/**
 * Agent Discovery Service (Lambda)
 * 
 * Permissionless X402 agent discovery & registration
 * 
 * Features:
 * - Query agents by capability with filters
 * - Permissionless agent registration (POST /agents/register)
 * - Agent heartbeat tracking (persistent liveness)
 * - Service tier booking with SLA constraints
 * - Persistent storage via DynamoDB
 * 
 * Uses consolidated AgentRegistry from lib/agents.mjs
 * Supports x402 signature verification
 */

import { initializeRegistry, discoverAgents } from "./lib/agents.mjs";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Agent-ID, X-Signature",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Initialize registry on cold start with DynamoDB persistence
let agentRegistry = null;
let dynamoDb = null;

async function getRegistry() {
    if (!agentRegistry) {
        if (!dynamoDb) {
            dynamoDb = new DynamoDBClient({
                region: process.env.AWS_REGION || "eu-north-1"
            });
        }
        agentRegistry = await initializeRegistry(dynamoDb);
    }
    return agentRegistry;
}

const handler = async (event) => {
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
        // Returns agents that match capability + filters, sorted by reputation
        if (httpMethod === "GET" && (path === "/agents" || path.endsWith("/agents"))) {
            const registry = await getRegistry();
            const capability = queryStringParameters?.capability;
            const minReputation = queryStringParameters?.minReputation ? parseInt(queryStringParameters.minReputation) : 0;
            const tier = queryStringParameters?.tier;
            const maxResponseTime = queryStringParameters?.maxResponseTime ? parseInt(queryStringParameters.maxResponseTime) : null;

            let discoveredAgents = [];
            
            if (capability) {
                // Query registry with filters (includes core agents as fallback)
                discoveredAgents = await discoverAgents(capability, registry, {
                    minReputation,
                    tier,
                    maxResponseTime
                });
            } else {
                // No capability specified: return all agents
                discoveredAgents = registry.getAll();
            }

            console.log(`📊 Discovery: Found ${discoveredAgents.length} agents (capability=${capability || "any"}, minRep=${minReputation})`);

            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    success: true,
                    count: discoveredAgents.length,
                    agents: discoveredAgents,
                    filters: { capability, minReputation, tier, maxResponseTime },
                    timestamp: new Date().toISOString(),
                })
            };
        }

        // 2. REGISTRATION (POST /agents/register)
        // Permissionless agent registration with optional EIP-191 signature verification
        if (httpMethod === "POST" && (path === "/agents/register" || path.endsWith("/register"))) {
            const registry = await getRegistry();
            const data = JSON.parse(body || "{}");
            const { profile, signature } = data;

            if (!profile || !profile.id || !profile.endpoint) {
                return {
                    statusCode: 400,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({
                        error: "Missing required fields: id, endpoint, name, capabilities"
                    })
                };
            }

            // Note: EIP-191 signature verification is implemented in AgentRegistry.register()
            // Signature format: { signature: "0x...", signer: "0x..." } proves agent identity
            // DEV MODE: Signature is optional but recommended for production
            
            try {
                const registeredAgent = await registry.register(profile, signature);
                
                console.log(`✅ Agent registered via REST API: ${profile.id}`);
                
                return {
                    statusCode: 201,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({
                        success: true,
                        message: "Agent registered successfully",
                        agent: registeredAgent,
                        note: signature ? "Agent identity verified via EIP-191 signature" : "Unverified registration (DEV MODE)"
                    })
                };
            } catch (error) {
                console.error(`❌ Registration failed for ${profile.id}:`, error.message);
                
                return {
                    statusCode: 400,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({
                        error: error.message,
                        hint: "Provide EIP-191 signed identity proof to enable verification"
                    })
                };
            }
        }

        // 3. HEARTBEAT (POST /agents/heartbeat)
        // Agents send heartbeat to signal liveness - prevents deactivation
        if (httpMethod === "POST" && (path === "/agents/heartbeat" || path.endsWith("/heartbeat"))) {
            const registry = await getRegistry();
            const data = JSON.parse(body || "{}");
            const { id } = data;

            if (!id) {
                return {
                    statusCode: 400,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ error: "Missing agent id" })
                };
            }

            const agent = registry.getById(id);
            if (!agent) {
                return {
                    statusCode: 404,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ error: "Agent not found" })
                };
            }

            try {
                await registry.updateHeartbeat(id);
                return {
                    statusCode: 200,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ success: true, type: agent.type })
                };
            } catch (error) {
                return {
                    statusCode: 500,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ error: error.message })
                };
            }
        }

        // 4. BOOKING (POST /agents/{id}/book)
        // Reserve service slot with SLA constraints
        if (httpMethod === "POST" && path.includes("/agents/") && path.endsWith("/book")) {
            const registry = await getRegistry();
            const agentId = path.split("/")[2];
            const data = JSON.parse(body || "{}");
            const { tier, capability, requestData } = data;

            const agent = registry.getById(agentId);
            if (!agent) {
                return {
                    statusCode: 404,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ error: "Agent not found" })
                };
            }

            // Validate tier and availability
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

            // Check capability match
            if (!agent.capabilities.includes(capability)) {
                return {
                    statusCode: 400,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ error: `Agent does not offer ${capability}` })
                };
            }

            // Reserve slot
            try {
                await registry.updateAvailability(agentId, tier, {
                    slotsFilled: tierAvailability.slotsFilled + 1
                });
            } catch (error) {
                return {
                    statusCode: 500,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ error: error.message })
                };
            }

            // Get pricing for tier
            const tieredPrice = agent.tieredPricing?.[capability]?.[tier] ||
                agent.pricing?.[capability] ||
                { baseFee: "0.01", asset: "USDC", chain: "base-sepolia" };

            // Generate booking ID
            const bookingId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            console.log(`📅 Booking: ${bookingId} for ${agent.name} (${tier} tier)`);

            return {
                statusCode: 201,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    success: true,
                    bookingId,
                    agent: {
                        id: agent.id,
                        name: agent.name,
                        emoji: agent.emoji || "🤖"
                    },
                    tier,
                    capability,
                    pricing: tieredPrice,
                    sla: {
                        responseSLA: tierAvailability.responseSLA,
                        uptime: tierAvailability.uptime
                    },
                    expiryTime: Date.now() + 3600000,
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

        // 6. UPDATE AVAILABILITY (POST /agents/{id}/availability)
        // Agent updates its tier availability (slots, SLA, etc)
        if (httpMethod === "POST" && path.includes("/agents/") && path.endsWith("/availability")) {
            const registry = await getRegistry();
            const agentId = path.split("/")[2];
            const data = JSON.parse(body || "{}");
            const { tier, slotsFilled, nextAvailable, responseSLA } = data;

            if (!tier) {
                return {
                    statusCode: 400,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ error: "Missing tier" })
                };
            }

            try {
                const updates = {};
                if (slotsFilled !== undefined) updates.slotsFilled = slotsFilled;
                if (nextAvailable !== undefined) updates.nextAvailable = nextAvailable;
                if (responseSLA !== undefined) updates.responseSLA = responseSLA;

                const updated = await registry.updateAvailability(agentId, tier, updates);

                console.log(`📊 Updated ${updated.name} ${tier}: ${JSON.stringify(updates)}`);

                return {
                    statusCode: 200,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({
                        success: true,
                        message: "Availability updated",
                        agent: updated
                    })
                };
            } catch (error) {
                return {
                    statusCode: error.message.includes("not found") ? 404 : 400,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({ error: error.message })
                };
            }
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

// Lambda expects CommonJS exports
module.exports = { handler };
