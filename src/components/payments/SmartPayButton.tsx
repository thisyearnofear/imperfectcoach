// Smart Pay Button - The core UX component for invisible intelligence
// Implements "Invisible Enhancement" philosophy

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { 
  Loader2, 
  Brain, 
  CheckCircle, 
  Zap, 
  AlertCircle,
  Shield 
} from 'lucide-react';
import { UnifiedPaymentFlow } from './UnifiedPaymentFlow';
import { useAccount } from 'wagmi';
import type { PaymentContext, PaymentResponse } from '../../lib/payments/payment-types';

interface SmartPayButtonProps {
  amount: bigint;
  context: PaymentContext;
  description: string;
  onSuccess: (response: PaymentResponse) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  // UX Configuration
  showOptimizationProcess?: boolean;
  educationalMode?: boolean;
  expertMode?: boolean;
}

type FlowState = 'ready' | 'analyzing' | 'selected' | 'paying' | 'success' | 'error';

export function SmartPayButton({
  amount,
  context,
  description,
  onSuccess,
  onError,
  disabled = false,
  className = '',
  showOptimizationProcess = true,
  educationalMode = false,
  expertMode = false
}: SmartPayButtonProps) {
  const { address, isConnected } = useAccount();
  const [flowState, setFlowState] = useState<FlowState>('ready');
  const [selectedChain, setSelectedChain] = useState<'base' | 'solana' | null>(null);
  const [optimizationReason, setOptimizationReason] = useState<string>('');
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);

  const formatAmount = (amount: bigint) => {
    return `$${(Number(amount) / 1e6).toFixed(2)}`;
  };

  const handleSmartPay = async () => {
    if (!isConnected || !address) {
      onError?.('Please connect your wallet first');
      return;
    }

    setFlowState('analyzing');
    
    // Simulate smart chain analysis (in real implementation, this would use paymentRouter)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock decision logic
    const decision = mockChainSelection(amount, context);
    setSelectedChain(decision.chain);
    setOptimizationReason(decision.reason);
    setFlowState('selected');
    
    // Brief pause to show selection
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Launch payment flow
    setShowPaymentFlow(true);
    setFlowState('paying');
  };

  const mockChainSelection = (amount: bigint, context: PaymentContext) => {
    if (amount < BigInt(10000)) { // < $0.01
      return {
        chain: 'solana' as const,
        reason: '90% fee savings for micro-payments'
      };
    }
    
    if (context === 'agent') {
      return {
        chain: 'base' as const,
        reason: 'Established infrastructure for agent coaching'
      };
    }
    
    return {
      chain: 'solana' as const,
      reason: 'Ultra-low fees perfect for this payment size'
    };
  };

  const handlePaymentSuccess = (response: PaymentResponse) => {
    setFlowState('success');
    setShowPaymentFlow(false);
    onSuccess(response);
  };

  const handlePaymentError = (error: string) => {
    setFlowState('error');
    setShowPaymentFlow(false);
    onError?.(error);
  };

  const resetFlow = () => {
    setFlowState('ready');
    setSelectedChain(null);
    setOptimizationReason('');
    setShowPaymentFlow(false);
  };

  // Show payment flow overlay
  if (showPaymentFlow) {
    return (
      <div className={className}>
        <UnifiedPaymentFlow
          amount={amount}
          context={context}
          description={description}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Smart Pay Button */}
      {flowState === 'ready' && (
        <Button
          onClick={handleSmartPay}
          disabled={disabled || !isConnected}
          className="w-full relative overflow-hidden group"
          size="lg"
        >
          <div className="flex items-center justify-center gap-2">
            <span className="font-medium">{description}</span>
            <span className="text-sm opacity-90">({formatAmount(amount)})</span>
            <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 transition-colors">
              <Zap className="h-3 w-3 mr-1" />
              Smart Pay
            </Badge>
          </div>
          
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-purple-400/10 to-blue-400/0 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Button>
      )}

      {/* Analysis Phase */}
      {flowState === 'analyzing' && showOptimizationProcess && (
        <Card className="border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-blue-500 animate-pulse" />
              <div className="flex-1">
                <div className="font-medium text-blue-900">AI Optimizing Payment Route</div>
                <div className="text-sm text-blue-700 mt-1">
                  Analyzing network conditions and fees...
                </div>
              </div>
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection Result */}
      {flowState === 'selected' && (
        <Card className="border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-green-900">
                      {selectedChain === 'solana' ? 'Solana' : 'Base'} Network Selected
                    </span>
                    {selectedChain === 'solana' ? (
                      <Zap className="h-4 w-4 text-purple-500" />
                    ) : (
                      <Shield className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  {educationalMode && (
                    <div className="text-sm text-green-700 mt-1">
                      {optimizationReason}
                    </div>
                  )}
                </div>
              </div>
              
              {selectedChain === 'solana' && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  90% savings
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success State */}
      {flowState === 'success' && (
        <Card className="border border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <div className="font-medium text-green-800">Payment Successful!</div>
                <div className="text-sm text-green-700 mt-1">
                  Your analysis is ready via {selectedChain === 'solana' ? 'Solana' : 'Base'} network
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {flowState === 'error' && (
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-red-800">Payment Failed</div>
                <div className="text-sm text-red-700 mt-1">
                  Unable to process payment. Please try again.
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetFlow}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Educational Footer (Optional) */}
      {educationalMode && flowState === 'ready' && (
        <Card className="border-dashed border-gray-200">
          <CardContent className="p-3">
            <div className="text-center text-sm text-gray-600">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Brain className="h-4 w-4" />
                <span className="font-medium">Smart Pay Enhancement</span>
              </div>
              <div className="text-xs">
                Our AI automatically selects the optimal blockchain for cost and speed
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expert Mode Toggle (Optional) */}
      {expertMode && (
        <div className="text-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowPaymentFlow(true)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            ⚙️ Advanced Payment Options
          </Button>
        </div>
      )}
    </div>
  );
}