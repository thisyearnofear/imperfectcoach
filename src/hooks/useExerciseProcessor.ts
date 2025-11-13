import { useRef, useCallback } from "react";
import * as posedetection from "@tensorflow-models/pose-detection";
import {
  Exercise,
  PoseData,
  RepData,
  CoachPersonality,
  WorkoutMode,
  ProcessorResult,
} from "@/lib/types";
import { useAudioFeedback } from "./useAudioFeedback";
import { processPullups } from "@/lib/exercise-processors/pullupProcessor";
import { processJumpsEnhanced, createJumpState } from "@/lib/exercise-processors/enhancedJumpProcessor";
import { useAIFeedback } from "./useAIFeedback";
import { useExerciseState } from "./useExerciseState";
import { handleProcessorResult } from "@/lib/processorResultHandler";
import { mapPersonalityToLegacy } from "@/lib/coachPersonalities";

interface UseExerciseProcessorProps {
  exercise: Exercise;
  workoutMode: WorkoutMode;
  onRepCount: (count: (prevCount: number) => number) => void;
  onFormFeedback: (message: string) => void;
  onFormScoreUpdate: (score: number) => void;
  onNewRepData: (data: RepData) => void;
  coachPersonality: CoachPersonality;
  isDebugMode: boolean;
  onPoseData: (data: PoseData | null) => void;
  isWorkoutActive: boolean;
  onReadinessUpdate?: (readinessScore: {
    score: number;
    feedback: string;
    canProceed: boolean;
  }) => void;
}

