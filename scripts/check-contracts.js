#!/usr/bin/env node

const https = require("https");
const { createPublicClient, http, parseAbi, formatUnits } = require("viem");
const { baseSepolia } = require("viem/chains");
require("dotenv").config({ path: ".env.local" });

// Configuration
const CONFIG = {
  BASESCAN_API_KEY: process.env.BASESCAN_API_KEY,
  BASESCAN_BASE_URL: "https://api-sepolia.basescan.org/api",
  CONTRACTS: {
    RevenueSplitter: "0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA",
    CoachOperator: "0xdEc2d60c9526106a8e4BBd01d70950f6694053A3",
    ImperfectCoachPassport: "0x7c95712a2bce65e723cE99C190f6bd6ff73c4212",
  },
  BASE_SEPOLIA_RPC: "https://sepolia.base.org",
  USDC_ADDRESS: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia USDC
};

// Contract ABIs (minimal)
const PAYMENT_SPLITTER_ABI = parseAbi([
  "function totalShares() view returns (uint256)",
  "function totalReleased() view returns (uint256)",
  "function shares(address account) view returns (uint256)",
  "function released(address account) view returns (uint256)",
  "function payee(uint256 index) view returns (address)",
  "function releasable(address account) view returns (uint256)",
  "event PaymentReceived(address from, uint256 amount)",
  "event PaymentReleased(address to, uint256 amount)",
]);

const ERC20_ABI = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
]);

// Create viem client
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(CONFIG.BASE_SEPOLIA_RPC),
});

/**
 * Make BaseScan API request
 */
function makeBaseScanRequest(params) {
  return new Promise((resolve, reject) => {
    const queryParams = new URLSearchParams({
      ...params,
      apikey: CONFIG.BASESCAN_API_KEY,
    });

    const url = `${CONFIG.BASESCAN_BASE_URL}?${queryParams}`;

    https
      .get(url, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${error.message}`));
          }
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

/**
 * Get contract transactions
 */
async function getContractTransactions(address, contractName) {
  console.log(`\n📋 ${contractName} Transaction History`);
  console.log("=".repeat(50));

  try {
    const response = await makeBaseScanRequest({
      module: "account",
      action: "txlist",
      address: address,
      startblock: 0,
      endblock: 99999999,
      page: 1,
      offset: 10,
      sort: "desc",
    });

    if (response.status === "1" && response.result) {
      console.log(`✅ Found ${response.result.length} transactions`);

      if (response.result.length === 0) {
        console.log(
          "❌ NO TRANSACTIONS FOUND - This explains why payments aren't appearing!"
        );
        return [];
      }

      response.result.forEach((tx, index) => {
        console.log(`\n${index + 1}. Transaction: ${tx.hash}`);
        console.log(`   From: ${tx.from}`);
        console.log(`   To: ${tx.to}`);
        console.log(
          `   Value: ${formatUnits(BigInt(tx.value || "0"), 18)} ETH`
        );
        console.log(
          `   Status: ${
            tx.txreceipt_status === "1" ? "✅ Success" : "❌ Failed"
          }`
        );
        console.log(`   Gas Used: ${tx.gasUsed}`);
        console.log(
          `   Date: ${new Date(parseInt(tx.timeStamp) * 1000).toISOString()}`
        );
      });

      return response.result;
    } else {
      console.log(`❌ API Error: ${response.message || "Unknown error"}`);
      return [];
    }
  } catch (error) {
    console.error(`💥 Error fetching transactions: ${error.message}`);
    return [];
  }
}

/**
 * Get ERC-20 token transfers to contract
 */
async function getTokenTransfers(address, contractName) {
  console.log(`\n💰 ${contractName} Token Transfers (USDC)`);
  console.log("=".repeat(50));

  try {
    const response = await makeBaseScanRequest({
      module: "account",
      action: "tokentx",
      contractaddress: CONFIG.USDC_ADDRESS,
      address: address,
      page: 1,
      offset: 100,
      startblock: 0,
      endblock: 27025143,
      sort: "desc",
    });

    if (response.status === "1" && response.result) {
      console.log(`✅ Found ${response.result.length} token transfers`);

      if (response.result.length === 0) {
        console.log(
          "❌ NO USDC TRANSFERS FOUND - Payments are not reaching the contract!"
        );
        return [];
      }

      response.result.forEach((transfer, index) => {
        const amount = formatUnits(
          BigInt(transfer.value),
          parseInt(transfer.tokenDecimal)
        );
        console.log(`\n${index + 1}. Token Transfer: ${transfer.hash}`);
        console.log(`   From: ${transfer.from}`);
        console.log(`   To: ${transfer.to}`);
        console.log(`   Amount: ${amount} ${transfer.tokenSymbol}`);
        console.log(
          `   Date: ${new Date(
            parseInt(transfer.timeStamp) * 1000
          ).toISOString()}`
        );
      });

      return response.result;
    } else {
      console.log(`❌ API Error: ${response.message || "Unknown error"}`);
      return [];
    }
  } catch (error) {
    console.error(`💥 Error fetching token transfers: ${error.message}`);
    return [];
  }
}

/**
 * Check contract balance and state
 */
async function checkContractState(address, contractName) {
  console.log(`\n🔍 ${contractName} Contract State`);
  console.log("=".repeat(50));

  try {
    // Check ETH balance
    const ethBalance = await publicClient.getBalance({ address });
    console.log(`💎 ETH Balance: ${formatUnits(ethBalance, 18)} ETH`);

    // Check USDC balance
    const usdcBalance = await publicClient.readContract({
      address: CONFIG.USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [address],
    });
    console.log(`💵 USDC Balance: ${formatUnits(usdcBalance, 6)} USDC`);

    // If it's the RevenueSplitter, check payment splitter state
    if (contractName === "RevenueSplitter") {
      try {
        const totalShares = await publicClient.readContract({
          address,
          abi: PAYMENT_SPLITTER_ABI,
          functionName: "totalShares",
        });
        console.log(`📊 Total Shares: ${totalShares.toString()}`);

        const totalReleased = await publicClient.readContract({
          address,
          abi: PAYMENT_SPLITTER_ABI,
          functionName: "totalReleased",
        });
        console.log(`💸 Total Released: ${formatUnits(totalReleased, 18)} ETH`);

        // Check each payee
        for (let i = 0; i < 3; i++) {
          try {
            const payee = await publicClient.readContract({
              address,
              abi: PAYMENT_SPLITTER_ABI,
              functionName: "payee",
              args: [BigInt(i)],
            });

            const shares = await publicClient.readContract({
              address,
              abi: PAYMENT_SPLITTER_ABI,
              functionName: "shares",
              args: [payee],
            });

            const released = await publicClient.readContract({
              address,
              abi: PAYMENT_SPLITTER_ABI,
              functionName: "released",
              args: [payee],
            });

            const releasable = await publicClient.readContract({
              address,
              abi: PAYMENT_SPLITTER_ABI,
              functionName: "releasable",
              args: [payee],
            });

            console.log(`\n👤 Payee ${i + 1}: ${payee}`);
            console.log(`   Shares: ${shares.toString()}`);
            console.log(`   Released: ${formatUnits(released, 18)} ETH`);
            console.log(`   Releasable: ${formatUnits(releasable, 18)} ETH`);
          } catch (payeeError) {
            if (i === 0) {
              console.log(`❌ Error reading payee data: ${payeeError.message}`);
            }
            break;
          }
        }
      } catch (splitterError) {
        console.log(
          `⚠️ Could not read PaymentSplitter data: ${splitterError.message}`
        );
      }
    }
  } catch (error) {
    console.error(`💥 Error checking contract state: ${error.message}`);
  }
}

/**
 * Check contract bytecode to verify deployment
 */
async function checkContractDeployment(address, contractName) {
  console.log(`\n🏗️ ${contractName} Deployment Status`);
  console.log("=".repeat(50));

  try {
    const bytecode = await publicClient.getBytecode({ address });

    if (bytecode && bytecode !== "0x") {
      console.log(`✅ Contract is deployed`);
      console.log(`📦 Bytecode length: ${bytecode.length - 2} bytes`);
      console.log(
        `🔗 BaseScan: https://sepolia.basescan.org/address/${address}`
      );
    } else {
      console.log(`❌ NO CONTRACT FOUND AT ADDRESS - This is a major issue!`);
    }
  } catch (error) {
    console.error(`💥 Error checking deployment: ${error.message}`);
  }
}

