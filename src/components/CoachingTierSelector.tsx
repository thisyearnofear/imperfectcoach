import { useState, useEffect, useContext } from "react";
import { UserContext } from "@/contexts/UserContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Brain, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Target,
  TrendingUp,
  Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CoachingTier {
  id: "free" | "premium" | "agent";
  name: string;
  description: string;
  price: string;
  features: string[];
  icon: React.ReactNode;
  color: string;
  badgeColor: string;
  isRecommended?: boolean;
}

interface CoachingTierSelectorProps {
  currentTier: "free" | "premium" | "agent";
  onTierSelect: (tier: "free" | "premium" | "agent") => void;
  className?: string;
  compact?: boolean;
}

export function CoachingTierSelector({
  currentTier,
  onTierSelect,
  className,
  compact = false
}: CoachingTierSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const context = useContext(UserContext);
  const userStats = context?.userStats;
  
  const coachingTiers: CoachingTier[] = [
    {
      id: "free",
      name: "Real-time Coaching",
      description: "Basic form feedback and rep counting",
      price: "Free",
      features: [
        "Real-time form feedback",
        "Rep counting",
        "Basic analytics"
      ],
      icon: <Zap className="h-5 w-5" />,
      color: "from-gray-600 to-gray-800",
      badgeColor: "bg-gray-500/20 text-gray-300"
    },
    {
      id: "premium",
      name: "Deep Analysis",
      description: "Comprehensive workout analysis",
      price: "$0.05",
      features: [
        "Advanced pose analysis",
        "Performance metrics",
        "Detailed insights"
      ],
      icon: <Target className="h-5 w-5" />,
      color: "from-blue-600 to-indigo-700",
      badgeColor: "bg-blue-500/20 text-blue-300"
    },
    {
      id: "agent",
      name: "AI Coach Agent",
      description: "Autonomous multi-step reasoning",
      price: "$0.10",
      features: [
        "Multi-step reasoning",
        "Tool integration",
        "Personalized training plans",
        "Autonomous decisions"
      ],
      icon: <Brain className="h-5 w-5" />,
      color: "from-purple-600 to-indigo-700",
      badgeColor: "bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-purple-200",
      isRecommended: userStats?.sessions && userStats.sessions > 3
    }
  ];

  // Auto-expand if user has sufficient sessions or has used premium before
  useEffect(() => {
    if (userStats?.sessions && userStats.sessions > 5) {
      setIsExpanded(true);
    }
  }, [userStats?.sessions]);

  const currentTierData = coachingTiers.find(tier => tier.id === currentTier);

  if (compact) {
    return (
      <Card className={cn("border-border/40 bg-card/50 backdrop-blur-sm", className)}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-2 rounded-lg bg-gradient-to-r",
                currentTierData?.color || "from-gray-600 to-gray-800"
              )}>
                {currentTierData?.icon}
              </div>
              <div>
                <p className="text-sm font-medium">{currentTierData?.name}</p>
                <p className="text-xs text-muted-foreground">{currentTierData?.price}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-border/40 space-y-2">
              {coachingTiers.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => {
                    onTierSelect(tier.id);
                    setIsExpanded(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors",
                    currentTier === tier.id 
                      ? "bg-primary/10 border border-primary/20" 
                      : "hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-md bg-gradient-to-r",
                    tier.color
                  )}>
                    {tier.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{tier.name}</span>
                      {tier.isRecommended && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                          <Lightbulb className="h-2.5 w-2.5 mr-1" />
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{tier.price}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-border/40 bg-card/50 backdrop-blur-sm", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Coaching Tiers
        </CardTitle>
        <CardDescription>
          Choose your level of AI-powered coaching
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {coachingTiers.map((tier) => (
          <button
            key={tier.id}
            onClick={() => onTierSelect(tier.id)}
            className={cn(
              "w-full p-4 rounded-xl border text-left transition-all hover:scale-[1.02]",
              currentTier === tier.id
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:bg-muted/50"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-lg bg-gradient-to-r",
                  tier.color
                )}>
                  {tier.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{tier.name}</h3>
                    {tier.isRecommended && (
                      <Badge 
                        variant="secondary" 
                        className={cn("text-[10px] px-1.5 py-0.5", tier.badgeColor)}
                      >
                        <Lightbulb className="h-2.5 w-2.5 mr-1" />
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tier.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {tier.features.slice(0, 2).map((feature, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline" 
                        className="text-[10px] px-1.5 py-0.5"
                      >
                        {feature}
                      </Badge>
                    ))}
                    {tier.features.length > 2 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                        +{tier.features.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{tier.price}</p>
                {currentTier === tier.id && (
                  <Badge className={cn("mt-1 text-[10px]", tier.badgeColor)}>
                    Current
                  </Badge>
                )}
              </div>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}