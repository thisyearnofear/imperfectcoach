import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import MobileControls from "@/components/MobileControls";
import { useIndexPage } from "@/hooks/useIndexPage";
import { TopSection, BottomSection } from "@/components/sections";

const Index = () => {
  const page = useIndexPage();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col animate-fade-in">
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
      <main className="flex-grow container mx-auto p-4">
        <div ref={page.topRef} className="flex flex-col gap-8">
          {/* Top Section: Hero VideoFeed + Controls */}
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
            coachModel={page.coachModel}
            onCoachModelChange={page.handleCoachModelChange}
          />

          {/* Bottom Section: CoachFeedback + Analytics */}
          <BottomSection
            reps={page.reps}
            formFeedback={page.formFeedback}
            formScore={page.formScore}
            coachModel={page.coachModel}
            workoutMode={page.workoutMode}
            analyticsRef={page.analyticsRef}
            isAnalyticsOpen={page.isAnalyticsOpen}
            setIsAnalyticsOpen={page.setIsAnalyticsOpen}
            selectedCoaches={page.selectedCoaches}
            setSelectedCoaches={page.setSelectedCoaches}
            isWorkoutActive={page.isWorkoutActive}
            isSummaryLoading={page.isSummaryLoading}
            repHistory={page.repHistory}
            exercise={page.selectedExercise}
            sessionDuration={page.sessionDuration}
            repTimings={page.repTimings}
            sessionSummaries={page.sessionSummaries}
            achievements={page.achievements}
            isDebugMode={page.isDebugMode}
            poseData={page.poseData}
            onTryAgain={page.handleTryAgain}
            chatMessages={page.chatMessages}
            isChatLoading={page.isChatLoading}
            onSendMessage={page.handleSendMessage}
          />
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
          coachModel={page.coachModel}
          onCoachModelChange={page.handleCoachModelChange}
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
