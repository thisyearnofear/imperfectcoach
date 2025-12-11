# Phase B & C: Real Inter-Agent Payments Roadmap

## Status: Phase A ✅ Complete | Phase B 🔜 Next | Phase C 🚀 Future

After Phase A (real agent discovery via Reap), the next critical steps are:
- **Phase B**: Reap's x402 negotiation loops for agent-to-agent signing
- **Phase C**: Real blockchain settlement with actual USDC transfers

---

## Phase B: x402 Negotiation Loops

### Goal
Replace simulated x402 challenges with real Reap Protocol negotiation flows.

### Implementation Steps

#### 1. Enhance `reap-integration.mjs`
Add negotiation handlers:
```javascript
/**
 * Execute x402 negotiation with another agent via Reap
 */
export async function negotiatePayment(paymentRequirement, agentIdentity) {
  const client = await getReapClient();
  
  // Reap handles:
  // 1. Challenge generation
  // 2. Message formatting
  // 3. Signature verification
  // 4. Settlement coordination
  
  return await client.negotiatePayment({
    from: agentIdentity.address,
    requirement: paymentRequirement,
    capability: "x402"
  });
}

/**
 * Sign a payment challenge from another agent
 */
export async function signPaymentChallenge(challenge, agentPrivateKey) {
  const client = await getReapClient();
  return await client.signChallenge(challenge, agentPrivateKey);
}
```

#### 2. Update Agent-to-Agent Calls
In `agent-coach-handler.mjs`, when calling specialist agents:
```javascript
// Before: Simulated 402 challenge
// After: Real Reap negotiation
const specialist = await AgentRegistry.findAgents({
  capability: "nutrition_planning"
});

// Negotiate real payment via Reap
const settlement = await negotiatePayment(
  specialist.pricing.nutrition_planning,
  coachAgentIdentity
);

// Call specialist with proof of payment
const result = await callSpecialist(specialist.endpoint, {
  data: workoutData,
  paymentProof: settlement.signature,
  transactionHash: settlement.txHash
});
```

#### 3. Add Reap Settlement Verification
```javascript
/**
 * Verify a Reap settlement proof
 */
export async function verifyReapSettlement(proof, expectedAmount, expectedRecipient) {
  const client = await getReapClient();
  
  // Reap validates:
  // - Signature authenticity
  // - Amount correctness
  // - Nonce freshness
  // - Recipient authorization
  
  return await client.verifySettlement(proof, {
    amount: expectedAmount,
    recipient: expectedRecipient
  });
}
```

### Files to Modify
- `aws-lambda/lib/reap-integration.mjs`: Add negotiation & signing functions
- `aws-lambda/agent-coach-handler.mjs`: Call real agents with Reap settlements
- `src/lib/agents/agent-registry.ts`: Return payment info from discovered agents

### Test Script
```bash
node aws-lambda/test-reap-phase-b.mjs
```

### Success Criteria
- [ ] Coach Agent negotiates x402 with real specialist via Reap
- [ ] Signature verification succeeds
- [ ] Settlement recorded (even if simulated)
- [ ] Logs show payment flow (not simulated)

---

## Phase C: Real Blockchain Settlement

### Goal
Execute actual USDC transfers on Base/Avalanche when agents pay each other.

### Implementation Steps

#### 1. Configure Agent Wallet
```javascript
// aws-lambda/lib/reap-settlement.mjs
export async function executeRealPayment(settlement) {
  const client = await getReapClient();
  const agentWallet = new Wallet(process.env.AGENT_WALLET_KEY);
  
  // Reap's settlement layer handles:
  // - USDC ERC-20 transfer
  // - Network selection (Base/Avalanche)
  // - Gas optimization
  // - Atomic settlement
  
  const tx = await client.executeSettlement({
    from: agentWallet.address,
    to: recipientAddress,
    amount: settlement.amount,
    asset: settlement.asset,
    chain: settlement.chain,
    proof: settlement.proof
  });
  
  return {
    transactionHash: tx.hash,
    blockNumber: tx.blockNumber,
    status: "confirmed"
  };
}
```

#### 2. Track Settlement on-chain
```javascript
// Store all payments in database
await db.recordPayment({
  from: coachAgentId,
  to: specialistAgentId,
  amount: settlement.amount,
  asset: "USDC",
  chain: settlement.chain,
  transactionHash: tx.hash,
  timestamp: Date.now(),
  capabilityUsed: "nutrition_planning"
});
```

#### 3. Revenue Splitting
Use existing `RevenueSplitter` contract:
```javascript
// After agent payment confirmed on-chain
await revenueSplitter.recordAgentPayment({
  agent: recipientAgentId,
  amount: settlement.amount,
  reason: "nutrition_specialist_service"
});

// User sees breakdown in UI:
// Coach Agent: $0.10
// Nutrition Specialist: $0.03 (paid from coach's fee)
// Imperfect Coach Platform: 97% of fees
```

#### 4. Update UI to Show Real Settlements
```typescript
// src/components/AgentCoachUpsell.tsx
const result = await PaymentRouter.execute({
  apiUrl,
  requestBody,
  // ... wallet configs
});

// Check if real settlement occurred
if (result.data.settlement?.transactionHash) {
  console.log(`✅ Real payment confirmed: ${result.data.settlement.transactionHash}`);
  
  // Show on-chain receipt to user
  setSettlementDetails({
    from: coachAgent.name,
    to: result.data.specialistsUsed.map(s => s.name),
    amounts: result.data.settlement.breakdown,
    transactionHash: result.data.settlement.transactionHash,
    chain: result.data.settlement.chain
  });
}
```

