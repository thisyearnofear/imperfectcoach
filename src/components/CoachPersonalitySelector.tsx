import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles, Volume2, VolumeX } from "lucide-react";
import { CoachPersonality } from "@/lib/types";
import { COACH_PERSONALITIES } from "@/lib/coachPersonalities";

interface CoachPersonalitySelectorProps {
  selectedPersonality: CoachPersonality;
  onPersonalityChange: (personality: CoachPersonality) => void;
  voiceEnabled?: boolean;
  onVoiceToggle?: () => void;
  showAdaptiveInfo?: boolean;
}

const CoachPersonalitySelector = ({
  selectedPersonality,
  onPersonalityChange,
  voiceEnabled = false,
  onVoiceToggle,
  showAdaptiveInfo = false,
}: CoachPersonalitySelectorProps) => {
  const selectedCoach = COACH_PERSONALITIES[selectedPersonality];

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">Coach</h4>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 flex-1">
          <Select
            value={selectedPersonality}
            onValueChange={(value) =>
              onPersonalityChange(value as CoachPersonality)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose your coach">
                {selectedCoach && (
                  <span className="flex items-center gap-2">
                    <span>{selectedCoach.emoji}</span>
                    <span className="text-sm">{selectedCoach.name}</span>
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

        {onVoiceToggle && (
          <div className="flex items-center gap-1">
            <Label htmlFor="voice-toggle" className="text-xs flex items-center gap-1 cursor-pointer">
              {voiceEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
              Voice
            </Label>
            <Switch
              id="voice-toggle"
              checked={voiceEnabled}
              onCheckedChange={onVoiceToggle}
              size="sm"
            />
          </div>
        )}
      </div>

      {showAdaptiveInfo && (
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
          <p>
            <span className="font-medium">{selectedCoach.emoji} {selectedCoach.name}</span> -
            {selectedCoach.description}. Coaching adapts based on your performance!
          </p>
        </div>
      )}
    </div>
  );
};

export default CoachPersonalitySelector;
