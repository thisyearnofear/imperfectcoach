# Development Guide

## 🛠️ Technology Stack

**AI & Agent System**
- Amazon Bedrock AgentCore (multi-step reasoning)
- Amazon Nova Lite (LLM decision-making)
- TensorFlow.js + MediaPipe (pose detection)

**Frontend**
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Wagmi + Viem (blockchain)

**Backend**
- AWS Lambda (eu-north-1)
- Supabase Edge Functions
- Smart Contracts (Base Sepolia)

**Payments**
- x402 protocol (server-driven challenges)
- Base Sepolia, Avalanche C-Chain, Solana Devnet
- USDC/SOL stablecoin settlement
- **Reap Protocol**: Real agent discovery & settlement (Phase A)

## 🚀 Quick Start for Developers

```bash
git clone https://github.com/thisyearnofear/imperfecthigher
cd imperfecthigher
npm install
npm run dev
```

## 🎯 Core Development Principles

- **ENHANCEMENT FIRST**: Prioritize enhancing existing components over creating new ones
- **AGGRESSIVE CONSOLIDATION**: Delete unnecessary code rather than deprecating
- **PREVENT BLOAT**: Systematically audit and consolidate before adding new features
- **DRY**: Single source of truth for all shared logic
- **CLEAN**: Clear separation of concerns with explicit dependencies
- **MODULAR**: Composable, testable, independent modules
- **PERFORMANT**: Adaptive loading, caching, and resource optimization
- **ORGANIZED**: Predictable file structure with domain-driven design

## 📁 Project Structure

```
imperfectcoach/
├── src/                 # Frontend source code
│   ├── components/      # React components
│   ├── lib/             # Business logic and utilities
│   ├── hooks/           # Custom React hooks
│   └── assets/          # Static assets
├── aws-lambda/          # Backend Lambda functions
├── contracts/           # Smart contracts
├── supabase/            # Supabase functions
├── docs/                # Documentation
└── scripts/             # Deployment and utility scripts
```

## 🧪 Testing

### Frontend Testing
```bash
# Run development server
npm run dev

# Run tests
npm run test

# Run linting
npm run lint
```

### Backend Testing
```bash
# Test Lambda functions locally
cd aws-lambda
node index.mjs

# Test Reap Protocol Integration
node test-reap-integration.mjs      # Phase A: Discovery
node test-reap-phase-b.mjs          # Phase B: x402 Negotiation
node test-reap-phase-c.mjs          # Phase C: Real Settlement
```

### x402 Protocol Testing

### x402 Protocol Testing

We provide automated scripts to test the full x402 flow (challenge → sign → verify) across all supported networks.

**EVM Chains (Base Sepolia, Avalanche C-Chain)**
```bash
# Test Base Sepolia (default)
node aws-lambda/test-x402-with-signature.mjs

# Test Avalanche C-Chain
node aws-lambda/test-x402-with-signature.mjs avalanche-c-chain
```

**Solana Devnet**
```bash
# Test Solana Devnet (using Ed25519)
node aws-lambda/test-x402-solana.mjs
```

These scripts simulate a client request, receive the 402 challenge, sign it using the appropriate scheme (EIP-191 or Ed25519), and retry the request to verify the server accepts the signature.

#### Frontend x402 Flow Testing

1. **Test Payment Challenge Flow**
   - Open browser DevTools (Console tab)
   - Navigate to Premium Analysis section
   - Click "Unlock Analysis"
   - Check Network tab: should see 402 response with challenge
   - Verify challenge has: `amount`, `asset`, `network`, `payTo`, `scheme`

2. **Test Signature Signing**
   - After 402 is received, wallet should prompt for signature
   - Check console: `🔐 Signing x402 challenge`
   - Verify signature appears in Network request headers (`X-Payment`)

3. **Test Payment Verification**
   - After retry with signature, should see 200 response
   - Check console: `✅ Payment verified, analyzing...`
   - Should display analysis results

