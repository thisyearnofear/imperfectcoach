import { useState, useEffect, useContext } from "react";
import { UserContext } from "@/contexts/UserContext";

interface ContextualSuggestion {
  id: string;
  title: string;
  description: string;
  action: {
    type: "navigate" | "showComponent" | "externalLink";
    target: string;
    label: string;
  };
  context: {
    minSessions?: number;
    maxSessions?: number;
    minFormScore?: number;
    maxFormScore?: number;
    exercise?: string;
    streak?: number;
    hasUsedFeature?: string;
    timeSinceLastUse?: number; // in days
  };
  priority: "low" | "medium" | "high";
  dismissible: boolean;
  frequency: "once" | "daily" | "weekly";
}

export function useContextualSuggestions() {
  const context = useContext(UserContext);
  const userStats = context?.userStats;
  
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Record<string, number>>({});
  
  // Load dismissed suggestions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("dismissedSuggestions");
    if (saved) {
      try {
        setDismissedSuggestions(JSON.parse(saved));
      } catch (e) {
        console.warn("Failed to parse dismissed suggestions", e);
      }
    }
  }, []);
  
  // Save dismissed suggestions to localStorage
  useEffect(() => {
    localStorage.setItem("dismissedSuggestions", JSON.stringify(dismissedSuggestions));
  }, [dismissedSuggestions]);
  
  const dismissSuggestion = (suggestionId: string) => {
    setDismissedSuggestions(prev => ({
      ...prev,
      [suggestionId]: Date.now()
    }));
  };
  
  const getSuggestionsForContext = (currentContext: {
    exercise?: string;
    formScore?: number;
    sessionCount?: number;
  }): ContextualSuggestion[] => {
    if (!userStats) return [];
    
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    
    const allSuggestions: ContextualSuggestion[] = [
      // Form Improvement Suggestions
      {
        id: "form-improvement-pullups",
        title: "Improve Your Pull-up Form",
        description: "Your form score is below 70%. The AI Coach Agent can identify specific issues.",
        action: {
          type: "showComponent",
          target: "agentUpsell",
          label: "Get Form Analysis"
        },
        context: {
          exercise: "pullups",
          maxFormScore: 70,
          minSessions: 3
        },
        priority: "high",
        dismissible: true,
        frequency: "weekly"
      },
      {
        id: "form-improvement-jumps",
        title: "Optimize Your Jump Technique",
        description: "Your landing technique could be improved. Get detailed analysis with AI Coach.",
        action: {
          type: "showComponent",
          target: "agentUpsell",
          label: "Analyze Jumps"
        },
        context: {
          exercise: "jumps",
          maxFormScore: 75,
          minSessions: 3
        },
        priority: "high",
        dismissible: true,
        frequency: "weekly"
      },
      
      // Consistency Suggestions
      {
        id: "consistency-reminder",
        title: "Maintain Your Streak",
        description: "You're on a " + (userStats.streak || 0) + " day streak! Keep it going.",
        action: {
          type: "navigate",
          target: "/",
          label: "Start Workout"
        },
        context: {
          streak: 3,
          maxSessions: 10
        },
        priority: "medium",
        dismissible: true,
        frequency: "daily"
      },
      
      // Advanced Feature Suggestions
      {
        id: "try-agent-tier",
        title: "Unlock AI Coach Agent",
        description: "Get autonomous multi-step analysis with personalized training plans.",
        action: {
          type: "showComponent",
          target: "agentUpsell",
          label: "Try Agent Tier"
        },
        context: {
          minSessions: 5,
          hasUsedFeature: "premium"
        },
        priority: "high",
        dismissible: true,
        frequency: "weekly"
      },
      
      // Performance Milestone Suggestions
      {
        id: "milestone-celebration",
        title: "Congratulations on 10 Workouts!",
        description: "You've completed 10 sessions. Time to unlock advanced analytics.",
        action: {
          type: "showComponent",
          target: "analytics",
          label: "View Analytics"
        },
        context: {
          minSessions: 10
        },
        priority: "medium",
        dismissible: false,
        frequency: "once"
      },
      
      // Personal Best Suggestions
      {
        id: "personal-best",
        title: "New Personal Best!",
        description: "You just beat your previous record. Analyze what made the difference.",
        action: {
          type: "showComponent",
          target: "premiumAnalysis",
          label: "Deep Analysis"
        },
        context: {
          minSessions: 3
        },
        priority: "high",
        dismissible: true,
        frequency: "daily"
      }
    ];
    
    // Filter suggestions based on current context and dismissal status
    const relevantSuggestions = allSuggestions.filter(suggestion => {
      // Check if suggestion has been dismissed recently
      const dismissedTime = dismissedSuggestions[suggestion.id];
      if (dismissedTime) {
        const frequencyLimit = suggestion.frequency === "daily" ? oneDay : 
                             suggestion.frequency === "weekly" ? oneWeek : 
                             Infinity;
        
        if (now - dismissedTime < frequencyLimit) {
          return false;
        }
      }
      
      // Check context conditions
      const context = suggestion.context;
      
      if (context.minSessions !== undefined && userStats.sessions < context.minSessions) {
        return false;
      }
      
      if (context.maxSessions !== undefined && userStats.sessions > context.maxSessions) {
        return false;
      }
      
      if (context.streak !== undefined && userStats.streak < context.streak) {
        return false;
      }
      
      if (context.exercise && currentContext.exercise !== context.exercise) {
        return false;
      }
      
      if (context.minFormScore !== undefined && 
          currentContext.formScore !== undefined && 
          currentContext.formScore >= context.minFormScore) {
        return false;
      }
      
      if (context.maxFormScore !== undefined && 
          currentContext.formScore !== undefined && 
          currentContext.formScore <= context.maxFormScore) {
        // This condition is met, continue
      } else if (context.maxFormScore !== undefined) {
        return false;
      }
      
      if (context.hasUsedFeature) {
        const hasUsed = context.hasUsedFeature === "premium" ? userStats.hasUsedPremium :
                       context.hasUsedFeature === "agent" ? userStats.hasUsedAgent :
                       false;
        if (!hasUsed) {
          return false;
        }
      }
      
      return true;
    });
    
    // Sort by priority (high first)
    return relevantSuggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };
  
  const getHighestPrioritySuggestion = (context: {
    exercise?: string;
    formScore?: number;
    sessionCount?: number;
  }) => {
    const suggestions = getSuggestionsForContext(context);
    return suggestions.length > 0 ? suggestions[0] : null;
  };
  
  return {
    getSuggestionsForContext,
    getHighestPrioritySuggestion,
    dismissSuggestion
  };
}