import type { Handler } from "@netlify/functions";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const VENICE_API_KEY = process.env.VENICE_API_KEY;
const VENICE_BASE_URL = "https://api.venice.ai/api/v1";
const VENICE_MODEL = "venice-uncensored";

// --- PROMPT ENGINEERING ---

const systemPrompts: Record<string, string> = {
  competitive: `You are a data-driven, competitive fitness AI. You are obsessed with numbers and peak performance. Your feedback is always short, punchy, and motivational—sometimes a bit harsh, but always to push for improvement. Analyze the provided workout data.`,
  supportive: `You are a supportive and encouraging fitness guide. You focus on progress, not perfection. Your feedback is always positive, gentle, and celebratory. You aim to make fitness feel joyful and accessible. Analyze the provided workout data.`,
  zen: `You are a mindful and calm fitness instructor. You focus on form, breath, and the mind-body connection. Your feedback is serene, observant, and insightful. You encourage finding peace in movement. Analyze the provided workout data.`,
};

const getExerciseDataContext = (exercise: string): string => {
  if (exercise === "pull-ups") {
    return `For pull-ups, the rep data includes details: 'peakElbowFlexion' is the elbow angle at the top of the pull (a smaller angle means a higher pull, which is better), 'bottomElbowExtension' is the elbow angle at the bottom of the hang (a larger angle means fuller extension, which is better, >155 degrees is ideal), 'asymmetry' is the difference in elbow angle between arms (lower is better, ideally close to 0), 'leftHipAngle', 'rightHipAngle', 'leftKneeAngle', and 'rightKneeAngle' provide insight into lower body form. Significant changes in these angles (e.g., angles less than 160 degrees) may indicate 'kipping' or using leg momentum, which is a form fault. Use this detailed data to give specific feedback, especially on kipping if detected.`;
  }
  if (exercise === "jumps") {
    return `For jumps, the rep data includes detailed metrics: 'jumpHeight' is the vertical distance achieved in pixels (higher is better, 60+ is great, 40+ is good, <25 needs work), 'landingKneeFlexion' is the average knee angle upon landing (smaller angles <120° indicate excellent shock absorption and safer landings, >160° indicates stiff dangerous landings), 'asymmetry' measures landing balance (lower is better), 'powerScore' rates explosive power (70+ is high power, 50+ is medium, <50 is low), and 'landingScore' rates landing technique (85+ is excellent, 60+ is good, <60 needs improvement). Focus on height progression, landing safety, and power development.`;
  }
  return "";
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getJumpFeedbackPrompt = (data: any) => {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const analyzeJumpSession = (repHistory: any[]) => {
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
      commonIssues: [] as string[],
    };
  }

  const heights = jumpDetails.map((d) => d.jumpHeight);
  const landings = jumpDetails.map((d) => d.landingKneeFlexion);
  const powerScores = jumpDetails.map((d) => d.powerScore || 50);

  const avgHeight = heights.reduce((a: number, b: number) => a + b, 0) / heights.length;
  const maxHeight = Math.max(...heights);

  const heightVariance =
    heights.map((h: number) => Math.pow(h - avgHeight, 2)).reduce((a: number, b: number) => a + b, 0) /
    heights.length;
  const consistency = Math.max(0, 100 - (Math.sqrt(heightVariance) / avgHeight) * 100);

  const goodLandings = landings.filter((angle: number) => angle < 160).length;
  const landingSuccessRate = (goodLandings / landings.length) * 100;

  const firstHalf = powerScores.slice(0, Math.ceil(powerScores.length / 2));
  const secondHalf = powerScores.slice(Math.ceil(powerScores.length / 2));
  const firstHalfAvg = firstHalf.reduce((a: number, b: number) => a + b, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((a: number, b: number) => a + b, 0) / secondHalf.length;

  let powerTrend: string;
  if (secondHalfAvg > firstHalfAvg + 5) powerTrend = "improving";
  else if (secondHalfAvg < firstHalfAvg - 5) powerTrend = "declining";
  else powerTrend = "consistent";

  const issues: string[] = [];
  if (avgHeight < 40) issues.push("low jump height");
  if (landingSuccessRate < 70) issues.push("stiff landings");
  if (consistency < 70) issues.push("inconsistent height");
  if (firstHalfAvg > 70 && secondHalfAvg < 60) issues.push("fatigue impact");

  return { avgHeight, maxHeight, consistency, landingSuccessRate, powerTrend, commonIssues: issues };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSummaryPrompt = (data: any) => {
  const { exercise, personality, reps, averageFormScore, repHistory } = data;

  if (!exercise || !personality) {
    throw new Error("Missing required fields: exercise and personality");
  }

  const systemPrompt = systemPrompts[personality] || systemPrompts.competitive;
  const exerciseContext = getExerciseDataContext(exercise);

  const safeRepHistory = Array.isArray(repHistory) ? repHistory : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detailedRepHistory = safeRepHistory.map((r: any) => ({
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

        Please provide your expert summary.`,
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getChatPrompt = (data: any) => {
  const { exercise, personality, reps, averageFormScore, repHistory, chatHistory } = data;
  const systemPrompt = systemPrompts[personality] || systemPrompts.competitive;
  const exerciseContext = getExerciseDataContext(exercise);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detailedRepHistory = (repHistory || []).map((r: any) => ({
    score: r?.score || 0,
    ...(r?.details && { details: r.details }),
  }));
  const userQuestion =
    chatHistory?.[chatHistory.length - 1]?.content || "What should I focus on?";

  if (exercise === "jumps") {
    const jumpStats = analyzeJumpSession(repHistory || []);
    return {
      system: `${systemPrompt} You are answering a follow-up question about a jump training session. Use the detailed jump data to give a direct, concise answer (1-2 sentences) to the user's question. ${exerciseContext}`,
      user: `
            Jump Session Context:
            - Total Jumps: ${reps}
            - Average Form Score: ${(averageFormScore || 0).toFixed(1)}%
            - Jump Performance: Avg ${jumpStats.avgHeight.toFixed(0)}px, Max ${jumpStats.maxHeight}px
            - Landing Quality: ${jumpStats.landingSuccessRate.toFixed(1)}% success rate
            - Consistency: ${jumpStats.consistency.toFixed(1)}%
            - Power Trend: ${jumpStats.powerTrend}
            - Rep-by-rep data: ${JSON.stringify(detailedRepHistory)}

            User's Question: "${userQuestion}"

            Provide your expert answer focused on jump training.`,
    };
  }

  return {
    system: `${systemPrompt} You are answering a follow-up question about a workout session. Use the data below to give a direct, concise answer (1-2 sentences) to the user's question. ${exerciseContext}`,
    user: `
        Workout Context for Your Answer:
        - Exercise: ${exercise}
        - Total Reps: ${reps}
        - Average Form Score: ${(averageFormScore || 0).toFixed(1)}%
        - Rep-by-rep data: ${JSON.stringify(detailedRepHistory)}

        User's Question: "${userQuestion}"

        Provide your expert answer.`,
  };
};

// --- AI PROVIDER API CALLS ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getPromptData = (body: any) => {
  const { type = "summary" } = body;

  if (type === "feedback" && body.exercise === "jumps") {
    return getJumpFeedbackPrompt(body);
  }
  if (type === "summary") {
    return getSummaryPrompt(body);
  }
  return getChatPrompt(body);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateVeniceFeedback = async (body: any): Promise<string> => {
  const { userApiKeys } = body;
  const apiKey = userApiKeys?.venice || VENICE_API_KEY;

  if (!apiKey) {
    throw new Error("VENICE_API_KEY is not set.");
  }

  const { system, user } = getPromptData(body);

  const response = await fetch(`${VENICE_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: VENICE_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.8,
      max_tokens: 150,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Venice API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Unexpected response structure from Venice API");
  }

  return content.trim();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateGeminiFeedback = async (body: any): Promise<string> => {
  const { userApiKeys } = body;
  const apiKey = userApiKeys?.gemini || GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const { system, user } = getPromptData(body);
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [{ parts: [{ text: system }, { text: user }] }],
    generationConfig: { temperature: 0.8, maxOutputTokens: 150 },
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (
    !data.candidates?.[0]?.content?.parts?.[0]
  ) {
    throw new Error("Unexpected response structure from Gemini API");
  }

  return data.candidates[0].content.parts[0].text.trim();
};

// --- HANDLER ---

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { type } = body;

    if (!["summary", "chat", "feedback"].includes(type)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Request type not supported." }),
      };
    }

    let feedback: string;
    try {
      feedback = await generateVeniceFeedback(body);
    } catch (veniceError) {
      console.warn("Venice failed, falling back to Gemini", veniceError);
      feedback = await generateGeminiFeedback(body);
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback }),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Failed to generate AI feedback",
        details: message,
      }),
    };
  }
};
