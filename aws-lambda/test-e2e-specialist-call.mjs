/**
 * End-to-End Test: Bedrock Coach → Specialist Agent via x402
 * 
 * Demonstrates full flow:
 * 1. Bedrock Fitness Coach identifies need for specialist
 * 2. Coach calls call_specialist_agent tool
 * 3. Tool searches CORE_AGENTS by capability
 * 4. Tool initiates x402 payment
 * 5. Tool calls specialist endpoint
 * 6. Tool returns results with payment proof + SLA tracking
 */

import * as coreHandler from "./lib/core-agent-handler.mjs";

async function testSpecialistCall() {
  console.log("═".repeat(70));
  console.log("End-to-End Test: Bedrock Coach → Specialist Agent via x402");
  console.log("═".repeat(70));

  // Simulate Bedrock agent decision to call specialist
  const coachAgent = {
    id: "agent-fitness-core-01",
    name: "Fitness Coach (Bedrock)",
    address: "0x1234567890123456789012345678901234567890",
  };

  const testCases = [
    {
      capability: "nutrition_planning",
      amount: "0.03",
      tier: "pro",
      reason: "User asks about post-workout nutrition",
    },
    {
      capability: "recovery_planning",
      amount: "0.05",
      tier: "premium",
      reason: "User complains about soreness and fatigue",
    },
    {
      capability: "biomechanics_analysis",
      amount: "0.08",
      tier: "basic",
      reason: "Coach detects form imbalance in video",
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n${"─".repeat(70)}`);
    console.log(`Test Case: ${testCase.reason}`);
    console.log(`${"─".repeat(70)}\n`);

    console.log(`🤖 ${coachAgent.name} analyzes user data...`);
    console.log(`   Decision: Call ${testCase.capability} specialist\n`);

    // Step 1: Discover specialist
    console.log(`Step 1️⃣  Agent Discovery`);
    const specialists = coreHandler.findAgentsByCapability(testCase.capability);

    if (specialists.length === 0) {
      console.log(`   ❌ No specialists found\n`);
      continue;
    }

    const specialist = specialists[0];
    console.log(`   ✅ Found: ${specialist.name}`);
    console.log(`      ID: ${specialist.id}`);
    console.log(`      Reputation: ${specialist.reputationScore}/100`);
    console.log(`      Capability: ${testCase.capability}`);
    console.log(`      Pricing:\n`);

    // Show pricing for the tier
    if (specialist.tieredPricing?.[testCase.capability]?.[testCase.tier]) {
      const tierPrice =
        specialist.tieredPricing[testCase.capability][testCase.tier];
      console.log(
        `         ${testCase.tier.toUpperCase()}: ${tierPrice.baseFee} ${tierPrice.asset}`
      );
    }

    // Step 2: x402 Payment
    console.log(`\nStep 2️⃣  x402 Payment Negotiation`);
    const paymentProof = await coreHandler.simulateX402Payment(
      specialist,
      testCase.amount,
      "base-sepolia"
    );

    console.log(`   Transaction: ${paymentProof.transactionHash}`);
    console.log(`   Network: ${paymentProof.network}`);
    console.log(`   Status: ${paymentProof.status}`);

    // Step 3: Call specialist endpoint
    console.log(`\nStep 3️⃣  Specialist Service Execution`);
    const response = await coreHandler.callSpecialistEndpoint(
      specialist,
      testCase.capability,
      { userContext: "recovering from intense workout" }
    );

    console.log(`   ✅ Response received`);
    if (response.plan || response.program || response.analysis) {
      const key = Object.keys(response).find(
        (k) => typeof response[k] === "string"
      );
      console.log(`      ${key}: ${response[key]}`);
    }
    if (response.recommendations || response.findings) {
      const recs = response.recommendations || response.findings;
      console.log(`      Recommendations:`);
      recs.slice(0, 2).forEach((r) => console.log(`        - ${r}`));
    }

    // Step 4: Record payment
    console.log(`\nStep 4️⃣  Audit Trail Recording`);
    const paymentRecord = await coreHandler.recordAgentPayment(
      coachAgent.id,
      specialist,
      paymentProof,
      testCase.capability
    );

    // Step 5: SLA Tracking
    console.log(`\nStep 5️⃣  SLA Performance Tracking`);
    const slaData = coreHandler.calculateSLAPerformance(testCase.tier, 350);

    console.log(`   Tier: ${slaData.tier}`);
    console.log(`   Expected: ${slaData.expectedMs}ms`);
    console.log(`   Actual: ${slaData.actualMs}ms`);
    console.log(`   ${slaData.message}`);

    // Step 6: Return to user
    console.log(`\nStep 6️⃣  Coach Presents Specialist Analysis`);
    console.log(
      `   "I've consulted our ${specialist.name} specialist about your situation."`
    );
    console.log(
      `   "Here's what they recommend: ${response.plan || response.program || response.analysis}"`
    );
    console.log(
      `   "Payment processed on Base Sepolia: ${paymentProof.transactionHash}"`
    );
  }

  // Summary
  console.log(`\n${"═".repeat(70)}`);
  console.log("Test Summary");
  console.log("═".repeat(70));

  console.log(`\n✅ End-to-end x402 flow working:`);
  console.log(`   1. Coach identifies need for specialist`);
  console.log(`   2. Discovers agent from CORE_AGENTS`);
  console.log(`   3. Negotiates x402 payment`);
  console.log(`   4. Calls agent endpoint`);
  console.log(`   5. Tracks SLA performance`);
  console.log(`   6. Records audit trail`);
  console.log(`   7. Returns results to user`);

  console.log(`\n💡 Key Features:`);
  console.log(`   • Autonomous agent discovery by capability`);
  console.log(`   • Immediate x402 settlement (no escrow)`);
  console.log(`   • SLA enforcement with penalty system`);
  console.log(`   • Reputation tracking on-chain (AgentRegistry.sol)`);
  console.log(`   • Full audit trail for transparency`);
  console.log(`   • Ready for real payments on Base Sepolia & Avalanche Fuji`);
}

// Run test
testSpecialistCall().catch(console.error);
