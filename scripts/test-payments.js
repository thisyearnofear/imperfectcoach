#!/usr/bin/env node

const {
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  formatUnits,
  parseUnits,
} = require("viem");
const { baseSepolia } = require("viem/chains");
const { privateKeyToAccount } = require("viem/accounts");
require("dotenv").config({ path: ".env.local" });

// Configuration
const CONFIG = {
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  BASESCAN_API_KEY: process.env.BASESCAN_API_KEY,
  BASE_SEPOLIA_RPC: process.env.RPC_URL || "https://sepolia.base.org",
  CONTRACTS: {
    RevenueSplitter:
      process.env.REVENUE_SPLITTER_ADDRESS ||
      "0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA",
    CoachOperator:
      process.env.COACH_OPERATOR_ADDRESS ||
      "0xdEc2d60c9526106a8e4BBd01d70950f6694053A3",
    ImperfectCoachPassport:
      process.env.IMPERFECT_COACH_PASSPORT_ADDRESS ||
      "0x7c95712a2bce65e723cE99C190f6bd6ff73c4212",
  },
  USDC_ADDRESS:
    process.env.USDC_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia USDC
  TEST_PAYMENT_AMOUNT: process.env.TEST_PAYMENT_AMOUNT || "50000", // 0.05 USDC in microUSDC (6 decimals)
};

// Contract ABIs
const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
    stateMutability: "view",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
    stateMutability: "view",
  },
];

const PAYMENT_SPLITTER_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "release",
    outputs: [],
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "releasable",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
    stateMutability: "view",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "shares",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
    stateMutability: "view",
  },
  {
    inputs: [],
    name: "totalShares",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
    stateMutability: "view",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
];

// Create clients
let walletClient, publicClient, account;

function initializeClients() {
  if (!CONFIG.PRIVATE_KEY) {
    throw new Error("❌ PRIVATE_KEY not found in .env.local file");
  }

  if (!CONFIG.BASESCAN_API_KEY) {
    console.warn(
      "⚠️ BASESCAN_API_KEY not found in .env.local file - some features may not work"
    );
  }

  account = privateKeyToAccount(CONFIG.PRIVATE_KEY);
  console.log(`🔑 Using wallet: ${account.address}`);

  publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(CONFIG.BASE_SEPOLIA_RPC),
  });

  walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(CONFIG.BASE_SEPOLIA_RPC),
  });
}

/**
 * Check wallet balances
 */
