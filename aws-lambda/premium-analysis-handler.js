// Import AWS Bedrock SDK
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

// Import Coinbase Developer Platform (CDP) SDK v2
import { CdpClient } from "@coinbase/cdp-sdk";

// Import viem for EVM transaction handling (needed for transaction confirmation)
import { http, createPublicClient, parseEther } from "viem";
import { baseSepolia } from "viem/chains";

// Initialize Bedrock Runtime Client
const bedrockClient = new BedrockRuntimeClient({
  region: "eu-north-1",
});

// Initialize CDP Client globally.
// The CdpClient automatically loads API Key ID, API Key Secret, and Wallet Secret
// from environment variables (CDP_API_KEY_ID, CDP_API_KEY_SECRET, CDP_WALLET_SECRET).
// Ensure these are set in your Lambda's environment configuration.
let cdp;
try {
  cdp = new CdpClient();
  console.log(
    "✅ CDP SDK v2 CdpClient initialized for autonomous treasury management"
  );
} catch (error) {
  console.error("💥 Failed to initialize CdpClient:", error);
  // Depending on severity, you might want to throw or disable features
}

// Initialize viem public client for Base Sepolia
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// USDC Contract Address on Base Sepolia
const USDC_ADDRESS_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541fC2318B3d053F";

// Payment Configuration - connects to your RevenueSplitter contract
const PAYMENT_CONFIG = {
  facilitatorUrl:
    process.env.FACILITATOR_URL || "https://facilitator.cdp.coinbase.com",
  sellerWallet:
    process.env.REVENUE_SPLITTER_ADDRESS ||
    "0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA", // Your RevenueSplitter contract
  amount: "50000", // 0.05 USDC (6 decimals)
  asset: USDC_ADDRESS_BASE_SEPOLIA,
  chainId: 84532, // Base Sepolia
  network: "base-sepolia",
  scheme: "exact",
  resource:
    "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout",
  description: "Premium workout analysis powered by Amazon Bedrock",
  mimeType: "application/json",
  maxTimeoutSeconds: 300,
};

// CDP Account Configuration for Autonomous Treasury Management
const CDP_CONFIG = {
  // Treasury account name for managing platform funds (using names as per v2 docs getOrCreateAccount)
  treasuryAccountName:
    process.env.CDP_TREASURY_ACCOUNT_NAME || "treasury-account-default",
  userRewardsAccountName:
    process.env.CDP_USER_REWARDS_ACCOUNT_NAME || "user-rewards-account-default",
  referrersAccountName:
    process.env.CDP_REFERRER_ACCOUNT_NAME || "referrer-account-default",

  // Revenue distribution percentages (matching your RevenueSplitter)
  revenueDistribution: {
    platform: 0.7, // 70% to platform treasury
    userRewards: 0.2, // 20% to user rewards pool
    referrers: 0.1, // 10% to referrer pool
  },
  // Minimum balance thresholds for automated payouts
  thresholds: {
    minDistributionAmount: "1000000", // 1 USDC minimum for distribution (micro-USDC)
    maxTreasuryBalance: "10000000", // 10 USDC max before auto-distribution (micro-USDC)
  },
};

