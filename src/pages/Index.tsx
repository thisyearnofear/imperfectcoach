
import { useState } from "react";
import Header from "@/components/Header";
import VideoFeed from "@/components/VideoFeed";
import ExerciseSelector from "@/components/ExerciseSelector";
import CoachFeedback from "@/components/CoachFeedback";
import { Button } from "@/components/ui/button";
import { Bug } from "lucide-react";
import DebugPanel, { PoseData } from "@/components/DebugPanel";

const Index = () => {
  const [reps, setReps] = useState(0);
  const [formFeedback, setFormFeedback] = useState(
    "Enable your camera and select an exercise to begin. Let's see what you've got!"
  );
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [poseData, setPoseData] = useState<PoseData | null>(null);
  const [formScore, setFormScore] = useState(100);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
          {/* Left Panel: Video and Controls */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <VideoFeed
              onRepCount={setReps}
              onFormFeedback={setFormFeedback}
              isDebugMode={isDebugMode}
              onPoseData={setPoseData}
              onFormScoreUpdate={setFormScore}
            />
            <div className="flex justify-between items-center">
              <ExerciseSelector />
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

          {/* Right Panel: Coach Feedback & Stats */}
          <div className="lg:col-span-1">
            <CoachFeedback reps={reps} formFeedback={formFeedback} formScore={formScore} />
            {isDebugMode && <DebugPanel poseData={poseData} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
