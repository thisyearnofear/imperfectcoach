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
- x402pay protocol (Base + Solana)
- CDP Wallet (autonomous treasury)
- USDC on Base & SOL/USDC on Solana

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
1. Check CloudWatch logs:
   ```bash
   aws logs tail /aws/lambda/imperfect-coach-premium-analysis \
     --follow --region eu-north-1
   ```

2. Test locally with environment variables:
   ```bash
   export SOLANA_PRIVATE_KEY="your-key"
   node index.mjs
   ```

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
See [SOLANA_PAYMENTS.md](SOLANA_PAYMENTS.md) for Solana payment implementation.

### User Guide
See [USER_GUIDE.md](USER_GUIDE.md) for user-facing features.

## 🆘 Getting Help

1. Check existing documentation
2. Review GitHub issues
3. Run tests to identify problems
4. Consult team members for complex issues