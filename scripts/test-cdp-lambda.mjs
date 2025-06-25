#!/usr/bin/env node

/**
 * CDP Lambda Testing Script (ES Module)
 *
 * This script helps you test the CDP SDK integration for AWS Lambda
 * using ES modules and the actual Lambda handler structure.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Console colors for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorLog(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

/**
 * Check if environment variables are properly configured
 */
function checkEnvironmentConfig() {
  colorLog('\n🔧 Checking Lambda Environment Configuration', 'cyan');
  colorLog('='.repeat(50), 'cyan');

  const requiredVars = [
    'CDP_API_KEY_NAME',
    'CDP_PRIVATE_KEY',
    'REVENUE_SPLITTER_ADDRESS'
  ];

  const optionalVars = [
    'CDP_BASE_NAME',
    'CDP_WALLET_ID',
    'CDP_USE_SERVER_SIGNER',
    'AWS_REGION'
  ];

  let allRequired = true;

  // Check required variables
  colorLog('\n📋 Required Variables:', 'bright');
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      colorLog(`  ✅ ${varName}: ${value.length > 50 ? value.substring(0, 50) + '...' : value}`, 'green');
    } else {
      colorLog(`  ❌ ${varName}: MISSING`, 'red');
      allRequired = false;
    }
  });

  // Check optional variables
  colorLog('\n📋 Optional Variables:', 'bright');
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      colorLog(`  ✅ ${varName}: ${value}`, 'green');
    } else {
      colorLog(`  ⚪ ${varName}: Not set`, 'yellow');
    }
  });

  if (!allRequired) {
    colorLog('\n❌ Missing required environment variables!', 'red');
    colorLog('💡 Copy .env.example to .env.local and fill in your values', 'yellow');
    return false;
  }

  colorLog('\n✅ Environment configuration looks good!', 'green');
  return true;
}

/**
 * Test CDP connection using the Lambda module
 */
