#!/bin/bash

# Deploy AWS Lambda function with Solana USDC payment support
# Usage: ./deploy.sh [function-name]

set -e  # Exit on error

FUNCTION_NAME="${1:-imperfect-coach-premium-analysis}"
REGION="${AWS_REGION:-eu-north-1}"

echo "🚀 Deploying Lambda function: $FUNCTION_NAME"
echo "📍 Region: $REGION"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if function.zip exists and ask if we should rebuild
if [ -f "function.zip" ]; then
    echo "⚠️  function.zip already exists"
    read -p "Do you want to rebuild it? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm function.zip
        echo "🗑️  Removed old function.zip"
    fi
fi

# Create deployment package if it doesn't exist
if [ ! -f "function.zip" ]; then
    echo "📦 Creating deployment package..."
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "📥 Installing npm dependencies..."
        npm install
    fi
    
    # Create zip file
    echo "🗜️  Zipping function and dependencies..."
    zip -r function.zip index.mjs node_modules/ package.json package-lock.json -q
    
    echo "✅ Created function.zip ($(du -h function.zip | cut -f1))"
else
    echo "✅ Using existing function.zip ($(du -h function.zip | cut -f1))"
fi

echo ""
echo "☁️  Uploading to AWS Lambda..."

# Update function code
if aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file fileb://function.zip \
    --region "$REGION" \
    --output json > /tmp/lambda-update.json 2>&1; then
    
    echo "✅ Lambda function code updated successfully!"
    echo ""
    
    # Extract key information
    FUNCTION_ARN=$(jq -r '.FunctionArn' /tmp/lambda-update.json)
    CODE_SIZE=$(jq -r '.CodeSize' /tmp/lambda-update.json)
    RUNTIME=$(jq -r '.Runtime' /tmp/lambda-update.json)
    
    echo "📊 Function Details:"
    echo "   ARN: $FUNCTION_ARN"
    echo "   Code Size: $CODE_SIZE bytes"
    echo "   Runtime: $RUNTIME"
    echo ""
    
    # Check if environment variables are configured
    echo "🔍 Checking environment variables..."
    ENV_VARS=$(aws lambda get-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --region "$REGION" \
        --query 'Environment.Variables' \
        --output json 2>/dev/null || echo "{}")
    
    HAS_SOLANA_KEY=$(echo "$ENV_VARS" | jq -r 'has("SOLANA_PRIVATE_KEY")')
    HAS_SOLANA_TREASURY=$(echo "$ENV_VARS" | jq -r 'has("SOLANA_TREASURY_ADDRESS")')
    HAS_SOLANA_RPC=$(echo "$ENV_VARS" | jq -r 'has("SOLANA_RPC_URL")')
    
    if [ "$HAS_SOLANA_KEY" = "true" ] && [ "$HAS_SOLANA_TREASURY" = "true" ]; then
        echo "✅ Solana environment variables are configured"
    else
        echo "⚠️  Missing Solana environment variables!"
        echo ""
        echo "Required variables:"
        [ "$HAS_SOLANA_KEY" != "true" ] && echo "   ❌ SOLANA_PRIVATE_KEY"
        [ "$HAS_SOLANA_TREASURY" != "true" ] && echo "   ❌ SOLANA_TREASURY_ADDRESS"
        [ "$HAS_SOLANA_RPC" != "true" ] && echo "   ⚠️  SOLANA_RPC_URL (optional, defaults to devnet)"
        echo ""
        echo "To add them, run:"
        echo "   aws lambda update-function-configuration \\"
        echo "     --function-name $FUNCTION_NAME \\"
        echo "     --environment Variables='{\"SOLANA_PRIVATE_KEY\":\"your-key\",\"SOLANA_TREASURY_ADDRESS\":\"your-address\"}' \\"
        echo "     --region $REGION"
        echo ""
        echo "See SOLANA_SETUP.md for detailed instructions."
    fi
    
    echo ""
    echo "🎉 Deployment complete!"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Test the function with a Solana payment"
    echo "   2. Monitor CloudWatch logs for any errors"
    echo "   3. Check server wallet balance regularly"
    echo ""
    echo "View logs:"
    echo "   aws logs tail /aws/lambda/$FUNCTION_NAME --follow --region $REGION"
    
else
    echo "❌ Failed to update Lambda function"
    cat /tmp/lambda-update.json
    exit 1
fi

# Clean up
rm -f /tmp/lambda-update.json
