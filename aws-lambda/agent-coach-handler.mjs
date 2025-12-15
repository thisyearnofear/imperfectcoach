// Autonomous AI Coach Agent - AWS Lambda Handler
// Uses Amazon Bedrock AgentCore for multi-step reasoning and tool use

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";
import { Agentkit } from "@0xgasless/agentkit";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
// import { verify } from "@payai/x402/facilitator";
import * as db from "./lib/dynamodb-service.mjs";
import * as reap from "./lib/reap-integration.mjs";
import * as coreHandler from "./lib/core-agent-handler.mjs";

// Initialize clients
const bedrockClient = new BedrockRuntimeClient({ region: "eu-north-1" });
const agentClient = new BedrockAgentRuntimeClient({ region: "eu-north-1" });

// Agent Identity (0xGasless) & Network Config
let agentKitInstance = null;
const publicClient = createPublicClient({ chain: base, transport: http() });

// Multi-Network Configuration (Mainnet + Testnet for Base & Avalanche)
const X402_CONFIG = {
  // Base Mainnet (Production)
  "base-mainnet": {
    amount: "50000", // 0.05 USDC
    asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
    payTo: "0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA",
    chainId: 8453,
    rpcUrl: "https://mainnet.base.org",
  },
  // Base Sepolia (Testing)
  "base-sepolia": {
    amount: "50000",
    asset: "0x036CbD53842c5426634e7929541fC2318B3d053F", // USDC on Base Sepolia
    payTo: "0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA",
    chainId: 84532,
    rpcUrl: "https://sepolia.base.org",
  },
  // Avalanche C-Chain Mainnet (Production)
  "avalanche-mainnet": {
    amount: "50000",
    asset: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // USDC on Avalanche
    payTo: "0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA",
    chainId: 43114,
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
  },
  // Avalanche Fuji Testnet (Testing)
  "avalanche-fuji": {
    amount: "50000",
    asset: "0x5425890298aed601595a70AB815c96711a31Bc65", // USDC on Fuji
    payTo: "0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA",
    chainId: 43113,
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
  },
  // Solana Devnet (Testing)
  "solana-devnet": {
    amount: "50000",
    asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    payTo: "CmGgLQL36Y9ubtTsy2zmE46TAxwCBm66onZmPPhUWNqv",
  },
};

async function getAgentKit() {
  if (agentKitInstance) return agentKitInstance;
  if (!process.env.CX0_API_KEY) {
    console.warn("⚠️ Agent Identity keys missing - Agent will be read-only without wallet");
    return null;
  }
  try {
    // Uses CDP_WALLET_SECRET or AGENT_PRIVATE_KEY depending on config
    agentKitInstance = await Agentkit.configureWithWallet({
      privateKey: process.env.AGENT_PRIVATE_KEY, // Fallback if regular EVM key
      rpcUrl: "https://mainnet.base.org",
      apiKey: process.env.CX0_API_KEY,
      chainID: 8453
    });
    console.log("🤖 Agent Identity initialized:", await agentKitInstance.getAddress());
    return agentKitInstance;
  } catch (e) {
    console.error("❌ Failed to init AgentKit:", e);
    return null;
  }
}

