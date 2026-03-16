import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const VENICE_API_KEY = process.env.VENICE_API_KEY;
const VENICE_BASE_URL = "https://api.venice.ai/api/v1";
const VENICE_MODEL = "venice-uncensored";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const systemPrompts = {
  competitive:
    "You are a data-driven, competitive fitness AI. You are obsessed with numbers and peak performance. Your feedback is always short, punchy, and motivational—sometimes a bit harsh, but always to push for improvement. Analyze the provided workout data.",
  supportive:
    "You are a supportive and encouraging fitness guide. You focus on progress, not perfection. Your feedback is always positive, gentle, and celebratory. You aim to make fitness feel joyful and accessible. Analyze the provided workout data.",
  zen: "You are a mindful and calm fitness instructor. You focus on form, breath, and the mind-body connection. Your feedback is serene, observant, and insightful. You encourage finding peace in movement. Analyze the provided workout data.",
};

const getExerciseDataContext = (exercise) => {
  if (exercise === "pull-ups") {
    return "For pull-ups, the rep data includes details: 'peakElbowFlexion' is the elbow angle at the top of the pull (a smaller angle means a higher pull, which is better), 'bottomElbowExtension' is the elbow angle at the bottom of the hang (a larger angle means fuller extension, which is better, >155 degrees is ideal), 'asymmetry' is the difference in elbow angle between arms (lower is better, ideally close to 0), 'leftHipAngle', 'rightHipAngle', 'leftKneeAngle', and 'rightKneeAngle' provide insight into lower body form. Significant changes in these angles (e.g., angles less than 160 degrees) may indicate 'kipping' or using leg momentum, which is a form fault. Use this detailed data to give specific feedback, especially on kipping if detected.";
  }
  if (exercise === "jumps") {
    return "For jumps, the rep data includes detailed metrics: 'jumpHeight' is the vertical distance achieved in pixels (higher is better, 60+ is great, 40+ is good, <25 needs work), 'landingKneeFlexion' is the average knee angle upon landing (smaller angles <120° indicate excellent shock absorption and safer landings, >160° indicates stiff dangerous landings), 'asymmetry' measures landing balance (lower is better), 'powerScore' rates explosive power (70+ is high power, 50+ is medium, <50 is low), and 'landingScore' rates landing technique (85+ is excellent, 60+ is good, <60 needs improvement). Focus on height progression, landing safety, and power development.";
  }
  return "";
};

const analyzeJumpSession = (repHistory) => {
  const jumpDetails = repHistory
    .map((rep) => rep.details)
    .filter((details) => details && "jumpHeight" in details);

  if (jumpDetails.length === 0) {
    return {
      avgHeight: 0,
      maxHeight: 0,
      consistency: 100,
      landingSuccessRate: 100,
      powerTrend: "insufficient data",
      commonIssues: [],
    };
  }

  const heights = jumpDetails.map((d) => d.jumpHeight);
  const landings = jumpDetails.map((d) => d.landingKneeFlexion);
  const powerScores = jumpDetails.map((d) => d.powerScore || 50);

  const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;
  const maxHeight = Math.max(...heights);

  const heightVariance =
    heights.map((h) => Math.pow(h - avgHeight, 2)).reduce((a, b) => a + b, 0) /
    heights.length;
  const consistency = Math.max(0, 100 - (Math.sqrt(heightVariance) / avgHeight) * 100);

  const goodLandings = landings.filter((angle) => angle < 160).length;
  const landingSuccessRate = (goodLandings / landings.length) * 100;

  const firstHalf = powerScores.slice(0, Math.ceil(powerScores.length / 2));
  const secondHalf = powerScores.slice(Math.ceil(powerScores.length / 2));
  const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  let powerTrend;
  if (secondHalfAvg > firstHalfAvg + 5) powerTrend = "improving";
  else if (secondHalfAvg < firstHalfAvg - 5) powerTrend = "declining";
  else powerTrend = "consistent";

  const issues = [];
  if (avgHeight < 40) issues.push("low jump height");
  if (landingSuccessRate < 70) issues.push("stiff landings");
  if (consistency < 70) issues.push("inconsistent height");
  if (firstHalfAvg > 70 && secondHalfAvg < 60) issues.push("fatigue impact");

  return { avgHeight, maxHeight, consistency, landingSuccessRate, powerTrend, commonIssues: issues };
};

const getJumpFeedbackPrompt = (data) => {
  const { personality, reps, jumpHeight, landingQuality, powerLevel, formIssues } = data;
  const systemPrompt = systemPrompts[personality] || systemPrompts.competitive;

  return {
    system: `${systemPrompt} You are providing real-time feedback during a jump workout. Give concise, motivational feedback (1-2 sentences max) based on the jump performance data.`,
    user: `
      Jump Performance Data:
      - Jump Height: ${jumpHeight || "N/A"} pixels
      - Landing Quality: ${landingQuality || "N/A"}° knee flexion
      - Power Level: ${powerLevel || "medium"}
      - Form Issues: ${formIssues?.join(", ") || "none"}
      - Rep Number: ${reps}

      Provide immediate, specific feedback on this jump performance.`,
  };
};

