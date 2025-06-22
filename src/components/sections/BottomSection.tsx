import React from "react";
import { PostWorkoutFlow } from "@/components/PostWorkoutFlow";
import DebugPanel from "@/components/DebugPanel";
import { Exercise, RepData, PoseData } from "@/lib/types";

interface BottomSectionProps {
  reps: number;
  formScore: number;
  repHistory: RepData[];
  exercise: Exercise;
  isDebugMode: boolean;
  poseData: PoseData | null;
}

export const BottomSection = ({
  reps,
  formScore,
  repHistory,
  exercise,
  isDebugMode,
  poseData,
}: BottomSectionProps) => {
  return (
    <div className="w-full">
      <div className="flex flex-col gap-6">
        {/* Streamlined Post-Workout Flow */}
        <PostWorkoutFlow
          exercise={exercise}
          reps={reps}
          repHistory={repHistory}
          averageFormScore={formScore}
        />

        {/* Debug Panel */}
        {isDebugMode && <DebugPanel poseData={poseData} />}
      </div>
    </div>
  );
};
