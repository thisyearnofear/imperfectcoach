import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Safety check for API key
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not set in Supabase secrets.");
}

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const systemPrompt = `You are Coach Gemini, a data-driven, competitive fitness AI. You are obsessed with numbers and peak performance. Your feedback is always short, punchy, and motivational—sometimes a bit harsh, but always to push for improvement. Analyze the provided workout data and give real-time advice. Your responses should be a single sentence of 10 words or less. Never break character.`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!GEMINI_API_KEY) {
        throw new Error("Missing GEMINI_API_KEY. Please set it in Supabase project secrets.");
    }
      
    const {
      reps,
      leftElbowAngle,
      rightElbowAngle,
      repState,
      exercise,
      formIssues, // Now receiving form issues
    } = await req.json()

    const formattedIssues = formIssues && formIssues.length > 0
        ? `Last rep's issues: ${formIssues.join(', ').replace(/_/g, ' ')}.`
        : "Last rep's form was solid.";

    const userPrompt = `
      Analyze this data for a ${exercise}:
      - Current Reps: ${reps}
      - Left Elbow Angle: ${Math.round(leftElbowAngle)}°
      - Right Elbow Angle: ${Math.round(rightElbowAngle)}°
      - Current Phase: ${repState} (UP is top of rep, DOWN is bottom)
      - ${formattedIssues}

      Provide new, concise feedback. If there were issues, focus on correcting one.
    `

    const requestBody = {
      contents: [
        {
          parts: [{ text: systemPrompt }, { text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 60,
      },
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
        const errorData = await response.text();
        console.error('Gemini API Error:', errorData);
        throw new Error(`Gemini API responded with status: ${response.status}`);
    }

    const responseData = await response.json();
    const feedback = responseData.candidates[0].content.parts[0].text.trim();

    return new Response(JSON.stringify({ feedback }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in coach-gemini function:', error.message)
    const feedback = "Let's go! Keep that fire burning!" // Generic fallback
    return new Response(JSON.stringify({ feedback }), {
      status: 200, // Return 200 with fallback to not break the client
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
