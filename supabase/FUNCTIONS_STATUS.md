# Supabase Functions Status

**Updated: December 2025**

This document outlines the current status and architecture of Supabase Edge Functions in the Imperfect Coach platform.

## 📋 Function Overview

| Function | Status | Purpose | Deployment |
|----------|--------|---------|------------|
| **coach-gemini** | ✅ Active | Real-time AI coaching feedback | Production |
| **premium-analysis** | 🔄 Redirect | Service info & AWS redirect | Updated |

## 🤖 coach-gemini Function

**Status:** Active and operational
**Purpose:** Real-time AI coaching feedback during workouts
**Endpoint:** `https://bolosphrmagsddyppziz.supabase.co/functions/v1/coach-gemini`

### Features:
- **Multi-AI Support:** Integrates with Gemini, OpenAI, and Anthropic
- **Coach Personalities:** Competitive, Supportive, Zen coaching styles
- **Exercise-Specific:** Tailored feedback for pull-ups and jumps
- **Fallback System:** Provides helpful feedback when AI services are down
- **Real-time Analysis:** Sub-4-second response times

### Request Types:
- `feedback` - Real-time rep-by-rep coaching
- `summary` - Post-workout session analysis  
- `chat` - Interactive Q&A with AI coach

### Configuration:
```toml
[functions.coach-gemini]
verify_jwt = false
```

## 🔄 premium-analysis Function  

**Status:** Updated to redirect to AWS Lambda
**Purpose:** Service information and redirect to AWS Lambda
**Endpoint:** `https://bolosphrmagsddyppziz.supabase.co/functions/v1/premium-analysis`

### Current Behavior:
- **GET requests:** Returns service information about premium analysis
- **POST requests:** Returns redirect (308) to AWS Lambda endpoint
- **No longer proxies:** Direct AWS Lambda calls for better performance

### AWS Lambda Details:
- **Function:** `imperfect-coach-premium-analysis`
- **Region:** `eu-north-1` (Stockholm)
- **Model:** Amazon Nova Lite (`amazon.nova-lite-v1:0`)
- **Endpoint:** `https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout`

## 🏗️ Architecture Decision

### Why the Split?

1. **Real-time vs. Deep Analysis:**
   - Supabase Edge Functions: Perfect for real-time, lightweight AI coaching
   - AWS Lambda + Bedrock: Optimal for compute-intensive deep analysis

2. **Performance Benefits:**
   - Coach feedback: <4 seconds via Supabase
   - Premium analysis: ~3 seconds via direct AWS Lambda
   - No proxy overhead for premium analysis

3. **Cost Optimization:**
   - Supabase: Free tier covers real-time coaching needs
   - AWS: Pay-per-use for premium analysis with Bedrock

## 🚀 Deployment Commands

### Deploy coach-gemini:
```bash
supabase functions deploy coach-gemini
```

### Deploy premium-analysis:
```bash
supabase functions deploy premium-analysis
```

### View logs:
```bash
# Note: Requires Docker for local deployment
# Functions are deployed directly via Supabase dashboard
```

## 🔧 Environment Variables

Required secrets in Supabase:
- `GEMINI_API_KEY` - Google Gemini API key
- `OPENAI_API_KEY` - OpenAI API key  
- `ANTHROPIC_API_KEY` - Anthropic Claude API key

## 📊 Current Usage

### coach-gemini:
- Used for all real-time workout feedback
- Handles multiple concurrent users
- Provides fallback when AI services are down

### premium-analysis:
- Provides service information
- Redirects to AWS Lambda for actual processing
- Maintains CORS compatibility

## 🔄 Future Considerations

1. **Potential Consolidation:** Could migrate coach-gemini to AWS Lambda if scaling needs require it
2. **Enhanced Features:** Could add more AI models or coaching personalities
3. **Performance Monitoring:** Consider implementing detailed analytics for both functions

## 🎯 Integration Points

### Frontend Integration:
- **Real-time coaching:** Calls Supabase coach-gemini directly
- **Premium analysis:** Calls AWS Lambda directly (no Supabase proxy)
- **Error handling:** Comprehensive fallbacks for both services

### Authentication:
- Both functions run without JWT verification
- Security handled at application level via wallet connections

This architecture provides optimal performance, cost efficiency, and maintainability for the Imperfect Coach platform.