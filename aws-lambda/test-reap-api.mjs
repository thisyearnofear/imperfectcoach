/**
 * Test: Reap Protocol API for Agent Discovery
 * 
 * Uses the actual Reap API endpoint (https://avax2.api.reap.deals)
 * to discover agents via MCP and A2A registries
 * 
 * Not using the SDK, just direct API calls to understand:
 * - Available endpoints
 * - Agent discovery format
 * - x402 pricing info
 */

const REAP_API = "https://avax2.api.reap.deals";

const CAPABILITIES = [
  "nutrition_planning",
  "biomechanics_analysis",
  "recovery_planning",
  "fitness_analysis",
];

async function discoverAgentsViaAPI(capability) {
  console.log(`\n🔍 Searching for: ${capability}`);
  console.log("─".repeat(60));

  try {
    // Try multiple endpoint patterns that might exist
    const endpoints = [
      // Pattern 1: /discover or /search
      `${REAP_API}/agents/discover?capability=${capability}`,
      `${REAP_API}/agents/search?capability=${capability}`,
      
      // Pattern 2: /registry endpoints
      `${REAP_API}/registries/mcp/search?capability=${capability}`,
      `${REAP_API}/registries/a2a/search?capability=${capability}`,
      
      // Pattern 3: /marketplace
      `${REAP_API}/marketplace/agents?capability=${capability}`,
      `${REAP_API}/marketplace/services?type=${capability}`,
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`   Trying: ${endpoint.replace(REAP_API, "")}`);
        
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "ImperfectCoach/1.0",
          },
          timeout: 5000,
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ Success! Found ${data.agents?.length || data.length || 0} agents`);
          console.log(`   Response structure:`, JSON.stringify(data, null, 2).slice(0, 500));
          return data;
        }
      } catch (e) {
        // Endpoint doesn't exist or timed out, try next
        continue;
      }
    }

    console.log("   ⚠️  No successful endpoints found for this capability");
    return null;
  } catch (error) {
    console.error(`   ❌ Discovery error: ${error.message}`);
    return null;
  }
}

async function testReapAPIDirect() {
  console.log("═".repeat(60));
  console.log("Testing Reap Protocol API Directly");
  console.log("═".repeat(60));
  console.log(`\nReap Endpoint: ${REAP_API}`);
  console.log("Docs: https://docs.reap.deals/");
  console.log("\nChecking for agent discovery endpoints...\n");

  // First, check if API is reachable
  try {
    console.log("📡 Checking API health...");
    const healthEndpoints = [
      `${REAP_API}/health`,
      `${REAP_API}/ping`,
      `${REAP_API}/status`,
      `${REAP_API}/`,
    ];

    let isHealthy = false;
    for (const endpoint of healthEndpoints) {
      try {
        const response = await fetch(endpoint, { timeout: 3000 });
        if (response.ok) {
          console.log(`✅ API is reachable at ${endpoint}`);
          isHealthy = true;
          const data = await response.json().catch(() => ({}));
          console.log(`   Response: ${JSON.stringify(data).slice(0, 200)}\n`);
          break;
        }
      } catch (e) {
        // Try next endpoint
      }
    }

    if (!isHealthy) {
      console.log("⚠️  API health check inconclusive, attempting discovery anyway...\n");
    }
  } catch (error) {
    console.log(`⚠️  Health check failed: ${error.message}\n`);
  }

  // Test agent discovery for each capability
  const results = {};
  for (const capability of CAPABILITIES) {
    const agents = await discoverAgentsViaAPI(capability);
    results[capability] = agents;
  }

  // Summary
  console.log("\n" + "═".repeat(60));
  console.log("Summary");
  console.log("═".repeat(60));

  let foundAgents = false;
  for (const [capability, agents] of Object.entries(results)) {
    if (agents) {
      console.log(`✅ ${capability}: ${agents.agents?.length || agents.length || "?"} agents`);
      foundAgents = true;
    }
  }

  if (!foundAgents) {
    console.log("⚠️  No agents discovered via any endpoint\n");
    console.log("Possible reasons:");
    console.log("  1. Reap API is not available yet");
    console.log("  2. Different API structure than expected");
    console.log("  3. Need authentication headers");
    console.log("  4. Endpoint requires POST instead of GET");
    console.log("\nNext step: Check Reap documentation or API spec");
  } else {
    console.log("\n✅ Successfully connected to Reap agent discovery!");
  }
}

// Run test
testReapAPIDirect().catch(console.error);
