const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

const bedrockClient = new BedrockRuntimeClient({
  region: "eu-north-1"
});

// STEDDIE 🐢 Premium Analysis - Using Nova Lite for detailed analysis
exports.handler = async (event) => {
  console.log('🐢 STEDDIE Premium Analysis received event:', JSON.stringify(event));

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-payment-response',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  try {
    // Parse request body
    const workoutData = JSON.parse(event.body || '{}');
    console.log('🐢 STEDDIE analyzing workout:', workoutData);

    // Skip payment verification for now (add back later)
    console.log('🐢 Processing premium workout analysis...');

    // Get detailed analysis from Nova Lite
    const analysis = await getSTEDDIEAnalysis(workoutData);

    if (!analysis) {
      throw new Error('Failed to get analysis from STEDDIE');
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'x-payment-response': 'success' // Mock payment response
      },
      body: JSON.stringify({
        coach: 'STEDDIE',
        emoji: '🐢',
        tier: 'premium',
        analysis: analysis
      })
    };

  } catch (error) {
    console.error('🐢 STEDDIE error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'STEDDIE analysis unavailable',
        details: error.message
      })
    };
  }
};

async function getSTEDDIEAnalysis(data) {
  const MODEL_ID = "amazon.nova-lite-v1:0";

  // Construct the detailed premium prompt
  const prompt = `
    You are STEDDIE 🐢, an expert premium fitness analyst with years of coaching experience.
    You provide comprehensive, insightful analysis that users pay for.

    Workout Data:
    - Exercise: ${data.exercise || 'unknown'}
    - Duration: ${data.duration || 0} seconds
    - Reps: ${data.reps || 0}
    - Average Form Score: ${data.averageFormScore || 0}%

    Please provide a detailed "STEDDIE Deep Dive" analysis including:
    1. A thorough summary of the overall performance.
    2. 4-5 specific, actionable points of feedback on form, consistency, power, and technique.
    3. An overall score out of 100 with detailed rationale.
    4. Personalized recommendations for improvement.

    Format your response as a comprehensive yet readable analysis that justifies the premium price.
    Be specific, professional, and motivational.
  `;

  // Nova Lite payload format
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
      maxTokens: 2048,
      temperature: 0.7
    }
  };

  const command = new InvokeModelCommand({
    contentType: "application/json",
    body: JSON.stringify(payload),
    modelId: MODEL_ID,
  });

  try {
    console.log('🐢 Calling Nova Lite for premium analysis...');
    console.log('🐢 Payload:', JSON.stringify(payload, null, 2));

    const apiResponse = await bedrockClient.send(command);
    const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
    const responseBody = JSON.parse(decodedResponseBody);

    console.log('🐢 Nova Lite response:', JSON.stringify(responseBody, null, 2));

    // Nova Lite response format
    const analysisText = responseBody.output.message.content[0].text;
    return analysisText;

  } catch (error) {
    console.error("🐢 Nova Lite error:", error);
    throw error;
  }
}
