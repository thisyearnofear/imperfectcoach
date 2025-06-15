
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { CoachModel } from "@/lib/types"
import { Label } from "@/components/ui/label";

interface CoachSummarySelectorProps {
  selectedCoaches: CoachModel[];
  onSelectionChange: (coaches: CoachModel[]) => void;
  disabled: boolean;
}

const coachOptions: { model: CoachModel; name: string }[] = [
  { model: 'gemini', name: 'Gemini' },
  { model: 'openai', name: 'OpenAI' },
  { model: 'anthropic', name: 'Anthropic' },
];

export function CoachSummarySelector({ selectedCoaches, onSelectionChange, disabled }: CoachSummarySelectorProps) {
  return (
    <div className="space-y-2">
       <Label>Select AI Coaches for Summary</Label>
        <ToggleGroup
            type="multiple"
            variant="outline"
            value={selectedCoaches}
            onValueChange={(value: CoachModel[]) => {
                if (value) onSelectionChange(value);
            }}
            className="flex-wrap justify-center"
            disabled={disabled}
        >
            {coachOptions.map(coach => (
                 <ToggleGroupItem key={coach.model} value={coach.model} aria-label={`Toggle ${coach.name}`}>
                    {coach.name}
                 </ToggleGroupItem>
            ))}
        </ToggleGroup>
    </div>
  )
}
