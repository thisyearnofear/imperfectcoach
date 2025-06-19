import {
  Exercise,
  CoachPersonality,
  WorkoutMode,
  HeightUnit,
} from "@/lib/types";
import SettingsStatusBar from "@/components/SettingsStatusBar";
import SettingsModal from "@/components/SettingsModal";
import { WalletConnect } from "@/components/WalletConnect";

interface HeaderProps {
  exercise: Exercise;
  coachPersonality: CoachPersonality;
  isAudioFeedbackEnabled: boolean;
  isRecordingEnabled: boolean;
  workoutMode: WorkoutMode;
  heightUnit: HeightUnit;
  // Desktop settings modal props
  isHighContrast?: boolean;
  onHighContrastChange?: (enabled: boolean) => void;
  onAudioFeedbackChange?: (enabled: boolean) => void;
  onRecordingChange?: (enabled: boolean) => void;
  isDebugMode?: boolean;
  onDebugChange?: (enabled: boolean) => void;
}

const Header = ({
  exercise,
  coachPersonality,
  isAudioFeedbackEnabled,
  isRecordingEnabled,
  workoutMode,
  heightUnit,
  isHighContrast = false,
  onHighContrastChange = () => {},
  onAudioFeedbackChange = () => {},
  onRecordingChange = () => {},
  isDebugMode = false,
  onDebugChange = () => {},
}: HeaderProps) => {
  return (
    <header className="p-4 border-b border-border/40">
      <div className="container mx-auto flex justify-between items-center gap-2 md:gap-4">
        <h1 className="text-2xl font-bold text-primary shrink-0">
          <span className="hidden sm:inline">Imperfect Coach</span>
          <span className="sm:hidden">IC</span>
        </h1>

        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <div className="hidden md:block">
            <SettingsStatusBar
              exercise={exercise}
              coachPersonality={coachPersonality}
              isAudioFeedbackEnabled={isAudioFeedbackEnabled}
              isRecordingEnabled={isRecordingEnabled}
              workoutMode={workoutMode}
              heightUnit={heightUnit}
            />
          </div>

          <div className="flex items-center gap-1 md:gap-2 min-w-0">
            {/* Wallet Connection */}
            <WalletConnect compact />

            {/* Desktop Settings Modal */}
            <div className="hidden lg:block">
              <SettingsModal
                isHighContrast={isHighContrast}
                onHighContrastChange={onHighContrastChange}
                isAudioFeedbackEnabled={isAudioFeedbackEnabled}
                onAudioFeedbackChange={onAudioFeedbackChange}
                isRecordingEnabled={isRecordingEnabled}
                onRecordingChange={onRecordingChange}
                isDebugMode={isDebugMode}
                onDebugChange={onDebugChange}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
