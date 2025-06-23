# Bedrock Analysis Debug Guide

## Issue: AWS Lambda returning 500 error for premium analysis

The current error indicates the AWS Lambda function is failing when processing the Bedrock analysis request.

## Quick Diagnosis Steps

### 1. Test AWS Lambda Function Directly

Test your Lambda function directly in AWS Console:

```json
{
  "httpMethod": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": "{\"exercise\":\"jumps\",\"reps\":5,\"averageFormScore\":85,\"repHistory\":[{\"score\":90},{\"score\":80},{\"score\":85}]}"
}
```

### 2. Check Lambda Execution Role Permissions

Your Lambda function needs these IAM permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0",
        "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-lite-v1:0"
      ]
    }
  ]
}
```

### 3. Simplified Test Lambda Function

Create a minimal test version of your Lambda function:

```javascript
export const handler = async (event) => {
  console.log('Received event:', JSON.stringify(event));
  
  try {
    // Skip payment verification for testing
    console.log('Skipping payment verification for test');
    
    // Simple mock analysis instead of Bedrock
    const mockAnalysis = {
      analysis: "Great workout! Your jump form shows good explosive power and landing technique. Focus on maintaining consistent height across all reps.",
      score: 85,
      recommendations: [
        "Maintain knee bend on landing",
        "Focus on explosive takeoff",
        "Keep consistent jump height"
      ]
    };
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(mockAnalysis)
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};
```

### 4. Check CloudWatch Logs

1. Go to AWS CloudWatch
2. Navigate to Log Groups
3. Find your Lambda function's log group
4. Check the latest log stream for error details

### 5. Common Bedrock Issues

**Model Not Available:**
- Ensure the model is available in your region (us-east-1)
- Check if you need to request access to the model

**Payload Issues:**
- Bedrock expects specific payload format
- Claude-3 Haiku expects this format:

```json
{
  "anthropic_version": "bedrock-2023-05-31",
  "max_tokens": 2048,
  "messages": [
    {
      "role": "user",
      "content": "Your prompt here"
    }
  ]
}
```

### 6. Quick Fix: Temporary Mock Response

Update your current Lambda to return a mock response for testing:

```javascript
// Add this at the top of your handler function
if (process.env.NODE_ENV === 'development' || !process.env.BEDROCK_ENABLED) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'x-payment-response': 'mock-payment-success'
    },
    body: JSON.stringify({
      analysis: `Excellent ${workoutData.exercise} session! You completed ${workoutData.reps} reps with an average form score of ${workoutData.averageFormScore}%. Your technique shows good consistency and power development. Focus on maintaining this level of performance while working on explosive power during takeoff.`,
      score: Math.round(workoutData.averageFormScore),
      recommendations: [
        "Continue focusing on landing technique",
        "Work on explosive power development", 
        "Maintain consistent form across all reps"
      ]
    })
  };
}
```

### 7. Enable Bedrock Gradually

Once the mock version works:

1. **Test Bedrock Access:** Create a simple test that just calls Bedrock with a basic prompt
2. **Add Payment Verification:** Integrate x402 payment validation
3. **Full Integration:** Combine both features

### 8. Environment Variables to Set

In your Lambda function:

```
BEDROCK_ENABLED=false  // Set to true when ready
NODE_ENV=development   // For testing
AWS_REGION=us-east-1   // Or your preferred region
```

## Next Steps

1. Deploy the simplified mock version first
2. Test the payment flow without Bedrock
3. Once that works, gradually add Bedrock integration
4. Monitor CloudWatch logs throughout the process

This approach ensures the payment and UI flow works while we debug the Bedrock integration separately.