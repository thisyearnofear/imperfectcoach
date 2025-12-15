
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { CORE_AGENTS } from "../lib/reap-integration.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const PROGRAM_ID = new PublicKey("9u4eVWRf8a7vMDCHsguakB6vxcnCuJssBVBbQAYrKdog");

const IDL = {
    "version": "0.1.0",
    "name": "solana_agent_registry",
    "instructions": [
        {
            "name": "registerAgent",
            "accounts": [
                { "name": "agentProfile", "isMut": true, "isSigner": false },
                { "name": "authority", "isMut": true, "isSigner": true },
                { "name": "systemProgram", "isMut": false, "isSigner": false }
            ],
            "args": [
                { "name": "name", "type": "string" },
                { "name": "endpoint", "type": "string" },
                { "name": "capabilities", "type": { "vec": "string" } }
            ]
        }
    ]
};

async function main() {
    console.log("🚀 Starting Solana Agent Registration...");

    // 1. Setup Wallet
    const privateKeyArray = JSON.parse(process.env.AGENT_SOLANA_PRIVATE_KEY || "[]");
    if (privateKeyArray.length === 0) {
        throw new Error("❌ AGENT_SOLANA_PRIVATE_KEY missing in .env");
    }

    const secretKey = Uint8Array.from(privateKeyArray);
    const walletKp = Keypair.fromSecretKey(secretKey);
    const wallet = new anchor.Wallet(walletKp);

    console.log(`🔑 Wallet Address: ${wallet.publicKey.toBase58()}`);

    // 2. Connector
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
    anchor.setProvider(provider);

    // 3. Check Balance
    const balance = await connection.getBalance(wallet.publicKey);
    console.log(`💰 Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

    if (balance < 0.01 * LAMPORTS_PER_SOL) {
        console.error("❌ Insufficient SOL! Please airdrop funds:");
        console.error(`   solana airdrop 2 ${wallet.publicKey.toBase58()} --url devnet`);
        process.exit(1);
    }

    const program = new Program(IDL, PROGRAM_ID, provider);

    // 4. Register Agents
    console.log(`\n📋 Found ${CORE_AGENTS.length} Core Agents to register...`);

    for (const agent of CORE_AGENTS) {
        console.log(`   Processing: ${agent.name} (${agent.id})...`);

        // Derive PDA for Agent Profile
        // Note: In our simple contract, the seed is [b"agent_profile", authority.key]
        // This means ONE agent profile per wallet.
        // If we want multiple agents, we need different seeds (e.g. agent name or ID).
        // For Phase 1, the Core Agent (Server) acts as THE authority for all its "personas".
        // HOWEVER, the contract limits 1 profile per authority currently.

        // Let's check if we need to modify the contract or just register the "Main" identity.
        // "Imperfect Coach Core" is the main identity. The others (Nutrition, Recovery) are personas managed by the same backend.
        // If they need distinct on-chain identities, they need distinct wallets OR the contract needs to support multiple profiles per authority.

        // For this wrap-up, we will register the PRIMARY identity ("Imperfect Coach Core").

        if (agent.id === "agent-fitness-core-01") {
            try {
                const [agentProfilePda] = await PublicKey.findProgramAddress(
                    [Buffer.from("agent_profile"), wallet.publicKey.toBuffer()],
                    program.programId
                );

                // Check if already registered
                const info = await connection.getAccountInfo(agentProfilePda);
                if (info) {
                    console.log(`      ⚠️ Already registered (Account exists)`);
                    continue;
                }

                await program.methods
                    .registerAgent(agent.name, agent.endpoint, agent.capabilities)
                    .accounts({
                        agentProfile: agentProfilePda,
                        authority: wallet.publicKey,
                        systemProgram: anchor.web3.SystemProgram.programId,
                    })
                    .rpc();

                console.log(`      ✅ Registered successfully! PDA: ${agentProfilePda.toBase58()}`);
            } catch (e) {
                console.error(`      ❌ Failed: ${e.message}`);
                console.error(e);
            }
        } else {
            console.log(`      ℹ️ Skipping sub-agent (contract supports 1 identity per wallet for now)`);
        }
    }
}

main().catch(console.error);