async function testCDPConnection() {
  colorLog('\n🧪 Testing CDP Connection (Lambda Module)', 'cyan');
  colorLog('='.repeat(45), 'cyan');

  try {
    // Import the Lambda CDP processor
    const cdpModule = await import('../aws-lambda/cdp-payment-processor.mjs');

    colorLog('✅ CDP module imported successfully', 'green');

    // Test connection
    const result = await cdpModule.testCDPConnection();

    if (result.success) {
      colorLog('✅ CDP connection successful!', 'green');
      colorLog(`📊 Wallet Status:`, 'bright');
      colorLog(`   Address: ${result.status.address}`, 'green');
      colorLog(`   Network: ${result.status.network}`, 'green');
      colorLog(`   ETH Balance: ${result.status.balances.ETH} ETH`, 'green');
      colorLog(`   USDC Balance: ${result.status.balances.USDC} USDC`, 'green');

      // Check if wallet needs funding
      const ethBalance = parseFloat(result.status.balances.ETH);
      if (ethBalance < 0.001) {
        colorLog('⚠️ Low ETH balance - fund wallet for gas fees', 'yellow');
        return { success: true, needsFunding: true, status: result.status };
      }

      return { success: true, needsFunding: false, status: result.status };
    } else {
      colorLog('❌ CDP connection failed:', 'red');
      colorLog(`   Error: ${result.error}`, 'red');
      return { success: false, error: result.error };
    }
  } catch (error) {
    colorLog('❌ CDP test failed:', 'red');
    colorLog(`   Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

/**
 * Test Lambda handler with mock payment
 */
async function testLambdaHandler() {
  colorLog('\n🔬 Testing Lambda Handler', 'cyan');
  colorLog('='.repeat(30), 'cyan');

  try {
    // Import the Lambda handler
    const lambdaModule = await import('../aws-lambda/index.mjs');

    colorLog('✅ Lambda module imported successfully', 'green');

    // Create mock Lambda event
    const mockEvent = {
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://localhost:3000'
      },
      body: JSON.stringify({
        workoutData: {
          exercises: [
            {
              name: 'Push-ups',
              reps: 15,
              sets: 3,
              form_score: 85
            }
          ],
          duration: 300,
          totalCalories: 150
        },
        payment: {
          walletAddress: '0x1234567890123456789012345678901234567890',
          signature: '0xmock_signature_for_testing',
          message: 'Payment authorization for premium analysis',
          amount: '50000'
        }
      })
    };

    const mockContext = {
      requestId: 'test-request-123',
      functionName: 'premium-analysis-handler',
      awsRequestId: 'aws-request-456'
    };

    colorLog('📤 Sending mock payment request...', 'blue');

    // Call the handler
    const response = await lambdaModule.handler(mockEvent, mockContext);

    colorLog(`📥 Response Status: ${response.statusCode}`, 'bright');

    if (response.statusCode === 200) {
      const responseBody = JSON.parse(response.body);
      colorLog('✅ Lambda handler test successful!', 'green');
      colorLog('📊 Response includes:', 'bright');
      colorLog(`   Transaction Hash: ${responseBody.transactionHash || 'N/A'}`, 'green');
      colorLog(`   Payment Status: ${responseBody.paymentStatus || 'N/A'}`, 'green');
      colorLog(`   Analysis: ${responseBody.analysis ? 'Generated' : 'Missing'}`, 'green');
      colorLog(`   Is Mock: ${responseBody.isMock ? 'Yes' : 'No'}`, responseBody.isMock ? 'yellow' : 'green');

      return { success: true, response: responseBody };
    } else {
      colorLog('❌ Lambda handler returned error:', 'red');
      colorLog(`   Status: ${response.statusCode}`, 'red');
      colorLog(`   Body: ${response.body}`, 'red');
      return { success: false, statusCode: response.statusCode, body: response.body };
    }

  } catch (error) {
    colorLog('❌ Lambda handler test failed:', 'red');
    colorLog(`   Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

/**
 * Show wallet funding information
 */
async function showFundingInfo() {
  colorLog('\n💰 Server Wallet Funding Information', 'cyan');
  colorLog('='.repeat(40), 'cyan');

  try {
    const cdpModule = await import('../aws-lambda/cdp-payment-processor.mjs');
    const fundingInfo = await cdpModule.fundServerWallet();

    colorLog('🏦 Fund your server wallet:', 'bright');
    colorLog(`   Address: ${fundingInfo.address}`, 'green');
    colorLog(`   Network: ${fundingInfo.network}`, 'green');
    colorLog(`   Faucet: ${fundingInfo.faucetUrl}`, 'blue');

    colorLog('\n💡 Steps to fund:', 'yellow');
    colorLog('   1. Copy the wallet address above', 'yellow');
    colorLog('   2. Go to the faucet URL', 'yellow');
    colorLog('   3. Request testnet ETH for gas fees', 'yellow');
    colorLog('   4. Wait for the transaction to confirm', 'yellow');
    colorLog('   5. Run this script again to verify funding', 'yellow');

    return fundingInfo;
  } catch (error) {
    colorLog('❌ Error getting funding info:', 'red');
    colorLog(`   Error: ${error.message}`, 'red');
    return null;
  }
}

/**
 * Generate deployment package info
 */
function showDeploymentInfo() {
  colorLog('\n📦 Lambda Deployment Information', 'cyan');
  colorLog('='.repeat(40), 'cyan');

  const lambdaFiles = [
    'aws-lambda/index.mjs',
    'aws-lambda/cdp-payment-processor.mjs'
  ];

  colorLog('📂 Required Files:', 'bright');
  lambdaFiles.forEach(file => {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      colorLog(`   ✅ ${file} (${Math.round(stats.size / 1024)}KB)`, 'green');
    } else {
      colorLog(`   ❌ ${file} (MISSING)`, 'red');
    }
  });

  colorLog('\n🔧 Environment Variables for Lambda:', 'bright');
  const requiredEnvVars = [
    'CDP_API_KEY_NAME',
    'CDP_PRIVATE_KEY',
    'CDP_USE_SERVER_SIGNER',
    'REVENUE_SPLITTER_ADDRESS',
    'AWS_REGION'
  ];

  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      colorLog(`   ${varName}=${value.length > 50 ? value.substring(0, 30) + '...' : value}`, 'blue');
    } else {
      colorLog(`   ${varName}=MISSING`, 'red');
    }
  });

  colorLog('\n🚀 Deployment Steps:', 'yellow');
  colorLog('   1. Upload both .mjs files to Lambda', 'yellow');
  colorLog('   2. Set environment variables above', 'yellow');
  colorLog('   3. Test with this script: --test-lambda', 'yellow');
  colorLog('   4. Monitor CloudWatch logs', 'yellow');
}