export const useExerciseProcessor = ({
  exercise,
  workoutMode,
  onRepCount,
  onFormFeedback,
  onFormScoreUpdate,
  onNewRepData,
  coachPersonality,
  isDebugMode,
  onPoseData,
  isWorkoutActive,
  onReadinessUpdate,
}: UseExerciseProcessorProps) => {
  const { speak } = useAudioFeedback();
  const { getAIFeedback } = useAIFeedback({
    exercise,
    coachPersonality: mapPersonalityToLegacy(coachPersonality),
    workoutMode,
    onFormFeedback,
  });

  const {
    repState,
    internalReps,
    lastRepIssues,
    repScores,
    jumpGroundLevel,
    peakAirborneY,
    currentRepAngles,
    calibrationFrames,
    incrementReps,
  } = useExerciseState({ exercise, onRepCount });

  const formIssuePulse = useRef(false);
  const pulseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentJumpHeight = useRef(0);
  
  // AGGRESSIVE CONSOLIDATION: Single jump state replaces multiple tracking systems
  const jumpState = useRef(createJumpState());
  
  // CLEAN: Simple pose validation without complex readiness system
  const validateBasicPose = useCallback((keypoints: posedetection.Keypoint[]) => {
    const requiredPoints = exercise === 'jumps' 
      ? ['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle']
      : ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist'];
    
    const visibleCount = requiredPoints.filter(name => {
      const point = keypoints.find(k => k.name === name);
      return point && point.score > 0.4;
    }).length;
    
    const readinessScore = (visibleCount / requiredPoints.length) * 100;
    const canProceed = readinessScore >= 70; // Simple threshold
    
    let feedback = '';
    if (readinessScore < 40) {
      feedback = 'Make sure your full body is visible in the camera.';
    } else if (readinessScore < 70) {
      feedback = 'Almost ready - adjust your position slightly.';
    } else {
      feedback = exercise === 'jumps' ? 'Ready to jump!' : 'Ready for pull-ups!';
    }
    
    return { score: readinessScore, feedback, canProceed };
  }, [exercise]);

  const processPose = useCallback(
    (
      pose: posedetection.Pose | null,
      videoDimensions: { width: number; height: number }
    ) => {
      if (!pose) {
        if (!isWorkoutActive) {
          onFormFeedback(
            "I can't see you. Please step in front of the camera and make sure you're well-lit."
          );
        }
        if (isDebugMode) onPoseData(null);
        return;
      }

      const { keypoints, score } = pose;

      if (score < 0.4) {
        onFormFeedback(
          "I'm having trouble seeing you clearly. Try improving the lighting or adjusting your camera angle."
        );
        if (isDebugMode) onPoseData({ keypoints });
        return;
      }

      let result:
        | (Omit<ProcessorResult, "feedback"> & { feedback?: string })
        | null = null;

      // CLEAN: Simple pose validation when workout is not active
      if (!isWorkoutActive) {
        const readinessScore = validateBasicPose(keypoints);
        
        if (onReadinessUpdate) {
          onReadinessUpdate(readinessScore);
        }

        onFormFeedback(readinessScore.feedback);

        if (isDebugMode) onPoseData({ keypoints });

        if (!readinessScore.canProceed) {
          return;
        }
      }

      // ENHANCEMENT FIRST: Process exercises with improved logic
      switch (exercise) {
        case "pull-ups":
          result = processPullups({
            keypoints,
            repState: repState.current,
            internalReps,
            lastRepIssues: lastRepIssues.current,
          });
          break;

        case "jumps":
          // AGGRESSIVE CONSOLIDATION: Single enhanced processor
          result = processJumpsEnhanced({
            keypoints,
            repState: repState.current,
            internalReps,
            lastRepIssues: lastRepIssues.current,
            jumpState: jumpState.current,
          });
          
          // Update jump height for display
          if (jumpState.current.isCalibrated && jumpState.current.groundLevel) {
            const leftAnkle = keypoints.find(k => k.name === 'left_ankle');
            const rightAnkle = keypoints.find(k => k.name === 'right_ankle');
            if (leftAnkle?.score > 0.4 && rightAnkle?.score > 0.4) {
              const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;
              currentJumpHeight.current = Math.max(0, jumpState.current.groundLevel - avgAnkleY);
            }
          }
          break;
      }

      if (result) {
        // Update jump state if returned by processor
        if ('jumpState' in result && result.jumpState) {
          jumpState.current = result.jumpState;
        }

        if (exercise === "pull-ups") {
          if (result.newRepState === "UP" && repState.current !== "UP") {
            currentRepAngles.current = { left: [], right: [] };
          }
          if (
            (repState.current === "UP" || result.newRepState === "UP") &&
            result.poseData.leftElbowAngle &&
            result.poseData.rightElbowAngle
          ) {
            currentRepAngles.current.left.push(result.poseData.leftElbowAngle);
            currentRepAngles.current.right.push(
              result.poseData.rightElbowAngle
            );
          }
        }

        handleProcessorResult({
          result,
          workoutMode,
          isDebugMode,
          onPoseData,
          repState,
          onFormFeedback,
          speak,
          lastRepIssues,
          formIssuePulse,
          pulseTimeout,
          getAIFeedback,
          incrementReps,
          internalReps,
          onFormScoreUpdate,
          repScores,
          onNewRepData,
          currentRepAngles,
          exercise,
          peakAirborneY,
        });
      } else if (!isWorkoutActive) {
        if (isDebugMode) onPoseData({ keypoints });
      }
    },
    [
      isWorkoutActive,
      exercise,
      workoutMode,
      isDebugMode,
      onFormFeedback,
      onFormScoreUpdate,
      onNewRepData,
      onPoseData,
      onReadinessUpdate,
      validateBasicPose,
      speak,
      getAIFeedback,
      repState,
      internalReps,
      lastRepIssues,
      repScores,
      currentRepAngles,
      peakAirborneY,
      incrementReps,
    ]
  );

  return {
    processPose,
    formIssuePulse: formIssuePulse.current,
    avgScore: repScores.current.length > 0 
      ? repScores.current.reduce((a, b) => a + b, 0) / repScores.current.length 
      : 0,
    currentJumpHeight: currentJumpHeight.current,
    jumpGroundLevel: jumpState.current.groundLevel,
    jumpCalibrationData: jumpState.current.isCalibrated ? null : {
      calibrationProgress: 0,
      isStable: true,
      kneeAngle: 0,
      minKneeAngle: 130,
      isCalibrating: !jumpState.current.isCalibrated,
    },
  };
};
