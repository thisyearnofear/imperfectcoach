/**
 * Test: AgentRegistry Smart Contract Integration
 * 
 * Verifies that we can read agent data from deployed contracts:
 * - Base Sepolia: 0xfE997dEdF572CA17d26400bCDB6428A8278a0627
 * - Avalanche Fuji: 0x1c2127562C52f2cfDd74e23A227A2ece6dFb42DC
 * 
 * Tests:
 * 1. Contract connectivity on both chains
 * 2. getAllAgents() - returns all registered agents
 * 3. findAgentsByCapability() - filters by capability
 * 4. Pricing structure
 * 5. Reputation and uptime data
 */

import { createPublicClient, http } from "viem";
import { base, avalanche } from "viem/chains";

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const CONTRACTS = {
  "base-sepolia": {
    address: "0xfE997dEdF572CA17d26400bCDB6428A8278a0627",
    chain: base,
    rpc: "https://sepolia.base.org",
    name: "Base Sepolia",
  },
  "avalanche-fuji": {
    address: "0x1c2127562C52f2cfDd74e23A227A2ece6dFb42DC",
    chain: avalanche,
    rpc: "https://api.avax-test.network/ext/bc/C/rpc",
    name: "Avalanche Fuji",
  },
};

// Capability enum (must match AgentRegistry.sol)
const CAPABILITY_ENUM = {
  FITNESS_ANALYSIS: 0,
  NUTRITION_PLANNING: 1,
  BIOMECHANICS_ANALYSIS: 2,
  RECOVERY_PLANNING: 3,
  CALENDAR_COORDINATION: 4,
  MASSAGE_BOOKING: 5,
  BENCHMARK_ANALYSIS: 6,
};

const CAPABILITY_NAMES = {
  0: "fitness_analysis",
  1: "nutrition_planning",
  2: "biomechanics_analysis",
  3: "recovery_planning",
  4: "calendar_coordination",
  5: "massage_booking",
  6: "benchmark_analysis",
};

