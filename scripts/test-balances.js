import { createPublicClient, http, getAddress, formatUnits } from 'viem';
import { baseSepolia, avalancheFuji } from 'viem/chains';
import { Connection, PublicKey } from '@solana/web3.js';
import readline from 'readline';

// Contract Addresses - From codebase config
const USDC_ADDRESS_BASE = getAddress("0x036CbD53842c5426634e7929541eC2318f3dCF7e");
const USDC_ADDRESS_AVALANCHE = getAddress("0x5425890298aed601595a70AB815c96711a31Bc65");

const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  }
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function testTokenBalance(walletAddress, chain, tokenAddress, tokenName, decimals = 6) {
  try {
    const client = createPublicClient({
      chain: chain,
      transport: http()
    });

    console.log(`Chain: ${chain.name}`);
    console.log(`${tokenName} Contract: ${tokenAddress}`);
    console.log(`Wallet: ${walletAddress}`);

    const balance = await client.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [walletAddress]
    });

    const fetchedDecimals = await client.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'decimals'
    });

    const formattedBalance = Number(balance) / Math.pow(10, fetchedDecimals);
    
    console.log(`✅ Raw Balance: ${balance}`);
    console.log(`✅ Decimals: ${fetchedDecimals}`);
    console.log(`✅ Formatted Balance: ${formattedBalance} ${tokenName}`);
    
    return formattedBalance;
  } catch (error) {
    console.error(`❌ ${chain.name} ${tokenName} Error:`, error.message);
    return null;
  }
}

async function testNativeBalance(walletAddress, chain) {
  try {
    const client = createPublicClient({
      chain: chain,
      transport: http()
    });

    console.log(`Chain: ${chain.name}`);
    console.log(`Wallet: ${walletAddress}`);

    const balance = await client.getBalance({
      address: walletAddress
    });

    const nativeSymbol = chain.id === avalancheFuji.id ? 'AVAX' : 'ETH';
    const formattedBalance = Number(formatUnits(balance, 18));
    
    console.log(`✅ Balance: ${formattedBalance} ${nativeSymbol}`);
    
    return formattedBalance;
  } catch (error) {
    console.error(`❌ ${chain.name} Native Balance Error:`, error.message);
    return null;
  }
}

async function testBaseBalance(walletAddress) {
  console.log("\n🔵 Testing Base Sepolia USDC Balance...");
  return testTokenBalance(walletAddress, baseSepolia, USDC_ADDRESS_BASE, 'USDC');
}

async function testBaseETHBalance(walletAddress) {
  console.log("\n🟢 Testing Base Sepolia ETH Balance...");
  return testNativeBalance(walletAddress, baseSepolia);
}

async function testAvalancheBalance(walletAddress) {
  console.log("\n🟠 Testing Avalanche Fuji USDC Balance...");
  return testTokenBalance(walletAddress, avalancheFuji, USDC_ADDRESS_AVALANCHE, 'USDC');
}

async function testAvalancheAVAXBalance(walletAddress) {
  console.log("\n🟡 Testing Avalanche Fuji AVAX Balance...");
  return testNativeBalance(walletAddress, avalancheFuji);
}

async function testSolanaBalance(walletAddress) {
  console.log("\n🟣 Testing Solana Devnet SOL Balance...");
  
  try {
    const connection = new Connection('https://api.devnet.solana.com');
    const publicKey = new PublicKey(walletAddress);
    
    console.log(`Network: Solana Devnet`);
    console.log(`Wallet: ${walletAddress}`);

    const balance = await connection.getBalance(publicKey);
    const solBalance = balance / 1e9;
    
    console.log(`✅ SOL Balance: ${solBalance} SOL`);
    
    return solBalance;
  } catch (error) {
    console.error("❌ Solana SOL Balance Error:", error.message);
    return null;
  }
}

async function testSolanaUSDCBalance(walletAddress) {
  console.log("\n🟣 Testing Solana Devnet USDC Balance...");
  
  try {
    const connection = new Connection('https://api.devnet.solana.com');
    const publicKey = new PublicKey(walletAddress);
    
    // Solana Devnet USDC mint address
    const usdcMint = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
    
    console.log(`Network: Solana Devnet`);
    console.log(`USDC Mint: ${usdcMint.toString()}`);
    console.log(`Wallet: ${walletAddress}`);

    // Get token accounts for this wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { mint: usdcMint }
    );

    if (tokenAccounts.value.length === 0) {
      console.log(`✅ USDC Balance: 0 USDC (no token account)`);
      return 0;
    }

    const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
    console.log(`✅ USDC Balance: ${balance} USDC`);
    
    return balance;
  } catch (error) {
    console.error("❌ Solana USDC Balance Error:", error.message);
    return null;
  }
}

async function runTests() {
  console.log("🧪 Testing Multichain Balance Fetching Implementation\n");
  
  // Get wallet addresses
  const evmWallet = (await askQuestion("Enter EVM wallet address (0x...): ")).trim();
  const solanaWallet = (await askQuestion("Enter Solana wallet address: ")).trim();
  
  console.log("\n🚀 Starting comprehensive multichain tests...");
  
  // Base Sepolia tests
  const baseUSdc = await testBaseBalance(evmWallet);
  const baseETH = await testBaseETHBalance(evmWallet);
  
  // Avalanche Fuji tests
  const avaxUsdc = await testAvalancheBalance(evmWallet);
  const avaxBalance = await testAvalancheAVAXBalance(evmWallet);
  
  // Solana tests
  const solBalance = await testSolanaBalance(solanaWallet);
  const solanaUsdcBalance = await testSolanaUSDCBalance(solanaWallet);
  
  console.log("\n📊 Comprehensive Test Results:");
  console.log("\n🔵 Base Sepolia:");
  console.log(`   USDC: ${baseUSdc !== null ? baseUSdc + ' USDC' : 'Failed'}`);
  console.log(`   ETH: ${baseETH !== null ? baseETH + ' ETH' : 'Failed'}`);
  console.log("\n🟠 Avalanche Fuji:");
  console.log(`   USDC: ${avaxUsdc !== null ? avaxUsdc + ' USDC' : 'Failed'}`);
  console.log(`   AVAX: ${avaxBalance !== null ? avaxBalance + ' AVAX' : 'Failed'}`);
  console.log("\n🟣 Solana Devnet:");
  console.log(`   SOL: ${solBalance !== null ? solBalance + ' SOL' : 'Failed'}`);
  console.log(`   USDC: ${solanaUsdcBalance !== null ? solanaUsdcBalance + ' USDC' : 'Failed'}`);
  
  const allPassed = [baseUSdc, baseETH, avaxUsdc, avaxBalance, solBalance, solanaUsdcBalance].every(b => b !== null);
  if (allPassed) {
    console.log("\n✅ All tests passed! Multichain balance fetching is working.");
  } else {
    console.log("\n❌ Some tests failed. Check the errors above.");
  }
  
  rl.close();
}

runTests().catch(console.error);
