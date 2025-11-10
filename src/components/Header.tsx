import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Exercise,
  CoachPersonality,
  WorkoutMode,
  HeightUnit,
} from "@/lib/types";
import SettingsStatusBar from "@/components/SettingsStatusBar";
import SettingsModal from "@/components/SettingsModal";
import { HeaderWallet } from "@/components/UnifiedWallet";
import { NetworkStatus } from "@/components/NetworkStatus";
import { FeatureSpotlight } from "@/components/FeatureSpotlight";
import { Dumbbell, Activity, Target, Focus, FocusOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import SocialNavigation from "@/components/SocialNavigation";

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
  isFocusMode?: boolean;
  onFocusModeChange?: (enabled: boolean) => void;
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
  isFocusMode = false,
  onFocusModeChange = () => {},
}: HeaderProps) => {
  const [titleIndex, setTitleIndex] = useState(0);
  const [displayedTitle, setDisplayedTitle] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  const titles = [
    { text: "Imperfect Coach", color: "text-primary" },
    { text: "AI Fitness Coach", color: "text-blue-500" },
    { text: "Form Analysis Pro", color: "text-purple-500" }
  ];

  useEffect(() => {
    const currentTitle = titles[titleIndex];
    let timeout: NodeJS.Timeout;

    if (isTyping) {
      if (displayedTitle.length < currentTitle.text.length) {
        timeout = setTimeout(() => {
          setDisplayedTitle(currentTitle.text.slice(0, displayedTitle.length + 1));
        }, 100);
      } else {
        timeout = setTimeout(() => setIsTyping(false), 2000);
      }
    } else {
      if (displayedTitle.length > 0) {
        timeout = setTimeout(() => {
          setDisplayedTitle(displayedTitle.slice(0, -1));
        }, 50);
      } else {
        setTitleIndex((prev) => (prev + 1) % titles.length);
        setIsTyping(true);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayedTitle, isTyping, titleIndex]);

  return (
    <header className="relative p-4 border-b border-border/40 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-5">
        <motion.div
          className="absolute top-2 left-10"
          animate={{
            x: [0, 20, 0],
            y: [0, -10, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Dumbbell className="h-6 w-6 text-primary" />
        </motion.div>
        <motion.div
          className="absolute top-4 right-20"
          animate={{
            x: [0, -15, 0],
            y: [0, 8, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        >
          <Activity className="h-5 w-5 text-primary" />
        </motion.div>
        <motion.div
          className="absolute bottom-2 left-1/3"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear",
            delay: 2,
          }}
        >
          <Target className="h-4 w-4 text-primary" />
        </motion.div>
      </div>

      <div className="container mx-auto flex justify-between items-center gap-2 md:gap-4 relative z-10">
        <motion.h1
          className="text-2xl font-bold shrink-0"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="hidden sm:inline">
            <AnimatePresence mode="wait">
              <motion.span
                key={displayedTitle}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={titles[titleIndex].color}
              >
                {displayedTitle}
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="ml-0.5"
                >
                  |
                </motion.span>
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="sm:hidden">IC</span>
        </motion.h1>

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
            {/* Network Status - Compact */}
            <NetworkStatus variant="compact" showSwitchButton={true} />

            {/* Wallet Connection */}
            <HeaderWallet size="sm" />

            {/* Focus Mode Toggle */}
            <Button
              variant={isFocusMode ? "default" : "outline"}
              size="sm"
              onClick={() => onFocusModeChange(!isFocusMode)}
              className="hidden md:flex"
            >
              {isFocusMode ? (
                <>
                  <Focus className="h-4 w-4 mr-1" />
                  Exit Focus
                </>
              ) : (
                <>
                  <Focus className="h-4 w-4 mr-1" />
                  Focus
                </>
              )}
            </Button>

            {/* Social Navigation */}
            <div className="hidden md:block">
              <SocialNavigation />
            </div>

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

      {/* Feature Spotlight - Compact version for persistent discovery */}
      <motion.div
        className="container mx-auto mt-3 hidden lg:block"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <FeatureSpotlight variant="compact" autoDismiss={true} />
      </motion.div>
    </header>
  );
};

export default Header;
