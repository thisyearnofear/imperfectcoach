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

### x402 Protocol: Server-Driven, AI-Agent Native

The x402 protocol allows AI agents to autonomously pay for API access without accounts or pre-authorization. We leverage **0xGasless AgentKit** to provide our agents with on-chain identity and autonomous payment capabilities.
 
**Agent-to-Agent Economy:**
- **Identity**: Agents use 0xGasless Smart Accounts (ERC-4337)
- **Settlement**: Instant, gasless payments on Base/Avalanche
 
**Correct x402 Flow:**
```
1. Client makes request without payment
2. Server returns HTTP 402 with payment challenge
3. Client signs the exact challenge from server
4. Client retries with signed challenge in header
5. Server verifies signature and settles payment
```

### Supported Networks
| Network | Asset | Use Case | Status |
|---------|-------|----------|--------|
| **Base Sepolia** | USDC | Premium ($0.05) & Agent ($0.10) | ✅ Active |
| **Avalanche C-Chain** | USDC | Premium tier | ✅ Active |
| **Solana Devnet** | USDC | Micro-payments | ✅ Active |

### Technical Implementation
- `src/lib/payments/x402-signer.ts` - Client signer (EOA & Smart compatible)
- `src/lib/payments/x402-chains.ts` - Network configurations
- `aws-lambda/index.mjs` - Server uses **0xGasless AgentKit** for identity & verification
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