/**
 * Main diagnostic function
 */
async function runDiagnostics() {
  console.log("🔍 Imperfect Coach Contract Diagnostics");
  console.log("=====================================");
  console.log(`🌐 Network: Base Sepolia`);
  console.log(`🔗 RPC: ${CONFIG.BASE_SEPOLIA_RPC}`);
  console.log(`📊 BaseScan API: ${CONFIG.BASESCAN_BASE_URL}`);

  const issues = [];

  for (const [contractName, address] of Object.entries(CONFIG.CONTRACTS)) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`🔍 ANALYZING: ${contractName}`);
    console.log(`📍 Address: ${address}`);
    console.log(`${"=".repeat(80)}`);

    // Check deployment
    await checkContractDeployment(address, contractName);

    // Check state
    await checkContractState(address, contractName);

    // Check transactions
    const transactions = await getContractTransactions(address, contractName);

    // Check token transfers (especially for RevenueSplitter)
    if (contractName === "RevenueSplitter") {
      const transfers = await getTokenTransfers(address, contractName);

      if (transfers.length === 0) {
        issues.push(`❌ ${contractName}: No USDC payments received`);
      }
    }

    if (transactions.length === 0) {
      issues.push(`❌ ${contractName}: No transaction history`);
    }
  }

  // Summary
  console.log(`\n${"=".repeat(80)}`);
  console.log("📋 DIAGNOSTIC SUMMARY");
  console.log(`${"=".repeat(80)}`);

  if (issues.length === 0) {
    console.log("✅ All contracts appear to be functioning correctly");
  } else {
    console.log("❌ Issues found:");
    issues.forEach((issue) => console.log(`   ${issue}`));

    console.log("\n💡 Likely causes:");
    console.log(
      "   1. Lambda function is using mock payments instead of real transactions"
    );
    console.log(
      "   2. x402 payment flow is not properly connected to contract calls"
    );
    console.log(
      "   3. CDP wallet integration is not sending funds to RevenueSplitter"
    );
    console.log(
      "   4. Payment verification is successful but settlement is failing"
    );
  }

  console.log("\n🔧 Next steps:");
  console.log("   1. Check Lambda CloudWatch logs for payment processing");
  console.log("   2. Verify x402 payment headers are being sent");
  console.log("   3. Test CDP wallet balance and transaction capability");
  console.log(
    "   4. Monitor BaseScan for new transactions after payment attempts"
  );
}

// Run diagnostics if called directly
if (require.main === module) {
  runDiagnostics().catch(console.error);
}

module.exports = {
  runDiagnostics,
  checkContractState,
  getContractTransactions,
  getTokenTransfers,
  CONFIG,
};
