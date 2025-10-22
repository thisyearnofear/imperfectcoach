import { useState, useEffect, useContext } from "react";
import { UserContext } from "@/contexts/UserContext";

interface FeatureDiscovery {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  priority: "low" | "medium" | "high";
  conditions: {
    minSessions?: number;
    minStreak?: number;
    hasUsedPremium?: boolean;
    hasUsedAgent?: boolean;
    timeSinceLastView?: number; // in days
  };
  onDismiss: () => void;
  onCtaClick: () => void;
}

export function useFeatureDiscovery() {
  const context = useContext(UserContext);
  const userStats = context?.userStats;
  const updateUserStats = context?.updateUserStats;
  
  const [dismissedFeatures, setDismissedFeatures] = useState<Record<string, number>>({});
  
  // Load dismissed features from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("dismissedFeatures");
    if (saved) {
      try {
        setDismissedFeatures(JSON.parse(saved));
      } catch (e) {
        console.warn("Failed to parse dismissed features", e);
      }
    }
  }, []);
  
  // Save dismissed features to localStorage
  useEffect(() => {
    localStorage.setItem("dismissedFeatures", JSON.stringify(dismissedFeatures));
  }, [dismissedFeatures]);
  
  const dismissFeature = (featureId: string) => {
    setDismissedFeatures(prev => ({
      ...prev,
      [featureId]: Date.now()
    }));
    
    // Update user stats
    if (userStats) {
      updateUserStats({
        ...userStats,
        lastFeatureDismissal: {
          ...userStats.lastFeatureDismissal,
          [featureId]: Date.now()
        }
      });
    }
  };
  
  const getAvailableFeatures = (): FeatureDiscovery[] => {
    const features: FeatureDiscovery[] = [];
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Agent Tier Discovery
    if (userStats) {
      const shouldShowAgentFeature = 
        userStats.sessions >= 3 && 
        !userStats.lastFeatureDismissal?.["agent-tier"] &&
        (!dismissedFeatures["agent-tier"] || 
         now - dismissedFeatures["agent-tier"] > 7 * oneDay);
      
      if (shouldShowAgentFeature) {
        features.push({
          id: "agent-tier",
          title: "Unlock AI Coach Agent",
          description: "Get autonomous multi-step analysis with personalized training plans",
          ctaText: "Try Agent Tier",
          priority: userStats.sessions >= 5 ? "high" : "medium",
          conditions: {
            minSessions: 3
          },
          onDismiss: () => dismissFeature("agent-tier"),
          onCtaClick: () => {
            dismissFeature("agent-tier");
            // Navigate to agent tier or show agent upsell
            window.dispatchEvent(new CustomEvent("showAgentUpsell"));
          }
        });
      }
      
      // Training Plan Feature
      const shouldShowTrainingPlan = 
        (userStats.sessions >= 5 || userStats.hasUsedPremium) &&
        !userStats.lastFeatureDismissal?.["training-plans"] &&
        (!dismissedFeatures["training-plans"] || 
         now - dismissedFeatures["training-plans"] > 14 * oneDay);
      
      if (shouldShowTrainingPlan) {
        features.push({
          id: "training-plans",
          title: "Personalized Training Plans",
          description: "Create adaptive programs based on your performance patterns",
          ctaText: "Generate Plan",
          priority: "medium",
          conditions: {
            minSessions: 5,
            hasUsedPremium: true
          },
          onDismiss: () => dismissFeature("training-plans"),
          onCtaClick: () => {
            dismissFeature("training-plans");
            window.dispatchEvent(new CustomEvent("showTrainingPlans"));
          }
        });
      }
      
      // Performance Analytics
      const shouldShowAnalytics = 
        userStats.sessions >= 10 &&
        !userStats.lastFeatureDismissal?.["performance-analytics"] &&
        (!dismissedFeatures["performance-analytics"] || 
         now - dismissedFeatures["performance-analytics"] > 14 * oneDay);
      
      if (shouldShowAnalytics) {
        features.push({
          id: "performance-analytics",
          title: "Advanced Performance Analytics",
          description: "Deep dive into your progress with trend analysis and benchmarks",
          ctaText: "View Analytics",
          priority: "low",
          conditions: {
            minSessions: 10
          },
          onDismiss: () => dismissFeature("performance-analytics"),
          onCtaClick: () => {
            dismissFeature("performance-analytics");
            window.dispatchEvent(new CustomEvent("showAnalytics"));
          }
        });
      }
    }
    
    // Sort by priority (high first)
    return features.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };
  
  const getHighestPriorityFeature = (): FeatureDiscovery | null => {
    const features = getAvailableFeatures();
    return features.length > 0 ? features[0] : null;
  };
  
  return {
    availableFeatures: getAvailableFeatures(),
    highestPriorityFeature: getHighestPriorityFeature(),
    dismissFeature
  };
}