import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles } from "lucide-react";
import { CoachPersonality } from "@/lib/types";
import { COACH_PERSONALITIES } from "@/lib/coachPersonalities";

interface CoachPersonalitySelectorProps {
  selectedPersonality: CoachPersonality;
  onPersonalityChange: (personality: CoachPersonality) => void;
}

const CoachPersonalitySelector = ({
  selectedPersonality,
  onPersonalityChange,
}: CoachPersonalitySelectorProps) => {
  const selectedCoach = COACH_PERSONALITIES[selectedPersonality];

  return (
    <div className="flex items-center gap-2">
      <Sparkles className="h-5 w-5 text-primary" />
      <Select
        value={selectedPersonality}
        onValueChange={(value) =>
          onPersonalityChange(value as CoachPersonality)
        }
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Choose your coach">
            {selectedCoach && (
              <span className="flex items-center gap-2">
                <span>{selectedCoach.emoji}</span>
                <span>{selectedCoach.name}</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.values(COACH_PERSONALITIES).map((coach) => (
            <SelectItem key={coach.personality} value={coach.personality}>
              <div className="flex items-center gap-2">
                <span>{coach.emoji}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{coach.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {coach.description}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CoachPersonalitySelector;
