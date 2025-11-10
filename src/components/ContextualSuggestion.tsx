import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  X, 
  ChevronRight,
  Target,
  Brain,
  TrendingUp,
  Trophy,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useContextualSuggestions } from "@/hooks/useContextualSuggestions";

interface ContextualSuggestionProps {
  context: {
    exercise?: string;
    formScore?: number;
    sessionCount?: number;
  };
  variant?: "banner" | "card" | "compact";
  className?: string;
  autoDismiss?: boolean;
  onAction?: (action: { type: string; target: string }) => void;
  onDismiss?: () => void;
}

export function ContextualSuggestion({
  context,
  variant = "card",
  className,
  autoDismiss = false,
  onAction,
  onDismiss
}: ContextualSuggestionProps) {
  const { getHighestPrioritySuggestion, dismissSuggestion } = useContextualSuggestions();
  const [isVisible, setIsVisible] = useState(false);
  const suggestion = getHighestPrioritySuggestion(context);
  
  useEffect(() => {
    if (suggestion) {
      setIsVisible(true);
      
      // Auto-dismiss after 10 seconds for banner variant
      if (autoDismiss && variant === "banner") {
        const timer = setTimeout(() => {
          handleDismiss();
        }, 10000);
        return () => clearTimeout(timer);
      }
    }
  }, [suggestion, autoDismiss, variant]);
  
  const handleDismiss = () => {
    if (suggestion) {
      dismissSuggestion(suggestion.id);
    }
    setIsVisible(false);
    onDismiss?.();
  };
  
  const handleAction = () => {
    if (suggestion) {
      onAction?.(suggestion.action);
      if (autoDismiss) {
        setIsVisible(false);
      }
    }
  };
  
  if (!suggestion || !isVisible) {
    return null;
  }
  
  const getIcon = () => {
    if (suggestion.id.includes("form")) return <Target className="h-5 w-5" />;
    if (suggestion.id.includes("agent")) return <Brain className="h-5 w-5" />;
    if (suggestion.id.includes("analytics")) return <TrendingUp className="h-5 w-5" />;
    if (suggestion.id.includes("milestone")) return <Trophy className="h-5 w-5" />;
    if (suggestion.id.includes("consistency")) return <Zap className="h-5 w-5" />;
    return <Lightbulb className="h-5 w-5" />;
  };
  
  const getPriorityColor = () => {
    switch (suggestion.priority) {
      case "high": return "from-purple-600 to-indigo-600";
      case "medium": return "from-blue-600 to-cyan-600";
      default: return "from-gray-600 to-gray-700";
    }
  };
  
  if (variant === "banner") {
    return (
      <div className={cn(
        "relative overflow-hidden rounded-lg border bg-gradient-to-r p-4 text-card-foreground shadow-sm",
        getPriorityColor().replace("from-", "from-").replace("to-", "to-"),
        className
      )}>
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
        <div className="relative flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0 rounded-full bg-white/20 p-2">
            <Lightbulb className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">{suggestion.title}</h3>
            <p className="text-sm text-white/90 mt-1">{suggestion.description}</p>
            <div className="flex items-center gap-2 mt-3">
              <Button 
                size="sm" 
                variant="secondary"
                onClick={handleAction}
                className="h-8"
              >
                {suggestion.action.label}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleDismiss}
                className="h-8 text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (variant === "compact") {
    return (
      <Card className={cn("border-border/40 bg-card/50 backdrop-blur-sm", className)}>
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div className={cn(
              "mt-0.5 flex-shrink-0 rounded-full p-1.5 bg-gradient-to-r",
              getPriorityColor()
            )}>
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold truncate">{suggestion.title}</h3>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-[10px] px-1.5 py-0.5",
                    suggestion.priority === "high" ? "bg-red-500/20 text-red-300" :
                    suggestion.priority === "medium" ? "bg-yellow-500/20 text-yellow-300" :
                    "bg-gray-500/20 text-gray-300"
                  )}
                >
                  {suggestion.priority}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {suggestion.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={handleAction}
                  className="h-7 text-xs"
                >
                  {suggestion.action.label}
                </Button>
                {suggestion.dismissible && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={handleDismiss}
                    className="h-7 w-7 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Default card variant
  return (
    <Card className={cn("border-border/40 bg-card/50 backdrop-blur-sm relative overflow-hidden", className)}>
      <div className={cn(
        "absolute top-0 right-0 h-24 w-24 bg-gradient-to-r opacity-10",
        getPriorityColor()
      )} />
      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className={cn(
              "p-2 rounded-lg bg-gradient-to-r",
              getPriorityColor()
            )}>
              {getIcon()}
            </div>
            {suggestion.title}
          </CardTitle>
          {suggestion.dismissible && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          {suggestion.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-center justify-between">
          <Badge 
            variant="secondary" 
            className={cn(
              "text-xs",
              suggestion.priority === "high" ? "bg-red-500/20 text-red-300" :
              suggestion.priority === "medium" ? "bg-yellow-500/20 text-yellow-300" :
              "bg-gray-500/20 text-gray-300"
            )}
          >
            <Lightbulb className="mr-1 h-3 w-3" />
            {suggestion.priority === "high" ? "High Priority" : 
             suggestion.priority === "medium" ? "Recommended" : "Available"}
          </Badge>
          <Button onClick={handleAction}>
            {suggestion.action.label}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}