# Development Guide

## Quick Start

```bash
git clone https://github.com/thisyearnofear/imperfectcoach
cd imperfectcoach
# Install pnpm if you don't have it: npm install -g pnpm
pnpm install
pnpm run dev
```

## Technology Stack

### AI & Agent System
- Amazon Bedrock AgentCore (multi-step reasoning)
- Amazon Nova Lite (LLM decision-making)
- TensorFlow.js + MediaPipe (pose detection)

### Agent System Notes
- Core agents are internally defined (fallback when no agents registered in DynamoDB)
- Agent discovery uses AgentRegistry smart contract + DynamoDB persistence (agent-discovery.js)
- Reap Protocol reserved for future agentic commerce (product search, inventory, autonomous purchasing)
- x402 payment verification is implemented with DynamoDB audit trail
- Real blockchain settlement can be enabled with PayAI integration

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Wagmi + Viem (blockchain)

### Backend
- AWS Lambda (eu-north-1)
- Supabase Edge Functions
- Smart Contracts (Base/Avalanche)

### Payments
- x402 protocol (server-driven challenges)
- Base Sepolia, Avalanche Fuji, Solana Devnet
- USDC/SOL stablecoin settlement

## Development Principles

- **ENHANCEMENT FIRST**: Prioritize enhancing existing components over creating new ones
- **AGGRESSIVE CONSOLIDATION**: Delete unnecessary code rather than deprecating
- **PREVENT BLOAT**: Systematically audit and consolidate before adding new features
- **DRY**: Single source of truth for all shared logic
- **CLEAN**: Clear separation of concerns with explicit dependencies
- **MODULAR**: Composable, testable, independent modules
- **PERFORMANT**: Adaptive loading, caching, and resource optimization
- **ORGANIZED**: Predictable file structure with domain-driven design

## Key Source Files

### Core Agent System
- `src/lib/agents/core-agents.ts` - Agent definitions and profiles
- `aws-lambda/agent-discovery.mjs` - Agent discovery and registration
- `aws-lambda/index.mjs` - Main AWS Lambda handler with x402 support

### Payment System
- `src/lib/payments/payment-router.ts` - x402 payment negotiation
- `aws-lambda/lib/core-agent-handler.mjs` - Payment verification and agent execution

### Exercise Processing
- `src/lib/exercise-processors/enhancedJumpProcessor.ts` - Jump detection and analysis
- `src/lib/pose-analysis/` - Pose detection and analysis utilities

## Project Structure

```
imperfectcoach/
├── src/                 # Frontend source code
│   ├── components/      # React components
│   ├── lib/             # Business logic and utilities
│   │   ├── agents/      # Agent system
│   │   ├── payments/    # Payment processing
│   │   └── ...
│   ├── hooks/           # Custom React hooks
│   └── assets/          # Static assets
├── aws-lambda/          # Backend Lambda functions
├── contracts/           # Smart contracts
├── supabase/            # Supabase functions
├── docs/                # Documentation
└── scripts/             # Deployment and utility scripts
```

## Testing

### Frontend Testing
```bash
# Run development server
pnpm run dev

# Build for production
pnpm run build
```

### Backend Testing
```bash
# Test Lambda functions locally
cd aws-lambda
node index.mjs

# Test Agent Discovery Service (agent-discovery.js)
curl https://r03m1wznai.execute-api.eu-north-1.amazonaws.com/prod/agents?capability=nutrition_planning
```

### x402 Protocol Testing
The system provides automated scripts to test the full x402 flow (challenge → sign → verify) across all supported networks.

**EVM Chains (Base Sepolia, Avalanche Fuji)**
```bash
# Test Base Sepolia (default)
node aws-lambda/test-x402-with-signature.mjs

# Test Avalanche Fuji
node aws-lambda/test-x402-with-signature.mjs avalanche-fuji
```

**Solana Devnet**
```bash
# Test Solana Devnet (using Ed25519)
node aws-lambda/test-x402-solana.mjs
```

## Environment Setup

### Prerequisites
1. Node.js 18+
2. pnpm package manager
3. AWS CLI configured
4. Solana CLI (for Solana development)

### Environment Variables
Create a `.env.local` file in the root directory:

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

# Reap Protocol (Reserved for Future Agentic Commerce)
# AGENT_WALLET_KEY=your_agent_evm_wallet_private_key  # For autonomous product purchasing
# AVALANCHE_RPC=https://api.avax-test.network/ext/bc/C/rpc
```

## Debugging

### Frontend Debugging
1. Check browser console for errors
2. Use React DevTools for component inspection
3. Enable verbose logging with `localStorage.debug = '*'`

### Backend Debugging
Use the automated test scripts for reliable debugging. Logs can be viewed via CloudWatch.

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

## Security Best Practices

1. Never commit secrets to git
2. Use environment variables for sensitive data
3. Validate all user inputs
4. Implement proper error handling
5. Use AWS IAM roles with least privilege
6. Regularly rotate API keys

## Performance Optimization

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