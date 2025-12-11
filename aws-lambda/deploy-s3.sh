#!/bin/bash

# Deploy AWS Lambda using S3 (for packages >70MB)
# This script handles packages that exceed direct upload limits

set -e

FUNCTION_NAME="${1:-imperfect-coach-premium-analysis}"
REGION="${AWS_REGION:-eu-north-1}"
S3_BUCKET="imperfect-coach-lambda-deployments-${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text)}"
TIMESTAMP=$(date +%s)
S3_KEY="function-${TIMESTAMP}.zip"

echo "🚀 Deploying Lambda via S3"
echo "📍 Region: $REGION"
echo "🔗 S3 Bucket: $S3_BUCKET"
echo ""

# Create S3 bucket if it doesn't exist
echo "📦 Checking S3 bucket..."
if ! aws s3 ls "s3://${S3_BUCKET}" --region "$REGION" 2>/dev/null; then
    echo "Creating S3 bucket: $S3_BUCKET"
    aws s3 mb "s3://${S3_BUCKET}" --region "$REGION"
    echo "✅ Bucket created"
else
    echo "✅ Bucket exists"
fi

# Build deployment package
echo ""
echo "📦 Creating deployment package..."

# Clean and reinstall prod deps only
rm -rf node_modules package-lock.json
npm install --omit=dev --legacy-peer-deps --silent

# Aggressively prune node_modules
echo "🧹 Pruning node_modules..."
find node_modules -type f \( -name "*.md" -o -name "*.map" -o -name "*.ts" -o -name "*.test.js" -o -name "*.d.ts.map" \) -delete 2>/dev/null
find node_modules -type d \( -name "dist" -o -name "src" -o -name "test" -o -name "tests" -o -name "docs" -o -name "examples" -o -name ".bin" \) -exec rm -rf {} + 2>/dev/null

# Create zip
echo "🗜️  Zipping function and dependencies..."
zip -q -r function.zip \
    *.mjs \
    lib/ \
    node_modules/ \
    package.json

ZIP_SIZE=$(du -h function.zip | cut -f1)
echo "✅ Created function.zip ($ZIP_SIZE)"

# Upload to S3
echo ""
echo "☁️  Uploading to S3..."
aws s3 cp function.zip "s3://${S3_BUCKET}/${S3_KEY}" \
    --region "$REGION" \
    --storage-class STANDARD_IA \
    --no-progress

echo "✅ Uploaded to s3://${S3_BUCKET}/${S3_KEY}"

# Update Lambda
echo ""
echo "⚡ Updating Lambda function..."
UPDATE_RESPONSE=$(aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --s3-bucket "$S3_BUCKET" \
    --s3-key "$S3_KEY" \
    --region "$REGION" \
    --output json)

FUNCTION_ARN=$(echo "$UPDATE_RESPONSE" | jq -r '.FunctionArn')
CODE_SHA=$(echo "$UPDATE_RESPONSE" | jq -r '.CodeSha256')
CODE_SIZE=$(echo "$UPDATE_RESPONSE" | jq -r '.CodeSize')

echo "✅ Lambda updated successfully!"
echo ""
echo "📊 Function Details:"
echo "   ARN: $FUNCTION_ARN"
echo "   Code SHA: ${CODE_SHA:0:16}..."
echo "   Code Size: $(numfmt --to=iec-i --suffix=B $CODE_SIZE 2>/dev/null || echo "$CODE_SIZE bytes")"
echo ""

# Cleanup old versions (keep last 5)
echo "🧹 Cleaning up old S3 versions..."
VERSIONS=$(aws s3api list-objects-v2 \
    --bucket "$S3_BUCKET" \
    --prefix "function-" \
    --region "$REGION" \
    --query 'Contents[?ends_with(Key, `zip`)].Key' \
    --output text | tr '\t' '\n' | sort -r)

DELETE_COUNT=0
while IFS= read -r key; do
    DELETE_COUNT=$((DELETE_COUNT + 1))
    if [ $DELETE_COUNT -gt 5 ]; then
        echo "   Deleting: $key"
        aws s3 rm "s3://${S3_BUCKET}/${key}" --region "$REGION"
    fi
done <<< "$VERSIONS"

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Monitor logs: aws logs tail /aws/lambda/$FUNCTION_NAME --follow --region $REGION"
echo "   2. Test the function"
echo "   3. Remove local function.zip after successful deployment"
