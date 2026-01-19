export const X402_NETWORKS = {
    "base-mainnet": {
        amount: "50000",
        asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        payTo: "0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA",
        chainId: 8453,
        explorerUrl: "https://basescan.org",
    },
    "base-sepolia": {
        amount: "50000",
        asset: "0x036CbD53842c5426634e7929541fC2318B3d053F", // USDC on Sepolia
        payTo: "0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA",
        chainId: 84532,
        explorerUrl: "https://base-sepolia.blockscout.com",
        // usdcAddress alias for consistency with core-handler
        usdcAddress: "0x036CbD53842c5426634e7929541fC2318B3d053F"
    },
    "avalanche-mainnet": {
        amount: "50000",
        asset: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
        payTo: "0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA",
        chainId: 43114,
        explorerUrl: "https://snowtrace.io",
    },
    "avalanche-fuji": {
        amount: "50000",
        asset: "0x5425890298aed601595a70AB815c96711a31Bc65",
        payTo: "0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA",
        chainId: 43113,
        explorerUrl: "https://testnet.snowtrace.io",
        usdcAddress: "0x5425890298aed601595a70AB815c96711a31Bc65"
    },
    "solana-devnet": {
        amount: "50000",
        asset: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC-Dev
        payTo: "CmGgLQL36Y9ubtTsy2zmE46TAxwCBm66onZmPPhUWNqv",
        explorerUrl: "https://explorer.solana.com?cluster=devnet",
        usdcAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
    },
};
