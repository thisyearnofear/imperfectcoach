
import { handler } from './aws-lambda/agent-discovery.mjs';

async function testDiscovery() {
    console.log("🧪 Testing Agent Discovery Service (Local Simulation)...");

    // 1. Test GET /agents (Discovery)
    console.log("\n--- TEST 1: Discover All Agents ---");
    const event1 = {
        httpMethod: "GET",
        path: "/agents",
        queryStringParameters: { capability: "fitness_analysis" }
    };
    const result1 = await handler(event1);
    console.log("Status:", result1.statusCode);
    const body1 = JSON.parse(result1.body);
    console.log("Agents Found:", body1.count);
    console.log("First Agent:", body1.agents[0]?.name);

    // 2. Test POST /agents/register (New Agent)
    console.log("\n--- TEST 2: Register New Agent ---");
    const newAgent = {
        id: "agent-test-01",
        name: "Test Agent",
        description: "A test agent.",
        capabilities: ["calendar_coordination"],
        pricing: { "calendar_coordination": { baseFee: "0.01", asset: "USDC", chain: "base-sepolia" } },
        endpoint: "https://test.com"
    };

    const event2 = {
        httpMethod: "POST",
        path: "/agents/register",
        body: JSON.stringify({
            profile: newAgent,
            signature: "dummy-sig"
        })
    };

    const result2 = await handler(event2);
    console.log("Status:", result2.statusCode);
    console.log("Body:", result2.body);

    // 3. Test Discovery Again (Should include new agent)
    console.log("\n--- TEST 3: Discover New Agent ---");
    const event3 = {
        httpMethod: "GET",
        path: "/agents",
        queryStringParameters: { capability: "calendar_coordination" }
    };
    const result3 = await handler(event3);
    const body3 = JSON.parse(result3.body);
    console.log("Agents Found:", body3.count);
    console.log("Found Name:", body3.agents[0]?.name);
}

testDiscovery();
