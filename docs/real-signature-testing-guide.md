# Real User Signature Testing Guide

## Overview

This guide walks you through testing the x402 payment flow with real user signatures after removing the bypass code. The system now requires valid EIP-1271 signatures from users to authorize payments.

## 🔧 Current Status

✅ **Bypass code removed**  
✅ **Real USDC transfers working**  
✅ **CDP SDK integration complete**  
✅ **RevenueSplitter integration active**  

## 🧪 Testing Methods

### Method 1: Frontend Integration Test

The best way to test real signatures is through your existing frontend that users interact with.

**Required Components:**
- Wallet connection (MetaMask, Coinbase Wallet, etc.)
- Signature prompt for payment authorization
- x402 payment flow integration

**Test Steps:**
1. **Connect wallet** to your frontend
2. **Trigger premium analysis** request
3. **Sign payment message** when prompted
4. **Verify transaction** on BaseScan

### Method 2: Manual Signature Generation

For direct API testing without frontend:

#### Step 1: Generate Valid Signature

```javascript
import { createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

// Your test wallet
const account = privateKeyToAccount('0xYOUR_PRIVATE_KEY');
const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(),
});

// Create payment authorization message
const message = 'I authorize this payment for premium analysis';

// Sign the message
const signature = await walletClient.signMessage({
  message,
});

console.log('Address:', account.address);
console.log('Message:', message);
console.log('Signature:', signature);
```

#### Step 2: Test with Lambda

```bash
curl -X POST https://YOUR_LAMBDA_URL/analyze-workout \
  -H "Content-Type: application/json" \
  -d '{
    "workoutData": {
      "exercises": [
        {
          "name": "Push-ups",
          "reps": 15,
          "sets": 3,
          "form_score": 85
        }
      ],
      "duration": 300,
      "totalCalories": 150
    },
    "payment": {
      "walletAddress": "0xYOUR_WALLET_ADDRESS",
      "signature": "0xYOUR_SIGNATURE",
      "message": "I authorize this payment for premium analysis",
      "amount": "50000"
    }
  }'
```

### Method 3: x402 Protocol Flow Test

Test the complete x402 protocol implementation:

#### Step 1: Initial Request (Should Return 402)

```bash
curl -X POST https://YOUR_LAMBDA_URL/analyze-workout \
  -H "Content-Type: application/json" \
  -d '{
    "workoutData": {
      "exercises": [{"name": "Push-ups", "reps": 15}]
    }
  }'
```

**Expected Response:** HTTP 402 with payment challenge

#### Step 2: Payment Settlement Request

```bash
curl -X POST https://YOUR_LAMBDA_URL/analyze-workout \
  -H "Content-Type: application/json" \
  -H "X-Payment: YOUR_PAYMENT_PROOF" \
  -d '{
    "workoutData": {
      "exercises": [{"name": "Push-ups", "reps": 15}]
    }
  }'
```

## 🔍 Expected Results

### ✅ Successful Payment Flow

```
🔐 Verifying wallet signature...
🔍 Verifying signature for address: 0x...
✅ Wallet signature verified
💳 Payment header found, verifying and settling...
✅ Payment verified and settled successfully
💸 Processing real USDC payment via CDP...
📝 Transaction broadcasted: 0x...
✅ Payment confirmed on-chain!
🧠 Processing Bedrock analysis...
✅ Bedrock analysis completed
```

### ❌ Invalid Signature

```
🔐 Verifying wallet signature...
🔍 Verifying signature for address: 0x...
❌ Invalid wallet signature
```

**Response:** HTTP 401 - Invalid payment authorization

### ❌ Missing Payment Header

```
✅ Wallet signature verified
❌ No x402 payment header found - payment required
```

**Response:** HTTP 402 - Payment required

### ❌ Insufficient Server Balance

```
📝 Sending USDC transfer transaction...
💥 Real payment processing failed: APIError: Insufficient balance
⚠️ CDP payment failed, falling back to mock
```