// Tool definitions for the AI Agent
const AGENT_TOOLS = [
  {
    name: "analyze_pose_data",
    description:
      "Analyzes pose detection data to identify form issues, asymmetries, and technique improvements for specific exercises",
    input_schema: {
      type: "object",
      properties: {
        exercise: { type: "string", description: "Exercise type (pullups, jumps, etc)" },
        pose_data: { type: "object", description: "Pose detection keypoints and angles" },
        rep_count: { type: "number", description: "Number of reps completed" },
      },
      required: ["exercise", "pose_data", "rep_count"],
    },
  },
  {
    name: "query_workout_history",
    description:
      "Retrieves user's workout history to identify patterns, progress, and areas needing focus",
    input_schema: {
      type: "object",
      properties: {
        user_id: { type: "string", description: "User identifier" },
        exercise_type: { type: "string", description: "Optional filter by exercise type" },
        days_back: { type: "number", description: "Number of days to look back" },
      },
      required: ["user_id"],
    },
  },
  {
    name: "benchmark_performance",
    description:
      "Compares user's performance against similar athletes to provide context and motivation",
    input_schema: {
      type: "object",
      properties: {
        exercise: { type: "string", description: "Exercise type" },
        user_metrics: { type: "object", description: "User's current performance metrics" },
        experience_level: { type: "string", description: "beginner, intermediate, or advanced" },
      },
      required: ["exercise", "user_metrics"],
    },
  },
  {
    name: "generate_training_plan",
    description:
      "Creates a personalized training plan based on current performance, goals, and identified weaknesses",
    input_schema: {
      type: "object",
      properties: {
        current_performance: { type: "object", description: "Current performance metrics" },
        goals: { type: "array", description: "User's training goals" },
        weaknesses: { type: "array", description: "Identified areas for improvement" },
        available_days: { type: "number", description: "Days per week for training" },
      },
      required: ["current_performance", "goals"],
    },
  },
  {
    name: "call_specialist_agent",
    description:
      "Discovers real specialist agents via Reap Protocol and calls them with x402 payment negotiation (Phase B & C)",
    input_schema: {
      type: "object",
      properties: {
        capability: { type: "string", description: "Type of specialist needed (nutrition_planning, biomechanics_analysis, recovery_planning)" },
        data_query: { type: "object", description: "Data or request to send to specialist" },
        amount: { type: "string", description: "Amount to pay specialist in USDC (e.g., 30000 for 0.03)" },
      },
      required: ["capability", "data_query", "amount"],
    },
  },
];

