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
│  Payments    →  x402 + Immediate Settlement            │
│  Base        →  USDC (Base Sepolia) - Agent discovery  │
│  Avalanche   →  USDC (Fuji) - Primary settlement       │
│  Solana      →  SOL/USDC (Devnet) - Fallback           │
│  Registry    →  AgentRegistry.sol - Agent profiles     │
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

### AgentRegistry Smart Contract ✅ DEPLOYED

Production deployments on testnet chains:
- **Base Sepolia**: `0xfE997dEdF572CA17d26400bCDB6428A8278a0627`
  - Verified: https://base-sepolia.blockscout.com/address/0xfE997dEdF572CA17d26400bCDB6428A8278a0627?tab=contract
- **Avalanche Fuji**: `0x1c2127562C52f2cfDd74e23A227A2ece6dFb42DC`
  - Verified: https://repo.sourcify.dev/43113/0x1c2127562C52f2cfDd74e23A227A2ece6dFb42DC/

**Smart Contract Features:**
- Agent registration (name, endpoint, capabilities, pricing)
- Discovery queries (find agents by capability, reputation, SLA)
- Pricing management (per-capability, per-tier: basic/pro/premium)
- Reputation tracking (heartbeat, uptime calculation, success rates)
- No escrow: agents paid immediately via x402

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

#### Phase 1: User-Agent Payment Routing ✅ COMPLETE
**Goal**: Single source of truth for payment logic, agent-driven network selection
- **Status**: Implemented (`src/lib/payments/payment-router.ts`)
- **Outcome**: Consolidated scattered payment logic from 3 components into 1 unified router class.
- **Mechanics**:
  - `PaymentRouter.execute()` transparently handles 402 negotiation
  - Supports both EVM (Base/Ava) and Solana flows
  - Used by both UI components and Agent logic

#### Phase 2: Agent Identity & Discovery ✅ COMPLETE (Alpha)
**Goal**: Agents can discover and call each other via x402
- **Status**: Implemented with **REAP PROTOCOL INTEGRATION** (`aws-lambda/agent-discovery.mjs`)
- **Registry**: Lambda-based hybrid discovery:
  - Real agents via **Reap Protocol** (`x402` & `A2A` registries)
  - Core agents as fallback (always available)
  - `GET /agents?capability=nutrition_planning`: Queries Reap first
  - `POST /agents/register`: Dynamic registration
  - `POST /agents/heartbeat`: Liveness check
- **Reap Integration** (`aws-lambda/lib/reap-integration.mjs`):
  - `searchAgents(capability, protocol)`: Find real specialists
  - `discoverAgentsHybrid()`: Unified Reap + core discovery
  - Deduplication & reputation sorting
- **Client**: `AgentRegistry` class logs discovery source (reap-protocol-hybrid vs core-agents)

#### Phase 3: Agent-to-Agent Data Exchange ✅ COMPLETE (Alpha)
**Goal**: Nutrition Agent pays Fitness Agent for user health data
- **Status**: Implemented & Verified (`test-inter-agent.mjs`)
- **Flow**:
  1. Nutrition Agent requests `data_query` from Fitness Agent
  2. Fitness Agent (Server) returns 402 Challenge ($0.01)
  3. Nutrition Agent (Client) signs challenge via `AgentClient`
  4. Payment Verified → Data Returned
- **Pricing**: Differential pricing implemented ($0.05 analysis vs $0.01 data)

#### Phase 3.5: Real Inter-Agent Payments (CURRENT - Dec 2024)
**Goal**: Migrate from simulated payments to REAL blockchain settlement
- **Status**: COMPLETE ✅ - x402 V2 Agent Economy Ready
- **Architecture Decision**: Focus on owned agents + x402, defer external discovery
  - **CORE_AGENTS** (3): Fitness Coach, Nutrition Planner, Recovery Booking
    - Registered on AgentRegistry.sol (Base Sepolia & Avalanche Fuji)
    - Full x402 payment support with SLA tracking
    - Real reputation scoring on-chain
  - **Future Integration**: Reap Protocol discovery when API stabilizes
    - Reap's agent discovery endpoints not yet available
    - Will integrate via x402 V2 Discovery extension when live
    - No breaking changes needed—x402 V2 backward compatible
- **x402 V2 Alignment**:
  1. **Multi-chain by default** ✅ - Base Sepolia & Avalanche Fuji
  2. **Dynamic payTo routing** ✅ - Per-agent payment addresses
  3. **Plugin-driven discovery** 🔄 - Ready for Reap discovery
  4. **Wallet-based access** 🔄 - SIWx coming in x402 V2
  5. **Automatic service metadata** 🔄 - AgentRegistry acts as metadata source

#### Phase 4: Multi-Service Marketplace (FUTURE - Q2)
**Goal**: Calendar, Massage Booking, Nutrition agents all coordinate via x402
- **Status**: Planned (depends on Phase 3.5 real payments)
- **Architecture**:
  1. Extend Agent Registry with capability tiers
  2. SmartContract: `BookingOrchestrator.sol`
  3. User sets budget for services ($1.00/week)


---

### PHASE 4: Multi-Service Marketplace (FUTURE - Q2)
**Goal**: Calendar, Massage Booking, Nutrition agents all coordinate via x402

**Architecture**:
1. Extend Agent Registry with capability tiers:
   - Fitness Coach (required)
   - Nutrition Planner (optional, +$0.03 per plan)
   - Massage Booking (optional, +$0.50 per session)
   - Calendar Coordinator (free, embedded in coach)

2. Coach Agent orchestrates x402 negotiation:
   - User requests full coaching
   - Coach discovers specialists via Reap
   - Coach pays each via x402 micropayments
   - All settlements recorded on-chain

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