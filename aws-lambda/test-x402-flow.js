const https = require('https');
const crypto = require('crypto');

// Test configuration
const TEST_CONFIG = {
  lambdaUrl: 'https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout',
  facilitatorUrl: 'https://facilitator.cdp.coinbase.com',
  revenueSplitterAddress: '0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA',
  testWalletAddress: '0x1234567890123456789012345678901234567890',
  mockWorkoutData: {
    exercise: 'pullups',
    reps: 10,
    averageFormScore: 85,
    repHistory: [
      { score: 90, details: {} },
      { score: 80, details: {} },
      { score: 85, details: {} }
    ],
    duration: 120,
    keypoints: []
  }
};

/**
 * Create a mock x402 payment header
 */
function createMockX402Payment() {
  const paymentPayload = {
    scheme: 'base',
    network: 'base-sepolia',
    asset: 'usdc',
    amount: '50000', // 0.05 USDC in microUSDC
    chainId: '84532',
    payTo: '0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA',
    from: TEST_CONFIG.testWalletAddress,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex'),
    signature: crypto.randomBytes(65).toString('hex')
  };

  // Encode as base64 for x402 header
  return Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
}

/**
 * Test the x402 payment flow
 */
async function testX402PaymentFlow() {
  console.log('🧪 Testing x402 Payment Flow');
  console.log('================================');

  try {
    // Step 1: Test without payment header (should return 402)
    console.log('\n📋 Step 1: Testing without payment header...');
    const nopaymentResult = await makeRequest({
      workoutData: TEST_CONFIG.mockWorkoutData,
      payment: {
        walletAddress: TEST_CONFIG.testWalletAddress,
        signature: 'mock_signature',
        message: 'mock_message',
        amount: '50000',
        timestamp: Date.now()
      }
    });

    if (nopaymentResult.statusCode === 402) {
      console.log('✅ Correctly returned 402 Payment Required');
      console.log('💳 Payment challenge:', JSON.stringify(JSON.parse(nopaymentResult.body), null, 2));
    } else {
      console.log('❌ Expected 402, got:', nopaymentResult.statusCode);
    }

    // Step 2: Test with mock x402 payment header
    console.log('\n📋 Step 2: Testing with x402 payment header...');
    const paymentHeader = createMockX402Payment();

    const paymentResult = await makeRequest({
      workoutData: TEST_CONFIG.mockWorkoutData,
      payment: {
        walletAddress: TEST_CONFIG.testWalletAddress,
        signature: 'mock_signature',
        message: 'mock_message',
        amount: '50000',
        timestamp: Date.now()
      }
    }, {
      'X-Payment': paymentHeader
    });

    if (paymentResult.statusCode === 200) {
      console.log('✅ Payment processed successfully');
      console.log('📊 Analysis result received');
      const result = JSON.parse(paymentResult.body);
      console.log('🧠 Analysis preview:', result.analysis?.substring(0, 200) + '...');
    } else {
      console.log('❌ Payment processing failed:', paymentResult.statusCode);
      console.log('💥 Error:', paymentResult.body);
    }

    // Step 3: Test account creation
    console.log('\n📋 Step 3: Testing CDP account creation...');
    const accountResult = await makeRequest({
      workoutData: { test: 'create_wallets' }
    });

    if (accountResult.statusCode === 200) {
      console.log('✅ Account creation test successful');
      console.log('🏦 Account details:', JSON.parse(accountResult.body));
    } else {
      console.log('❌ Account creation failed:', accountResult.statusCode);
      console.log('💥 Error:', accountResult.body);
    }

  } catch (error) {
    console.error('💥 Test suite failed:', error);
  }
}

/**
 * Test the facilitator connectivity
 */
async function testFacilitatorConnectivity() {
  console.log('\n🌐 Testing Facilitator Connectivity');
  console.log('====================================');

  try {
    const facilitatorResponse = await makeHttpRequest(TEST_CONFIG.facilitatorUrl + '/health', 'GET');

    if (facilitatorResponse.statusCode === 200 || facilitatorResponse.statusCode === 404) {
      console.log('✅ Facilitator is reachable');
    } else {
      console.log('⚠️ Facilitator responded with status:', facilitatorResponse.statusCode);
    }
  } catch (error) {
    console.log('❌ Facilitator connectivity failed:', error.message);
  }
}

/**
 * Test RevenueSplitter contract on BaseScan
 */
async function testRevenueSplitterStatus() {
  console.log('\n💰 Testing RevenueSplitter Contract Status');
  console.log('==========================================');

  // Since we can't directly query BaseScan due to CloudFlare, we'll check if the address is valid
  const address = TEST_CONFIG.revenueSplitterAddress;

  console.log('📋 RevenueSplitter Address:', address);
  console.log('🌐 BaseScan URL:', `https://sepolia.basescan.org/address/${address}`);

  // Validate address format
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
    console.log('✅ Address format is valid');
  } else {
    console.log('❌ Invalid address format');
  }

  // Test CDP network connectivity
  try {
    console.log('🔗 Testing Base Sepolia RPC connectivity...');
    // This would normally test RPC but we'll skip for now
    console.log('ℹ️ Base Sepolia network should be accessible via CDP');
  } catch (error) {
    console.log('❌ Network connectivity test failed:', error.message);
  }
}

/**
 * Make HTTP request to Lambda function
 */
function makeRequest(body, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(TEST_CONFIG.lambdaUrl);

    const requestData = JSON.stringify(body);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData),
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(requestData);
    req.end();
  });
}

/**
 * Make generic HTTP request
 */
function makeHttpRequest(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.protocol === 'https:' ? 443 : 80,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'x402-test-client/1.0'
      }
    };

    const requestModule = urlObj.protocol === 'https:' ? https : require('http');

    const req = requestModule.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 x402 Payment Flow Test Suite');
  console.log('================================');
  console.log('Lambda URL:', TEST_CONFIG.lambdaUrl);
  console.log('RevenueSplitter:', TEST_CONFIG.revenueSplitterAddress);
  console.log('Test Wallet:', TEST_CONFIG.testWalletAddress);

  await testFacilitatorConnectivity();
  await testRevenueSplitterStatus();
  await testX402PaymentFlow();

  console.log('\n🎯 Test Summary');
  console.log('===============');
  console.log('✅ If you see successful results above, your x402 integration is working');
  console.log('❌ If you see errors, check the Lambda logs in CloudWatch');
  console.log('💡 Next steps:');
  console.log('   1. Deploy the updated Lambda function');
  console.log('   2. Test with a real wallet and x402 payments');
  console.log('   3. Verify payments appear in RevenueSplitter contract');
  console.log('   4. Monitor CDP account balances and transactions');
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testX402PaymentFlow,
  testFacilitatorConnectivity,
  testRevenueSplitterStatus,
  runTests
};
