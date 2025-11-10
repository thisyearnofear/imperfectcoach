// Chain Selector Component - NEW modular component
// CLEAN separation for multi-chain payment selection

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Loader2, Zap, Shield, DollarSign } from 'lucide-react';
import type { PaymentChain, FeeEstimate, ChainRoutingDecision } from '../../lib/payments/payment-types';
import { paymentRouter } from '../../lib/payments/payment-router';

interface ChainSelectorProps {
  amount: bigint;
  context: 'micro' | 'premium' | 'agent';
  userAddress: string;
  onChainSelected: (decision: ChainRoutingDecision) => void;
  className?: string;
}

export function ChainSelector({ 
  amount, 
  context, 
  userAddress, 
  onChainSelected, 
  className 
}: ChainSelectorProps) {
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<ChainRoutingDecision | null>(null);
  const [manualSelection, setManualSelection] = useState(false);

  useEffect(() => {
    loadChainOptions();
  }, [amount, context, userAddress]);

  const loadChainOptions = async () => {
    setLoading(true);
    try {
      const request = {
        amount,
        context,
        userAddress,
        timestamp: Math.floor(Date.now() / 1000),
        nonce: crypto.randomUUID()
      };

      const routingDecision = await paymentRouter.selectOptimalChain(request);
      setDecision(routingDecision);

      // Auto-select unless user wants manual control
      if (!manualSelection) {
        onChainSelected(routingDecision);
      }
    } catch (error) {
      console.error('Failed to load chain options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSelect = (chain: PaymentChain) => {
    if (!decision) return;

    const selectedEstimate = decision.feeEstimate.chain === chain 
      ? decision.feeEstimate 
      : decision.alternatives[0];

    const manualDecision: ChainRoutingDecision = {
      selectedChain: chain,
      reason: 'user_preference',
      feeEstimate: selectedEstimate,
      alternatives: decision.alternatives
    };

    setDecision(manualDecision);
    onChainSelected(manualDecision);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Analyzing optimal payment route...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!decision) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            Failed to load payment options. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatAmount = (amount: bigint, chain: PaymentChain) => {
    if (chain === 'base') {
      return `$${(Number(amount) / 1e6).toFixed(6)}`;
    } else {
      return `${(Number(amount) / 1e9).toFixed(9)} SOL`;
    }
  };

  const formatFee = (fee: bigint, chain: PaymentChain) => {
    if (chain === 'base') {
      return `~$${(Number(fee) / 1e18).toFixed(6)}`; // ETH to USD approximation
    } else {
      return `~${(Number(fee) / 1e9).toFixed(9)} SOL`;
    }
  };

  const getChainIcon = (chain: PaymentChain) => {
    return chain === 'base' ? <Shield className="h-4 w-4" /> : <Zap className="h-4 w-4" />;
  };

  const getChainColor = (chain: PaymentChain, selected: boolean) => {
    if (selected) {
      return chain === 'base' ? 'bg-blue-500' : 'bg-purple-500';
    }
    return 'bg-gray-200 hover:bg-gray-300';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Payment Route Selection
        </CardTitle>
        <CardDescription>
          Smart routing selected {decision.selectedChain.toUpperCase()} for optimal cost/speed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recommended Option */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Recommended:</span>
            <Badge variant="secondary" className="text-xs">
              {decision.reason.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          
          <Button
            onClick={() => onChainSelected(decision)}
            className={`w-full justify-between p-4 h-auto ${getChainColor(decision.selectedChain, true)}`}
          >
            <div className="flex items-center gap-3">
              {getChainIcon(decision.selectedChain)}
              <div className="text-left">
                <div className="font-medium">{decision.selectedChain.toUpperCase()}</div>
                <div className="text-xs opacity-90">
                  {decision.selectedChain === 'base' ? 'Established • Secure' : 'Ultra-Fast • Low Cost'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm">{formatAmount(amount, decision.selectedChain)}</div>
              <div className="text-xs opacity-90">
                Fee: {formatFee(decision.feeEstimate.estimatedFee, decision.selectedChain)}
              </div>
            </div>
          </Button>
        </div>

        {/* Alternative Options */}
        {decision.alternatives.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Alternative:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setManualSelection(!manualSelection)}
                className="text-xs"
              >
                {manualSelection ? 'Auto Select' : 'Manual Select'}
              </Button>
            </div>
            
            {decision.alternatives.map((alt, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => manualSelection && handleManualSelect(alt.chain)}
                disabled={!manualSelection}
                className="w-full justify-between p-3 h-auto"
              >
                <div className="flex items-center gap-3">
                  {getChainIcon(alt.chain)}
                  <div className="text-left">
                    <div className="font-medium">{alt.chain.toUpperCase()}</div>
                    <div className="text-xs text-gray-500">
                      {alt.chain === 'base' ? 'Established • Secure' : 'Ultra-Fast • Low Cost'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{formatAmount(amount, alt.chain)}</div>
                  <div className="text-xs text-gray-500">
                    Fee: {formatFee(alt.estimatedFee, alt.chain)}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}

        {/* Network Status */}
        <div className="pt-2 border-t">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="text-center">
              <div className="font-medium">Estimated Time</div>
              <div className="text-gray-600">{decision.feeEstimate.estimatedTime}s</div>
            </div>
            <div className="text-center">
              <div className="font-medium">Network Status</div>
              <Badge 
                variant={decision.feeEstimate.networkHealth === 'healthy' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {decision.feeEstimate.networkHealth}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}