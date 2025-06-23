import * as posedetection from '@tensorflow-models/pose-detection';
import { calculateAngle } from '@/lib/pose-analysis';

export const cachedFeedback: Record<string, string[]> = {
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
    low_jump: [
        "Explode upwards!",
        "Try to jump higher.",
        "Push the ground away!",
        "Drive through your legs!"
    ],
    asymmetric_landing: [
        "Land with both feet evenly.",
        "Keep your landing balanced.",
        "Focus on symmetrical form."
    ],
    power_endurance: [
        "Maintain that power!",
        "Keep the intensity up!",
        "Strong finish!"
    ],
    general: [
        "Keep up the great work!",
        "Nice form!",
        "You're doing great!"
    ]
};

export const getRandomFeedback = (issues: string[]): string => {
    const relevantIssues = issues.filter(issue => issue in cachedFeedback);
    const issue = relevantIssues.length > 0 ? relevantIssues[Math.floor(Math.random() * relevantIssues.length)] : 'general';
    const messages = cachedFeedback[issue as keyof typeof cachedFeedback] || cachedFeedback.general;
    return messages[Math.floor(Math.random() * messages.length)];
}

// DEPRECATED: This function has been replaced by PoseReadinessSystem
// Keeping for backward compatibility but should not be used in new code
export function getPullupReadyFeedback(keypoints: posedetection.Keypoint[]): string {
    console.warn('getPullupReadyFeedback is deprecated. Use PoseReadinessSystem instead.');
    return "Position yourself in view of the camera.";
}

// DEPRECATED: This function has been replaced by PoseReadinessSystem
// Keeping for backward compatibility but should not be used in new code
export function getJumpReadyFeedback(
    keypoints: posedetection.Keypoint[], 
    jumpGroundLevel: React.MutableRefObject<number | null>,
    calibrationFrames: React.MutableRefObject<number>,
    videoDimensions: { width: number, height: number }
): string {
    console.warn('getJumpReadyFeedback is deprecated. Use PoseReadinessSystem instead.');
    return "Position yourself in view of the camera.";
}
