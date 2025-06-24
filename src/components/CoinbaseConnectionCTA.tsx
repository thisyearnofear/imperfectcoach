import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Wallet,
  Zap,
  Trophy,
  BarChart3,
  Brain,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { InlineWallet } from "./UnifiedWallet";

interface CoinbaseConnectionCTAProps {
  reps: number;
  averageFormScore: number;
  exercise: string;
}

const CoinbaseConnectionCTA = ({
  reps,
  averageFormScore,
  exercise,
}: CoinbaseConnectionCTAProps) => {
  const benefits = [
    {
      icon: Brain,
      title: "AWS-powered Premium Analysis",
      description: "Bedrock Nova deep dive into your technique",
      highlight: true,
    },
    {
      icon: Trophy,
      title: "On-chain Score Records",
      description: "Permanent achievements on Base Sepolia",
      highlight: false,
    },
    {
      icon: BarChart3,
      title: "Global Leaderboard",
      description: "Compete with athletes worldwide",
      highlight: false,
    },
    {
      icon: Sparkles,
      title: "Multi-AI Coaching",
      description: "Insights from 3 AI coaches + chat",
      highlight: false,
    },
  ];

  return (
    <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Wallet className="h-6 w-6 text-blue-600" />
          <CardTitle className="text-blue-800">
            🚀 Ready to Rumble on Base?
          </CardTitle>
        </div>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            <Zap className="h-3 w-3 mr-1" />
            Base Sepolia
          </Badge>
          <Badge variant="outline" className="bg-purple-100 text-purple-800">
            AWS Powered
          </Badge>
        </div>
        <p className="text-blue-700 text-sm">
          Free Gemini analysis of{" "}
          <span className="font-semibold">
            {reps} {exercise.replace("-", " ")}
          </span>{" "}
          (
          <span className="font-semibold">{Math.round(averageFormScore)}%</span>{" "}
          form) - once connected - is just the beginning.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                benefit.highlight
                  ? "bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200"
                  : "bg-white border border-gray-100"
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  benefit.highlight
                    ? "bg-purple-200 text-purple-700"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                <benefit.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium text-sm ${
                    benefit.highlight ? "text-purple-800" : "text-gray-800"
                  }`}
                >
                  {benefit.title}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {benefit.description}
                </p>
              </div>
              {benefit.highlight && (
                <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0 mt-1" />
              )}
            </div>
          ))}
        </div>

        {/* Connection Section */}
        <div className="space-y-4">
          {/* Inline Wallet Component - Centered */}
          <div className="flex justify-center">
            <InlineWallet showOnboarding={false} />
          </div>

          {/* Benefits Alert */}
          <Alert className="border-green-200 bg-green-50 justify-center text-center">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-sm">
              <strong>BASED.</strong> Once connected, submit scores to the
              global leaderboard + unlock premium AWS analysis for just $0.05.
            </AlertDescription>
          </Alert>

          {/* Hackathon Branding */}
          <div className="text-center pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <span className="font-medium">Powered by Base Sepolia</span> •{" "}
              <span className="font-medium">
                Built for Coinbase Agents Hackathon
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CoinbaseConnectionCTA;
