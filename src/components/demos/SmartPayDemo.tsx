// Smart Pay Demo - Live demonstration component for hackathon
// Shows the difference between manual control and AI automation

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { SmartPayIntegration, EnhancedPaymentButton } from '../payments/SmartPayIntegration';
import { 
  Brain, 
  User, 
  Zap, 
  DollarSign, 
  Clock, 
  Shield,
  TrendingDown,
  CheckCircle
} from 'lucide-react';
import type { PaymentResponse } from '../../lib/payments/payment-types';

export function SmartPayDemo() {
  const [demoResults, setDemoResults] = useState<Record<string, PaymentResponse | null>>({
    micro: null,
    premium: null,
    agent: null
  });

  const handleDemoSuccess = (type: string) => (response: PaymentResponse) => {
    setDemoResults(prev => ({
      ...prev,
      [type]: response
    }));
    console.log(`${type} payment successful:`, response);
  };

  const handleDemoError = (type: string) => (error: string) => {
    console.error(`${type} payment error:`, error);
  };

  const scenarios = [
    {
      id: 'micro',
      title: 'Micro-Payment',
      description: 'Quick form tip',
      amount: BigInt(1000), // $0.001
      context: 'micro' as const,
      expectedChain: 'solana',
      reason: 'Ultra-low fees perfect for tiny payments'
    },
    {
      id: 'premium', 
      title: 'Premium Analysis',
      description: 'AI form analysis',
      amount: BigInt(50000), // $0.05
      context: 'premium' as const,
      expectedChain: 'solana',
      reason: 'Cost optimization for standard payments'
    },
    {
      id: 'agent',
      title: 'Agent Coaching',
      description: 'Full AI coaching session',
      amount: BigInt(100000), // $0.10
      context: 'agent' as const,
      expectedChain: 'base',
      reason: 'Established infrastructure for premium services'
    }
  ];

  const formatAmount = (amount: bigint) => {
    return `$${(Number(amount) / 1e6).toFixed(3)}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Demo Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl flex items-center justify-center gap-3">
            <Brain className="h-8 w-8 text-blue-600" />
            Smart Pay vs Manual Control
          </CardTitle>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Watch our AI make intelligent payment routing decisions in real-time, 
            or take full control with manual selection
          </p>
        </CardHeader>
      </Card>

      {/* Comparison Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Zap className="h-5 w-5" />
              AI Smart Pay
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Analyzes optimal blockchain in <100ms</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Maximizes fee savings automatically</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">One-click payment experience</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Graceful fallback if issues occur</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <User className="h-5 w-5" />
              Manual Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">See all available payment options</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Compare fees and speeds in detail</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Override AI recommendations</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Expert mode with technical details</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Demo Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Interactive Demo Scenarios</CardTitle>
          <p className="text-center text-gray-600">
            Try different payment amounts and see how the AI makes decisions
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="micro" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              {scenarios.map(scenario => (
                <TabsTrigger key={scenario.id} value={scenario.id} className="text-sm">
                  {scenario.title}
                  <Badge variant="outline" className="ml-2 text-xs">
                    {formatAmount(scenario.amount)}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {scenarios.map(scenario => (
              <TabsContent key={scenario.id} value={scenario.id} className="mt-6">
                <div className="space-y-6">
                  {/* Scenario Info */}
                  <Card className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="grid md:grid-cols-3 gap-4 text-center">
                        <div className="space-y-1">
                          <DollarSign className="h-6 w-6 mx-auto text-green-500" />
                          <div className="text-sm font-medium">Amount</div>
                          <div className="text-lg">{formatAmount(scenario.amount)}</div>
                        </div>
                        <div className="space-y-1">
                          <Zap className="h-6 w-6 mx-auto text-blue-500" />
                          <div className="text-sm font-medium">Expected Chain</div>
                          <Badge variant={scenario.expectedChain === 'solana' ? 'default' : 'secondary'}>
                            {scenario.expectedChain === 'solana' ? 'Solana' : 'Base'}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <Clock className="h-6 w-6 mx-auto text-purple-500" />
                          <div className="text-sm font-medium">Reasoning</div>
                          <div className="text-xs text-gray-600">{scenario.reason}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Demo Tabs */}
                  <Tabs defaultValue="smart" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="smart">
                        <Brain className="h-4 w-4 mr-2" />
                        AI Smart Pay
                      </TabsTrigger>
                      <TabsTrigger value="manual">
                        <User className="h-4 w-4 mr-2" />
                        Manual Control
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="smart" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Zap className="h-5 w-5 text-blue-500" />
                            Smart Pay Demo
                          </CardTitle>
                          <p className="text-sm text-gray-600">
                            One-click payment with AI optimization
                          </p>
                        </CardHeader>
                        <CardContent>
                          <EnhancedPaymentButton
                            amount={scenario.amount}
                            context={scenario.context}
                            description={scenario.description}
                            onSuccess={handleDemoSuccess(scenario.id)}
                            onError={handleDemoError(scenario.id)}
                            variant="smart-only"
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="manual" className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-5 w-5 text-green-500" />
                            Manual Control Demo
                          </CardTitle>
                          <p className="text-sm text-gray-600">
                            Full control with detailed options
                          </p>
                        </CardHeader>
                        <CardContent>
                          <EnhancedPaymentButton
                            amount={scenario.amount}
                            context={scenario.context}
                            description={scenario.description}
                            onSuccess={handleDemoSuccess(scenario.id)}
                            onError={handleDemoError(scenario.id)}
                            variant="manual-only"
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Card className="border border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">Demo Results Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {scenarios.map(scenario => {
              const result = demoResults[scenario.id];
              return (
                <div key={scenario.id} className="text-center p-4 bg-white rounded-lg">
                  <div className="text-sm font-medium">{scenario.title}</div>
                  <div className="text-xs text-gray-600 mb-2">
                    {formatAmount(scenario.amount)}
                  </div>
                  {result ? (
                    <div className="space-y-1">
                      <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                      <Badge variant="outline">
                        {result.chain} network
                      </Badge>
                      {result.fallbackUsed && (
                        <div className="text-xs text-amber-600">Fallback used</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">Not tested yet</div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Key Benefits */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-0">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">Why This Matters for AI Agents</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <TrendingDown className="h-8 w-8 text-green-500 mx-auto" />
                <div className="font-medium">Cost Optimization</div>
                <div className="text-sm text-gray-600">
                  Up to 90% fee savings on micro-payments
                </div>
              </div>
              <div className="space-y-2">
                <Brain className="h-8 w-8 text-blue-500 mx-auto" />
                <div className="font-medium">Autonomous Intelligence</div>
                <div className="text-sm text-gray-600">
                  Agents make smart economic decisions
                </div>
              </div>
              <div className="space-y-2">
                <Shield className="h-8 w-8 text-purple-500 mx-auto" />
                <div className="font-medium">Reliability</div>
                <div className="text-sm text-gray-600">
                  Fallback systems ensure payments always work
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}