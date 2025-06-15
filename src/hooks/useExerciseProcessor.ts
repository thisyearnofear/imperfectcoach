import { useEffect, useRef, useState, useCallback } from 'react';
import * as posedetection from '@tensorflow-models/pose-detection';
import { supabase } from '@/integrations/supabase/client';
import { Exercise, RepData, PoseData, RepState, CoachPersonality, WorkoutMode, ProcessorResult } from '@/lib/types';
import { useAudioFeedback } from './useAudioFeedback';
import { processPullups } from '@/lib/exercise-processors/pullupProcessor';
import { processJumps } from '@/lib/exercise-processors/jumpProcessor';

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

const cachedFeedback: Record<string, string[]> = {
    asymmetry: [
        "Try to pull up with both arms equally.",
        "Keep your body balanced during the pull-up.",
        "Focus on an even pull."
    ],
    partial_top_rom: [
        "Get that chin over the bar!",
        "A little higher next time.",
        "Almost there, pull all the way up!"
    ],
    partial_bottom_rom: [
        "Go all the way down for a full rep.",
        "Make sure to fully extend your arms at the bottom.",
        "Full range of motion is key!"
    ],
    stiff_landing: [
        "Softer landing next time!",
        "Bend your knees to absorb the impact.",
        "Try to land more quietly."
    ],
    general: [
        "Keep up the great work!",
        "Nice form!",
        "You're doing great!"
    ]
};

const getRandomFeedback = (issues: string[]): string => {
    const relevantIssues = issues.filter(issue => issue in cachedFeedback);
    const issue = relevantIssues.length > 0 ? relevantIssues[Math.floor(Math.random() * relevantIssues.length)] : 'general';
    const messages = cachedFeedback[issue as keyof typeof cachedFeedback] || cachedFeedback.general;
    return messages[Math.floor(Math.random() * messages.length)];
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
  const jumpGroundLevel = useRef<number | null>(null);

  // Reset state when exercise changes
  useEffect(() => {
    setInternalReps(0);
    repScores.current = [];
    lastRepIssues.current = [];
    jumpGroundLevel.current = null;

    if (exercise === 'pull-ups' || exercise === 'squats') {
      setRepState('DOWN');
    } else { // For jumps and any future exercises starting from ground
      setRepState('GROUNDED');
    }
  }, [exercise]);

  const getAIFeedback = async (data: Record<string, any>) => {
    if (aiFeedbackCooldown.current || workoutMode === 'assessment') return;
    aiFeedbackCooldown.current = true;
    setTimeout(() => { aiFeedbackCooldown.current = false; }, 4000); // 4-second cooldown

    if (!navigator.onLine) {
        onFormFeedback(getRandomFeedback(lastRepIssues.current));
        return;
    }

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
      onFormFeedback(getRandomFeedback(lastRepIssues.current));
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

    let result: (Omit<ProcessorResult, 'feedback'> & { feedback?: string }) | null = null;
    
    // Special handling for jump ground level calibration
    if (exercise === 'jumps' && jumpGroundLevel.current === null) {
        const leftAnkle = keypoints.find(k => k.name === 'left_ankle');
        const rightAnkle = keypoints.find(k => k.name === 'right_ankle');
        if (leftAnkle && rightAnkle && leftAnkle.score > 0.5 && rightAnkle.score > 0.5) {
            jumpGroundLevel.current = (leftAnkle.y + rightAnkle.y) / 2;
            onFormFeedback("Crouch down, then jump as high as you can!");
        } else {
            onFormFeedback("Stand in full view to calibrate for jumps.");
        }
        return;
    }

    switch (exercise) {
      case 'pull-ups': 
        result = processPullups({
          keypoints,
          repState,
          internalReps,
          lastRepIssues: lastRepIssues.current
        });
        break;
      case 'squats': 
        if (workoutMode === 'training') onFormFeedback("Squat detection is not yet implemented."); 
        break;
      case 'jumps': 
        if (jumpGroundLevel.current !== null) {
            result = processJumps({
                keypoints,
                repState,
                internalReps,
                lastRepIssues: lastRepIssues.current,
                jumpGroundLevel: jumpGroundLevel.current,
            });
        }
        break;
    }

    if (!result) return;
    
    if (isDebugMode) onPoseData(result.poseData);
    if (result.newRepState) setRepState(result.newRepState);
    if (result.feedback && workoutMode === 'training') onFormFeedback(result.feedback);

    if (result.formCheckSpeak && workoutMode === 'training' && !lastRepIssues.current.includes(result.formCheckSpeak.issue)) {
        speak(result.formCheckSpeak.phrase);
        formIssuePulse.current = true;
        if (pulseTimeout.current) clearTimeout(pulseTimeout.current);
        pulseTimeout.current = setTimeout(() => { formIssuePulse.current = false; }, 500);
    }
    
    if (result.aiFeedbackPayload) getAIFeedback(result.aiFeedbackPayload);

    if (result.isRepCompleted && result.repCompletionData) {
        incrementReps();
        const { score, issues } = result.repCompletionData;
        lastRepIssues.current = [...new Set(issues)];
        repScores.current.push(score);
        if (repScores.current.length > 5) repScores.current.shift();
        const avgScore = repScores.current.length > 0 ? repScores.current.reduce((a, b) => a + b, 0) / repScores.current.length : 100;
        onFormScoreUpdate(avgScore);
        onNewRepData({ timestamp: Date.now(), score });
        // Get AI feedback after rep as well
        getAIFeedback({ 
            reps: internalReps + 1, 
            formIssues: lastRepIssues.current,
            ...result.aiFeedbackPayload
        });
    }

  }, [exercise, workoutMode, coachPersonality, isDebugMode, onFormFeedback, onFormScoreUpdate, onNewRepData, onPoseData, speak, repState, internalReps, incrementReps, getAIFeedback]);

  const avgScore = repScores.current.length > 0 ? repScores.current.reduce((a, b) => a + b, 0) / repScores.current.length : 100;

  return { processPose, formIssuePulse: formIssuePulse.current, avgScore };
}
