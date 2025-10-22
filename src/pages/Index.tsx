import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import MobileControls from "@/components/MobileControls";
import { useIndexPage } from "@/hooks/useIndexPage";
import { TopSection, BottomSection } from "@/components/sections";
import { FadeIn } from "@/components/ui/fade-in";

const Index = () => {
  const page = useIndexPage();
  const [gradientClass, setGradientClass] = useState("dynamic-gradient");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      setGradientClass("dynamic-gradient-warm");
    } else if (hour >= 18 || hour < 6) {
      setGradientClass("dynamic-gradient-cool");
    } else {
      setGradientClass("dynamic-gradient");
    }
  }, []);

  return (
    <div className={`min-h-screen text-foreground flex flex-col animate-fade-in ${gradientClass}`}>
      <FadeIn>
        <Header
          exercise={page.selectedExercise}
          coachPersonality={page.coachPersonality}
          isAudioFeedbackEnabled={page.isAudioFeedbackEnabled}
          isRecordingEnabled={page.isRecordingEnabled}
          workoutMode={page.workoutMode}
          heightUnit={page.heightUnit}
          isHighContrast={page.isHighContrast}
          onHighContrastChange={page.setIsHighContrast}
          onAudioFeedbackChange={page.setIsAudioFeedbackEnabled}
          onRecordingChange={page.setIsRecordingEnabled}
          isDebugMode={page.isDebugMode}
          onDebugChange={page.setIsDebugMode}
        />
      </FadeIn>
      <main className="flex-grow container mx-auto p-4">
        <div ref={page.topRef} className="flex flex-col gap-8">
          {/* Top Section: Hero VideoFeed + Controls */}
          <FadeIn direction="up" delay={0.2}>
            <TopSection
              exercise={page.selectedExercise}
              onRepCount={page.setReps}
              onFormFeedback={page.setFormFeedback}
              isDebugMode={page.isDebugMode}
              onPoseData={page.setPoseData}
              onFormScoreUpdate={page.setFormScore}
              onNewRepData={page.handleNewRepData}
              coachPersonality={page.coachPersonality}
              isRecordingEnabled={page.isRecordingEnabled}
              workoutMode={page.workoutMode}
              isWorkoutActive={page.isWorkoutActive}
              timeLeft={page.timeLeft}
              onSessionEnd={page.endSession}
              onSessionReset={page.resetSession}
              heightUnit={page.heightUnit}
              reps={page.reps}
              formScore={page.formScore}
              formFeedback={page.formFeedback}
              onWorkoutModeChange={page.handleWorkoutModeChange}
              onExerciseChange={page.handleExerciseChange}
              onCoachPersonalityChange={page.setCoachPersonality}
            />
          </FadeIn>

          {/* Bottom Section: Streamlined Post-Workout Flow */}
          <FadeIn direction="up" delay={0.4}>
            <BottomSection
              reps={page.reps}
              formScore={page.formScore}
              repHistory={page.repHistory}
              exercise={page.selectedExercise}
              isDebugMode={page.isDebugMode}
              poseData={page.poseData}
              isWorkoutActive={page.isWorkoutActive}
              hasWorkoutEnded={page.sessionHasConcluded}
              sessionDuration={page.sessionDuration}
              coachPersonality={page.coachPersonality}
            />
          </FadeIn>
        </div>
      </main>
      <div className="lg:hidden">
        <Button
          size="icon"
          className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50 animate-fade-in"
          onClick={() => page.setIsMobileSettingsOpen(true)}
        >
          <Settings className="h-6 w-6" />
        </Button>
        <MobileControls
          open={page.isMobileSettingsOpen}
          onOpenChange={page.setIsMobileSettingsOpen}
          workoutMode={page.workoutMode}
          onModeChange={page.handleWorkoutModeChange}
          selectedExercise={page.selectedExercise}
          onExerciseChange={page.handleExerciseChange}
          selectedPersonality={page.coachPersonality}
          onPersonalityChange={page.setCoachPersonality}
          isRecordingEnabled={page.isRecordingEnabled}
          onRecordingChange={page.setIsRecordingEnabled}
          isDebugMode={page.isDebugMode}
          onDebugChange={page.setIsDebugMode}
          isAudioFeedbackEnabled={page.isAudioFeedbackEnabled}
          onAudioFeedbackChange={page.setIsAudioFeedbackEnabled}
          isHighContrast={page.isHighContrast}
          onHighContrastChange={page.setIsHighContrast}
        />
      </div>
    </div>
  );
};

export default Index;
