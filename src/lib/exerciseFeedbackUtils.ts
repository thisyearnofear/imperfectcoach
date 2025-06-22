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
    calibrationFrames: React.MutableRefObject<number>,
    videoDimensions: { width: number, height: number }
): string {
    const keypointsMap = new Map(keypoints.map(k => [k.name, k]));

    const requiredKeypoints = ['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle', 'left_shoulder', 'right_shoulder'];
    const visibleKeypoints = requiredKeypoints.filter(name => (keypointsMap.get(name)?.score ?? 0) > 0.5);

    if (visibleKeypoints.length < requiredKeypoints.length) {
        const missingKeypoints = requiredKeypoints.filter(name => !visibleKeypoints.includes(name));
        return `Stand in full view. Missing: ${missingKeypoints.join(', ').replace(/_/g, ' ')}.`;
    }

    const leftHip = keypointsMap.get('left_hip')!;
    const rightHip = keypointsMap.get('right_hip')!;
    const leftKnee = keypointsMap.get('left_knee')!;
    const rightKnee = keypointsMap.get('right_knee')!;
    const leftAnkle = keypointsMap.get('left_ankle')!;
    const rightAnkle = keypointsMap.get('right_ankle')!;
    const leftShoulder = keypointsMap.get('left_shoulder')!;
    const rightShoulder = keypointsMap.get('right_shoulder')!;

    // Centering and positioning feedback
    const bodyCenterX = (leftShoulder.x + rightShoulder.x) / 2;
    const frameCenterX = videoDimensions.width / 2;
    const horizontalOffset = Math.abs(bodyCenterX - frameCenterX);

    if (horizontalOffset > videoDimensions.width * 0.2) {
        return `Move ${bodyCenterX < frameCenterX ? 'right' : 'left'} to center yourself in the frame.`;
    }

    const bodyHeight = Math.abs(leftShoulder.y - leftAnkle.y);
    if (bodyHeight < videoDimensions.height * 0.5) {
        return "Move closer to the camera so I can see you better.";
    }

    if (jumpGroundLevel.current === null) {
        const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
        const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
        const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

        if (avgKneeAngle < 165) {
            calibrationFrames.current = 0;
            return "Stand up straighter to calibrate your starting position.";
        }

        const footDistance = Math.abs(leftAnkle.x - rightAnkle.x);
        const shoulderDistance = Math.abs(leftShoulder.x - rightShoulder.x);
        
        if (footDistance < shoulderDistance * 0.6 || footDistance > shoulderDistance * 1.4) {
            calibrationFrames.current = 0;
            return "Place your feet about shoulder-width apart.";
        }

        calibrationFrames.current += 1;
        const calibrationProgress = Math.round((calibrationFrames.current / 30) * 100);
        
        if (calibrationFrames.current < 30) {
            return `Hold still... Calibrating: ${calibrationProgress}%`;
        }

        jumpGroundLevel.current = (leftAnkle.y + rightAnkle.y) / 2;
        return "Calibrated! Crouch down and explode up!";
    }

    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

    if (avgKneeAngle < 90) {
        return "Perfect crouch! Explode up!";
    } else if (avgKneeAngle < 120) {
        return "Good crouch! Jump!";
    } else if (avgKneeAngle < 150) {
        return "Crouch a bit deeper, then jump!";
    } else {
        return "Ready! Crouch, then explode upward!";
    }
}
