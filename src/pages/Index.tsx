
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import VideoFeed from "@/components/VideoFeed";
import ExerciseSelector from "@/components/ExerciseSelector";
import CoachFeedback from "@/components/CoachFeedback";
import { Button } from "@/components/ui/button";
import { Bug, BarChart2 as AnalyticsIcon } from "lucide-react";
import DebugPanel from "@/components/DebugPanel";
import { Exercise, RepData, PoseData } from "@/lib/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import PerformanceAnalytics from "@/components/PerformanceAnalytics";


const Index = () => {
  const [selectedExercise, setSelectedExercise] = useState<Exercise>("pull-ups");
  const [reps, setReps] = useState(0);
  const [formFeedback, setFormFeedback] = useState(
    "Enable your camera and select an exercise to begin. Let's see what you've got!"
  );
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [poseData, setPoseData] = useState<PoseData | null>(null);
  const [formScore, setFormScore] = useState(100);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [repHistory, setRepHistory] = useState<RepData[]>([]);

  const handleExerciseChange = (exercise: Exercise) => {
    if (exercise !== selectedExercise) {
      setSelectedExercise(exercise);
      // Reset stats for the new session
      setReps(0);
      setFormFeedback(`Switched to ${exercise}. Let's get to it!`);
      setFormScore(100);
      setSessionStart(null);
      setRepHistory([]);
      setPoseData(null);
    }
  };

  const handleNewRepData = (data: RepData) => {
    if (!sessionStart) {
      setSessionStart(Date.now() - 2000); // Start timer on first rep (with a small buffer)
    }
    setRepHistory((prev) => [...prev, data]);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
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
            />
            <div className="flex justify-between items-center">
              <ExerciseSelector 
                selectedExercise={selectedExercise}
                onExerciseChange={handleExerciseChange}
              />
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
          <div className="lg:col-span-1 flex flex-col gap-4">
            <CoachFeedback reps={reps} formFeedback={formFeedback} formScore={formScore} />
            
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <AnalyticsIcon className="mr-2 h-4 w-4" />
                  Show Performance Analytics
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <PerformanceAnalytics
                  repHistory={repHistory}
                  sessionStart={sessionStart}
                  totalReps={reps}
                  averageFormScore={formScore}
                />
              </CollapsibleContent>
            </Collapsible>
            
            {isDebugMode && <DebugPanel poseData={poseData} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
