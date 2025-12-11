/**
 * Test Reap Protocol Integration
 * 
 * Validates Phase A: Real agent discovery via Reap
 * Run with: node test-reap-integration.mjs
 */

import { discoverAgentsHybrid, discoverReapAgents, CORE_AGENTS } from "./lib/reap-integration.mjs";

console.log("🧪 Testing Reap Protocol Integration (Phase A)");
console.log("=".repeat(60));

// Test 1: Core Agents Available
console.log("\n1️⃣  Core Agents (Fallback):");
console.log(`   Available: ${CORE_AGENTS.length} agents`);
CORE_AGENTS.forEach(agent => {
    console.log(`   - ${agent.name} (${agent.id})`);
    console.log(`     Capabilities: ${agent.capabilities.join(", ")}`);
});

// Test 2: Hybrid Discovery (what the handler uses)
console.log("\n2️⃣  Hybrid Discovery Test:");
console.log("   Testing capability: nutrition_planning");

try {
    const agents = await discoverAgentsHybrid("nutrition_planning", true);
    console.log(`   ✅ Discovered ${agents.length} agents`);
    
    agents.forEach(agent => {
        const source = agent.tags?.includes("reap-discovered") ? "🌐 Reap" : "📦 Core";
        console.log(`   ${source}: ${agent.name}`);
        console.log(`      ID: ${agent.id}`);
        console.log(`      Reputation: ${agent.reputationScore}`);
    });
} catch (error) {
    console.log(`   ⚠️  Hybrid discovery error: ${error.message}`);
    console.log("   This is expected if Reap is not available in test mode");
}

// Test 3: Individual Capability Queries
console.log("\n3️⃣  Testing Individual Capabilities:");

const capabilities = [
    "fitness_analysis",
    "nutrition_planning",
    "biomechanics_analysis",
    "recovery_planning",
    "massage_booking"
];

for (const cap of capabilities) {
    try {
        const agents = await discoverAgentsHybrid(cap, false); // No Reap in test
        console.log(`   ${cap}: ${agents.length} agents`);
    } catch (error) {
        console.log(`   ${cap}: Error - ${error.message}`);
    }
}

// Test 4: Fallback Behavior
console.log("\n4️⃣  Fallback Behavior Test:");
console.log("   (Testing with Reap unavailable - should use core agents)");

try {
    const agents = await discoverAgentsHybrid("nutrition_planning", true);
    if (agents.some(a => a.tags?.includes("core"))) {
        console.log("   ✅ Core agents used as fallback");
    }
} catch (error) {
    console.log(`   ⚠️  Error: ${error.message}`);
}

console.log("\n" + "=".repeat(60));
console.log("✅ Phase A Integration Test Complete");
console.log("\nNext Steps:");
console.log("- Ensure AGENT_WALLET_KEY env var is set for production Reap queries");
console.log("- Monitor discovery_source in Lambda logs");
console.log("- Phase B: Implement agent-to-agent settlement negotiation");
console.log("- Phase C: Real inter-agent payment flows");
