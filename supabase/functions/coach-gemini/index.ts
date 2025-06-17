
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
  if (exercise === 'jumps') {
    return `For jumps, the rep data includes detailed metrics: 'jumpHeight' is the vertical distance achieved in pixels (higher is better, 60+ is great, 40+ is good, <25 needs work), 'landingKneeFlexion' is the average knee angle upon landing (smaller angles <120° indicate excellent shock absorption and safer landings, >160° indicates stiff dangerous landings), 'asymmetry' measures landing balance (lower is better), 'powerScore' rates explosive power (70+ is high power, 50+ is medium, <50 is low), and 'landingScore' rates landing technique (85+ is excellent, 60+ is good, <60 needs improvement). Focus on height progression, landing safety, and power development.`;
  }
  return '';
};

const getJumpFeedbackPrompt = (data) => {
    const { exercise, personality, reps, jumpHeight, landingQuality, powerLevel, formIssues } = data;
    const systemPrompt = systemPrompts[personality] || systemPrompts.competitive;
    
    return {
        system: `${systemPrompt} You are providing real-time feedback during a jump workout. Give concise, motivational feedback (1-2 sentences max) based on the jump performance data.`,
        user: `
        Jump Performance Data:
        - Jump Height: ${jumpHeight || 'N/A'} pixels
        - Landing Quality: ${landingQuality || 'N/A'}° knee flexion
        - Power Level: ${powerLevel || 'medium'}
        - Form Issues: ${formIssues?.join(', ') || 'none'}
        - Rep Number: ${reps}
        
        Provide immediate, specific feedback on this jump performance.`
    };
};

const getSummaryPrompt = (data) => {
    const { exercise, personality, reps, averageFormScore, repHistory } = data;
    const systemPrompt = systemPrompts[personality] || systemPrompts.competitive;
    const exerciseContext = getExerciseDataContext(exercise);

    const detailedRepHistory = repHistory.map(r => {
        return r.details ? { score: r.score, details: r.details } : { score: r.score };
    });

    if (exercise === 'jumps') {
        const jumpStats = analyzeJumpSession(repHistory);
        return {
            system: `${systemPrompt} Your task is to provide a comprehensive, yet concise (2-3 sentences) summary of the user's jump training session. Focus on height progression, landing technique, power development, and consistency. ${exerciseContext}`,
            user: `
            Jump Session Analysis:
            - Total Jumps: ${reps}
            - Average Form Score: ${averageFormScore.toFixed(1)}%
            - Average Height: ${jumpStats.avgHeight.toFixed(0)}px
            - Max Height: ${jumpStats.maxHeight}px
            - Height Consistency: ${jumpStats.consistency.toFixed(1)}%
            - Landing Success Rate: ${jumpStats.landingSuccessRate.toFixed(1)}%
            - Power Trend: ${jumpStats.powerTrend}
            - Key Issues: ${jumpStats.commonIssues.join(', ') || 'none'}
            - Rep-by-rep data: ${JSON.stringify(detailedRepHistory)}
            
            Provide your expert jump training summary with specific recommendations.`
        };
    }

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

    if (exercise === 'jumps') {
        const jumpStats = analyzeJumpSession(repHistory);
        return {
            system: `${systemPrompt} You are answering a follow-up question about a jump training session. Use the detailed jump data to give a direct, concise answer (1-2 sentences) to the user's question. ${exerciseContext}`,
            user: `
            Jump Session Context:
            - Total Jumps: ${reps}
            - Average Form Score: ${averageFormScore.toFixed(1)}%
            - Jump Performance: Avg ${jumpStats.avgHeight.toFixed(0)}px, Max ${jumpStats.maxHeight}px
            - Landing Quality: ${jumpStats.landingSuccessRate.toFixed(1)}% success rate
            - Consistency: ${jumpStats.consistency.toFixed(1)}%
            - Power Trend: ${jumpStats.powerTrend}
            - Rep-by-rep data: ${JSON.stringify(detailedRepHistory)}

            User's Question: "${userQuestion}"
            
            Provide your expert answer focused on jump training.`
        };
    }

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

const analyzeJumpSession = (repHistory) => {
    const jumpDetails = repHistory
        .map(rep => rep.details)
        .filter(details => details && 'jumpHeight' in details);
    
    if (jumpDetails.length === 0) {
        return {
            avgHeight: 0,
            maxHeight: 0,
            consistency: 100,
            landingSuccessRate: 100,
            powerTrend: 'insufficient data',
            commonIssues: []
        };
    }

    const heights = jumpDetails.map(d => d.jumpHeight);
    const landings = jumpDetails.map(d => d.landingKneeFlexion);
    const powerScores = jumpDetails.map(d => d.powerScore || 50);
    
    const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;
    const maxHeight = Math.max(...heights);
    
    // Calculate height consistency (inverse of coefficient of variation)
    const heightVariance = heights.map(h => Math.pow(h - avgHeight, 2)).reduce((a, b) => a + b, 0) / heights.length;
    const consistency = Math.max(0, 100 - (Math.sqrt(heightVariance) / avgHeight) * 100);
    
    // Landing success rate (good landings < 160°)
    const goodLandings = landings.filter(angle => angle < 160).length;
    const landingSuccessRate = (goodLandings / landings.length) * 100;
    
    // Power trend analysis
    const firstHalf = powerScores.slice(0, Math.ceil(powerScores.length / 2));
    const secondHalf = powerScores.slice(Math.ceil(powerScores.length / 2));
    const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    let powerTrend;
    if (secondHalfAvg > firstHalfAvg + 5) powerTrend = 'improving';
    else if (secondHalfAvg < firstHalfAvg - 5) powerTrend = 'declining';
    else powerTrend = 'consistent';
    
    // Common issues analysis
    const issues = [];
    if (avgHeight < 40) issues.push('low jump height');
    if (landingSuccessRate < 70) issues.push('stiff landings');
    if (consistency < 70) issues.push('inconsistent height');
    if (firstHalfAvg > 70 && secondHalfAvg < 60) issues.push('fatigue impact');
    
    return {
        avgHeight,
        maxHeight,
        consistency,
        landingSuccessRate,
        powerTrend,
        commonIssues: issues
    };
};

// --- API HELPERS ---

const generateGeminiFeedback = async (body, apiKey) => {
    const { type = 'summary' } = body;
    const finalApiKey = apiKey || GEMINI_API_KEY;
    if (!finalApiKey) throw new Error("GEMINI_API_KEY is not set.");
    
    let promptData;
    if (type === 'feedback' && body.exercise === 'jumps') {
        promptData = getJumpFeedbackPrompt(body);
    } else if (type === 'summary') {
        promptData = getSummaryPrompt(body);
    } else {
        promptData = getChatPrompt(body);
    }
    
    const { system, user } = promptData;
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

    let promptData;
    if (type === 'feedback' && body.exercise === 'jumps') {
        promptData = getJumpFeedbackPrompt(body);
    } else if (type === 'summary') {
        promptData = getSummaryPrompt(body);
    } else {
        promptData = getChatPrompt(body);
    }
    
    const { system, user } = promptData;
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

    let promptData;
    if (type === 'feedback' && body.exercise === 'jumps') {
        promptData = getJumpFeedbackPrompt(body);
    } else if (type === 'summary') {
        promptData = getSummaryPrompt(body);
    } else {
        promptData = getChatPrompt(body);
    }
    
    const { system, user } = promptData;
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
    
    if (!['summary', 'chat', 'feedback'].includes(type)) {
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
