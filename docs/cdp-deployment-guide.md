# CDP SDK Integration Deployment Guide

## Overview

This guide walks you through deploying the real USDC payment functionality using Coinbase's CDP SDK to replace the mock payment system in your x402 flow.

## 🚀 Quick Start

### 1. Get CDP API Credentials

1. Go to [CDP Portal](https://portal.cdp.coinbase.com/)
2. Create an account or sign in
3. Navigate to **API Keys** section
4. Click **Create API Key**
5. Download the JSON file containing your credentials
6. Extract the following values:
   - `name` → `CDP_API_KEY_NAME`
   - `privateKey` → `CDP_PRIVATE_KEY`

### 2. Set Environment Variables

Add these to your AWS Lambda environment variables:

```bash
# Required CDP Variables
CDP_API_KEY_NAME=your_api_key_name_here
CDP_PRIVATE_KEY=-----BEGIN EC PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END EC PRIVATE KEY-----

# Optional CDP Variables
CDP_USE_SERVER_SIGNER=true
CDP_WALLET_ID=  # Leave empty for auto-creation

# Contract Addresses (already configured)
REVENUE_SPLITTER_ADDRESS=0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA
USDC_ADDRESS=0x036CbD53842c5426634e7929541fC2318B3d053F
```

### 3. Deploy Files

Upload these files to your AWS Lambda:

```
aws-lambda/
├── index.mjs                      # Your main handler (already exists)
├── cdp-payment-processor.mjs      # New CDP payment processor
└── package.json                   # Update dependencies
```

### 4. Update Lambda Dependencies

Add CDP SDK to your Lambda layer or package:

```json
{
  "dependencies": {
    "@coinbase/coinbase-sdk": "^0.25.0",
    // ... your existing dependencies
  }
}
```

## 🔧 Configuration Details

### Environment Variables Explained

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `CDP_API_KEY_NAME` | ✅ | API key name from CDP Portal | `organizations/abc/apiKeys/def` |
| `CDP_PRIVATE_KEY` | ✅ | Private key from CDP Portal | `-----BEGIN EC PRIVATE KEY-----\n...` |
| `CDP_USE_SERVER_SIGNER` | ❌ | Use server-side transaction signing | `true` |
| `CDP_WALLET_ID` | ❌ | Existing wallet ID (auto-created if empty) | `wallet-abc-123` |
| `REVENUE_SPLITTER_ADDRESS` | ✅ | Your deployed RevenueSplitter contract | `0x6C9B...` |

### Payment Flow

1. **User Authorization**: User signs payment message (EIP-1271)
2. **Signature Verification**: Lambda verifies user signature
3. **Balance Check**: CDP checks user's USDC balance
4. **Transaction Creation**: CDP creates USDC transfer transaction
5. **Broadcast**: Transaction is signed and broadcasted to Base Sepolia
6. **Confirmation**: Lambda waits for on-chain confirmation
7. **Response**: Returns transaction hash and status

## 💰 Wallet Management

### Server Wallet Creation

On first deployment, the system will:
1. Create a new CDP wallet automatically
2. Log the wallet ID and address
3. You should save the wallet ID to `CDP_WALLET_ID` env var

### Funding the Server Wallet

The server wallet needs ETH for gas fees:

```bash
# Get wallet address from Lambda logs
# Send Base Sepolia ETH to this address
# Faucet: https://www.alchemy.com/faucets/base-sepolia
```

## 🧪 Testing

### 1. Test CDP Connection

```javascript
// Lambda function will log CDP connection status
// Look for: "✅ CDP SDK initialized successfully"
```

### 2. Test Real Payment

```bash
# Use your existing frontend to trigger a payment
# Monitor Lambda logs for:
# "💳 Processing real USDC payment..."
# "✅ Payment confirmed on-chain!"
```

### 3. Verify on BaseScan

Check transactions on [Base Sepolia BaseScan](https://sepolia.basescan.org/):
- Search for your RevenueSplitter contract address
- Verify USDC transfers are appearing

## 🔄 Fallback System

The system includes automatic fallback:

1. **Primary**: Real CDP USDC transfers
2. **Fallback**: Mock payments (if CDP fails)
3. **Error Handling**: Proper error codes for insufficient balance

### Fallback Triggers

- CDP API unavailable
- Network connectivity issues  
- Server wallet not funded
- **Does NOT fallback** for insufficient user balance (real error)

## 📈 Monitoring

### Key Logs to Monitor

```bash
# Successful real payment
"✅ Payment confirmed on-chain!"

# Fallback to mock
"⚠️ CDP payment failed, falling back to mock"

# Insufficient balance (real error)
"❌ Insufficient USDC balance"

# Configuration issues
"❌ Failed to initialize CDP SDK"
```

### Transaction Tracking

Each payment returns:
```json
{
  "success": true,
  "txHash": "0x123...",
  "amount": "0.05",
  "from": "0xuser...",
  "to": "0x6C9B...",
  "status": "complete",
  "verified": true,
  "transactionLink": "https://sepolia.basescan.org/tx/0x123...",
  "isMock": false
}
```

## 🚨 Troubleshooting

### Common Issues

1. **"CDP_API_KEY_NAME and CDP_PRIVATE_KEY are required"**
   - Add CDP credentials to Lambda environment variables
   - Verify private key format includes newlines (`\n`)

2. **"Failed to initialize server wallet"**
   - Check CDP API key permissions
   - Verify network connectivity from Lambda

3. **"Insufficient USDC balance"**
   - User doesn't have enough USDC
   - This is expected behavior, not an error

4. **"Transaction confirmation timeout"**
   - Transaction was broadcasted but confirmation timed out
   - Check BaseScan - transaction may still complete
   - System returns success with "pending" status

### Network Issues

If Base Sepolia is experiencing issues:
- System automatically falls back to mock payments
- Users still get analysis
- Monitor Base network status

## 🔐 Security

### Private Key Security

- Never log private keys
- Use AWS Lambda environment variables (encrypted)
- Consider AWS Secrets Manager for production

### Access Control

- CDP API keys are scoped to specific operations
- Server wallet only holds gas fees (minimal ETH)
- All USDC goes directly to RevenueSplitter contract

## 📊 Revenue Tracking

### Real vs Mock Payments

```javascript
// Real payment
{ "isMock": false, "txHash": "0x123..." }

// Mock payment (fallback)
{ "isMock": true, "txHash": "0xmock..." }
```

### RevenueSplitter Integration

1. **Real Payments**: USDC sent directly to contract
2. **Mock Payments**: No actual transfer (tracking only)
3. **Payee Withdrawal**: Use existing `release()` function

## 🚀 Going Live

### Production Checklist

- [ ] CDP API keys configured
- [ ] Server wallet funded with ETH
- [ ] Test payments working
- [ ] Monitor logs for 24 hours
- [ ] Fallback system tested
- [ ] BaseScan monitoring set up

### Mainnet Migration

To switch to Base Mainnet:
1. Update network configuration
2. Deploy contracts to mainnet
3. Use mainnet USDC address
4. Fund server wallet with real ETH

## 📞 Support

### Resources
- [CDP Documentation](https://docs.cdp.coinbase.com/)
- [Base Network Status](https://status.base.org/)
- [BaseScan](https://sepolia.basescan.org/)

### Debug Commands

```bash
# Check wallet status
node scripts/setup-cdp.js --test-cdp

# Get funding info
node scripts/setup-cdp.js --fund-info

# Test environment
node scripts/setup-cdp.js --check-env
```

---

**🎉 Success Metrics**

You'll know it's working when:
- Lambda logs show "✅ Payment confirmed on-chain!"
- BaseScan shows USDC transfers to RevenueSplitter
- Users receive analysis with real transaction hashes
- Revenue appears in your RevenueSplitter contract

**Next Steps**: Monitor for 24-48 hours, then consider mainnet deployment!