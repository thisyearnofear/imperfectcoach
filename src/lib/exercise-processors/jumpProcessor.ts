
import * as posedetection from '@tensorflow-models/pose-detection';
import { calculateAngle } from '@/lib/poseUtils';
import { RepState, PoseData, ProcessorResult } from '@/lib/types';

interface JumpProcessorParams {
  keypoints: posedetection.Keypoint[];
  repState: RepState;
  internalReps: number;
  lastRepIssues: string[];
  jumpGroundLevel: number;
}

export const processJumps = ({ keypoints, repState, internalReps, lastRepIssues, jumpGroundLevel }: JumpProcessorParams): Omit<ProcessorResult, 'feedback'> & { feedback?: string } | null => {
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
        let currentRepScore = 100;
        const currentIssues: string[] = [];
        let feedback: string;

        if (leftKneeAngle > 160 || rightKneeAngle > 160) {
            currentIssues.push('stiff_landing');
            feedback = "Bend your knees when you land!";
            currentRepScore -= 40;
        } else {
            feedback = "Nice landing!";
        }
        
        const repCompletionData = {
            score: Math.max(0, currentRepScore),
            issues: [...new Set(currentIssues)],
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