4. **Test Multi-Chain Flows**
   - Base Sepolia: connect Base wallet → request analysis → verify 402 has `network: 'base-sepolia'`
   - Avalanche C-Chain: connect Avalanche wallet → request → verify `network: 'avalanche-c-chain'`
   - Solana Devnet: connect Phantom → request → verify `network: 'solana-devnet'`

#### Test Checklist

- [ ] Base Sepolia
  - [ ] Request without payment → 402
  - [ ] Sign challenge → signature valid
  - [ ] Retry with signature → 200
  
- [ ] Avalanche C-Chain
  - [ ] Request without payment → 402 with avalanche network
  - [ ] Sign challenge with Avalanche wallet
  - [ ] Verify signature server-side
  - [ ] Receive analysis
  
- [ ] Solana Devnet
  - [ ] Request without payment → 402 with solana network
  - [ ] Sign challenge with Phantom wallet
  - [ ] Verify Solana signature (tweetnacl)
  - [ ] Receive analysis

- [ ] Invalid Signatures
  - [ ] Tamper with amount in X-Payment header → should fail verification
  - [ ] Use wrong wallet signature → should fail
  - [ ] Expired nonce → should fail

- [ ] Edge Cases
  - [ ] Multiple rapid requests → each gets own nonce
  - [ ] Signature expires after timeout → new 402 required
  - [ ] Network timeout during signature → graceful retry

## 🚀 Deployment

### AWS Lambda Deployment
```bash
cd aws-lambda
./deploy.sh
```

The deployment script will:
1. Install dependencies
2. Create deployment package
3. Upload to AWS Lambda
4. Verify environment variables

### Smart Contract Deployment
```bash
# Deploy leaderboards
./scripts/deploy-public-leaderboards.sh
```

## 🔧 Environment Setup

### Prerequisites
1. Node.js 18+
2. AWS CLI configured
3. Solana CLI (for Solana payments)
4. Git

### Environment Variables
Create a `.env` file in the root directory:

```bash
# AWS Configuration
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Solana Configuration (for development)
SOLANA_PRIVATE_KEY=your_private_key
SOLANA_TREASURY_ADDRESS=your_treasury_address
SOLANA_RPC_URL=https://api.devnet.solana.com

# 0xGasless AgentKit & PayAI
AGENT_PRIVATE_KEY=your_agent_evm_private_key
CX0_API_KEY=your_0xgasless_api_key

# Reap Protocol Integration (Phase 3.5)
AGENT_WALLET_KEY=your_agent_evm_wallet_private_key  # For autonomous agent identity
AVALANCHE_RPC=https://api.avax-test.network/ext/bc/C/rpc
REAP_ENDPOINT=https://api.reap.io  # Or custom Reap deployment
```

## 🎨 Development Patterns

### Component Structure
Follow this pattern for React components:

```tsx
// ComponentName.tsx
import React from 'react';

interface ComponentNameProps {
  // Define props interface
}

export const ComponentName: React.FC<ComponentNameProps> = ({ prop }) => {
  return (
    <div>
      {/* Component implementation */}
    </div>
  );
};
```

### Hook Pattern
```ts
// useHookName.ts
import { useState, useEffect } from 'react';

export const useHookName = (param: Type) => {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Effect implementation
  }, [dependencies]);
  
  return {
    state,
    // Other return values
  };
};
```

### Utility Functions
```ts
// utilityName.ts
/**
 * Description of what this utility does
 */
export const utilityName = (param: Type): ReturnType => {
  // Implementation
  return result;
};
```

## 🐛 Debugging

### Frontend Debugging
1. Check browser console for errors
2. Use React DevTools for component inspection
3. Enable verbose logging with `localStorage.debug = '*'`

### Backend Debugging
Use the automated test scripts described in the "x402 Protocol Testing" section above for reliable debugging. Logs can be viewed via CloudWatch or the local script output.

### Solana Debugging
1. Check wallet balance:
   ```bash
   solana balance <address> --url devnet
   ```

2. Check USDC balance:
   ```bash
   spl-token balance Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr \
     --owner <address> --url devnet
   ```

