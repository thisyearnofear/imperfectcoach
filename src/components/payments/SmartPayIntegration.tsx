// Smart Pay Integration - Replace existing payment buttons with enhanced UX
// Demonstrates both manual control and AI automation options

import React, { useState } from 'react';
import { SmartPayButton } from './SmartPayButton';
import { UnifiedPaymentFlow } from './UnifiedPaymentFlow';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { 
  Settings, 
  Zap, 
  Brain, 
  User,
  Info 
} from 'lucide-react';
import type { PaymentContext, PaymentResponse } from '../../lib/payments/payment-types';

interface SmartPayIntegrationProps {
  amount: bigint;
  context: PaymentContext;
  description: string;
  onSuccess: (response: PaymentResponse) => void;
  onError?: (error: string) => void;
  
  // UX Configuration Options
  defaultMode?: 'smart' | 'manual';
  allowModeSwitch?: boolean;
  showEducational?: boolean;
}

export function SmartPayIntegration({
  amount,
  context,
  description,
  onSuccess,
  onError,
  defaultMode = 'smart',
  allowModeSwitch = true,
  showEducational = false
}: SmartPayIntegrationProps) {
  const [paymentMode, setPaymentMode] = useState<'smart' | 'manual'>(defaultMode);
  const [showSettings, setShowSettings] = useState(false);
  const [educationalMode, setEducationalMode] = useState(showEducational);

  const formatAmount = (amount: bigint) => {
    return `$${(Number(amount) / 1e6).toFixed(2)}`;
  };

  return (
    <div className="space-y-4">
      {/* Mode Selection Header */}
      {allowModeSwitch && (
        <Card className="border-dashed border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {paymentMode === 'smart' ? (
                    <Brain className="h-4 w-4 text-blue-500" />
                  ) : (
                    <User className="h-4 w-4 text-green-500" />
                  )}
                  <span className="text-sm font-medium">
                    {paymentMode === 'smart' ? 'AI Smart Pay' : 'Manual Selection'}
                  </span>
                </div>
                <Badge variant={paymentMode === 'smart' ? 'default' : 'secondary'} className="text-xs">
                  {paymentMode === 'smart' ? 'Recommended' : 'Expert'}
                </Badge>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            
            {showSettings && (
              <div className="mt-4 pt-4 border-t space-y-3">
                {/* Payment Mode Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm">Payment Mode</Label>
                    <div className="text-xs text-gray-600">
                      {paymentMode === 'smart' 
                        ? 'AI selects optimal blockchain automatically'
                        : 'Choose blockchain manually with full details'
                      }
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="payment-mode" className="text-xs">Manual</Label>
                    <Switch
                      id="payment-mode"
                      checked={paymentMode === 'smart'}
                      onCheckedChange={(checked) => setPaymentMode(checked ? 'smart' : 'manual')}
                    />
                    <Label htmlFor="payment-mode" className="text-xs">Smart</Label>
                  </div>
                </div>

                {/* Educational Mode Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm">Show Explanations</Label>
                    <div className="text-xs text-gray-600">
                      Display educational content about blockchain selection
                    </div>
                  </div>
                  <Switch
                    checked={educationalMode}
                    onCheckedChange={setEducationalMode}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Smart Pay Mode - AI Automation */}
      {paymentMode === 'smart' && (
        <div className="space-y-3">
          {educationalMode && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <strong>Smart Pay:</strong> Our AI analyzes your payment and automatically 
                    selects the optimal blockchain for the best fees and speed. You'll see 
                    the decision before signing.
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <SmartPayButton
            amount={amount}
            context={context}
            description={description}
            onSuccess={onSuccess}
            onError={onError}
            showOptimizationProcess={true}
            educationalMode={educationalMode}
            expertMode={false}
          />
        </div>
      )}

      {/* Manual Mode - User Control */}
      {paymentMode === 'manual' && (
        <div className="space-y-3">
          {educationalMode && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <strong>Manual Selection:</strong> You'll see all available payment options 
                    with fees, speeds, and recommendations. Choose the one that works best for you.
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <UnifiedPaymentFlow
            amount={amount}
            context={context}
            description={description}
            onPaymentSuccess={onSuccess}
            onPaymentError={onError || (() => {})}
          />
        </div>
      )}

      {/* Comparison Footer */}
      {allowModeSwitch && (
        <Card className="border-dashed">
          <CardContent className="p-3">
            <div className="grid grid-cols-2 gap-4 text-center text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <Zap className="h-3 w-3 text-blue-500" />
                  <span className="font-medium">Smart Pay</span>
                </div>
                <div className="text-gray-600">
                  AI optimization • One-click • Optimal fees
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <User className="h-3 w-3 text-green-500" />
                  <span className="font-medium">Manual</span>
                </div>
                <div className="text-gray-600">
                  Full control • See all options • Expert mode
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Convenience wrapper for existing components
export function EnhancedPaymentButton({
  amount,
  context,
  description,
  onSuccess,
  onError,
  variant = 'smart-default'
}: {
  amount: bigint;
  context: PaymentContext;
  description: string;
  onSuccess: (response: PaymentResponse) => void;
  onError?: (error: string) => void;
  variant?: 'smart-default' | 'smart-only' | 'manual-only' | 'full-choice';
}) {
  const configs = {
    'smart-default': {
      defaultMode: 'smart' as const,
      allowModeSwitch: false,
      showEducational: false
    },
    'smart-only': {
      defaultMode: 'smart' as const,
      allowModeSwitch: false,
      showEducational: true
    },
    'manual-only': {
      defaultMode: 'manual' as const,
      allowModeSwitch: false,
      showEducational: false
    },
    'full-choice': {
      defaultMode: 'smart' as const,
      allowModeSwitch: true,
      showEducational: true
    }
  };

  const config = configs[variant];

  return (
    <SmartPayIntegration
      amount={amount}
      context={context}
      description={description}
      onSuccess={onSuccess}
      onError={onError}
      {...config}
    />
  );
}