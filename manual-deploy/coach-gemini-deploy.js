// Simplified coach-gemini function for manual deployment
// This is a Node.js version that can be deployed to Supabase manually

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// System prompts for different coach personalities
const systemPrompts = {
  competitive: `You are a data-driven, competitive fitness AI. You are obsessed with numbers and peak performance. Your feedback is always short, punchy, and motivational—sometimes a bit harsh, but always to push for improvement. Analyze the provided workout data.`,
  supportive: `You are a supportive and encouraging fitness guide. You focus on progress, not perfection. Your feedback is always positive, gentle, and celebratory. You aim to make fitness feel joyful and accessible. Analyze the provided workout data.`,
  zen: `You are a mindful and calm fitness instructor. You focus on form, breath, and the mind-body connection. Your feedback is serene, observant, and insightful. You encourage finding peace in movement. Analyze the provided workout data.`,
};

// Fallback feedback when AI services are unavailable
const getFallbackFeedback = (exercise, issues = []) => {
  const fallbackMessages = {
    "pull-ups": [
      "Keep pushing! Focus on full range of motion and controlled movement.",
      "Great effort! Remember to engage your core and avoid swinging.",
      "Nice work! Try to pull your chest to the bar for maximum benefit.",
      "Keep it up! Control the descent to maximize muscle engagement.",
    ],
    jumps: [
      "Explosive power! Focus on soft landings to protect your joints.",
      "Great height! Remember to land with bent knees for safety.",
      "Nice jumps! Try to maintain consistent form throughout the set.",
      "Keep jumping! Focus on quick takeoffs and controlled landings.",
    ],
    default: [
      "Great workout! Keep maintaining good form and consistency.",
      "Nice effort! Focus on quality over quantity.",
      "Keep it up! Remember to breathe and stay focused.",
      "Excellent work! Consistency is key to improvement.",
    ],
  };

  const messages = fallbackMessages[exercise] || fallbackMessages.default;
  return messages[Math.floor(Math.random() * messages.length)];
};

// Generate AI feedback using Gemini API
async function generateGeminiFeedback(body, apiKey) {
  try {
    console.log("Starting Gemini feedback generation...");
    const { type = "summary", exercise, personality } = body;

    if (!apiKey) {
      console.error("No Gemini API key available");
      throw new Error("GEMINI_API_KEY is not set.");
    }

    // Simple prompt generation based on type
    let prompt;
    if (type === "feedback") {
      prompt = `${systemPrompts[personality] || systemPrompts.competitive}

      Provide short, motivational feedback (1-2 sentences) for a ${exercise} workout.
      Current rep: ${body.reps || 1}
      Form issues: ${body.formIssues?.join(", ") || "none"}

      Give immediate, specific feedback.`;
    } else if (type === "summary") {
      prompt = `${systemPrompts[personality] || systemPrompts.competitive}

      Provide a concise workout summary (2-3 sentences) for:
      - Exercise: ${exercise}
      - Total Reps: ${body.reps || 0}
      - Average Form Score: ${(body.averageFormScore || 0).toFixed(1)}%

      Focus on performance and one key improvement area.`;
    } else {
      prompt = `${systemPrompts[personality] || systemPrompts.competitive}

      Answer this fitness question briefly: ${body.chatHistory?.[body.chatHistory.length - 1]?.content || "What should I focus on?"}

      Context: ${exercise} workout with ${body.reps || 0} reps completed.`;
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 150 },
    };

    console.log("Making request to Gemini API...");
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error response:", errorText);
      throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log("Gemini API response received");

    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content ||
      !data.candidates[0].content.parts ||
      !data.candidates[0].content.parts[0]
    ) {
      console.error("Unexpected Gemini response structure:", JSON.stringify(data));
      throw new Error("Unexpected response structure from Gemini API");
    }

    return data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error("Error in generateGeminiFeedback:", error);
    throw error;
  }
}

// Main handler function
export default async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).json({});
  }

  try {
    console.log("Received request:", req.method);

    const body = req.body;
    console.log("Request body:", JSON.stringify(body, null, 2));

    const { model = "gemini", type, userApiKeys, exercise } = body;

    console.log("Processing request:", { model, type, exercise });

    if (!["summary", "chat", "feedback"].includes(type)) {
      console.error("Invalid request type:", type);
      return res.status(400).json({ error: "Request type not supported." });
    }

    let feedback;
    try {
      // Get API key from user keys or environment
      const apiKey = userApiKeys?.gemini || process.env.GEMINI_API_KEY;

      if (model === "gemini" || !model) {
        console.log("Calling Gemini...");
        feedback = await generateGeminiFeedback(body, apiKey);
      } else {
        // For other models, provide fallback for now
        feedback = getFallbackFeedback(exercise, body.formIssues);
      }

      console.log("Generated feedback successfully");
    } catch (aiError) {
      console.error("AI generation error:", aiError);
      // Provide fallback feedback instead of error
      feedback = getFallbackFeedback(exercise, body.formIssues);
      console.log("Using fallback feedback");
    }

    return res.status(200).json({ feedback });
  } catch (error) {
    console.error("Unexpected error in AI coach function:", error);
    console.error("Error stack:", error.stack);

    // Always provide some feedback, even on error
    const fallbackFeedback = getFallbackFeedback(req.body?.exercise || "default");
    return res.status(200).json({ feedback: fallbackFeedback });
  }
}
