
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
  jumpData: {y: number, time: number}[];
  flightData: {shoulderX: number, hipX: number}[];
}

export const processJumps = ({ keypoints, internalReps, lastRepIssues, jumpGroundLevel, peakAirborneY, jumpData, flightData }: JumpProcessorParams): Omit<ProcessorResult, 'feedback'> & { feedback?: string } | null => {
    const leftHip = keypoints.find(k => k.name === 'left_hip');
    const rightHip = keypoints.find(k => k.name === 'right_hip');
    const leftKnee = keypoints.find(k => k.name === 'left_knee');
    const rightKnee = keypoints.find(k => k.name === 'right_knee');
    const leftAnkle = keypoints.find(k => k.name === 'left_ankle');
    const rightAnkle = keypoints.find(k => k.name === 'right_ankle');

    if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle ||
        [leftHip, rightHip, leftKnee, rightKnee, leftAnkle, rightAnkle].some(k => (k?.score ?? 0) < 0.5)) {
        return {
            feedback: "Make sure your full body is in view to analyze the jump!",
            isRepCompleted: false,
            poseData: { keypoints }
        };
    }
      
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    const poseData: PoseData = { keypoints, leftKneeAngle, rightKneeAngle };

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

    // Explosiveness Analysis
    let explosivenessScore = 0;
    let explosivenessFeedback = "";
    if (jumpData.length > 2) {
        const takeOffData = jumpData.slice(-5); // Analyze the last few frames before landing
        const start = takeOffData[0];
        const end = takeOffData[takeOffData.length - 1];
        const velocity = (end.y - start.y) / (end.time - start.time); // pixels per millisecond

        if (velocity < -2.5) { // High velocity upwards (y decreases)
            explosivenessScore = 100;
            explosivenessFeedback = "Incredibly explosive jump!";
        } else if (velocity < -1.8) {
            explosivenessScore = 85;
            explosivenessFeedback = "Very explosive!";
        } else {
            explosivenessScore = 60;
            explosivenessFeedback = "Good explosion off the ground.";
        }
    }

    // Flight Symmetry Analysis
    let flightSymmetryScore = 100;
    let flightSymmetryFeedback = "";
    if(flightData.length > 1) {
        const horizontalDrift = Math.abs(flightData[0].shoulderX - flightData[flightData.length - 1].shoulderX);
        if (horizontalDrift > 15) {
            flightSymmetryScore = 60;
            flightSymmetryFeedback = "Try to keep your body straight while jumping.";
            currentIssues.push('flight_drift');
        }
    }

    // Landing Impact Analysis
    const landingData = jumpData.slice(-5);
    const landingVelocity = (landingData[landingData.length - 1].y - landingData[0].y) / (landingData[landingData.length - 1].time - landingData[0].time);
    if (landingVelocity > 2.0) { // High velocity downwards
        landingScore = Math.max(30, landingScore - 20);
        landingFeedback += " Control your landing more.";
        currentIssues.push('hard_landing');
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
    
    // Calculate final score: 40% height, 25% landing, 15% explosiveness, 15% symmetry, 5% power bonus
    const currentRepScore = Math.min(100, Math.round((heightScore * 0.4) + (landingScore * 0.25) + (explosivenessScore * 0.15) + (flightSymmetryScore * 0.15) + powerBonus));
    
    const repCompletionData = {
        score: Math.max(0, currentRepScore),
        issues: [...new Set(currentIssues)],
        details: {
            jumpHeight,
            landingKneeFlexion: avgKneeAngle,
            asymmetry: kneeAngleAsymmetry,
            powerScore: heightScore,
            landingScore: landingScore,
            explosiveness: explosivenessScore,
            flightSymmetry: flightSymmetryScore,
        } as JumpRepDetails & { asymmetry: number; powerScore: number; landingScore: number; explosiveness: number, flightSymmetry: number }
    };

    return {
        newRepState: 'GROUNDED',
        isRepCompleted: true,
        poseData,
        repCompletionData,
        feedback,
        aiFeedbackPayload: {
            reps: internalReps + 1,
            formIssues: lastRepIssues,
            jumpHeight,
            landingQuality: avgKneeAngle,
            powerLevel: heightScore >= 70 ? 'high' : heightScore >= 50 ? 'medium' : 'low',
            explosiveness: explosivenessScore,
            flightSymmetry: flightSymmetryScore
        }
    };
};
