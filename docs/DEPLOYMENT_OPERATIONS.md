# Deployment & Operations Guide

## Overview

This guide covers the deployment process for all components of the Imperfect Coach system:

1. Frontend Application (Netlify)
2. AWS Lambda Functions (Backend processing with x402 payment verification)
3. Smart Contracts (Base Sepolia, Avalanche Fuji)
4. Solana Payments (Devnet)

## Frontend Deployment

### Netlify Deployment
The frontend is deployed to Netlify automatically via GitHub integration.

To deploy manually:
```bash
# Build the application
pnpm run build

# Deploy to Netlify
netlify deploy --prod
```

### Environment Variables
Set these in Netlify dashboard:
```bash
# API endpoints
VITE_LAMBDA_ENDPOINT=https://your-lambda-url.amazonaws.com
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_KEY=your-supabase-key
```

## AWS Lambda Deployment

### Prerequisites
1. AWS CLI configured with appropriate permissions
2. Node.js 18+
3. jq (for JSON processing)

### Deployment Script
Use the provided deployment script (for large packages >70MB):
```bash
cd aws-lambda
./deploy-s3.sh
```

The script automatically:
- Installs production dependencies
- Aggressively prunes node_modules (removes .md, .map, test dirs)
- Creates S3 bucket if needed
- Uploads to S3 (supports up to 5GB)
- Updates Lambda function code
- Cleans up old versions (keeps last 5)

### Manual Deployment
For smaller packages (<70MB):
```bash
cd aws-lambda
npm install --production
zip -r function.zip index.mjs node_modules/ package.json package-lock.json
aws lambda update-function-code \
  --function-name imperfect-coach-premium-analysis \
  --zip-file fileb://function.zip \
  --region eu-north-1
```

### Environment Configuration
Update Lambda environment variables:
```bash
aws lambda update-function-configuration \
  --function-name imperfect-coach-premium-analysis \
  --environment Variables='{
    "SOLANA_PRIVATE_KEY":"your-key",
    "SOLANA_TREASURY_ADDRESS":"your-address", 
    "SOLANA_RPC_URL":"https://api.devnet.solana.com",
    "AGENT_PRIVATE_KEY":"your-agent-evm-private-key",
    "CX0_API_KEY":"your-0xgasless-api-key",
    "AVALANCHE_RPC":"https://api.avax-test.network/ext/bc/C/rpc"
  }' \
  --region eu-north-1
```

## Smart Contract Deployment

### Prerequisites
1. Foundry installed
2. Wallet with Base Sepolia ETH

### Deploy Leaderboard Contracts
```bash
# Set your private key
export PRIVATE_KEY="your_private_key_here"

# Run deployment script
./scripts/deploy-public-leaderboards.sh
```

### Deploy Agent Registry Contracts
The AgentRegistry is deployed to both chains:
- **Base Sepolia**: `0xfE997dEdF572CA17d26400bCDB6428A8278a0627`
- **Avalanche Fuji**: `0x1c2127562C52f2cfDd74e23A227A2ece6dFb42DC`

## Solana Payment Setup

**Note**: The system implements x402 payment signature verification for Solana but does not execute real blockchain transactions in the current implementation.

### Server Wallet Creation
1. Generate server wallet:
   ```bash
   solana-keygen new --outfile ~/.config/solana/server-wallet.json
   ```

2. Fund with devnet SOL:
   ```bash
   solana airdrop 2 <YOUR_PUBLIC_KEY> --url devnet
   ```

3. Get devnet USDC:
   - Visit: https://spl-token-faucet.com/?token-name=USDC
   - Enter your wallet address
   - Request USDC tokens

### Private Key Configuration
Add to AWS Lambda environment variables:
```bash
# Get as JSON array (easiest)
cat ~/.config/solana/server-wallet.json | jq -c '.[0:64]'

SOLANA_PRIVATE_KEY="[your-base58-or-json-array-private-key]"
SOLANA_TREASURY_ADDRESS="YourReceivingWalletAddress"
SOLANA_RPC_URL="https://api.devnet.solana.com"
```

### Treasury Token Account
If your treasury address doesn't have a USDC token account:
```bash
spl-token create-account Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr \
  --owner <TREASURY_ADDRESS> --url devnet
```