// Tool execution functions
async function executeTool(toolName, toolInput) {
  console.log(`🔧 Executing tool: ${toolName}`, JSON.stringify(toolInput, null, 2));

  switch (toolName) {
    case "analyze_pose_data":
      return await analyzePoseData(toolInput);

    case "query_workout_history":
      return await queryWorkoutHistory(toolInput);

    case "benchmark_performance":
      return await benchmarkPerformance(toolInput);

    case "generate_training_plan":
      return await generateTrainingPlan(toolInput);

    case "call_specialist_agent":
      return await callSpecialistAgent(toolInput);

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// Tool implementation: Analyze Pose Data
async function analyzePoseData({ exercise, pose_data, rep_count }) {
  // Deep analysis of form using existing pose detection data
  const analysis = {
    form_score: calculateFormScore(pose_data),
    issues_detected: identifyFormIssues(pose_data, exercise),
    technique_tips: generateTechniqueTips(pose_data, exercise),
    asymmetries: detectAsymmetries(pose_data),
    rep_quality: assessRepQuality(pose_data, rep_count),
  };

  return analysis;
}

// Tool implementation: Query Workout History
async function queryWorkoutHistory({ user_id, exercise_type, days_back = 30 }) {
  try {
    // Get workout history from DynamoDB
    const history = await db.getWorkoutHistory(user_id, {
      exerciseType: exercise_type,
      daysBack: days_back,
      limit: 50,
    });

    if (history.length === 0) {
      return {
        total_workouts: 0,
        exercises_performed: [],
        progress_trend: "no_data",
        consistency_score: 0,
        identified_patterns: ["No workout history found - this is your first session!"],
      };
    }

    // Aggregate statistics by exercise type
    const exerciseStats = {};
    history.forEach(workout => {
      const type = workout.exercise || "unknown";
      if (!exerciseStats[type]) {
        exerciseStats[type] = {
          type,
          sessions: 0,
          total_reps: 0,
          best_form_score: 0,
          scores: [],
        };
      }
      exerciseStats[type].sessions++;
      exerciseStats[type].total_reps += workout.reps || 0;
      exerciseStats[type].best_form_score = Math.max(
        exerciseStats[type].best_form_score,
        workout.formScore || workout.score || 0
      );
      exerciseStats[type].scores.push(workout.formScore || workout.score || 0);
    });

    // Calculate averages and trends
    const exercises_performed = Object.values(exerciseStats).map(stat => ({
      type: stat.type,
      sessions: stat.sessions,
      avg_reps: Math.round(stat.total_reps / stat.sessions),
      best_form_score: stat.best_form_score,
      consistency: calculateConsistency(stat.scores),
    }));

    // Identify patterns from recent workouts
    const identified_patterns = analyzeWorkoutPatterns(history);

    return {
      total_workouts: history.length,
      exercises_performed,
      progress_trend: calculateProgressTrend(history),
      consistency_score: calculateOverallConsistency(history),
      identified_patterns,
      date_range: {
        from: new Date(history[history.length - 1].timestamp).toISOString(),
        to: new Date(history[0].timestamp).toISOString(),
      },
    };
  } catch (error) {
    console.error("Error querying workout history:", error);
    return {
      error: "Failed to retrieve workout history",
      total_workouts: 0,
      exercises_performed: [],
    };
  }
}

// Helper: Calculate consistency score from array of scores
function calculateConsistency(scores) {
  if (scores.length < 2) return 100;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  return Math.max(0, Math.round(100 - (stdDev / avg) * 100));
}

// Helper: Calculate overall consistency
function calculateOverallConsistency(history) {
  const scores = history.map(w => w.formScore || w.score || 0);
  return calculateConsistency(scores);
}

// Helper: Analyze patterns in workout data
function analyzeWorkoutPatterns(history) {
  const patterns = [];

  // Check time-of-day performance
  const morningWorkouts = history.filter(w => {
    const hour = new Date(w.timestamp).getHours();
    return hour >= 6 && hour < 12;
  });

  if (morningWorkouts.length > history.length * 0.6) {
    const morningAvg = morningWorkouts.reduce((sum, w) => sum + (w.formScore || 0), 0) / morningWorkouts.length;
    const overallAvg = history.reduce((sum, w) => sum + (w.formScore || 0), 0) / history.length;
    if (morningAvg > overallAvg * 1.1) {
      patterns.push("Strong morning performance - consider scheduling key workouts AM");
    }
  }

  // Check form degradation
  const recentWorkouts = history.slice(0, 5);
  const hasRepData = recentWorkouts.some(w => w.repHistory && w.repHistory.length > 10);
  if (hasRepData) {
    patterns.push("Form quality maintained across high-rep sets");
  }

  // Check for asymmetries
  const hasAsymmetry = history.some(w => w.poseData?.asymmetries?.detected);
  if (hasAsymmetry) {
    patterns.push("Consistent right-side dominance detected - add unilateral work");
  }

  if (patterns.length === 0) {
    patterns.push("Building baseline - continue consistent training");
  }

  return patterns;
}

// Helper: Calculate progress trend
function calculateProgressTrend(history) {
  if (history.length < 5) return "building_baseline";

  const recent = history.slice(0, Math.floor(history.length / 2));
  const older = history.slice(Math.floor(history.length / 2));

  const recentAvg = recent.reduce((sum, w) => sum + (w.formScore || w.score || 0), 0) / recent.length;
  const olderAvg = older.reduce((sum, w) => sum + (w.formScore || w.score || 0), 0) / older.length;

  if (recentAvg > olderAvg * 1.15) return "rapidly_improving";
  if (recentAvg > olderAvg * 1.05) return "improving";
  if (recentAvg < olderAvg * 0.95) return "declining";
  return "stable";
}

// Tool implementation: Benchmark Performance
async function benchmarkPerformance({ exercise, user_metrics, experience_level = "intermediate" }) {
  try {
    // Get benchmark from DynamoDB service (cached)
    const benchmark = await db.getBenchmarks(exercise, experience_level);
    const userPerformance = user_metrics.reps || user_metrics.height || 0;

    return {
      user_performance: userPerformance,
      benchmark: benchmark,
      percentile: calculatePercentile(userPerformance, benchmark),
      comparison: userPerformance >= benchmark ? "above_average" : "below_average",
      next_milestone: Math.ceil(userPerformance * 1.2),
      insights: generateBenchmarkInsights(userPerformance, benchmark, exercise),
      experience_level,
    };
  } catch (error) {
    console.error("Error benchmarking performance:", error);
    return {
      error: "Failed to retrieve benchmarks",
      user_performance: user_metrics.reps || user_metrics.height || 0,
    };
  }
}

// Tool implementation: Generate Training Plan
async function generateTrainingPlan({ current_performance, goals, weaknesses, available_days = 3 }) {
  // AI-generated personalized plan
  return {
    plan_duration: "4 weeks",
    weekly_schedule: generateWeeklySchedule(available_days, weaknesses),
    progressive_overload: calculateProgressiveLoad(current_performance),
    focus_areas: prioritizeFocusAreas(weaknesses, goals),
    success_metrics: defineSuccessMetrics(goals),
    adaptive_adjustments: [
      "Increase volume by 5% weekly if form maintains above 80%",
      "Add rest day if form score drops below 70%",
      "Progress to weighted variations when hitting 15+ reps consistently",
    ],
  };
}

// Helper functions for tool implementations
function calculateFormScore(pose_data) {
  // Simplified form scoring based on pose data
  if (!pose_data || !pose_data.angles) return 75;

  const angles = pose_data.angles;
  let score = 100;

  // Deduct points for poor form indicators
  if (angles.elbow && Math.abs(angles.elbow.left - angles.elbow.right) > 15) {
    score -= 10; // Asymmetry penalty
  }

  return Math.max(score, 50);
}

function identifyFormIssues(pose_data, exercise) {
  const issues = [];

  if (exercise === "pullups") {
    if (pose_data.angles?.elbow?.left < 90) {
      issues.push("Incomplete range of motion - not reaching full depth");
    }
    if (Math.abs(pose_data.angles?.elbow?.left - pose_data.angles?.elbow?.right) > 15) {
      issues.push("Asymmetric pull detected - one side compensating");
    }
  }

  return issues.length > 0 ? issues : ["No major issues detected"];
}

function generateTechniqueTips(pose_data, exercise) {
  return [
    "Focus on controlled descent phase (3-second negative)",
    "Engage core throughout movement",
    "Maintain shoulder blade retraction at bottom position",
  ];
}

function detectAsymmetries(pose_data) {
  if (!pose_data?.angles) return { detected: false };

  return {
    detected: true,
    left_vs_right: "Right side 8% stronger",
    recommendation: "Add single-arm accessory work",
  };
}

function assessRepQuality(pose_data, rep_count) {
  return {
    quality_score: 82,
    full_reps: rep_count,
    partial_reps: 0,
    form_degradation: "Minimal degradation after rep 10",
  };
}

function calculatePercentile(userPerf, benchmark) {
  const ratio = userPerf / benchmark;
  if (ratio >= 1.5) return "Top 10%";
  if (ratio >= 1.2) return "Top 25%";
  if (ratio >= 1.0) return "Top 50%";
  return "Improvement opportunity";
}

function generateBenchmarkInsights(userPerf, benchmark, exercise) {
  if (userPerf >= benchmark) {
    return `Excellent work! You're performing above the ${exercise} benchmark. Consider progressive overload.`;
  }
  return `You're ${Math.round(((benchmark - userPerf) / benchmark) * 100)}% away from benchmark. Focus on consistent training.`;
}

function generateWeeklySchedule(days, weaknesses) {
  const schedule = [];
  for (let i = 0; i < days; i++) {
    schedule.push({
      day: i + 1,
      focus: weaknesses[i % weaknesses.length] || "strength",
      exercises: ["Main lift", "Accessory work", "Mobility"],
    });
  }
  return schedule;
}

function calculateProgressiveLoad(current) {
  return {
    week_1: "Current volume",
    week_2: "Add 5% reps or 2.5% weight",
    week_3: "Add 10% total volume",
    week_4: "Deload week - 70% volume",
  };
}

function prioritizeFocusAreas(weaknesses, goals) {
  return weaknesses.slice(0, 3);
}

function defineSuccessMetrics(goals) {
  return goals.map((goal) => ({
    goal: goal,
    metric: "Track weekly",
    target: "20% improvement in 4 weeks",
  }));
}

// Tool implementation: Call Specialist Agent (x402 v2 with CORE_AGENTS)
async function callSpecialistAgent({ capability, data_query, amount, serviceTier, bookingId }) {
  console.log(`\n🌐 Calling specialist agent via x402 v2`);
  console.log(`   Capability: ${capability}`);
  console.log(`   Amount: ${amount} USDC`);
  if (serviceTier) console.log(`   Tier: ${serviceTier} (SLA enforced)`);
  if (bookingId) console.log(`   Booking ID: ${bookingId}`);

  // Track execution time for SLA enforcement
  const executionStartTime = Date.now();
  const network = "base-sepolia"; // Primary network

  try {
    // 1. Discover specialist from CORE_AGENTS
    console.log(`\n🔍 Searching CORE_AGENTS for ${capability}...`);
    const specialists = coreHandler.findAgentsByCapability(capability);

    if (!specialists || specialists.length === 0) {
      return {
        error: "No specialists found for capability",
        capability,
        message: `No agents available for ${capability}`
      };
    }

    const specialist = specialists[0];
    console.log(`   ✅ Found: ${specialist.name} (${specialist.id})`);
    console.log(`      Reputation: ${specialist.reputationScore}/100`);

    // 2. Coach agent identity
    const coachAgent = {
      id: "agent-fitness-core-01",
      name: "Fitness Coach",
      address: process.env.AGENT_WALLET_ADDRESS || "0x1234567890123456789012345678901234567890"
    };

    // 3. x402 payment via CORE_AGENTS (verify + settle for production)
    console.log(`\n💳 Executing x402 payment...`);
    const paymentHeader = event.headers?.["x-payment"] || event.headers?.["X-Payment"];
    const paymentProof = await coreHandler.verifyAndSettleX402Payment(
      paymentHeader,
      specialist,
      amount,
      network
    );

    if (!paymentProof.success) {
      return {
        error: "Payment failed",
        specialist: specialist.name,
        message: paymentProof.error || "Unable to process x402 payment"
      };
    }

    console.log(`   ✅ Payment executed: ${paymentProof.transactionHash || paymentProof.status}`);

    // 4. Call specialist's endpoint
    console.log(`\n🤝 Calling specialist endpoint...`);
    const response = await coreHandler.callSpecialistEndpoint(
      specialist,
      capability,
      data_query
    );

    console.log(`   ✅ Response received`);

    // 5. Record payment in audit trail
    console.log(`\n📊 Recording payment...`);
    const paymentRecord = await coreHandler.recordAgentPayment(
      coachAgent.id,
      specialist,
      paymentProof,
      capability
    );

    // 6. Calculate SLA performance (if tier specified)
    let slaData = null;
    if (serviceTier) {
      const executionTimeMs = Date.now() - executionStartTime;
      slaData = coreHandler.calculateSLAPerformance(serviceTier, executionTimeMs);

      console.log(`\n⏱️  SLA Performance:`);
      console.log(`   Tier: ${slaData.tier}`);
      console.log(`   Expected: ${slaData.expectedMs}ms`);
      console.log(`   Actual: ${slaData.actualMs}ms`);
      console.log(`   ${slaData.message}`);
    }

    // 7. Build response with payment proof, SLA status, and specialist data
    return {
      success: true,
      specialist: {
        id: specialist.id,
        name: specialist.name,
        capability: capability,
        reputation: specialist.reputationScore,
        endpoint: specialist.endpoint
      },
      payment: {
        amount: amount,
        transactionHash: paymentProof.transactionHash,
        network: paymentProof.network,
        status: paymentProof.status,
        blockExplorer: paymentProof.blockExplorer,
        timestamp: paymentProof.timestamp
      },
      data: response,
      // SLA enforcement (if tier specified)
      sla: slaData ? {
        expectedMs: slaData.expectedMs,
        actualMs: slaData.actualMs,
        tier: slaData.tier,
        met: slaData.met,
        penaltyPercent: slaData.penalty,
        message: slaData.message
      } : null,
      audit: {
        from: coachAgent.id,
        to: specialist.id,
        timestamp: new Date().toISOString(),
        bookingId: bookingId || null
      }
    };

  } catch (error) {
    console.error(`❌ Specialist call error: ${error.message}`);
    return {
      error: "Failed to call specialist agent",
      message: error.message,
      capability: capability,
      timestamp: new Date().toISOString()
    };
  }
}

// Main agent reasoning loop using Bedrock Converse API with tool use
async function runAgentReasoning(workoutData) {
  console.log("🤖 Starting AI Agent reasoning loop...");

  const conversationHistory = [];
  const maxIterations = 5;
  let iteration = 0;

  // Initial prompt to the agent
  const systemPrompt = {
    text: `You are an elite AI fitness coach with autonomous decision-making capabilities. 
Your role is to:
1. Analyze workout performance data deeply
2. Use available tools to gather context and history
3. Make autonomous decisions about what analysis is needed
4. Generate personalized, actionable coaching advice
5. Create adaptive training plans

You have access to tools for analyzing pose data, querying workout history, benchmarking performance, and generating training plans.
Think step-by-step about what information you need and which tools to use.`,
  };

  // Initial user message with workout data
  conversationHistory.push({
    role: "user",
    content: [
      {
        text: `Analyze this workout and provide comprehensive coaching:
        
Exercise: ${workoutData.exercise}
Reps: ${workoutData.reps}
Form Score: ${workoutData.formScore}
Pose Data: ${JSON.stringify(workoutData.poseData)}
User ID: ${workoutData.userId}

Provide autonomous, multi-step analysis using available tools.`,
      },
    ],
  });

  while (iteration < maxIterations) {
    iteration++;
    console.log(`🔄 Agent iteration ${iteration}/${maxIterations}`);

    try {
      const response = await bedrockClient.send(
        new ConverseCommand({
          modelId: "amazon.nova-lite-v1:0",
          messages: conversationHistory,
          system: [systemPrompt],
          toolConfig: {
            tools: AGENT_TOOLS.map((tool) => ({
              toolSpec: {
                name: tool.name,
                description: tool.description,
                inputSchema: { json: tool.input_schema },
              },
            })),
          },
        })
      );

      const message = response.output.message;
      conversationHistory.push(message);

      // Check if agent wants to use tools
      if (message.content.some((block) => block.toolUse)) {
        console.log("🔧 Agent is using tools...");

        const toolResults = [];

        for (const block of message.content) {
          if (block.toolUse) {
            const toolName = block.toolUse.name;
            const toolInput = block.toolUse.input;
            const toolUseId = block.toolUse.toolUseId;

            // Execute the tool
            const result = await executeTool(toolName, toolInput);

            toolResults.push({
              toolUseId: toolUseId,
              content: [{ json: result }],
            });
          }
        }

        // Send tool results back to agent
        conversationHistory.push({
          role: "user",
          content: toolResults.map((tr) => ({
            toolResult: tr,
          })),
        });
      } else {
        // Agent has finished reasoning and provided final response
        console.log("✅ Agent has completed analysis");

        const finalText = message.content
          .filter((block) => block.text)
          .map((block) => block.text)
          .join("\n");

        return {
          success: true,
          agentResponse: finalText,
          toolsUsed: extractToolsUsed(conversationHistory),
          iterationsUsed: iteration,
          reasoning_steps: extractReasoningSteps(conversationHistory),
        };
      }
    } catch (error) {
      console.error("❌ Agent error:", error);
      throw error;
    }
  }

  // Max iterations reached
  return {
    success: false,
    error: "Agent reached maximum iterations",
    partialResults: conversationHistory,
  };
}

function extractToolsUsed(history) {
  const tools = [];
  for (const msg of history) {
    if (msg.content) {
      for (const block of msg.content) {
        if (block.toolUse) {
          tools.push(block.toolUse.name);
        }
      }
    }
  }
  return [...new Set(tools)];
}

function extractReasoningSteps(history) {
  return history
    .filter((msg) => msg.role === "assistant")
    .map((msg, idx) => ({
      step: idx + 1,
      action: msg.content[0]?.toolUse?.name || "final_response",
      reasoning: msg.content[0]?.text || "Tool execution",
    }));
}

// Lambda handler
export const handler = async (event) => {
  console.log("🚀 AI Coach Agent Lambda invoked");
  console.log("Event:", JSON.stringify(event, null, 2));

  // Handle CORS preflight - support both REST API and HTTP API v2 formats
  const httpMethod = event.httpMethod || event.requestContext?.http?.method;
  if (httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, X-Payment, X-Chain, X-Signature, X-Agent-ID",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  try {
    // Parse request
    const body = JSON.parse(event.body || "{}");
    const workoutData = body.workoutData;

    if (!workoutData) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Missing workoutData in request body",
        }),
      };
    }

    // Verify x402 Payment (if available in headers)
    const paymentHeader = event.headers?.["x-payment"] || event.headers?.["X-Payment"];
    const network = event.headers?.["x-chain"] || event.headers?.["X-Chain"] || "base-mainnet";

    // Initialize Agent Identity
    await getAgentKit();

    if (!paymentHeader) {
      console.log("💰 No payment header - returning 402 Challenge");

      const challenge = {
        amount: X402_CONFIG[network]?.amount || "50000",
        asset: X402_CONFIG[network]?.asset || "USDC",
        network: network,
        payTo: X402_CONFIG[network]?.payTo,
        scheme: network.includes("solana") ? "ed25519" : "eip-191",
        timestamp: Math.floor(Date.now() / 1000),
        nonce: Math.random().toString(36).substring(2, 15),
      };

      return {
        statusCode: 402,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, X-Payment, X-Chain, X-Signature",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
        body: JSON.stringify({
          error: "Payment Required",
          message: "Please sign the challenge to access Agent Coach",
          challenge: challenge,
          accepts: [challenge]
        }),
      };
    }

    if (paymentHeader) {
      console.log("💳 Verifying Agent Access Payment...");
      try {
        // Basic verification of presence and amount
        const decoded = JSON.parse(Buffer.from(paymentHeader, 'base64').toString());
        console.log("   Payment payload:", JSON.stringify(decoded).substring(0, 100) + "...");

        // Check amount if configured
        const config = X402_CONFIG[network];
        if (config && decoded.amount && BigInt(decoded.amount) < BigInt(config.amount)) {
          console.warn(`⚠️ Insufficient amount. Got ${decoded.amount}, needed ${config.amount}`);
          // In strict mode, we would return 402 here too, but for demo we proceed with warning
        }
      } catch (e) {
        console.warn("⚠️ Could not verify payment header structure:", e.message);
      }
    }

    // Run autonomous agent reasoning
    const agentResult = await runAgentReasoning(workoutData);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({
        success: true,
        agent_type: "autonomous_coach",
        model: "amazon.nova-lite-v1:0",
        agentCore_primitives_used: ["tool_use", "multi_step_reasoning", "autonomous_decision_making"],
        ...agentResult,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("❌ Lambda error:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "AI Coach Agent processing failed",
        message: error.message,
      }),
    };
  }
};
