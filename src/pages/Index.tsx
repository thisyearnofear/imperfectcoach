import { useState, useEffect } from "react";
import Header from "@/components/Header";
import VideoFeed from "@/components/VideoFeed";
import ExerciseSelector from "@/components/ExerciseSelector";
import CoachFeedback from "@/components/CoachFeedback";
import { Button } from "@/components/ui/button";
import { Bug, BarChart2 as AnalyticsIcon, Settings, Timer } from "lucide-react";
import DebugPanel from "@/components/DebugPanel";
import { Exercise, RepData, PoseData, CoachPersonality, CoachModel, WorkoutMode } from "@/lib/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import PerformanceAnalytics from "@/components/PerformanceAnalytics";
import CoachPersonalitySelector from "@/components/CoachPersonalitySelector";
import WorkoutModeSelector from "@/components/WorkoutModeSelector";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAchievements } from "@/hooks/useAchievements";
import UnlockedAchievements from "@/components/UnlockedAchievements";
import MobileControls from "@/components/MobileControls";
import { useAudioFeedback } from "@/hooks/useAudioFeedback";
import { ThemeToggle } from "@/components/ThemeToggle";

const WORKOUT_DURATION = 120; // 2 minutes in seconds

const Index = () => {
  const [selectedExercise, setSelectedExercise] = useState<Exercise>("pull-ups");
  const [reps, setReps] = useState(0);
  const [formFeedback, setFormFeedback] = useState(
    "Enable your camera and select an exercise to begin. Let's see what you've got!"
  );
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [isRecordingEnabled, setIsRecordingEnabled] = useState(false);
  const [poseData, setPoseData] = useState<PoseData | null>(null);
  const [formScore, setFormScore] = useState(100);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [repHistory, setRepHistory] = useState<RepData[]>([]);
  const [coachPersonality, setCoachPersonality] = useState<CoachPersonality>("competitive");
  const [coachModel, setCoachModel] = useState<CoachModel>('gemini');
  const [workoutMode, setWorkoutMode] = useState<WorkoutMode>('training');
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false);
  const [isAudioFeedbackEnabled, setIsAudioFeedbackEnabled] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WORKOUT_DURATION);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);

  const { achievements } = useAchievements(reps, repHistory, formScore);
  const { speak } = useAudioFeedback();

  useEffect(() => {
    if (isAudioFeedbackEnabled && formFeedback) {
      if (formFeedback.includes("Enable your camera") || formFeedback.includes("Model loaded")) return;
      speak(formFeedback);
    }
  }, [formFeedback, isAudioFeedbackEnabled, speak]);
  
  useEffect(() => {
    if (!isWorkoutActive || timeLeft <= 0) {
      if (isWorkoutActive && timeLeft <= 0) {
        setFormFeedback("Time's up! Great session!");
        setIsWorkoutActive(false);
      }
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isWorkoutActive, timeLeft, setFormFeedback]);

  useEffect(() => {
    const root = document.documentElement;
    if (isHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  const resetSession = () => {
    setReps(0);
    setFormScore(100);
    setSessionStart(null);
    setRepHistory([]);
    setPoseData(null);
    setIsWorkoutActive(false);
    setTimeLeft(WORKOUT_DURATION);
  }

  const handleExerciseChange = (exercise: Exercise) => {
    if (exercise !== selectedExercise) {
      setSelectedExercise(exercise);
      resetSession();
      let initialFeedback = `Switched to ${exercise}. Let's get to it!`;
      if (exercise === 'pull-ups') {
          initialFeedback = "To begin, hang from the bar with arms fully extended.";
      } else if (exercise === 'jumps') {
          initialFeedback = "To begin, stand still in full view of the camera.";
      }
      setFormFeedback(initialFeedback);
    }
  };

  const handleWorkoutModeChange = (mode: WorkoutMode) => {
    if (mode === workoutMode) return;

    setWorkoutMode(mode);
    resetSession();
    
    let initialFeedback;
    if (mode === 'assessment') {
        initialFeedback = "Assessment mode: Your form will be scored without coaching.";
    } else {
        if (selectedExercise === 'pull-ups') {
            initialFeedback = "To begin, hang from the bar with arms fully extended.";
        } else if (selectedExercise === 'jumps') {
            initialFeedback = "To begin, stand still in full view of the camera.";
        } else {
            initialFeedback = `Training mode: Switched to ${selectedExercise}. Let's get to it!`;
        }
    }
    setFormFeedback(initialFeedback);
  };

  const handleNewRepData = (data: RepData) => {
    if (!sessionStart) {
      setSessionStart(Date.now() - 2000); // Start timer on first rep (with a small buffer)
    }
    if (!isWorkoutActive) {
      setIsWorkoutActive(true);
      setTimeLeft(WORKOUT_DURATION);
    }
    setRepHistory((prev) => [...prev, data]);
  };

  const handleCoachModelChange = (model: CoachModel) => {
    setCoachModel(model);
    const modelName = model.charAt(0).toUpperCase() + model.slice(1);
    setFormFeedback(`Switched to Coach ${modelName}. Ready when you are!`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col animate-fade-in">
      <Header coachModel={coachModel} onCoachModelChange={handleCoachModelChange} onSettingsClick={() => setIsMobileSettingsOpen(true)} />
      <main className="flex-grow container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
          {/* Left Panel: Video and Controls */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <VideoFeed
              exercise={selectedExercise}
              onRepCount={setReps}
              onFormFeedback={setFormFeedback}
              isDebugMode={isDebugMode}
              onPoseData={setPoseData}
              onFormScoreUpdate={setFormScore}
              onNewRepData={handleNewRepData}
              coachPersonality={coachPersonality}
              isRecordingEnabled={isRecordingEnabled}
              workoutMode={workoutMode}
              isWorkoutActive={isWorkoutActive}
            />
            {/* Mobile-only coach feedback */}
            <div className="lg:hidden">
                <CoachFeedback reps={reps} formFeedback={formFeedback} formScore={formScore} coachModel={coachModel} workoutMode={workoutMode} timeLeft={timeLeft} isWorkoutActive={isWorkoutActive} />
            </div>
            
            {/* Desktop-only controls */}
            <div className="hidden lg:flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <WorkoutModeSelector
                  selectedMode={workoutMode}
                  onModeChange={handleWorkoutModeChange}
                />
                <ExerciseSelector 
                  selectedExercise={selectedExercise}
                  onExerciseChange={handleExerciseChange}
                />
              </div>
              <div className="flex justify-between items-center flex-wrap gap-4 mt-2">
                <CoachPersonalitySelector
                  selectedPersonality={coachPersonality}
                  onPersonalityChange={setCoachPersonality}
                />
                <div className="flex items-center gap-4 mt-2 sm:mt-0 flex-wrap">
                  <ThemeToggle />
                  <div className="flex items-center space-x-2">
                    <Switch id="enable-high-contrast" checked={isHighContrast} onCheckedChange={setIsHighContrast} />
                    <Label htmlFor="enable-high-contrast">High Contrast</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="enable-audio" checked={isAudioFeedbackEnabled} onCheckedChange={setIsAudioFeedbackEnabled} />
                    <Label htmlFor="enable-audio">Audio Feedback</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="enable-recording" checked={isRecordingEnabled} onCheckedChange={setIsRecordingEnabled} />
                    <Label htmlFor="enable-recording">Enable Recording</Label>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDebugMode((prev) => !prev)}
                  >
                    <Bug className="mr-2 h-4 w-4" />
                    {isDebugMode ? "Hide" : "Show"} Debug
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Coach Feedback & Stats */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            {/* Desktop-only coach feedback */}
            <div className="hidden lg:block">
              <CoachFeedback reps={reps} formFeedback={formFeedback} formScore={formScore} coachModel={coachModel} workoutMode={workoutMode} timeLeft={timeLeft} isWorkoutActive={isWorkoutActive} />
            </div>
            
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <AnalyticsIcon className="mr-2 h-4 w-4" />
                  Show Performance &amp; Achievements
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-4 animate-fade-in">
                <PerformanceAnalytics
                  repHistory={repHistory}
                  sessionStart={sessionStart}
                  totalReps={reps}
                  averageFormScore={formScore}
                  exercise={selectedExercise}
                />
                <UnlockedAchievements achievements={achievements} />
              </CollapsibleContent>
            </Collapsible>
            
            {isDebugMode && <DebugPanel poseData={poseData} />}
          </div>
        </div>
      </main>
      <div className="lg:hidden">
        <Button
          size="icon"
          className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50 animate-fade-in"
          onClick={() => setIsMobileSettingsOpen(true)}
        >
          <Settings className="h-6 w-6" />
        </Button>
        <MobileControls
          open={isMobileSettingsOpen}
          onOpenChange={setIsMobileSettingsOpen}
          workoutMode={workoutMode}
          onModeChange={handleWorkoutModeChange}
          selectedExercise={selectedExercise}
          onExerciseChange={handleExerciseChange}
          selectedPersonality={coachPersonality}
          onPersonalityChange={setCoachPersonality}
          isRecordingEnabled={isRecordingEnabled}
          onRecordingChange={setIsRecordingEnabled}
          isDebugMode={isDebugMode}
          onDebugChange={setIsDebugMode}
          isAudioFeedbackEnabled={isAudioFeedbackEnabled}
          onAudioFeedbackChange={setIsAudioFeedbackEnabled}
          isHighContrast={isHighContrast}
          onHighContrastChange={setIsHighContrast}
        />
      </div>
    </div>
  );
};

export default Index;
