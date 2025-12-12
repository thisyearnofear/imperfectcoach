import * as posedetection from '@tensorflow-models/pose-detection';
import { calculateAngle } from '@/lib/pose-analysis';
import { RepState, WorkoutMode, PoseData, ProcessorResult } from '@/lib/types';

// ENHANCEMENT: Pull-up state tracking for learning phase management
export interface PullupState {
  repsCompleted: number;
  isFirstRep: boolean;
  lastRepScore?: number;
}

interface PullupProcessorParams {
  keypoints: posedetection.Keypoint[];
  repState: RepState;
  internalReps: number;
  lastRepIssues: string[];
  pullupState?: PullupState;
}

export const processPullups = ({ keypoints, repState, internalReps, lastRepIssues, pullupState }: PullupProcessorParams): Omit<ProcessorResult, 'feedback'> & { feedback?: string; pullupState?: PullupState } | null => {
    const nose = keypoints.find(k => k.name === 'nose');
    const leftWrist = keypoints.find(k => k.name === 'left_wrist');
    const rightWrist = keypoints.find(k => k.name === 'right_wrist');
    const leftShoulder = keypoints.find(k => k.name === 'left_shoulder');
    const rightShoulder = keypoints.find(k => k.name === 'right_shoulder');
    const leftElbow = keypoints.find(k => k.name === 'left_elbow');
    const rightElbow = keypoints.find(k => k.name === 'right_elbow');
    const leftHip = keypoints.find(k => k.name === 'left_hip');
    const rightHip = keypoints.find(k => k.name === 'right_hip');
    const leftKnee = keypoints.find(k => k.name === 'left_knee');
    const rightKnee = keypoints.find(k => k.name === 'right_knee');
    const leftAnkle = keypoints.find(k => k.name === 'left_ankle');
    const rightAnkle = keypoints.find(k => k.name === 'right_ankle');

    if (!nose || !leftWrist || !rightWrist || !leftShoulder || !rightShoulder || !leftElbow || !rightElbow || !leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) {
        return null;
    }
    
    const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const avgWristY = (leftWrist.y + rightWrist.y) / 2;

    const isHanging = avgWristY < avgShoulderY;
    if (!isHanging) {
        // Not in a pull-up position, return null to allow pre-workout feedback to take over.
        return null;
    }

    // Provide specific feedback about which body parts aren't visible
    const lowConfidencePoints = [];
    if (nose.score < 0.5) lowConfidencePoints.push('head');
    if (leftWrist.score < 0.5 || rightWrist.score < 0.5) lowConfidencePoints.push('hands');
    if (leftElbow.score < 0.5 || rightElbow.score < 0.5) lowConfidencePoints.push('elbows');
    if (leftShoulder.score < 0.5 || rightShoulder.score < 0.5) lowConfidencePoints.push('shoulders');
    if (leftHip.score < 0.5 || rightHip.score < 0.5) lowConfidencePoints.push('hips');
    if (leftKnee.score < 0.5 || rightKnee.score < 0.5) lowConfidencePoints.push('knees');
    if (leftAnkle.score < 0.5 || rightAnkle.score < 0.5) lowConfidencePoints.push('feet');
    
    if (lowConfidencePoints.length > 0) {
        let feedback = "Can't see your ";
        if (lowConfidencePoints.length > 2) {
            feedback = "Step back - need to see full body";
        } else {
            feedback += lowConfidencePoints.join(' & ');
        }
        
        return {
            feedback,
            isRepCompleted: false,
            poseData: { keypoints }
        };
    }

    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const leftShoulderAngle = calculateAngle(leftHip, leftShoulder, leftElbow);
    const rightShoulderAngle = calculateAngle(rightHip, rightShoulder, rightElbow);
    const leftHipAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
    const rightHipAngle = calculateAngle(rightShoulder, rightHip, rightKnee);
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    const poseData: PoseData = { keypoints, leftElbowAngle, rightElbowAngle, leftShoulderAngle, rightShoulderAngle, leftHipAngle, rightHipAngle, leftKneeAngle, rightKneeAngle };

    const baseResult = { isRepCompleted: false, poseData, pullupState };
    
    const currentIssues: string[] = [];
    let feedback: string | undefined;
    let formCheckSpeak: { issue: string; phrase: string } | undefined;

    // ENHANCEMENT: Defer form feedback until rep 3+ (learning phase is positive only)
    const isLearningPhase = !pullupState || pullupState.repsCompleted < 2;
    
    const angleDifference = Math.abs(leftElbowAngle - rightElbowAngle);
    if (angleDifference > 30) { // Relaxed from 25
        currentIssues.push('asymmetry');
        // CLEAN: Only show form correction after learning phase
        if (!isLearningPhase) {
            feedback = "Pull evenly with both arms!";
            formCheckSpeak = { issue: 'asymmetry', phrase: 'Pull evenly' };
        }
    }

    const chinAboveWrists = nose.y < avgWristY;
    const armsFullyExtended = leftElbowAngle > 150 && rightElbowAngle > 150; // Relaxed from 160
    const isPulledUp = leftShoulderAngle < 85 && rightShoulderAngle < 85 && leftElbowAngle < 130 && rightElbowAngle < 130;
    const aiFeedbackPayloadBase = { reps: internalReps, leftElbowAngle, rightElbowAngle, repState, formIssues: lastRepIssues, leftShoulderAngle, rightShoulderAngle, leftHipAngle, rightHipAngle, leftKneeAngle, rightKneeAngle };

    if (repState === 'DOWN' && isPulledUp) {
        if (!chinAboveWrists) {
            // Partial rep: user is pulling up but chin is not over wrists.
            // ENHANCEMENT: Only correct form after learning phase
            if (!isLearningPhase) {
                currentIssues.push('partial_top_rom');
                return { 
                    ...baseResult, 
                    feedback: "Get your chin over the bar!", 
                    formCheckSpeak: { issue: 'partial_top_rom', phrase: 'Higher' } 
                };
            } else {
                // During learning phase, accept the pull as is, don't gate it
                return {
                    ...baseResult,
                    newRepState: 'UP',
                    aiFeedbackPayload: aiFeedbackPayloadBase,
                    feedback: "Good effort! Keep pulling!",
                    formCheckSpeak: undefined
                };
            }
        } else {
            // Full rep: user has pulled up with chin over wrists.
            // Transition to 'UP' state. The rep will be counted on the way down.
            return {
                ...baseResult,
                newRepState: 'UP',
                aiFeedbackPayload: aiFeedbackPayloadBase,
                feedback: isLearningPhase ? undefined : feedback, // Suppress form feedback during learning
                formCheckSpeak: isLearningPhase ? undefined : formCheckSpeak
            };
        }
    } else if (repState === 'UP' && armsFullyExtended) {
        // We count the rep if arms are extended beyond 150 degrees.
        // But we still check if they achieved "perfect" extension (160 degrees).
        if (leftElbowAngle < 155 || rightElbowAngle < 155) { // Relaxed threshold from 160
            currentIssues.push('partial_bottom_rom');
            // CLEAN: Only show form correction after learning phase
            if (!isLearningPhase) {
                feedback = "Full extension at the bottom!";
                formCheckSpeak = { issue: 'partial_bottom_rom', phrase: 'Full extension' };
            }
        }

        let currentRepScore = 100;
        if (currentIssues.includes('asymmetry')) currentRepScore -= 30;
        if (currentIssues.includes('partial_bottom_rom')) currentRepScore -= 25;
        
        // ENHANCEMENT: Track rep completion and celebrate first rep
        if (pullupState) {
            pullupState.repsCompleted++;
            pullupState.lastRepScore = Math.max(0, currentRepScore);
        }
        
        const isFirstRep = !pullupState || pullupState.repsCompleted === 1;
        const repCompletionData = {
            score: Math.max(0, currentRepScore),
            issues: [...new Set(currentIssues)],
        };

        // ENHANCEMENT: Celebratory message for first rep, standard feedback for others
        const repCompletionFeedback = isFirstRep
            ? "Great first pull-up! You're building strength!"
            : isLearningPhase 
            ? "Excellent! Nice effort!"
            : feedback;

        return {
            ...baseResult,
            newRepState: 'DOWN',
            isRepCompleted: true,
            repCompletionData,
            aiFeedbackPayload: { ...aiFeedbackPayloadBase, reps: internalReps + 1, formIssues: repCompletionData.issues },
            feedback: repCompletionFeedback,
            formCheckSpeak: isFirstRep ? undefined : formCheckSpeak
        };
    }
    
    return { ...baseResult, feedback, formCheckSpeak };
};

// MODULAR: State management utilities for pull-ups (mirrors jump pattern)
export function createPullupState(): PullupState {
  return {
    repsCompleted: 0,
    isFirstRep: true,
    lastRepScore: undefined,
  };
}

export function resetPullupState(pullupState: PullupState): void {
  pullupState.repsCompleted = 0;
  pullupState.isFirstRep = true;
  pullupState.lastRepScore = undefined;
}
