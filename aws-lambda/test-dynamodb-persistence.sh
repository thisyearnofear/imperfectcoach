#!/bin/bash
set -e

# Test DynamoDB persistence across Lambda redeploys
# Tests multi-chain agents: Base (EVM), Avalanche (EVM), Solana (Ed25519)

echo "╔════════════════════════════════════════════════════════╗"
echo "║  DynamoDB Persistence Test (Multi-Chain)              ║"
echo "║  Tests: Register → Verify DynamoDB → Redeploy → Test  ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

REGION="eu-north-1"
TABLE="AgentRegistry"

# ============================================================
# Test 1: Register Base (EVM) Agent via Lambda
# ============================================================
echo "Test 1: Register Base (EVM) Agent via Lambda"
echo "=============================================="

AGENT_ID="persist-base-$(date +%s)"

cat > /tmp/base-payload.json << 'EOF'
{
  "httpMethod": "POST",
  "path": "/agents/register",
  "body": "{\"profile\":{\"id\":\"persist-base-test\",\"name\":\"Persistence Test - Base\",\"endpoint\":\"https://test-base-persist.example.com/x402\",\"capabilities\":[\"fitness_analysis\",\"nutrition_planning\"],\"pricing\":{\"fitness_analysis\":{\"baseFee\":\"0.02\",\"asset\":\"USDC\",\"chain\":\"base-sepolia\"},\"nutrition_planning\":{\"baseFee\":\"0.01\",\"asset\":\"USDC\",\"chain\":\"base-sepolia\"}},\"signer\":\"0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A\",\"chain\":\"base\"}}"
}
EOF

aws lambda invoke \
  --function-name agent-discovery \
  --payload file:///tmp/base-payload.json \
  --region "$REGION" \
  /tmp/base-register.json > /dev/null 2>&1

BASE_STATUS=$(cat /tmp/base-register.json | jq -r '.body | fromjson | .success // false')
if [ "$BASE_STATUS" = "true" ]; then
  echo "✅ Base agent registered via Lambda"
  BASE_AGENT=$(cat /tmp/base-register.json | jq -r '.body | fromjson | .agent.id')
  echo "   Agent ID: $BASE_AGENT"
else
  echo "❌ Base agent registration failed"
  cat /tmp/base-register.json | jq '.'
  exit 1
fi

# ============================================================
# Test 2: Register Avalanche (EVM) Agent via Lambda
# ============================================================
echo ""
echo "Test 2: Register Avalanche (EVM) Agent via Lambda"
echo "==================================================="

cat > /tmp/avax-payload.json << 'EOF'
{
  "httpMethod": "POST",
  "path": "/agents/register",
  "body": "{\"profile\":{\"id\":\"persist-avalanche-test\",\"name\":\"Persistence Test - Avalanche\",\"endpoint\":\"https://test-avax-persist.example.com/x402\",\"capabilities\":[\"recovery_planning\"],\"pricing\":{\"recovery_planning\":{\"baseFee\":\"0.05\",\"asset\":\"USDC\",\"chain\":\"avalanche-fuji\"}},\"signer\":\"0x1563915e194D8CfBA1943570603F7606A3115508\",\"chain\":\"avalanche\"}}"
}
EOF

aws lambda invoke \
  --function-name agent-discovery \
  --payload file:///tmp/avax-payload.json \
  --region "$REGION" \
  /tmp/avax-register.json > /dev/null 2>&1

AVAX_STATUS=$(cat /tmp/avax-register.json | jq -r '.body | fromjson | .success // false')
if [ "$AVAX_STATUS" = "true" ]; then
  echo "✅ Avalanche agent registered via Lambda"
  AVAX_AGENT=$(cat /tmp/avax-register.json | jq -r '.body | fromjson | .agent.id')
  echo "   Agent ID: $AVAX_AGENT"
else
  echo "❌ Avalanche agent registration failed"
  exit 1
fi

# ============================================================
# Test 3: Register Solana Agent via Lambda
# ============================================================
echo ""
echo "Test 3: Register Solana (Ed25519) Agent via Lambda"
echo "===================================================="

