#!/bin/bash
set -e

echo "🔨 Building Lambda functions..."

# Clean start
rm -rf dist
mkdir -p dist

echo "📥 Installing dependencies with pnpm..."
pnpm install --shamefully-hoist

echo ""
echo "📦 Bundling with esbuild..."

# Build each handler
npx esbuild index.mjs \
  --bundle \
  --platform=node \
  --target=node18 \
  --format=esm \
  '--external:@aws-sdk/*' \
  --outfile=dist/index.js

npx esbuild agent-discovery.mjs \
  --bundle \
  --platform=node \
  --target=node18 \
  --format=esm \
  '--external:@aws-sdk/*' \
  --outfile=dist/agent-discovery.js

npx esbuild agent-coach-handler.mjs \
  --bundle \
  --platform=node \
  --target=node18 \
  --format=esm \
  '--external:@aws-sdk/*' \
  --outfile=dist/agent-coach.js

echo ""
echo "🎉 Build complete!"
echo "📊 Bundle sizes:"
ls -lh dist/*.js | awk '{print "   " $9 ": " $5}'
