import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Users, Network, DollarSign, Zap, CheckCircle, ChevronRight } from "lucide-react";
import { AgentValueProposition } from "@/components/agent-economy/AgentValueProposition";
import { AgentCoordinationProgress } from "@/components/agent-economy/AgentCoordinationProgress";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
  onGetStarted?: () => void;
  onLearnMore?: () => void;
  className?: string;
}

export function HeroSection({ onGetStarted, onLearnMore, className }: HeroSectionProps) {
  return (
    <section className={cn("container mx-auto py-12 md:py-20 px-4", className)}>
      <div className="max-w-6xl mx-auto">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 text-sm">
            <Zap className="h-4 w-4 mr-2" />
            Next-Generation AI Fitness Coaching
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            5 AI Specialists • 1 Price
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Get comprehensive fitness coaching from 5 AI experts working together via x402 protocol
            for just $0.10 - that's 99.97% savings over traditional coaching.
          </p>
          
          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={onGetStarted} 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-6 h-auto"
              size="lg"
            >
              Get Started Free
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              onClick={onLearnMore} 
              variant="outline"
              className="text-lg px-8 py-6 h-auto border-purple-500/30 hover:border-purple-500/50"
              size="lg"
            >
              Learn How It Works
            </Button>
          </div>
        </div>

        {/* Agent Value Proposition - Full Version */}
        <div className="mb-16">
          <div className="bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-purple-500/20 rounded-2xl p-6 md:p-8">
            <AgentValueProposition variant="full" showNetwork={true} />
          </div>
        </div>

        {/* Key Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Feature 1: Multi-Agent Coordination */}
          <Card className="border-2 border-purple-500/30 bg-purple-500/5 hover:shadow-lg hover:shadow-purple-500/10 transition-all">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">
                  x402 Protocol
                </Badge>
              </div>
              <h3 className="text-xl font-bold mb-3">Multi-Agent Coordination</h3>
              <p className="text-muted-foreground mb-4">
                5 AI specialists (Fitness, Nutrition, Biomechanics, Recovery, Scheduling) work together seamlessly to create your personalized training plan.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Real-time collaboration
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Cross-disciplinary insights
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Adaptive optimization
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Feature 2: Cost Savings */}
          <Card className="border-2 border-green-500/30 bg-green-500/5 hover:shadow-lg hover:shadow-green-500/10 transition-all">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                  99.97% Savings
                </Badge>
              </div>
              <h3 className="text-xl font-bold mb-3">Unbeatable Value</h3>
              <p className="text-muted-foreground mb-4">
                Get $350 worth of expert analysis for just $0.10. Our agent economy makes premium coaching accessible to everyone.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Traditional cost</span>
                  <span className="text-sm line-through text-muted-foreground">$350+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-green-600">Your cost</span>
                  <span className="text-2xl font-bold text-green-600">$0.10</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature 3: Multi-Chain */}
          <Card className="border-2 border-blue-500/30 bg-blue-500/5 hover:shadow-lg hover:shadow-blue-500/10 transition-all">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Network className="h-6 w-6 text-blue-600" />
                </div>
                <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
                  Multi-Chain
                </Badge>
              </div>
              <h3 className="text-xl font-bold mb-3">Cross-Chain Coordination</h3>
              <p className="text-muted-foreground mb-4">
                Agents coordinate across Avalanche, Base, and Solana networks using x402 protocol for maximum efficiency and reliability.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Automatic network selection
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Optimized gas efficiency
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Cross-chain verification
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">How Agent Coordination Works</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Steps */}
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="font-bold text-blue-600">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">You Work Out</h4>
                  <p className="text-muted-foreground">
                    Complete your workout with real-time AI form analysis and feedback.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="font-bold text-blue-600">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Agents Coordinate</h4>
                  <p className="text-muted-foreground">
                    5 AI specialists analyze your performance via x402 protocol, sharing insights and creating your personalized plan.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="font-bold text-blue-600">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Receive Your Plan</h4>
                  <p className="text-muted-foreground">
                    Get a comprehensive 4-week training program with insights from all specialists, delivered instantly.
                  </p>
                </div>
              </div>
            </div>

            {/* Visualization */}
            <div className="bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-purple-500/20 rounded-2xl p-6">
              <AgentCoordinationProgress 
                coordination={{
                  coordinator: {
                    agentId: 'agent-fitness-core',
                    agentName: 'Fitness Coach',
                    emoji: '🏋️',
                    role: 'coordinator',
                    status: 'processing',
                    statusMessage: 'Coordinating specialists',
                    cost: '0.04',
                  },
                  contributors: [
                    {
                      agentId: 'agent-nutrition',
                      agentName: 'Nutrition Advisor',
                      emoji: '🥗',
                      role: 'specialist',
                      status: 'discovering',
                      statusMessage: 'Analyzing requirements',
                      cost: '0.03',
                    },
                    {
                      agentId: 'agent-biomechanics',
                      agentName: 'Biomechanics Expert',
                      emoji: '🦴',
                      role: 'specialist',
                      status: 'processing',
                      statusMessage: 'Evaluating form',
                      cost: '0.02',
                    },
                    {
                      agentId: 'agent-recovery',
                      agentName: 'Recovery Specialist',
                      emoji: '💆',
                      role: 'specialist',
                      status: 'negotiating',
                      statusMessage: 'Planning recovery',
                      cost: '0.01',
                    },
                    {
                      agentId: 'agent-calendar',
                      agentName: 'Schedule Coordinator',
                      emoji: '📅',
                      role: 'utility',
                      status: 'discovering',
                      statusMessage: 'Optimizing schedule',
                      cost: '0.00',
                    },
                  ],
                  primaryNetwork: 'avalanche-c-chain',
                  routingReason: 'Optimal for coordination',
                }}
                progress={65}
                currentStep="Agents coordinating your personalized plan"
              />
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Experience the Future of Fitness?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start with our free tier and upgrade to agent coordination anytime for comprehensive insights.
          </p>
          
          <Button 
            onClick={onGetStarted} 
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-10 py-6 h-auto mb-4"
            size="lg"
          >
            Start Your Free Workout
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
          
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>No wallet required to start</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Instant AI feedback</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Upgrade anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;