### Files to Create/Modify
- **Create**: `aws-lambda/lib/reap-settlement.mjs`: Real payment execution
- **Modify**: `aws-lambda/agent-coach-handler.mjs`: Call settlement after negotiation
- **Modify**: `src/components/AgentCoachUpsell.tsx`: Display real settlement receipts
- **Modify**: `src/lib/agents/agent-economy-context.ts`: Track real vs simulated

### Test Script
```bash
node aws-lambda/test-reap-phase-c.mjs
```

### Success Criteria
- [ ] Real USDC transfer executed on Base/Avalanche
- [ ] Settlement confirmed on-chain (block explorer visible)
- [ ] All agents received their payments
- [ ] User sees transaction hash in UI
- [ ] Revenue split correctly to Imperfect Coach treasury
- [ ] On-chain audit trail complete

---

## Architecture Overview: Simulated → Real Migration

### Phase A: Discovery (Current ✅)
```
Coach Agent → Queries Reap Registry → Returns Real Specialist Agents
```

### Phase B: Negotiation (Next 🔜)
```
Coach Agent → Reap x402 Loop → Sign Challenge → Get Settlement Proof
```

### Phase C: Settlement (Future 🚀)
```
Coach Agent Wallet → USDC Transfer → Specialist Agent Wallet
↓
On-Chain Receipt → User Dashboard → Audit Trail
```

---

## Environment Variables Needed

```bash
# Phase B & C
AGENT_WALLET_KEY=your_agent_private_key            # For signing & sending tx
AGENT_WALLET_ADDRESS=0x...                         # Agent's public address
USDC_CONTRACT_ADDRESS_BASE=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
USDC_CONTRACT_ADDRESS_AVAX=0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E
BASE_SEPOLIA_RPC=https://sepolia.base.org
AVALANCHE_FUJI_RPC=https://api.avax-test.network/ext/bc/C/rpc
REVENUE_SPLITTER_ADDRESS=0x...                    # Contract address
```

---

## Testing Sequence

### Phase B Tests
```bash
# 1. Test discovery (Phase A - already done)
node aws-lambda/test-reap-integration.mjs

# 2. Test x402 negotiation
node aws-lambda/test-reap-phase-b.mjs

# 3. Verify signature flow
node aws-lambda/test-reap-negotiation.mjs
```

### Phase C Tests
```bash
# 1. Test settlement on testnet
node aws-lambda/test-reap-phase-c.mjs

# 2. Verify USDC transfers
curl https://api.basescan.io/api?module=account&action=tokentx&address=AGENT_ADDRESS

# 3. Check revenue splitting
node aws-lambda/test-revenue-split.mjs
```

---

## Timeline & Effort Estimate

### Phase B: x402 Negotiation Loops
- **Effort**: 6-8 hours
- **Dependencies**: Reap Protocol docs, test agents available
- **Risk**: Medium (requires agent-to-agent coordination)
- **Timeline**: 1-2 days

### Phase C: Real Settlement
- **Effort**: 4-6 hours
- **Dependencies**: Phase B complete, USDC contracts deployed
- **Risk**: Medium (actual blockchain interaction, gas estimation)
- **Timeline**: 1 day

### Total Migration
- **Effort**: 10-14 hours
- **Timeline**: 2-3 days
- **Go-Live**: Ready for hackathon demo or mainnet launch

---

## Risk Mitigation

### Phase B Risks
- Reap API availability → Fallback to simulated challenges
- Agent not responding → Timeout + retry logic
- Invalid signatures → Verification before on-chain

### Phase C Risks
- Gas price spikes → Use Reap's gas optimization
- Network congestion → Fallback to lower-fee chain
- Contract bugs → Use testnet extensively first
- Insufficient funds → Require minimum balance check

---

## Success Metrics

### Phase B
- ✅ Real agents respond to x402 challenges
- ✅ Coach Agent negotiates with 3+ specialists
- ✅ All signatures verified successfully
- ✅ No simulated challenges in logs

### Phase C
- ✅ USDC transfers visible on block explorer
- ✅ Agent wallets funded correctly
- ✅ User sees transaction hash in UI
- ✅ Revenue split accurate to 100%
- ✅ <5 second settlement time

---

## Next Steps

1. **Today**: Review this roadmap with team
2. **Tomorrow**: Begin Phase B implementation
3. **Day 2**: Phase C implementation
4. **Day 3**: Integration testing & bug fixes
5. **Day 4**: Mainnet preparation

---

## Quick Reference: Key Files to Create

```
Phase B:
- aws-lambda/lib/reap-settlement.mjs
- aws-lambda/test-reap-phase-b.mjs

Phase C:
- aws-lambda/lib/on-chain-settlement.mjs
- aws-lambda/test-reap-phase-c.mjs
- src/components/SettlementReceipt.tsx
```

---

**Remember**: This is a phased approach. Phase A (discovery) is complete and demonstrates the concept. Phases B & C are engineering-heavy but lower-risk since the foundation is solid.