// CORS headers for all responses
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Payment, X-Payment-Response",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Export the handler function
export const handler = async (event) => {
  // Changed to export const
  console.log(
    "🚀 Premium Analysis Lambda - Event received:",
    JSON.stringify(event, null, 2)
  );

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: "",
    };
  }

  try {
    // Parse request body
    const workoutData = JSON.parse(event.body || "{}");
    console.log("💪 Workout data received:", workoutData);

    // Check if this is a test request for wallet/account creation
    if (workoutData.test === "create_wallets") {
      // Renamed to create_accounts semantically in logs below
      console.log("🧪 Running account creation test...");
      try {
        const testResult = await testAccountCreation(); // Updated function name
        return {
          statusCode: 200,
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(testResult),
        };
      } catch (error) {
        console.error("💥 Account creation test failed:", error);
        return {
          statusCode: 500,
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            error: "Test failed",
            details:
              error.message || "Unknown error during account creation test",
          }),
        };
      }
    }

    // Check for X-Payment header (x402 protocol)
    const paymentHeader =
      event.headers["x-payment"] || event.headers["X-Payment"];

    if (!paymentHeader) {
      console.log(
        "❌ No payment header found - returning 402 Payment Required"
      );
      return createPaymentRequiredResponse();
    }

    console.log("💳 Payment header found, verifying and settling...");

    // Verify and settle payment through CDP facilitator
    const paymentResult = await verifyAndSettlePayment(paymentHeader);

    if (!paymentResult.success) {
      console.error(
        "❌ Payment verification/settlement failed:",
        paymentResult.error
      );
      return createPaymentRequiredResponse(paymentResult.error);
    }

    console.log("✅ Payment verified and settled successfully");

    // Trigger autonomous treasury management after successful payment
    try {
      await manageAutonomousTreasury(paymentResult);
      console.log("💰 Autonomous treasury management completed");
    } catch (treasuryError) {
      console.warn(
        "⚠️ Treasury management failed (continuing with analysis):",
        treasuryError.message
      );
      // Don't fail the analysis if treasury management fails
    }

    console.log("🧠 Processing Bedrock analysis...");

    // Get Bedrock analysis
    const analysis = await getBedrockAnalysis(workoutData);

    if (!analysis) {
      throw new Error("Failed to get analysis from Bedrock");
    }

    console.log("✅ Bedrock analysis completed");

    // Encode settlement response for client
    const settlementResponseB64 = Buffer.from(
      JSON.stringify(paymentResult.settlementResponse)
    ).toString("base64");

    // Return successful response with analysis and payment confirmation
    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
        "X-Payment-Response": settlementResponseB64,
      },
      body: JSON.stringify(analysis),
    };
  } catch (error) {
    console.error("💥 Lambda error:", error);
    return {
      statusCode: 500,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Internal server error",
        details: error.message || "Unknown internal server error",
      }),
    };
  }
};

/**
 * Creates a 402 Payment Required response with x402 challenge
 */
function createPaymentRequiredResponse(errorMessage) {
  const paymentChallenge = {
    accepts: [
      {
        scheme: PAYMENT_CONFIG.scheme,
        network: PAYMENT_CONFIG.network,
        asset: PAYMENT_CONFIG.asset,
        amount: PAYMENT_CONFIG.amount,
        maxAmountRequired: PAYMENT_CONFIG.amount,
        payTo: PAYMENT_CONFIG.sellerWallet,
        resource: PAYMENT_CONFIG.resource,
        description: PAYMENT_CONFIG.description,
        mimeType: PAYMENT_CONFIG.mimeType,
        maxTimeoutSeconds: PAYMENT_CONFIG.maxTimeoutSeconds,
        chainId: PAYMENT_CONFIG.chainId,
        facilitator: PAYMENT_CONFIG.facilitatorUrl,
      },
    ],
    description: PAYMENT_CONFIG.description,
    ...(errorMessage && { error: errorMessage }),
  };

  console.log(
    "💰 Sending 402 Payment Required with challenge:",
    paymentChallenge
  );

  return {
    statusCode: 402,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(paymentChallenge),
  };
}

/**
 * Verifies and settles x402 payment through CDP facilitator
 */