## Testing After Deployment

### 1. Wallet Connection Test
1. Connect wallet (EVM or Solana)
2. Verify connection status in UI
3. Check network detection

### 2. Score Submission Test
1. Complete a workout
2. Submit score to leaderboard
3. Verify transaction success
4. Check leaderboard update

### 3. Payment Processing Test
1. Trigger premium analysis ($0.05)
2. Complete x402 payment flow
3. Verify USDC transfer on-chain
4. Check transaction in Solana Explorer

### 4. AI Agent Test
1. Trigger agent analysis ($0.10)
2. Monitor CloudWatch logs for agent reasoning
3. Verify tool execution
4. Check final analysis delivery

## Monitoring

### AWS CloudWatch
Monitor Lambda function logs:
```bash
aws logs tail /aws/lambda/imperfect-coach-premium-analysis \
  --follow --region eu-north-1
```

Look for:
- `✅ Solana USDC payment confirmed`
- `🤖 Starting REAL Agent Analysis`
- `🔄 Agent iteration X/5`
- `🔧 Executing tool: analyze_pose_data`

### Solana Wallet Monitoring
Check server wallet balance regularly:
```bash
# SOL balance
solana balance <server-address> --url devnet

# USDC balance
spl-token balance Gh9ZwEmdLJ8DscKNTkTqP2KGtKJr \
  --owner <server-address> --url devnet
```

Set up alerts for low balance!

## Rollback Procedures

### Lambda Function Rollback
```bash
aws lambda update-function-code \
  --function-name imperfect-coach-premium-analysis \
  --s3-bucket your-backup-bucket \
  --s3-key previous-version.zip \
  --region eu-north-1
```

### Smart Contract Rollback
Keep old contract addresses in git history. If issues occur:
1. Revert `src/lib/contracts.ts` to old addresses
2. Old contracts still functional (but require operator authorization)

### Frontend Rollback
Use Netlify's deployment history to rollback to previous version.

## Troubleshooting

### Common Deployment Issues

#### "RequestEntityTooLargeException"
Package is >70MB. Use S3 deployment (`deploy-s3.sh`).

#### "Insufficient funds" error
- Fund server wallet with SOL: `solana airdrop 1 <address> --url devnet`
- Fund server wallet with USDC from faucet

#### "Associated token account does not exist"
- Create token account for recipient:
  ```bash
  spl-token create-account Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr \
    --owner <treasury-address> --url devnet
  ```

#### "User is not authorized to perform: s3:ListBuckets"
Add appropriate IAM permissions for S3.

### Environment Variable Issues
1. Verify all required environment variables are set
2. Check variable names match exactly
3. Ensure proper JSON formatting for complex values

## Security Considerations

### Private Key Management
- Never commit private keys to git
- Use AWS Secrets Manager for production
- Rotate keys regularly
- Monitor server wallet balance

### Access Control
- Use IAM roles with least privilege
- Restrict Lambda function access
- Monitor API usage
- Implement rate limiting

### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Validate all inputs
- Sanitize outputs

## Performance Optimization

### Lambda Optimization
- Minimize deployment package size
- Use provisioned concurrency for cold start reduction
- Optimize memory allocation
- Monitor execution duration

### Frontend Optimization
- Enable CDN caching
- Optimize asset loading
- Implement lazy loading
- Minimize bundle size

### Blockchain Optimization
- Batch transactions when possible
- Monitor gas prices
- Implement retry logic
- Use efficient contract patterns

## x402-Style Implementation Status

The system implements x402-style protocol compliance with:
- HTTP 402 challenge responses when payment is required
- EIP-191 signature verification for EVM wallets
- Ed25519 signature verification for Solana wallets
- Real blockchain settlement for native tokens
- Native token transfers (ETH/AVAX/SOL) on EVM and Solana networks

## Health Checks

### Agent Discovery Service
```bash
curl -s https://your-api-gateway/agents?capability=fitness_analysis
```

### Payment Verification
```bash
curl -X POST https://your-lambda-url \
  -H "Content-Type: application/json" \
  -d '{"type": "analysis", "workoutData": {}}'
```

### x402 Challenge Test
Verify the system returns proper 402 challenges with payment requirements.