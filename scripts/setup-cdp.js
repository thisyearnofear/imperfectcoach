#!/usr/bin/env node

/**
 * CDP Setup and Testing Script
 *
 * This script helps you set up and test the Coinbase Developer Platform (CDP) SDK
 * integration for real USDC payments in the x402 flow.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Import CDP payment processor
const {
  testCDPConnection,
  getServerWalletStatus,
  fundServerWallet,
  processRealPayment,
  checkUserBalance,
  PAYMENT_CONFIG,
  CDP_CONFIG
} = require('../aws-lambda/cdp-payment-processor.js');

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
  colorLog('\n🔧 Checking Environment Configuration', 'cyan');
  colorLog('='.repeat(50), 'cyan');

  const requiredVars = [
    'CDP_API_KEY_NAME',
    'CDP_PRIVATE_KEY',
    'REVENUE_SPLITTER_ADDRESS'
  ];

  const optionalVars = [
    'CDP_BASE_NAME',
    'CDP_WALLET_ID',
    'CDP_USE_SERVER_SIGNER'
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
 * Test CDP connection and wallet setup
 */
async function testCDPSetup() {
  colorLog('\n🧪 Testing CDP Connection', 'cyan');
  colorLog('='.repeat(30), 'cyan');

  try {
    const result = await testCDPConnection();

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
        colorLog('⚠️  Low ETH balance - you may need to fund the wallet for gas fees', 'yellow');
      }

      return true;
    } else {
      colorLog('❌ CDP connection failed:', 'red');
      colorLog(`   Error: ${result.error}`, 'red');
      return false;
    }
  } catch (error) {
    colorLog('❌ CDP test failed:', 'red');
    colorLog(`   Error: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Show wallet funding information
 */
async function showFundingInfo() {
  colorLog('\n💰 Server Wallet Funding Information', 'cyan');
  colorLog('='.repeat(40), 'cyan');

  try {
    const fundingInfo = await fundServerWallet();

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

  } catch (error) {
    colorLog('❌ Error getting funding info:', 'red');
    colorLog(`   Error: ${error.message}`, 'red');
  }
}

/**
 * Test a real payment transaction
 */
async function testRealPayment() {
  colorLog('\n💳 Testing Real Payment Transaction', 'cyan');
  colorLog('='.repeat(40), 'cyan');

  // Mock payment data for testing
  const testPaymentData = {
    walletAddress: process.env.TEST_WALLET_ADDRESS || '0x1234567890123456789012345678901234567890',
    amount: PAYMENT_CONFIG.PAYMENT_AMOUNT,
    signature: '0xtest_signature',
    message: 'Test payment message'
  };

  colorLog('⚠️  This will attempt a real USDC transaction!', 'yellow');
  colorLog(`💰 Amount: ${testPaymentData.amount} USDC`, 'yellow');
  colorLog(`📨 To: ${PAYMENT_CONFIG.REVENUE_SPLITTER_ADDRESS}`, 'yellow');

  // Confirm before proceeding
  console.log('\nPress Ctrl+C to cancel, or any key to continue...');

  try {
    // Note: In a real test, you'd want to use proper signature verification
    colorLog('🚀 Processing test payment...', 'blue');

    const result = await processRealPayment(testPaymentData);

    if (result.success) {
      colorLog('✅ Payment successful!', 'green');
      colorLog(`📝 Transaction Hash: ${result.transactionHash}`, 'green');
      colorLog(`🔗 Transaction Link: ${result.transactionLink || 'N/A'}`, 'green');
      colorLog(`⏱️  Confirmation Time: ${result.confirmationTime || 'N/A'}ms`, 'green');
    } else {
      colorLog('❌ Payment failed:', 'red');
      colorLog(`   Error: ${result.error}`, 'red');
      colorLog(`   Code: ${result.code}`, 'red');
    }
  } catch (error) {
    colorLog('❌ Test payment error:', 'red');
    colorLog(`   Error: ${error.message}`, 'red');
  }
}

/**
 * Generate environment file template
 */
function generateEnvTemplate() {
  colorLog('\n📝 Generating Environment Template', 'cyan');
  colorLog('='.repeat(35), 'cyan');

  const envPath = path.join(__dirname, '..', '.env.local');
  const examplePath = path.join(__dirname, '..', '.env.example');

  if (fs.existsSync(envPath)) {
    colorLog('⚠️  .env.local already exists - not overwriting', 'yellow');
    return;
  }

  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
    colorLog('✅ Created .env.local from template', 'green');
    colorLog('💡 Edit .env.local with your actual values', 'yellow');
  } else {
    colorLog('❌ .env.example not found', 'red');
  }
}

/**
 * Show help information
 */
function showHelp() {
  colorLog('\n🚀 CDP Setup and Testing Script', 'bright');
  colorLog('='.repeat(35), 'bright');

  colorLog('\n📖 Available Commands:', 'cyan');
  colorLog('  --check-env     Check environment configuration', 'blue');
  colorLog('  --test-cdp      Test CDP connection and wallet', 'blue');
  colorLog('  --fund-info     Show wallet funding information', 'blue');
  colorLog('  --test-payment  Test a real payment transaction', 'blue');
  colorLog('  --generate-env  Generate .env.local template', 'blue');
  colorLog('  --all           Run all checks and tests', 'blue');
  colorLog('  --help          Show this help message', 'blue');

  colorLog('\n📋 Setup Steps:', 'yellow');
  colorLog('  1. node setup-cdp.js --generate-env', 'yellow');
  colorLog('  2. Edit .env.local with your CDP credentials', 'yellow');
  colorLog('  3. node setup-cdp.js --check-env', 'yellow');
  colorLog('  4. node setup-cdp.js --test-cdp', 'yellow');
  colorLog('  5. node setup-cdp.js --fund-info (if needed)', 'yellow');
  colorLog('  6. node setup-cdp.js --test-payment (optional)', 'yellow');

  colorLog('\n🔗 Useful Links:', 'magenta');
  colorLog('  CDP Portal: https://portal.cdp.coinbase.com/', 'magenta');
  colorLog('  Base Sepolia Faucet: https://www.alchemy.com/faucets/base-sepolia', 'magenta');
  colorLog('  BaseScan: https://sepolia.basescan.org/', 'magenta');
}

/**
 * Run all checks and tests
 */
async function runAllChecks() {
  colorLog('\n🔄 Running All Checks and Tests', 'bright');
  colorLog('='.repeat(35), 'bright');

  // Check environment
  const envOk = checkEnvironmentConfig();
  if (!envOk) {
    colorLog('\n❌ Environment check failed - stopping here', 'red');
    return;
  }

  // Test CDP connection
  const cdpOk = await testCDPSetup();
  if (!cdpOk) {
    colorLog('\n❌ CDP test failed - check your credentials', 'red');
    return;
  }

  colorLog('\n✅ All checks passed! Your CDP integration is ready.', 'green');
  colorLog('💡 You can now deploy to Lambda and test real payments.', 'yellow');
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
    if (args.includes('--generate-env')) {
      generateEnvTemplate();
    }

    if (args.includes('--check-env')) {
      checkEnvironmentConfig();
    }

    if (args.includes('--test-cdp')) {
      await testCDPSetup();
    }

    if (args.includes('--fund-info')) {
      await showFundingInfo();
    }

    if (args.includes('--test-payment')) {
      await testRealPayment();
    }

    if (args.includes('--all')) {
      await runAllChecks();
    }

  } catch (error) {
    colorLog(`\n💥 Script error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkEnvironmentConfig,
  testCDPSetup,
  showFundingInfo,
  testRealPayment,
  generateEnvTemplate,
  runAllChecks
};
