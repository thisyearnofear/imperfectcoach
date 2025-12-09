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

## 💰 x402 Multi-Chain Payment Infrastructure

### x402 Protocol: Server-Driven, AI-Agent Native

**What is x402?** An open payment protocol (Coinbase/x402 Foundation) that revives HTTP 402 for machine-to-machine commerce. It allows AI agents to autonomously pay for API access without accounts, pre-authorization, or complex authentication. The protocol is blockchain-agnostic and designed for the AI agent economy.

**Key Principle:** Server specifies payment requirements. Client signs proof of intent. Settlement happens server-side.

### Correct x402 Flow (NOT Traditional Payments)

```
1. CLIENT REQUEST (no payment)
   POST /analyze-workout
   { workoutData, userAddress }
   
2. SERVER CHALLENGE (402 Payment Required)
   HTTP 402
   {
     "amount": "50000",        // microunits (0.05 USDC)
     "asset": "USDC",
     "network": "base-sepolia", // SERVER SPECIFIES
     "payTo": "0x...",
     "scheme": "eip-191",
     "timestamp": 1234567890,
     "nonce": "uuid"
   }
   
3. CLIENT SIGNS CHALLENGE
   Sign exact challenge from server (not custom message)
   signature = wallet.sign(challenge)
   
4. CLIENT RETRY (with signature)
   POST /analyze-workout
   Header: X-Payment: base64(challenge + signature)
   
5. SERVER VERIFIES & SETTLES
   - Verify signature matches challenge
   - Settle payment onchain
   - Return resource (HTTP 200)
```

### Supported Networks

| Network | Asset | Use Case | Status |
|---------|-------|----------|--------|
| **Base Sepolia** | USDC | Premium ($0.05) & Agent ($0.10) | ✅ Active |
| **Avalanche C-Chain** | USDC | Premium tier | ✅ Active |
| **Solana Devnet** | USDC | Micro-payments | ✅ Active |

The server returns `challenge.network` based on context. The client uses that network—**no client-side chain selection**.

### Technical Implementation (Fixed)

**Old (WRONG):** Client tries to "process" payments, route intelligently, settle transactions  
**New (CORRECT):** Client only signs challenges. Server handles everything.

Key files:
- `src/lib/payments/x402-signer.ts` - Simple signer (sign + retry)
- `src/lib/payments/x402-chains.ts` - Network configurations
- `aws-lambda/index.mjs` - Server returns 402, verifies signatures