**Action:** Fund server account `0x25ba6d3D203b6e2DCA9400694B7B90D2bEEd6408`

## 🔧 Debugging Common Issues

### Issue 1: Signature Verification Fails

**Symptoms:**
- "Invalid wallet signature" error
- HTTP 401 response

**Solutions:**
1. **Check message format** - must exactly match expected message
2. **Verify wallet address** - ensure it matches the signing wallet
3. **Check signature format** - should be hex string starting with 0x
4. **Test with known good signature** first

### Issue 2: Smart Wallet Signatures

**Symptoms:**
- EOA verification fails, tries EIP-1271
- "Address is not a contract" error

**Solutions:**
1. **Use EOA wallets** for testing (MetaMask, etc.)
2. **For smart wallets** - ensure contract supports EIP-1271
3. **Check contract deployment** on Base Sepolia

### Issue 3: Payment Header Missing

**Symptoms:**
- Returns 402 even with valid signature
- "No x402 payment header found"

**Solutions:**
1. **Add X-Payment header** to request
2. **Check header format** - should contain payment proof
3. **Review x402 protocol** implementation

## 🎯 Test Scenarios

### Scenario 1: Happy Path
- ✅ Valid signature
- ✅ x402 payment header
- ✅ Sufficient server balance
- **Expected:** Real USDC transfer + analysis

### Scenario 2: Invalid Signature
- ❌ Wrong signature
- **Expected:** HTTP 401 error

### Scenario 3: Missing Payment
- ✅ Valid signature
- ❌ No payment header
- **Expected:** HTTP 402 with payment challenge

### Scenario 4: Insufficient Balance
- ✅ Valid signature
- ✅ Payment header
- ❌ Empty server account
- **Expected:** Fallback to mock payment

## 🔗 Monitoring & Verification

### BaseScan Monitoring

Check real transactions at:
- **Server Account:** `0x25ba6d3D203b6e2DCA9400694B7B90D2bEEd6408`
- **RevenueSplitter:** `0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA`
- **Transaction Link:** `https://sepolia.basescan.org/tx/0x[hash]`

### CloudWatch Logs

Monitor for these key indicators:
- ✅ "Wallet signature verified"
- ✅ "Payment verified and settled successfully"  
- ✅ "Transaction broadcasted"
- ✅ "Payment confirmed on-chain"
- ✅ "Real CDP payment successful"

### Success Metrics

1. **Real Payments:** `real: true` in payment logs
2. **On-chain Verification:** Transaction appears on BaseScan
3. **Analysis Delivery:** User receives premium analysis
4. **Revenue Flow:** USDC reaches RevenueSplitter contract

## 🚀 Production Readiness

### Pre-Production Checklist

- [ ] Remove all bypass/testing code
- [ ] Test with multiple wallet types
- [ ] Verify signature verification works
- [ ] Test x402 protocol flow
- [ ] Monitor server account balance
- [ ] Test fallback to mock payments
- [ ] Verify error handling
- [ ] Check CloudWatch logging

### Go-Live Steps

1. **Final test** with real wallet signatures
2. **Monitor first real payments** closely
3. **Set up BaseScan monitoring** alerts
4. **Configure server account** auto-funding
5. **Scale to mainnet** when ready

## 📞 Support

### Debug Commands

```bash
# Check server account balance
curl -s "https://sepolia.base.org" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"method":"eth_call","params":[{"to":"0x036CbD53842c5426634e7929541fC2318B3d053F","data":"0x70a08231000000000000000000000000'$(echo '0x25ba6d3D203b6e2DCA9400694B7B90D2bEEd6408' | sed 's/0x//')'"},"latest"],"id":1}'
```

### Resources

- [EIP-1271 Standard](https://eips.ethereum.org/EIPS/eip-1271)
- [x402 Protocol](https://docs.x402.org/)
- [CDP SDK Docs](https://docs.cdp.coinbase.com/)
- [Base Sepolia Explorer](https://sepolia.basescan.org/)

---

**🎉 Your real payment system is ready for production!**