const getSummaryPrompt = (data) => {
  const { exercise, personality, reps, averageFormScore, repHistory } = data;

  if (!exercise || !personality) {
    throw new Error("Missing required fields: exercise and personality");
  }

  const systemPrompt = systemPrompts[personality] || systemPrompts.competitive;
  const exerciseContext = getExerciseDataContext(exercise);

  const safeRepHistory = Array.isArray(repHistory) ? repHistory : [];
  const detailedRepHistory = safeRepHistory.map((r) => ({
    score: r?.score || 0,
    ...(r?.details && { details: r.details }),
  }));

  const safeReps = reps || 0;
  const safeAverageFormScore = averageFormScore || 0;

  if (exercise === "jumps") {
    const jumpStats = analyzeJumpSession(safeRepHistory);
    return {
      system: `${systemPrompt} Your task is to provide a comprehensive, yet concise (2-3 sentences) summary of the user's jump training session. Focus on height progression, landing technique, power development, and consistency. ${exerciseContext}`,
      user: `
        Jump Session Analysis:
        - Total Jumps: ${safeReps}
        - Average Form Score: ${safeAverageFormScore.toFixed(1)}%
        - Average Height: ${jumpStats.avgHeight.toFixed(0)}px
        - Max Height: ${jumpStats.maxHeight}px
        - Height Consistency: ${jumpStats.consistency.toFixed(1)}%
        - Landing Success Rate: ${jumpStats.landingSuccessRate.toFixed(1)}%
        - Power Trend: ${jumpStats.powerTrend}
        - Key Issues: ${jumpStats.commonIssues.join(", ") || "none"}
        - Rep-by-rep data: ${JSON.stringify(detailedRepHistory)}

        Provide your expert jump training summary with specific recommendations.`,
    };
  }

  return {
    system: `${systemPrompt} Your task is to provide a comprehensive, yet concise (2-3 sentences) summary of the user's workout session based on the data below. Focus on overall performance, consistency, and one key area for improvement. ${exerciseContext}`,
    user: `
      Workout Analysis Request:
      - Exercise: ${exercise}
      - Total Reps: ${safeReps}
      - Average Form Score: ${safeAverageFormScore.toFixed(1)}%
      - Rep-by-rep data: ${JSON.stringify(detailedRepHistory)}

      Provide your expert summary and recommendation.`,
  };
};

const getFeedbackPrompt = (data) => {
  const { exercise, personality, reps, formIssues, formScore, details } = data;
  const systemPrompt = systemPrompts[personality] || systemPrompts.competitive;
  const exerciseContext = getExerciseDataContext(exercise);

  if (exercise === "jumps") {
    return getJumpFeedbackPrompt(data);
  }

  return {
    system: `${systemPrompt} You are providing real-time feedback during a workout. Give concise, motivational feedback (1 sentence max) based on current rep performance. ${exerciseContext}`,
    user: `
      Current Rep Data:
      - Exercise: ${exercise}
      - Rep: ${reps}
      - Form Score: ${formScore || "N/A"}%
      - Form Issues: ${formIssues?.join(", ") || "none"}
      - Detailed Metrics: ${JSON.stringify(details || {})}

      Provide immediate coaching feedback for this rep.`,
  };
};

const getChatPrompt = (data) => {
  const { exercise, personality, chatHistory, reps, averageFormScore } = data;
  const systemPrompt = systemPrompts[personality] || systemPrompts.competitive;

  return {
    system: `${systemPrompt} You are in a short chat with the user after their workout. Keep your response concise, practical, and motivating (1-3 short paragraphs max).`,
    user: `
      Session Context:
      - Exercise: ${exercise}
      - Reps: ${reps || "N/A"}
      - Avg Form Score: ${averageFormScore || "N/A"}

      Chat History:
      ${JSON.stringify(chatHistory || [])}

      Respond to the user's latest message as their coach.`,
  };
};

const resolvePromptByType = (data) => {
  if (data.type === "summary") return getSummaryPrompt(data);
  if (data.type === "chat") return getChatPrompt(data);
  return getFeedbackPrompt(data);
};

async function generateWithVenice(prompt) {
  if (!VENICE_API_KEY) {
    throw new Error("VENICE_API_KEY is not configured");
  }

  const response = await fetch(`${VENICE_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${VENICE_API_KEY}`,
    },
    body: JSON.stringify({
      model: VENICE_MODEL,
      temperature: 0.7,
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Venice request failed (${response.status}): ${text}`);
  }

  const payload = await response.json();
  return payload?.choices?.[0]?.message?.content?.trim() || "";
}

async function generateWithGemini(prompt, userApiKeys = {}) {
  const geminiKey = userApiKeys.gemini || GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error("Gemini API key missing");
  }

  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(`${prompt.system}\n\n${prompt.user}`);
  return result.response.text().trim();
}

export const handler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  if (method === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  if (method !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const prompt = resolvePromptByType(body);

    let feedback = "";
    let provider = "venice";

    try {
      feedback = await generateWithVenice(prompt);
    } catch (veniceError) {
      console.warn("Venice failed, falling back to Gemini:", veniceError?.message || veniceError);
      provider = "gemini";
      feedback = await generateWithGemini(prompt, body.userApiKeys || {});
    }

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ feedback, provider }),
    };
  } catch (error) {
    console.error("Coach Lambda error:", error);
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message || "Failed to generate AI feedback" }),
    };
  }
};
