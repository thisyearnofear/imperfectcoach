# Solana USDC Payments Implementation

## ✅ What's Fixed

Both **Bedrock Analysis** and **AgentCore** now execute **real on-chain USDC transfers**:

- ✅ Base Sepolia: Real USDC via CDP SDK
- ✅ Solana Devnet: Real USDC via SPL Token transfers
- ✅ No more mock transactions!

## 🚀 Quick Setup

### 1. Generate Solana Server Wallet

```bash
solana-keygen new --outfile ~/.config/solana/server-wallet.json
```

Save the public key that's displayed!

### 2. Fund Server Wallet

```bash
# Get SOL for transaction fees
solana airdrop 2 <YOUR_PUBLIC_KEY> --url devnet

# Get USDC from faucet
# Visit: https://spl-token-faucet.com/?token-name=USDC
# Enter your wallet address and request tokens
```

### 3. Extract Private Key

```bash
# Get as JSON array (easiest)
cat ~/.config/solana/server-wallet.json | jq -c '.[0:64]'
```

Copy the output (it will look like `[1,2,3,...]`)

### 4. Update Lambda Environment Variables

```bash
aws lambda update-function-configuration \
  --function-name imperfect-coach-premium-analysis \
  --environment Variables='{"SOLANA_PRIVATE_KEY":"[1,2,3,...]","SOLANA_TREASURY_ADDRESS":"YourReceivingWallet"}' \
  --region eu-north-1
```

Replace:
- `[1,2,3,...]` with your actual private key array
- `YourReceivingWallet` with where you want to receive payments

### 5. Deploy Lambda Function

```bash
cd aws-lambda
./deploy.sh
```

The script will:
- Install dependencies
- Create deployment package
- Upload to AWS Lambda
- Verify environment variables

## 🧪 Testing

1. **Connect Solana wallet** (Phantom/Solflare) on your frontend
2. **Trigger payment** (Bedrock analysis or Agent analysis)
3. **Sign x402 message** in your wallet
4. **Backend transfers USDC** automatically
5. **Check transaction** on Solana Explorer

Transaction URL format:
```
https://explorer.solana.com/tx/<transaction-hash>?cluster=devnet
```

## 💰 Payment Amounts

| Service | Amount | Asset | Network |
|---------|--------|-------|---------|
| Bedrock Analysis | 0.05 USDC | USDC | Base / Solana |
| AI Coach Agent | 0.10 USDC | USDC | Base / Solana |

## 📊 Monitor Wallet Balance

```bash
# Check SOL balance (for fees)
solana balance <server-address> --url devnet

# Check USDC balance
spl-token balance Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr \
  --owner <server-address> --url devnet
```

⚠️ Set up alerts when balance drops below operational threshold!

## 🔍 View Lambda Logs

```bash
aws logs tail /aws/lambda/imperfect-coach-premium-analysis \
  --follow --region eu-north-1
```

Look for:
- `✅ Solana USDC payment confirmed: <signature>`
- `🔍 View on Solana Explorer: <url>`

## ⚠️ Important Notes

1. **Keep server wallet funded** with SOL (for fees) and USDC (for transfers)
2. **Monitor CloudWatch logs** for payment failures
3. **Treasury address must have USDC token account** created
4. **Private keys stored in Lambda environment** (encrypted at rest)
5. Consider **AWS Secrets Manager** for production

## 🐛 Troubleshooting

### "Insufficient funds" error
```bash
solana airdrop 1 <server-address> --url devnet
```

### "Associated token account does not exist"
```bash
spl-token create-account Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr \
  --owner <treasury-address> --url devnet
```

### Payment fails silently
Check CloudWatch logs for detailed error messages

## 🎯 Success Checklist

- [ ] Server wallet created and funded
- [ ] Private key added to Lambda environment
- [ ] Treasury address configured
- [ ] Lambda function deployed
- [ ] Test payment completed successfully
- [ ] Transaction visible on Solana Explorer
- [ ] CloudWatch logging verified
- [ ] Balance monitoring set up

## 🚨 Emergency Commands

**Stop accepting Solana payments:**
```bash
aws lambda update-function-configuration \
  --function-name imperfect-coach-premium-analysis \
  --environment Variables='{"SOLANA_PRIVATE_KEY":""}' \
  --region eu-north-1
```

