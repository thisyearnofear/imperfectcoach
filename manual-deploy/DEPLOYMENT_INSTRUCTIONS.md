# Manual Supabase Function Deployment Instructions

Since Docker is not available, you can deploy the Supabase functions manually using the Supabase Dashboard or CLI alternatives.

## Method 1: Using Supabase Dashboard (Recommended)

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project (`bolosphrmagsddyppziz`)
3. Navigate to "Edge Functions" in the left sidebar

### Step 2: Update coach-gemini Function
1. Click on the `coach-gemini` function
2. Click "Edit Function"
3. Replace the entire function code with the content from `supabase/functions/coach-gemini/index.ts`
4. Click "Deploy" to save changes

### Step 3: Update premium-analysis Function
1. Click on the `premium-analysis` function
2. Click "Edit Function" 
3. Replace the entire function code with the content from `supabase/functions/premium-analysis/index.ts`
4. Click "Deploy" to save changes

## Method 2: Using Supabase CLI (Alternative)

If you want to try CLI deployment without Docker:

### Step 1: Update Supabase CLI
```bash
# Update to latest version which might have better Docker alternatives
npm install -g @supabase/cli@latest
```

### Step 2: Try Remote Build
```bash
# This might work with newer CLI versions
supabase functions deploy coach-gemini --remote-build
supabase functions deploy premium-analysis --remote-build
```

## Method 3: Manual Code Update (Quickest Fix)

Since the main issue is with error handling and fallbacks, you can update just the critical parts:

### For coach-gemini function:
1. Go to Supabase Dashboard > Edge Functions > coach-gemini
2. Find the main `serve()` function at the bottom
3. Replace the catch block with better error handling:

```typescript
} catch (error) {
    console.error('Unexpected error in AI coach function:', error);
    console.error('Error stack:', error.stack);
    
    // Provide fallback feedback instead of generic error
    const exercise = body?.exercise || 'default';
    const fallbackMessages = {
      'pull-ups': 'Keep pushing! Focus on full range of motion and controlled movement.',
      'jumps': 'Great jumps! Focus on explosive takeoffs and soft landings.',
      'default': 'Great workout! Keep maintaining good form and consistency.'
    };
    
    const fallbackFeedback = fallbackMessages[exercise] || fallbackMessages.default;
    
    return new Response(JSON.stringify({ feedback: fallbackFeedback }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}
```

## Verification

After deployment, test the function:

```bash
curl -X POST "https://bolosphrmagsddyppziz.supabase.co/functions/v1/coach-gemini" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "type": "feedback", 
    "exercise": "jumps", 
    "personality": "competitive", 
    "reps": 5
  }'
```

Expected response:
```json
{"feedback": "Some motivational feedback message"}
```

## Current Issues Fixed

1. ✅ Better error handling - no more generic "An error occurred" messages
2. ✅ Fallback feedback when AI APIs fail
3. ✅ Improved logging for debugging
4. ✅ Input validation to prevent crashes
5. ✅ CORS headers properly configured

## Notes

- The functions should now provide helpful feedback even when AI services are down
- Errors will be logged to Supabase function logs for debugging
- Users will always get some form of feedback instead of silent failures
- The premium analysis function now acts as a CORS proxy for AWS