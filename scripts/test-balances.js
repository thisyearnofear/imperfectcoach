import { createPublicClient, http, getAddress } from 'viem';
import { baseSepolia } from 'viem/chains';
import { Connection, PublicKey } from '@solana/web3.js';
import readline from 'readline';

// Base Sepolia USDC - From Blockscout
const USDC_ADDRESS_BASE = getAddress("0x036CbD53842c5426634e7929541eC2318f3dCF7e");
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

async function testBaseBalance(walletAddress) {
  console.log("\n🔵 Testing Base Sepolia USDC Balance...");
  
  try {
    const client = createPublicClient({
      chain: baseSepolia,
      transport: http()
    });

    console.log(`Chain: ${baseSepolia.name}`);
    console.log(`USDC Contract: ${USDC_ADDRESS_BASE}`);
    console.log(`Wallet: ${walletAddress}`);

    const balance = await client.readContract({
      address: USDC_ADDRESS_BASE,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [walletAddress]
    });

    const decimals = await client.readContract({
      address: USDC_ADDRESS_BASE,
      abi: ERC20_ABI,
      functionName: 'decimals'
    });

    const formattedBalance = Number(balance) / Math.pow(10, decimals);
    
    console.log(`✅ Raw Balance: ${balance}`);
    console.log(`✅ Decimals: ${decimals}`);
    console.log(`✅ Formatted Balance: ${formattedBalance} USDC`);
    
    return formattedBalance;
  } catch (error) {
    console.error("❌ Base Balance Error:", error.message);
    return null;
  }
}

async function testSolanaBalance(walletAddress) {
  console.log("\n🟣 Testing Solana Devnet Balance...");
  
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
    console.error("❌ Solana Balance Error:", error.message);
    return null;
  }
}

async function runTests() {
  console.log("🧪 Testing USDC Balance Fetching Implementation\n");
  
  // Get wallet addresses
  const baseWallet = await askQuestion("Enter Base Sepolia wallet address (0x...): ");
  const solanaWallet = await askQuestion("Enter Solana wallet address: ");
  
  console.log("\n🚀 Starting tests...");
  
  const baseBalance = await testBaseBalance(baseWallet);
  const solanaBalance = await testSolanaBalance(solanaWallet);
  
  console.log("\n📊 Test Results:");
  console.log(`Base USDC: ${baseBalance !== null ? baseBalance + ' USDC' : 'Failed'}`);
  console.log(`Solana SOL: ${solanaBalance !== null ? solanaBalance + ' SOL' : 'Failed'}`);
  
  if (baseBalance !== null && solanaBalance !== null) {
    console.log("\n✅ All tests passed! Balance fetching is working.");
  } else {
    console.log("\n❌ Some tests failed. Check the errors above.");
  }
  
  rl.close();
}

runTests().catch(console.error);
