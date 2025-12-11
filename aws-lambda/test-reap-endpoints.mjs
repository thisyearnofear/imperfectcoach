/**
 * Probe: Discover available Reap API endpoints
 * 
 * The API is online but we need to find the right endpoint structure
 */

const REAP_API = "https://avax2.api.reap.deals";

const POSSIBLE_PATHS = [
  // Root/info
  "/",
  "/v1",
  "/api",
  "/api/v1",
  
  // Agents
  "/agents",
  "/agents/list",
  "/agents/all",
  
  // Discovery
  "/discover",
  "/search",
  "/registry",
  
  // Services
  "/services",
  "/services/list",
  
  // Registries
  "/registries",
  "/registries/list",
  "/registries/mcp",
  "/registries/a2a",
  
  // Marketplace
  "/marketplace",
  "/marketplace/agents",
  "/marketplace/services",
  
  // Products (might be in Reap SDK name)
  "/products",
  "/products/list",
  
  // Carts
  "/carts",
  "/carts/list",
  
  // x402
  "/x402",
  "/x402/agents",
  "/x402/services",
];

async function probeEndpoint(path) {
  try {
    const url = REAP_API + path;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 3000,
    });

    if (response.ok || response.status === 400 || response.status === 401) {
      const text = await response.text();
      const data = text.length > 0 ? JSON.parse(text) : {};
      return {
        status: response.status,
        ok: response.ok,
        data: typeof data === "object" ? Object.keys(data).slice(0, 5) : "string",
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function probeAllEndpoints() {
  console.log("═".repeat(70));
  console.log("Reap API Endpoint Discovery");
  console.log("═".repeat(70));
  console.log(`\nProbing: ${REAP_API}\n`);

  const results = [];

  for (const path of POSSIBLE_PATHS) {
    process.stdout.write(`Testing ${path.padEnd(30)} ... `);
    const result = await probeEndpoint(path);

    if (result) {
      console.log(`✅ Status ${result.status}`);
      results.push({
        path,
        status: result.status,
        ok: result.ok,
        keys: result.data,
      });
    } else {
      process.stdout.write(`\r`);
      process.stdout.clearLine(0);
    }
  }

  console.log("\n" + "─".repeat(70));
  console.log("Available Endpoints:");
  console.log("─".repeat(70) + "\n");

  if (results.length === 0) {
    console.log("⚠️  No responsive endpoints found");
  } else {
    results.sort((a, b) => a.path.localeCompare(b.path));
    results.forEach((r) => {
      const status = r.ok ? "✅" : "⚠️";
      console.log(`${status} ${r.path.padEnd(30)} [${r.status}]`);
      if (r.keys.length > 0) {
        console.log(`   Keys: ${r.keys.join(", ")}`);
      }
    });
  }

  console.log("\n" + "─".repeat(70));
  console.log("Next: Check documentation or contact Reap team");
  console.log("─".repeat(70));
}

probeAllEndpoints().catch(console.error);