**Removed complexity:**
- ❌ `X402UnifiedHandler` (overly complex)
- ❌ `PaymentRouter` (client shouldn't choose chains)
- ❌ Custom message signing (use server's challenge)
- ❌ "Smart routing" logic (server decides)

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

## 🎯 Dual-Chain Equal Partnership Architecture

### Current vs. Proposed

#### Current (Base-Only)

```
┌─────────────────────────────────────────────────────────┐
│                    Imperfect Coach App                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Header                                                 │
│  ├─ MultiChainWallet → wagmi (Base only)               │
│  └─ NetworkStatus → Base Sepolia                       │
│                                                          │
│  UserContext (EVM/Base)                                 │
│  ├─ connectWallet() → Coinbase wallet                  │
│  ├─ signInWithEthereum() → SIWE signature              │
│  └─ submitScore() → Base contract (CoachOperator)      │
│                                                          │
│  Leaderboard                                            │
│  ├─ useReadContract(JUMPS_LEADERBOARD)                 │
│  └─ useReadContract(PULLUPS_LEADERBOARD)               │
│                                                          │
└─────────────────────────────────────────────────────────┘
         │
         ▼
   ┌──────────────────┐
   │  Base Sepolia    │
   │  Contracts       │
   │  (on-chain)      │
   └──────────────────┘

❌ BLOCKER: Solana-only users can't use app
❌ BLOCKER: Only reads from Base contracts
```

#### Proposed (Dual-Chain Equal Partnership)

```
┌─────────────────────────────────────────────────────────┐
│                    Imperfect Coach App                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Header                                                 │
│  ├─ UnifiedWallet (Enhanced)                           │
│  │  ├─ Base address (wagmi) + disconnect               │
│  │  └─ Solana address (adapter) + disconnect           │
│  └─ NetworkStatus → dual chain aware                   │
│                                                          │
│  UserContext (Enhanced - Per-Chain Auth)                │
│  ├─ Base path:                                          │
│  │  ├─ connectWallet() → Coinbase                      │
│  │  └─ signInWithEthereum() → SIWE                     │
│  ├─ Solana path:                                        │
│  │  ├─ connectSolanaWallet() → Phantom/Solflare        │
│  │  └─ web3 auth (wallet signature)                    │
│  └─ shared submitScore() → routes to correct contract  │
│                                                          │
│  Leaderboard (Enhanced - Dual Contract Read)            │
│  ├─ Chain filter: "All" / "Base" / "Solana"           │
│  ├─ Parallel reads:                                    │
│  │  ├─ Base: useReadContract(JUMPS + PULLUPS)         │
│  │  └─ Solana: useReadContract(LEADERBOARD_PROGRAM)   │
│  └─ Unified display from BOTH contracts                │
│                                                          │
└─────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
   ┌──────────────────┐        ┌──────────────────┐
   │ Base Sepolia     │        │ Solana Devnet    │
   │ Contracts        │        │ Leaderboard      │
   │ (CoachOperator)  │        │ Program          │
   │ JUMPS_LEADERBOARDupload │         │
   │ PULLUPS_LEADERBOARD    │        │
   └──────────────────┘        └──────────────────┘
         ▲                              ▲
         │                              │
    Submit from                    Submit from
    Base wallet                    Solana wallet
    (on-chain)                     (on-chain)

✅ Solana-only users: connect Solana → submit to Solana contract → leaderboard
✅ Base-only users: unchanged behavior (still works)
✅ Multi-chain users: both wallets connected, both contracts read
✅ Unified leaderboard: Read from BOTH contracts, display together
✅ True decentralization: All scores on-chain from day 1
```

## Data Models

### Leaderboard Score (Base Contract)
```typescript
// Existing - no changes
type BaseLeaderboardEntry = {
  user: string;                 // 0x... address
  pullups: number;
  jumps: number;
  totalScore: bigint;           // pullups + jumps
  bestSingleScore: bigint;
  submissionCount: bigint;
  lastSubmissionTime: bigint;   // unix seconds
};
```

### Leaderboard Score (Solana Program)
```typescript
// New - matches Base structure for unified display
type SolanaLeaderboardEntry = {
  user: string;                 // Solana pubkey
  pullups: number;
  jumps: number;
  totalScore: bigint;           // pullups + jumps
  bestSingleScore: bigint;
  submissionCount: bigint;
  lastSubmissionTime: bigint;   // unix seconds
};
```

### Unified Leaderboard Display
```typescript
type UnifiedLeaderboardEntry = {
  user: string;                 // 0x... or solana addr
  chain: 'base' | 'solana';    // which contract it came from
  pullups: number;
  jumps: number;
  totalScore: number;
  submissionCount: number;
  lastSubmissionTime: bigint;
};
```

### User Auth State (Enhanced UserContext)
```typescript
type UserState = {
  // Base (EVM)
  address?: string;
  isConnected: boolean;
  isAuthenticated: boolean;    // SIWE signed
  
  // Solana (NEW)
  solanaAddress?: string;
  isSolanaConnected: boolean;
  
  // Shared
  isLoading: boolean;
  error?: string;
};

type UserActions = {
  // Base
  connectWallet: () => Promise<void>;
  signInWithEthereum: () => Promise<void>;
  signOut: () => void;           // disconnects Base
  
  // Solana (NEW)
  connectSolanaWallet: () => Promise<void>;
  disconnectSolana: () => void;
  
  // Shared
  submitScore: (pullups, jumps) => Promise<{ hash?: string }>;
};
```

## 🎯 Development Patterns & Commands

### Core Principles
```
✅ ENHANCEMENT FIRST: Extend existing components, don't rewrite
✅ AGGRESSIVE CONSOLIDATION: Delete unused code, no deprecation
✅ PREVENT BLOAT: Audit before adding, consolidate ruthlessly
✅ DRY: Single source of truth for all shared logic
✅ CLEAN: Clear separation of concerns with explicit dependencies
✅ MODULAR: Composable, testable, independent modules
✅ PERFORMANT: Adaptive loading, caching, resource optimization
✅ ORGANIZED: Predictable file structure, domain-driven design
```

### File Organization

#### Current Structure
```
src/
├── contexts/
│   ├── UserContext.tsx          ← Main auth + blockchain state
│   └── SocialContext.tsx
├── components/
│   ├── Header.tsx               ← Top navigation
│   ├── UnifiedWallet.tsx         ← Wallet display & connection
│   ├── Leaderboard.tsx           ← Leaderboard display
│   ├── TableLeaderboard.tsx      ← Table variant
│   └── ... (many UI components)
├── hooks/
│   ├── useUserHooks.ts           ← Custom hook for UserContext
│   └── ... (domain-specific hooks)
├── lib/
│   ├── types.ts                  ← Shared types
│   ├── contracts.ts              ← Contract configs
│   ├── cdp.ts                    ← Coinbase integrations
│   └── ... (utilities)
├── integrations/
│   └── supabase/
│       ├── client.ts             ← Supabase client
│       └── types.ts              ← Generated types
└── pages/
    └── Index.tsx                 ← Main app page
```

### Patterns: Enhancement vs. Creation

#### Pattern 1: Enhancing Existing Context

**DON'T**: Create new context
```typescript
// ❌ WRONG
export const SolanaContext = createContext(...);

export const SolanaProvider = ({ children }) => { ... };
```

**DO**: Extend existing context
```typescript
// ✅ RIGHT
export interface UserState {
  // Existing
  address?: string;
  isConnected: boolean;
  
  // Enhanced (Phase 1)
  solanaAddress?: string;
  isSolanaConnected: boolean;
}

export const UserProvider = ({ children }) => {
  const { address, isConnected } = useAccount();        // Base (wagmi)
  const { solanaAddress, isSolanaConnected } = useSol(); // Solana (new)
  
  // Single context exports both
};
```

#### Pattern 2: Enhancing Existing Component

**DON'T**: Create new component for Solana wallet
```typescript
// ❌ WRONG
export const SolanaWallet = () => { ... };
export const BaseWallet = () => { ... };

// Then in Header:
<BaseWallet />
<SolanaWallet />
```

**DO**: Extend existing wallet component with variant
```typescript
// ✅ RIGHT
interface UnifiedWalletProps {
  variant?: 'header' | 'card' | 'inline';
  chains?: 'base' | 'solana' | 'all';  // NEW
}

export const MultiChainWallet = ({ variant = 'header', chains = 'all' }) => {
  // Existing component enhanced
  const { address } = useAccount();           // Base
  const { solanaAddress } = useSolana();     // Solana (new)
  
  if (variant === 'header' && chains === 'all') {
    return (
      <div className="flex gap-2">
        <BaseAddressBadge address={address} />
        <SolanaAddressBadge address={solanaAddress} />
      </div>
    );
  }
};
```

#### Pattern 3: Adding New Domain Module (OK to create)

**OK**: Create new utility module for new domain
```typescript
// ✅ OK (new domain, no existing equivalent)
src/lib/supabase/leaderboard.ts

export async function submitScore(
  address: string,
  chain: 'base' | 'solana',
  pullups: number,
  jumps: number
): Promise<void> {
  const { error } = await supabase
    .from('leaderboard_scores')
    .insert({ user_address: address, chain, pullups, jumps, timestamp: Date.now() });
  
  if (error) throw error;
}

export async function getLeaderboard(
  limit: number = 100,
  chain?: 'base' | 'solana'
): Promise<LeaderboardScore[]> {
  let query = supabase
    .from('leaderboard_scores')
    .select('*')
    .order('total_score', { ascending: false })
    .limit(limit);
  
  if (chain) query = query.eq('chain', chain);
  
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
```

**Rationale**:
- New domain (Supabase helpers) didn't exist before
- Follows existing pattern (like `lib/cdp.ts`, `lib/contracts.ts`)
- Self-contained, testable, reusable

## Patterns: Data Flow

### Pattern: Smart State Management

**Separate concerns**:
```typescript
// ❌ WRONG - mixing too much
const [userState, setUserState] = useState({
  address, isConnected, solanaAddress, isSolanaConnected,
  leaderboard, isLeaderboardLoading,
  score, timeUntilSubmit, ...15 more fields
});

// ✅ RIGHT - separate by concern
const [authState, setAuthState] = useState({ ... });
const [blockchainState, setBlockchainState] = useState({ ... });
const [refreshState, setRefreshState] = useState({ ... });

// Already done in UserContext!
```

### Pattern: Data Flow Direction

**Single direction** (from leaf to root):
```
Component (needs data)
  ↑
  └─ useUser() hook
     ↑
     └─ UserContext provider
        ↑
        └─ Component tree
```

**NOT circular**:
```
❌ Component ↔ Context (two-way updates)
✅ Component → useContext() (one-way read)
✅ Component → useContext().action() (method call, not state update)
```

### Pattern: Async Operations

**Use effects for side effects**:
```typescript
// ✅ RIGHT
useEffect(() => {
  const loadLeaderboard = async () => {
    const data = await getLeaderboard();
    setLeaderboard(data);
  };
  
  loadLeaderboard();
}, [dependency]);

// ❌ WRONG - no async in useEffect directly
useEffect(async () => {
  const data = await getLeaderboard();
}, []);
```

## 🧪 Testing Strategy

### Unit Tests
```bash
npm run test
```

**Focus areas:**
- Utility functions (lib/utils.ts)
- Hook logic
- Form calculations
- Payment validation

### Integration Tests
```bash
npm run test:e2e
```

**User journeys:**
- Complete free workout
- Purchase premium analysis
- Unlock agent coaching
- View leaderboard

### Agent Testing

**Local Lambda test:**
```bash
cd aws-lambda
node test-agent.js
```

**Production endpoint test:**
```bash
curl -X POST <API_GATEWAY_URL>/agent-coach \
  -H "Content-Type: application/json" \
  -d @test-payload.json
```

### Payment Testing

**Mock signature generation:**
```javascript
import { privateKeyToAccount } from 'viem/accounts';

const account = privateKeyToAccount(TEST_PRIVATE_KEY);
const signature = await account.signMessage({
  message: 'I authorize payment for premium analysis'
});
```

## ☁️ Deployment Workflows

### Frontend (Netlify)

```bash
# Build
npm run build

# Preview locally
npm run preview

# Deploy (automatic on git push to main)
# Manual deploy:
netlify deploy --prod
```

**Environment variables (Netlify):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_AWS_API_ENDPOINT`

### Supabase Edge Functions

```bash
# Deploy coach-gemini
supabase functions deploy coach-gemini

# View logs (requires local setup)
supabase functions logs coach-gemini
```

**Secrets required:**
```bash
supabase secrets set GEMINI_API_KEY=xxx
supabase secrets set OPENAI_API_KEY=xxx
supabase secrets set ANTHROPIC_API_KEY=xxx
```

### AWS Lambda

**Agent Lambda:**
```bash
cd aws-lambda
./deploy-agent.sh
```

**Manual deployment:**
```bash
zip -r function.zip .
aws lambda update-function-code \
  --function-name imperfect-coach-agent \
  --zip-file fileb://function.zip \
  --region eu-north-1
```

### Smart Contracts

**Using Remix IDE:**
1. Open contract in Remix
2. Compile with Solidity 0.8.19+
3. Connect MetaMask to Base Sepolia
4. Deploy with constructor parameters
5. Verify on BaseScan

## 🚀 AWS Services Configuration

### Required Services ✅

1. **Amazon Bedrock** ✅
   - Model: Amazon Nova Lite (`amazon.nova-lite-v1:0`)
   - Usage: LLM for agent reasoning and decision-making
   
2. **Amazon Bedrock AgentCore** ✅
   - Primitives Used:
     - Tool use (function calling)
     - Multi-step reasoning loops
     - Autonomous decision-making

3. **AWS Lambda** ✅
   - Function: `agent-coach-handler`
   - Runtime: Node.js 18+
   - Purpose: Hosts agent reasoning loop and tool execution

### Optional Helper Services

4. **Amazon API Gateway** ✅
   - Purpose: REST API endpoint for agent invocation
   
5. **Amazon S3** (planned)
   - Purpose: Store workout history and training plans

## 📊 Monitoring & Debugging

### CloudWatch Logs
**Filter patterns:**
- Errors: `[timestamp, level=ERROR, ...]`
- Specific agent tool: `"toolsUsed".*"analyze_pose_data"`
- Payment events: `"Payment verified"`

### BaseScan Monitoring
**Track these contracts:**
- RevenueSplitter: `0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA`
- ImperfectCoachPassport: `0x7c95712a2bce65e723cE99C190f6bd6ff73c4212`
- CoachOperator: `0xdEc2d60c9526106a8e4BBd01d70950f6694053A3`

### Frontend Debugging
```typescript
// Enable verbose logging
localStorage.setItem('debug', 'imperfect-coach:*');

// Disable
localStorage.removeItem('debug');
```

## 🐛 Common Issues & Solutions

### Issue: Agent Lambda timeout
**Symptoms:** 30-second timeout, no response
**Solutions:**
- Increase Lambda timeout to 60s
- Reduce MAX_ITERATIONS to 3
- Optimize tool implementations

### Issue: Signature verification fails
**Symptoms:** "Invalid wallet signature" error
**Solutions:**
- Verify message format exactly matches
- Check wallet address matches signer
- For smart wallets, ensure EIP-1271 support

### Issue: Payment not settling
**Symptoms:** 402 error after valid signature
**Solutions:**
- Verify X-Payment header present
- Check CDP account has USDC balance
- Review x402 protocol integration
- Test Solana x402 multi-chain payments
- Verify smart chain routing logic
- Test fallback mechanisms (Solana → Base)

### Issue: Component re-rendering too often
**Symptoms:** Sluggish UI, high CPU
**Solutions:**
- Use React.memo for pure components
- Move expensive calculations to useMemo
- Use useCallback for event handlers

## ✅ Code Quality Standards

### TypeScript
- Strict mode enabled
- No `any` types (use `unknown` or proper types)
- Interfaces for all props and data structures
- Proper error handling with typed errors

### React Patterns
```typescript
// ✅ Good
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ 
  onClick, 
  children, 
  variant = 'primary' 
}) => {
  return <button className={variantStyles[variant]} onClick={onClick}>
    {children}
  </button>;
};

