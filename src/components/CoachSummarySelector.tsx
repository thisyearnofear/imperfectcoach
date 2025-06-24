import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CoachModel } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Lock, Crown } from "lucide-react";
import { useFeatureAvailability } from "@/hooks/useFeatureGate";
import { cn } from "@/lib/utils";

interface CoachSummarySelectorProps {
  selectedCoaches: CoachModel[];
  onSelectionChange: (coaches: CoachModel[]) => void;
  disabled: boolean;
  onUpgrade?: () => void;
  bedrockSectionRef?: React.RefObject<HTMLDivElement>;
}

const coachOptions: {
  model: CoachModel;
  name: string;
  isPremium: boolean;
  emoji: string;
}[] = [
  {
    model: "gemini",
    name: "Gemini",
    isPremium: false,
    emoji: "🤖",
  },
  {
    model: "openai",
    name: "OpenAI",
    isPremium: true,
    emoji: "🔒",
  },
  {
    model: "anthropic",
    name: "Anthropic",
    isPremium: true,
    emoji: "🔒",
  },
];

export function CoachSummarySelector({
  selectedCoaches,
  onSelectionChange,
  disabled,
  onUpgrade,
  bedrockSectionRef,
}: CoachSummarySelectorProps) {
  const {
    available: canSelectMultiple,
    showDisabled,
    tier,
  } = useFeatureAvailability("MULTIPLE_AI_COACHES");

  const handleSelectionChange = (value: CoachModel[]) => {
    if (!canSelectMultiple) {
      // Only allow Gemini for free/connected users
      const filteredValue = value.filter((coach) => coach === "gemini");
      onSelectionChange(filteredValue.length > 0 ? filteredValue : ["gemini"]);
    } else {
      onSelectionChange(value);
    }
  };

  const handleUpgradeClick = () => {
    if (onUpgrade) {
      onUpgrade();
    }
    // Auto-scroll to Bedrock section
    if (bedrockSectionRef?.current) {
      bedrockSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-center">
        <Label className="text-sm font-medium bg-yellow-100 text-black ">
          AI Coaches
        </Label>
        {tier !== "premium" && (
          <div className="mt-1">
            <Badge variant="default" className="text-xs bg-blue-600 text-white">
              {tier === "free" ? "Connect for AI" : "Upgrade for more"}
            </Badge>
          </div>
        )}
      </div>

      <ToggleGroup
        type="multiple"
        variant="outline"
        value={selectedCoaches}
        onValueChange={handleSelectionChange}
        className="justify-center gap-2"
        disabled={disabled}
      >
        {coachOptions.map((coach) => {
          const isDisabled = coach.isPremium && !canSelectMultiple;
          const isSelected = selectedCoaches.includes(coach.model);

          return (
            <ToggleGroupItem
              key={coach.model}
              value={coach.model}
              aria-label={`Toggle ${coach.name}`}
              disabled={disabled || isDisabled}
              className={cn(
                "flex items-center gap-2 px-4 py-2 transition-all",
                isDisabled &&
                  "opacity-50 cursor-not-allowed bg-gray-100 text-gray-800",
                isSelected &&
                  !isDisabled &&
                  "bg-primary text-primary-foreground"
              )}
            >
              <span className="text-sm">{coach.emoji}</span>
              <span className="text-sm font-medium">{coach.name}</span>
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>

      {showDisabled && tier === "connected" && onUpgrade && (
        <div className="text-center">
          <button
            onClick={handleUpgradeClick}
            className="text-xs bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded-full transition-colors"
          >
            Unlock all AI coaches for $0.05
          </button>
        </div>
      )}
    </div>
  );
}
