// Node.js version of coach-gemini function
// Provides AI coaching feedback using Gemini, OpenAI, and Anthropic APIs

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// API Keys from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Fallback responses when AI fails
const fallbackResponses = {
  "pull-ups": [
    "Strong form! Focus on controlled descent and full range of motion.",
    "Good technique! Engage your lats and avoid momentum swinging.",
    "Nice control! Try to pause briefly at the top for maximum benefit.",
    "Solid reps! Keep your core tight throughout the movement.",
    "Great effort! Focus on pulling with your back, not just arms."
  ],
  "jumps": [
    "Explosive power! Land softly on the balls of your feet.",
    "Good height! Keep your knees slightly bent on landing.",
    "Nice rhythm! Focus on quick, powerful takeoffs.",
    "Great consistency! Try to minimize ground contact time.",
    "Excellent jumps! Keep your core engaged for stability."
  ],
  "default": [
    "Excellent form! Maintain this quality throughout your workout.",
    "Strong technique! Focus on controlled, deliberate movements.",
    "Great consistency! Quality reps lead to better results.",
    "Nice control! Remember to breathe steadily during exercise.",
    "Solid performance! Keep challenging yourself progressively."
  ]
};

const getRandomFallback = (exercise) => {
  const responses = fallbackResponses[exercise] || fallbackResponses.default;
  return responses[Math.floor(Math.random() * responses.length)];
};

// Generate coaching prompt based on workout data
const generatePrompt = (body) => {
  const {
    exercise = "pull-ups",
    reps = 0,
    averageFormScore = 0,
    personality = "competitive",
    type = "feedback"
  } = body;

  let personalityStyle = "";
  switch (personality) {
    case "competitive":
      personalityStyle = "Be motivational, data-driven, and performance-focused. Push for improvement.";
      break;
    case "supportive":
      personalityStyle = "Be encouraging, positive, and celebratory. Focus on progress over perfection.";
      break;
    case "zen":
      personalityStyle = "Be calm, mindful, and focused on form and breath. Encourage mind-body connection.";
      break;
    default:
      personalityStyle = "Be helpful and constructive.";
  }

  if (type === "feedback") {
    return `You are a fitness coach providing real-time feedback. ${personalityStyle}

Exercise: ${exercise}
Reps completed: ${reps}
Average form score: ${averageFormScore}%

Give 1-2 sentences of specific, actionable feedback. Keep it concise and under 120 characters. Focus on technique and motivation.`;
  }

  if (type === "summary") {
    return `You are a fitness coach providing a workout summary. ${personalityStyle}

Exercise: ${exercise}
Total reps: ${reps}
Average form score: ${averageFormScore}%

Provide a 2-3 sentence summary of the workout performance with specific recommendations for improvement.`;
  }

  return `You are a helpful fitness coach. ${personalityStyle} Answer the user's question about their ${exercise} workout.`;
};

// Call Gemini API
const callGeminiAPI = async (prompt, apiKey) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 150
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Gemini API error: ${response.status} - ${errorText}`);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

// Call OpenAI API
const callOpenAIAPI = async (prompt, apiKey) => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`OpenAI API error: ${response.status} - ${errorText}`);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || "";
};

// Call Anthropic API
const callAnthropicAPI = async (prompt, apiKey) => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Anthropic API error: ${response.status} - ${errorText}`);
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return data?.content?.[0]?.text || "";
};

// Main handler function
export const handler = async (event) => {
  console.log('Received event:', JSON.stringify(event));

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    console.log('Request body:', body);

    const {
      model = "gemini",
      type = "feedback",
      exercise = "pull-ups",
      userApiKeys = {}
    } = body;

    console.log(`Processing: ${model} ${type} for ${exercise}`);

    // Generate prompt
    const prompt = generatePrompt(body);
    console.log('Generated prompt');

    let feedback;
    let apiKey;

    try {
      // Determine which API to use and get the key
      switch (model) {
        case "openai":
          apiKey = userApiKeys.openai || OPENAI_API_KEY;
          if (!apiKey) throw new Error("OpenAI API key not available");
          console.log('Calling OpenAI...');
          feedback = await callOpenAIAPI(prompt, apiKey);
          break;

        case "anthropic":
          apiKey = userApiKeys.anthropic || ANTHROPIC_API_KEY;
          if (!apiKey) throw new Error("Anthropic API key not available");
          console.log('Calling Anthropic...');
          feedback = await callAnthropicAPI(prompt, apiKey);
          break;

        case "gemini":
        default:
          apiKey = userApiKeys.gemini || GEMINI_API_KEY;
          if (!apiKey) throw new Error("Gemini API key not available");
          console.log('Calling Gemini...');
          feedback = await callGeminiAPI(prompt, apiKey);
          break;
      }

      console.log('AI response received');

      // Clean up the response
      feedback = feedback.trim();
      if (feedback.length > 150) {
        feedback = feedback.substring(0, 147) + "...";
      }

    } catch (aiError) {
      console.error(`${model} API error:`, aiError.message);
      // Use intelligent fallback
      feedback = getRandomFallback(exercise);
      console.log('Using fallback response');
    }

    // Ensure we always have a response
    if (!feedback || feedback.length < 5) {
      feedback = getRandomFallback(exercise);
      console.log('Using backup fallback');
    }

    console.log('Returning feedback:', feedback);

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ feedback })
    };

  } catch (error) {
    console.error('Unexpected error:', error);

    // Always return something useful, even on complete failure
    const fallback = "Great workout! Keep up the excellent form and consistency.";

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        feedback: fallback,
        error: "AI temporarily unavailable, using fallback response"
      })
    };
  }
};