/**
 * Run comprehensive test suite
 */
async function runComprehensiveTest() {
  colorLog('\n🔄 Running Comprehensive CDP Lambda Test', 'bright');
  colorLog('='.repeat(45), 'bright');

  // Step 1: Check environment
  const envOk = checkEnvironmentConfig();
  if (!envOk) {
    colorLog('\n❌ Environment check failed - stopping here', 'red');
    return;
  }

  // Step 2: Test CDP connection
  const cdpResult = await testCDPConnection();
  if (!cdpResult.success) {
    colorLog('\n❌ CDP connection failed - check credentials', 'red');
    return;
  }

  // Step 3: Show funding info if needed
  if (cdpResult.needsFunding) {
    colorLog('\n⚠️ Wallet needs funding for gas fees', 'yellow');
    await showFundingInfo();
  }

  // Step 4: Test Lambda handler
  const lambdaResult = await testLambdaHandler();
  if (!lambdaResult.success) {
    colorLog('\n❌ Lambda handler test failed', 'red');
    return;
  }

  // Step 5: Show deployment info
  showDeploymentInfo();

  colorLog('\n✅ All tests passed! Your CDP Lambda integration is ready.', 'green');

  if (lambdaResult.response?.isMock) {
    colorLog('⚠️ Note: Payment fell back to mock (expected during testing)', 'yellow');
  } else {
    colorLog('🎉 Real payments are working!', 'green');
  }
}

/**
 * Show help information
 */
function showHelp() {
  colorLog('\n🚀 CDP Lambda Testing Script', 'bright');
  colorLog('='.repeat(30), 'bright');

  colorLog('\n📖 Available Commands:', 'cyan');
  colorLog('  --check-env      Check environment configuration', 'blue');
  colorLog('  --test-cdp       Test CDP connection', 'blue');
  colorLog('  --test-lambda    Test Lambda handler with mock event', 'blue');
  colorLog('  --fund-info      Show wallet funding information', 'blue');
  colorLog('  --deploy-info    Show deployment package information', 'blue');
  colorLog('  --comprehensive  Run all tests', 'blue');
  colorLog('  --help           Show this help message', 'blue');

  colorLog('\n📋 Quick Setup:', 'yellow');
  colorLog('  1. node test-cdp-lambda.mjs --check-env', 'yellow');
  colorLog('  2. node test-cdp-lambda.mjs --test-cdp', 'yellow');
  colorLog('  3. node test-cdp-lambda.mjs --fund-info (if needed)', 'yellow');
  colorLog('  4. node test-cdp-lambda.mjs --test-lambda', 'yellow');
  colorLog('  5. node test-cdp-lambda.mjs --deploy-info', 'yellow');

  colorLog('\n🔗 Useful Links:', 'magenta');
  colorLog('  CDP Portal: https://portal.cdp.coinbase.com/', 'magenta');
  colorLog('  Base Sepolia Faucet: https://www.alchemy.com/faucets/base-sepolia', 'magenta');
  colorLog('  AWS Lambda Console: https://console.aws.amazon.com/lambda/', 'magenta');
  colorLog('  BaseScan: https://sepolia.basescan.org/', 'magenta');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    showHelp();
    return;
  }

  try {
    if (args.includes('--check-env')) {
      checkEnvironmentConfig();
    }

    if (args.includes('--test-cdp')) {
      await testCDPConnection();
    }

    if (args.includes('--test-lambda')) {
      await testLambdaHandler();
    }

    if (args.includes('--fund-info')) {
      await showFundingInfo();
    }

    if (args.includes('--deploy-info')) {
      showDeploymentInfo();
    }

    if (args.includes('--comprehensive')) {
      await runComprehensiveTest();
    }

  } catch (error) {
    colorLog(`\n💥 Script error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
main().catch(console.error);
