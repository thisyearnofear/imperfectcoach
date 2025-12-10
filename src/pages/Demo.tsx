// Demo Page - Showcase for x402 Decentralized Agent Economy
// Demonstrates agent autonomy, multi-chain routing, and inter-agent payments

import React from 'react';
import { SmartPayDemo } from '../components/demos/SmartPayDemo';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  Github, 
  ExternalLink, 
  Award, 
  Brain,
  Zap,
  Shield
} from 'lucide-react';

export function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Imperfect Coach
            </h1>
            <Zap className="h-8 w-8 text-purple-500" />
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            First AI Agent with Smart Payment Routing
          </h2>
          
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
            Watch our AI agents make real-time economic decisions - autonomously selecting 
            optimal blockchains, negotiating service pricing, and coordinating multi-agent solutions. 
            Built for the <strong>Avalanche Hack2Build</strong>.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Badge className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2">
              <Award className="h-4 w-4 mr-2" />
              Avalanche Hack2Build Participant
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              <Shield className="h-4 w-4 mr-2" />
              Agent Economy Live
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              <Github className="h-4 w-4 mr-2" />
              Open Source
            </Badge>
          </div>

          <div className="flex justify-center gap-4">
            <Button 
              onClick={() => window.open('https://github.com/your-repo', '_blank')}
              className="flex items-center gap-2"
            >
              <Github className="h-4 w-4" />
              View Code
            </Button>
            <Button 
              variant="outline"
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Try Demo
            </Button>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Brain className="h-5 w-5" />
                AI Decision Making
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-600">
                Our agent analyzes transaction context, network conditions, and fees 
                to automatically select the optimal blockchain in real-time.
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Zap className="h-5 w-5" />
                Smart Routing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-600">
                Micro-payments route to Solana (90% fee savings), premium services 
                stay on Base for reliability. Users get the best of both worlds.
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Shield className="h-5 w-5" />
                Intelligent Fallbacks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-purple-600">
                If Solana is congested, automatically fallback to Base. 
                Zero breaking changes ensure existing users see no disruption.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Technical Innovation */}
        <Card className="mb-12 border-0 bg-gradient-to-r from-gray-50 to-blue-50">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Technical Innovation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Enhanced x402 Protocol</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full" />
                    Multi-chain payment verification
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full" />
                    Intelligent routing algorithms
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full" />
                    Real-time network health monitoring
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full" />
                    Graceful degradation systems
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Production Architecture</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    AWS Lambda with multi-chain support
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    TypeScript with full type safety
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    Comprehensive test coverage
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    Zero regression guarantees
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Demo */}
        <div id="demo">
          <SmartPayDemo />
        </div>

        {/* Agent Economy Info */}
        <Card className="mt-12 border border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-center text-green-800">
              Decentralized Agent Economy
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-green-700 mb-4">
              This project demonstrates the next frontier: autonomous agents that negotiate 
              with each other, pay transparently, and coordinate complex multi-service solutions. 
              No centralized intermediary—just pure agent-to-agent coordination via x402.
            </p>
            <div className="flex justify-center gap-4">
              <Button 
                variant="outline"
                onClick={() => window.open('https://build.avax.network/hackathons/5ce3a8c2-21db-40fa-b40f-f82ecdde99db#submission', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Hackathon Details
              </Button>
              <Button 
                onClick={() => window.open('https://github.com/thisyearnofear/imperfectcoach', '_blank')}
              >
                <Github className="h-4 w-4 mr-2" />
                Source Code
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>
            Built with enhancement-first principles • Zero breaking changes • Production ready
          </p>
          <p className="mt-2">
            Transforming AI agents from payment users to payment optimizers
          </p>
        </div>
      </div>
    </div>
  );
}