# 🛠️ Development & Deployment Guide

**Internal Reference for Contributors & Deployment**

## 🎯 Development Principles

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

## 📁 Project Structure

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
- CoachOperator: `0xxdEc2d60c9526106a8e4BBd01d70950f6694053A3`

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

---
**Maintain code quality, follow the design system, and build with performance in mind.**