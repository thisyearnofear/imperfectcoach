
import { useEffect, useRef, useState, useCallback } from 'react';
import * as posedetection from '@tensorflow-models/pose-detection';
import { supabase } from '@/integrations/supabase/client';
import { Exercise, RepData, PoseData, RepState, CoachPersonality, WorkoutMode } from '@/lib/types';
import { useAudioFeedback } from './useAudioFeedback';
import { calculateAngle } from '@/lib/poseUtils';

interface UseExerciseProcessorProps {
  exercise: Exercise;
  workoutMode: WorkoutMode;
  onRepCount: (count: (prevCount: number) => number) => void;
  onFormFeedback: (message: string) => void;
  onFormScoreUpdate: (score: number) => void;
  onNewRepData: (data: RepData) => void;
  coachPersonality: CoachPersonality;
  isDebugMode: boolean;
  onPoseData: (data: PoseData) => void;
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
}: UseExerciseProcessorProps) => {
  const [repState, setRepState] = useState<RepState>('DOWN');
  const [internalReps, setInternalReps] = useState(0);
  const aiFeedbackCooldown = useRef(false);
  const lastRepIssues = useRef<string[]>([]);
  const repScores = useRef<number[]>([]);
  const { playBeep, speak } = useAudioFeedback();
  const formIssuePulse = useRef(false);
  const pulseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset state when exercise changes
  useEffect(() => {
    setInternalReps(0);
    repScores.current = [];
    lastRepIssues.current = [];
    if (exercise === 'pull-ups' || exercise === 'squats') {
      setRepState('DOWN');
    } else {
      setRepState('GROUNDED');
    }
  }, [exercise]);

  const getAIFeedback = async (data: Record<string, any>) => {
    if (aiFeedbackCooldown.current || workoutMode === 'assessment') return;
    aiFeedbackCooldown.current = true;
    setTimeout(() => { aiFeedbackCooldown.current = false; }, 4000); // 4-second cooldown

    try {
      const { data: responseData, error } = await supabase.functions.invoke('coach-gemini', {
        body: { exercise, personality: coachPersonality, ...data }
      });
      if (error) throw error;
      if (responseData.feedback) {
        onFormFeedback(responseData.feedback);
      }
    } catch (error) {
      console.error('Error getting AI feedback:', error);
    }
  };

  const incrementReps = useCallback(() => {
    onRepCount(prev => prev + 1);
    setInternalReps(prev => prev + 1);
    playBeep();
  }, [onRepCount, playBeep]);

  const processPose = useCallback((pose: posedetection.Pose | null) => {
    if (!pose) return;
    const { keypoints } = pose;

    const handlePullups = (keypoints: posedetection.Keypoint[]) => {
      const nose = keypoints.find(k => k.name === 'nose');
      const leftWrist = keypoints.find(k => k.name === 'left_wrist');
      const rightWrist = keypoints.find(k => k.name === 'right_wrist');
      const leftShoulder = keypoints.find(k => k.name === 'left_shoulder');
      const rightShoulder = keypoints.find(k => k.name === 'right_shoulder');
      const leftElbow = keypoints.find(k => k.name === 'left_elbow');
      const rightElbow = keypoints.find(k => k.name === 'right_elbow');

      if (nose && leftWrist && rightWrist && leftShoulder && rightShoulder && leftElbow && rightElbow) {
        if (nose.score < 0.5 || leftWrist.score < 0.5 || rightWrist.score < 0.5) {
            if (workoutMode === 'training') onFormFeedback("Make sure you're fully in view!");
            return;
        }
        const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
        const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
        const poseData: PoseData = { keypoints, leftElbowAngle, rightElbowAngle };
        if (isDebugMode) onPoseData(poseData);
        
        const triggerPulse = (duration = 500) => {
            formIssuePulse.current = true;
            if (pulseTimeout.current) clearTimeout(pulseTimeout.current);
            pulseTimeout.current = setTimeout(() => { formIssuePulse.current = false; }, duration);
        };
        const formCheckSpeak = (issue: string, phrase: string) => {
            if (workoutMode === 'assessment') return;
            if (!lastRepIssues.current.includes(issue)) {
                speak(phrase);
                triggerPulse();
            }
        };

        let currentRepScore = 100;
        const currentIssues: string[] = [];
        const angleDifference = Math.abs(leftElbowAngle - rightElbowAngle);
        if (angleDifference > 25) {
            currentIssues.push('asymmetry');
            if (workoutMode === 'training') onFormFeedback("Pull evenly with both arms!");
            formCheckSpeak('asymmetry', 'Pull evenly');
        }

        const chinAboveWrists = nose.y < leftWrist.y && nose.y < rightWrist.y;
        const armsFullyExtended = leftElbowAngle > 160 && rightElbowAngle > 160;
        const feedbackPayload = { reps: internalReps, leftElbowAngle, rightElbowAngle, repState, formIssues: lastRepIssues.current };

        if (repState === 'DOWN' && leftElbowAngle < 90 && rightElbowAngle < 90) {
            setRepState('UP');
            if (!chinAboveWrists) {
                currentIssues.push('partial_top_rom');
                if (workoutMode === 'training') onFormFeedback("Get your chin over the bar!");
                formCheckSpeak('partial_top_rom', 'Higher');
            }
            getAIFeedback(feedbackPayload);
        } else if (repState === 'UP' && armsFullyExtended) {
            setRepState('DOWN');
            if (leftElbowAngle < 160 || rightElbowAngle < 160) {
                currentIssues.push('partial_bottom_rom');
                if (workoutMode === 'training') onFormFeedback("Full extension at the bottom!");
                formCheckSpeak('partial_bottom_rom', 'Full extension');
            }
            if (currentIssues.includes('asymmetry')) currentRepScore -= 30;
            if (currentIssues.includes('partial_top_rom')) currentRepScore -= 25;
            if (currentIssues.includes('partial_bottom_rom')) currentRepScore -= 25;
            incrementReps();
            lastRepIssues.current = [...new Set(currentIssues)];
            const repScore = Math.max(0, currentRepScore);
            repScores.current.push(repScore);
            if (repScores.current.length > 5) repScores.current.shift();
            const avgScore = repScores.current.length > 0 ? repScores.current.reduce((a, b) => a + b, 0) / repScores.current.length : 100;
            onFormScoreUpdate(avgScore);
            onNewRepData({ timestamp: Date.now(), score: repScore });
            getAIFeedback({ ...feedbackPayload, reps: internalReps + 1, formIssues: lastRepIssues.current });
        }
      }
    };
    switch (exercise) {
      case 'pull-ups': handlePullups(keypoints); break;
      case 'squats': if (workoutMode === 'training') onFormFeedback("Squat detection is not yet implemented."); break;
      case 'jumps': if (workoutMode === 'training') onFormFeedback("Jump detection is not yet implemented."); break;
    }
  }, [exercise, workoutMode, coachPersonality, isDebugMode, onFormFeedback, onFormScoreUpdate, onNewRepData, onPoseData, speak, repState, internalReps, incrementReps]);

  const avgScore = repScores.current.length > 0 ? repScores.current.reduce((a, b) => a + b, 0) / repScores.current.length : 100;

  return { processPose, formIssuePulse: formIssuePulse.current, avgScore };
}
