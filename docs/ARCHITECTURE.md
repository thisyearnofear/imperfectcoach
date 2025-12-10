# 🏗️ Imperfect Coach - System Architecture

**Autonomous AI Agent for Personalized Fitness Coaching**

## 🎯 Core Principles
- **ENHANCEMENT FIRST**: Prioritize enhancing existing components over creating new ones
- **AGGRESSIVE CONSOLIDATION**: Delete unnecessary code rather than deprecating
- **PREVENT BLOAT**: Systematically audit and consolidate before adding new features
- **DRY**: Single source of truth for all shared logic
- **CLEAN**: Clear separation of concerns with explicit dependencies
- **MODULAR**: Composable, testable, independent modules
- **PERFORMANT**: Adaptive loading, caching, and resource optimization
- **ORGANIZED**: Predictable file structure with domain-driven design

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     USER INTERFACE                       │
│              React + TypeScript + Vite                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   AI COACHING TIERS                      │
├─────────────────────────────────────────────────────────┤
│  FREE        →  Supabase Edge (Gemini/OpenAI/Claude)   │
│  PREMIUM     →  AWS Lambda + Nova Lite ($0.05)          │
│  AGENT       →  AWS Lambda + Bedrock AgentCore ($0.10)  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              MULTI-CHAIN BLOCKCHAIN                     │
├─────────────────────────────────────────────────────────┤
│  Payments    →  x402pay + Smart Routing                │
│  Base        →  USDC (Base Sepolia) - Premium/Agent    │
│  Solana      →  SOL/USDC (Devnet) - Micro-payments     │
│  Treasury    →  CDP Wallet + RevenueSplitter            │
│  Records     →  ImperfectCoachPassport NFT              │
│  Leaderboard →  On-chain permanent tracking             │
└─────────────────────────────────────────────────────────┘
```

## 🤖 AI Agent Implementation

### Agent Qualification Criteria ✅
Meets all AWS-defined AI agent requirements:
1. **✅ Reasoning LLMs**: Amazon Nova Lite (`amazon.nova-lite-v1:0`)
2. **✅ Autonomous Capabilities**: Independent tool selection and multi-step reasoning
3. **✅ Tool Integration**: 4 integrated tools (pose analysis, history, benchmarks, training plans)
4. **✅ AgentCore Primitives**: Tool use, multi-step reasoning, autonomous decision-making

### Agent Tools
- `analyze_pose_data`: Deep form analysis from TensorFlow.js pose detection
- `query_workout_history`: Retrieves user's training patterns from database
- `benchmark_performance`: Compares user against athlete database
- `generate_training_plan`: Creates personalized 4-week programs

## 💰 x402 Multi-Chain Payment Infrastructure

### x402 Protocol: Server-Driven, AI-Agent Native Economy

The x402 protocol enables **true decentralized agent economies** where autonomous agents independently negotiate, pay for, and exchange services without pre-authorization or accounts. We leverage **0xGasless AgentKit** to provide our agents with on-chain identity and autonomous payment capabilities.

**Core x402 Flow:**
```
1. Agent A requests service from Agent B (without payment)
2. Agent B returns HTTP 402 with service pricing & requirements
3. Agent A signs the challenge with its identity
4. Agent A retries with signed payment authorization
5. Agent B verifies signature and settles on-chain
6. Service executes and both agents update state
```

### Agent Economy Layers (Phase-based Implementation)

#### Phase 1: User-Agent Payment Routing ✅ ACTIVE
**Current**: Users pay via x402 for coaching tiers
- Micro-payments to Solana (lower fees)
- Premium services to Base/Avalanche (reliability)
- **Enhancement**: Agent autonomously decides routing based on:
  - Current network congestion
  - Real-time gas prices
  - Historical latency data
  - User's preferred network

#### Phase 2: Agent Identity & Discovery (NEXT)
**Scenario**: Agents need to find and trust each other before transacting
- **Registry**: Agents register capabilities, pricing, and health status
- **Discovery**: Agents query the registry to find service providers (e.g., "Find me a nutrition agent < $0.05")
- **Identity**: Cryptographic verification of agent identity via 0xGasless/Signatures
- **Routing**: Protocol finds the best path/agent for the request

#### Phase 3: Agent-to-Agent Data Exchange
**Scenario**: Nutrition agent queries fitness agent about recent performance
- **Agent A** (Fitness Coach): Has user's workout data, form metrics
- **Agent B** (Nutrition Planner): Needs performance context to optimize diet
- **Payment**: Agent B pays small fee for data access (x402)
- **Privacy**: User controls what data agents can access
- **Result**: Agents coordinate seamlessly; nutrition optimized with fitness context

#### Phase 4: Multi-Service Marketplace (FUTURE)
**Scenario**: Multi-agent services compete for user needs
- **Coaching Agent**: Provides training plans ($0.10)
- **Massage Booking Agent**: Books recovery sessions ($0.50/booking)
- **Nutrition Agent**: Meal planning ($0.03 per meal)
- **Calendar Agent**: Coordinates scheduling via x402 micro-payments
- **Protocol**: Agents bid for user's needs, user controls budget & preferences
- **Settlement**: All payments routed through RevenueSplitter with split rules

#### Phase 5: Autonomous Agent Chaining (FUTURE)
**Scenario**: Complex fitness goals require multiple agents
1. User: "Prepare me for a triathlon in 12 weeks"
2. Coach Agent analyzes fitness level (queries Benchmark Agent via x402)
3. Coach Agent requests Nutrition Plan (pays Nutrition Agent via x402)
4. Nutrition Agent requests Body Metrics (pays Fitness Agent via x402)
5. All services coordinate with Calendar Agent for scheduling
6. Each transaction is metered, auditable, and revenue-split

### Supported Networks
| Network | Asset | Use Case | Status |
|---------|-------|----------|--------|
| **Avalanche C-Chain** | USDC | Primary - Enterprise reliability | ✅ Active |
| **Base Sepolia** | USDC | Secondary - High throughput | ✅ Active |
| **Solana Devnet** | USDC | Micro-payments - Lowest cost | ✅ Active |

### Technical Implementation
- `src/lib/payments/x402-signer.ts` - Client/Agent signer (EOA & Smart compatible)
- `src/lib/payments/x402-chains.ts` - Network configurations & smart routing
- `src/lib/payments/agent-router.ts` - **NEW**: Agent-driven routing based on network conditions
- `aws-lambda/index.mjs` - Server uses **0xGasless AgentKit** for identity & verification
- `aws-lambda/agent-discovery.mjs` - **NEW**: Agent registry and routing
- `aws-lambda/inter-agent-payments.mjs` - **NEW**: Agent-to-agent payment settlement
- **EIP-1271 Support**: Full support for Smart Account signatures

## 📜 Smart Contracts

### Key Contracts
- **RevenueSplitter**: `0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA` - Distributes payments (70% platform, 20% rewards, 10% referrers)
- **ImperfectCoachPassport**: `0x7c95712a2bce65e723cE99C190f6bd6ff73c4212` - Soulbound NFT tracking user progress
- **CoachOperator**: `0xdEc2d60c9526106a8e4BBd01d70950f6694053A3` - On-chain agent with permission to update passports
- **ExerciseLeaderboard**: Public submission model for workout records

## 🛠️ Technology Stack

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui components
- TensorFlow.js + MediaPipe for pose detection
- Wagmi + Viem for blockchain interactions

### Backend
- Supabase Edge Functions (real-time AI coaching)
- AWS Lambda + Bedrock AgentCore (autonomous agent)
- Smart Contracts on Base Sepolia

### AI/ML
- Amazon Bedrock AgentCore
- Amazon Nova Lite model
- Gemini, OpenAI, Anthropic (real-time tier)
- TensorFlow.js (pose estimation)

## 🎯 Dual-Chain Architecture

### Current Implementation
- **Base Path**: Coinbase wallet + SIWE authentication for EVM operations
- **Solana Path**: Phantom/Solflare wallet + wallet signature authentication
- **Unified Leaderboard**: Reads from both Base and Solana contracts, displays together
- **Per-Chain Submission**: Users submit to appropriate chain contract based on their connected wallet

## 🧪 Testing Strategy

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:e2e
```

