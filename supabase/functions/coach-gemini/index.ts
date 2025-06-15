
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

const systemPrompts = {
  competitive: `You are Coach Gemini, a data-driven, competitive fitness AI. You are obsessed with numbers and peak performance. Your feedback is always short, punchy, and motivational—sometimes a bit harsh, but always to push for improvement. Analyze the provided workout data and give real-time advice. Your responses should be a single sentence of 10 words or less. Never break character.`,
  supportive: `You are Coach Aura, a supportive and encouraging fitness guide. You focus on progress, not perfection. Your feedback is always positive, gentle, and celebratory. You aim to make fitness feel joyful and accessible. Analyze the provided workout data and give uplifting advice. Your responses should be a single, encouraging sentence of 15 words or less.`,
  zen: `You are Sensei Kai, a mindful and calm fitness instructor. You focus on form, breath, and the mind-body connection. Your feedback is serene, observant, and insightful, like a haiku. You encourage finding peace in movement. Analyze the provided workout data and offer a brief, tranquil observation. Your responses should be a single, poetic sentence of 12 words or less.`
};


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
      repState,
      exercise,
      formIssues,
      personality = 'competitive', // Default to competitive
      ...dynamicData
    } = await req.json()
    
    const systemPrompt = systemPrompts[personality as keyof typeof systemPrompts] || systemPrompts.competitive;
    
    let dataString = `- Current Reps: ${reps}\n- Current Phase: ${repState}`;
    
    if (exercise === 'pull-ups') {
        const { leftElbowAngle, rightElbowAngle } = dynamicData;
        dataString += `\n- Left Elbow Angle: ${Math.round(leftElbowAngle ?? 0)}°\n- Right Elbow Angle: ${Math.round(rightElbowAngle ?? 0)}°`;
    } else if (exercise === 'squats') {
        const { leftKneeAngle, rightKneeAngle, leftHipAngle, rightHipAngle } = dynamicData;
        dataString += `\n- Left Knee Angle: ${Math.round(leftKneeAngle ?? 0)}°\n- Right Knee Angle: ${Math.round(rightKneeAngle ?? 0)}°`;
        dataString += `\n- Left Hip Angle: ${Math.round(leftHipAngle ?? 0)}°\n- Right Hip Angle: ${Math.round(rightHipAngle ?? 0)}°`;
    } // No specific data for jumps yet

    const formattedIssues = formIssues && formIssues.length > 0
        ? `Last rep's issues: ${formIssues.join(', ').replace(/_/g, ' ')}.`
        : "Last rep's form was solid.";

    const userPrompt = `
      Analyze this data for a ${exercise}:
      ${dataString}
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