// ❌ Bad
export const Button = (props: any) => {
  return <button onClick={props.onClick}>{props.children}</button>;
};
```

### Error Handling
```typescript
// Always handle errors gracefully
try {
  await callAPI();
} catch (error) {
  console.error('API call failed:', error);
  toast.error('Something went wrong. Please try again.');
  // Log to error tracking service
  Sentry.captureException(error);
}
```

## 📋 Contribution Guidelines

### Before Starting
1. Read existing code to understand patterns
2. Check for similar functionality before adding new features
3. Review this guide for standards

### PR Requirements
- [ ] Tests pass (`npm run test`)
- [ ] Types are correct (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] No console.logs (use proper logging)
- [ ] Component documented (JSDoc comments)
- [ ] Mobile-responsive
- [ ] Accessible (ARIA labels, keyboard navigation)

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

## 💪 Pull-Up Detection & Communication Improvements

### Overview
Enhanced pull-up detection communication to address user confusion about camera requirements and body positioning. All improvements follow core principles: enhancing existing components, consolidating code, maintaining clean UI.

### Changes Made

#### 1. **ReadinessSystem.ts** - Implemented Pull-Up Posture Analysis
**File:** `src/lib/pose-readiness/ReadinessSystem.ts`

**What Changed:**
- Filled in the previously empty `analyzePullupPosture()` function
- Added comprehensive pre-workout validation for pull-ups

**Features:**
- ✅ Validates all 13 required keypoints (nose, wrists, elbows, shoulders, hips, knees, ankles)
- ✅ Detects if user is in hanging position vs standing
- ✅ Provides specific feedback for lower body visibility issues
- ✅ Checks upper body critical points (head, hands, shoulders)
- ✅ Suggests optimal camera angles (45° or side view)
- ✅ Progressive scoring system (0-100) with severity-based issues

**Example Feedback:**
- "Step back so camera can see your full body from head to feet"
- "Make sure your head, shoulders, and hands are clearly visible"
- "Try positioning camera at 45° angle or side view for optimal tracking"

#### 2. **PoseDetectionGuide.tsx** - Exercise-Specific Requirements
**File:** `src/components/PoseDetectionGuide.tsx`

**What Changed:**
- Made component exercise-aware (accepts `exercise` prop)
- Added context-specific requirements without cluttering UI

**Features:**
- Shows required keypoints count for each exercise:
  - **Pull-ups:** "Head, hands, elbows, shoulders, hips, knees, feet (13 points)"
  - **Jumps:** "Shoulders, hips, knees, ankles (8 points)"
- Includes camera angle tip for pull-ups: "Tip: Side or 45° angle works best"
- Tasteful, compact design that doesn't overwhelm users

#### 3. **pullupProcessor.ts** - Specific Visibility Feedback
**File:** `src/lib/exercise-processors/pullupProcessor.ts`

**What Changed:**
- Enhanced keypoint visibility checking with specific body part feedback
- Replaced generic "Make sure you're fully in view!" with actionable messages

**Features:**
- Identifies exactly which body parts aren't visible:
  - "Can't see your hands"
  - "Can't see your feet & knees"
- Smart aggregation: "Step back - need to see full body" when 3+ parts missing
- More helpful for users to adjust camera positioning

**Before:** "Make sure you're fully in view!"
**After:** "Can't see your feet" or "Step back - need to see full body"

#### 4. **drawing.ts** - Enhanced Visual Feedback
**File:** `src/lib/drawing.ts`

**What Changed:**
- Improved `drawFormZone()` for pull-ups with better visual cues
- Added labeled reference lines and success indicators

**Features:**
- ✅ "Chin target" line (green) shows where nose needs to reach
- ✅ "Full extension" line (yellow) calculated from arm length
- ✅ Green circle appears around nose when chin is over bar
- ✅ Only shows zones when actually hanging (prevents clutter)
- ✅ Subtle, non-intrusive labels for clarity

### User Experience Improvements

#### Before:
- ❌ No pre-workout guidance for pull-ups
- ❌ Generic "Make sure you're fully in view!" message
- ❌ No indication of required body parts
- ❌ No camera angle suggestions
- ❌ Users confused about setup

#### After:
- ✅ Comprehensive pre-workout readiness check
- ✅ Specific feedback: "Can't see your feet"
- ✅ Clear requirements: "13 points needed"
- ✅ Camera guidance: "Side or 45° angle works best"
- ✅ Visual zones with labels during exercise
- ✅ Success indicator when chin clears bar

### Technical Details

#### Progressive Readiness Scoring
- **Visibility issues:** Check all 13 keypoints with 0.4 confidence threshold
- **Lower body:** Critical for full tracking (-30 pts if <4 visible)
- **Upper body:** Essential for rep counting (-40 pts if <4 visible)
- **Camera angle:** Validates side profile positioning (-15 pts if poor)

#### Visual Communication
- Green line: Chin target at wrist level
- Yellow line: Full extension requirement
- Success circle: Appears when chin over bar
- Labels: "Chin target" and "Full extension" for clarity

#### Feedback Priority
1. High severity: Missing critical keypoints
2. Medium severity: Partial visibility issues
3. Low severity: Camera angle optimization

### Adherence to Core Principles

✅ **ENHANCEMENT FIRST:** Enhanced existing `ReadinessSystem`, `PoseDetectionGuide`, `pullupProcessor`, `drawing`
✅ **AGGRESSIVE CONSOLIDATION:** No new files created, all improvements to existing components
✅ **PREVENT BLOAT:** Minimal code additions, reused existing patterns
✅ **DRY:** Leveraged existing keypoint checking infrastructure
✅ **CLEAN:** Clear separation - readiness in ReadinessSystem, real-time in processor
✅ **MODULAR:** Each component maintains independence
✅ **PERFORMANT:** No additional performance overhead
✅ **ORGANIZED:** Followed existing file structure
✅ **BEAUTIFUL DESIGN:** Subtle, tasteful UI additions without clutter

### Testing Recommendations

1. **Pre-workout:** Test readiness feedback with partial body visibility
2. **Camera angles:** Verify 45° angle detection and suggestions
3. **Hanging detection:** Confirm visual zones appear only when hanging
4. **Real-time feedback:** Test specific body part visibility messages
5. **Visual indicators:** Verify chin target and extension lines appear correctly

### Future Enhancements (Optional)

- Add similar pre-workout calibration for jumps (already has good system)
- Consider showing keypoint confidence scores during setup
- Potential for saved user preferences (camera angle, distance)
- Analytics on common setup issues to further improve guidance

## 📦 Public Leaderboard Deployment Checklist

### Changes Made

#### 1. Contract Simplification ✅
- **File**: `contracts/ExerciseLeaderboard.sol`
- **Changes**:
  - Removed `authorizedOperators` mapping
  - Removed `onlyAuthorizedOperator` modifier
  - Removed `OperatorAuthorized` event
  - Removed `addOperator()` and `removeOperator()` functions
  - Removed `isAuthorizedOperator()` function  
  - Simplified constructor - no longer takes `_initialOperator` parameter
  - Added `require(msg.sender == user)` to `addScore()` - users can only submit their own scores
  - Kept `pause()`/`unpause()` for emergency admin control

#### 2. Deployment Script ✅
- **File**: `scripts/deploy-public-leaderboards.sh`
- Deploys both Pullups and Jumps leaderboards
- Verifies on Basescan
- Outputs addresses for frontend update

### Deployment Steps

#### 1. Deploy Contracts
```bash
# Set your private key (the deployer wallet)
export PRIVATE_KEY="your_private_key_here"

