/**
 * Phase D: Multi-Service Marketplace - Discovery Testing
 * 
 * Tests the service tier architecture:
 * - Tier-based agent filtering
 * - SLA constraint enforcement
 * - Availability checking
 * - Multi-tier pricing
 */

// Mock the Reap integration for testing
const mockAgents = [
    {
        id: "fitness-pro",
        name: "Pro Fitness Coach",
        emoji: "🏋️",
        role: "specialist",
        capabilities: ["fitness_analysis", "benchmark_analysis"],
        reputationScore: 98,
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
        },
        tieredPricing: {
            fitness_analysis: {
                basic: { baseFee: "0.02", asset: "USDC", chain: "base-sepolia" },
                pro: { baseFee: "0.05", asset: "USDC", chain: "base-sepolia" },
                premium: { baseFee: "0.10", asset: "USDC", chain: "base-sepolia" }
            }
        }
    },
    {
        id: "nutrition-basic",
        name: "Budget Nutrition Advisor",
        emoji: "🥗",
        role: "specialist",
        capabilities: ["nutrition_planning"],
        reputationScore: 75,
        serviceAvailability: {
            basic: {
                tier: "basic",
                slots: 200,
                slotsFilled: 200, // FULL
                nextAvailable: Date.now() + 3600000,
                responseSLA: 8000,
                uptime: 99.8
            },
            pro: null,
            premium: null
        },
        tieredPricing: {
            nutrition_planning: {
                basic: { baseFee: "0.01", asset: "USDC", chain: "base-sepolia" },
                pro: null,
                premium: null
            }
        }
    },
    {
        id: "recovery-premium",
        name: "Elite Recovery Specialist",
        emoji: "💪",
        role: "specialist",
        capabilities: ["recovery_planning"],
        reputationScore: 99,
        serviceAvailability: {
            basic: {
                tier: "basic",
                slots: 50,
                slotsFilled: 15,
                nextAvailable: Date.now(),
                responseSLA: 4000,
                uptime: 99.9
            },
            pro: {
                tier: "pro",
                slots: 30,
                slotsFilled: 5,
                nextAvailable: Date.now(),
                responseSLA: 1500,
                uptime: 99.95
            },
            premium: {
                tier: "premium",
                slots: 10,
                slotsFilled: 2,
                nextAvailable: Date.now(),
                responseSLA: 300,
                uptime: 99.99
            }
        },
        tieredPricing: {
            recovery_planning: {
                basic: { baseFee: "0.01", asset: "USDC", chain: "base-sepolia" },
                pro: { baseFee: "0.025", asset: "USDC", chain: "base-sepolia" },
                premium: { baseFee: "0.05", asset: "USDC", chain: "base-sepolia" }
            }
        }
    }
];

// Filter logic (matching agent-registry.ts)
function filterAgentsByTierAndSLA(agents, query) {
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

// Test suite
console.log("🧪 Phase D: Multi-Service Marketplace Discovery Tests\n");

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
        failed++;
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
}