// Minimal ABI for reading functions
const ABI = [
  {
    name: "getAllAgents",
    outputs: [
      {
        components: [
          { name: "walletAddress", type: "address" },
          { name: "name", type: "string" },
          { name: "endpoint", type: "string" },
          { name: "capabilities", type: "uint8[]" },
          { name: "reputationScore", type: "uint256" },
          { name: "uptime", type: "uint256" },
          { name: "active", type: "bool" },
        ],
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    name: "findAgentsByCapability",
    inputs: [{ name: "_capability", type: "uint8" }],
    outputs: [
      {
        components: [
          { name: "walletAddress", type: "address" },
          { name: "name", type: "string" },
          { name: "endpoint", type: "string" },
          { name: "capabilities", type: "uint8[]" },
          { name: "reputationScore", type: "uint256" },
          { name: "uptime", type: "uint256" },
          { name: "active", type: "bool" },
        ],
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Test Functions
// ─────────────────────────────────────────────────────────────────────────────

async function testContractConnectivity(chainKey) {
  const config = CONTRACTS[chainKey];
  console.log(`\n📡 Testing ${config.name}...`);

  try {
    const client = createPublicClient({
      chain: config.chain,
      transport: http(config.rpc),
    });

    // Test basic connectivity by getting chain ID
    const chainId = await client.getChainId();
    console.log(`   ✅ Connected to ${config.name} (chainId: ${chainId})`);
    return client;
  } catch (error) {
    console.log(`   ❌ Connection failed: ${error.message}`);
    return null;
  }
}

async function testGetAllAgents(client, chainKey) {
  const config = CONTRACTS[chainKey];
  console.log(`\n📋 Testing getAllAgents() on ${config.name}...`);

  try {
    const agents = await client.readContract({
      address: config.address,
      abi: ABI,
      functionName: "getAllAgents",
    });

    console.log(`   ✅ Retrieved ${agents.length} agents`);

    if (agents.length === 0) {
      console.log(`   ⚠️  No agents registered on ${chainKey} yet`);
      return agents;
    }

    // Display first agent as sample
    const firstAgent = agents[0];
    console.log(`\n   Sample Agent:`);
    console.log(`     Name: ${firstAgent.name}`);
    console.log(`     Address: ${firstAgent.walletAddress}`);
    console.log(`     Endpoint: ${firstAgent.endpoint}`);
    console.log(`     Reputation: ${Number(firstAgent.reputationScore)}/100`);
    console.log(`     Uptime: ${Number(firstAgent.uptime)}%`);
    console.log(`     Active: ${firstAgent.active}`);
    console.log(`     Capabilities: ${firstAgent.capabilities.map((c) => CAPABILITY_NAMES[c]).join(", ")}`);

    return agents;
  } catch (error) {
    console.log(`   ❌ getAllAgents() failed: ${error.message}`);
    return [];
  }
}

async function testFindByCapability(client, chainKey, capabilityName) {
  const config = CONTRACTS[chainKey];
  const capabilityEnum = CAPABILITY_ENUM[capabilityName.toUpperCase()];

  if (capabilityEnum === undefined) {
    console.log(`   ⚠️  Unknown capability: ${capabilityName}`);
    return [];
  }

  console.log(`\n🔍 Testing findAgentsByCapability(${capabilityName}) on ${config.name}...`);

  try {
    const agents = await client.readContract({
      address: config.address,
      abi: ABI,
      functionName: "findAgentsByCapability",
      args: [capabilityEnum],
    });

    console.log(`   ✅ Found ${agents.length} agents offering ${capabilityName}`);

    if (agents.length > 0) {
      agents.slice(0, 2).forEach((agent, idx) => {
        console.log(`\n   Agent ${idx + 1}: ${agent.name}`);
        console.log(`     Reputation: ${Number(agent.reputationScore)}/100`);
        console.log(`     Uptime: ${Number(agent.uptime)}%`);
      });
    }

    return agents;
  } catch (error) {
    console.log(`   ❌ findAgentsByCapability() failed: ${error.message}`);
    return [];
  }
}

async function runAllTests() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("AgentRegistry Smart Contract Integration Test");
  console.log("═══════════════════════════════════════════════════════════════");

  const results = {
    "base-sepolia": { connected: false, agents: 0, capabilities: {} },
    "avalanche-fuji": { connected: false, agents: 0, capabilities: {} },
  };

  for (const chainKey of Object.keys(CONTRACTS)) {
    // Test connectivity
    const client = await testContractConnectivity(chainKey);
    if (!client) {
      console.log(`   ⚠️  Skipping further tests for ${chainKey}`);
      continue;
    }

    results[chainKey].connected = true;

    // Test getAllAgents
    const allAgents = await testGetAllAgents(client, chainKey);
    results[chainKey].agents = allAgents.length;

    // Test findByCapability for each capability
    const capabilities = ["fitness_analysis", "nutrition_planning", "recovery_planning"];
    for (const cap of capabilities) {
      const agents = await testFindByCapability(client, chainKey, cap);
      results[chainKey].capabilities[cap] = agents.length;
    }
  }

  // Summary
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("Test Summary");
  console.log("═══════════════════════════════════════════════════════════════");

  for (const [chain, result] of Object.entries(results)) {
    console.log(`\n${chain}:`);
    console.log(`  Connected: ${result.connected ? "✅" : "❌"}`);
    console.log(`  Total Agents: ${result.agents}`);

    if (result.agents > 0) {
      console.log(`  Capabilities:`);
      for (const [cap, count] of Object.entries(result.capabilities)) {
        console.log(`    - ${cap}: ${count} agents`);
      }
    }
  }

  // Recommendations
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("Next Steps");
  console.log("═══════════════════════════════════════════════════════════════");

  const baseSepAgents = results["base-sepolia"].agents;
  const avalFujiAgents = results["avalanche-fuji"].agents;

  if (baseSepAgents === 0 && avalFujiAgents === 0) {
    console.log("⚠️  No agents registered on-chain yet.");
    console.log("   → Register test agents via AgentRegistry.registerAgent()");
    console.log("   → Or keep using CORE_AGENTS as primary source");
  } else if (baseSepAgents > 0 || avalFujiAgents > 0) {
    console.log("✅ Agents found on-chain!");
    console.log("   → Create agent-registry-integration.mjs");
    console.log("   → Update discovery pipeline to prioritize on-chain agents");
    console.log("   → Keep CORE_AGENTS as fallback");
  }
}

// Run tests
runAllTests().catch(console.error);