### Agent Testing
```bash
cd aws-lambda
node test-agent.js
```

## ☁️ Deployment Workflows

### Frontend (Netlify)
```bash
npm run build
netlify deploy --prod
```

### Supabase Edge Functions
```bash
supabase functions deploy coach-gemini
supabase secrets set GEMINI_API_KEY=xxx
```

### AWS Lambda
```bash
cd aws-lambda
./deploy-agent.sh
```

## 📊 Monitoring & Debugging

### CloudWatch Logs
- Errors: `[timestamp, level=ERROR, ...]`
- Agent tools: `"toolsUsed".*"analyze_pose_data"`
- Payment events: `"Payment verified"`

### BaseScan Monitoring
Track contracts: RevenueSplitter, Passport, CoachOperator

## 🐛 Common Issues & Solutions

### Agent Lambda timeout
- Increase Lambda timeout to 60s
- Reduce MAX_ITERATIONS to 3
- Optimize tool implementations

### Signature verification fails
- Verify message format exactly matches
- Check wallet address matches signer
- For smart wallets, ensure EIP-1271 support

### Payment not settling
- Verify X-Payment header present
- Check CDP account has USDC balance
- Review x402 protocol integration

## ✅ Code Quality Standards

### TypeScript
- Strict mode enabled
- No `any` types (use `unknown` or proper types)
- Interfaces for all props and data structures
- Proper error handling with typed errors

