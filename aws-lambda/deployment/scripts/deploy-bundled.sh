#!/bin/bash

# Deploy bundled Lambda functions (tiny ~6MB packages)
# Usage: ./deploy-bundled.sh [function-name]

set -e

FUNCTION_NAME="${1:-imperfect-coach-premium-analysis}"
REGION="${AWS_REGION:-eu-north-1}"

echo "🚀 Deploying bundled Lambda: $FUNCTION_NAME"
echo "📍 Region: $REGION"
echo ""

# Always rebuild to ensure fresh code
echo "🔨 Building with esbuild..."
./build.sh
echo ""

# Determine which bundle to use based on function name
if [[ "$FUNCTION_NAME" == *"agent-core"* ]]; then
    BUNDLE_FILE="dist/agent-coach.js"
    HANDLER="agent-coach.handler"
elif [[ "$FUNCTION_NAME" == *"discovery"* ]]; then
    BUNDLE_FILE="dist/agent-discovery.js"
    HANDLER="agent-discovery.handler"
else
    # Default to premium analysis
    BUNDLE_FILE="dist/index.js"
    HANDLER="index.handler"
fi

if [ ! -f "$BUNDLE_FILE" ]; then
    echo "❌ Error: Bundle file $BUNDLE_FILE not found!"
    exit 1
fi

echo "📦 Using bundle: $BUNDLE_FILE ($(du -h $BUNDLE_FILE | cut -f1))"

# Create minimal zip (just the bundle + sourcemap)
echo "🗜️  Creating deployment package..."
cd dist
ZIP_NAME="lambda-bundle.zip"
# Zip the bundle file but rename it inside zip to match the handler filename usage if needed
# Actually Lambda expects <filename>.<export>
# So if HANDLER is agent-coach.handler, file must be agent-coach.js
# Our BUNDLE_FILE is dist/agent-coach.js, so basename is agent-coach.js. Perfect.
target_file=$(basename $BUNDLE_FILE)
zip -q $ZIP_NAME $target_file $target_file.map 2>/dev/null || zip -q $ZIP_NAME $target_file
cd ..

ZIP_SIZE=$(du -h dist/$ZIP_NAME | cut -f1)
echo "✅ Created dist/$ZIP_NAME ($ZIP_SIZE)"

# Upload directly (small enough for direct upload!)
echo ""
echo "☁️  Uploading to Lambda..."
aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file fileb://dist/$ZIP_NAME \
    --region "$REGION" \
    --output json > /tmp/lambda-update.json

FUNCTION_ARN=$(jq -r '.FunctionArn' /tmp/lambda-update.json)
CODE_SHA=$(jq -r '.CodeSha256' /tmp/lambda-update.json)
CODE_SIZE=$(jq -r '.CodeSize' /tmp/lambda-update.json)

echo "✅ Lambda updated successfully!"
echo ""
echo "📊 Function Details:"
echo "   ARN: $FUNCTION_ARN"
echo "   Code SHA: ${CODE_SHA:0:16}..."
echo "   Code Size: $(numfmt --to=iec-i --suffix=B $CODE_SIZE 2>/dev/null || echo "$CODE_SIZE bytes")"
echo "   Handler: $HANDLER"
echo ""

# Update handler if needed
echo "🔧 Ensuring correct handler..."
aws lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --handler "$HANDLER" \
    --region "$REGION" \
    --output json > /dev/null

echo "✅ Handler set to: $HANDLER"
echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Test: curl -X OPTIONS https://your-api-gateway-url/analyze-workout -v"
echo "   2. Monitor: aws logs tail /aws/lambda/$FUNCTION_NAME --follow --region $REGION"

# Cleanup
rm -f /tmp/lambda-update.json
