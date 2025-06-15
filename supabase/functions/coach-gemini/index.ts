
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import 'https://deno.land/x/xhr@0.1.0/mod.ts'; // Required for OpenAI library

// API Keys from Supabase secrets
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- PROMPT ENGINEERING ---

const systemPrompts = {
  competitive: `You are a data-driven, competitive fitness AI. You are obsessed with numbers and peak performance. Your feedback is always short, punchy, and motivational—sometimes a bit harsh, but always to push for improvement. Analyze the provided workout data.`,
  supportive: `You are a supportive and encouraging fitness guide. You focus on progress, not perfection. Your feedback is always positive, gentle, and celebratory. You aim to make fitness feel joyful and accessible. Analyze the provided workout data.`,
  zen: `You are a mindful and calm fitness instructor. You focus on form, breath, and the mind-body connection. Your feedback is serene, observant, and insightful. You encourage finding peace in movement. Analyze the provided workout data.`
};

const getSummaryPrompt = (data) => {
    const { exercise, personality, reps, averageFormScore, repHistory } = data;
    const systemPrompt = systemPrompts[personality] || systemPrompts.competitive;

    // Sanitize rep history for the prompt
    const cleanRepHistory = repHistory.map(r => ({ score: r.score, timestamp: r.timestamp }));

    return {
        system: `${systemPrompt} Your task is to provide a comprehensive, yet concise (2-3 sentences) summary of the user's workout session based on the data below. Focus on overall performance, consistency, and one key area for improvement.`,
        user: `
        Workout Analysis Request:
        - Exercise: ${exercise}
        - Total Reps: ${reps}
        - Average Form Score: ${averageFormScore.toFixed(1)}%
        - Session Data (rep scores): ${JSON.stringify(cleanRepHistory.map(r => r.score))}
        
        Please provide your expert summary.`
    };
};

// --- API HELPERS ---

const generateGeminiFeedback = async (body) => {
    const { personality } = body;
    const { system, user } = getSummaryPrompt(body);
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    
    const requestBody = {
      contents: [{ parts: [{ text: system }, { text: user }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 150 },
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) throw new Error(`Gemini API Error: ${await response.text()}`);
    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
};

const generateOpenAIFeedback = async (body) => {
    const { system, user } = getSummaryPrompt(body);
    const API_URL = 'https://api.openai.com/v1/chat/completions';

    const requestBody = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.7,
      max_tokens: 150,
    };

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) throw new Error(`OpenAI API Error: ${await response.text()}`);
    const data = await response.json();
    return data.choices[0].message.content;
};

const generateAnthropicFeedback = async (body) => {
    const { system, user } = getSummaryPrompt(body);
    const API_URL = 'https://api.anthropic.com/v1/messages';
    
    const requestBody = {
        model: 'claude-3-haiku-20240307',
        system: system,
        messages: [{ role: 'user', content: user }],
        max_tokens: 150,
        temperature: 0.7,
    };

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) throw new Error(`Anthropic API Error: ${await response.text()}`);
    const data = await response.json();
    return data.content[0].text;
};

// --- MAIN SERVER ---

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { model = 'gemini', type } = body;
    
    // This function now primarily handles summaries.
    // Real-time feedback can be re-introduced if needed.
    if (type !== 'summary') {
        // Fallback for any non-summary calls
        return new Response(JSON.stringify({ feedback: "Ready for your summary." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    let feedback;
    switch (model) {
      case 'openai':
        if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set.");
        feedback = await generateOpenAIFeedback(body);
        break;
      case 'anthropic':
        if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set.");
        feedback = await generateAnthropicFeedback(body);
        break;
      case 'gemini':
      default:
        if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set.");
        feedback = await generateGeminiFeedback(body);
        break;
    }

    return new Response(JSON.stringify({ feedback }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI coach function:', error.message);
    return new Response(JSON.stringify({ feedback: "An error occurred while getting feedback." }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
