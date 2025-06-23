const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

const bedrockClient = new BedrockRuntimeClient({
  region: "eu-north-1"
});

// SNEL 🐌 Basic Coach - Using cheapest Bedrock model
exports.handler = async (event) => {
  console.log('🐌 SNEL Basic Coach received event:', JSON.stringify(event));

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  try {
    // Parse request body
    const requestData = JSON.parse(event.body || '{}');
    console.log('🐌 SNEL processing:', requestData);

    const {
      exercise = 'pull-ups',
      reps = 0,
      averageFormScore = 0,
      personality = 'supportive',
      type = 'feedback'
    } = requestData;

    // Get basic coaching feedback from Nova Micro (cheapest model)
    const feedback = await getSNELFeedback({
      exercise,
      reps,
      averageFormScore,
      personality,
      type
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify({
        coach: 'SNEL',
        emoji: '🐌',
        tier: 'basic',
        feedback: feedback
      })
    };

  } catch (error) {
    console.error('🐌 SNEL error:', error);

    // Smart fallback based on performance
    const fallbackFeedback = getFallbackFeedback(requestData);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        coach: 'SNEL',
        emoji: '🐌',
        tier: 'basic',
        feedback: fallbackFeedback,
        note: 'Using backup coaching (SNEL is taking a nap)'
      })
    };
  }
};

async function getSNELFeedback({ exercise, reps, averageFormScore, personality, type }) {
  const MODEL_ID = "amazon.nova-micro-v1:0"; // Cheapest text model

  // Craft personality-based prompt
  let personalityPrompt = "";
  switch (personality) {
    case 'competitive':
      personalityPrompt = "Be motivational and push for peak performance. Use sports terminology.";
      break;
    case 'zen':
      personalityPrompt = "Be calm and mindful. Focus on breath and body awareness.";
      break;
    case 'supportive':
    default:
      personalityPrompt = "Be encouraging and positive. Celebrate progress over perfection.";
  }

  // Create concise prompt for basic feedback
  const prompt = `You are SNEL 🐌, a friendly basic fitness coach. ${personalityPrompt}

Exercise: ${exercise}
Reps: ${reps}
Form Score: ${averageFormScore}%

Give ONE concise sentence of encouragement and ONE quick tip. Keep it under 80 characters total. Be motivational but brief.`;

  // Nova Micro payload format
  const payload = {
    messages: [
      {
        role: "user",
        content: [
          {
            text: prompt
          }
        ]
      }
    ],
    inferenceConfig: {
      maxTokens: 50, // Keep it very short for basic tier
      temperature: 0.8
    }
  };

  const command = new InvokeModelCommand({
    contentType: "application/json",
    body: JSON.stringify(payload),
    modelId: MODEL_ID,
  });

  try {
    console.log('🐌 Calling Nova Micro for basic feedback...');

    const apiResponse = await bedrockClient.send(command);
    const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
    const responseBody = JSON.parse(decodedResponseBody);

    console.log('🐌 Nova Micro response received');

    // Extract text from Nova Micro response
    const feedback = responseBody.output.message.content[0].text;

    // Ensure it's concise (basic tier)
    if (feedback.length > 100) {
      return feedback.substring(0, 97) + "...";
    }

    return feedback;

  } catch (error) {
    console.error("🐌 Nova Micro error:", error);
    throw error;
  }
}

function getFallbackFeedback({ exercise, reps, averageFormScore }) {
  const exerciseFeedback = {
    'pull-ups': [
      "Strong work! Focus on full range of motion.",
      "Great effort! Pull with your back, not arms.",
      "Nice reps! Control the descent.",
      "Solid form! Engage that core."
    ],
    'jumps': [
      "Explosive! Land softly on your toes.",
      "Good height! Bend those knees on landing.",
      "Powerful! Quick takeoffs, controlled landings.",
      "Nice rhythm! Stay light on your feet."
    ]
  };

  const messages = exerciseFeedback[exercise] || exerciseFeedback['pull-ups'];
  const baseMessage = messages[Math.floor(Math.random() * messages.length)];

  // Add performance-based encouragement
  if (averageFormScore >= 85) {
    return `${baseMessage} Excellent form! 🐌`;
  } else if (averageFormScore >= 70) {
    return `${baseMessage} Keep improving! 🐌`;
  } else {
    return `${baseMessage} Take your time! 🐌`;
  }
}
