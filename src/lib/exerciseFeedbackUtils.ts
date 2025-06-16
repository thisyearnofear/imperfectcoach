
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

export function getJumpReadyFeedback(
    keypoints: posedetection.Keypoint[], 
    jumpGroundLevel: React.MutableRefObject<number | null>,
    calibrationFrames: React.MutableRefObject<number>
): string {
    const leftHip = keypoints.find(k => k.name === 'left_hip');
    const rightHip = keypoints.find(k => k.name === 'right_hip');
    const leftKnee = keypoints.find(k => k.name === 'left_knee');
    const rightKnee = keypoints.find(k => k.name === 'right_knee');
    const leftAnkle = keypoints.find(k => k.name === 'left_ankle');
    const rightAnkle = keypoints.find(k => k.name === 'right_ankle');
    const leftShoulder = keypoints.find(k => k.name === 'left_shoulder');
    const rightShoulder = keypoints.find(k => k.name === 'right_shoulder');

    // Check if all essential keypoints are visible
    const allKeypointsVisible = leftHip?.score > 0.5 && rightHip?.score > 0.5 && 
                               leftKnee?.score > 0.5 && rightKnee?.score > 0.5 &&
                               leftAnkle?.score > 0.5 && rightAnkle?.score > 0.5 &&
                               leftShoulder?.score > 0.5 && rightShoulder?.score > 0.5;

    if (!allKeypointsVisible) {
        return "Stand in full view of the camera. Make sure your whole body is visible.";
    }

    // If not calibrated yet, start calibration process
    if (jumpGroundLevel.current === null) {
        // Calculate body angles for posture analysis
        const leftKneeAngle = calculateAngle(leftHip!, leftKnee!, leftAnkle!);
        const rightKneeAngle = calculateAngle(rightHip!, rightKnee!, leftAnkle!);
        const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

        // Check for good standing posture
        if (avgKneeAngle < 160) {
            calibrationFrames.current = 0;
            return "Stand up straight with your legs extended to calibrate your starting position.";
        }

        // Check foot positioning
        const footDistance = Math.abs(leftAnkle!.x - rightAnkle!.x);
        const shoulderDistance = Math.abs(leftShoulder!.x - rightShoulder!.x);
        
        if (footDistance < shoulderDistance * 0.7) {
            calibrationFrames.current = 0;
            return "Spread your feet to about shoulder-width apart for better stability.";
        }

        // Good posture detected, start calibration countdown
        calibrationFrames.current += 1;
        
        if (calibrationFrames.current < 30) { // ~1 second at 30fps
            return "Hold this position while I calibrate your ground level...";
        }

        // Calibration complete
        jumpGroundLevel.current = (leftAnkle!.y + rightAnkle!.y) / 2;
        return "Calibration complete! You're ready to jump. Crouch down and explode upward!";
    }

    // Already calibrated - provide jump preparation feedback
    const currentAnkleY = (leftAnkle!.y + rightAnkle!.y) / 2;
    const leftKneeAngle = calculateAngle(leftHip!, leftKnee!, leftAnkle!);
    const rightKneeAngle = calculateAngle(rightHip!, rightKnee!, rightAnkle!);
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

    // Enhanced feedback based on crouch depth and preparation
    if (avgKneeAngle < 90) {
        return "Perfect deep crouch! Now explode upward with maximum power!";
    } else if (avgKneeAngle < 120) {
        return "Great crouch! Drive through your legs and jump as high as you can!";
    } else if (avgKneeAngle < 150) {
        return "Good preparation! Crouch a bit deeper, then explode upward!";
    } else {
        return "Ready to jump! Crouch down first, then explode upward for maximum height!";
    }
}
