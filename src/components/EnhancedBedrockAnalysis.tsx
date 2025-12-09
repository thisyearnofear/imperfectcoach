// Enhanced Bedrock Analysis - DEMONSTRATION of unified payment integration
// Shows how existing components can be enhanced without breaking changes

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Brain, Sparkles, Zap, DollarSign } from "lucide-react";
import { useAccount } from "wagmi";
import { PaymentStatus } from "./payments";

interface WorkoutData {
  reps: number;
  formScore: number;
  exercise: string;
  timestamp: number;
}

interface AnalysisResult {
  analysis: string;
  insights: string[];
  recommendations: string[];
}

interface EnhancedBedrockAnalysisProps {
  workoutData: WorkoutData;
  onAnalysisComplete?: (analysis: AnalysisResult) => void;
}

export function EnhancedBedrockAnalysis({ 
  workoutData, 
  onAnalysisComplete 
}: EnhancedBedrockAnalysisProps) {
  const { address } = useAccount();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  return (
    <div className="space-y-6">
      {/* Analysis Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Enhanced Bedrock Analysis
            <Badge variant="secondary" className="ml-2">Multi-Chain Powered</Badge>
          </CardTitle>
          <CardDescription>
            Advanced AI analysis with intelligent payment routing - automatically selects 
            the optimal blockchain for cost and speed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showPayment && !paymentResponse && !analysisResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <Zap className="h-8 w-8 text-blue-500 mx-auto" />
                  <div className="text-sm font-medium">Smart Routing</div>
                  <div className="text-xs text-gray-600">
                    Automatic chain selection
                  </div>
                </div>
                <div className="space-y-2">
                  <DollarSign className="h-8 w-8 text-green-500 mx-auto" />
                  <div className="text-sm font-medium">Optimized Fees</div>
                  <div className="text-xs text-gray-600">
                    Up to 90% fee reduction
                  </div>
                </div>
                <div className="space-y-2">
                  <Sparkles className="h-8 w-8 text-purple-500 mx-auto" />
                  <div className="text-sm font-medium">Enhanced AI</div>
                  <div className="text-xs text-gray-600">
                    Advanced Bedrock models
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleStartAnalysis} 
                className="w-full"
                size="lg"
              >
                Start Enhanced Analysis ($0.05)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Flow */}
      {showPayment && (
        <UnifiedPaymentFlow
          amount={BigInt(50000)} // $0.05 in microUSDC
          context="premium"
          description="Enhanced Bedrock Analysis"
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      )}

      {/* Payment Status */}
      {paymentResponse && (
        <PaymentStatus
          response={paymentResponse}
          isLoading={isAnalyzing}
          onRetry={resetAnalysis}
        />
      )}

      {/* Analysis Results */}
      {analysisResult && !isAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-500" />
              Analysis Complete
              <Badge className="ml-2">
                Powered by {paymentResponse?.chain === 'solana' ? 'Solana' : 'Base'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Enhanced Analysis Display */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                <div className="text-sm font-medium mb-2">AI Insights:</div>
                <div className="text-sm text-gray-700">
                  {analysisResult.analysis || "Advanced biomechanical analysis completed with multi-chain payment verification."}
                </div>
              </div>

              {/* Payment Chain Info */}
              <div className="text-xs text-gray-500 border-t pt-2">
                Payment processed via {paymentResponse?.chain === 'solana' ? 'Solana Devnet' : 'Base Sepolia'} • 
                Transaction: {paymentResponse?.transactionHash?.slice(0, 8)}...
                {paymentResponse?.fallbackUsed && " (fallback used)"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Multi-Chain Benefits */}
      {!showPayment && !paymentResponse && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="text-center text-sm text-gray-600">
              <div className="font-medium mb-1">🚀 Enhanced Multi-Chain Experience</div>
              <div className="text-xs">
                Our AI automatically selects the optimal blockchain - Solana for micro-payments, 
                Base for established infrastructure. Same experience, optimized economics.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}