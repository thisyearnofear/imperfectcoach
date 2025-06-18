
import { 
  Dumbbell, 
  Speaker, 
  VolumeOff, 
  Video, 
  VideoOff, 
  Zap, 
  Heart, 
  Brain,
  ClipboardCheck,
  Activity,
  Ruler
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Exercise, CoachPersonality, WorkoutMode, HeightUnit } from "@/lib/types";
import { getUnitSymbol } from "@/lib/heightConversion";

interface SettingsStatusBarProps {
  exercise: Exercise;
  coachPersonality: CoachPersonality;
  isAudioFeedbackEnabled: boolean;
  isRecordingEnabled: boolean;
  workoutMode: WorkoutMode;
  heightUnit: HeightUnit;
}

const SettingsStatusBar = ({
  exercise,
  coachPersonality,
  isAudioFeedbackEnabled,
  isRecordingEnabled,
  workoutMode,
  heightUnit,
}: SettingsStatusBarProps) => {
  const getExerciseIcon = () => {
    switch (exercise) {
      case "pull-ups":
        return <Dumbbell className="h-4 w-4" />;
      case "jumps":
        return <Activity className="h-4 w-4" />;
      default:
        return <Dumbbell className="h-4 w-4" />;
    }
  };

  const getCoachIcon = () => {
    switch (coachPersonality) {
      case "competitive":
        return <Zap className="h-4 w-4 text-orange-500" />;
      case "supportive":
        return <Heart className="h-4 w-4 text-pink-500" />;
      case "zen":
        return <Brain className="h-4 w-4 text-purple-500" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getWorkoutModeIcon = () => {
    return workoutMode === "training" ? (
      <Dumbbell className="h-4 w-4 text-blue-500" />
    ) : (
      <ClipboardCheck className="h-4 w-4 text-green-500" />
    );
  };

  return (
    <div className="flex items-center gap-3 bg-background/80 backdrop-blur-sm border rounded-full px-3 py-1.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center text-foreground">
            {getExerciseIcon()}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Exercise: {exercise}</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center">
            {getCoachIcon()}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Coach: {coachPersonality}</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center">
            {getWorkoutModeIcon()}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Mode: {workoutMode}</p>
        </TooltipContent>
      </Tooltip>

      {exercise === 'jumps' && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <Ruler className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-medium text-blue-600">{getUnitSymbol(heightUnit)}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Height unit: {heightUnit}</p>
          </TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center">
            {isAudioFeedbackEnabled ? (
              <Speaker className="h-4 w-4 text-green-500" />
            ) : (
              <VolumeOff className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Audio: {isAudioFeedbackEnabled ? "On" : "Off"}</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center">
            {isRecordingEnabled ? (
              <Video className="h-4 w-4 text-red-500" />
            ) : (
              <VideoOff className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Recording: {isRecordingEnabled ? "On" : "Off"}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default SettingsStatusBar;
