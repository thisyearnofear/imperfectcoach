
import * as posedetection from '@tensorflow-models/pose-detection';
import { calculateAngle } from '@/lib/poseUtils';

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
        "Push the ground away!"
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

export function getPullupReadyFeedback(keypoints: posedetection.Keypoint[]): string {
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

export function getJumpReadyFeedback(keypoints: posedetection.Keypoint[], jumpGroundLevel: React.MutableRefObject<number | null>): string {
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
