// Solana Payment Module - NEW implementation following existing patterns
// MODULAR design with CLEAN separation of concerns

import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
// Types defined locally - payment-types.ts only has BlockchainScore, UserProfile, ContractConfig

export interface SolanaPaymentRequest {
  amount: bigint;
  recipient: string;
  reference?: string;
  label?: string;
  message?: string;
  memo?: string;
}

export interface SolanaTransactionResult {
  signature: string;
  confirmed: boolean;
  slot?: number;
  blockTime?: number;
}

// Local PaymentRequest type for createPayment method
export interface PaymentRequest {
  amount: bigint;
  nonce?: string;
  context?: string;
  timestamp?: number;
}

export class SolanaPaymentModule {
  private connection: Connection;
  private cluster: 'devnet' | 'testnet' | 'mainnet-beta';

  constructor(cluster: 'devnet' | 'testnet' | 'mainnet-beta' = 'devnet') {
    this.cluster = cluster;
    this.initializeConnection();
  }

  /**
   * INITIALIZE SOLANA CONNECTION
   * Following PERFORMANT principle with connection pooling
   */
  private initializeConnection() {
    try {
      const rpcUrl = this.getRpcUrl();
      console.log(`🔌 Connecting to Solana ${this.cluster}:`, rpcUrl);
      this.connection = new Connection(rpcUrl, 'confirmed');
    } catch (error) {
      console.error('Failed to initialize Solana connection:', error);
      throw error;
    }
  }

  private getRpcUrl(): string {
    switch (this.cluster) {
      case 'devnet':
        return import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
      case 'testnet':
        return 'https://api.testnet.solana.com';
      case 'mainnet-beta':
        return 'https://api.mainnet-beta.solana.com';
      default:
        return 'https://api.devnet.solana.com';
    }
  }

  /**
   * CREATE SOLANA PAYMENT REQUEST
   * Generates Solana Pay compatible payment request
   */
  async createPayment(request: PaymentRequest): Promise<SolanaPaymentRequest> {
    const recipient = import.meta.env.VITE_SOLANA_TREASURY_ADDRESS ||
      'CmGgLQL36Y9ubtTsy2zmE46TAxwCBm66onZmPPhUWNqv';

    return {
      amount: request.amount,
      recipient,
      reference: request.nonce,
      label: `Imperfect Coach ${request.context}`,
      message: `AI fitness coaching - ${request.context}`,
      memo: `IC-${request.context}-${request.timestamp}`
    };
  }

  /**
   * EXECUTE SOLANA PAYMENT
   * Processes payment through Solana network
   */
  async processTransaction(payment: SolanaPaymentRequest): Promise<SolanaTransactionResult> {
    try {
      console.log('💳 Processing Solana payment:', payment);

      const wallet = await this.getWallet();
      if (!wallet.publicKey) {
        throw new Error('Wallet is not connected or public key is unavailable.');
      }

      const transaction = await this.createTransaction(payment, wallet.publicKey);

      const signature = await this.signAndSendTransaction(wallet, transaction);

      const confirmation = await this.confirmTransaction(signature);

      return {
        signature,
        confirmed: !!confirmation,
        blockTime: Math.floor(Date.now() / 1000)
      };

    } catch (error) {
      console.error('Solana payment processing failed:', error);
      throw error;
    }
  }

  /**
   * VERIFY SOLANA PAYMENT
   * Checks transaction on Solana blockchain
   */
  async verifyPayment(signature: string): Promise<boolean> {
    try {
      console.log('🔍 Verifying Solana payment:', signature);
      const result = await this.connection.getSignatureStatus(signature, {
        searchTransactionHistory: true,
      });
      return !!result.value && result.value.confirmationStatus === 'confirmed';
    } catch (error) {
      console.error('Solana payment verification failed:', error);
      return false;
    }
  }

  /**
   * WALLET INTEGRATION
   * Connects with Solana wallet adapters
   */
  private async getWallet(): Promise<any> {
    if (typeof window !== 'undefined') {
      const solana = (window as any).solana;
      if (solana && solana.isPhantom) {
        if (!solana.isConnected) {
          await solana.connect();
        }
        return solana;
      }
    }
    throw new Error('Phantom wallet not found. Please install it.');
  }

  /**
   * TRANSACTION CREATION
   * Builds Solana transaction
   */
  private async createTransaction(payment: SolanaPaymentRequest, fromPublicKey: PublicKey): Promise<Transaction> {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromPublicKey,
        toPubkey: new PublicKey(payment.recipient),
        lamports: payment.amount,
      })
    );

    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;

    return transaction;
  }

  private async signAndSendTransaction(wallet: any, transaction: Transaction): Promise<string> {
    const { signature } = await wallet.signAndSendTransaction(transaction);
    console.log('🚀 Transaction sent with signature:', signature);
    return signature;
  }

  private async confirmTransaction(signature: string) {
    const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');
    console.log(`✅ Solana transaction confirmed: ${signature}`);
    return confirmation.value;
  }

  /**
   * UTILITY METHODS
   */
  formatAmount(lamports: bigint): string {
    return (Number(lamports) / LAMPORTS_PER_SOL).toFixed(9);
  }

  lamportsToSol(lamports: bigint): number {
    return Number(lamports) / LAMPORTS_PER_SOL;
  }

  solToLamports(sol: number): bigint {
    return BigInt(Math.floor(sol * LAMPORTS_PER_SOL));
  }

  /**
   * NETWORK STATUS
   */
  async getNetworkHealth(): Promise<{ healthy: boolean; tps: number; slot: number }> {
    try {
      // Check network by getting slot (getHealth may not be available in all versions)
      const slot = await this.connection.getSlot();
      if (!slot) {
        return { healthy: false, tps: 0, slot: 0 };
      }

      const performanceSamples = await this.connection.getRecentPerformanceSamples(5);
      const avgTps = performanceSamples.reduce((acc, sample) => acc + sample.numTransactions / sample.samplePeriodSecs, 0) / performanceSamples.length;

      return {
        healthy: true,
        tps: Math.round(avgTps),
        slot,
      };

    } catch (error) {
      console.error('Failed to get Solana network health:', error);
      return {
        healthy: false,
        tps: 0,
        slot: 0
      };
    }
  }
}

// Export configured instance for devnet
export const solanaPayment = new SolanaPaymentModule('devnet');