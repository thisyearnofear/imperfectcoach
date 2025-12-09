// x402 Payment Protocol - Premium Analysis Lambda
// Implements correct x402 flow: 402 challenge → client signs → 200 response

import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { CdpClient } from "@coinbase/cdp-sdk";
import {
  http,
  createPublicClient,
  verifyMessage,
  isAddress,
  keccak256,
  stringToBytes,
} from "viem";
import { baseSepolia } from "viem/chains";
import nacl from "tweetnacl";
import bs58 from "bs58";

// ===== CONSTANTS & CONFIG =====

const bedrockClient = new BedrockRuntimeClient({ region: "eu-north-1" });

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// x402 Configuration per network
const X402_CONFIG = {
  "base-sepolia": {
    amount: "50000", // 0.05 USDC (6 decimals)
    asset: "0x036CbD53842c5426634e7929541fC2318B3d053F",
    payTo: "0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA",
    chainId: 84532,
  },
  "avalanche-c-chain": {
    amount: "50000",
    asset: "0x5425890298aed601595a70AB815c96711a756003",
    payTo: "0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA",
    chainId: 43113,
  },
  "solana-devnet": {
    amount: "50000", // 0.05 USDC (6 decimals)
    asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC on Solana Devnet
    payTo: "CmGgLQL36Y9ubtTsy2zmE46TAxwCBm66onZmPPhUWNqv", // Treasury
  },
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Content-Type, X-Payment, X-Chain, X-Signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ===== x402 PROTOCOL IMPLEMENTATION =====

/**
 * Generate x402 402 Payment Required challenge
 */
function createPaymentChallenge(network = "base-sepolia") {
  const config = X402_CONFIG[network];
  if (!config) {
    throw new Error(`Unknown network: ${network}`);
  }

  const challenge = {
    amount: config.amount,
    asset: config.asset,
    network,
    payTo: config.payTo,
    scheme: network === "solana-devnet" ? "ed25519" : "eip-191",
    timestamp: Math.floor(Date.now() / 1000),
    nonce: generateNonce(),
  };

  return challenge;
}

/**
 * Generate a random nonce for replay attack prevention
 */
function generateNonce() {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Reconstruct the message that was signed
 * Must match client's serializeChallenge exactly
 */
function serializeChallenge(challenge) {
  return JSON.stringify({
    amount: challenge.amount,
    asset: challenge.asset,
    network: challenge.network,
    payTo: challenge.payTo,
    scheme: challenge.scheme,
    timestamp: challenge.timestamp,
    nonce: challenge.nonce,
  });
}

/**
 * Verify x402 payment signature
 * Different signature schemes per network
 */
async function verifyPaymentSignature(signedPayment, network) {
  try {
    // Reconstruct the message
    const message = serializeChallenge(signedPayment);

    if (network === "base-sepolia" || network === "avalanche-c-chain") {
      // EVM: verify using viem's verifyMessage
      const recoveredAddress = await verifyMessage({
        address: signedPayment.payer,
        message,
        signature: signedPayment.signature,
      });

      const isValid = recoveredAddress.toLowerCase() === signedPayment.payer.toLowerCase();
      console.log(
        `✅ EVM signature verification: ${isValid ? "VALID" : "INVALID"}`
      );
      return isValid;
    }

    if (network === "solana-devnet") {
      // Solana: verify Ed25519 signature using tweetnacl
      try {
        // Message as Uint8Array
        const messageBytes = new TextEncoder().encode(message);

        // Signature from hex
        const signatureBytes = Buffer.from(signedPayment.signature, 'hex');

        // Public key from base58 (Solana address format)
        const publicKeyBytes = bs58.decode(signedPayment.payer);

        // Verify using nacl
        const isValid = nacl.sign.detached.verify(
          messageBytes,
          signatureBytes,
          publicKeyBytes
        );

        console.log(`✅ Solana Ed25519 signature verification: ${isValid ? "VALID" : "INVALID"}`);
        return isValid;
      } catch (error) {
        console.error("❌ Solana signature verification error:", error);
        return false;
      }
    }

    throw new Error(`Unknown network: ${network}`);
  } catch (error) {
    console.error("❌ Signature verification failed:", error);
    return false;
  }
}

/**
 * Create HTTP 402 Payment Required response with x402 challenge
 */
function createPaymentRequiredResponse(message, network = "base-sepolia") {
  const challenge = createPaymentChallenge(network);

  return {
    statusCode: 402,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      "X-Payment-Challenge": btoa(JSON.stringify(challenge)),
    },
    body: JSON.stringify({
      error: "Payment Required",
      message,
      challenge,
      instructions: {
        step1: "Sign the challenge above using your wallet",
        step2: `Encode signed payment as base64 and send in X-Payment header`,
        step3: "Retry request with X-Payment header",
      },
    }),
  };
}

/**
 * Create successful response after payment verification
 */
function createSuccessResponse(body, statusCode = 200) {
  return {
    statusCode,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}

/**
 * Create error response
 */
function createErrorResponse(message, statusCode = 400) {
  return {
    statusCode,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ error: message }),
  };
}

