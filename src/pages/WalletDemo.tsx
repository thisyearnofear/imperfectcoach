// Wallet Demo Page - Shows both Base and Solana wallet integration
// Perfect for demonstrating the 2-hour quick integration

import React from 'react';
import { DualWalletConnector } from '../components/DualWalletConnector';
import { SmartPayDemo } from '../components/demos/SmartPayDemo';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  Brain, 
  Zap, 
  Shield, 
  Github,
  ExternalLink 
} from 'lucide-react';

export function WalletDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">
            Multi-Wallet Integration Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Experience seamless integration between Coinbase (Base) and Phantom (Solana) wallets. 
            Connect both for optimal smart payment routing.
          </p>
          <Badge className="mb-4">
            2-Hour Quick Integration Complete ✅
          </Badge>
        </div>

        {/* Dual Wallet Connector */}
        <div className="mb-12">
          <DualWalletConnector 
            showRecommendations={true}
            showBenefits={true}
          />
        </div>

        {/* Integration Benefits */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center">Integration Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="space-y-3">
                <Brain className="h-12 w-12 text-blue-500 mx-auto" />
                <h3 className="font-semibold">Smart Routing</h3>
                <p className="text-sm text-gray-600">
                  AI automatically selects optimal blockchain for each payment
                </p>
              </div>
              <div className="space-y-3">
                <Zap className="h-12 w-12 text-purple-500 mx-auto" />
                <h3 className="font-semibold">Best of Both</h3>
                <p className="text-sm text-gray-600">
                  Solana speed + Base reliability in one experience
                </p>
              </div>
              <div className="space-y-3">
                <Shield className="h-12 w-12 text-green-500 mx-auto" />
                <h3 className="font-semibold">Fallback Safety</h3>
                <p className="text-sm text-gray-600">
                  If one network fails, seamlessly use the other
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Implementation */}
        <Card className="mb-8 bg-gray-50">
          <CardHeader>
            <CardTitle>Implementation Highlights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Quick Integration (2 hours)</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>✅ PhantomWalletButton component</li>
                  <li>✅ DualWalletConnector interface</li>
                  <li>✅ useUnifiedWallet hook</li>
                  <li>✅ Side-by-side wallet support</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Smart Features</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>⚡ Real-time wallet state monitoring</li>
                  <li>🧠 Intelligent chain recommendations</li>
                  <li>🛡️ Graceful error handling</li>
                  <li>🎨 Consistent UI across both wallets</li>
                </ul>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex justify-center gap-4">
                <Button 
                  variant="outline"
                  onClick={() => window.open('https://github.com/your-repo', '_blank')}
                >
                  <Github className="h-4 w-4 mr-2" />
                  View Implementation
                </Button>
                <Button 
                  onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Try Demo Below
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Section */}
        <div id="demo">
          <SmartPayDemo />
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>Multi-wallet integration completed in 2 hours</p>
          <p className="mt-1">Ready for Solana x402 Hackathon demonstration</p>
        </div>
      </div>
    </div>
  );
}