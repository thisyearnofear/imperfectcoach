# Phase 3: DynamoDB Persistence TODO

## Prerequisite: IAM Role Update

Current role: `imperfect-coach-agent-core-role-ckl7o718`

Missing permissions:
- `dynamodb:PutItem`
- `dynamodb:GetItem`
- `dynamodb:Scan`
- `dynamodb:Query`
- `dynamodb:UpdateItem`

**Action Required**: Contact AWS admin to add DynamoDB permissions to role.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Scan",
        "dynamodb:Query",
        "dynamodb:UpdateItem"
      ],
      "Resource": "arn:aws:dynamodb:eu-north-1:595105651762:table/AgentRegistry"
    }
  ]
}
```

---

## Step 1: Create DynamoDB Table

Once IAM permissions are confirmed, run:

```bash
cd aws-lambda
aws dynamodb create-table \
  --table-name AgentRegistry \
  --attribute-definitions \
    AttributeName=agentId,AttributeType=S \
  --key-schema \
    AttributeName=agentId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region eu-north-1
```

**Wait for table to be ACTIVE** (~30 seconds):
```bash
aws dynamodb describe-table --table-name AgentRegistry --region eu-north-1 | jq '.Table.TableStatus'
# Should output: "ACTIVE"
```

---

## Step 2: Enable DynamoDB in agent-discovery.js

Update `agent-discovery.js` to initialize DynamoDB client:

Change:
```javascript
async function getRegistry() {
    if (!agentRegistry) {
        agentRegistry = await initializeRegistry(null); // null = memory-only mode
    }
    return agentRegistry;
}
```

To:
```javascript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

let dynamoDb = null;

async function getRegistry() {
    if (!agentRegistry) {
        if (!dynamoDb) {
            dynamoDb = new DynamoDBClient({
                region: process.env.AWS_REGION || "eu-north-1"
            });
        }
        agentRegistry = await initializeRegistry(dynamoDb);
    }
    return agentRegistry;
}
```

---

## Step 3: Update Build Script (Optional)

The build script already has `--external:@aws-sdk/*` so DynamoDB client won't be bundled.

Verify:
```bash
grep "external.*aws-sdk" build.sh
```

No changes needed—SDK is loaded at runtime from Lambda layer.

---

## Step 4: Redeploy

```bash
cd aws-lambda

# Rebuild with DynamoDB client import
bash build.sh

# Deploy
bash deploy-bundled.sh agent-discovery

# Verify handler updated
aws lambda get-function-configuration --function-name agent-discovery --region eu-north-1 | jq '.LastModified'
```

---

## Step 5: Test Persistence

After deployment, test that agents persist:

```bash
# Register an agent
PAYLOAD=$(cat <<'EOF' | base64 -w 0
{"httpMethod":"POST","path":"/agents/register","body":"{\"profile\":{\"id\":\"persist-test-001\",\"name\":\"Persistence Test\",\"endpoint\":\"https://test.com\",\"capabilities\":[\"fitness_analysis\"]}}"}
EOF

aws lambda invoke --function-name agent-discovery --payload "$PAYLOAD" --region eu-north-1 /tmp/response.json

# Check DynamoDB (agent should be persisted)
aws dynamodb get-item \
  --table-name AgentRegistry \
  --key '{"agentId":{"S":"persist-test-001"}}' \
  --region eu-north-1 | jq '.Item.name.S'
# Should output: "Persistence Test"

# Trigger cold start (update function code triggers new instance)
# Then query again - agent should still exist!

aws lambda invoke --function-name agent-discovery --payload '{"httpMethod":"GET","path":"/agents","queryStringParameters":{"capability":"fitness_analysis"}}' /tmp/response.json

cat /tmp/response.json | jq '.body | fromjson | .agents[].id'
# Should include "persist-test-001" even after cold start!
```

---

## Step 6: Verify DynamoDB Costs

With PAY_PER_REQUEST billing:

```bash
# Get estimated cost (run after a week of traffic)
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedWriteCapacityUnits \
  --dimensions Name=TableName,Value=AgentRegistry \
  --statistics Sum \
  --start-time 2025-12-15T00:00:00Z \
  --end-time 2025-12-22T00:00:00Z \
  --period 86400 \
  --region eu-north-1
```

Expected cost: < $0.01/month for typical usage

---

## Rollback Plan (If Issues)

If DynamoDB causes problems, revert to Phase 2 (memory-only):

```bash
# Revert agent-discovery.js to memory-only
git checkout -- agent-discovery.js

# Rebuild
bash build.sh

# Redeploy
bash deploy-bundled.sh agent-discovery
```

Lambda will continue working with in-memory registry (agents lost on cold start, but otherwise functional).

---

## What Changes Between Phase 2 & 3

| Feature | Phase 2 | Phase 3 |
|---------|---------|---------|
| **Persistence** | Memory-only | DynamoDB |
| **Cold Starts** | Agents lost | Agents reloaded |
| **Scale** | Single instance | Unlimited instances |
| **Cost** | $0/month | ~$0.01/month |
| **Complexity** | Simple | DynamoDB operations |
| **Testing** | No IAM needed | IAM update required |

---

## Success Criteria

✅ Phase 3 Complete when:

1. DynamoDB table created and ACTIVE
2. Agent registered successfully
3. Agent persists in DynamoDB (verified via CLI)
4. Cold start triggers Lambda redeployment
5. Persisted agent still discoverable after cold start
6. No DynamoDB errors in Lambda logs
7. Query performance < 50ms (even with DynamoDB)

---

## Questions to Ask Admin

1. Can you add DynamoDB permissions to role `imperfect-coach-agent-core-role-ckl7o718`?
2. Is PAY_PER_REQUEST billing preferred over provisioned capacity?
3. Should AgentRegistry table have backup/replication enabled?

---

## Debugging Phase 3

### "Requested resource not found" error
→ Table doesn't exist or region mismatch
```bash
aws dynamodb list-tables --region eu-north-1 | grep AgentRegistry
```

### "User is not authorized" error
→ IAM role missing DynamoDB permissions
```bash
aws iam list-attached-role-policies --role-name imperfect-coach-agent-core-role-ckl7o718
# Should include DynamoDB policies
```

### Agents not persisting
→ Check Lambda logs for DynamoDB errors
```bash
aws logs tail /aws/lambda/agent-discovery --follow --region eu-north-1
```

### Slow queries after Phase 3
→ Use DynamoDB monitoring
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=AgentRegistry \
  --start-time 2025-12-15T00:00:00Z \
  --end-time 2025-12-15T23:59:59Z \
  --period 3600 \
  --region eu-north-1
```

---

**Status**: Blocked on IAM permissions
**Blocker**: DynamoDB actions not allowed by current role
**Estimated Time**: 15 minutes (once IAM is updated)
