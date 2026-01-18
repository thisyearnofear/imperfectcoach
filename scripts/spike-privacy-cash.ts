
import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as privacyCash from "privacycash";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

// Fix for __dirname in ESM if needed, though tsx usually handles it.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
    console.log("🔍 Starting Privacy Cash Spike...");

    // 1. Inspect the library structure
    console.log("📦 Privacy Cash Exports:", Object.keys(privacyCash));
    // @ts-ignore
    if (privacyCash.default) {
        // @ts-ignore
        console.log("📦 Default Export Keys:", Object.keys(privacyCash.default));
    }

    // 2. Setup Wallet
    const KEYPAIR_PATH = path.resolve(__dirname, "spike-wallet.json");
    let wallet: Keypair;

    if (fs.existsSync(KEYPAIR_PATH)) {
        const secretKey = JSON.parse(fs.readFileSync(KEYPAIR_PATH, "utf-8"));
        wallet = Keypair.fromSecretKey(new Uint8Array(secretKey));
        console.log("🔑 Loaded existing wallet:", wallet.publicKey.toBase58());
    } else {
        wallet = Keypair.generate();
        fs.writeFileSync(KEYPAIR_PATH, JSON.stringify(Array.from(wallet.secretKey)));
        console.log("🆕 Created new wallet:", wallet.publicKey.toBase58());
        console.log("⚠️  SAVE THIS FILE OR FUND THIS ADDRESS:");
        console.log(`   solana airdrop 1 ${wallet.publicKey.toBase58()} --url devnet`);
    }

    // 3. Check Balance
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const balance = await connection.getBalance(wallet.publicKey);
    console.log(`💰 Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

    // 4. Inspect Inner Exports
    // @ts-ignore
    const PC = privacyCash.PrivacyCash;
    console.log("📦 PrivacyCash Inner Keys:", Object.keys(PC || {}));
    if (PC && PC.prototype) {
        console.log("📦 PrivacyCash Prototype:", Object.getOwnPropertyNames(PC.prototype));
    }

    // 5. Attempt Airdrop if needed
    if (balance < 0.01 * LAMPORTS_PER_SOL) {
        console.log("💧 Attempting Airdrop of 1 SOL...");
        try {
            const signature = await connection.requestAirdrop(wallet.publicKey, 1 * LAMPORTS_PER_SOL);
            await connection.confirmTransaction(signature);
            console.log("✅ Airdrop successful!");
        } catch (e: any) {
            console.log("❌ Airdrop failed (rate limited likely):", e.message);
            console.log("⚠️ Please manually fund: " + wallet.publicKey.toBase58());
            return;
        }
    }

    // 6. Attempt execution
    try {
        console.log("🚀 Initializing...");

        // If PrivacyCash is the class
        if (typeof PC === 'function') {
            // Try instantiation: new PrivacyCash(wallet, connection) or similar order
            // Inspect constructor length if possible, or just try
            try {
                // @ts-ignore
                const client = new PC(wallet, connection);
                console.log("✅ Instantiated with (wallet, connection)");
                // check methods
            } catch (e) {
                try {
                    // @ts-ignore
                    const client = new PC(connection, wallet);
                    console.log("✅ Instantiated with (connection, wallet)");
                } catch (e2: any) {
                    console.log("⚠️ Instantiation failed. Constructor signature unknown.");
                }
            }
        }

    } catch (err: any) {
        console.error("💥 Error during interaction:", err);
    }
}

run();
