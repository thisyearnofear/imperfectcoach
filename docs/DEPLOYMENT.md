# Deployment Guide

## 🚀 Deployment Overview

This guide covers the deployment process for all components of the Imperfect Coach system:

1. **Frontend Application** (Netlify)
2. **AWS Lambda Functions** (Backend processing)
3. **Smart Contracts** (Base Sepolia)
4. **Solana Payments** (Devnet)

## 🌐 Frontend Deployment

### Netlify Deployment
The frontend is deployed to Netlify automatically via GitHub integration.

To deploy manually:
```bash
# Build the application
npm run build

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

## ☁️ AWS Lambda Deployment

### Prerequisites
1. AWS CLI configured with appropriate permissions
2. Node.js 18+
3. jq (for JSON processing)

### Deployment Script
Use the provided deployment script:
```bash
cd aws-lambda
./deploy.sh [function-name]
```

### Manual Deployment Steps
1. **Install dependencies:**
   ```bash
   cd aws-lambda
   npm install
   ```

2. **Create deployment package:**
   ```bash
   zip -r function.zip index.mjs node_modules/ package.json package-lock.json
   ```

3. **Deploy to AWS Lambda:**
   ```bash
   aws lambda update-function-code \
     --function-name imperfect-coach-premium-analysis \
     --zip-file fileb://function.zip \
     --region eu-north-1
   ```

4. **Configure environment variables:**
   ```bash
   aws lambda update-function-configuration \
     --function-name imperfect-coach-premium-analysis \
     --environment Variables='{
       "SOLANA_PRIVATE_KEY":"your-key",
       "SOLANA_TREASURY_ADDRESS":"your-address",
       "SOLANA_RPC_URL":"https://api.devnet.solana.com"
     }' \
     --region eu-north-1
   ```

## 📜 Smart Contract Deployment

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

### Expected Output
```
Pullups: 0x[NEW_ADDRESS]
Jumps:   0x[NEW_ADDRESS]
```

### Update Frontend Configuration
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

## 💰 Solana Payment Setup

### Server Wallet Creation
1. **Generate server wallet:**
   ```bash
   solana-keygen new --outfile ~/.config/solana/server-wallet.json
   ```

2. **Fund with devnet SOL:**
   ```bash
   solana airdrop 2 <YOUR_PUBLIC_KEY> --url devnet
   ```

3. **Get devnet USDC:**
   - Visit: https://spl-token-faucet.com/?token-name=USDC
   - Enter your wallet address
   - Request USDC tokens

### Private Key Extraction
```bash
# Get as JSON array (easiest)
cat ~/.config/solana/server-wallet.json | jq -c '.[0:64]'
```

### Environment Configuration
Add to AWS Lambda environment variables:
```bash
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

## 🧪 Testing After Deployment

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

## 📊 Monitoring

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
spl-token balance Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr \
  --owner <server-address> --url devnet
```

Set up alerts for low balance!

## 🚨 Rollback Procedures

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

## 🔧 Troubleshooting

### Common Deployment Issues

#### "Insufficient funds" error
- Fund server wallet with SOL: `solana airdrop 1 <address> --url devnet`
- Fund server wallet with USDC from faucet

#### "Associated token account does not exist"
- Create token account for recipient:
  ```bash
  spl-token create-account Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr \
    --owner <treasury-address> --url devnet
  ```

#### "Transaction failed to confirm"
- Check RPC endpoint is responding
- Verify network congestion isn't too high
- Increase confirmation timeout

#### Lambda deployment fails
- Check AWS permissions
- Verify function name exists
- Check ZIP file integrity

### Environment Variable Issues
1. Verify all required environment variables are set
2. Check variable names match exactly
3. Ensure proper JSON formatting for complex values

## 🛡️ Security Considerations

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

## 📈 Performance Optimization

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

## 🔄 Continuous Deployment

### GitHub Actions
The project uses GitHub Actions for automated deployment:
- Frontend deployment on push to main
- Lambda deployment on tagged releases
- Smart contract verification after deployment

### Manual CD Process
1. Tag release: `git tag v1.0.0`
2. Push tag: `git push origin v1.0.0`
3. Trigger deployment workflows
4. Monitor deployment status
5. Verify deployment success

## 📚 Documentation

For detailed implementation information, see:
- **[Solana Payments](SOLANA_PAYMENTS.md)** - Complete Solana payment implementation
- **[Architecture](ARCHITECTURE.md)** - System architecture details
- **[Development](DEVELOPMENT.md)** - Development practices and patterns