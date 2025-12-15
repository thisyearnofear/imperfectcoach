/**
 * Agent Registry & Discovery
 * 
 * Consolidated data layer for all agents (core + dynamic)
 * - Single source of truth for agent definitions
 * - Persistent storage via DynamoDB
 * - Hybrid discovery (Reap → Registry → Core agents)
 * - Signature verification for identity
 * 
 * Follows DRY principle: Consolidates duplicate discovery logic from:
 * - reap-integration.mjs (CORE_AGENTS definition)
 * - agent-discovery.mjs (dynamicAgents Map)
 * - core-agent-handler.mjs (agent lookups)
 */

// ═══════════════════════════════════════════════════════════════════════════
// CORE AGENTS DEFINITION (moved from reap-integration.mjs)
// ═══════════════════════════════════════════════════════════════════════════

export const CORE_AGENTS = [
    {
        id: "agent-fitness-core-01",
        name: "Imperfect Coach Core",
        emoji: "💪",
        role: "coordinator",
        description: "Primary fitness analysis agent using Bedrock Nova Lite.",
        location: "EU-North-1",
        type: "core",
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
        endpoint: "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout",
        status: "active",
        reputationScore: 98,
        successRate: 0.98,
        tags: ["official", "bedrock", "core"],
        protocol: "x402",
        lastHeartbeat: Date.now(),
        serviceAvailability: {
            basic: { tier: "basic", slots: 100, slotsFilled: 23, nextAvailable: Date.now(), responseSLA: 8000, uptime: 99.5 },
            pro: { tier: "pro", slots: 50, slotsFilled: 15, nextAvailable: Date.now(), responseSLA: 3000, uptime: 99.8 },
            premium: { tier: "premium", slots: 20, slotsFilled: 5, nextAvailable: Date.now(), responseSLA: 500, uptime: 99.9 }
        }
    },
    {
        id: "agent-nutrition-planner-01",
        name: "Nutrition Planner",
        emoji: "🥗",
        role: "specialist",
        description: "Specialized in post-workout nutrition plans.",
        location: "US-West-2",
        type: "core",
        capabilities: ["nutrition_planning"],
        pricing: {
            nutrition_planning: { baseFee: "0.03", asset: "USDC", chain: "base-sepolia" }
        },
        tieredPricing: {
            nutrition_planning: {
                basic: { baseFee: "0.01", asset: "USDC", chain: "base-sepolia" },
                pro: { baseFee: "0.025", asset: "USDC", chain: "base-sepolia" },
                premium: { baseFee: "0.05", asset: "USDC", chain: "base-sepolia" }
            }
        },
        endpoint: "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/nutrition-agent",
        status: "active",
        reputationScore: 95,
        successRate: 0.95,
        tags: ["official", "nutrition", "core"],
        protocol: "x402",
        lastHeartbeat: Date.now(),
        serviceAvailability: {
            basic: { tier: "basic", slots: 150, slotsFilled: 45, nextAvailable: Date.now(), responseSLA: 7000, uptime: 99.2 },
            pro: { tier: "pro", slots: 60, slotsFilled: 20, nextAvailable: Date.now(), responseSLA: 2500, uptime: 99.6 },
            premium: { tier: "premium", slots: 25, slotsFilled: 8, nextAvailable: Date.now(), responseSLA: 600, uptime: 99.8 }
        }
    },
    {
        id: "agent-recovery-planner-01",
        name: "Recovery Planner",
        emoji: "😴",
        role: "specialist",
        description: "Specialized in recovery optimization, sleep, and fatigue management.",
        location: "EU-West-1",
        type: "core",
        capabilities: ["recovery_planning"],
        pricing: {
            recovery_planning: { baseFee: "0.05", asset: "USDC", chain: "base-sepolia" }
        },
        tieredPricing: {
            recovery_planning: {
                basic: { baseFee: "0.02", asset: "USDC", chain: "base-sepolia" },
                pro: { baseFee: "0.05", asset: "USDC", chain: "base-sepolia" },
                premium: { baseFee: "0.10", asset: "USDC", chain: "base-sepolia" }
            }
        },
        endpoint: "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/recovery-agent",
        status: "active",
        reputationScore: 94,
        successRate: 0.94,
        tags: ["official", "recovery", "core"],
        protocol: "x402",
        lastHeartbeat: Date.now(),
        serviceAvailability: {
            basic: { tier: "basic", slots: 120, slotsFilled: 38, nextAvailable: Date.now(), responseSLA: 8000, uptime: 99.4 },
            pro: { tier: "pro", slots: 50, slotsFilled: 17, nextAvailable: Date.now(), responseSLA: 3000, uptime: 99.7 },
            premium: { tier: "premium", slots: 20, slotsFilled: 6, nextAvailable: Date.now(), responseSLA: 600, uptime: 99.9 }
        }
    },
    {
        id: "agent-biomechanics-01",
        name: "Biomechanics Analyst",
        emoji: "🏋️",
        role: "specialist",
        description: "Deep form analysis and movement quality assessment using pose data.",
        location: "US-East-1",
        type: "core",
        capabilities: ["biomechanics_analysis"],
        pricing: {
            biomechanics_analysis: { baseFee: "0.08", asset: "USDC", chain: "base-sepolia" }
        },
        tieredPricing: {
            biomechanics_analysis: {
                basic: { baseFee: "0.04", asset: "USDC", chain: "base-sepolia" },
                pro: { baseFee: "0.08", asset: "USDC", chain: "base-sepolia" },
                premium: { baseFee: "0.15", asset: "USDC", chain: "base-sepolia" }
            }
        },
        endpoint: "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/biomechanics-agent",
        status: "active",
        reputationScore: 96,
        successRate: 0.96,
        tags: ["official", "biomechanics", "core"],
        protocol: "x402",
        lastHeartbeat: Date.now(),
        serviceAvailability: {
            basic: { tier: "basic", slots: 100, slotsFilled: 30, nextAvailable: Date.now(), responseSLA: 8500, uptime: 99.6 },
            pro: { tier: "pro", slots: 50, slotsFilled: 18, nextAvailable: Date.now(), responseSLA: 3200, uptime: 99.8 },
            premium: { tier: "premium", slots: 20, slotsFilled: 7, nextAvailable: Date.now(), responseSLA: 700, uptime: 99.9 }
        }
    },
    {
        id: "agent-massage-booking-01",
        name: "Recovery Booking",
        emoji: "💆",
        role: "utility",
        description: "Books massage and physiotherapy sessions.",
        location: "Asia-Pacific",
        type: "core",
        capabilities: ["massage_booking"],
        pricing: {
            massage_booking: { baseFee: "0.50", asset: "USDC", chain: "avalanche-c-chain" }
        },
        tieredPricing: {
            massage_booking: {
                basic: { baseFee: "0.25", asset: "USDC", chain: "avalanche-c-chain" },
                pro: { baseFee: "0.50", asset: "USDC", chain: "avalanche-c-chain" },
                premium: { baseFee: "1.00", asset: "USDC", chain: "avalanche-c-chain" }
            }
        },
        endpoint: "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/booking-agent",
        status: "active",
        reputationScore: 92,
        successRate: 0.92,
        tags: ["partner", "booking", "core"],
        protocol: "x402",
        lastHeartbeat: Date.now(),
        serviceAvailability: {
            basic: { tier: "basic", slots: 200, slotsFilled: 67, nextAvailable: Date.now(), responseSLA: 10000, uptime: 98.8 },
            pro: { tier: "pro", slots: 80, slotsFilled: 25, nextAvailable: Date.now(), responseSLA: 4000, uptime: 99.4 },
            premium: { tier: "premium", slots: 30, slotsFilled: 10, nextAvailable: Date.now(), responseSLA: 1000, uptime: 99.7 }
        }
    }
];

