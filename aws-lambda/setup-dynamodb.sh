#!/bin/bash

# Create DynamoDB Tables for Imperfect Coach AI Agent
# Follows AWS best practices for Lambda + DynamoDB integration

set -e

REGION="${AWS_REGION:-eu-north-1}"
PREFIX="ImperfectCoach"

echo "🗄️  Creating DynamoDB tables in $REGION..."

# 1. Workout History Table
echo "📊 Creating WorkoutHistory table..."
aws dynamodb create-table \
  --table-name "${PREFIX}-WorkoutHistory" \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=timestamp,AttributeType=N \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION" \
  --tags Key=Project,Value=ImperfectCoach Key=Environment,Value=Production \
  2>/dev/null || echo "  ⚠️  Table already exists"

# 2. User Profiles Table
echo "👤 Creating UserProfiles table..."
aws dynamodb create-table \
  --table-name "${PREFIX}-UserProfiles" \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION" \
  --tags Key=Project,Value=ImperfectCoach Key=Environment,Value=Production \
  2>/dev/null || echo "  ⚠️  Table already exists"

# 3. Agent Sessions Table (with GSI for querying by userId)
echo "🤖 Creating AgentSessions table..."
aws dynamodb create-table \
  --table-name "${PREFIX}-AgentSessions" \
  --attribute-definitions \
    AttributeName=sessionId,AttributeType=S \
    AttributeName=userId,AttributeType=S \
    AttributeName=timestamp,AttributeType=N \
  --key-schema \
    AttributeName=sessionId,KeyType=HASH \
  --global-secondary-indexes \
    "[{
      \"IndexName\": \"UserIdIndex\",
      \"KeySchema\": [
        {\"AttributeName\": \"userId\", \"KeyType\": \"HASH\"},
        {\"AttributeName\": \"timestamp\", \"KeyType\": \"RANGE\"}
      ],
      \"Projection\": {\"ProjectionType\": \"ALL\"}
    }]" \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION" \
  --tags Key=Project,Value=ImperfectCoach Key=Environment,Value=Production \
  2>/dev/null || echo "  ⚠️  Table already exists"

echo ""
echo "✅ DynamoDB tables created successfully!"
echo ""
echo "📋 Table Summary:"
echo "   - ${PREFIX}-WorkoutHistory (userId + timestamp)"
echo "   - ${PREFIX}-UserProfiles (userId)"
echo "   - ${PREFIX}-AgentSessions (sessionId, GSI: userId)"
echo ""
echo "💡 Lambda functions will auto-detect these tables via environment variables"
echo ""
echo "🔐 Next: Ensure Lambda execution role has DynamoDB permissions:"
echo "   aws iam attach-role-policy \\"
echo "     --role-name lambda-bedrock-execution-role \\"
echo "     --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