### React Patterns
- Use React.memo for pure components
- Move expensive calculations to useMemo
- Use useCallback for event handlers

## 📋 Contribution Guidelines

### PR Requirements
- Tests pass (`npm run test`)
- Types are correct (`npm run typecheck`)
- Linting passes (`npm run lint`)
- Component documented (JSDoc comments)
- Mobile-responsive and accessible

### Commit Messages
```
feat: add agent progress visualization
fix: resolve payment signature verification
refactor: consolidate tier color constants
docs: update deployment guide
test: add agent tool integration tests
```

## 🚀 Quick Reference

### Tier Configuration
```typescript
export const TIERS = {
  free: { name: "Free", price: 0, model: "Gemini/GPT/Claude" },
  premium: { name: "Premium", price: 0.05, model: "Nova Lite" },
  agent: { name: "Agent", price: 0.10, model: "Nova + AgentCore" },
} as const;
```

### Contract Addresses (Base Sepolia)
```typescript
export const CONTRACTS = {
  REVENUE_SPLITTER: "0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA",
  PASSPORT: "0x7c95712a2bce65e723cE99C190f6bd6ff73c4212",
  OPERATOR: "0xdEc2d60c9526106a8e4BBd01d70950f6694053A3",
} as const;
```

### API Endpoints
```typescript
export const ENDPOINTS = {
  FREE_COACH: "https://bolosphrmagsddyppziz.supabase.co/functions/v1/coach-gemini",
  PREMIUM_ANALYSIS: "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout",
  AGENT_COACH: "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/agent-coach",
} as const;
```

---

## 🚀 X402 Agent Economy Implementation Roadmap

### Principle: ENHANCEMENT FIRST + AGGRESSIVE CONSOLIDATION
All work enhances existing payment/agent infrastructure. No new services created—only consolidated and extended.

### PHASE 1: Consolidate Payment Routing (CURRENT)
**Goal**: Single source of truth for payment logic, agent-driven network selection

**Audit & Consolidation**:
1. Identify all payment decision logic across:
   - `src/components/PremiumAnalysisUpsell.tsx` (hardcoded chain logic)
   - `src/components/AgentCoachUpsell.tsx` (duplicate payment flow)
   - `aws-lambda/index.mjs` (server-side routing)
2. Extract to `src/lib/payments/payment-router.ts`:
   - Network health checks (gas prices, latency)
   - Dynamic routing decisions (cost vs. speed vs. reliability)
   - Fallback strategies
