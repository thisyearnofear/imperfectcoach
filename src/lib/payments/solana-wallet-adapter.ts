// Solana Wallet Adapter Integration - CLEAN integration with existing wallet system
// Follows MODULAR principle with clean separation from Base wallet logic

import { WalletAdapter } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { solanaConfig } from '../../wagmi';

export interface SolanaWalletState {
  adapter: WalletAdapter | null;
  connected: boolean;
  connecting: boolean;
  publicKey: PublicKey | null;
  connection: Connection;
}

type WalletEventType = 'connect' | 'disconnect' | 'change';
type WalletEventListener = (state: SolanaWalletState) => void;

export class SolanaWalletManager {
  private state: SolanaWalletState;
  private availableAdapters: WalletAdapter[];
  private listeners: Map<WalletEventType, Set<WalletEventListener>> = new Map();

  constructor() {
    this.availableAdapters = [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter()
    ];

    this.state = {
      adapter: null,
      connected: false,
      connecting: false,
      publicKey: null,
      connection: new Connection(solanaConfig.rpcUrl, 'confirmed')
    };
    
    // Initialize event listener maps
    this.listeners.set('connect', new Set());
    this.listeners.set('disconnect', new Set());
    this.listeners.set('change', new Set());
  }

  /**
   * DETECT AVAILABLE WALLETS
   * Following PERFORMANT principle with lazy detection
   */
  detectAvailableWallets(): WalletAdapter[] {
    return this.availableAdapters.filter(adapter => {
      try {
        return adapter.readyState === 'Installed' || adapter.readyState === 'Loadable';
      } catch {
        return false;
      }
    });
  }

  /**
   * CONNECT TO PREFERRED WALLET
   * Smart selection similar to Base wallet logic
   */
  async connect(preferredWallet?: string): Promise<boolean> {
    if (this.state.connecting || this.state.connected) {
      return this.state.connected;
    }

    this.state.connecting = true;

    try {
      let selectedAdapter: WalletAdapter | null = null;

      if (preferredWallet) {
        selectedAdapter = this.availableAdapters.find(
          adapter => adapter.name.toLowerCase().includes(preferredWallet.toLowerCase())
        ) || null;
      }

      // Fallback to first available wallet
      if (!selectedAdapter) {
        const available = this.detectAvailableWallets();
        selectedAdapter = available[0] || null;
      }

      if (!selectedAdapter) {
        throw new Error('No Solana wallet found');
      }

      // Connect to the selected adapter
      await selectedAdapter.connect();

      this.state.adapter = selectedAdapter;
      this.state.connected = selectedAdapter.connected;
      this.state.publicKey = selectedAdapter.publicKey;

      console.log(`✅ Connected to ${selectedAdapter.name}:`, selectedAdapter.publicKey?.toString());
      
      // Emit connect event
      this.emit('connect');
      this.emit('change');

      return true;

    } catch (error) {
      console.error('Solana wallet connection failed:', error);
      this.state.connected = false;
      throw error;
    } finally {
      this.state.connecting = false;
    }
  }

  /**
   * DISCONNECT WALLET
   */
  async disconnect(): Promise<void> {
    if (this.state.adapter) {
      await this.state.adapter.disconnect();
    }
    
    this.state = {
      ...this.state,
      adapter: null,
      connected: false,
      publicKey: null
    };
    
    // Emit disconnect event
    this.emit('disconnect');
    this.emit('change');
  }

  /**
   * SIGN MESSAGE
   * Compatible with x402 message signing
   */
  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    if (!this.state.adapter || !this.state.connected) {
      throw new Error('Wallet not connected');
    }

    if (!this.state.adapter.signMessage) {
      throw new Error('Wallet does not support message signing');
    }

    return await this.state.adapter.signMessage(message);
  }

  /**
   * SIGN TRANSACTION
   * For actual payment transactions
   */
  async signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.state.adapter || !this.state.connected) {
      throw new Error('Wallet not connected');
    }

    if (!this.state.adapter.signTransaction) {
      throw new Error('Wallet does not support transaction signing');
    }

    return await this.state.adapter.signTransaction(transaction);
  }

  /**
   * SEND TRANSACTION
   * Complete transaction flow
   */
  async sendTransaction(transaction: Transaction): Promise<string> {
    if (!this.state.adapter || !this.state.connected) {
      throw new Error('Wallet not connected');
    }

    // Sign the transaction first
    const signedTransaction = await this.signTransaction(transaction);

    // Send the signed transaction
    const signature = await this.state.connection.sendRawTransaction(
      signedTransaction.serialize()
    );

    // Wait for confirmation
    await this.state.connection.confirmTransaction(signature);

    return signature;
  }

  /**
   * GET WALLET STATE
   */
  getState(): SolanaWalletState {
    return { ...this.state };
  }

  getPublicKey(): PublicKey | null {
    return this.state.publicKey;
  }

  isConnected(): boolean {
    return this.state.connected;
  }

  getConnection(): Connection {
    return this.state.connection;
  }

  /**
   * UTILITY METHODS
   */
  async getBalance(): Promise<number> {
    if (!this.state.publicKey) {
      return 0;
    }

    try {
      const lamports = await this.state.connection.getBalance(this.state.publicKey);
      return lamports / 1e9; // Convert to SOL
    } catch (error) {
      console.error('Failed to get balance:', error);
      return 0;
    }
  }

  formatPublicKey(): string {
    if (!this.state.publicKey) return '';
    
    const key = this.state.publicKey.toString();
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  }
  
  /**
   * EVENT SYSTEM
   * Subscribe to wallet state changes
   */
  on(event: WalletEventType, listener: WalletEventListener): () => void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.add(listener);
    }
    
    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(listener);
      }
    };
  }
  
  private emit(event: WalletEventType): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(this.getState());
        } catch (error) {
          console.error(`Error in wallet event listener for ${event}:`, error);
        }
      });
    }
  }
}

// Export singleton instance following existing pattern
export const solanaWalletManager = new SolanaWalletManager();
