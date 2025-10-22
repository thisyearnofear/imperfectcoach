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
import { motion, AnimatePresence } from "framer-motion";

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
  // Note: UserContext doesn't have userStats - using hasSubmittedScore as proxy
  const userStats = context ? { sessions: context.hasSubmittedScore ? 10 : 0 } : null;
  
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
        {coachingTiers.map((tier, index) => (
          <motion.button
            key={tier.id}
            onClick={() => onTierSelect(tier.id)}
            className={cn(
              "w-full p-4 rounded-xl border text-left transition-all",
              currentTier === tier.id
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:bg-muted/50"
            )}
            whileHover={{
              scale: 1.02,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
            }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <motion.div
                  className={cn(
                    "p-2 rounded-lg bg-gradient-to-r",
                    tier.color
                  )}
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  {tier.icon}
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{tier.name}</h3>
                    {tier.isRecommended && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.5 }}
                      >
                        <Badge
                          variant="secondary"
                          className={cn("text-[10px] px-1.5 py-0.5", tier.badgeColor)}
                        >
                          <Lightbulb className="h-2.5 w-2.5 mr-1" />
                          Recommended
                        </Badge>
                      </motion.div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tier.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <AnimatePresence>
                      {tier.features.slice(0, 2).map((feature, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2, delay: idx * 0.1 }}
                        >
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0.5"
                          >
                            {feature}
                          </Badge>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {tier.features.length > 2 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                          +{tier.features.length - 2} more
                        </Badge>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <motion.p
                  className="font-semibold"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {tier.price}
                </motion.p>
                {currentTier === tier.id && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Badge className={cn("mt-1 text-[10px]", tier.badgeColor)}>
                      Current
                    </Badge>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </CardContent>
    </Card>
  );
}