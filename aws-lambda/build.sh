#!/bin/bash
set -e

echo "🔨 Building Lambda functions with esbuild..."

# Clean start to fix pnpm symlink issues
rm -rf node_modules dist
mkdir -p dist

echo "📥 Installing dependencies with pnpm (hoisted)..."
pnpm install --shamefully-hoist

# Function to build a file
build_file() {
    src=$1
    dest=$2
    echo "📦 Building $src -> $dest..."
    ./node_modules/.bin/esbuild "$src" \
      --bundle \
      --platform=node \
      --target=node18 \
      --format=cjs \
      --outfile="$dest" \
      --external:bufferutil \
      --external:utf-8-validate \
      --minify \
      --sourcemap \
      --log-level=warning
    echo "✅ Built $dest ($(du -h "$dest" | cut -f1))"
}

build_file "index.mjs" "dist/index.js"
build_file "agent-discovery.mjs" "dist/agent-discovery.js"
build_file "agent-coach-handler.mjs" "dist/agent-coach.js"

echo ""
echo "🎉 Build complete!"
echo "📊 Bundle sizes:"
ls -lh dist/*.js | awk '{print "   " $9 ": " $5}'
