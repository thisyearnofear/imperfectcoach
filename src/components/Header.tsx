
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CoachModel, Exercise, CoachPersonality, WorkoutMode, HeightUnit } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import SettingsStatusBar from "@/components/SettingsStatusBar";

interface HeaderProps {
  coachModel: CoachModel;
  onCoachModelChange: (model: CoachModel) => void;
  onSettingsClick: () => void;
  exercise: Exercise;
  coachPersonality: CoachPersonality;
  isAudioFeedbackEnabled: boolean;
  isRecordingEnabled: boolean;
  workoutMode: WorkoutMode;
  heightUnit: HeightUnit;
}

const Header = ({ 
  coachModel, 
  onCoachModelChange, 
  onSettingsClick,
  exercise,
  coachPersonality,
  isAudioFeedbackEnabled,
  isRecordingEnabled,
  workoutMode,
  heightUnit,
}: HeaderProps) => {
  return (
    <header className="p-4 border-b border-border/40">
      <div className="container mx-auto flex justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-primary shrink-0">Imperfect Coach</h1>
        
        <div className="flex items-center gap-4">
          <SettingsStatusBar
            exercise={exercise}
            coachPersonality={coachPersonality}
            isAudioFeedbackEnabled={isAudioFeedbackEnabled}
            isRecordingEnabled={isRecordingEnabled}
            workoutMode={workoutMode}
            heightUnit={heightUnit}
          />
          
          <div className="flex items-center gap-2">
            <div className="w-full max-w-[150px] sm:max-w-[200px]">
              <Select value={coachModel} onValueChange={onCoachModelChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Coach" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Coach Gemini</SelectItem>
                  <SelectItem value="openai">Coach OpenAI</SelectItem>
                  <SelectItem value="anthropic">Coach Anthropic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={onSettingsClick} className="lg:hidden">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
