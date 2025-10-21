import { Check, Zap, Brain } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type TierType = "free" | "premium" | "agent";

export interface TierConfig {
  name: string;
  price: number;
  colors: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  icon: LucideIcon;
  description: string;
  features: string[];
}

export const TIERS: Record<TierType, TierConfig> = {
  free: {
    name: "Free",
    price: 0,
    colors: "border-green-500 bg-green-500/10",
    borderColor: "border-green-500",
    bgColor: "bg-green-500/10",
    textColor: "text-green-500",
    icon: Check,
    description: "Basic AI coaching feedback",
    features: [
      "Real-time form feedback",
      "Rep counting",
      "Basic workout tracking",
    ],
  },
  premium: {
    name: "Premium",
    price: 0.05,
    colors: "border-blue-500 bg-blue-500/10",
    borderColor: "border-blue-500",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-500",
    icon: Zap,
    description: "Enhanced LLM analysis with personality",
    features: [
      "Personalized coaching personalities",
      "Detailed performance analytics",
      "Advanced form analysis",
      "Workout history insights",
    ],
  },
  agent: {
    name: "AI Agent",
    price: 0.10,
    colors: "border-purple-500 bg-purple-500/10",
    borderColor: "border-purple-500",
    bgColor: "bg-purple-500/10",
    textColor: "text-purple-500",
    icon: Brain,
    description: "Autonomous AI coach with multi-tool reasoning",
    features: [
      "Autonomous multi-step reasoning",
      "Pose analysis tool",
      "Performance benchmarking",
      "Workout history queries",
      "Personalized training plans",
      "Goal-based recommendations",
    ],
  },
} as const;

// Helper functions
export const getTierConfig = (tier: TierType): TierConfig => {
  return TIERS[tier];
};

export const getTierPrice = (tier: TierType): number => {
  return TIERS[tier].price;
};

export const getTierColors = (tier: TierType): string => {
  return TIERS[tier].colors;
};

export const getTierName = (tier: TierType): string => {
  return TIERS[tier].name;
};
