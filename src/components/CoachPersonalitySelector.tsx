
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles } from "lucide-react";
import { CoachPersonality } from "@/lib/types";

interface CoachPersonalitySelectorProps {
  selectedPersonality: CoachPersonality;
  onPersonalityChange: (personality: CoachPersonality) => void;
}

const CoachPersonalitySelector = ({ selectedPersonality, onPersonalityChange }: CoachPersonalitySelectorProps) => {
  return (
    <div className="flex items-center gap-2">
      <Sparkles className="h-5 w-5 text-primary" />
      <Select value={selectedPersonality} onValueChange={(value) => onPersonalityChange(value as CoachPersonality)}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Coach Personality" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="competitive">Competitive Coach</SelectItem>
          <SelectItem value="supportive">Supportive Coach</SelectItem>
          <SelectItem value="zen">Zen Sensei</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default CoachPersonalitySelector;
