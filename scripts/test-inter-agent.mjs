
import { handler } from './aws-lambda/index.mjs';
import { AgentClient } from './aws-lambda/lib/agent-client.mjs';

async function testInterAgentExchange() {
    console.log("🧪 Testing Phase 3: Agent-to-Agent Data Access via x402...");

    // Mock "Nutrition Agent" Identity
    const nutritionAgentWallet = {
        address: "0xNutritionAgentAddress123",
        privateKey: "mock-key"
    };

    console.log("\n--- Scenario: Nutrition Agent needs user workout history ---");
    console.log(`🤖 Source: Nutrition Agent (${nutritionAgentWallet.address})`);
    console.log(`🎯 Target: Fitness Core Agent (Local Handler)`);

    const payload = {
        type: "data_query",
        workoutData: { userId: "user-123" } // In real helper, we'd pass auth token for user consent
    };

    try {
        // Execute the autonomous call loop
        const result = await AgentClient.call(handler, payload, nutritionAgentWallet);

        console.log("\n✅ INTER-AGENT EXCHANGE SUCCESSFUL!");
        console.log("-----------------------------------------");
        console.log("Type:", result.type);
        console.log("Data Items:", result.data.length);
        console.log("Cost Paid:", result.meta.access_cost);
        console.log("First Record:", result.data[0]);
        console.log("-----------------------------------------");

    } catch (err) {
        console.error("❌ Exchange Failed:", err);
    }
}

testInterAgentExchange();
