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

    const handleJumps = (keypoints: posedetection.Keypoint[]) => {
      const leftHip = keypoints.find(k => k.name === 'left_hip');
      const rightHip = keypoints.find(k => k.name === 'right_hip');
      const leftKnee = keypoints.find(k => k.name === 'left_knee');
      const rightKnee = keypoints.find(k => k.name === 'right_knee');
      const leftAnkle = keypoints.find(k => k.name === 'left_ankle');
      const rightAnkle = keypoints.find(k => k.name === 'right_ankle');

      if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle ||
          [leftHip, rightHip, leftKnee, rightKnee, leftAnkle, rightAnkle].some(k => k.score < 0.5)) {
          if (workoutMode === 'training') onFormFeedback("Make sure your full body is in view!");
          return;
      }
      
      const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;
      const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
      const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
      const poseData: PoseData = { keypoints, leftKneeAngle, rightKneeAngle };
      if (isDebugMode) onPoseData(poseData);
      
      if (jumpGroundLevel.current === null) {
          jumpGroundLevel.current = avgAnkleY;
          onFormFeedback("Crouch down, then jump as high as you can!");
          return;
      }

      const isAirborne = avgAnkleY < jumpGroundLevel.current - 30; // 30px threshold

      if (repState === 'GROUNDED' && isAirborne) {
          setRepState('AIRBORNE');
          if (workoutMode === 'training') onFormFeedback("Up!");
      } else if (repState === 'AIRBORNE' && !isAirborne) {
          setRepState('GROUNDED');
          incrementReps();
          
          let currentRepScore = 100;
          const currentIssues: string[] = [];

          if (leftKneeAngle > 160 || rightKneeAngle > 160) {
              currentIssues.push('stiff_landing');
              if (workoutMode === 'training') onFormFeedback("Bend your knees when you land!");
              currentRepScore -= 40;
          } else {
              if (workoutMode === 'training') onFormFeedback("Nice landing!");
          }

          lastRepIssues.current = [...new Set(currentIssues)];
          const repScore = Math.max(0, currentRepScore);
          repScores.current.push(repScore);
          if (repScores.current.length > 5) repScores.current.shift();
          const avgScore = repScores.current.length > 0 ? repScores.current.reduce((a, b) => a + b, 0) / repScores.current.length : 100;
          onFormScoreUpdate(avgScore);
          onNewRepData({ timestamp: Date.now(), score: repScore });
          getAIFeedback({ reps: internalReps, formIssues: lastRepIssues.current });
      }
    };

    switch (exercise) {
      case 'pull-ups': handlePullups(keypoints); break;
      case 'squats': if (workoutMode === 'training') onFormFeedback("Squat detection is not yet implemented."); break;
      case 'jumps': handleJumps(keypoints); break;
    }
  }, [exercise, workoutMode, coachPersonality, isDebugMode, onFormFeedback, onFormScoreUpdate, onNewRepData, onPoseData, speak, repState, internalReps, incrementReps, getAIFeedback]);

  const avgScore = repScores.current.length > 0 ? repScores.current.reduce((a, b) => a + b, 0) / repScores.current.length : 100;

  return { processPose, formIssuePulse: formIssuePulse.current, avgScore };
}
