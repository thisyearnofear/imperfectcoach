// Phantom Wallet Button - Quick integration for side-by-side wallet support
// Enables users to connect Phantom alongside Coinbase for multi-chain experience

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { 
  Wallet, 
  LogOut, 
  Loader2, 
  Zap,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import { solanaWalletManager } from '../lib/payments/solana-wallet-adapter';

interface PhantomWalletButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showAddress?: boolean;
  showBalance?: boolean;
  className?: string;
}

export function PhantomWalletButton({
  variant = 'default',
  size = 'default',
  showAddress = true,
  showBalance = false,
  className = ''
}: PhantomWalletButtonProps) {
  const [walletState, setWalletState] = useState({
    connected: false,
    address: null,
    connecting: false,
    balance: 0
  });
  const [copied, setCopied] = useState(false);

  // Update wallet state
  useEffect(() => {
    const updateState = async () => {
      const state = solanaWalletManager.getState();
      const balance = state.connected ? await solanaWalletManager.getBalance() : 0;
      
      setWalletState({
        connected: state.connected,
        address: state.publicKey?.toString() || null,
        connecting: state.connecting,
        balance
      });
    };

    updateState();
    const interval = setInterval(updateState, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    try {
      setWalletState(prev => ({ ...prev, connecting: true }));
      await solanaWalletManager.connect('phantom');
    } catch (error) {
      console.error('Phantom connection failed:', error);
      alert('Failed to connect Phantom wallet. Please ensure Phantom is installed.');
    } finally {
      setWalletState(prev => ({ ...prev, connecting: false }));
    }
  };

  const handleDisconnect = async () => {
    try {
      await solanaWalletManager.disconnect();
    } catch (error) {
      console.error('Phantom disconnect failed:', error);
    }
  };

  const copyAddress = async () => {
    if (walletState.address) {
      await navigator.clipboard.writeText(walletState.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Check if Phantom is available
  const isPhantomAvailable = () => {
    return typeof window !== 'undefined' && (window as any)?.solana?.isPhantom;
  };

  // Not connected state
  if (!walletState.connected) {
    return (
      <div className={className}>
        {!isPhantomAvailable() ? (
          <Card className="border border-amber-200 bg-amber-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <div className="text-sm">
                  <div className="font-medium text-amber-800">Phantom Wallet Required</div>
                  <div className="text-amber-700">
                    Install Phantom to use Solana features
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open('https://phantom.app/', '_blank')}
                >
                  Install
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={walletState.connecting}
            variant={variant}
            size={size}
            className={`flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white`}
          >
            {walletState.connecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wallet className="h-4 w-4" />
            )}
            <span>Connect Phantom</span>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              <Zap className="h-3 w-3 mr-1" />
              Solana
            </Badge>
          </Button>
        )}
      </div>
    );
  }

  // Connected state
  return (
    <Card className={`border border-purple-200 bg-purple-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-purple-800">Phantom</span>
                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                  Connected
                </Badge>
              </div>
              {showAddress && walletState.address && (
                <div className="flex items-center gap-1 text-sm text-purple-600">
                  <code>{formatAddress(walletState.address)}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={copyAddress}
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              )}
              {showBalance && (
                <div className="text-xs text-purple-600">
                  {walletState.balance.toFixed(4)} SOL
                </div>
              )}
            </div>
          </div>
          
          <Button
            onClick={handleDisconnect}
            variant="ghost"
            size="sm"
            className="text-purple-600 hover:text-purple-700"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick actions */}
        <div className="mt-3 pt-3 border-t border-purple-200">
          <div className="flex items-center justify-between text-xs text-purple-600">
            <span>Solana Network: Devnet</span>
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              ✓ Ultra-low fees
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}