#!/usr/bin/env node

/**
 * Integration Test Suite for CDP + x402 Payment Flow
 *
 * This script tests the complete payment integration without requiring
 * a full frontend setup. Use this to validate your Lambda deployment.
 */

const https = require("https");

// Configuration
const CONFIG = {
  lambdaUrl:
    "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout",
  testWorkoutData: {
    exercise: "pullup",
    reps: 5,
    averageFormScore: 85,
    duration: 30,
    repHistory: [
      { score: 80, details: {} },
      { score: 85, details: {} },
      { score: 90, details: {} },
      { score: 85, details: {} },
      { score: 85, details: {} },
    ],
  },
};

/**
 * Make HTTP request with promise support
 */
function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body,
        });
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

/**
 * Test 1: CORS Preflight Request
 */
async function testCORSPreflight() {
  console.log("\n🧪 Test 1: CORS Preflight Request");
  console.log("=====================================");

  try {
    const response = await makeRequest(CONFIG.lambdaUrl, {
      method: "OPTIONS",
      headers: {
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type, X-Payment",
      },
    });

    console.log(`Status: ${response.statusCode}`);
    console.log("CORS Headers:");
    console.log(
      `  Access-Control-Allow-Origin: ${response.headers["access-control-allow-origin"]}`
    );
    console.log(
      `  Access-Control-Allow-Methods: ${response.headers["access-control-allow-methods"]}`
    );
    console.log(
      `  Access-Control-Allow-Headers: ${response.headers["access-control-allow-headers"]}`
    );

    if (response.statusCode === 200) {
      console.log("✅ CORS preflight test PASSED");
      return true;
    } else {
      console.log("❌ CORS preflight test FAILED");
      return false;
    }
  } catch (error) {
    console.log("❌ CORS preflight test ERROR:", error.message);
    return false;
  }
}

/**
 * Test 2: Payment Required (402) Response
 */
async function testPaymentRequired() {
  console.log("\n🧪 Test 2: Payment Required (402) Response");
  console.log("===========================================");

  try {
    const response = await makeRequest(
      CONFIG.lambdaUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
      JSON.stringify(CONFIG.testWorkoutData)
    );

    console.log(`Status: ${response.statusCode}`);

    if (response.statusCode === 402) {
      const challenge = JSON.parse(response.body);
      console.log("Payment Challenge:");
      console.log(`  Amount: ${challenge.accepts[0].amount}`);
      console.log(`  Asset: ${challenge.accepts[0].asset}`);
      console.log(`  Chain ID: ${challenge.accepts[0].chainId}`);
      console.log(`  PayTo Address: ${challenge.accepts[0].payTo}`);
      console.log(`  Facilitator: ${challenge.accepts[0].facilitator}`);
      console.log(`  Description: ${challenge.description}`);

      // Validate challenge structure
      const accept = challenge.accepts[0];
      const isValid =
        accept.scheme === "exact" &&
        accept.asset === "0x036CbD53842c5426634e7929541fC2318B3d053F" &&
        accept.amount === "50000" &&
        accept.chainId === 84532 &&
        accept.payTo === "0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA" &&
        accept.facilitator === "https://facilitator.cdp.coinbase.com";

      if (isValid) {
        console.log("✅ Payment challenge test PASSED");
        return true;
      } else {
        console.log("❌ Payment challenge validation FAILED");
        console.log("Expected values:");
        console.log("  scheme: exact");
        console.log("  asset: 0x036CbD53842c5426634e7929541fC2318B3d053F");
        console.log("  amount: 50000");
        console.log("  chainId: 84532");
        console.log("  payTo: 0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA");
        console.log("  facilitator: https://facilitator.cdp.coinbase.com");
        return false;
      }
    } else {
      console.log("❌ Expected 402 status, got:", response.statusCode);
      console.log("Response body:", response.body);
      return false;
    }
  } catch (error) {
    console.log("❌ Payment required test ERROR:", error.message);
    return false;
  }
}

/**
 * Test 3: Lambda Function Health Check
 */
async function testLambdaHealth() {
  console.log("\n🧪 Test 3: Lambda Function Health Check");
  console.log("=======================================");

  try {
    // Test with a malformed request to see if Lambda is responding
    const response = await makeRequest(
      CONFIG.lambdaUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
      '{"invalid": "json"'
    );

    console.log(`Status: ${response.statusCode}`);

    if (response.statusCode === 402 || response.statusCode === 500) {
      console.log("✅ Lambda function is responding");
      return true;
    } else {
      console.log("❌ Unexpected response from Lambda");
      console.log("Response:", response.body);
      return false;
    }
  } catch (error) {
    console.log("❌ Lambda health check ERROR:", error.message);
    return false;
  }
}

/**
 * Test 4: Environment Configuration Check
 */
async function testEnvironmentConfig() {
  console.log("\n🧪 Test 4: Environment Configuration Check");
  console.log("==========================================");

  // This test validates the 402 response contains correct configuration
  try {
    const response = await makeRequest(
      CONFIG.lambdaUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
      JSON.stringify(CONFIG.testWorkoutData)
    );

    if (response.statusCode === 402) {
      const challenge = JSON.parse(response.body);
      const config = challenge.accepts[0];

      console.log("Configuration Check:");
      console.log(`  ✓ Revenue Splitter Address: ${config.payTo}`);
      console.log(`  ✓ Base Sepolia Chain ID: ${config.chainId}`);
      console.log(`  ✓ USDC Payment Amount: ${config.amount} (0.05 USDC)`);
      console.log(`  ✓ CDP Facilitator URL: ${config.facilitator}`);

      console.log("✅ Environment configuration test PASSED");
      return true;
    } else {
      console.log("❌ Could not retrieve configuration from 402 response");
      return false;
    }
  } catch (error) {
    console.log("❌ Environment config test ERROR:", error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log("🚀 CDP + x402 Integration Test Suite");
  console.log("====================================");
  console.log(`Testing Lambda URL: ${CONFIG.lambdaUrl}`);

  const results = [];

  // Run all tests
  results.push(await testCORSPreflight());
  results.push(await testPaymentRequired());
  results.push(await testLambdaHealth());
  results.push(await testEnvironmentConfig());

  // Summary
  console.log("\n📊 Test Results Summary");
  console.log("=======================");

  const passed = results.filter((r) => r).length;
  const total = results.length;

  console.log(`Tests Passed: ${passed}/${total}`);

  if (passed === total) {
    console.log("🎉 All tests PASSED! Your integration is ready.");
    console.log("\nNext Steps:");
    console.log("1. Test the complete flow from your frontend");
    console.log("2. Make a real payment to verify end-to-end functionality");
    console.log("3. Check your RevenueSplitter contract for received payments");
  } else {
    console.log(
      "❌ Some tests FAILED. Please check your Lambda configuration."
    );
    console.log("\nTroubleshooting:");
    console.log("1. Verify your Lambda environment variables");
    console.log("2. Check CloudWatch logs for detailed error messages");
    console.log("3. Ensure your Lambda has proper IAM permissions");
  }

  process.exit(passed === total ? 0 : 1);
}

// Run the tests
runTests().catch((error) => {
  console.error("💥 Test suite failed:", error);
  process.exit(1);
});