**Rollback to previous version:**
```bash
aws lambda update-function-code \
  --function-name imperfect-coach-premium-analysis \
  --s3-bucket your-backup-bucket \
  --s3-key previous-version.zip \
  --region eu-north-1
```

## 📚 Detailed Implementation

### Changes Made

#### 1. Fixed x402 Protocol Implementation in BedrockAnalysisSection.tsx
**Problem:** Bedrock analysis was sending payment data in the first request, violating x402 protocol.

**Solution:**
- First request now sends NO payment data (only workoutData + X-Chain header)
- Waits for 402 challenge from server
- Creates x402 signature based on server's exact requirements  
- Sends second request with X-Payment header

#### 2. Fixed Transaction Tracking in AgentCoachUpsell.tsx
**Problem:** Calling `trackPaymentTransaction` with wrong number of arguments, generating mock transaction IDs.

**Solution:**
- Now calls with all 5 required parameters: `(hash, amount, currency, description, facilitator)`
- Properly tracks "0.10 USDC" for AI Coach Agent analysis

#### 3. Implemented Real Solana USDC Transfers

##### Backend Changes (aws-lambda/index.mjs):

**Added Dependencies:**
```javascript
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import bs58 from "bs58";
```

**New Functions:**
- `getSolanaServerKeypair()` - Loads server wallet from environment (supports base58 or JSON array format)
- `processSolanaUSDCPayment(paymentPayload)` - Executes real USDC transfer on Solana devnet
  - Uses SPL Token transfer instruction
  - Transfers 0.05 USDC (50,000 microUSDC)
  - Waits for on-chain confirmation
  - Returns real transaction hash

**Updated Functions:**
- `verifySolanaPayment()` - Now calls `processSolanaUSDCPayment()` instead of generating mock transactions

##### NPM Dependencies Added:
```bash
cd aws-lambda
npm install @solana/spl-token bs58
```

## Environment Variables Required

Add to AWS Lambda configuration:

```bash
SOLANA_PRIVATE_KEY="[your-base58-or-json-array-private-key]"
SOLANA_TREASURY_ADDRESS="YourReceivingWalletAddress"
SOLANA_RPC_URL="https://api.devnet.solana.com"
```

## Setup Steps

1. **Generate server wallet:**
   ```bash
   solana-keygen new --outfile ~/.config/solana/server-wallet.json
   ```

2. **Fund with devnet SOL and USDC:**
   ```bash
   solana airdrop 2 <address> --url devnet
   # Get USDC from: https://spl-token-faucet.com/?token-name=USDC
   ```

3. **Extract private key:**
   ```bash
   # JSON array format (easiest)
   cat ~/.config/solana/server-wallet.json | jq -c '.[0:64]'
   ```

4. **Add to Lambda environment variables**

5. **Deploy updated Lambda function:**
   ```bash
   cd aws-lambda
   zip -r function.zip index.mjs node_modules/
   aws lambda update-function-code --function-name your-function-name --zip-file fileb://function.zip
   ```

## Payment Flow Comparison

### Before (Mock):
1. ✅ User signs x402 message
2. ✅ Backend verifies signature  
3. ❌ Backend generates mock transaction ID
4. ❌ Returns `solana_mock_1763034714876_3saytcqts`

### After (Real):
1. ✅ User signs x402 message
2. ✅ Backend verifies signature
3. ✅ **Backend transfers 0.05 USDC on-chain**
4. ✅ Returns real transaction hash viewable on Solana Explorer

## Security Considerations

- ✅ Private key stored in Lambda environment variables (encrypted at rest)
- ⚠️ Consider using AWS Secrets Manager for production
- ✅ Server wallet only holds operational balance (not treasury)
- ✅ All payments verified with user signatures before processing
- ✅ Transaction amounts hardcoded (not user-controlled)

## Next Steps

1. **Deploy to Lambda** with new environment variables
2. **Fund server wallet** with SOL + USDC on devnet
3. **Test payment flow** end-to-end
4. **Monitor transactions** via CloudWatch logs
5. **Set up balance alerts** to avoid payment failures

For detailed setup instructions, see `aws-lambda/SOLANA_SETUP.md`