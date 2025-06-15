import * as posedetection from '@tensorflow-models/pose-detection';
import { calculateAngle } from '@/lib/poseUtils';
import { RepState, WorkoutMode, PoseData, ProcessorResult } from '@/lib/types';

interface PullupProcessorParams {
  keypoints: posedetection.Keypoint[];
  repState: RepState;
  internalReps: number;
  lastRepIssues: string[];
}

export const processPullups = ({ keypoints, repState, internalReps, lastRepIssues }: PullupProcessorParams): Omit<ProcessorResult, 'feedback'> & { feedback?: string } | null => {
    const nose = keypoints.find(k => k.name === 'nose');
    const leftWrist = keypoints.find(k => k.name === 'left_wrist');
    const rightWrist = keypoints.find(k => k.name === 'right_wrist');
    const leftShoulder = keypoints.find(k => k.name === 'left_shoulder');
    const rightShoulder = keypoints.find(k => k.name === 'right_shoulder');
    const leftElbow = keypoints.find(k => k.name === 'left_elbow');
    const rightElbow = keypoints.find(k => k.name === 'right_elbow');
    const leftHip = keypoints.find(k => k.name === 'left_hip');
    const rightHip = keypoints.find(k => k.name === 'right_hip');

    if (!nose || !leftWrist || !rightWrist || !leftShoulder || !rightShoulder || !leftElbow || !rightElbow || !leftHip || !rightHip) {
        return null;
    }

    if (nose.score < 0.5 || leftWrist.score < 0.5 || rightWrist.score < 0.5 || leftShoulder.score < 0.5 || rightShoulder.score < 0.5 || leftElbow.score < 0.5 || rightElbow.score < 0.5 || leftHip.score < 0.5 || rightHip.score < 0.5) {
        return {
            feedback: "Make sure you're fully in view!",
            isRepCompleted: false,
            poseData: { keypoints }
        };
    }

    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const leftShoulderAngle = calculateAngle(leftHip, leftShoulder, leftElbow);
    const rightShoulderAngle = calculateAngle(rightHip, rightShoulder, rightElbow);
    const poseData: PoseData = { keypoints, leftElbowAngle, rightElbowAngle, leftShoulderAngle, rightShoulderAngle };

    const baseResult = { isRepCompleted: false, poseData };
    
    const currentIssues: string[] = [];
    let feedback: string | undefined;
    let formCheckSpeak: { issue: string; phrase: string } | undefined;

    const angleDifference = Math.abs(leftElbowAngle - rightElbowAngle);
    if (angleDifference > 30) { // Relaxed from 25
        currentIssues.push('asymmetry');
        feedback = "Pull evenly with both arms!";
        formCheckSpeak = { issue: 'asymmetry', phrase: 'Pull evenly' };
    }

    const chinAboveWrists = nose.y < leftWrist.y && nose.y < rightWrist.y;
    const armsFullyExtended = leftElbowAngle > 150 && rightElbowAngle > 150; // Relaxed from 160
    const aiFeedbackPayloadBase = { reps: internalReps, leftElbowAngle, rightElbowAngle, repState, formIssues: lastRepIssues };

    if (repState === 'DOWN' && leftElbowAngle < 90 && rightElbowAngle < 90) {
        if (!chinAboveWrists) {
            currentIssues.push('partial_top_rom');
            feedback = "Get your chin over the bar!";
            formCheckSpeak = { issue: 'partial_top_rom', phrase: 'Higher' };
        }
        return {
            ...baseResult,
            newRepState: 'UP',
            aiFeedbackPayload: aiFeedbackPayloadBase,
            feedback,
            formCheckSpeak
        };
    } else if (repState === 'UP' && armsFullyExtended) {
        // We count the rep if arms are extended beyond 150 degrees.
        // But we still check if they achieved "perfect" extension (160 degrees).
        if (leftElbowAngle < 160 || rightElbowAngle < 160) {
            currentIssues.push('partial_bottom_rom');
            feedback = "Full extension at the bottom!";
            formCheckSpeak = { issue: 'partial_bottom_rom', phrase: 'Full extension' };
        }

        let currentRepScore = 100;
        if (currentIssues.includes('asymmetry')) currentRepScore -= 30;
        if (currentIssues.includes('partial_top_rom')) currentRepScore -= 25;
        if (currentIssues.includes('partial_bottom_rom')) currentRepScore -= 25;
        
        const repCompletionData = {
            score: Math.max(0, currentRepScore),
            issues: [...new Set(currentIssues)],
        };

        return {
            ...baseResult,
            newRepState: 'DOWN',
            isRepCompleted: true,
            repCompletionData,
            aiFeedbackPayload: { ...aiFeedbackPayloadBase, reps: internalReps + 1, formIssues: repCompletionData.issues },
            feedback,
            formCheckSpeak
        };
    }
    
    return { ...baseResult, feedback, formCheckSpeak };
};