## 📈 Performance Optimization

### Frontend Performance
1. Use React.memo for expensive components
2. Implement lazy loading for routes
3. Optimize images and assets
4. Use useCallback and useMemo appropriately

### Backend Performance
1. Minimize Lambda cold starts with provisioned concurrency
2. Optimize database queries
3. Cache frequently accessed data
4. Use efficient data structures

## 🔒 Security Best Practices

1. Never commit secrets to git
2. Use environment variables for sensitive data
3. Validate all user inputs
4. Implement proper error handling
5. Use AWS IAM roles with least privilege
6. Regularly rotate API keys

## 🔄 Continuous Integration

### GitHub Actions
The project uses GitHub Actions for CI/CD:
- Automated testing on pull requests
- Deployment on merge to main branch
- Code quality checks

### Pre-commit Hooks
- Linting with ESLint
- Type checking with TypeScript
- Formatting with Prettier

## 📚 Documentation

### Architecture Documentation
See [ARCHITECTURE.md](ARCHITECTURE.md) for complete system architecture.

### Solana Payments
Solana integration details are covered in [ARCHITECTURE.md](ARCHITECTURE.md).

### User Guide
See [USER_GUIDE.md](USER_GUIDE.md) for user-facing features.

## 🚀 X402 Agent Economy Roadmap Status

### ✅ Phase 1: Payment Router Consolidation (COMPLETED)
- [x] Audit payment logic across all files
- [x] Create `src/lib/payments/payment-router.ts`
- [x] Update `PremiumAnalysisUpsell.tsx` to use router
- [x] Update `AgentCoachUpsell.tsx` to use router
- [x] Verify Base/Solana payment flows

### ✅ Phase 2: Agent Identity & Discovery (COMPLETED)
- [x] Create `src/lib/agents/types.ts`
- [x] Build `aws-lambda/agent-discovery.mjs` (Registry Service)
- [x] Build `src/lib/agents/agent-registry.ts` (Client Wrapper)
- [x] Verify Registration & Discovery flow (`test-discovery-local.mjs`)

### ✅ Phase 3: Agent-to-Agent Data Exchange (COMPLETED)
- [x] Update Lambda to handle `data_query` requests
- [x] Implement differential pricing ($0.05 Analysis vs $0.01 Data)
- [x] Create `AgentClient` for autonomous negotiation
- [x] Limit test: Nutrition Agent pays Fitness Agent (`test-inter-agent.mjs`)

### 🔄 Phase 3.5: Real Inter-Agent Payments (IN PROGRESS - Dec 2024)
**Status**: Reap Protocol Integration Phase A, B, C
- [x] Add `@reap-protocol/sdk` to Lambda dependencies
- [x] Create `aws-lambda/lib/reap-integration.mjs` module
- [x] Implement hybrid discovery (Reap + Core agents)
- [x] Update Lambda handler to query Reap for real specialists
- [x] Add discovery telemetry to Lambda logs
- [x] Create `test-reap-integration.mjs` validation script
- [x] Phase A: Real agent discovery via Reap ✅ DONE
- [x] Phase B: Implement Reap's x402 negotiation loops ✅ DONE
- [x] Phase C: Real blockchain settlement & revenue splitting ✅ DONE
- [x] Add `call_specialist_agent` tool to Bedrock
- [x] Create Phase B & C test scripts
- [x] Agent-to-agent payment integration complete

### ✅ Phase 3.5: Real Inter-Agent Payments (COMPLETED - Dec 2024)
**Status**: Reap Protocol integration complete
- [x] Phase A: Real agent discovery via Reap ✅
- [x] Phase B: x402 negotiation loops ✅  
- [x] Phase C: Real blockchain settlement (USDC transfers) ✅
- [x] Multi-agent coordination tested
- [x] Bedrock `call_specialist_agent` tool integrated

