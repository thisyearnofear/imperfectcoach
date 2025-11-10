// Unified Payment Flow - ENHANCEMENT of existing payment components
// Consolidates logic from BedrockAnalysisSection, AgentCoachUpsell, PremiumAnalysisUpsell

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { ChainSelector } from './ChainSelector';
import { useAccount } from 'wagmi';
import { x402UnifiedHandler } from '../../lib/payments/x402-unified';
import type { 
  PaymentRequest, 
  PaymentResponse, 
  PaymentFlowState, 
  PaymentContext,
  ChainRoutingDecision 
} from '../../lib/payments/payment-types';

interface UnifiedPaymentFlowProps {
  amount: bigint;
  context: PaymentContext;
  description: string;
  onPaymentSuccess: (response: PaymentResponse) => void;
  onPaymentError: (error: string) => void;
  className?: string;
}

export function UnifiedPaymentFlow({
  amount,
  context,
  description,
  onPaymentSuccess,
  onPaymentError,
  className
}: UnifiedPaymentFlowProps) {
  const { address } = useAccount();
  const [flowState, setFlowState] = useState<PaymentFlowState>({
    step: 'selecting_chain'
  });

  const handleChainSelected = async (decision: ChainRoutingDecision) => {
    if (!address) {
      onPaymentError('Wallet not connected');
      return;
    }

    setFlowState({
      step: 'creating_payment',
      selectedChain: decision.selectedChain
    });

    try {
      // Create payment request
      const paymentRequest: PaymentRequest = {
        amount,
        context,
        userAddress: address,
        timestamp: Math.floor(Date.now() / 1000),
        nonce: crypto.randomUUID(),
        preferredChain: decision.selectedChain
      };

      setFlowState({
        step: 'awaiting_signature',
        selectedChain: decision.selectedChain,
        paymentRequest
      });

      console.log(`🚀 Processing ${decision.selectedChain} payment:`, paymentRequest);

      // Process payment through unified handler
      setFlowState(prev => ({ ...prev, step: 'processing' }));
      
      const response = await x402UnifiedHandler.processPayment(paymentRequest);

      if (response.success) {
        setFlowState({
          step: 'completed',
          selectedChain: response.chain,
          transactionHash: response.transactionHash
        });
        
        onPaymentSuccess(response);
      } else {
        throw new Error(response.error || 'Payment failed');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown payment error';
      console.error('Payment flow error:', error);
      
      setFlowState({
        step: 'failed',
        error: errorMessage
      });
      
      onPaymentError(errorMessage);
    }
  };

  const resetFlow = () => {
    setFlowState({ step: 'selecting_chain' });
  };

  const getStepIcon = () => {
    switch (flowState.step) {
      case 'selecting_chain':
      case 'creating_payment':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'awaiting_signature':
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (flowState.step) {
      case 'selecting_chain':
        return 'Select Payment Method';
      case 'creating_payment':
        return 'Preparing Payment';
      case 'awaiting_signature':
        return 'Awaiting Wallet Signature';
      case 'processing':
        return 'Processing Payment';
      case 'completed':
        return 'Payment Successful';
      case 'failed':
        return 'Payment Failed';
      default:
        return 'Payment';
    }
  };

  const getStepDescription = () => {
    switch (flowState.step) {
      case 'selecting_chain':
        return 'Choose optimal blockchain for your payment';
      case 'creating_payment':
        return 'Creating payment request...';
      case 'awaiting_signature':
        return `Please sign the transaction in your ${flowState.selectedChain} wallet`;
      case 'processing':
        return `Processing payment on ${flowState.selectedChain} network`;
      case 'completed':
        return `Payment confirmed on ${flowState.selectedChain}`;
      case 'failed':
        return flowState.error || 'An error occurred during payment';
      default:
        return '';
    }
  };

  const formatAmount = (amount: bigint, chain?: string) => {
    if (chain === 'solana') {
      return `${(Number(amount) / 1e9).toFixed(9)} SOL`;
    }
    return `$${(Number(amount) / 1e6).toFixed(6)} USDC`;
  };

  if (!address) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Wallet Required</h3>
            <p className="text-gray-600 mb-4">
              Please connect your wallet to make payments
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Payment Flow Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStepIcon()}
            {getStepTitle()}
          </CardTitle>
          <CardDescription>{getStepDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Payment Details */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">{description}</span>
              <Badge variant="outline">
                {formatAmount(amount, flowState.selectedChain)}
              </Badge>
            </div>
          </div>

          {/* Chain Selection Step */}
          {flowState.step === 'selecting_chain' && (
            <ChainSelector
              amount={amount}
              context={context}
              userAddress={address}
              onChainSelected={handleChainSelected}
            />
          )}

          {/* Processing Steps */}
          {['creating_payment', 'awaiting_signature', 'processing'].includes(flowState.step) && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
              <div className="space-y-2">
                <div className="font-medium">{getStepTitle()}</div>
                <div className="text-sm text-gray-600">{getStepDescription()}</div>
                {flowState.selectedChain && (
                  <Badge variant="secondary" className="mt-2">
                    {flowState.selectedChain.toUpperCase()} Network
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Success State */}
          {flowState.step === 'completed' && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <div className="space-y-2">
                <div className="font-medium text-green-700">Payment Successful!</div>
                <div className="text-sm text-gray-600">
                  Your payment has been processed successfully
                </div>
                {flowState.transactionHash && (
                  <div className="text-xs text-gray-500 mt-2">
                    Transaction: {flowState.transactionHash.slice(0, 8)}...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error State */}
          {flowState.step === 'failed' && (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="font-medium text-red-700">Payment Failed</div>
                  <div className="text-sm text-gray-600">{flowState.error}</div>
                </div>
                <Button onClick={resetFlow} variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Features Notice */}
      {flowState.step === 'selecting_chain' && (
        <Card>
          <CardContent className="p-4">
            <div className="text-center text-sm text-gray-600">
              <div className="font-medium mb-1">🚀 Enhanced Multi-Chain Payments</div>
              <div className="text-xs">
                Smart routing automatically selects the optimal blockchain for cost and speed.
                Solana for micro-payments, Base for established infrastructure.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}