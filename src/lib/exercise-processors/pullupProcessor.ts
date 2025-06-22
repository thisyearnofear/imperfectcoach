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

    if (nose.score < 0.5 || leftWrist.score < 0.5 || rightWrist.score < 0.5 || leftShoulder.score < 0.5 || rightShoulder.score < 0.5 || leftElbow.score < 0.5 || rightElbow.score < 0.5 || leftHip.score < 0.5 || rightHip.score < 0.5 || leftKnee.score < 0.5 || rightKnee.score < 0.5 || leftAnkle.score < 0.5 || rightAnkle.score < 0.5) {
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
    const leftHipAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
    const rightHipAngle = calculateAngle(rightShoulder, rightHip, rightKnee);
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    const poseData: PoseData = { keypoints, leftElbowAngle, rightElbowAngle, leftShoulderAngle, rightShoulderAngle, leftHipAngle, rightHipAngle, leftKneeAngle, rightKneeAngle };

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

    const chinAboveWrists = nose.y < avgWristY;
    const armsFullyExtended = leftElbowAngle > 150 && rightElbowAngle > 150; // Relaxed from 160
    const isPulledUp = leftShoulderAngle < 85 && rightShoulderAngle < 85 && leftElbowAngle < 130 && rightElbowAngle < 130;
    const aiFeedbackPayloadBase = { reps: internalReps, leftElbowAngle, rightElbowAngle, repState, formIssues: lastRepIssues, leftShoulderAngle, rightShoulderAngle, leftHipAngle, rightHipAngle, leftKneeAngle, rightKneeAngle };

    if (repState === 'DOWN' && isPulledUp) {
        if (!chinAboveWrists) {
            // Partial rep: user is pulling up but chin is not over wrists.
            // Provide feedback and keep them in the 'DOWN' state. This prevents 'cheating' with shallow reps.
            return { 
                ...baseResult, 
                feedback: "Get your chin over the bar!", 
                formCheckSpeak: { issue: 'partial_top_rom', phrase: 'Higher' } 
            };
        } else {
            // Full rep: user has pulled up with chin over wrists.
            // Transition to 'UP' state. The rep will be counted on the way down.
            return {
                ...baseResult,
                newRepState: 'UP',
                aiFeedbackPayload: aiFeedbackPayloadBase,
                feedback, // Carry over any existing feedback (e.g., asymmetry)
                formCheckSpeak
            };
        }
    } else if (repState === 'UP' && armsFullyExtended) {
        // We count the rep if arms are extended beyond 150 degrees.
        // But we still check if they achieved "perfect" extension (160 degrees).
        if (leftElbowAngle < 155 || rightElbowAngle < 155) { // Relaxed threshold from 160
            currentIssues.push('partial_bottom_rom');
            feedback = "Full extension at the bottom!";
            formCheckSpeak = { issue: 'partial_bottom_rom', phrase: 'Full extension' };
        }

        let currentRepScore = 100;
        if (currentIssues.includes('asymmetry')) currentRepScore -= 30;
        // The 'partial_top_rom' check was flawed as it looked at the previous rep.
        // The new logic correctly prevents reps without full top ROM from being counted at all,
        // so a separate score penalty is redundant and confusing.
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
