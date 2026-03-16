#!/bin/bash

# Deploy AI coach Lambda endpoint (Venice default, Gemini fallback)

set -e

FUNCTION_NAME="imperfect-coach-ai-coach"
API_NAME="${API_NAME:-ImperfectCoachPremiumAPI}"
API_ID_OVERRIDE="${API_ID:-}"
ROUTE_PATH="/coach-gemini"
REGION="${AWS_REGION:-eu-north-1}"
RUNTIME="nodejs18.x"
HANDLER="coach-gemini-handler.handler"
ROLE_NAME="lambda-basic-execution-role"
ROLE_ARN="${LAMBDA_ROLE_ARN:-}"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🤖 Deploying AI coach Lambda (${FUNCTION_NAME})...${NC}"

echo -e "${BLUE}🔨 Bundling coach-gemini handler...${NC}"
npx esbuild src/handlers/coach-gemini-handler.mjs \
  --bundle \
  --platform=node \
  --target=node18 \
  --format=esm \
  '--external:@aws-sdk/*' \
  --outfile=dist/coach-gemini-handler.mjs

echo -e "${BLUE}🗜️  Creating deployment package...${NC}"
cd dist
zip -r ../coach-gemini-lambda.zip coach-gemini-handler.mjs
cd ..

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

if [ -z "$ROLE_ARN" ]; then
  ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"
fi

echo -e "${BLUE}🔐 Ensuring IAM role exists...${NC}"
if [[ "$ROLE_ARN" == "arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}" ]] && ! aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
  echo -e "${YELLOW}Creating IAM role ${ROLE_NAME}...${NC}"
  aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}'

  aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

  echo -e "${YELLOW}⏳ Waiting 10 seconds for IAM role propagation...${NC}"
  sleep 10
elif [ -n "${LAMBDA_ROLE_ARN:-}" ]; then
  echo -e "${YELLOW}Using provided Lambda role ARN:${NC} ${LAMBDA_ROLE_ARN}"
fi

echo -e "${BLUE}☁️  Upserting Lambda function...${NC}"
ENV_VARS=()
if [ -n "${VENICE_API_KEY:-}" ]; then
  ENV_VARS+=("VENICE_API_KEY=${VENICE_API_KEY}")
fi
if [ -n "${GEMINI_API_KEY:-}" ]; then
  ENV_VARS+=("GEMINI_API_KEY=${GEMINI_API_KEY}")
fi

LAMBDA_ENV_ARG=()
if [ ${#ENV_VARS[@]} -gt 0 ]; then
  LAMBDA_ENV_ARG=(--environment "Variables={$(IFS=,; echo "${ENV_VARS[*]}")}")
fi

if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" >/dev/null 2>&1; then
  aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file fileb://coach-gemini-lambda.zip \
    --region "$REGION" >/dev/null

  aws lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --handler "$HANDLER" \
    --runtime "$RUNTIME" \
    --timeout 30 \
    --memory-size 512 \
    "${LAMBDA_ENV_ARG[@]}" \
    --region "$REGION" >/dev/null
else
  aws lambda create-function \
    --function-name "$FUNCTION_NAME" \
    --runtime "$RUNTIME" \
    --role "$ROLE_ARN" \
    --handler "$HANDLER" \
    --zip-file fileb://coach-gemini-lambda.zip \
    --timeout 30 \
    --memory-size 512 \
    "${LAMBDA_ENV_ARG[@]}" \
    --region "$REGION" >/dev/null
fi

echo -e "${BLUE}🌐 Ensuring API Gateway route exists...${NC}"
if [ -n "$API_ID_OVERRIDE" ]; then
  API_ID="$API_ID_OVERRIDE"
else
  API_ID=$(aws apigatewayv2 get-apis --region "$REGION" --query "Items[?Name=='$API_NAME'].ApiId" --output text)
fi

if [ -z "$API_ID" ] || [ "$API_ID" = "None" ]; then
  echo -e "${YELLOW}Creating API Gateway ${API_NAME}...${NC}"
  API_ID=$(aws apigatewayv2 create-api \
    --name "$API_NAME" \
    --protocol-type HTTP \
    --cors-configuration AllowOrigins='*',AllowMethods='POST,OPTIONS',AllowHeaders='content-type,authorization' \
    --region "$REGION" \
    --query 'ApiId' \
    --output text)

  aws apigatewayv2 create-stage \
    --api-id "$API_ID" \
    --stage-name '$default' \
    --auto-deploy \
    --region "$REGION" >/dev/null
fi

INTEGRATION_URI="arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$FUNCTION_NAME"
INTEGRATION_ID=$(aws apigatewayv2 create-integration \
  --api-id "$API_ID" \
  --integration-type AWS_PROXY \
  --integration-method POST \
  --payload-format-version 2.0 \
  --integration-uri "$INTEGRATION_URI" \
  --region "$REGION" \
  --query 'IntegrationId' \
  --output text)

for ROUTE_KEY in "POST $ROUTE_PATH" "OPTIONS $ROUTE_PATH"; do
  ROUTE_ID=$(aws apigatewayv2 get-routes --api-id "$API_ID" --region "$REGION" --query "Items[?RouteKey=='$ROUTE_KEY'].RouteId" --output text)
  if [ -z "$ROUTE_ID" ] || [ "$ROUTE_ID" = "None" ]; then
    aws apigatewayv2 create-route \
      --api-id "$API_ID" \
      --route-key "$ROUTE_KEY" \
      --target "integrations/$INTEGRATION_ID" \
      --region "$REGION" >/dev/null
  else
    aws apigatewayv2 update-route \
      --api-id "$API_ID" \
      --route-id "$ROUTE_ID" \
      --target "integrations/$INTEGRATION_ID" \
      --region "$REGION" >/dev/null
  fi
done

STATEMENT_ID="apigateway-invoke-coach-gemini"
if ! aws lambda get-policy --function-name "$FUNCTION_NAME" --region "$REGION" --query "Policy" --output text 2>/dev/null | grep -q "$STATEMENT_ID"; then
  aws lambda add-permission \
    --function-name "$FUNCTION_NAME" \
    --statement-id "$STATEMENT_ID" \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*$ROUTE_PATH" \
    --region "$REGION" >/dev/null
fi

API_ENDPOINT=$(aws apigatewayv2 get-api --api-id "$API_ID" --region "$REGION" --query 'ApiEndpoint' --output text)

echo -e "${GREEN}✅ AI coach deployed successfully!${NC}"
echo -e "${GREEN}📡 Endpoint:${NC} ${BLUE}${API_ENDPOINT}${ROUTE_PATH}${NC}"
echo -e "${YELLOW}💡 Set frontend VITE_AI_COACH_URL to this endpoint.${NC}"

rm -f coach-gemini-lambda.zip
