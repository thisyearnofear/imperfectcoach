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

## 🆘 Getting Help

1. Check existing documentation
2. Review GitHub issues
3. Run tests to identify problems
4. Consult team members for complex issues