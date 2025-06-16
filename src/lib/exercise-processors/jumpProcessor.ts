
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
            feedback: "Exploding upward! Keep going!"
        };
    } else if (repState === 'AIRBORNE' && !isAirborne) {
        const currentIssues: string[] = [];
        let feedback: string;

        // Enhanced scoring for jump height with more granular feedback
        const jumpHeight = peakAirborneY ? jumpGroundLevel - peakAirborneY : 0;
        let heightScore = 0;
        let heightFeedback = "";
        
        if (jumpHeight >= 80) {
            heightScore = 100;
            heightFeedback = "Incredible height!";
        } else if (jumpHeight >= 60) {
            heightScore = 85;
            heightFeedback = "Great jump height!";
        } else if (jumpHeight >= 40) {
            heightScore = 70;
            heightFeedback = "Good height!";
        } else if (jumpHeight >= 25) {
            heightScore = 50;
            heightFeedback = "Decent jump!";
            currentIssues.push('low_jump');
        } else {
            heightScore = 25;
            heightFeedback = "Try to jump higher!";
            currentIssues.push('low_jump');
        }

        // Enhanced landing analysis
        const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
        const kneeAngleAsymmetry = Math.abs(leftKneeAngle - rightKneeAngle);
        let landingScore = 0;
        let landingFeedback = "";

        // Primary landing quality based on knee flexion
        if (avgKneeAngle < 120) {
            landingScore = 100;
            landingFeedback = "Perfect soft landing!";
        } else if (avgKneeAngle < 140) {
            landingScore = 85;
            landingFeedback = "Good landing technique!";
        } else if (avgKneeAngle < 160) {
            landingScore = 60;
            landingFeedback = "Bend your knees more on landing.";
        } else {
            landingScore = 30;
            landingFeedback = "Much softer landing needed!";
            currentIssues.push('stiff_landing');
        }

        // Penalize asymmetric landings
        if (kneeAngleAsymmetry > 20) {
            landingScore = Math.max(30, landingScore - 20);
            landingFeedback += " Keep both legs even.";
            currentIssues.push('asymmetric_landing');
        }

        // Power and consistency bonus (for subsequent jumps)
        let powerBonus = 0;
        if (internalReps >= 3) {
            // Bonus for maintaining height across multiple jumps
            if (jumpHeight >= 50) {
                powerBonus = 10;
                heightFeedback += " Great power endurance!";
            }
        }

        // Combined feedback priority: height > landing > power
        if (jumpHeight >= 60) {
            feedback = heightFeedback + (landingScore < 70 ? ` ${landingFeedback}` : "");
        } else if (landingScore >= 85) {
            feedback = landingFeedback + ` ${heightFeedback}`;
        } else {
            feedback = `${heightFeedback} ${landingFeedback}`;
        }
        
        // Calculate final score: 60% height, 35% landing, 5% power bonus
        const currentRepScore = Math.min(100, Math.round((heightScore * 0.6) + (landingScore * 0.35) + powerBonus));
        
        const repCompletionData = {
            score: Math.max(0, currentRepScore),
            issues: [...new Set(currentIssues)],
            details: {
                jumpHeight,
                landingKneeFlexion: avgKneeAngle,
                asymmetry: kneeAngleAsymmetry,
                powerScore: heightScore,
                landingScore: landingScore
            } as JumpRepDetails & { asymmetry: number; powerScore: number; landingScore: number }
        };

        return {
            ...baseResult,
            newRepState: 'GROUNDED',
            isRepCompleted: true,
            repCompletionData,
            feedback,
            aiFeedbackPayload: { 
                reps: internalReps + 1, 
                formIssues: lastRepIssues,
                jumpHeight,
                landingQuality: avgKneeAngle,
                powerLevel: heightScore >= 70 ? 'high' : heightScore >= 50 ? 'medium' : 'low'
            }
        };
    }

    return baseResult;
};
