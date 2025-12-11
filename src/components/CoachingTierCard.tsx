import React from "react";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, Check, Users, Network } from "lucide-react";
import { cn } from "@/lib/utils";

interface CoachingTierCardProps {
  tier: "free" | "premium" | "agent";
  variant?: "compact" | "full";
  showAgentEconomyInfo?: boolean;
  className?: string;
}

export function CoachingTierCard({
  tier,
  variant = "full",
  showAgentEconomyInfo = false,
  className,
}: CoachingTierCardProps) {
  const tierData = {
    free: {
      name: "Free Tier",
      price: "Free",
      icon: <Check className="h-4 w-4 text-green-400" />,
      description: "Real-time coaching, rep counting, form scoring",
      features: [
        "Basic AI analysis",
        "Real-time form feedback",
        "View leaderboard",
      ],
      borderClass: "border-2 border-green-500/50",
      bgClass: "bg-green-500/5",
      iconBgClass: "bg-green-500/20",
      iconColor: "text-green-400",
    },
    premium: {
      name: "Premium Tier",
      price: "$0.05 USDC",
      icon: <Zap className="h-4 w-4 text-blue-400" />,
      description: "Deep-dive analysis, detailed breakdown, recommendations",
      features: [
        "Advanced AI insights",
        "Detailed performance breakdown",
        "Personalized recommendations",
      ],
      borderClass: "border",
      bgClass: "bg-card hover:bg-accent/50",
      iconBgClass: "bg-blue-500/20",
      iconColor: "text-blue-400",
    },
    agent: {
      name: "AI Agent Tier",
      price: "$0.10 USDC",
      icon: <Brain className="h-4 w-4 text-purple-400" />,
      description: showAgentEconomyInfo 
        ? "5 AI specialists coordinate for personalized training plans"
        : "Autonomous coaching, training plans, benchmarking",
      features: [
        "Multi-agent coordination",
        "Comprehensive training plans",
        "Cross-disciplinary insights",
      ],
      borderClass: "border-2 border-purple-500/50",
      bgClass: "bg-gradient-to-r from-purple-500/10 to-blue-500/10",
      iconBgClass: "bg-purple-500/20",
      iconColor: "text-purple-400",
    },
  }[tier];

  if (variant === "compact") {
    return (
      <div className={cn("p-4 rounded-lg", tierData.borderClass, tierData.bgClass, className)}>
        <div className="flex items-center gap-3">
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", tierData.iconBgClass)}>
            {tierData.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm">{tierData.name}</h4>
              {tier === "agent" && showAgentEconomyInfo && (
                <Badge variant="outline" className="text-xs bg-purple-500/20 border-purple-500/30">
                  <Users className="h-3 w-3 mr-1" />
                  5 Specialists
                </Badge>
              )}
            </div>
            <Badge variant="outline" className="text-xs mt-1">
              {tierData.price}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 ml-11">
          {tierData.description}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg p-4 transition-colors", tierData.borderClass, tierData.bgClass, className)}>
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", tierData.iconBgClass)}>
          {tierData.icon}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm flex items-center gap-1">
            {tierData.name}
            {tier === "agent" && <Zap className="h-3 w-3 text-purple-400" />}
          </h4>
          <Badge variant="outline" className="text-xs">
            {tierData.price}
          </Badge>
        </div>
      </div>
      <p className="text-xs text-muted-foreground ml-10">
        {tierData.description}
      </p>
      
      {showAgentEconomyInfo && tier === "agent" && (
        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
          <Users className="h-3 w-3 text-purple-400" />
          <span>Multi-agent coordination via x402</span>
        </div>
      )}
    </div>
  );
}

export default CoachingTierCard;