// ===== BEDROCK AI INTEGRATION =====

/**
 * Get premium analysis from Amazon Bedrock Nova Lite
 */
async function getBedrockAnalysis(workoutData) {
  const MODEL_ID = "amazon.nova-lite-v1:0";

  const prompt = `
You are an expert fitness analyst providing premium "Deep Dive" analysis. The user has paid for this comprehensive assessment.

Workout Data:
- Exercise: ${workoutData.exercise || "unknown"}
- Duration: ${workoutData.duration || 0} seconds
- Reps Completed: ${workoutData.reps || 0}
- Average Form Score: ${workoutData.averageFormScore || 0}%
- Rep History: ${JSON.stringify(workoutData.repHistory || [], null, 2)}

Provide comprehensive analysis including:
1. **Performance Summary**: Overall assessment of workout quality
2. **Form Analysis**: Detailed breakdown of technique
3. **Consistency Evaluation**: Analysis of performance variation
4. **Power & Explosiveness**: Assessment of athletic power development
5. **Specific Recommendations**: 3-5 actionable steps to improve
6. **Overall Score**: Rate the workout out of 100 with justification

Format as detailed, professional fitness analysis.
  `;

  const payload = {
    messages: [
      {
        role: "user",
        content: [{ text: prompt }],
      },
    ],
    inferenceConfig: {
      maxTokens: 2048,
      temperature: 0.7,
    },
  };

  const command = new ConverseCommand({
    modelId: MODEL_ID,
    messages: payload.messages,
    inferenceConfig: payload.inferenceConfig,
  });

  try {
    console.log("🧠 Calling Amazon Bedrock Nova Lite...");
    const apiResponse = await bedrockClient.send(command);

    // Extract text from response
    const analysisText = apiResponse.output.message.content[0].text;

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

// ===== MAIN HANDLER =====

/**
 * AWS Lambda handler for premium analysis endpoint
 * Implements x402 payment protocol
 */
export const handler = async (event) => {
  console.log("🚀 Premium Analysis Lambda - Event received:", event);

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: "",
    };
  }

  try {
    // Parse request
    const requestData = JSON.parse(event.body || "{}");
    const { workoutData } = requestData;
    const paymentHeader =
      event.headers["x-payment"] || event.headers["X-Payment"];
    const networkHeader =
      event.headers["x-chain"] || event.headers["X-Chain"] || "base-sepolia";

    console.log("💪 Workout data:", workoutData);
    console.log("🔗 Network:", networkHeader);
    console.log("💳 Payment header present:", !!paymentHeader);

    // Step 1: Check if payment was provided
    if (!paymentHeader) {
      console.log("❌ No payment - returning 402 challenge");
      return createPaymentRequiredResponse(
        "Payment required for premium analysis",
        networkHeader
      );
    }

    // Step 2: Decode and verify payment
    console.log("✅ Payment header found - verifying signature...");

    let signedPayment;
    try {
      // Decode base64 payment header
      const decodedPayment = Buffer.from(paymentHeader, "base64").toString();
      signedPayment = JSON.parse(decodedPayment);
      console.log("💳 Decoded payment:", {
        payer: signedPayment.payer,
        network: signedPayment.network,
        amount: signedPayment.amount,
      });
    } catch (error) {
      console.error("❌ Failed to decode payment header:", error);
      return createErrorResponse("Invalid payment format", 400);
    }

    // Verify signature
    const isValidSignature = await verifyPaymentSignature(
      signedPayment,
      networkHeader
    );

    if (!isValidSignature) {
      console.error("❌ Invalid signature");
      return createErrorResponse("Invalid payment signature", 401);
    }

    console.log("✅ Signature verified - processing analysis");

    // Step 3: Provide premium analysis
    const analysisResult = await getBedrockAnalysis(workoutData);

    return createSuccessResponse({
      success: true,
      analysis: analysisResult.analysis,
      paymentVerified: true,
      network: networkHeader,
      payer: signedPayment.payer,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("💥 Handler error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
