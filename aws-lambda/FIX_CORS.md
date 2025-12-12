# Fixing CORS Issues in AWS API Gateway

## The Problem

Your frontend at `https://imperfectcoach.netlify.app` is getting blocked by CORS when calling:
```
https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout
```

Error: `Response to preflight request doesn't pass access control check: It does not have HTTP ok status.`

## Root Cause

Even though your Lambda function has proper CORS headers, **API Gateway** itself needs to be configured to:
1. Allow OPTIONS (preflight) requests to pass through
2. Return proper CORS headers on the preflight response

## Solution Options

### Option 1: AWS Console (Quick Fix)

1. **Go to AWS API Gateway Console**
   - Navigate to: https://console.aws.amazon.com/apigateway
   - Select your API: `viaqmsudab`

2. **Enable CORS for each endpoint**
   - Click on `/analyze-workout` resource
   - Click "Actions" → "Enable CORS"
   - Configure:
     - Access-Control-Allow-Origin: `*`
     - Access-Control-Allow-Headers: `Content-Type,X-Payment,X-Chain,X-Signature`
     - Access-Control-Allow-Methods: `OPTIONS,POST`
   - Click "Enable CORS and replace existing CORS headers"

3. **Deploy the API**
   - Click "Actions" → "Deploy API"
   - Choose your stage (e.g., `prod` or `default`)
   - Click "Deploy"

### Option 2: AWS CLI (Recommended for Automation)

Run these commands:

```bash
# Set variables
API_ID="viaqmsudab"
REGION="eu-north-1"

# For each resource path that needs CORS, run:
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id <resource-id> \
  --http-method OPTIONS \
  --authorization-type NONE \
  --region $REGION

# Add OPTIONS mock integration
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id <resource-id> \
  --http-method OPTIONS \
  --type MOCK \
  --request-templates '{"application/json": "{\"statusCode\": 200}"}' \
  --region $REGION

# Add integration response with CORS headers
aws apigateway put-integration-response \
  --rest-api-id $API_ID \
  --resource-id <resource-id> \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters '{
    "method.response.header.Access-Control-Allow-Origin": "'\''*'\''",
    "method.response.header.Access-Control-Allow-Headers": "'\''Content-Type,X-Payment,X-Chain,X-Signature'\''",
    "method.response.header.Access-Control-Allow-Methods": "'\''OPTIONS,POST'\''"
  }' \
  --region $REGION

# Add method response
aws apigateway put-method-response \
  --rest-api-id $API_ID \
  --resource-id <resource-id> \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters '{
    "method.response.header.Access-Control-Allow-Origin": true,
    "method.response.header.Access-Control-Allow-Headers": true,
    "method.response.header.Access-Control-Allow-Methods": true
  }' \
  --region $REGION

# Redeploy the API
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --region $REGION
```

### Option 3: HTTP API (Simpler Alternative)

If your current API is a REST API, consider migrating to **HTTP API** which has simpler CORS configuration:

```bash
aws apigatewayv2 update-api \
  --api-id $API_ID \
  --cors-configuration '{
    "AllowOrigins": ["*"],
    "AllowMethods": ["POST", "OPTIONS"],
    "AllowHeaders": ["Content-Type", "X-Payment", "X-Chain", "X-Signature"],
    "MaxAge": 86400
  }' \
  --region $REGION
```

## Verification

After applying the fix, test with:

```bash
curl -X OPTIONS \
  https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout \
  -H "Origin: https://imperfectcoach.netlify.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,X-Payment,X-Chain" \
  -v
```

You should see these headers in the response:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: OPTIONS,POST
Access-Control-Allow-Headers: Content-Type,X-Payment,X-Chain,X-Signature
```

## Additional Notes

### Lambda Code (Already Correct)

Your Lambda already has CORS headers set up correctly:

```javascript
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, X-Payment, X-Chain, X-Signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Handle CORS preflight
if (event.httpMethod === "OPTIONS") {
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: "",
  };
}
```

The issue is that API Gateway's **proxy integration** mode may not be passing OPTIONS requests to Lambda. The fix is to either:
1. Configure API Gateway to handle OPTIONS directly (above solutions)
2. Or ensure the API Gateway integration is set to pass ALL methods to Lambda

### For Lambda Function URL (Alternative)

If you don't need API Gateway features, you can use Lambda Function URL with built-in CORS:

```bash
aws lambda create-function-url-config \
  --function-name <your-function-name> \
  --auth-type NONE \
  --cors '{
    "AllowOrigins": ["*"],
    "AllowMethods": ["POST", "OPTIONS"],
    "AllowHeaders": ["Content-Type", "X-Payment", "X-Chain", "X-Signature"]
  }' \
  --region eu-north-1
```
