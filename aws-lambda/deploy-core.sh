#!/bin/bash

# Deploy Autonomous Agent Core Lambda
# Targeted at: imperfect-coach-agent-core

set -e

echo "🤖 Deploying Agent Core..."

# Configuration
FUNCTION_NAME="imperfect-coach-agent-core"
REGION="eu-north-1"
HANDLER="agent-coach-handler.handler"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📦 Bundling agent-coach-handler.mjs...${NC}"
# Bundle with esbuild
npx esbuild agent-coach-handler.mjs \
  --bundle \
  --platform=node \
  --target=node18 \
  --outfile=dist/agent-core.js \
  --external:@aws-sdk/* 

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
        
    echo -e "${BLUE}⚙️  Updating configuration (Timeout=60s)...${NC}"
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --timeout 60 \
        --region $REGION
else
    echo "⚠️ Function $FUNCTION_NAME not found. Please create it first or check the name."
fi

# Cleanup
rm agent-core-lambda.zip

echo -e "${GREEN}✅ Core Agent Deployed!${NC}"
echo -e "${BLUE}⚠️  Don't forget to set AGENT_PRIVATE_KEY and CX0_API_KEY env vars in Console!${NC}"