**Key Implementations**:
- `aws-lambda/lib/reap-integration.mjs` (592 lines) - Discovery, negotiation, settlement
- `aws-lambda/agent-coach-handler.mjs` - Bedrock tool integration
- `aws-lambda/test-reap-*.mjs` - Phase A, B, C test suites
- Revenue split: 97% platform, 3% specialist agents
- Multi-specialist payment cascade
- On-chain audit trail (Base Sepolia/Avalanche Fuji)

**Bedrock Integration**:
Coach Agent can autonomously:
1. Discover real specialist from Reap Protocol
2. Negotiate x402 payment
3. Sign payment authorization
4. Execute real USDC transfer
5. Record audit trail
6. Return specialist analysis to user

### 🔄 Phase 4: Multi-Service Marketplace (IN PROGRESS - Week 1 Complete ✅)

**Goal**: Scale from specialist agent payments to full multi-service marketplace with tiers, booking, and SLA guarantees.

**Week 1 Completed** ✅:
- [x] Extended type system with ServiceTier, TieredPricing, AgentServiceAvailability
- [x] Created `service-tiers.ts` with configurations and helper functions
- [x] Merged booking types into `types.ts` (single source of truth)
- [x] Enhanced `agent-registry.ts` with tier filtering and availability checks
- [x] Updated `agent-discovery.mjs` with Phase D query parameters (tier, minReputation, maxResponseTime)
- [x] Enhanced mock agents with tiered pricing (basic=1x, pro=2.5x, premium=5x) and per-tier availability
- [x] Created comprehensive test suite `test-phase-d-discovery.mjs` - **20/20 tests passing ✅**

**Key Features Implemented**:
- Service tiers: Basic (5-10s SLA, standard slots), Pro (2-3s SLA, priority), Premium (<500ms SLA, VIP)
- Tier-based pricing multipliers and slot allocation
- SLA enforcement and uptime guarantees per tier
- Combined filtering: capability + tier + reputation + response time
- Mock data with realistic tier availability and performance metrics

**Week 2 Status: In Progress** (Following Core Principles - ENHANCEMENT FIRST)

**Completed** ✅:

1. **Created AgentRegistry.sol** (contracts/AgentRegistry.sol)
   - Agent registration: name, endpoint, capabilities, pricing
   - Discovery queries: find agents by capability, reputation, SLA
   - Pricing management: per-capability, per-tier (basic/pro/premium)
   - Reputation tracking: heartbeat, uptime calculation, success rates
   - No escrow: agents paid immediately via x402
   - ~400 lines, production-ready

2. **Enhanced agent-discovery.mjs** (aws-lambda/agent-discovery.mjs)
   - Added: POST /agents/{id}/book - Create service booking with tier validation
   - Added: GET /agents/{id}/booking/{bookingId} - Track booking status
   - Added: POST /agents/{id}/availability - Agent updates tier slots/availability
   - Features: Slot reservation, tier availability checking, pricing resolution
   - SLA validation: Checks responseSLA, uptime, slot availability
   - Validation: Capability matching, tier availability, agent status
   - ~150 lines of booking orchestration logic

**Week 2 Completed** ✅:

3. **Enhanced PaymentRouter** (src/lib/payments/payment-router.ts) ✅
   - Added: BookingPaymentContext interface for tier bookings
   - Implemented: executeBookingPayment() - full escrow flow
   - Implemented: createEscrowBooking() - on-chain escrow locking
   - Implemented: cancelBookingPayment() - refund initiation
   - Implemented: completeBookingPayment() - SLA verification + settlement
   - Features: Automatic penalty calculation, SLA checking, escrow management

4. **Enhanced agent-coach-handler.mjs** (aws-lambda/agent-coach-handler.mjs) ✅
   - Added: serviceTier and bookingId parameters to callSpecialistAgent
   - Implemented: SLA tracking with executionStartTime
   - Implemented: Dynamic SLA expectations (basic=5s, pro=2s, premium=500ms)
   - Implemented: SLA breach detection and penalty calculation (10%)
   - Added: SLA data to response (expectedMs, actualMs, met, penalty)
   - Features: Real-time SLA enforcement, agent reputation impact