3. **Remove duplication**: Delete `AgentCoachUpsell.tsx` payment code, use shared router
4. **Result**: Single routing source, 40% less payment code

**Timeline**: Week 1-2  
**Metrics**: Code coverage +30%, payment logic consolidated to 1 module

---

### PHASE 2: Agent Identity & Discovery (NEXT)
**Goal**: Agents can discover and call each other via x402

**Implementation**:
1. Create `src/lib/agents/agent-registry.ts`:
   - Agent metadata: name, capabilities, pricing
   - Health status: uptime, response times
   - Payment terms: which chains accepted, fees

2. Create `aws-lambda/agent-discovery.mjs`:
   - Registry endpoint: `GET /agents?capability=nutrition&maxPrice=0.10`
   - Agent heartbeat: each agent registers/pings every 60s
   - Health tracking with Cloudwatch

3. Create `aws-lambda/inter-agent-router.ts`:
   - Fitness Agent can call: `POST /query` with x402 payment
   - Router finds appropriate Agent B, validates pricing
   - Establishes payment channel via x402

**Interfaces**:
```typescript
interface Agent {
  id: string;
  name: string;
  capabilities: string[];
  endpoint: string;
  pricing: Record<string, number>; // capability -> cost
  acceptedChains: Chain[];
  lastHealthCheck: number;
  uptime: number; // 0-100
}

interface InterAgentRequest {
  agentId: string;
  capability: string;
  payload: unknown;
  maxPrice: number;
  preferredChain?: Chain;
}
```

**Timeline**: Week 3-4  
**Metrics**: 2+ agents registering, successful inter-agent queries logged

---

### PHASE 3: Agent-to-Agent Data Exchange with x402 (PHASE 2 PRIORITY)
**Goal**: Nutrition Agent pays Fitness Agent for user health data

**Scenario**: 
```
Nutrition Agent: "Give me user's last 7 days of workout data"
Fitness Agent: [402 Challenge] "Pay 0.01 USDC"
Nutrition Agent: [Signs & pays via x402] "Here's my payment"
Fitness Agent: [Returns data + mints transaction on-chain]
Nutrition Agent: [Uses data] "Creating optimized meal plan..."
```

**Implementation**:
1. Enhance `aws-lambda/index.mjs`:
   - Add `POST /agent/query-health-data` endpoint
   - Requires x402 payment for data access
   - Logs access to ledger (user can audit who accessed what)

2. Create `aws-lambda/agent-payment-middleware.ts`:
   - Verify agent identity (wallet signature)
   - Check x402 payment before granting access
   - Rate limiting per agent per time period

3. Update `src/lib/cdp.ts`:
   - Track agent data access in user's history
   - User dashboard shows "Agent X accessed your workout data - $0.01"
   - User can revoke agent access at any time

4. Privacy controls in frontend:
   ```typescript
   interface DataAccessPolicy {
     agentId: string;
     allowedDataTypes: string[]; // "workout", "nutrition", "calendar"
     maxMonthlySpend: number;
     expiresAt: number;
   }
   ```

**Timeline**: Week 5-6  
**Metrics**: Agents successfully querying data, transactions recorded on-chain

---

### PHASE 4: Multi-Service Marketplace (FUTURE - Q2)
**Goal**: Calendar, Massage Booking, Nutrition agents all coordinate via x402

**Architecture**:
1. Extend Agent Registry with capability tiers:
   - Fitness Coach (required)
   - Nutrition Planner (optional, +$0.03 per plan)
   - Massage Booking (optional, +$0.50 per session)
   - Calendar Coordinator (free, embedded in coach)

2. SmartContract: `BookingOrchestrator.sol`:
   - User sets budget for services ($1.00/week)
   - Coach Agent can allocate budget across services
   - All x402 payments flow through RevenueSplitter
   - User receives detailed breakdown

