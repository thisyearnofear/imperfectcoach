# Development Guide - Imperfect Coach

**Internal Reference for Contributors**

---

## Project Architecture

### Technology Stack

**Frontend:**
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui components
- TensorFlow.js + MediaPipe for pose detection
- Wagmi + Viem for blockchain interactions

**Backend:**
- Supabase Edge Functions (real-time AI coaching)
- AWS Lambda + Bedrock AgentCore (autonomous agent)
- Smart Contracts on Base Sepolia

**AI/ML:**
- Amazon Bedrock AgentCore
- Amazon Nova Lite model
- Gemini, OpenAI, Anthropic (real-time tier)
- TensorFlow.js (pose estimation)

### Project Structure

```
imperfectcoach/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn components
│   │   ├── sections/       # Layout sections
│   │   └── *.tsx           # Feature components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities, types, constants
│   └── App.tsx             # Main application
├── aws-lambda/             # AWS Lambda functions
├── supabase/               # Edge functions
├── contracts/              # Solidity contracts
└── docs/                   # Documentation
```

---

## Development Principles

### 1. Enhancement First
- Enhance existing components before creating new ones
- Consolidate similar functionality
- Avoid feature bloat

### 2. Aggressive Consolidation
- DRY: Don't Repeat Yourself
- Create reusable utilities and hooks
- Centralize configuration (colors, spacing, tiers)

### 3. Performance Focused
- Lazy load heavy components
- Use `useMemo` for expensive calculations
- Optimize bundle size

### 4. Component Organization
- Single responsibility per component
- Clear prop interfaces
- Modular and testable

---

## UI/UX Design System

### Color Palette

**Tier Colors:**
```typescript
const TIER_COLORS = {
  free: {
    border: "border-green-500",
    bg: "bg-green-500/10",
    text: "text-green-400",
  },
  premium: {
    border: "border-blue-500",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
  },
  agent: {
    border: "border-purple-500",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
  },
} as const;
```

**Semantic Colors:**
- Success: `text-green-500`
- Warning: `text-yellow-500`
- Error: `text-red-500`
- Info: `text-blue-500`

### Typography Scale

```css
/* Consistent hierarchy - use these exact classes */
.display { @apply text-5xl font-bold leading-tight; }
.h1 { @apply text-4xl font-bold leading-tight; }
.h2 { @apply text-3xl font-semibold leading-snug; }
.h3 { @apply text-2xl font-semibold leading-normal; }
.body-lg { @apply text-lg leading-relaxed; }
.body { @apply text-base leading-normal; }
.small { @apply text-sm leading-normal; }
.caption { @apply text-xs leading-tight; }
```

### Spacing System

```typescript
// Use 4px base scale ONLY - no gap-3, gap-5, etc.
const SPACING = {
  xs: "gap-1",    // 4px
  sm: "gap-2",    // 8px
  md: "gap-4",    // 16px
  lg: "gap-6",    // 24px
  xl: "gap-8",    // 32px
} as const;
```

### Animation Standards

**Micro-interactions:**
```tsx
// Button hover
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.15 }}
>
```

**Page transitions:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
```

**Loading states:**
- Use skeleton screens, not spinners
- Progress bars for long operations
- Optimistic UI updates

---

## Key Components

### AgentCoachUpsell
**Purpose:** UI for autonomous AI agent tier ($0.10)

**Features:**
- Real-time progress visualization
- Active tools display (4 tools light up as agent uses them)
- Autonomous decision explanation
- Three visual states (pre-activation, processing, results)

**States:**
```typescript
const [isProcessing, setIsProcessing] = useState(false);
const [agentAnalysis, setAgentAnalysis] = useState<any>(null);
const [progress, setProgress] = useState(0);
const [activeTools, setActiveTools] = useState<string[]>([]);
```

**Progress Simulation:**
```typescript
// Show progress every 1.5s while API call in flight
const progressSteps = [
  { step: "Analyzing workout...", progress: 20, tools: [] },
  { step: "Examining pose...", progress: 35, tools: ["analyze_pose_data"] },
  { step: "Querying history...", progress: 55, tools: ["query_workout_history"] },
  // etc.
];
```

### SmartTierRecommendation
**Purpose:** Intelligent tier suggestions based on workout data

**Logic:**
```typescript
function recommendTier(workoutData: WorkoutData): Tier {
  if (hasFormIssues || asymmetry || highVariability) {
    return "agent"; // Urgent badge, purple/red
  }
  if (goodForm || personalBest) {
    return "premium"; // Recommended badge, blue
  }
  return "free"; // Acknowledge sufficient, green
}
```

### OnboardingFlow
**Purpose:** 4-step welcome wizard for first-time users

**Features:**
- Progress dots showing current step
- Skip option respects user time
- Explains three coaching tiers
- Sets clear expectations

---

## Reusable Hooks

### useUpgradeFlow
**Purpose:** Consolidate upgrade modal and scroll logic

```typescript
export function useUpgradeFlow() {
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const openUpgrade = (tier: 'premium' | 'agent') => {
    setIsUpsellOpen(true);
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  };
  
  return { openUpgrade, isUpsellOpen, setIsUpsellOpen, scrollRef };
}
```

### useTierColors
**Purpose:** Centralized tier styling

```typescript
export function useTierColors(tier: Tier) {
  return TIER_COLORS[tier];
}
```

---

## Testing Strategy

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

**Expected output:**
- `success: true`
- `toolsUsed`: 3-4 tools
- `iterationsUsed`: 3-5
- Comprehensive coaching response

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

**Test payment flow:**
1. Call endpoint without payment → expect 402
2. Generate valid signature
3. Call with X-Payment header → expect 200 + analysis

---

## Deployment Workflows

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

**Verification:**
```bash
npx hardhat verify --network base-sepolia \
  <CONTRACT_ADDRESS> \
  "<CONSTRUCTOR_ARG_1>" \
  "<CONSTRUCTOR_ARG_2>"
```

---

## Performance Optimization

### Bundle Analysis
```bash
npm run build -- --mode=analyze
```

**Targets:**
- Total bundle: <500KB gzipped
- Main chunk: <200KB
- Lazy chunks: <100KB each

### Image Optimization
- Use WebP format
- Lazy load below-the-fold images
- Responsive srcset for different screen sizes

### Code Splitting
```typescript
// Lazy load heavy components
const AgentCoachUpsell = lazy(() => import('./AgentCoachUpsell'));

// Usage
<Suspense fallback={<Skeleton />}>
  <AgentCoachUpsell />
</Suspense>
```

### Memoization
```typescript
// Expensive calculations
const formVariability = useMemo(() => {
  return repHistory.reduce((sum, rep) => 
    sum + Math.abs(rep.formScore - averageScore), 0
  ) / repHistory.length;
}, [repHistory, averageScore]);
```

---

## Common Issues & Solutions

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

### Issue: Component re-rendering too often
**Symptoms:** Sluggish UI, high CPU
**Solutions:**
- Use React.memo for pure components
- Move expensive calculations to useMemo
- Use useCallback for event handlers

---

## Code Quality Standards

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

---

## Monitoring & Debugging

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

**Set up alerts for:**
- Revenue distribution events
- Passport mint/update transactions
- Leaderboard score submissions

### Frontend Debugging
```typescript
// Enable verbose logging
localStorage.setItem('debug', 'imperfect-coach:*');

// Disable
localStorage.removeItem('debug');
```

---

## Contribution Guidelines

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

---

## Quick Reference

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

**Maintain code quality, follow the design system, and build with performance in mind.**
