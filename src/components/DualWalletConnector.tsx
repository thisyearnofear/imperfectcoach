// Dual Wallet Connector - Side-by-side Base and Solana wallet management
// Enables users to connect both wallets for optimal multi-chain experience

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { UnifiedWallet } from './UnifiedWallet';
import { PhantomWalletButton } from './PhantomWalletButton';
import { 
  Brain, 
  Zap, 
  Shield, 
  Info,
  TrendingDown,
  Clock
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { solanaWalletManager } from '../lib/payments/solana-wallet-adapter';

interface DualWalletConnectorProps {
  showRecommendations?: boolean;
  showBenefits?: boolean;
  compact?: boolean;
}

export function DualWalletConnector({ 
  showRecommendations = true, 
  showBenefits = true,
  compact = false 
}: DualWalletConnectorProps) {
  const { address: baseAddress, isConnected: baseConnected } = useAccount();
  const [solanaConnected, setSolanaConnected] = useState(false);
  const [solanaAddress, setSolanaAddress] = useState<string | null>(null);

  // Monitor Solana wallet state
  useEffect(() => {
    const updateSolanaState = () => {
      const state = solanaWalletManager.getState();
      setSolanaConnected(state.connected);
      setSolanaAddress(state.publicKey?.toString() || null);
    };

    updateSolanaState();
    const interval = setInterval(updateSolanaState, 1000);
    return () => clearInterval(interval);
  }, []);

  const bothConnected = baseConnected && solanaConnected;
  const neitherConnected = !baseConnected && !solanaConnected;
  const oneConnected = (baseConnected && !solanaConnected) || (!baseConnected && solanaConnected);

  if (compact) {
    return (
      <div className="flex gap-3">
        <div className="flex-1">
          <UnifiedWallet />
        </div>
        <div className="flex-1">
          <PhantomWalletButton showAddress={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status Header */}
      <Card className="border-0 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            Multi-Chain Wallet Setup
          </CardTitle>
          <div className="text-sm text-gray-600">
            Connect wallets for optimal payment routing and cost savings
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className={`h-3 w-3 rounded-full mx-auto ${baseConnected ? 'bg-blue-500' : 'bg-gray-300'}`} />
              <div className="text-xs font-medium">Base Network</div>
              <div className="text-xs text-gray-500">Coinbase Wallet</div>
            </div>
            <div className="space-y-1">
              <Brain className={`h-6 w-6 mx-auto ${bothConnected ? 'text-green-500' : 'text-gray-400'}`} />
              <div className="text-xs font-medium">Smart Routing</div>
              <div className="text-xs text-gray-500">
                {bothConnected ? 'Active' : 'Pending'}
              </div>
            </div>
            <div className="space-y-1">
              <div className={`h-3 w-3 rounded-full mx-auto ${solanaConnected ? 'bg-purple-500' : 'bg-gray-300'}`} />
              <div className="text-xs font-medium">Solana Network</div>
              <div className="text-xs text-gray-500">Phantom Wallet</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Connection Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Base Wallet */}
        <Card className="border border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Shield className="h-5 w-5" />
              Base Network
            </CardTitle>
            <div className="text-sm text-blue-600">
              Established • Secure • Premium Services
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <UnifiedWallet />
            
            {baseConnected && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                  Connected to Base Sepolia
                </div>
                <div className="text-xs text-gray-600">
                  • Premium analysis payments
                  • Agent coaching sessions  
                  • Established infrastructure
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Solana Wallet */}
        <Card className="border border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Zap className="h-5 w-5" />
              Solana Network
            </CardTitle>
            <div className="text-sm text-purple-600">
              Ultra-Fast • Low Cost • Micro-Payments
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <PhantomWalletButton 
              showAddress={true} 
              showBalance={true}
            />
            
            {solanaConnected && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                  Connected to Solana Devnet
                </div>
                <div className="text-xs text-gray-600">
                  • Micro-payment optimization
                  • 90% fee reduction potential
                  • Ultra-fast confirmations
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status and Recommendations */}
      {showRecommendations && (
        <Card className={`${bothConnected ? 'border-green-200 bg-green-50' : oneConnected ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50'}`}>
          <CardContent className="p-4">
            {bothConnected && (
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-800">Smart Routing Active!</div>
                  <div className="text-sm text-green-700">
                    AI will automatically select the optimal network for each payment
                  </div>
                </div>
              </div>
            )}
            
            {oneConnected && (
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <div className="font-medium text-amber-800">Enhanced Experience Available</div>
                  <div className="text-sm text-amber-700 mb-2">
                    Connect {baseConnected ? 'Phantom wallet' : 'Coinbase wallet'} for optimal payment routing and cost savings.
                  </div>
                  <div className="text-xs text-amber-600">
                    • Access to both payment networks
                    • Automatic fee optimization  
                    • Seamless fallback systems
                  </div>
                </div>
              </div>
            )}
            
            {neitherConnected && (
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-800">Get Started</div>
                  <div className="text-sm text-blue-700">
                    Connect at least one wallet to access AI fitness coaching features
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Benefits Overview */}
      {showBenefits && bothConnected && (
        <Card className="border-dashed border-gray-200">
          <CardContent className="p-4">
            <div className="text-center space-y-4">
              <div className="font-medium text-gray-800">Multi-Chain Benefits Active</div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="space-y-1">
                  <TrendingDown className="h-6 w-6 text-green-500 mx-auto" />
                  <div className="font-medium">Cost Savings</div>
                  <div className="text-gray-600">Up to 90% on micro-payments</div>
                </div>
                <div className="space-y-1">
                  <Clock className="h-6 w-6 text-blue-500 mx-auto" />
                  <div className="font-medium">Speed</div>
                  <div className="text-gray-600">1-second Solana confirmations</div>
                </div>
                <div className="space-y-1">
                  <Shield className="h-6 w-6 text-purple-500 mx-auto" />
                  <div className="font-medium">Reliability</div>
                  <div className="text-gray-600">Automatic fallback systems</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}