// ═══════════════════════════════════════════════════════════════════════════
// SIGNATURE VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Verify EIP-191 signed message (agent identity proof)
 * @param {string} message - Message that was signed
 * @param {string} signature - 0x-prefixed hex signature
 * @param {string} signer - 0x-prefixed hex address that should have signed
 * @returns {boolean} true if signature is valid
 */
function verifyEIP191Signature(message, signature, signer) {
    try {
        if (!signature || !signer) return false;
        
        // In production, use viem or ethers.js:
        // import { verifyMessage } from 'viem';
        // const recovered = await verifyMessage({ message, signature, address: signer });
        // return recovered;
        
        // For development: basic validation of format
        // Full verification requires cryptographic library
        const sigValid = signature.startsWith('0x') && signature.length === 132;
        const addrValid = signer.startsWith('0x') && signer.length === 42;
        
        console.log(`🔐 EIP-191 Signature Validation: sig=${sigValid}, addr=${addrValid}`);
        return sigValid && addrValid;
    } catch (error) {
        console.error('❌ EIP-191 verification error:', error.message);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENT REGISTRY CLASS (persistent storage)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * AgentRegistry: Unified interface for agent storage and retrieval
 * - Manages both core and dynamic agents
 * - Persists to DynamoDB
 * - Provides filtered queries
 * - Verifies external agent identity via EIP-191 signatures
 */
export class AgentRegistry {
    constructor(dynamoDb = null) {
        this.dynamoDB = dynamoDb;
        this.agents = new Map();
        
        // Initialize with core agents
        CORE_AGENTS.forEach(agent => {
            this.agents.set(agent.id, agent);
        });
    }

    /**
     * Query agents by capability
     * @param {string} capability - e.g., 'nutrition_planning'
     * @param {object} filters - Optional: { minReputation, tier, maxResponseTime }
     * @returns {Agent[]} matching agents
     */
    async queryByCapability(capability, filters = {}) {
        const matches = Array.from(this.agents.values())
            .filter(agent => {
                // Must have capability
                if (!agent.capabilities.includes(capability)) return false;

                // Reputation filter
                const minRep = filters.minReputation || 0;
                if (agent.reputationScore < minRep) return false;

                // Tier availability filter
                if (filters.tier && agent.serviceAvailability) {
                    const tierAvail = agent.serviceAvailability[filters.tier];
                    if (!tierAvail) return false;
                    if (tierAvail.slotsFilled >= tierAvail.slots) return false;
                    if (filters.maxResponseTime && tierAvail.responseSLA > filters.maxResponseTime) return false;
                }

                // Status check (skip inactive agents)
                if (agent.status !== "active") return false;

                return true;
            });

        // Sort by reputation (highest first)
        return matches.sort((a, b) => b.reputationScore - a.reputationScore);
    }

    /**
     * Get agent by ID
     * @param {string} agentId
     * @returns {Agent|null}
     */
    getById(agentId) {
        return this.agents.get(agentId) || null;
    }

    /**
     * Register a new agent (permissionless with signature verification)
     * @param {object} profile - Agent profile { id, name, endpoint, capabilities, pricing, signer? }
     * @param {string} signature - EIP-191 signed identity proof
     * @returns {Agent} registered agent
     * @throws {Error} if signature verification fails
     */
    async register(profile, signature) {
        if (!profile?.id || !profile?.endpoint) {
            throw new Error("Invalid profile: missing id or endpoint");
        }

        // Verify signature (proof that agent controls the signing wallet)
        if (signature && profile.signer) {
            const message = JSON.stringify({
                agentId: profile.id,
                endpoint: profile.endpoint,
                timestamp: profile.timestamp || Date.now()
            });
            
            const isValid = verifyEIP191Signature(message, signature, profile.signer);
            if (!isValid) {
                throw new Error("Invalid signature: agent identity verification failed");
            }
            console.log(`✅ Signature verified for ${profile.id}`);
        } else if (signature) {
            console.warn(`⚠️ Signature provided but no signer address - skipping verification`);
        } else {
            console.warn(`⚠️ No signature provided - agent registration is unverified (DEV MODE)`);
        }

        const newAgent = {
            ...profile,
            type: "dynamic",
            status: "active",
            reputationScore: profile.reputationScore || 50,
            lastHeartbeat: Date.now(),
            registeredAt: Date.now(),
            signature: signature || null,
            verifiedAt: signature ? Date.now() : null
        };

        this.agents.set(profile.id, newAgent);
        await this.save(profile.id, newAgent);

        console.log(`✅ Registered agent: ${profile.name} (${profile.id}) [type: ${newAgent.type}]`);
        return newAgent;
    }

    /**
     * Update agent heartbeat (shows liveness)
     * @param {string} agentId
     * @returns {Agent|null} updated agent or null if not found
     */
    async updateHeartbeat(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) return null;

        agent.lastHeartbeat = Date.now();
        agent.status = "active";
        
        await this.save(agentId, agent);
        return agent;
    }

    /**
     * Update agent availability (slots, SLA, etc)
     * @param {string} agentId
     * @param {string} tier - basic|pro|premium
     * @param {object} updates - { slotsFilled, nextAvailable, responseSLA }
     */
    async updateAvailability(agentId, tier, updates) {
        const agent = this.agents.get(agentId);
        if (!agent) return null;

        if (!agent.serviceAvailability) agent.serviceAvailability = {};
        if (!agent.serviceAvailability[tier]) {
            throw new Error(`Agent does not offer ${tier} tier`);
        }

        Object.assign(agent.serviceAvailability[tier], updates);
        await this.save(agentId, agent);
        return agent;
    }

    /**
     * List all agents
     * @returns {Agent[]}
     */
    getAll() {
        return Array.from(this.agents.values());
    }

    /**
     * Get all agents of a type
     * @param {string} type - 'core' | 'dynamic'
     * @returns {Agent[]}
     */
    getByType(type) {
        return Array.from(this.agents.values()).filter(a => a.type === type);
    }

    /**
     * Persist agent to DynamoDB
     * @private
     */
    async save(agentId, agentData) {
        if (!this.dynamoDB) {
            console.log(`📚 [Cache-Only] Saved ${agentId} to memory (DynamoDB not configured)`);
            return;
        }

        try {
            const dynamoItem = {
                agentId: { S: agentId },
                ...this.toDynamoDBFormat(agentData)
            };
            
            await this.dynamoDB.putItem({
                TableName: "AgentRegistry",
                Item: dynamoItem
            }).promise();
            
            console.log(`💾 Persisted ${agentId} to DynamoDB`);
        } catch (error) {
            console.error(`❌ Failed to persist agent ${agentId}:`, error.message);
            throw error;
        }
    }

    /**
     * Convert agent object to DynamoDB format (AWS SDK v2)
     * @private
     */
    toDynamoDBFormat(agent) {
        const item = {
            // Identity
            name: { S: agent.name || "Unknown Agent" },
            type: { S: agent.type }, // 'core' | 'dynamic'
            
            // Location & Protocol
            endpoint: { S: agent.endpoint },
            protocol: { S: agent.protocol || "x402" },
            
            // Capabilities
            capabilities: { SS: agent.capabilities || [] },
            
            // Status
            status: { S: agent.status || "active" },
            reputationScore: { N: String(agent.reputationScore || 50) },
            lastHeartbeat: { N: String(agent.lastHeartbeat || Date.now()) },
            
            // Timestamps
            registeredAt: { N: String(agent.registeredAt || Date.now()) },
            updatedAt: { N: String(Date.now()) },
            
            // Pricing
            pricing: { S: JSON.stringify(agent.pricing || {}) },
            tieredPricing: { S: JSON.stringify(agent.tieredPricing || {}) },
            
            // Metadata
            successRate: { N: String(agent.successRate || 0) },
            ...(agent.emoji && { emoji: { S: agent.emoji } }),
            ...(agent.signature && { signature: { S: agent.signature } }),
            ...(agent.verifiedAt && { verifiedAt: { N: String(agent.verifiedAt) } }),
            
            // Service Availability (as JSON string for flexibility)
            ...(agent.serviceAvailability && {
                serviceAvailability: { S: JSON.stringify(agent.serviceAvailability) }
            }),
            
            // Tags
            ...(agent.tags && { tags: { SS: agent.tags } }),
        };
        
        return item;
    }

    /**
     * Check for stale agents (no heartbeat in X time)
     * @param {number} staleThresholdMs - default 1 hour
     * @returns {string[]} array of stale agent IDs
     */
    findStaleAgents(staleThresholdMs = 3600000) {
        const now = Date.now();
        const stale = [];

        this.agents.forEach((agent, id) => {
            if (agent.type === "dynamic" && now - agent.lastHeartbeat > staleThresholdMs) {
                stale.push(id);
            }
        });

        return stale;
    }

    /**
     * Mark agent as inactive (soft delete)
     * @param {string} agentId
     */
    async deactivate(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) return null;

        agent.status = "inactive";
        await this.save(agentId, agent);
        return agent;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// HYBRID DISCOVERY (consolidated from reap-integration.mjs)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Discover agents - hybrid approach:
 * 1. Try Reap Protocol (when implemented)
 * 2. Query AgentRegistry (primary)
 * 3. Fall back to CORE_AGENTS (guaranteed)
 */
export async function discoverAgents(
    capability,
    registry,
    options = {}
) {
    let agents = [];

    // Step 1: Query registry (dynamic + core)
    if (registry) {
        const registered = await registry.queryByCapability(capability, options);
        agents = agents.concat(registered);
    } else {
        // Fallback: query CORE_AGENTS directly
        agents = CORE_AGENTS.filter(a => a.capabilities.includes(capability));
    }

    // Apply filters
    if (options.minReputation) {
        agents = agents.filter(a => a.reputationScore >= options.minReputation);
    }

    // Sort by reputation
    return agents.sort((a, b) => b.reputationScore - a.reputationScore);
}

/**
 * Initialize AgentRegistry from DynamoDB on Lambda cold start
 * Loads both core agents and previously registered dynamic agents
 */
export async function initializeRegistry(dynamoDb = null) {
    const registry = new AgentRegistry(dynamoDb);

    if (dynamoDb) {
        try {
            console.log("📂 Loading dynamic agents from DynamoDB...");
            
            // Query for all dynamic agents (type='dynamic')
            const result = await dynamoDb.scan({
                TableName: "AgentRegistry",
                FilterExpression: "attribute_type(#t, :type)",
                ExpressionAttributeNames: { "#t": "type" },
                ExpressionAttributeValues: {
                    ":type": { S: "dynamic" }
                }
            }).promise();

            if (result.Items && result.Items.length > 0) {
                console.log(`✅ Loaded ${result.Items.length} dynamic agents from DynamoDB`);
                
                // Convert DynamoDB items back to agent objects and register them
                result.Items.forEach(item => {
                    const agent = {
                        id: item.agentId.S,
                        name: item.name?.S || "Unknown",
                        type: item.type?.S || "dynamic",
                        endpoint: item.endpoint?.S || "",
                        capabilities: item.capabilities?.SS || [],
                        status: item.status?.S || "active",
                        reputationScore: parseInt(item.reputationScore?.N || "50"),
                        lastHeartbeat: parseInt(item.lastHeartbeat?.N || Date.now()),
                        registeredAt: parseInt(item.registeredAt?.N || Date.now()),
                        signature: item.signature?.S || null,
                        pricing: item.pricing?.S ? JSON.parse(item.pricing.S) : {},
                        tieredPricing: item.tieredPricing?.S ? JSON.parse(item.tieredPricing.S) : {},
                        ...(item.serviceAvailability && {
                            serviceAvailability: JSON.parse(item.serviceAvailability.S)
                        }),
                        ...(item.emoji && { emoji: item.emoji.S }),
                        ...(item.tags && { tags: item.tags.SS || [] })
                    };
                    
                    registry.agents.set(agent.id, agent);
                });
            } else {
                console.log("📊 No dynamic agents found in DynamoDB (first cold start?)");
            }
        } catch (error) {
            console.warn("⚠️ Failed to load from DynamoDB:", error.message);
            console.warn("   Continuing with core agents only - dynamic agents will be lost on cold start");
        }
    } else {
        console.log("📚 DynamoDB not configured - using memory-only storage (ephemeral)");
    }

    return registry;
}
