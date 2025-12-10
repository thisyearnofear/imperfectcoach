#!/bin/bash

# Deploy AI Coach Agent Lambda Function
# For AWS AI Agent Global Hackathon

set -e

echo "🤖 Deploying AI Coach Agent Lambda..."

# Configuration
FUNCTION_NAME="imperfect-coach-premium-analysis"
REGION="eu-north-1"
RUNTIME="nodejs18.x"
HANDLER="index.handler"
ROLE_NAME="lambda-bedrock-execution-role"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

echo -e "${BLUE}🔨 Bundling with esbuild...${NC}"
# Bundle everything into a single file, excluding AWS SDK (in runtime)
npx esbuild index.mjs \
  --bundle \
  --platform=node \
  --target=node18 \
  --outfile=dist/index.js \
  --external:@aws-sdk/* 

echo -e "${BLUE}🗜️  Creating deployment package...${NC}"
cd dist
zip -r ../agent-coach-lambda.zip index.js
cd ..

echo -e "${BLUE}☁️  Checking if Lambda function exists...${NC}"
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>/dev/null; then
    echo -e "${YELLOW}📝 Function exists, updating code...${NC}"
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://agent-coach-lambda.zip \
        --region $REGION
    
    echo -e "${BLUE}⚙️  Updating function configuration...${NC}"
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --timeout 60 \
        --memory-size 1024 \
        --region $REGION \
        --environment "Variables={AWS_REGION=$REGION,BEDROCK_MODEL_ID=amazon.nova-lite-v1:0}"
else
    echo -e "${YELLOW}🆕 Creating new Lambda function...${NC}"
    
    # Get or create IAM role
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"
    
    echo -e "${BLUE}🔐 Checking IAM role...${NC}"
    if ! aws iam get-role --role-name $ROLE_NAME 2>/dev/null; then
        echo -e "${YELLOW}Creating IAM role for Lambda...${NC}"
        
        # Create trust policy
        cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
        
        aws iam create-role \
            --role-name $ROLE_NAME \
            --assume-role-policy-document file:///tmp/trust-policy.json
        
        # Attach necessary policies
        aws iam attach-role-policy \
            --role-name $ROLE_NAME \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        
        # Create Bedrock access policy
        cat > /tmp/bedrock-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:Converse",
        "bedrock:ConverseStream",
        "bedrock:InvokeAgent",
        "bedrock-agent:InvokeAgent"
      ],
      "Resource": "*"
    }
  ]
}
EOF
        
        aws iam put-role-policy \
            --role-name $ROLE_NAME \
            --policy-name BedrockAccess \
            --policy-document file:///tmp/bedrock-policy.json
        
        echo -e "${YELLOW}⏳ Waiting 10 seconds for IAM role to propagate...${NC}"
        sleep 10
    fi
    
    # Create Lambda function
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --role $ROLE_ARN \
        --handler $HANDLER \
        --zip-file fileb://agent-coach-lambda.zip \
        --timeout 60 \
        --memory-size 1024 \
        --region $REGION \
        --environment "Variables={AWS_REGION=$REGION,BEDROCK_MODEL_ID=amazon.nova-lite-v1:0}"
fi

echo -e "${BLUE}🌐 Setting up API Gateway...${NC}"
API_NAME="imperfect-coach-agent-api"

# Check if API exists
API_ID=$(aws apigatewayv2 get-apis --region $REGION --query "Items[?Name=='$API_NAME'].ApiId" --output text)

if [ -z "$API_ID" ]; then
    echo -e "${YELLOW}Creating new API Gateway...${NC}"
    
    # Create HTTP API
    API_ID=$(aws apigatewayv2 create-api \
        --name $API_NAME \
        --protocol-type HTTP \
        --region $REGION \
        --query 'ApiId' \
        --output text)
    
    # Create integration
    INTEGRATION_ID=$(aws apigatewayv2 create-integration \
        --api-id $API_ID \
        --integration-type AWS_PROXY \
        --integration-uri "arn:aws:lambda:$REGION:$(aws sts get-caller-identity --query Account --output text):function:$FUNCTION_NAME" \
        --payload-format-version 2.0 \
        --region $REGION \
        --query 'IntegrationId' \
        --output text)
    
    # Create route
    aws apigatewayv2 create-route \
        --api-id $API_ID \
        --route-key 'POST /agent-coach' \
        --target "integrations/$INTEGRATION_ID" \
        --region $REGION
    
    # Create default stage
    aws apigatewayv2 create-stage \
        --api-id $API_ID \
        --stage-name '$default' \
        --auto-deploy \
        --region $REGION
    
    # Grant API Gateway permission to invoke Lambda
    aws lambda add-permission \
        --function-name $FUNCTION_NAME \
        --statement-id apigateway-invoke \
        --action lambda:InvokeFunction \
        --principal apigateway.amazonaws.com \
        --source-arn "arn:aws:execute-api:$REGION:$(aws sts get-caller-identity --query Account --output text):$API_ID/*/*" \
        --region $REGION
fi

# Get API endpoint
API_ENDPOINT=$(aws apigatewayv2 get-api --api-id $API_ID --region $REGION --query 'ApiEndpoint' --output text)

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${GREEN}📡 API Endpoint:${NC}"
echo -e "   ${BLUE}${API_ENDPOINT}/agent-coach${NC}"
echo ""
echo -e "${GREEN}🧪 Test with:${NC}"
echo -e "   ${BLUE}curl -X POST ${API_ENDPOINT}/agent-coach \\${NC}"
echo -e "   ${BLUE}  -H 'Content-Type: application/json' \\${NC}"
echo -e "   ${BLUE}  -d '{\"workoutData\": {\"exercise\":\"pullups\",\"reps\":12,\"formScore\":78,\"poseData\":{}}}'${NC}"
echo ""
echo -e "${YELLOW}💡 Update your frontend AgentCoachUpsell.tsx with this endpoint!${NC}"

# Clean up
rm -f agent-coach-lambda.zip
rm -f /tmp/trust-policy.json /tmp/bedrock-policy.json /tmp/bedrock-agent-policy.json

echo -e "${GREEN}🎉 Ready for AWS AI Agent Hackathon!${NC}"
