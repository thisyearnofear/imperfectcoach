import { createPublicClient, http, getAddress } from 'viem';
import { baseSepolia } from 'viem/chains';

const USDC_ADDRESS = getAddress("0x036CbD53842c5426634e7929541fC2318B3d053F");

async function verifyContract() {
  const client = createPublicClient({
    chain: baseSepolia,
    transport: http()
  });

  console.log("🔍 Verifying Base Sepolia USDC Contract...");
  console.log(`Address: ${USDC_ADDRESS}`);

  try {
    // Check if address has code
    const code = await client.getBytecode({ address: USDC_ADDRESS });
    console.log(`Has code: ${code ? 'Yes' : 'No'}`);
    
    if (!code) {
      console.log("❌ No contract found at this address");
      console.log("💡 Try the official Base Sepolia USDC: 0x036CbD53842c5426634e7929541fC2318B3d053F");
      return;
    }

    // Try to get contract info
    const balance = await client.getBalance({ address: USDC_ADDRESS });
    console.log(`Contract ETH balance: ${balance} wei`);
    
    console.log("✅ Contract exists!");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

verifyContract();