**Current Architecture** (Post-Cleanup):
- **Smart Contract**: AgentRegistry stores agent profiles, pricing, reputation
- **Payment Model**: x402 immediate settlement (no escrow)
- **Tiers**: 3 service levels (basic=5s, pro=2s, premium=500ms)
- **Pricing**: Dynamic tiers per agent (basic 1x, pro 2.5x, premium 5x)
- **Discovery**: Reap Protocol + AgentRegistry for agent finding
- **Reputation**: On-chain tracking, heartbeat-based uptime calculation
- **Consolidation**: Merged 4 files, deleted 8 unused files, created 1 contract

**Week 3 Completed** ✅:

**UI Components** (4 new files, 937 lines):
- `ServiceTierSelector.tsx` - Tier selection (Basic/Pro/Premium) with pricing, SLA, features
- `AgentServiceBrowser.tsx` - Agent browser filtered by capability, tier, reputation, SLA
- `ServiceBookingFlow.tsx` - 4-step wizard: tier → agent → confirm → payment (x402 integration)
- `ServiceMarketplaceButton.tsx` - One-click entry point

**Backend Enhancements**:
- Enhanced CORE_AGENTS with tieredPricing, serviceAvailability (slots, SLA, uptime), location, successRate
- 3 mock agents: Fitness Coach (💪), Nutrition Planner (🥗), Recovery Booking (💆)
- Tier system: Basic (8s SLA, 1x price), Pro (3s SLA, 2.5x), Premium (500ms SLA, 5x)

**Integration & Quality**:
- ServiceMarketplaceButton integrated into PostWorkoutFlow (post-workout options)
- Updated AgentProfile type: added location?, successRate?
- TypeScript: 0 errors ✅
- Build: Production successful ✅
- Tests: 6/6 passing (test-phase-d-ui-integration.mjs) ✅
- No breaking changes - full backward compatibility

**Week 4 Completed** ✅:
- [x] AgentRegistry.sol deployed to Base Sepolia: 0xfE997dEdF572CA17d26400bCDB6428A8278a0627 (verified)
- [x] AgentRegistry.sol deployed to Avalanche Fuji: 0x1c2127562C52f2cfDd74e23A227A2ece6dFb42DC (verified)
- [x] Updated src/lib/contracts.ts with deployment addresses
- [x] Updated architecture docs with contract info
- [x] Multi-chain integration ready (Base Sepolia + Avalanche Fuji)

**Week 5 (Current)**:
- [ ] Integrate AgentRegistry with Bedrock agent for real discovery
- [ ] Test agent registration flow on both chains
- [ ] Implement reputation update flow
- [ ] Mainnet migration preparation

### Deployment Checklist (Phase 3.5 Complete)
- [x] All Phase A, B, C tests passing
- [x] Zero breaking changes
- [x] 100% backwards compatible
- [x] Comprehensive error handling
- [x] Production-grade logging
- [x] Private key handling secure
- [x] Settlement proof validation
- [x] Environment-based configuration

### Testing Phase 3.5
```bash
# Phase A: Discovery
node aws-lambda/test-reap-integration.mjs

# Phase B: x402 Negotiation
node aws-lambda/test-reap-phase-b.mjs

# Phase C: Real Settlement
node aws-lambda/test-reap-phase-c.mjs
```

### Testing Phase 4 (Week 1)
```bash
# Phase D: Service tier discovery and filtering
node aws-lambda/test-phase-d-discovery.mjs
# Expected: 20/20 tests passing ✅
```

### Environment Setup (Phase 3.5)
```bash
# aws-lambda/.env
AGENT_WALLET_KEY=your_agent_private_key
AGENT_WALLET_ADDRESS=0x...
AVALANCHE_RPC=https://api.avax-test.network/ext/bc/C/rpc
BASE_SEPOLIA_RPC=https://sepolia.base.org
REAP_ENDPOINT=https://api.reap.io
```

---

## 🆘 Getting Help

1. Check existing documentation
2. Review GitHub issues
3. Run tests to identify problems
4. Consult team members for complex issues