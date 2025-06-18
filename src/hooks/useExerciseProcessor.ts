
import { useRef, useCallback } from 'react';
import * as posedetection from '@tensorflow-models/pose-detection';
import { Exercise, PoseData, RepData, CoachPersonality, WorkoutMode, ProcessorResult } from '@/lib/types';
import { useAudioFeedback } from './useAudioFeedback';
import { processPullups } from '@/lib/exercise-processors/pullupProcessor';
import { processJumps } from '@/lib/exercise-processors/jumpProcessor';
import { useAIFeedback } from './useAIFeedback';
import { useExerciseState } from './useExerciseState';
import { getPullupReadyFeedback, getJumpReadyFeedback } from '@/lib/exerciseFeedbackUtils';
import { handleProcessorResult } from '@/lib/processorResultHandler';

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
}: UseExerciseProcessorProps) => {
  const { speak } = useAudioFeedback();
  const { getAIFeedback } = useAIFeedback({ exercise, coachPersonality, workoutMode, onFormFeedback });
  
  const { 
    repState, internalReps, lastRepIssues, repScores, 
    jumpGroundLevel, peakAirborneY, currentRepAngles, calibrationFrames, incrementReps 
  } = useExerciseState({ exercise, onRepCount });
  
  const formIssuePulse = useRef(false);
  const pulseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentJumpHeight = useRef(0);

  const processPose = useCallback((pose: posedetection.Pose | null) => {
    if (!pose) {
        if (!isWorkoutActive) {
            onFormFeedback("I can't see you. Please step in front of the camera and make sure you're well-lit.");
        }
        if (isDebugMode) onPoseData(null);
        return;
    }

    const { keypoints, score } = pose;

    if (score < 0.4) {
        onFormFeedback("I'm having trouble seeing you clearly. Try improving the lighting or adjusting your camera angle.");
        if (isDebugMode) onPoseData({ keypoints });
        return;
    }

    let result: (Omit<ProcessorResult, 'feedback'> & { feedback?: string }) | null = null;
    
    // Enhanced jump feedback that works both during calibration and after
    if (exercise === 'jumps') {
        const feedback = getJumpReadyFeedback(keypoints, jumpGroundLevel, calibrationFrames);
        if (!isWorkoutActive || jumpGroundLevel.current === null) {
            onFormFeedback(feedback);
            if (isDebugMode) onPoseData({ keypoints });
            if (jumpGroundLevel.current === null) return; // Don't process jumps until calibrated
        }
    }

    switch (exercise) {
      case 'pull-ups': 
        result = processPullups({
          keypoints,
          repState: repState.current,
          internalReps,
          lastRepIssues: lastRepIssues.current
        });
        break;

      case 'jumps': 
        if (jumpGroundLevel.current !== null) {
            const leftAnkle = keypoints.find(k => k.name === 'left_ankle');
            const rightAnkle = keypoints.find(k => k.name === 'right_ankle');

            if (leftAnkle?.score > 0.5 && rightAnkle?.score > 0.5) {
                const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;
                const isAirborne = avgAnkleY < jumpGroundLevel.current - 30;

                // Update current jump height for real-time display
                if (isAirborne) {
                    currentJumpHeight.current = jumpGroundLevel.current - avgAnkleY;
                } else {
                    currentJumpHeight.current = 0;
                }

                if (repState.current === 'GROUNDED' && isAirborne) {
                    peakAirborneY.current = avgAnkleY;
                } else if (repState.current === 'AIRBORNE' && isAirborne) {
                    peakAirborneY.current = Math.min(peakAirborneY.current ?? avgAnkleY, avgAnkleY);
                }
            }
            
            result = processJumps({
                keypoints,
                repState: repState.current,
                internalReps,
                lastRepIssues: lastRepIssues.current,
                jumpGroundLevel: jumpGroundLevel.current,
                peakAirborneY: peakAirborneY.current,
            });
        }
        break;
    }

    if (result) {
        if (exercise === 'pull-ups') {
            if (result.newRepState === 'UP' && repState.current !== 'UP') {
                currentRepAngles.current = { left: [], right: [] };
            }
            if ((repState.current === 'UP' || result.newRepState === 'UP') && result.poseData.leftElbowAngle && result.poseData.rightElbowAngle) {
                currentRepAngles.current.left.push(result.poseData.leftElbowAngle);
                currentRepAngles.current.right.push(result.poseData.rightElbowAngle);
            }
        }
        
        handleProcessorResult({
            result, workoutMode, isDebugMode, onPoseData, repState, onFormFeedback, speak,
            lastRepIssues, formIssuePulse, pulseTimeout, getAIFeedback, incrementReps,
            internalReps, onFormScoreUpdate, repScores, onNewRepData,
            currentRepAngles, exercise, peakAirborneY
        });
    } else if (!isWorkoutActive) {
        // If processor gives no specific result and workout hasn't started, give pre-workout guidance.
        let feedback = "";
        if (workoutMode === 'assessment') {
             feedback = "Get into starting position. The assessment will begin with your first rep.";
        } else if (exercise === 'pull-ups') {
            feedback = getPullupReadyFeedback(keypoints);
        } else if (exercise === 'jumps') {
            feedback = getJumpReadyFeedback(keypoints, jumpGroundLevel, calibrationFrames);
        }
        onFormFeedback(feedback);
        if (isDebugMode) onPoseData({ keypoints });
    }

  }, [isWorkoutActive, exercise, workoutMode, coachPersonality, isDebugMode, onFormFeedback, onFormScoreUpdate, onNewRepData, onPoseData, speak, getAIFeedback, repState, internalReps, lastRepIssues, repScores, jumpGroundLevel, peakAirborneY, currentRepAngles, calibrationFrames, incrementReps]);

  const avgScore = repScores.current.length > 0 ? repScores.current.reduce((a, b) => a + b, 0) / repScores.current.length : 100;

  return { 
    processPose, 
    formIssuePulse: formIssuePulse.current, 
    avgScore,
    currentJumpHeight: currentJumpHeight.current,
    jumpGroundLevel: jumpGroundLevel.current
  };
}