async function checkWalletBalances() {
  console.log("\n💰 Checking Wallet Balances");
  console.log("=".repeat(40));

  try {
    // ETH balance
    const ethBalance = await publicClient.getBalance({
      address: account.address,
    });
    console.log(`💎 ETH Balance: ${formatUnits(ethBalance, 18)} ETH`);

    // USDC balance
    const usdcBalance = await publicClient.readContract({
      address: CONFIG.USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [account.address],
    });
    console.log(`💵 USDC Balance: ${formatUnits(usdcBalance, 6)} USDC`);

    // Check if we have enough for test payment
    const testAmount = parseUnits(CONFIG.TEST_PAYMENT_AMOUNT, 0); // microUSDC is already in base units
    const testAmountInUSDC = testAmount / BigInt(1000000); // Convert to USDC

    if (usdcBalance < testAmountInUSDC) {
      console.log(
        `❌ Insufficient USDC balance for test payment (need ${formatUnits(
          testAmountInUSDC,
          6
        )} USDC)`
      );
      console.log(
        "💡 You can get Base Sepolia USDC from: https://faucet.circle.com/"
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(`💥 Error checking balances: ${error.message}`);
    return false;
  }
}

/**
 * Send test payment to RevenueSplitter
 */
async function sendTestPayment() {
  console.log("\n💸 Sending Test Payment to RevenueSplitter");
  console.log("=".repeat(50));

  try {
    const revenueSplitterAddress = CONFIG.CONTRACTS.RevenueSplitter;
    const paymentAmount = parseUnits("0.05", 6); // 0.05 USDC

    console.log(
      `📤 Sending ${formatUnits(
        paymentAmount,
        6
      )} USDC to ${revenueSplitterAddress}`
    );

    // Send USDC to RevenueSplitter
    const hash = await walletClient.writeContract({
      address: CONFIG.USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [revenueSplitterAddress, paymentAmount],
    });

    console.log(`📝 Transaction hash: ${hash}`);
    console.log(`🔗 BaseScan: https://sepolia.basescan.org/tx/${hash}`);

    // Wait for confirmation
    console.log("⏳ Waiting for confirmation...");
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === "success") {
      console.log("✅ Payment sent successfully!");
      console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
      return { success: true, hash, receipt };
    } else {
      console.log("❌ Transaction failed");
      return { success: false, hash, receipt };
    }
  } catch (error) {
    console.error(`💥 Error sending payment: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Send ETH to RevenueSplitter (for testing receive function)
 */
async function sendTestETH() {
  console.log("\n💎 Sending Test ETH to RevenueSplitter");
  console.log("=".repeat(40));

  try {
    const revenueSplitterAddress = CONFIG.CONTRACTS.RevenueSplitter;
    const ethAmount = parseEther("0.001"); // 0.001 ETH

    console.log(
      `📤 Sending ${formatUnits(
        ethAmount,
        18
      )} ETH to ${revenueSplitterAddress}`
    );

    const hash = await walletClient.sendTransaction({
      to: revenueSplitterAddress,
      value: ethAmount,
    });

    console.log(`📝 Transaction hash: ${hash}`);
    console.log(`🔗 BaseScan: https://sepolia.basescan.org/tx/${hash}`);

    // Wait for confirmation
    console.log("⏳ Waiting for confirmation...");
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === "success") {
      console.log("✅ ETH sent successfully!");
      console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
      return { success: true, hash, receipt };
    } else {
      console.log("❌ Transaction failed");
      return { success: false, hash, receipt };
    }
  } catch (error) {
    console.error(`💥 Error sending ETH: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Check RevenueSplitter state after payment
 */
async function checkRevenueSplitterState() {
  console.log("\n📊 Checking RevenueSplitter State");
  console.log("=".repeat(40));

  try {
    const revenueSplitterAddress = CONFIG.CONTRACTS.RevenueSplitter;

    // Check ETH balance
    const ethBalance = await publicClient.getBalance({
      address: revenueSplitterAddress,
    });
    console.log(`💎 Contract ETH Balance: ${formatUnits(ethBalance, 18)} ETH`);

    // Check USDC balance
    const usdcBalance = await publicClient.readContract({
      address: CONFIG.USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [revenueSplitterAddress],
    });
    console.log(
      `💵 Contract USDC Balance: ${formatUnits(usdcBalance, 6)} USDC`
    );

    // Check PaymentSplitter state
    try {
      const totalShares = await publicClient.readContract({
        address: revenueSplitterAddress,
        abi: PAYMENT_SPLITTER_ABI,
        functionName: "totalShares",
      });
      console.log(`📊 Total Shares: ${totalShares.toString()}`);

      // Check payees and their releasable amounts
      const payeeAddresses = [
        process.env.PLATFORM_TREASURY ||
          "0x55A5705453Ee82c742274154136Fce8149597058", // Platform Treasury (70%)
        process.env.USER_REWARDS_POOL ||
          "0x3D86Ff165D8bEb8594AE05653249116a6d1fF3f1", // User Rewards Pool (20%)
        process.env.REFERRER_POOL ||
          "0xec4F3Ac60AE169fE27bed005F3C945A112De2c5A", // Referrer Pool (10%)
      ];

      console.log("\n👥 Payee Status:");
      for (let i = 0; i < payeeAddresses.length; i++) {
        const payee = payeeAddresses[i];

        try {
          const shares = await publicClient.readContract({
            address: revenueSplitterAddress,
            abi: PAYMENT_SPLITTER_ABI,
            functionName: "shares",
            args: [payee],
          });

          const releasable = await publicClient.readContract({
            address: revenueSplitterAddress,
            abi: PAYMENT_SPLITTER_ABI,
            functionName: "releasable",
            args: [payee],
          });

          console.log(`   ${i + 1}. ${payee}`);
          console.log(`      Shares: ${shares.toString()}`);
          console.log(`      Releasable: ${formatUnits(releasable, 18)} ETH`);
        } catch (payeeError) {
          console.log(`   ${i + 1}. ${payee} - Error: ${payeeError.message}`);
        }
      }
    } catch (splitterError) {
      console.log(
        `⚠️ PaymentSplitter data not accessible: ${splitterError.message}`
      );
    }
  } catch (error) {
    console.error(`💥 Error checking RevenueSplitter state: ${error.message}`);
  }
}

/**
 * Test the release function for a payee
 */
async function testReleasePayment(payeeAddress) {
  console.log(`\n💰 Testing Release Payment for ${payeeAddress}`);
  console.log("=".repeat(60));

  try {
    const revenueSplitterAddress = CONFIG.CONTRACTS.RevenueSplitter;

    // Check releasable amount first
    const releasable = await publicClient.readContract({
      address: revenueSplitterAddress,
      abi: PAYMENT_SPLITTER_ABI,
      functionName: "releasable",
      args: [payeeAddress],
    });

    console.log(`💵 Releasable amount: ${formatUnits(releasable, 18)} ETH`);

    if (releasable === BigInt(0)) {
      console.log("ℹ️ No funds available for release");
      return;
    }

    // Call release function
    const hash = await walletClient.writeContract({
      address: revenueSplitterAddress,
      abi: PAYMENT_SPLITTER_ABI,
      functionName: "release",
      args: [payeeAddress],
    });

    console.log(`📝 Release transaction hash: ${hash}`);
    console.log(`🔗 BaseScan: https://sepolia.basescan.org/tx/${hash}`);

    // Wait for confirmation
    console.log("⏳ Waiting for confirmation...");
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === "success") {
      console.log("✅ Release successful!");
      console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
    } else {
      console.log("❌ Release failed");
    }
  } catch (error) {
    console.error(`💥 Error releasing payment: ${error.message}`);
  }
}

/**
 * Main test function
 */
async function runPaymentTests() {
  console.log("🧪 RevenueSplitter Payment Tests");
  console.log("=".repeat(50));

  try {
    // Initialize clients
    initializeClients();

    // Check wallet balances
    const hasBalance = await checkWalletBalances();
    if (!hasBalance) {
      console.log("\n❌ Insufficient balance to run tests");
      return;
    }

    // Check current state
    await checkRevenueSplitterState();

    // Ask user what to test
    const args = process.argv.slice(2);

    if (args.includes("--send-usdc")) {
      console.log("\n🚀 Testing USDC payment...");
      const result = await sendTestPayment();
      if (result.success) {
        console.log("\n⏳ Waiting 10 seconds for state to update...");
        await new Promise((resolve) => setTimeout(resolve, 10000));
        await checkRevenueSplitterState();
      }
    }

    if (args.includes("--send-eth")) {
      console.log("\n🚀 Testing ETH payment...");
      const result = await sendTestETH();
      if (result.success) {
        console.log("\n⏳ Waiting 10 seconds for state to update...");
        await new Promise((resolve) => setTimeout(resolve, 10000));
        await checkRevenueSplitterState();
      }
    }

    if (args.includes("--release")) {
      const payeeAddress = args[args.indexOf("--release") + 1];
      if (payeeAddress) {
        await testReleasePayment(payeeAddress);
      } else {
        console.log("❌ Please provide payee address after --release");
      }
    }

    if (args.length === 0) {
      console.log("\n💡 Usage:");
      console.log(
        "   node test-payments.js --send-usdc    # Send 0.05 USDC to RevenueSplitter"
      );
      console.log(
        "   node test-payments.js --send-eth     # Send 0.001 ETH to RevenueSplitter"
      );
      console.log(
        "   node test-payments.js --release 0x... # Release funds to payee address"
      );
      console.log(
        "   node test-payments.js --send-usdc --release 0x... # Send payment then release"
      );
      console.log("\n📋 Payee addresses:");
      console.log(
        `   Platform Treasury: ${
          process.env.PLATFORM_TREASURY ||
          "0x55A5705453Ee82c742274154136Fce8149597058"
        }`
      );
      console.log(
        `   User Rewards:      ${
          process.env.USER_REWARDS_POOL ||
          "0x3D86Ff165D8bEb8594AE05653249116a6d1fF3f1"
        }`
      );
      console.log(
        `   Referrer Pool:     ${
          process.env.REFERRER_POOL ||
          "0xec4F3Ac60AE169fE27bed005F3C945A112De2c5A"
        }`
      );
    }
  } catch (error) {
    console.error(`💥 Test suite failed: ${error.message}`);
  }
}

// Run tests if called directly
if (require.main === module) {
  runPaymentTests().catch(console.error);
}

module.exports = {
  runPaymentTests,
  sendTestPayment,
  sendTestETH,
  checkRevenueSplitterState,
  testReleasePayment,
  CONFIG,
};
