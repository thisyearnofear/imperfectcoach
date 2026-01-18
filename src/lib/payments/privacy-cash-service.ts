
import { Connection, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { solanaWalletManager } from "@/lib/payments/solana-wallet-adapter";

// Import internals from privacycash (using direct paths or index exports if available)
// We need to bypass the main class which has Node.js dependencies
import { deposit } from "privacycash/dist/deposit";
import { withdraw } from "privacycash/dist/withdraw";
import { getUtxos, getBalanceFromUtxos } from "privacycash/dist/getUtxos";
import { EncryptionService } from "privacycash/dist/utils/encryption";
import { WasmFactory } from "@lightprotocol/hasher.rs";

// We need to polyfill/mock storage for the SDK functions that expect it
const browserStorage = {
    getItem: (key: string) => window.localStorage.getItem(key),
    setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
    removeItem: (key: string) => window.localStorage.removeItem(key)
} as Storage;

export class PrivacyCashService {
    private encryptionService: EncryptionService | null = null;
    private lightWasm: any = null;

    /**
     * Initialize security context by asking user to sign a login message.
     * This derives the privacy keys deterministically.
     */
    async initialize(): Promise<void> {
        if (this.encryptionService) return;

        if (!solanaWalletManager.isConnected()) {
            throw new Error("Solana wallet must be connected.");
        }

        // 1. Get Signature for Key Derivation
        const messageText = "Privacy Money account sign in";
        const message = new TextEncoder().encode(messageText);

        // Request signature from user's wallet
        let signature: Uint8Array;
        try {
            signature = await solanaWalletManager.signMessage(message);
        } catch (e) {
            throw new Error("User declined to sign privacy login message.");
        }

        // 2. Initialize Encryption Service
        this.encryptionService = new EncryptionService();
        this.encryptionService.deriveEncryptionKeyFromSignature(signature);

        // 3. Initialize Wasm
        this.lightWasm = await WasmFactory.getInstance();

        console.log("✅ Privacy Cash Service Initialized (Browser Mode)");
    }

    private async ensureInitialized() {
        if (!this.encryptionService) {
            await this.initialize();
        }
    }

    private getCircuitPath(): string {
        // Points to public/circuit/transaction2 (.wasm/.zkey are appended by SDK)
        return window.location.origin + "/circuit/transaction2";
    }

    private getTransactionSigner() {
        return async (tx: VersionedTransaction) => {
            // The SDK expects a function that takes a VersionedTransaction, asks user to sign, and returns it.
            // SolanaWalletManager needs to handle VersionedTransaction.
            // Note: Phantom supports VersionedTransaction via signTransaction.
            return await solanaWalletManager.signTransaction(tx as any) as any;
        };
    }

    /**
     * Deposit SOL into private balance
     */
    async depositSOL(amount: number): Promise<string> {
        await this.ensureInitialized();
        console.log(`🛡️ PrivacyCash: Depositing ${amount} SOL...`);

        const result = await deposit({
            publicKey: solanaWalletManager.getPublicKey()!,
            connection: solanaWalletManager.getConnection(),
            amount_in_lamports: Math.floor(amount * 1e9), // SDK expects lamports
            storage: browserStorage,
            encryptionService: this.encryptionService!,
            keyBasePath: this.getCircuitPath(),
            lightWasm: this.lightWasm,
            transactionSigner: this.getTransactionSigner()
        });

        return result.tx;
    }

    /**
     * Withdraw SOL from private balance
     */
    async withdrawSOL(amount: number, toAddress: string): Promise<string> {
        await this.ensureInitialized();
        console.log(`🛡️ PrivacyCash: Withdrawing ${amount} SOL to ${toAddress}...`);

        const result = await withdraw({
            recipientAddress: toAddress,
            lamports: Math.floor(amount * 1e9),
            connection: solanaWalletManager.getConnection(),
            storage: browserStorage,
            encryptionService: this.encryptionService!,
            publicKey: solanaWalletManager.getPublicKey()!, // This is the "sender" context (funds owner)
            keyBasePath: this.getCircuitPath(),
            lightWasm: this.lightWasm
        });

        return result.tx;
    }

    /**
     * Get Private SOL Balance
     */
    async getPrivateBalanceSOL(): Promise<number> {
        if (!solanaWalletManager.isConnected()) return 0;

        // We try to initialize silently if possible, but we need signature.
        // If we don't have encryption service, we can't read balance.
        // Return 0 or prompt? ideally we verify storage. 
        if (!this.encryptionService) {
            // We cannot get private balance without user's signature to decrypt UTXOs.
            // Returning 0 is safer than hanging/prompting unexpectedly.
            return 0;
        }

        try {
            const utxos = await getUtxos({
                connection: solanaWalletManager.getConnection(),
                publicKey: solanaWalletManager.getPublicKey()!,
                encryptionService: this.encryptionService!,
                storage: browserStorage
            });

            const balanceLamports = getBalanceFromUtxos(utxos);
            return balanceLamports / 1e9;
        } catch (e) {
            console.warn("Failed to fetch private balance:", e);
            return 0;
        }
    }

    // ---- USDC Support (Placeholder - mirroring SOL structure) ----
    // To implement USDC, we'd import depositSPL/withdrawSPL and pass USDC Mint address.
    async depositUSDC(amount: number): Promise<string> {
        throw new Error("USDC Privacy not yet fully configured in browser adapter");
    }

    async withdrawUSDC(amount: number, toAddress: string): Promise<string> {
        throw new Error("USDC Privacy not yet fully configured in browser adapter");
    }
}

export const privacyCashService = new PrivacyCashService();
