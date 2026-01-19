#!/bin/bash

# Deploy Autonomous Agent Core Lambda
# Targeted at: imperfect-coach-agent-core

set -e

echo "🤖 Deploying Agent Core..."

# Configuration
FUNCTION_NAME="imperfect-coach-agent-core"
REGION="eu-north-1"
HANDLER="agent-coach.handler"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📦 Using pre-built agent-coach.js...${NC}"
# Copy the pre-built file to the expected name
cp dist/agent-coach.js dist/agent-core.js 

echo -e "${BLUE}🗜️  Zipping...${NC}"
cd dist
zip -r ../agent-core-lambda.zip agent-core.js
cd ..

echo -e "${BLUE}☁️  Deploying to $FUNCTION_NAME...${NC}"

# Check if function exists first
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>/dev/null; then
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://agent-core-lambda.zip \
        --region $REGION

    echo -e "${BLUE}⚙️  Updating configuration (Timeout=60s, Privacy features enabled)...${NC}"
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --timeout 60 \
        --environment "Variables={BEDROCK_MODEL_ID=amazon.nova-lite-v1:0,PRIVACY_FEATURES_ENABLED=true}" \
        --region $REGION
else
    echo -e "${YELLOW}🆕 Creating new Lambda function with privacy features...${NC}"

    # Get or create IAM role
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ROLE_NAME="lambda-bedrock-execution-role"
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

    # Create Lambda function with privacy configuration
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime nodejs18.x \
        --role $ROLE_ARN \
        --handler $HANDLER \
        --zip-file fileb://agent-core-lambda.zip \
        --timeout 60 \
        --memory-size 1024 \
        --region $REGION \
        --environment "Variables={BEDROCK_MODEL_ID=amazon.nova-lite-v1:0,PRIVACY_FEATURES_ENABLED=true}"
fi

# Cleanup
rm agent-core-lambda.zip

echo -e "${GREEN}✅ Core Agent Deployed!${NC}"
echo -e "${BLUE}⚠️  Don't forget to set AGENT_PRIVATE_KEY and CX0_API_KEY env vars in Console!${NC}"