# Run deployment
./scripts/deploy-public-leaderboards.sh
```

**Expected Output:**
```
Pullups: 0x[NEW_ADDRESS]
Jumps:   0x[NEW_ADDRESS]
```

#### 2. Update Frontend
Update `src/lib/contracts.ts` with new addresses:
```typescript
export const PULLUPS_LEADERBOARD_CONFIG: ContractConfig = {
  address: "0x[NEW_PULLUPS_ADDRESS]", // UPDATE THIS
  abi: EXERCISE_LEADERBOARD_ABI,
};

export const JUMPS_LEADERBOARD_CONFIG: ContractConfig = {
  address: "0x[NEW_JUMPS_ADDRESS]", // UPDATE THIS
  abi: EXERCISE_LEADERBOARD_ABI,
};
```

#### 3. Test Submission
1. Connect wallet
2. Complete a workout (jumps or pull-ups)
3. Click "Submit to Leaderboard"
4. Verify transaction succeeds
5. Check leaderboard updates

### What's Different Now

#### Before (Operator Model)
- Only authorized operators could call `addScore()`
- Users couldn't submit directly
- Required backend relayer or manual submission by owner
- Gas estimation failed for regular users

#### After (Public Model)
- **Anyone can call `addScore(address user, uint32 score)`**
- Users submit their own scores: `addScore(myAddress, myScore)`
- Contract validates `msg.sender == user` (you can only submit for yourself)
- Direct submission from frontend - no backend needed
- Standard gas estimation works

### Cleanup TODOs

#### Files to Review/Remove
- [ ] `contracts/CoachOperator.sol` - No longer needed
- [ ] `scripts/authorize-user-operator.sh` - No longer needed  
- [ ] Any operator-related frontend code (if any exists)

#### Frontend Already Clean
- ✅ `useScoreSubmission.ts` already works correctly
- ✅ `BlockchainScoreSubmission.tsx` already passes correct args
- ✅ No operator-specific logic in submission flow

### Security Notes

- Emergency pause/unpause still available to contract owner
- Users can only submit their own scores (enforced by contract)
- ReentrancyGuard still active
- Pausable in case of emergency

### Testing Checklist

- [x] Deploy contracts successfully
  - Pullups: `0xf117057bd019C9680D5C92b48d825C294FA6c197`
  - Jumps: `0xCD12e7B14dE9481297D4f32d98177aEC95fcC444`
- [x] Verify on Basescan (deployments confirmed)
- [x] Update frontend with new addresses
- [x] Update documentation (TECHNICAL_ARCHITECTURE.md)
- [ ] Test wallet connection
- [ ] Test score submission (jumps)
- [ ] Test score submission (pull-ups)
- [ ] Verify leaderboard updates
- [ ] Test with multiple users
- [ ] Verify gas fees are reasonable
- [ ] Check transaction explorer links work

### Rollback Plan

If issues occur:
1. Keep old contract addresses in git history
2. Can revert `src/lib/contracts.ts` to old addresses
3. Old contracts still functional (but require operator authorization)


---

## 🎯 Hackathon: Avalanche Hack2Build Payments x402

**Timeline:** November 27 - December 12, 2025

**Implementation Status:** ✅ Complete
- Base Sepolia: EVM signature verification (eip-191)
- Avalanche C-Chain: EVM signature verification (eip-191) 
- Solana Devnet: Ed25519 signature verification (tweetnacl)

**Test Commands:**
```bash
# EVM (Base or Avalanche)
node aws-lambda/test-x402-with-signature.mjs [base-sepolia|avalanche-c-chain]

# Solana
node aws-lambda/test-x402-solana.mjs
```

---

*Built with Enhancement-First principles for Hack2Build: Payments x402*