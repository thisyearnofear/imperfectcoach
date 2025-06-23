# Coach Gemini Function - Node.js Version

## Overview
This function provides AI coaching feedback using Gemini, OpenAI, and Anthropic APIs. It has been converted from Deno to Node.js to match the premium analysis function architecture.

## Deployment Instructions

### 1. Update Supabase Function to Node.js

Since this function has been converted from Deno to Node.js, you need to deploy it properly:

```bash
# Navigate to the function directory
cd supabase/functions/coach-gemini

# Deploy the function (this will use the new Node.js version)
supabase functions deploy coach-gemini
```

### 2. Verify Environment Variables

Ensure these secrets are set in your Supabase project:

```bash
supabase secrets list
```

Required secrets:
- `GEMINI_API_KEY` - Your Google Gemini API key
- `OPENAI_API_KEY` - Your OpenAI API key  
- `ANTHROPIC_API_KEY` - Your Anthropic API key

If any are missing, set them:

```bash
supabase secrets set GEMINI_API_KEY=your_key_here
supabase secrets set OPENAI_API_KEY=your_key_here
supabase secrets set ANTHROPIC_API_KEY=your_key_here
```

### 3. Test the Function

Test with a simple request:

```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/coach-gemini' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gemini",
    "type": "feedback", 
    "exercise": "pull-ups",
    "reps": 5,
    "averageFormScore": 85,
    "personality": "supportive"
  }'
```

Expected response:
```json
{
  "feedback": "Great form! Focus on controlled descent and full range of motion."
}
```

## Function Features

### Supported Models
- **Gemini** (default) - Google's Gemini 1.5 Flash
- **OpenAI** - GPT-3.5 Turbo  
- **Anthropic** - Claude 3 Haiku

### Personality Modes
- **Competitive** - Motivational and performance-focused
- **Supportive** - Encouraging and positive
- **Zen** - Calm and mindful

### Request Types
- **feedback** - Real-time coaching during workouts
- **summary** - Post-workout performance analysis
- **chat** - Q&A about fitness and form

### Fallback System
If AI APIs fail, the function automatically provides intelligent fallback responses based on:
- Exercise type (pull-ups vs jumps)
- Performance metrics
- User's form score

## Request Format

```json
{
  "model": "gemini|openai|anthropic",
  "type": "feedback|summary|chat", 
  "exercise": "pull-ups|jumps",
  "reps": 5,
  "averageFormScore": 85,
  "personality": "competitive|supportive|zen",
  "userApiKeys": {
    "gemini": "optional_user_key",
    "openai": "optional_user_key", 
    "anthropic": "optional_user_key"
  }
}
```

## Response Format

```json
{
  "feedback": "AI-generated coaching feedback",
  "error": "Optional error message if fallback used"
}
```

## Troubleshooting

### Function Returns 500 Error
1. Check that environment variables are set correctly
2. Verify the function deployed successfully
3. Check function logs in Supabase dashboard

### AI APIs Not Working
The function includes comprehensive fallback responses, so it should always return useful feedback even if AI APIs fail.

### CORS Issues
The function includes proper CORS headers for web app integration.

## Migration Notes

This function was migrated from Deno to Node.js to:
- Match the architecture of the premium analysis function
- Improve reliability and deployment consistency
- Simplify the codebase maintenance

The original Deno version is preserved as `index-original.ts` for reference.