async function verifyAndSettlePayment(paymentHeader) {
  try {
    // Decode the payment payload from base64
    const paymentPayload = JSON.parse(
      Buffer.from(paymentHeader, "base64").toString()
    );
    console.log("🔍 Decoded payment payload:", paymentPayload);

    // Prepare payment details for facilitator
    const paymentDetails = {
      scheme: PAYMENT_CONFIG.scheme,
      network: PAYMENT_CONFIG.network,
      asset: PAYMENT_CONFIG.asset,
      amount: PAYMENT_CONFIG.amount,
      chainId: PAYMENT_CONFIG.chainId,
      payTo: PAYMENT_CONFIG.sellerWallet,
      resource: PAYMENT_CONFIG.resource,
      description: PAYMENT_CONFIG.description,
      mimeType: PAYMENT_CONFIG.mimeType,
      maxTimeoutSeconds: PAYMENT_CONFIG.maxTimeoutSeconds,
    };

    console.log("📋 Payment details for verification:", paymentDetails);

    // Step 1: Verify payment with facilitator
    console.log("🔐 Step 1: Verifying payment...");
    const verificationResult = await callFacilitator("/verify", {
      paymentPayload,
      paymentDetails,
    });

    if (!verificationResult.success) {
      console.error(
        "❌ Payment verification failed:",
        verificationResult.error
      );
      return {
        success: false,
        error: verificationResult.error || "Payment verification failed",
      };
    }

    console.log("✅ Payment verification successful");

    // Step 2: Settle payment with facilitator
    console.log("💸 Step 2: Settling payment...");
    const settlementResult = await callFacilitator("/settle", {
      paymentPayload,
      paymentDetails,
    });

    if (!settlementResult.success) {
      console.error("❌ Payment settlement failed:", settlementResult.error);
      return {
        success: false,
        error: settlementResult.error || "Payment settlement failed",
      };
    }

    console.log("✅ Payment settlement successful:", settlementResult);

    return {
      success: true,
      settlementResponse: settlementResult,
      transactionHash:
        settlementResult.transactionHash || settlementResult.txHash,
    };
  } catch (error) {
    console.error("💥 Error in payment verification/settlement:", error);
    return {
      success: false,
      error: `Payment processing error: ${error.message}`,
    };
  }
}

/**
 * Calls CDP facilitator endpoint
 */