3. Booking flow via x402:
   ```
   Coach Agent → Calendar Agent: "Book 3 sessions this week"
   Calendar Agent → Massage Booking Agent: "Find 3 slots for massage"
   Massage Booking Agent: [402] "Each slot costs $0.15"
   Calendar Agent: [Pays via x402] "Book these 3 slots"
   Massage Booking Agent: [Adds to calendar, settles payment]
   Calendar Agent: Updates user calendar
   ```

**Timeline**: Q2 2025

---

### PHASE 5: Autonomous Agent Chaining (FUTURE - Q3)
**Goal**: Complex requests trigger chains of agent calls, each settling independently

**Example**:
```
User: "Optimize my fitness for tennis performance"

Coach Agent:
  1. Queries Benchmark Agent [x402 payment]
  2. Requests Nutrition Agent's analysis [x402 payment]
  3. Asks Calendar Agent for 3-month availability [free]
  4. Requests Sport-Specific Training from Tennis Agent [x402 payment]
  5. Coordinates all into 12-week plan

Each agent pays its dependencies from its own budget.
User sees transparent cost breakdown:
  - Coach Agent: $0.10
  - Nutrition: $0.05
  - Benchmark: $0.02
  - Tennis Coach: $0.08
  Total: $0.25 (all from coaching budget)
```

**Timeline**: Q3 2025

---

## 🔒 Privacy & Consent Layer

All agent-to-agent data exchange requires explicit user consent:

**User Dashboard**:
```
🔐 Agent Permissions

✅ Fitness Coach (Internal)
   - Can access: Workout data, form metrics, calendar
   
❌ Nutrition Planner (disabled)
   - Would access: Workout data, body metrics
   - Cost: $0.03 per meal plan
   [Enable this agent]

❌ Massage Booking (disabled)
   - Would access: Availability calendar
   - Cost: $0.50 per booking
   [Enable this agent]

📊 Data Access Audit Log
  [Today 10:30am] Fitness Coach accessed workout data
  [Today 9:15am] Nutrition Agent accessed body metrics ($0.03)
```

**Smart Contract**: `DataAccessControl.sol`
- User can revoke agent access instantly
- Agent must request permission before each query type
- All x402 payments logged immutably

---

## 📋 Implementation Checklist (Ordered by Principle Priority)

### AGGRESSIVE CONSOLIDATION (Week 1-2)
- [ ] Audit payment logic across all components
- [ ] Extract to single `payment-router.ts` module
- [ ] Remove duplicate payment code from upsell components
- [ ] Create unit tests for router

### ENHANCEMENT FIRST (Week 3-4)
- [ ] Enhance Bedrock Agent with network health awareness
- [ ] Add agent routing decision to agent tools
- [ ] Bedrock Agent autonomously selects chain based on conditions

### DRY (Week 3-6)
- [ ] Agent Registry becomes single source of truth for agent info
- [ ] Payment Router uses Registry for pricing
- [ ] Frontend uses Discovery API instead of hardcoded agents

### CLEAN & MODULAR (Week 5-6)
- [ ] Separate concerns: Discovery, Routing, Payment, Privacy
- [ ] Each module has clear interfaces and dependencies
- [ ] Clear error handling for failed inter-agent calls

### PERFORMANT (Week 5-6)
- [ ] Cache agent registry (TTL 5 min)
- [ ] Rate limit agent queries (avoid DDoS)
- [ ] Monitor gas prices, update routing decisions every 10s

---

## 🎯 Success Metrics

**Phase 1**: 
- [ ] Single payment router handling 100% of payment decisions
- [ ] Bedrock Agent autonomously chooses chain (logs show routing decisions)

**Phase 2**:
- [ ] 3+ agents registering in discovery
- [ ] Agents successfully querying each other

**Phase 3**:
- [ ] Nutrition Agent successfully queries Fitness Agent data via x402
- [ ] Data access audit log visible in user dashboard

**Phase 4**:
- [ ] Booking flow works across 3+ agents
- [ ] User can enable/disable services and see cost breakdown

**Overall**:
- [ ] Revenue increasing (more agents = more users)
- [ ] Code complexity decreasing (consolidation benefits)
- [ ] Agent economy is the primary feature, not a secondary payment system