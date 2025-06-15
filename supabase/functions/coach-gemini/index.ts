import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import 'https://deno.land/x/xhr@0.1.0/mod.ts'; // Required for OpenAI library

// API Keys from Supabase secrets (as fallbacks)
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

const getExerciseDataContext = (exercise) => {
  if (exercise === 'pull-ups') {
    return `For pull-ups, the rep data includes details: 'peakElbowFlexion' is the elbow angle at the top of the pull (a smaller angle means a higher pull, which is better), 'bottomElbowExtension' is the elbow angle at the bottom of the hang (a larger angle means fuller extension, which is better, >160 degrees is ideal), and 'asymmetry' is the difference in elbow angle between arms (lower is better, ideally close to 0). Use this detailed data to give specific feedback.`;
  }
  // Future context for other exercises can be added here.
  return '';
};

const getSummaryPrompt = (data) => {
    const { exercise, personality, reps, averageFormScore, repHistory } = data;
    const systemPrompt = systemPrompts[personality] || systemPrompts.competitive;
    const exerciseContext = getExerciseDataContext(exercise);

    const detailedRepHistory = repHistory.map(r => {
        return r.details ? { score: r.score, details: r.details } : { score: r.score };
    });

    return {
        system: `${systemPrompt} Your task is to provide a comprehensive, yet concise (2-3 sentences) summary of the user's workout session based on the data below. Focus on overall performance, consistency, and one key area for improvement. ${exerciseContext}`,
        user: `
        Workout Analysis Request:
        - Exercise: ${exercise}
        - Total Reps: ${reps}
        - Average Form Score: ${averageFormScore.toFixed(1)}%
        - Rep-by-rep data: ${JSON.stringify(detailedRepHistory)}
        
        Please provide your expert summary.`
    };
};

const getChatPrompt = (data) => {
    const { exercise, personality, reps, averageFormScore, repHistory, chatHistory } = data;
    const systemPrompt = systemPrompts[personality] || systemPrompts.competitive;
    const exerciseContext = getExerciseDataContext(exercise);

    const detailedRepHistory = repHistory.map(r => {
        return r.details ? { score: r.score, details: r.details } : { score: r.score };
    });
    const userQuestion = chatHistory[chatHistory.length - 1]?.content || "What should I focus on?";

    return {
        system: `${systemPrompt} You are answering a follow-up question about a workout session. Use the data below to give a direct, concise answer (1-2 sentences) to the user's question. ${exerciseContext}`,
        user: `
        Workout Context for Your Answer:
        - Exercise: ${exercise}
        - Total Reps: ${reps}
        - Average Form Score: ${averageFormScore.toFixed(1)}%
        - Rep-by-rep data: ${JSON.stringify(detailedRepHistory)}

        User's Question: "${userQuestion}"
        
        Provide your expert answer.`
    };
};

// --- API HELPERS ---

const generateGeminiFeedback = async (body, apiKey) => {
    const { type = 'summary' } = body;
    const finalApiKey = apiKey || GEMINI_API_KEY;
    if (!finalApiKey) throw new Error("GEMINI_API_KEY is not set.");
    
    const { system, user } = type === 'summary' ? getSummaryPrompt(body) : getChatPrompt(body);
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${finalApiKey}`;
    
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

const generateOpenAIFeedback = async (body, apiKey) => {
    const { type = 'summary' } = body;
    const finalApiKey = apiKey || OPENAI_API_KEY;
    if (!finalApiKey) throw new Error("OPENAI_API_KEY is not set.");

    const { system, user } = type === 'summary' ? getSummaryPrompt(body) : getChatPrompt(body);
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
            'Authorization': `Bearer ${finalApiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) throw new Error(`OpenAI API Error: ${await response.text()}`);
    const data = await response.json();
    return data.choices[0].message.content;
};

const generateAnthropicFeedback = async (body, apiKey) => {
    const { type = 'summary' } = body;
    const finalApiKey = apiKey || ANTHROPIC_API_KEY;
    if (!finalApiKey) throw new Error("ANTHROPIC_API_KEY is not set.");

    const { system, user } = type === 'summary' ? getSummaryPrompt(body) : getChatPrompt(body);
    const API_URL = 'https://api.anthropic.com/v1/messages';
    
    const requestBody = {
        model: 'claude-3-haiku-20240307', // Using a reliable and fast model
        system: system,
        messages: [{ role: 'user', content: user }],
        max_tokens: 150,
        temperature: 0.7,
    };

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'x-api-key': finalApiKey,
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
    const { model = 'gemini', type, userApiKeys } = body;
    
    if (type !== 'summary' && type !== 'chat') {
        return new Response(JSON.stringify({ feedback: "Request type not supported." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        });
    }

    let feedback;
    switch (model) {
      case 'openai':
        feedback = await generateOpenAIFeedback(body, userApiKeys?.openai);
        break;
      case 'anthropic':
        feedback = await generateAnthropicFeedback(body, userApiKeys?.anthropic);
        break;
      case 'gemini':
      default:
        feedback = await generateGeminiFeedback(body, userApiKeys?.gemini);
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
