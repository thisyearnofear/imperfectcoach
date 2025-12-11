/**
 * Test: Discover Real Agents via Reap Protocol
 * 
 * Purpose: Validate that we can actually discover and interact with
 * real specialist agents available on Reap Protocol
 * 
 * Tests:
 * 1. Reap client connectivity
 * 2. Search for agents by capability
 * 3. Inspect agent profiles, pricing, reputation
 * 4. Understand data structure
 */

import { ReapClient } from "@reap-protocol/sdk";

const REAP_CONFIG = {
  endpoint: process.env.REAP_ENDPOINT || "https://api.reap.io",
  walletKey: process.env.AGENT_WALLET_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000",
  rpcUrl: process.env.AVALANCHE_RPC || "https://api.avax-test.network/ext/bc/C/rpc",
};

const CAPABILITIES = ["nutrition_planning", "biomechanics_analysis", "recovery_planning", "fitness_analysis"];

async function testReapConnectivity() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("Testing Reap Protocol Connectivity");
  console.log("═══════════════════════════════════════════════════════════════\n");

  console.log("📋 Configuration:");
  console.log(`   Endpoint: ${REAP_CONFIG.endpoint}`);
  console.log(`   RPC: ${REAP_CONFIG.rpcUrl}`);
  console.log(`   Wallet Key: ${REAP_CONFIG.walletKey.slice(0, 10)}...${REAP_CONFIG.walletKey.slice(-10)}\n`);

  try {
    console.log("🔌 Initializing Reap client...");
    
    // Try to initialize the Reap client
    const client = new ReapClient(REAP_CONFIG.walletKey, REAP_CONFIG.rpcUrl);
    
    console.log("✅ Reap client initialized successfully\n");

    // Try to discover agents for each capability
    console.log("🔍 Searching for agents by capability...\n");

    const results = {};

    for (const capability of CAPABILITIES) {
      console.log(`─────────────────────────────────────────────────────────────`);
      console.log(`📌 Capability: ${capability}`);
      console.log(`─────────────────────────────────────────────────────────────`);

      try {
        console.log(`   Searching for x402 agents...`);
        const agents = await Promise.race([
          client.searchAgents(capability, "x402"),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Search timeout (5s)")), 5000)
          ),
        ]);

        console.log(`   ✅ Found ${agents.length} x402 agents\n`);
        results[capability] = agents;

        if (agents.length > 0) {
          // Show first 2 agents as samples
          agents.slice(0, 2).forEach((agent, idx) => {
            console.log(`   Agent ${idx + 1}:`);
            console.log(`     ID: ${agent.id || agent.address || "N/A"}`);
            console.log(`     Name: ${agent.name || "N/A"}`);
            console.log(`     Description: ${agent.description || "N/A"}`);
            console.log(`     Endpoint: ${agent.endpoint || "N/A"}`);
            console.log(`     Reputation: ${agent.reputationScore || "N/A"}`);
            console.log(`     Pricing: ${agent.baseFee || "N/A"} ${agent.asset || "USDC"}`);
            console.log(`     Tags: ${(agent.tags || []).join(", ") || "None"}`);
            console.log(`     Raw data: ${JSON.stringify(agent, null, 2)}\n`);
          });

          if (agents.length > 2) {
            console.log(`   ... and ${agents.length - 2} more agents\n`);
          }
        }
      } catch (error) {
        console.log(`   ⚠️  Search failed: ${error.message}\n`);
        results[capability] = [];
      }
    }

    // Summary
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("Discovery Summary");
    console.log("═══════════════════════════════════════════════════════════════\n");

    let totalAgents = 0;
    for (const [capability, agents] of Object.entries(results)) {
      console.log(`${capability}: ${agents.length} agents`);
      totalAgents += agents.length;
    }

    console.log(`\nTotal unique agents available: ${totalAgents}`);

    if (totalAgents === 0) {
      console.log("\n⚠️  No agents found via Reap Protocol.");
      console.log("   Possible reasons:");
      console.log("   - Reap API endpoint not responding");
      console.log("   - No agents registered on Reap yet");
      console.log("   - Capability names don't match Reap's format");
      console.log("   - Network/RPC configuration issue");
    } else {
      console.log("\n✅ Successfully discovered agents via Reap!");
      console.log("   → Can proceed with Reap-based discovery");
      console.log("   → Agents available for booking");
    }

  } catch (error) {
    console.error("\n❌ Reap client initialization failed:");
    console.error(`   ${error.message}`);
    console.log("\nPossible issues:");
    console.log("   - @reap-protocol/sdk not installed");
    console.log("   - Invalid wallet key format");
    console.log("   - Network connectivity issue");
    console.log("   - Reap API endpoint unavailable");
  }
}

// Run test
testReapConnectivity().catch(console.error);