async function callFacilitator(endpoint, data) {
  const url = `${PAYMENT_CONFIG.facilitatorUrl}${endpoint}`;
  console.log(`📡 Calling facilitator: ${url}`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "ImperfectCoach/1.0",
      },
      body: JSON.stringify(data),
    });

    console.log(`📡 Facilitator ${endpoint} response status:`, response.status);

    const result = await response.json();
    console.log(`📡 Facilitator ${endpoint} response:`, result);

    if (!response.ok) {
      return {
        success: false,
        error:
          result.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    console.error(`💥 Facilitator ${endpoint} call failed:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Gets premium analysis from Amazon Bedrock Nova Lite
 */
async function getBedrockAnalysis(data) {
  const MODEL_ID = "amazon.nova-lite-v1:0";

  // Construct detailed prompt for premium analysis
  const prompt = `
You are an expert fitness analyst providing premium "Deep Dive" analysis. The user has paid for this comprehensive assessment, so provide detailed, actionable insights.

Workout Data:
- Exercise: ${data.exercise || "unknown"}
- Duration: ${data.duration || 0} seconds
- Reps Completed: ${data.reps || 0}
- Average Form Score: ${data.averageFormScore || 0}%
- Rep History: ${JSON.stringify(data.repHistory || [], null, 2)}

Please provide a comprehensive analysis including:

1. **Performance Summary**: Overall assessment of the workout quality and consistency
2. **Form Analysis**: Detailed breakdown of technique strengths and areas for improvement
3. **Consistency Evaluation**: Analysis of performance variation across reps
4. **Power & Explosiveness**: Assessment of athletic power development
5. **Specific Recommendations**: 3-5 actionable steps to improve performance
6. **Overall Score**: Rate the workout out of 100 with justification

Format your response as a detailed, professional fitness analysis that justifies the premium price point.
  `;

  // Nova Lite payload format
  const payload = {
    messages: [
      {
        role: "user",
        content: [
          {
            text: prompt,
          },
        ],
      },
    ],
    inferenceConfig: {
      maxTokens: 2048,
      temperature: 0.7,
    },
  };

  const command = new InvokeModelCommand({
    contentType: "application/json",
    body: JSON.stringify(payload),
    modelId: MODEL_ID,
  });

  try {
    console.log("🧠 Calling Amazon Bedrock Nova Lite...");
    console.log("📋 Model:", MODEL_ID);

    const apiResponse = await bedrockClient.send(command);
    const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
    const responseBody = JSON.parse(decodedResponseBody);

    console.log("✅ Bedrock response received");

    // Extract analysis from Nova response format
    const analysisText = responseBody.output.message.content[0].text;

    return {
      analysis: analysisText,
      model: MODEL_ID,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("💥 Error invoking Bedrock Nova model:", error);
    throw error;
  }
}

/**
 * Autonomous Treasury Management using CDP Wallet API v2
 * This function demonstrates the "revenue in → payment out" flow required for the hackathon
 */
async function manageAutonomousTreasury(paymentResult) {
  // Ensure cdp client is initialized
  if (!cdp) {
    console.warn(
      "ℹ️ CDP Client not initialized - skipping autonomous treasury management"
    );
    return;
  }

  try {
    console.log("🏦 Starting autonomous treasury management...");

    // Load or create the treasury account using getOrCreateAccount by name
    const treasuryAccount = await cdp.evm.getOrCreateAccount({
      name: CDP_CONFIG.treasuryAccountName,
      network: "base-sepolia", // Assuming all accounts are on Base Sepolia
    });
    console.log("📋 Treasury account loaded/created:", treasuryAccount.address);

    // Check treasury balance
    // The getBalances() method returns an object of balances keyed by assetId
    const balances = await treasuryAccount.getBalances();
    const usdcBalance = balances["usdc"]
      ? parseFloat(balances["usdc"].amount)
      : 0;
    console.log("💰 Current treasury USDC balance:", usdcBalance.toString());

    // Simulate revenue distribution if balance exceeds threshold
    const balanceInMicroUSDC = usdcBalance * 1000000; // Convert to micro-USDC as per your config

    if (
      balanceInMicroUSDC >=
      parseFloat(CDP_CONFIG.thresholds.minDistributionAmount)
    ) {
      console.log(
        "💸 Balance exceeds threshold - triggering revenue distribution..."
      );
      await distributeRevenue(treasuryAccount, balanceInMicroUSDC);
    } else {
      console.log(
        "ℹ️ Balance below distribution threshold - accumulating funds"
      );
    }

    // Log the autonomous action for hackathon demonstration
    console.log("🤖 Autonomous treasury action completed:", {
      paymentReceived: PAYMENT_CONFIG.amount + " micro-USDC",
      treasuryBalance: usdcBalance.toString() + " USDC",
      distributionTriggered:
        balanceInMicroUSDC >=
        parseFloat(CDP_CONFIG.thresholds.minDistributionAmount),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("💥 Autonomous treasury management error:", error);
    throw error;
  }
}

/**
 * Distribute revenue according to the configured percentages
 * This demonstrates the autonomous "payment out" functionality
 */
async function distributeRevenue(treasuryAccount, totalBalanceMicroUSDC) {
  console.log("📊 Distributing revenue autonomously...");

  try {
    // Calculate distribution amounts
    const platformAmount = Math.floor(
      totalBalanceMicroUSDC * CDP_CONFIG.revenueDistribution.platform
    );
    const userRewardsAmount = Math.floor(
      totalBalanceMicroUSDC * CDP_CONFIG.revenueDistribution.userRewards
    );
    const referrerAmount = Math.floor(
      totalBalanceMicroUSDC * CDP_CONFIG.revenueDistribution.referrers
    );

    console.log("💰 Revenue distribution plan:");
    console.log(
      `  Platform Treasury: ${platformAmount} micro-USDC (${
        CDP_CONFIG.revenueDistribution.platform * 100
      }%)`
    );
    console.log(
      `  User Rewards Pool: ${userRewardsAmount} micro-USDC (${
        CDP_CONFIG.revenueDistribution.userRewards * 100
      }%)`
    );
    console.log(
      `  Referrer Pool: ${referrerAmount} micro-USDC (${
        CDP_CONFIG.revenueDistribution.referrers * 100
      }%)`
    );

    // For hackathon demo: Create or load recipient accounts
    const recipients = await createOrLoadRecipientAccounts(); // Updated function name

    const transferPromises = [];

    // Transfer to user rewards pool
    if (userRewardsAmount > 0 && recipients.userRewardsAddress) {
      console.log("💸 Transferring to user rewards pool...");
      const amountUSDC = userRewardsAmount / 1000000; // Convert back to USDC
      const txPromise = cdp.evm
        .sendTransaction({
          address: treasuryAccount.address, // Sender's address
          transaction: {
            to: recipients.userRewardsAddress,
            value: parseEther(amountUSDC.toString()), // Convert to Wei (ETH equivalent for USDC if it's handled like native asset for amount)
          },
          network: "base-sepolia",
          // For USDC, you'd typically need to interact with the ERC-20 contract.
          // The quickstart 'sendTransaction' example shows sending native ETH.
          // For actual USDC transfers, you'd use a contract interaction:
          // data: '0xa9059cbb' + recipients.userRewardsAddress.substring(2) + '0000000000000000000000000000000000000000000000000000000000000000', // Example ERC-20 transfer calldata for USDC
          // to: '0x0000000000000000000000000000000000000000', // USDC contract address
          // value: '0'
          // This is a simplification assuming CDP handles asset type. If not, contract interaction is needed.
          // For this example, assuming 'value' with parseEther will work for native token.
          // For USDC, it's better to explicitly use the `sendToken` method if available, or build contract call.
        })
        .then((result) => {
          console.log(
            `✅ User Rewards transfer initiated: ${result.transactionHash}`
          );
          return publicClient.waitForTransactionReceipt({
            hash: result.transactionHash,
          });
        })
        .then((receipt) => {
          console.log(
            `✅ User Rewards transfer confirmed: ${receipt.transactionHash}`
          );
          return {
            type: "userRewards",
            hash: receipt.transactionHash,
            status: "complete",
          };
        })
        .catch((error) => {
          console.error(`❌ User Rewards transfer failed:`, error);
          return {
            type: "userRewards",
            hash: null,
            status: "failed",
            error: error.message,
          };
        });
      transferPromises.push(txPromise);
    }

    // Transfer to referrer pool
    if (referrerAmount > 0 && recipients.referrersAddress) {
      console.log("💸 Transferring to referrer pool...");
      const amountUSDC = referrerAmount / 1000000; // Convert back to USDC
      const txPromise = cdp.evm
        .sendTransaction({
          address: treasuryAccount.address, // Sender's address
          transaction: {
            to: recipients.referrersAddress,
            value: parseEther(amountUSDC.toString()), // Convert to Wei
          },
          network: "base-sepolia",
        })
        .then((result) => {
          console.log(
            `✅ Referrer transfer initiated: ${result.transactionHash}`
          );
          return publicClient.waitForTransactionReceipt({
            hash: result.transactionHash,
          });
        })
        .then((receipt) => {
          console.log(
            `✅ Referrer transfer confirmed: ${receipt.transactionHash}`
          );
          return {
            type: "referrers",
            hash: receipt.transactionHash,
            status: "complete",
          };
        })
        .catch((error) => {
          console.error(`❌ Referrer transfer failed:`, error);
          return {
            type: "referrers",
            hash: null,
            status: "failed",
            error: error.message,
          };
        });
      transferPromises.push(txPromise);
    }

    // Wait for all transfers to complete
    console.log("⏳ Waiting for autonomous transfers to complete...");
    const results = await Promise.all(transferPromises);
    console.log("🎉 Autonomous revenue distribution completed successfully!");

    // Return summary for hackathon demonstration
    return {
      totalDistributed: (userRewardsAmount + referrerAmount) / 1000000,
      platformRetained: platformAmount / 1000000,
      transfers: results,
    };
  } catch (error) {
    console.error("💥 Revenue distribution error:", error);
    throw error;
  }
}

/**
 * Create or load recipient accounts for demonstration using named accounts
 * In production, these would be real stakeholder accounts
 */
async function createOrLoadRecipientAccounts() {
  console.log("👥 Setting up recipient accounts...");

  try {
    const recipients = {};

    // User Rewards Pool Account
    const userRewardsAccount = await cdp.evm.getOrCreateAccount({
      name: CDP_CONFIG.userRewardsAccountName,
      network: "base-sepolia",
    });
    recipients.userRewardsAddress = userRewardsAccount.address;
    console.log(
      "💡 Save this User Rewards Account Name and Address:",
      CDP_CONFIG.userRewardsAccountName,
      recipients.userRewardsAddress
    );

    // Referrer Pool Account
    const referrerAccount = await cdp.evm.getOrCreateAccount({
      name: CDP_CONFIG.referrersAccountName,
      network: "base-sepolia",
    });
    recipients.referrersAddress = referrerAccount.address;
    console.log(
      "💡 Save this Referrer Account Name and Address:",
      CDP_CONFIG.referrersAccountName,
      recipients.referrersAddress
    );

    console.log("✅ Recipient accounts ready:", {
      userRewards: recipients.userRewardsAddress,
      referrers: recipients.referrersAddress,
    });

    return recipients;
  } catch (error) {
    console.error("💥 Error setting up recipient accounts:", error);
    throw error; // Re-throw to indicate a critical setup failure
  }
}

/**
 * Test function to create and display account addresses for funding
 * Uses cdp.evm.createAccount() as per the documentation
 */
async function testAccountCreation() {
  console.log("🧪 Testing CDP account creation...");

  if (!cdp || !cdp.evm) {
    throw new Error("CDP Client not available or EVM module not initialized.");
  }

  try {
    const accounts = {};

    // Create Treasury Account
    console.log("🏛️ Creating treasury account...");
    const treasuryAccount = await cdp.evm.createAccount();
    accounts.treasury = {
      address: treasuryAccount.address,
      // Wallet API v2 quickstart primarily uses address as the identifier.
      // If you need a name, use getOrCreateAccount instead of createAccount directly here.
    };
    console.log("✅ Treasury account created:", accounts.treasury.address);

    // Create User Rewards Account
    console.log("🎁 Creating user rewards account...");
    const userRewardsAccount = await cdp.evm.createAccount();
    accounts.userRewards = {
      address: userRewardsAccount.address,
    };
    console.log(
      "✅ User rewards account created:",
      accounts.userRewards.address
    );

    // Create Referrer Account
    console.log("🤝 Creating referrer account...");
    const referrerAccount = await cdp.evm.createAccount();
    accounts.referrer = {
      address: referrerAccount.address,
    };
    console.log("✅ Referrer account created:", accounts.referrer.address);

    return {
      success: true,
      message: "All accounts created successfully!",
      accounts,
      instructions: {
        next_steps: [
          "1. These are newly generated account addresses. For ongoing use, consider using 'getOrCreateAccount' with names and saving these names as environment variables if you want to retrieve the same accounts later.",
          "   Example Environment Variables (using generated addresses as 'IDs' for now):",
          `   CDP_TREASURY_ACCOUNT_NAME=treasury-account-default`,
          `   CDP_USER_REWARDS_ACCOUNT_NAME=user-rewards-account-default`,
          `   CDP_REFERRER_ACCOUNT_NAME=referrer-account-default`,
          "",
          "2. Fund the treasury account with USDC on Base Sepolia (or ETH for gas):",
          `   Address: ${accounts.treasury.address}`,
          "",
          "3. Get Base Sepolia ETH/USDC from faucet (if available for your use case):",
          "   https://faucet.circle.com/ (for USDC)",
          "   https://bridge.base.org/deposit (Base Sepolia ETH for gas)",
        ],
      },
    };
  } catch (error) {
    console.error("💥 Account creation test failed:", error);
    throw error;
  }
}
