import { useEffect, useRef, useState, useCallback } from 'react';
import * as posedetection from '@tensorflow-models/pose-detection';
import { Exercise, RepData, PoseData, RepState, CoachPersonality, WorkoutMode, ProcessorResult } from '@/lib/types';
import { useAudioFeedback } from './useAudioFeedback';
import { processPullups } from '@/lib/exercise-processors/pullupProcessor';
import { processJumps } from '@/lib/exercise-processors/jumpProcessor';
import { useAIFeedback } from './useAIFeedback';
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
  onPoseData: (data: PoseData | null) => void;
  isWorkoutActive: boolean;
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

function getPullupReadyFeedback(keypoints: posedetection.Keypoint[]): string {
    const leftWrist = keypoints.find(k => k.name === 'left_wrist');
    const leftElbow = keypoints.find(k => k.name === 'left_elbow');
    const leftShoulder = keypoints.find(k => k.name === 'left_shoulder');
    const rightWrist = keypoints.find(k => k.name === 'right_wrist');
    const rightElbow = keypoints.find(k => k.name === 'right_elbow');
    const rightShoulder = keypoints.find(k => k.name === 'right_shoulder');

    const allKeypointsVisible = leftWrist?.score > 0.4 && leftElbow?.score > 0.4 && leftShoulder?.score > 0.4 &&
                                rightWrist?.score > 0.4 && rightElbow?.score > 0.4 && rightShoulder?.score > 0.4;

    if (allKeypointsVisible) {
        const leftElbowAngle = calculateAngle(leftShoulder!, leftElbow!, leftWrist!);
        const rightElbowAngle = calculateAngle(rightShoulder!, rightElbow!, rightWrist!);
        
        if (leftElbowAngle > 140 && rightElbowAngle > 140) {
            return "You're in the start position. Pull up to begin!";
        } else {
            return "Hang from the bar with arms fully extended to start.";
        }
    }
    return "Get in view of the camera, ready to hang from the bar.";
}

function getJumpReadyFeedback(keypoints: posedetection.Keypoint[], jumpGroundLevel: React.MutableRefObject<number | null>): string {
    if (jumpGroundLevel.current === null) {
        const leftAnkle = keypoints.find(k => k.name === 'left_ankle');
        const rightAnkle = keypoints.find(k => k.name === 'right_ankle');
        if (leftAnkle && rightAnkle && leftAnkle.score > 0.5 && rightAnkle.score > 0.5) {
            jumpGroundLevel.current = (leftAnkle.y + rightAnkle.y) / 2;
            return "Crouch down, then jump as high as you can to start!";
        } else {
            return "Stand in full view of the camera to calibrate.";
        }
    } else {
         return "Ready for your first jump! Start when you're ready.";
    }
}

function handlePreWorkoutPose(
    pose: posedetection.Pose,
    params: {
        exercise: Exercise,
        workoutMode: WorkoutMode,
        onFormFeedback: (msg: string) => void,
        onPoseData: (data: PoseData | null) => void,
        jumpGroundLevel: React.MutableRefObject<number | null>,
        isDebugMode: boolean
    }
) {
    const { exercise, workoutMode, onFormFeedback, onPoseData, jumpGroundLevel, isDebugMode } = params;
    const { keypoints, score } = pose;
    if (isDebugMode) onPoseData({ keypoints });

    if (score < 0.4) {
        onFormFeedback("I'm having trouble seeing you clearly. Try improving the lighting or adjusting your camera angle.");
        return;
    }

    if (workoutMode === 'assessment') {
        onFormFeedback("Get into starting position. The assessment will begin with your first rep.");
        return;
    }

    let feedback = "";
    if (exercise === 'jumps') {
        feedback = getJumpReadyFeedback(keypoints, jumpGroundLevel);
    } else if (exercise === 'pull-ups') {
        feedback = getPullupReadyFeedback(keypoints);
    }
    onFormFeedback(feedback);
}

function handleProcessorResult(
    result: (Omit<ProcessorResult, 'feedback'> & { feedback?: string }),
    params: {
        workoutMode: WorkoutMode;
        isDebugMode: boolean;
        onPoseData: (data: PoseData | null) => void;
        setRepState: React.Dispatch<React.SetStateAction<RepState>>;
        onFormFeedback: (message: string) => void;
        speak: (phrase: string) => void;
        lastRepIssues: React.MutableRefObject<string[]>;
        formIssuePulse: React.MutableRefObject<boolean>;
        pulseTimeout: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
        getAIFeedback: (payload: any) => void;
        incrementReps: () => void;
        internalReps: number;
        onFormScoreUpdate: (score: number) => void;
        repScores: React.MutableRefObject<number[]>;
        onNewRepData: (data: RepData) => void;
    }
) {
    const {
        workoutMode, isDebugMode, onPoseData, setRepState, onFormFeedback, speak,
        lastRepIssues, formIssuePulse, pulseTimeout, getAIFeedback, incrementReps,
        internalReps, onFormScoreUpdate, repScores, onNewRepData
    } = params;
    
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
        getAIFeedback({ 
            reps: internalReps + 1, 
            formIssues: lastRepIssues.current,
            ...result.aiFeedbackPayload
        });
    }
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
  const [repState, setRepState] = useState<RepState>('DOWN');
  const [internalReps, setInternalReps] = useState(0);
  const lastRepIssues = useRef<string[]>([]);
  const repScores = useRef<number[]>([]);
  const { playBeep, speak } = useAudioFeedback();
  const formIssuePulse = useRef(false);
  const pulseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jumpGroundLevel = useRef<number | null>(null);

  const { getAIFeedback } = useAIFeedback({
    exercise,
    coachPersonality,
    workoutMode,
    onFormFeedback
  });

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

  const incrementReps = useCallback(() => {
    onRepCount(prev => prev + 1);
    setInternalReps(prev => prev + 1);
    playBeep();
  }, [onRepCount, playBeep]);

  const processPose = useCallback((pose: posedetection.Pose | null) => {
    if (!isWorkoutActive) {
        if (!pose) {
            onFormFeedback("I can't see you. Please step in front of the camera and make sure you're well-lit.");
            if (isDebugMode) onPoseData(null);
            return;
        }
        handlePreWorkoutPose(pose, { exercise, workoutMode, onFormFeedback, onPoseData, jumpGroundLevel, isDebugMode });
        return; // Stop here if workout is not active
    }

    if (!pose) return;
    
    const { keypoints } = pose;

    let result: (Omit<ProcessorResult, 'feedback'> & { feedback?: string }) | null = null;
    
    if (exercise === 'jumps' && jumpGroundLevel.current === null) {
        onFormFeedback("Calibrating jump height...");
        if (isDebugMode) onPoseData({ keypoints });
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
    
    handleProcessorResult(result, {
        workoutMode, isDebugMode, onPoseData, setRepState, onFormFeedback, speak,
        lastRepIssues, formIssuePulse, pulseTimeout, getAIFeedback, incrementReps,
        internalReps, onFormScoreUpdate, repScores, onNewRepData
    });

  }, [exercise, workoutMode, coachPersonality, isDebugMode, onFormFeedback, onFormScoreUpdate, onNewRepData, onPoseData, speak, repState, internalReps, incrementReps, getAIFeedback, isWorkoutActive]);

  const avgScore = repScores.current.length > 0 ? repScores.current.reduce((a, b) => a + b, 0) / repScores.current.length : 100;

  return { processPose, formIssuePulse: formIssuePulse.current, avgScore };
}
