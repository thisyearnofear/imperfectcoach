# AWS Lambda Deployment Guide - AI Coaches

## Overview
This guide covers deploying two AWS Lambda functions for the Imperfect Coach platform:
- **SNEL 🐌** - Basic AI coaching (free tier)
- **STEDDIE 🐢** - Premium analysis (paid tier)

## Prerequisites

1. **AWS CLI** configured with appropriate permissions
2. **Node.js 18+** installed
3. **AWS Bedrock** access to Nova models in `eu-north-1` region
4. **API Gateway** for HTTP endpoints

## Function Specifications

### SNEL 🐌 Basic Coach
- **Model**: `amazon.nova-micro-v1:0` (cheapest)
- **Purpose**: Quick feedback, basic tips
- **Response**: 1-2 sentences, under 80 characters
- **Cost**: Minimal token usage

### STEDDIE 🐢 Premium Analysis  
- **Model**: `amazon.nova-lite-v1:0` (detailed analysis)
- **Purpose**: Comprehensive workout analysis
- **Response**: Detailed report with scores and recommendations
- **Cost**: $0.25 per analysis (x402 payments)

## Deployment Steps

### 1. Create Lambda Functions

#### SNEL Basic Coach Function

```bash
# Create the function
aws lambda create-function \
  --function-name snel-basic-coach \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://snel-basic-coach.zip \
  --timeout 30 \
  --memory-size 256 \
  --region eu-north-1
```

#### STEDDIE Premium Analysis Function

```bash
# Create the function  
aws lambda create-function \
  --function-name steddie-premium-analysis \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://steddie-premium-analysis.zip \
  --timeout 30 \
  --memory-size 512 \
  --region eu-north-1
```

### 2. Package Functions

For each function directory:

```bash
# Navigate to function directory
cd aws-lambda/snel-basic-coach

# Install dependencies (if any)
npm install

# Create deployment package
zip -r ../snel-basic-coach.zip .

# Repeat for STEDDIE
cd ../steddie-premium-analysis
zip -r ../steddie-premium-analysis.zip .
```

### 3. IAM Role Requirements

Your Lambda execution role needs these permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream", 
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:*:*:*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel"
            ],
            "Resource": [
                "arn:aws:bedrock:eu-north-1::foundation-model/amazon.nova-micro-v1:0",
                "arn:aws:bedrock:eu-north-1::foundation-model/amazon.nova-lite-v1:0"
            ]
        }
    ]
}
```

### 4. API Gateway Setup

#### SNEL Basic Coach API
```bash
# Create API
aws apigateway create-rest-api \
  --name snel-basic-coach-api \
  --region eu-north-1

# Create resource and method
# Add CORS headers
# Deploy to stage
```

#### STEDDIE Premium Analysis API
```bash
# Update existing API Gateway
# The premium analysis should use your existing endpoint:
# https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout
```

### 5. Environment Variables

No environment variables needed - functions use Bedrock service credentials from IAM role.

### 6. Update Frontend Configuration

Update the AWS endpoint in your React app:

```typescript
// In src/hooks/useAWSAIFeedback.ts
const SNEL_ENDPOINT = "https://YOUR_NEW_API_ID.execute-api.eu-north-1.amazonaws.com/snel-basic-coach";
const STEDDIE_ENDPOINT = "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout";
```

## Testing

### Test SNEL Basic Coach
```bash
curl -X POST 'https://YOUR_API_ID.execute-api.eu-north-1.amazonaws.com/snel-basic-coach' \
  -H 'Content-Type: application/json' \
  -d '{
    "exercise": "pull-ups",
    "reps": 5,
    "averageFormScore": 85,
    "personality": "supportive"
  }'
```

Expected response:
```json
{
  "coach": "SNEL",
  "emoji": "🐌", 
  "tier": "basic",
  "feedback": "Great effort! Pull with your back muscles. 🐌"
}
```

### Test STEDDIE Premium Analysis
```bash
curl -X POST 'https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout' \
  -H 'Content-Type: application/json' \
  -d '{
    "exercise": "pull-ups",
    "reps": 5,
    "averageFormScore": 85,
    "duration": 120,
    "repHistory": []
  }'
```

Expected response:
```json
{
  "coach": "STEDDIE",
  "emoji": "🐢",
  "tier": "premium", 
  "analysis": "### STEDDIE Deep Dive Analysis: Pull-Ups Performance..."
}
```

## Cost Optimization

### SNEL 🐌 Basic Coach
- Use minimal token limits (50 tokens max)
- Implement aggressive caching
- Use Nova Micro (cheapest model)
- Estimated cost: ~$0.001 per request

### STEDDIE 🐢 Premium Analysis
- Use Nova Lite for quality analysis
- Charge $0.25 per analysis via x402
- Estimated cost: ~$0.02 per analysis
- Profit margin: ~$0.23 per analysis

## Monitoring

### CloudWatch Metrics to Monitor
- **Invocation Count**: Track usage patterns
- **Duration**: Optimize timeout settings
- **Error Rate**: Monitor for failures
- **Cost**: Track Bedrock API usage

### Recommended Alarms
- Error rate > 5%
- Average duration > 20 seconds
- Daily cost > expected threshold

## Troubleshooting

### Common Issues

1. **"Access Denied" errors**
   - Check IAM role has Bedrock permissions
   - Verify model access in Bedrock console

2. **Timeout errors**
   - Increase Lambda timeout (current: 30s)
   - Check Bedrock API response times

3. **CORS errors**
   - Verify API Gateway CORS configuration
   - Check header handling in Lambda

4. **Invalid model responses**
   - Verify model IDs match Bedrock available models
   - Check payload format for Nova models

### Logs Location
```bash
# View SNEL logs
aws logs tail /aws/lambda/snel-basic-coach --follow

# View STEDDIE logs  
aws logs tail /aws/lambda/steddie-premium-analysis --follow
```

## Security Considerations

1. **API Rate Limiting**: Implement per-user limits
2. **Input Validation**: Sanitize all user inputs
3. **Error Handling**: Don't expose internal errors
4. **Payment Verification**: Validate x402 payments properly

## Next Steps

1. Deploy both functions to AWS
2. Update frontend endpoints
3. Test integration end-to-end
4. Monitor costs and performance
5. Implement rate limiting
6. Add comprehensive error handling

## Support

For issues:
1. Check CloudWatch logs first
2. Verify Bedrock model availability  
3. Test Lambda functions individually
4. Check API Gateway configuration

Both coaches (SNEL 🐌 and STEDDIE 🐢) should provide reliable, cost-effective AI coaching for your fitness platform!