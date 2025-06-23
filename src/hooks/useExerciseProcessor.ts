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
import { processJumps } from "@/lib/exercise-processors/jumpProcessor";
import { useAIFeedback } from "./useAIFeedback";
import { useExerciseState } from "./useExerciseState";
// Old readiness functions removed - now using PoseReadinessSystem
import { handleProcessorResult } from "@/lib/processorResultHandler";
import { JumpDetector, EnhancedJumpDetector } from "@/lib/jumpDetector";
import {
  PoseReadinessSystem,
  ReadinessConfig,
} from "@/lib/pose-readiness/ReadinessSystem";

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
    coachPersonality,
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
  const jumpCalibrationData = useRef<{
    calibrationProgress: number;
    isStable: boolean;
    kneeAngle: number;
    minKneeAngle: number;
    isCalibrating: boolean;
  } | null>(null);
  const jumpDetector = useRef(new JumpDetector(10, 1.8, 0.3));
  const enhancedJumpDetector = useRef(new EnhancedJumpDetector());
  const jumpData = useRef<{ y: number; time: number }[]>([]);
  const flightData = useRef<{ shoulderX: number; hipX: number }[]>([]);
  const lastJumpTime = useRef<number>(0);

  // High-quality readiness system
  const readinessSystem = useRef(
    new PoseReadinessSystem({
      exercise,
      adaptiveThresholds: true,
      strictMode: workoutMode === "assessment",
      stabilityFrames: workoutMode === "assessment" ? 15 : 8,
    })
  );

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

      // Use high-quality readiness system when workout is not active
      if (!isWorkoutActive) {
        const readinessScore = readinessSystem.current.analyzePoseReadiness(
          keypoints,
          videoDimensions
        );

        // Update parent component with readiness score for better UI
        if (onReadinessUpdate) {
          onReadinessUpdate(readinessScore);
        }

        // Use progressive feedback instead of binary ready/not-ready
        onFormFeedback(readinessScore.feedback);

        if (isDebugMode) onPoseData({ keypoints });

        // Allow workout to start when readiness is sufficient
        if (!readinessScore.canProceed) {
          return; // Don't process exercise until user is ready
        }

        // Reset detectors when user becomes ready
        if (exercise === "jumps") {
          enhancedJumpDetector.current.reset();
        }
        readinessSystem.current.reset();
      }

      switch (exercise) {
        case "pull-ups":
          result = processPullups({
            keypoints,
            repState: repState.current,
            internalReps,
            lastRepIssues: lastRepIssues.current,
          });
          break;

        case "jumps": {
          // Simplified jump detection using direct ankle height
          const leftAnkle = keypoints.find((k) => k.name === "left_ankle");
          const rightAnkle = keypoints.find((k) => k.name === "right_ankle");

          if (leftAnkle?.score > 0.5 && rightAnkle?.score > 0.5) {
            // Set ground level if not established
            if (!jumpGroundLevel.current) {
              jumpGroundLevel.current = (leftAnkle.y + rightAnkle.y) / 2;
            }

            // Collect jump data for analytics
            const leftShoulder = keypoints.find(
              (k) => k.name === "left_shoulder"
            );
            const rightShoulder = keypoints.find(
              (k) => k.name === "right_shoulder"
            );
            const leftHip = keypoints.find((k) => k.name === "left_hip");
            const rightHip = keypoints.find((k) => k.name === "right_hip");

            if (
              leftShoulder?.score > 0.3 &&
              rightShoulder?.score > 0.3 &&
              leftHip?.score > 0.3 &&
              rightHip?.score > 0.3
            ) {
              const torsoY =
                (leftShoulder.y + rightShoulder.y + leftHip.y + rightHip.y) / 4;
              jumpData.current.push({ y: torsoY, time: Date.now() });

              // Track airborne position data
              const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;
              const isAirborne = avgAnkleY < jumpGroundLevel.current - 30;

              if (isAirborne) {
                flightData.current.push({
                  shoulderX: (leftShoulder.x + rightShoulder.x) / 2,
                  hipX: (leftHip.x + rightHip.x) / 2,
                });

                // Track peak airborne position
                peakAirborneY.current = Math.min(
                  peakAirborneY.current ?? avgAnkleY,
                  avgAnkleY
                );
              }
            }

            // Process jumps with simplified logic
            result = processJumps({
              keypoints,
              repState: repState.current,
              internalReps,
              lastRepIssues: lastRepIssues.current,
              jumpGroundLevel: jumpGroundLevel.current,
              peakAirborneY: peakAirborneY.current,
              jumpData: jumpData.current,
              flightData: flightData.current,
            });

            // Reset jump data after rep completion
            if (result?.isRepCompleted) {
              jumpData.current = [];
              flightData.current = [];
              peakAirborneY.current = null;
            }
          } else {
            // Return feedback when ankles not visible
            result = {
              poseData: { keypoints },
              isRepCompleted: false,
              feedback: "Make sure your feet are visible in the camera!",
            };
          }
          break;
        }
      }

      if (result) {
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
        // The new readiness system above already handles this case
        // No need for additional feedback here
        if (isDebugMode) onPoseData({ keypoints });
      }
    },
    [
      isWorkoutActive,
      exercise,
      workoutMode,
      coachPersonality,
      isDebugMode,
      onFormFeedback,
      onFormScoreUpdate,
      onNewRepData,
      onPoseData,
      onReadinessUpdate,
      speak,
      getAIFeedback,
      repState,
      internalReps,
      lastRepIssues,
      repScores,
      jumpGroundLevel,
      peakAirborneY,
      currentRepAngles,
      calibrationFrames,
      incrementReps,
    ]
  );

  const avgScore =
    repScores.current.length > 0
      ? repScores.current.reduce((a, b) => a + b, 0) / repScores.current.length
      : 100;

  return {
    processPose,
    formIssuePulse: formIssuePulse.current,
    avgScore,
    currentJumpHeight: currentJumpHeight.current,
    jumpGroundLevel: jumpGroundLevel.current,
    jumpCalibrationData: jumpCalibrationData.current,
  };
};
