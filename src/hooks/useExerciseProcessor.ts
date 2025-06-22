
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
import { JumpDetector } from '@/lib/jumpDetector';

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
  const jumpDetector = useRef(new JumpDetector(15, 2.5, 0.1));
  const jumpData = useRef<{y: number, time: number}[]>([]);
  const flightData = useRef<{shoulderX: number, hipX: number}[]>([]);

  const processPose = useCallback((pose: posedetection.Pose | null, videoDimensions: { width: number, height: number }) => {
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
        const feedback = getJumpReadyFeedback(keypoints, jumpGroundLevel, calibrationFrames, videoDimensions);
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
            const leftShoulder = keypoints.find(k => k.name === 'left_shoulder');
            const rightShoulder = keypoints.find(k => k.name === 'right_shoulder');
            const leftHip = keypoints.find(k => k.name === 'left_hip');
            const rightHip = keypoints.find(k => k.name === 'right_hip');

            if (leftAnkle?.score > 0.5 && rightAnkle?.score > 0.5 && leftShoulder?.score > 0.5 && rightShoulder?.score > 0.5 && leftHip?.score > 0.5 && rightHip?.score > 0.5) {
                const torsoY = (leftShoulder.y + rightShoulder.y + leftHip.y + rightHip.y) / 4;
                jumpData.current.push({ y: torsoY, time: Date.now() });
                const signal = jumpDetector.current.update(torsoY);

                const isAirborne = signal < 0;

                if (isAirborne) {
                    currentJumpHeight.current = jumpGroundLevel.current - ((leftAnkle.y + rightAnkle.y) / 2);
                } else {
                    currentJumpHeight.current = 0;
                }

                if (repState.current === 'GROUNDED' && isAirborne) {
                    peakAirborneY.current = (leftAnkle.y + rightAnkle.y) / 2;
                    // Start of jump, clear old data
                    jumpData.current = [];
                    flightData.current = [];
                } else if (repState.current === 'AIRBORNE' && isAirborne) {
                    peakAirborneY.current = Math.min(peakAirborneY.current ?? (leftAnkle.y + rightAnkle.y) / 2, (leftAnkle.y + rightAnkle.y) / 2);
                    flightData.current.push({
                        shoulderX: (leftShoulder.x + rightShoulder.x) / 2,
                        hipX: (leftHip.x + rightHip.x) / 2
                    });
                }
            }
            
            result = processJumps({
                keypoints,
                repState: repState.current,
                internalReps,
                lastRepIssues: lastRepIssues.current,
                jumpGroundLevel: jumpGroundLevel.current,
                peakAirborneY: peakAirborneY.current,
                jumpData: jumpData.current,
                flightData: flightData.current
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
            feedback = getJumpReadyFeedback(keypoints, jumpGroundLevel, calibrationFrames, videoDimensions);
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
