
import * as posedetection from '@tensorflow-models/pose-detection';
import { calculateAngle } from '@/lib/poseUtils';
import { RepState, PoseData, ProcessorResult, JumpRepDetails } from '@/lib/types';

interface JumpProcessorParams {
  keypoints: posedetection.Keypoint[];
  repState: RepState;
  internalReps: number;
  lastRepIssues: string[];
  jumpGroundLevel: number;
  peakAirborneY: number | null;
}

export const processJumps = ({ keypoints, repState, internalReps, lastRepIssues, jumpGroundLevel, peakAirborneY }: JumpProcessorParams): Omit<ProcessorResult, 'feedback'> & { feedback?: string } | null => {
    const leftHip = keypoints.find(k => k.name === 'left_hip');
    const rightHip = keypoints.find(k => k.name === 'right_hip');
    const leftKnee = keypoints.find(k => k.name === 'left_knee');
    const rightKnee = keypoints.find(k => k.name === 'right_knee');
    const leftAnkle = keypoints.find(k => k.name === 'left_ankle');
    const rightAnkle = keypoints.find(k => k.name === 'right_ankle');

    if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle ||
        [leftHip, rightHip, leftKnee, rightKnee, leftAnkle, rightAnkle].some(k => k.score < 0.5)) {
        return {
            feedback: "Make sure your full body is in view!",
            isRepCompleted: false,
            poseData: { keypoints }
        };
    }
      
    const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    const poseData: PoseData = { keypoints, leftKneeAngle, rightKneeAngle };
    const baseResult = { isRepCompleted: false, poseData };

    const isAirborne = avgAnkleY < jumpGroundLevel - 30; // 30px threshold

    if (repState === 'GROUNDED' && isAirborne) {
        return {
            ...baseResult,
            newRepState: 'AIRBORNE',
            feedback: "Up!"
        };
    } else if (repState === 'AIRBORNE' && !isAirborne) {
        const currentIssues: string[] = [];
        let feedback: string;

        // Scoring for jump height
        const jumpHeight = peakAirborneY ? jumpGroundLevel - peakAirborneY : 0;
        const heightScore = Math.min(100, (jumpHeight / 120) * 100); // Assume 120px is a 100% jump
        if (jumpHeight < 40) {
            currentIssues.push('low_jump');
        }

        // Scoring for landing
        const stiffLanding = leftKneeAngle > 160 || rightKneeAngle > 160;
        const landingScore = stiffLanding ? 40 : 100;
        if (stiffLanding) {
            currentIssues.push('stiff_landing');
            feedback = "Bend your knees more when you land!";
        } else {
            feedback = "Nice landing!";
        }

        if (jumpHeight > 40) {
            feedback = `Nice jump! Height: ${jumpHeight.toFixed(0)}px`;
        }
        
        const currentRepScore = Math.round((heightScore * 0.5) + (landingScore * 0.5));
        
        const repCompletionData = {
            score: Math.max(0, currentRepScore),
            issues: [...new Set(currentIssues)],
            details: {
                jumpHeight,
                landingKneeFlexion: (leftKneeAngle + rightKneeAngle) / 2
            } as JumpRepDetails
        };

        return {
            ...baseResult,
            newRepState: 'GROUNDED',
            isRepCompleted: true,
            repCompletionData,
            feedback,
            aiFeedbackPayload: { reps: internalReps, formIssues: lastRepIssues }
        };
    }

    return baseResult;
};