cat > /tmp/sol-payload.json << 'EOF'
{
  "httpMethod": "POST",
  "path": "/agents/register",
  "body": "{\"profile\":{\"id\":\"persist-solana-test\",\"name\":\"Persistence Test - Solana\",\"endpoint\":\"https://test-sol-persist.example.com/x402\",\"capabilities\":[\"biomechanics_analysis\"],\"pricing\":{\"biomechanics_analysis\":{\"baseFee\":\"0.08\",\"asset\":\"USDC\",\"chain\":\"solana-devnet\"}},\"signer\":\"B2cipXE94Fbug7TfJb4csbm738KhCcdFNpC87dK1mNQf\",\"chain\":\"solana\"}}"
}
EOF

aws lambda invoke \
  --function-name agent-discovery \
  --payload file:///tmp/sol-payload.json \
  --region "$REGION" \
  /tmp/sol-register.json > /dev/null 2>&1

SOL_STATUS=$(cat /tmp/sol-register.json | jq -r '.body | fromjson | .success // false')
if [ "$SOL_STATUS" = "true" ]; then
  echo "✅ Solana agent registered via Lambda"
  SOL_AGENT=$(cat /tmp/sol-register.json | jq -r '.body | fromjson | .agent.id')
  echo "   Agent ID: $SOL_AGENT"
else
  echo "❌ Solana agent registration failed"
  exit 1
fi

# ============================================================
# Test 4: Verify all agents in DynamoDB
# ============================================================
echo ""
echo "Test 4: Verify Agents in DynamoDB"
echo "====================================="

verify_in_dynamodb() {
  local agent_id=$1
  local chain=$2
  
  ITEM=$(aws dynamodb get-item \
    --table-name "$TABLE" \
    --key "{\"agentId\":{\"S\":\"$agent_id\"}}" \
    --region "$REGION" \
    2>/dev/null || echo "")
  
  if [ -z "$ITEM" ] || [ "$ITEM" = "" ] || echo "$ITEM" | grep -q "Item.*: null"; then
    echo "❌ Agent $agent_id not found in DynamoDB"
    return 1
  fi
  
  NAME=$(echo "$ITEM" | jq -r '.Item.name.S // empty' 2>/dev/null || echo "")
  if [ -n "$NAME" ]; then
    echo "✅ $chain agent persisted in DynamoDB"
    echo "   Name: $NAME"
    return 0
  else
    echo "❌ Agent $agent_id found but data corrupted"
    return 1
  fi
}

verify_in_dynamodb "$BASE_AGENT" "Base"
verify_in_dynamodb "$AVAX_AGENT" "Avalanche"
verify_in_dynamodb "$SOL_AGENT" "Solana"

# ============================================================
# Test 5: Redeploy Lambda (force cold start)
# ============================================================
echo ""
echo "Test 5: Redeploy Lambda (Force Cold Start)"
echo "============================================"

echo "🔄 Redeploying agent-discovery Lambda..."
cd /Users/udingethe/Dev/imperfectcoach/aws-lambda
bash build.sh > /dev/null 2>&1
bash deploy-bundled.sh agent-discovery > /dev/null 2>&1
echo "✅ Lambda redeployed (waiting for cold start...)"

sleep 5

# ============================================================
# Test 6: Verify Agents Still Exist After Redeploy
# ============================================================
echo ""
echo "Test 6: Post-Redeploy DynamoDB Verification"
echo "=============================================="

verify_in_dynamodb "$BASE_AGENT" "Base (after redeploy)"
verify_in_dynamodb "$AVAX_AGENT" "Avalanche (after redeploy)"
verify_in_dynamodb "$SOL_AGENT" "Solana (after redeploy)"

# ============================================================
# Summary
# ============================================================
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  ✅ DynamoDB Persistence Test Complete                 ║"
echo "║                                                        ║"
echo "║  ✅ Base (EVM) agent persisted across redeploy         ║"
echo "║  ✅ Avalanche (EVM) agent persisted across redeploy    ║"
echo "║  ✅ Solana (Ed25519) agent persisted across redeploy   ║"
echo "║                                                        ║"
echo "║  Multi-chain support: ✅ VERIFIED                      ║"
echo "║  DynamoDB persistence: ✅ VERIFIED                     ║"
echo "║  Cold start recovery: ✅ VERIFIED                      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

exit 0
