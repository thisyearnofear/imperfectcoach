# 🏗️ Technical Architecture

**Imperfect Coach System Design & Implementation**

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

#### 1. `analyze_pose_data`
- Deep form analysis from TensorFlow.js pose detection
- Identifies asymmetries, ROM issues, technique problems
- Returns form score, detected issues, and technique tips

#### 2. `query_workout_history`
- Retrieves user's training patterns from database
- Analyzes consistency, progress trends, and plateaus
- Provides context for personalized recommendations

#### 3. `benchmark_performance`
- Compares user against athlete database
- Calculates percentile rankings by experience level
- Sets realistic goals based on similar athletes

#### 4. `generate_training_plan`
- Creates personalized 4-week programs
- Implements progressive overload principles
- Adapts to detected weaknesses and goals

### Multi-Step Reasoning Flow

**Example: Pull-up Analysis**

```
Step 1: Initial Analysis
├─ Agent: "I need to analyze the pose data first"
├─ Tool: analyze_pose_data
└─ Result: Asymmetry detected (right side 8% stronger)

Step 2: Context Gathering
├─ Agent: "Is this a pattern or one-off?"
├─ Tool: query_workout_history
└─ Result: Consistent right-side dominance over 8 sessions

Step 3: Performance Benchmarking
├─ Agent: "How does this compare to peers?"
├─ Tool: benchmark_performance
└─ Result: 75th percentile, but form limiting progress

Step 4: Solution Generation
├─ Agent: "Create corrective program"
├─ Tool: generate_training_plan
└─ Result: 4-week unilateral strength focus

Step 5: Synthesis
└─ Comprehensive coaching with actionable plan
```

## 💰 Multi-Chain Payment Infrastructure

### x402pay Multi-Chain Integration ✅ IMPLEMENTED

**Protocol:** Pay-per-use AI analysis without subscriptions  
**Networks:** 
- **Base Sepolia** (Premium/Agent) - USDC ✅ Existing Infrastructure
- **Solana Devnet** (Micro-payments) - SOL/USDC ✅ NEW Implementation
**Smart Routing:** ✅ Automatic chain selection based on transaction value (<100ms decision time)

### Intelligent Routing Logic ✅ BUILT
```typescript
// Intelligent chain selection based on transaction context
if (amount < $0.01) → Solana (ultra-low fees)
if (context === 'agent') → Base (established infrastructure)  
if (context === 'premium') → User choice with cost optimization
```

### Enhanced Multi-Chain Flow ✅ ACTIVE
```
User Request → Smart Chain Analysis → Optimal Route Selection → x402 Challenge → 
Wallet Sign (Base/Solana) → Multi-Chain Transfer → Unified Treasury → 
AI Processing → Analysis Delivery
```

### Technical Implementation:
- **Payment Router**: `UnifiedPaymentRouter` with network health monitoring
- **Chain Selector UI**: Real-time fee comparison and selection
- **Unified Handler**: `X402UnifiedHandler` consolidating all payment logic
- **Fallback System**: Graceful degradation to Base if Solana fails

## 📜 Smart Contracts

### RevenueSplitter
**Address:** `0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA`

**Purpose:** Autonomous revenue distribution from user payments

**Key Functions:**
- `receive()`: Accept USDC payments from x402
- `distribute()`: Split funds to treasury addresses
- Payees: Platform (70%), Rewards (20%), Referrers (10%)

### ImperfectCoachPassport
**Address:** `0x7c95712a2bce65e723cE99C190f6bd6ff73c4212`

**Purpose:** Soulbound NFT tracking user progress

**Features:**
- Non-transferable user identity
- Stores level, totalReps, achievements
- Updated by CoachOperator after workouts

### CoachOperator
**Address:** `0xdEc2d60c9526106a8e4BBd01d70950f6694053A3`

**Purpose:** On-chain agent with permission to update passports

### ExerciseLeaderboard (Public Access)
**Pullups Contract:** `0xf117057bd019C9680D5C92b48d825C294FA6c197`  
**Jumps Contract:** `0xCD12e7B14dE9481297D4f32d98177aEC95fcC444`

**Purpose:** Permanent on-chain workout records  
**Architecture:** Public submission model - users submit their own scores directly  
**Security:** Users can only submit scores for themselves (`msg.sender == user`)  
**Admin:** Emergency pause/unpause available to contract owner

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

### Payments
- x402pay protocol
- CDP Wallet (autonomous treasury)
- USDC on Base & SOL/USDC on Solana
- Multi-chain smart routing

---
*Built with Enhancement-First principles for Solana x402 Hackathon*