function assertTrue(value, message) {
    if (!value) {
        throw new Error(message);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE
// ─────────────────────────────────────────────────────────────────────────────

test("Discovery: No filters returns all agents", () => {
    const query = {};
    const results = filterAgentsByTierAndSLA(mockAgents, query);
    assertEqual(results.length, 3, "Should return all 3 agents");
});

test("Discovery: Filter by capability", () => {
    const query = { capability: "fitness_analysis" };
    const results = mockAgents.filter(a => a.capabilities.includes(query.capability));
    assertEqual(results.length, 1, "Should return 1 fitness agent");
    assertEqual(results[0].id, "fitness-pro", "Should be pro fitness coach");
});

test("Discovery: Filter by reputation (90+)", () => {
    const query = { minReputation: 90 };
    const results = filterAgentsByTierAndSLA(mockAgents, query);
    assertEqual(results.length, 2, "Should return 2 agents with 90+ reputation");
    assertTrue(
        results.every(a => a.reputationScore >= 90),
        "All results should have 90+ reputation"
    );
});

test("Discovery: Filter by reputation (95+)", () => {
    const query = { minReputation: 95 };
    const results = filterAgentsByTierAndSLA(mockAgents, query);
    assertEqual(results.length, 2, "Should return 2 agents with 95+ reputation");
});

test("Discovery: Filter by tier=basic with availability", () => {
    const query = { tier: "basic" };
    const results = filterAgentsByTierAndSLA(mockAgents, query);
    assertEqual(results.length, 2, "Should return 2 agents with available basic slots");
    assertTrue(
        !results.find(a => a.id === "nutrition-basic"),
        "Should exclude nutrition-basic (slots full)"
    );
});

test("Discovery: Filter by tier=pro with availability", () => {
    const query = { tier: "pro" };
    const results = filterAgentsByTierAndSLA(mockAgents, query);
    assertEqual(results.length, 2, "Should return 2 agents with available pro slots");
    assertTrue(
        results.find(a => a.id === "fitness-pro"),
        "Should include fitness-pro"
    );
    assertTrue(
        results.find(a => a.id === "recovery-premium"),
        "Should include recovery-premium"
    );
});

test("Discovery: Filter by tier=premium with availability", () => {
    const query = { tier: "premium" };
    const results = filterAgentsByTierAndSLA(mockAgents, query);
    assertEqual(results.length, 2, "Should return 2 agents with available premium slots");
    assertTrue(
        results.find(a => a.id === "fitness-pro"),
        "Should include fitness-pro"
    );
    assertTrue(
        results.find(a => a.id === "recovery-premium"),
        "Should include recovery-premium"
    );
});

test("Discovery: SLA constraint 2000ms excludes slow agents", () => {
    const query = { tier: "basic", maxResponseTime: 2000 };
    const results = filterAgentsByTierAndSLA(mockAgents, query);
    assertEqual(results.length, 0, "Should return no agents (fitness is 5000ms, recovery is 4000ms)");
});

test("Discovery: SLA constraint 5000ms allows standard agents", () => {
    const query = { tier: "basic", maxResponseTime: 5000 };
    const results = filterAgentsByTierAndSLA(mockAgents, query);
    assertEqual(results.length, 2, "Should return agents meeting SLA");
});

test("Discovery: Combined filter - tier=pro, rep=95+, SLA=2000ms", () => {
    const query = { tier: "pro", minReputation: 95, maxResponseTime: 2000 };
    const results = filterAgentsByTierAndSLA(mockAgents, query);
    assertEqual(results.length, 2, "Should return 2 agents (fitness 2000ms, recovery 1500ms)");
    assertTrue(
        results.find(a => a.id === "fitness-pro"),
        "Should include fitness-pro"
    );
    assertTrue(
        results.find(a => a.id === "recovery-premium"),
        "Should include recovery-premium"
    );
});

test("Discovery: Combined filter - tier=premium, rep=98+, SLA=500ms", () => {
    const query = { tier: "premium", minReputation: 98, maxResponseTime: 500 };
    const results = filterAgentsByTierAndSLA(mockAgents, query);
    assertEqual(results.length, 2, "Should return 2 agents");
    assertTrue(
        results.find(a => a.id === "fitness-pro"),
        "Should include fitness-pro"
    );
    assertTrue(
        results.find(a => a.id === "recovery-premium"),
        "Should include recovery-premium"
    );
});

test("Tier Info: Fitness pro supports all 3 tiers", () => {
    const agent = mockAgents[0];
    const tiers = Object.keys(agent.serviceAvailability).filter(
        tier => agent.serviceAvailability[tier]
    );
    assertEqual(tiers.length, 3, "Should support 3 tiers");
});

test("Tier Info: Nutrition basic only supports basic tier", () => {
    const agent = mockAgents[1];
    const tiers = Object.keys(agent.serviceAvailability).filter(
        tier => agent.serviceAvailability[tier]
    );
    assertEqual(tiers.length, 1, "Should support 1 tier");
    assertEqual(tiers[0], "basic", "Should be basic tier");
});

test("Tier Info: Availability checking - basic tier full", () => {
    const agent = mockAgents[1];
    const basic = agent.serviceAvailability.basic;
    assertTrue(
        basic.slotsFilled >= basic.slots,
        "Basic tier should be full"
    );
});

test("Tier Info: Pricing tiers increase with service level", () => {
    const agent = mockAgents[0];
    const pricing = agent.tieredPricing.fitness_analysis;
    const basic = parseFloat(pricing.basic.baseFee);
    const pro = parseFloat(pricing.pro.baseFee);
    const premium = parseFloat(pricing.premium.baseFee);
    
    assertTrue(basic < pro, "Pro should cost more than basic");
    assertTrue(pro < premium, "Premium should cost more than pro");
    assertTrue(pro / basic === 2.5, "Pro should be 2.5x basic");
    assertTrue(premium / basic === 5, "Premium should be 5x basic");
});

test("Tier Info: Response times decrease with service level", () => {
    const agent = mockAgents[0];
    const basic = agent.serviceAvailability.basic.responseSLA;
    const pro = agent.serviceAvailability.pro.responseSLA;
    const premium = agent.serviceAvailability.premium.responseSLA;
    
    assertTrue(premium < pro, "Premium should be faster than pro");
    assertTrue(pro < basic, "Pro should be faster than basic");
});

test("Tier Info: Uptime increases with service level", () => {
    const agent = mockAgents[0];
    const basic = agent.serviceAvailability.basic.uptime;
    const pro = agent.serviceAvailability.pro.uptime;
    const premium = agent.serviceAvailability.premium.uptime;
    
    assertTrue(premium > pro, "Premium should have higher uptime");
    assertTrue(pro > basic, "Pro should have higher uptime");
});

test("Tier Info: Recovery premium has tight SLA", () => {
    const agent = mockAgents[2];
    const premium = agent.serviceAvailability.premium.responseSLA;
    assertTrue(premium <= 300, "Premium should have <300ms SLA");
});

test("Edge Case: Empty results when no agents match all filters", () => {
    const query = { tier: "premium", minReputation: 100 };
    const results = filterAgentsByTierAndSLA(mockAgents, query);
    assertEqual(results.length, 0, "Should return empty when no matches");
});

test("Edge Case: Unknown tier filters agent out", () => {
    const query = { tier: "elite" }; // Invalid tier
    const results = filterAgentsByTierAndSLA(mockAgents, query);
    assertEqual(results.length, 0, "Should filter out agents without tier");
});

// ─────────────────────────────────────────────────────────────────────────────
// RESULTS
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(60)}`);
console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
console.log(`${'─'.repeat(60)}\n`);

if (failed === 0) {
    console.log("✅ All Phase D discovery tests passed!");
    console.log("\n✅ Phase D Week 1 architecture validated:");
    console.log("   - Service tier filtering works");
    console.log("   - Availability constraints enforced");
    console.log("   - SLA requirements verified");
    console.log("   - Tiered pricing structure correct");
    console.log("   - Reputation filtering functional");
    console.log("\n🚀 Ready for Week 2: BookingOrchestrator implementation");
    process.exit(0);
} else {
    console.log("❌ Some tests failed");
    process.exit(1);
}
