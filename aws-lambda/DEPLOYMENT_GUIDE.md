# AWS Lambda Deployment Guide - Premium Analysis with x402 Payment

## Overview

This guide will help you deploy the enhanced AWS Lambda function that implements real x402 payment verification and settlement through CDP facilitator.

## Prerequisites

1. **AWS Account** with Lambda and Bedrock access
2. **CDP Account** with API keys from https://portal.cdp.coinbase.com/
3. **RevenueSplitter Contract** deployed on Base Sepolia
4. **AWS CLI** configured with appropriate permissions
5. **Base Sepolia testnet ETH** for CDP wallet operations

## Step 1: Set Up CDP API Keys

### Get CDP Wallet Secret (v2 API)

1. Go to https://portal.cdp.coinbase.com/
2. Create a new project or select existing
3. Generate a **Wallet Secret** (v2 API uses single secret authentication)
4. Copy the wallet secret string (no JSON file needed for v2)

### Fund Your CDP Wallets (Base Sepolia)

Your Lambda will create wallets automatically, but they need testnet ETH for gas:

1. Get Base Sepolia ETH from https://coinbase.com/faucets/base-ethereum-sepolia-faucet
2. The Lambda will log wallet addresses on first run
3. Send some testnet ETH to each wallet address

## Step 2: Prepare the Lambda Package

```bash
# Create deployment package
cd aws-lambda
npm install

# Create deployment zip
zip -r premium-analysis-lambda.zip premium-analysis-handler.js node_modules/ package.json
```

## Step 2: Deploy to AWS Lambda

### Option A: AWS CLI Deployment

```bash
# Update existing Lambda function
aws lambda update-function-code \
  --function-name imperfect-coach-premium-analysis \
  --zip-file fileb://premium-analysis-lambda.zip \
  --region eu-north-1

# Update environment variables
aws lambda update-function-configuration \
  --function-name imperfect-coach-premium-analysis \
  --environment Variables='{
    "FACILITATOR_URL":"https://facilitator.cdp.coinbase.com",
    "REVENUE_SPLITTER_ADDRESS":"0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA",
    "BEDROCK_ENABLED":"true",
    "NODE_ENV":"production",
    "CDP_WALLET_SECRET":"your_wallet_secret_here"
  }' \
  --region eu-north-1
```

### Option B: AWS Console Deployment

1. Go to AWS Lambda Console
2. Find your `imperfect-coach-premium-analysis` function
3. Upload the `premium-analysis-lambda.zip` file
4. Set environment variables:
   - `FACILITATOR_URL`: `https://facilitator.cdp.coinbase.com`
   - `REVENUE_SPLITTER_ADDRESS`: `0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA`
   - `BEDROCK_ENABLED`: `true`
   - `NODE_ENV`: `production`

## Step 3: Configure API Gateway CORS

Ensure your API Gateway has proper CORS configuration:

```json
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Payment, X-Payment-Response",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
}
```

## Step 4: Test the Integration

### ✅ Integration Test Results (Verified Working)

**Latest Test Run - SUCCESS!**

```
Function Logs:
✅ CDP SDK v2 CdpClient initialized for autonomous treasury management
🧪 Running account creation test...
🧪 Testing CDP account creation...
🏛️ Creating treasury account...
✅ Treasury account created: 0x7011910452cA4ab9e5c3047aA4a25297C144158a
🎁 Creating user rewards account...
✅ User rewards account created: 0x16FF42346F2E24C869ea305e8318BC3229815c11
🤝 Creating referrer account...
✅ Referrer account created: 0xF9468bd2D62E933ADbaD715D8da18c54f70dd94F

Response Body:
"statusCode": 200
"success": true
"message": "All accounts created successfully!"
```

### Manual Test Commands

#### Test 1: OPTIONS Request (CORS Preflight)

```bash
curl -X OPTIONS \
  https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: X-Payment"
```

Expected: 200 OK with CORS headers

#### Test 2: POST Without Payment (Should return 402)

```bash
curl -X POST \
  https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout \
  -H "Content-Type: application/json" \
  -d '{"exercise":"pullup","reps":5,"averageFormScore":85}'
```

Expected: 402 Payment Required with x402 challenge

#### Test 3: Run Automated Integration Test

```bash
cd aws-lambda
node test-integration.js
```

#### Test 4: Full Integration Test

Use your frontend to test the complete payment flow.

## Step 5: Monitor and Debug

### CloudWatch Logs

Monitor your Lambda function logs in CloudWatch:

- Look for payment verification/settlement logs
- Check Bedrock API calls
- Monitor error rates

### Key Log Messages to Watch For:

- `🚀 Premium Analysis Lambda - Event received`
- `💳 Payment header found, verifying and settling...`
- `✅ Payment verified and settled successfully`
- `🧠 Processing Bedrock analysis...`
- `✅ Bedrock analysis completed`

## Step 6: Frontend Environment Variables

Ensure your frontend has the CDP credentials:

```env
# .env.local or Netlify environment variables
VITE_COINBASE_PROJECT_ID=your_project_id
VITE_COINBASE_API_KEY_ID=your_api_key_id
VITE_COINBASE_CLIENT_API_KEY=your_client_api_key
VITE_COINBASE_API_KEY_SECRET=your_api_key_secret
```

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure all headers are properly configured
2. **Payment Verification Fails**: Check facilitator URL and network connectivity
3. **Bedrock Access Denied**: Verify IAM permissions for Bedrock
4. **Transaction Not Tracked**: Check CDP credentials in frontend

### Debug Steps:

1. Check CloudWatch logs for detailed error messages
2. Test each component separately (CORS, payment, Bedrock)
3. Verify contract address and network configuration
4. Test with Base Sepolia testnet first

## Success Criteria

✅ OPTIONS requests return proper CORS headers  
✅ POST without payment returns 402 with x402 challenge  
✅ POST with valid payment processes successfully  
✅ Bedrock analysis is generated and returned  
✅ Payment transactions are tracked in CDP manager  
✅ Revenue flows to RevenueSplitter contract

## Next Steps

After successful deployment:

1. Test the complete user flow from frontend
2. Monitor payment success rates
3. Verify revenue distribution in RevenueSplitter contract
4. Set up alerts for failed payments or API errors

This completes your CDP wallet + x402 integration for the hackathon's "Best Use of x402pay + CDP Wallet" category!
