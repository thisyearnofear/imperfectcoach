import type { Keypoint } from '@tensorflow-models/pose-detection';
import * as posedetection from '@tensorflow-models/pose-detection';
import { Exercise } from './types';

// --- CONFIGURATION ---

const KEYPOINT_CONFIDENCE_COLORS = {
  high: 'rgba(0, 255, 0, 1)',    // green for score > 0.75
  medium: 'rgba(255, 255, 0, 1)', // yellow for 0.5 < score <= 0.75
  low: 'rgba(255, 0, 0, 1)',      // red for score <= 0.5
};

const BODY_PART_CONNECTIONS: Record<string, [string, string]> = {
  torso_1: ['left_shoulder', 'right_shoulder'],
  torso_2: ['left_hip', 'right_hip'],
  torso_3: ['left_shoulder', 'left_hip'],
  torso_4: ['right_shoulder', 'right_hip'],
  left_arm_1: ['left_shoulder', 'left_elbow'],
  left_arm_2: ['left_elbow', 'left_wrist'],
  right_arm_1: ['right_shoulder', 'right_elbow'],
  right_arm_2: ['right_elbow', 'right_wrist'],
  left_leg_1: ['left_hip', 'left_knee'],
  left_leg_2: ['left_knee', 'left_ankle'],
  right_leg_1: ['right_hip', 'right_knee'],
  right_leg_2: ['right_knee', 'right_ankle'],
};

const BODY_PART_COLORS: Record<string, string> = {
  torso: 'rgba(255, 255, 255, 0.9)', // white
  left_arm: 'rgba(0, 255, 255, 0.9)',   // cyan
  right_arm: 'rgba(0, 255, 255, 0.9)',  // cyan
  left_leg: 'rgba(0, 150, 255, 0.9)',  // blue - better contrast
  right_leg: 'rgba(255, 150, 0, 0.9)', // orange - better contrast
};

const EXERCISE_HIGHLIGHT_JOINTS: Record<Exercise, string[]> = {
  'pull-ups': ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist', 'nose'],
  'jumps': ['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'],
};

const MIN_CONFIDENCE_TO_DRAW = 0.3;

// --- DRAWING HELPERS ---

function getKeypoint(keypoints: Keypoint[], name: string): Keypoint | undefined {
  return keypoints.find(k => k.name === name);
}

function drawFormZone(ctx: CanvasRenderingContext2D, keypoints: Keypoint[], exercise: Exercise) {
  if (exercise === 'pull-ups') {
    const leftWrist = getKeypoint(keypoints, 'left_wrist');
    const rightWrist = getKeypoint(keypoints, 'right_wrist');
    const leftShoulder = getKeypoint(keypoints, 'left_shoulder');
    const rightShoulder = getKeypoint(keypoints, 'right_shoulder');
    const leftElbow = getKeypoint(keypoints, 'left_elbow');
    const rightElbow = getKeypoint(keypoints, 'right_elbow');
    const nose = getKeypoint(keypoints, 'nose');

    if (leftWrist && rightWrist && leftShoulder && leftWrist.score > MIN_CONFIDENCE_TO_DRAW && rightWrist.score > MIN_CONFIDENCE_TO_DRAW && leftShoulder.score > MIN_CONFIDENCE_TO_DRAW) {
      const avgWristY = (leftWrist.y + rightWrist.y) / 2;
      const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
      const isHanging = avgWristY < avgShoulderY;

      if (isHanging) {
        // Top of range (chin over bar) - Green line at wrist level
        const topY = avgWristY;
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
        ctx.lineWidth = 4;
        ctx.setLineDash([15, 8]);
        ctx.beginPath();
        ctx.moveTo(0, topY);
        ctx.lineTo(ctx.canvas.width, topY);
        ctx.stroke();

        // Add subtle label
        ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Chin target', 10, topY - 8);

        // Bottom of range (full extension) - Yellow line
        // Calculate based on arm length for more accuracy
        if (leftElbow && rightElbow) {
          const avgElbowY = (leftElbow.y + rightElbow.y) / 2;
          const armLength = avgElbowY - avgWristY;
          const bottomY = avgShoulderY + armLength * 0.95; // 95% extension estimate

          ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, bottomY);
          ctx.lineTo(ctx.canvas.width, bottomY);
          ctx.stroke();

          // Add subtle label
          ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
          ctx.fillText('Full extension', 10, bottomY + 18);
        }

        ctx.setLineDash([]); // Reset line dash

        // Visual feedback if chin is over bar
        if (nose && nose.score > MIN_CONFIDENCE_TO_DRAW && nose.y < topY) {
          // Draw success indicator around nose
          ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(nose.x, nose.y, 15, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
    }
  } else if (exercise === 'jumps') {
    // Jump form zones for ground level and optimal jump height
    const leftAnkle = getKeypoint(keypoints, 'left_ankle');
    const rightAnkle = getKeypoint(keypoints, 'right_ankle');
    const leftKnee = getKeypoint(keypoints, 'left_knee');
    const rightKnee = getKeypoint(keypoints, 'right_knee');
    const leftHip = getKeypoint(keypoints, 'left_hip');
    const rightHip = getKeypoint(keypoints, 'right_hip');

    if (leftAnkle && rightAnkle && leftAnkle.score > MIN_CONFIDENCE_TO_DRAW && rightAnkle.score > MIN_CONFIDENCE_TO_DRAW) {
      // Ground level - where feet should be before jump
      const avgAnkleY = Math.min(leftAnkle.y, rightAnkle.y); // Use minimum Y (highest point)
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.7)'; // Red for ground level
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(0, avgAnkleY);
      ctx.lineTo(ctx.canvas.width, avgAnkleY);
      ctx.stroke();

      // Add label for ground level
      ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Ground level', 10, avgAnkleY - 8);

      // Optimal takeoff height - slightly above ground (for form check)
      const takeoffLineY = avgAnkleY - 30;
      if (takeoffLineY > 0) { // Ensure it's on the canvas
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)'; // Yellow for takeoff zone
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, takeoffLineY);
        ctx.lineTo(ctx.canvas.width, takeoffLineY);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
        ctx.fillText('Takeoff zone', 10, takeoffLineY - 8);
      }

      // Landing zone - where feet should be after landing
      const landingLineY = avgAnkleY + 30;
      if (landingLineY < ctx.canvas.height) { // Ensure it's on the canvas
        ctx.strokeStyle = 'rgba(100, 255, 100, 0.5)'; // Green for landing zone
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, landingLineY);
        ctx.lineTo(ctx.canvas.width, landingLineY);
        ctx.stroke();

        ctx.fillStyle = 'rgba(100, 255, 100, 0.9)';
        ctx.fillText('Landing zone', 10, landingLineY + 18);
      }

      ctx.setLineDash([]); // Reset line dash

      // Visual feedback for proper jump form during takeoff
      if (leftKnee && rightKnee && leftHip && rightHip) {
        // Check for proper knee bend before takeoff
        const avgKneeY = (leftKnee.y + rightKnee.y) / 2;
        const avgHipY = (leftHip.y + rightHip.y) / 2;

        // If knees are bent appropriately (preparation phase)
        if (avgKneeY < avgAnkleY - 20) {
          // Draw success indicator for proper preparation posture
          const hipCenterX = (leftHip.x + rightHip.x) / 2;
          const hipCenterY = (leftHip.y + rightHip.y) / 2;

          ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(hipCenterX, hipCenterY, 20, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
    }
  }
}

function drawFormQualityOverlay(ctx: CanvasRenderingContext2D, score: number, pulse: boolean, isCalibrating: boolean = false) {
  // CLEAN: Skip overlay entirely during calibration phase
  if (isCalibrating) return;
  
  if (score >= 95 && !pulse) return; // No overlay for near-perfect score
  const quality = Math.max(0, Math.min(1, score / 100));
  
  const red = Math.round(255 * (1 - quality));
  const green = Math.round(255 * quality);
  const baseAlpha = 0.1 + (0.2 * (1 - quality));

  // Pulse effect only for mid-rep form issues
  if (pulse) {
    const pulseIntensity = Math.abs(Math.sin(Date.now() / 150)); // Fast pulse
    const pulseAlpha = Math.max(baseAlpha, 0.3 + pulseIntensity * 0.3);
    ctx.fillStyle = `rgba(255, 0, 0, ${pulseAlpha})`;
  } else {
    ctx.fillStyle = `rgba(${red}, ${green}, 0, ${baseAlpha})`;
  }

  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  if(score < 50) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('POOR FORM', ctx.canvas.width / 2, 40);
  }
}

function drawTrajectoryTrails(ctx: CanvasRenderingContext2D, history: Keypoint[][], exercise: Exercise) {
  const jointsToTrack = EXERCISE_HIGHLIGHT_JOINTS[exercise];
  if (!history || history.length < 2) return;

  jointsToTrack.forEach(jointName => {
    for (let i = 1; i < history.length; i++) {
      const prevFrame = history[i - 1];
      const currentFrame = history[i];
      const prevPoint = prevFrame.find(k => k.name === jointName);
      const currentPoint = currentFrame.find(k => k.name === jointName);

      if (prevPoint && currentPoint && prevPoint.score > MIN_CONFIDENCE_TO_DRAW && currentPoint.score > MIN_CONFIDENCE_TO_DRAW) {
        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(0, 255, 255, ${i / history.length * 0.7})`; // Fading cyan
        ctx.stroke();
      }
    }
  });
}

function drawSkeletonWithColors(ctx: CanvasRenderingContext2D, keypoints: Keypoint[]) {
  ctx.lineWidth = 4;

  for (const part of Object.keys(BODY_PART_CONNECTIONS)) {
    const [p1_name, p2_name] = BODY_PART_CONNECTIONS[part];
    const colorKey = part.split('_')[0];
    ctx.strokeStyle = BODY_PART_COLORS[colorKey] || 'white';
    
    const p1 = getKeypoint(keypoints, p1_name);
    const p2 = getKeypoint(keypoints, p2_name);

    if (p1 && p2 && p1.score > MIN_CONFIDENCE_TO_DRAW && p2.score > MIN_CONFIDENCE_TO_DRAW) {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }
}

function drawKeypointsWithConfidence(ctx: CanvasRenderingContext2D, keypoints: Keypoint[], exercise: Exercise) {
  const highlightedJoints = EXERCISE_HIGHLIGHT_JOINTS[exercise];

  keypoints.forEach(keypoint => {
    if (keypoint.score && keypoint.score > MIN_CONFIDENCE_TO_DRAW) {
      const score = keypoint.score;
      let color = KEYPOINT_CONFIDENCE_COLORS.low;
      if (score > 0.75) color = KEYPOINT_CONFIDENCE_COLORS.high;
      else if (score > 0.5) color = KEYPOINT_CONFIDENCE_COLORS.medium;
      
      let radius = 5;
      
      // Special treatment for jump exercise critical points
      if (exercise === 'jumps' && keypoint.name) {
        if (keypoint.name.includes('hip')) {
          radius = 12; // Larger for hips - most critical for jump detection
          ctx.fillStyle = 'rgba(255, 100, 100, 0.4)';
          ctx.beginPath();
          ctx.arc(keypoint.x, keypoint.y, radius + Math.sin(Date.now() / 150) * 4, 0, 2 * Math.PI);
          ctx.fill();
        } else if (keypoint.name.includes('ankle')) {
          radius = 10; // Important for ground detection
          ctx.fillStyle = 'rgba(100, 255, 100, 0.4)';
          ctx.beginPath();
          ctx.arc(keypoint.x, keypoint.y, radius + Math.sin(Date.now() / 180) * 3, 0, 2 * Math.PI);
          ctx.fill();
        } else if (keypoint.name.includes('knee')) {
          radius = 8; // Medium importance
          ctx.fillStyle = 'rgba(100, 100, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(keypoint.x, keypoint.y, radius + Math.sin(Date.now() / 220) * 2, 0, 2 * Math.PI);
          ctx.fill();
        }
      } else if (highlightedJoints.includes(keypoint.name || '')) {
        radius = 10;
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, radius + Math.sin(Date.now() / 200) * 3, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Draw main keypoint
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(keypoint.x, keypoint.y, radius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add keypoint name labels for jump exercise during calibration
      if (exercise === 'jumps' && highlightedJoints.includes(keypoint.name || '')) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        const labelY = keypoint.name?.includes('hip') ? keypoint.y - 20 : keypoint.y + 20;
        ctx.fillText(keypoint.name?.replace('_', ' ') || '', keypoint.x, labelY);
      }
    }
  });
}

function drawJumpCalibrationGuide(ctx: CanvasRenderingContext2D, keypoints: Keypoint[], calibrationProgress: number, isStable: boolean, kneeAngle: number, minKneeAngle: number) {
  const leftHip = getKeypoint(keypoints, 'left_hip');
  const rightHip = getKeypoint(keypoints, 'right_hip');
  const leftKnee = getKeypoint(keypoints, 'left_knee');
  const rightKnee = getKeypoint(keypoints, 'right_knee');
  const leftAnkle = getKeypoint(keypoints, 'left_ankle');
  const rightAnkle = getKeypoint(keypoints, 'right_ankle');

  if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) return;

  const allVisible = [leftHip, rightHip, leftKnee, rightKnee, leftAnkle, rightAnkle]
    .every(k => k.score > 0.3);
  
  if (!allVisible) return;

  // Draw stability zones around key points
  const stabilityRadius = 25; // pixels
  const points = [
    { point: leftAnkle, name: 'Left Ankle' },
    { point: rightAnkle, name: 'Right Ankle' },
    { point: leftHip, name: 'Left Hip' },
    { point: rightHip, name: 'Right Hip' }
  ];

  points.forEach(({ point, name }) => {
    // Stability circle
    ctx.strokeStyle = isStable ? 'rgba(0, 255, 0, 0.6)' : 'rgba(255, 165, 0, 0.6)';
    ctx.fillStyle = isStable ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 165, 0, 0.1)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(point.x, point.y, stabilityRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Point label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(name, point.x, point.y - stabilityRadius - 10);
  });

  // Draw leg angle indicators
  const legCenterX = (leftHip.x + rightHip.x) / 2;
  const legCenterY = (leftKnee.y + rightKnee.y) / 2;
  
  // Knee angle status
  const angleColor = kneeAngle >= minKneeAngle ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 100, 100, 0.8)';
  ctx.fillStyle = angleColor;
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Knee Angle: ${Math.round(kneeAngle)}°`, legCenterX, legCenterY - 30);
  ctx.fillText(`Target: ${minKneeAngle}°+`, legCenterX, legCenterY - 10);

  // Draw calibration progress bar
  const barWidth = 200;
  const barHeight = 20;
  const barX = ctx.canvas.width / 2 - barWidth / 2;
  const barY = 50;

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);
  
  // Progress bar background
  ctx.fillStyle = 'rgba(60, 60, 60, 0.8)';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  
  // Progress fill
  const progressColor = calibrationProgress >= 100 ? 'rgba(0, 255, 0, 0.8)' : 'rgba(0, 150, 255, 0.8)';
  ctx.fillStyle = progressColor;
  ctx.fillRect(barX, barY, (barWidth * calibrationProgress) / 100, barHeight);
  
  // Progress text
  ctx.fillStyle = 'rgba(255, 255, 255, 1)';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Calibration: ${Math.round(calibrationProgress)}%`, barX + barWidth / 2, barY + 14);

  // Status text
  let statusText = 'Move less and stand straighter';
  let statusColor = 'rgba(255, 100, 100, 1)';
  
  if (calibrationProgress >= 100) {
    statusText = '✓ Perfect! Ready to jump!';
    statusColor = 'rgba(0, 255, 0, 1)';
  } else if (isStable && kneeAngle >= minKneeAngle) {
    statusText = 'Great pose! Hold still...';
    statusColor = 'rgba(0, 200, 0, 1)';
  } else if (isStable) {
    statusText = 'Stand straighter!';
    statusColor = 'rgba(255, 165, 0, 1)';
  } else if (kneeAngle >= minKneeAngle) {
    statusText = 'Good angle! Stay still!';
    statusColor = 'rgba(255, 165, 0, 1)';
  }

  ctx.fillStyle = statusColor;
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(statusText, ctx.canvas.width / 2, barY + 50);
}

function drawJumpHeightIndicators(ctx: CanvasRenderingContext2D, keypoints: Keypoint[], jumpGroundLevel?: number, currentHeight?: number) {
  if (!jumpGroundLevel || currentHeight === undefined) return;

  const leftAnkle = getKeypoint(keypoints, 'left_ankle');
  const rightAnkle = getKeypoint(keypoints, 'right_ankle');
  
  if (!leftAnkle || !rightAnkle || leftAnkle.score < MIN_CONFIDENCE_TO_DRAW || rightAnkle.score < MIN_CONFIDENCE_TO_DRAW) return;

  const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;
  const isAirborne = avgAnkleY < jumpGroundLevel - 30;

  // Draw ground level line
  ctx.strokeStyle = 'rgba(100, 100, 100, 0.8)';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 5]);
  ctx.beginPath();
  ctx.moveTo(0, jumpGroundLevel);
  ctx.lineTo(ctx.canvas.width, jumpGroundLevel);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw height indicator
  if (isAirborne && currentHeight > 0) {
    const heightY = jumpGroundLevel - currentHeight;
    
    // Height line
    ctx.strokeStyle = 'rgba(0, 255, 100, 0.9)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, heightY);
    ctx.lineTo(ctx.canvas.width, heightY);
    ctx.stroke();

    // Height text
    ctx.fillStyle = 'rgba(0, 255, 100, 0.9)';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.round(currentHeight)}px`, 10, heightY - 10);
  }

  // Draw landing quality indicator
  if (!isAirborne) {
    const leftKnee = getKeypoint(keypoints, 'left_knee');
    const rightKnee = getKeypoint(keypoints, 'right_knee');
    const leftHip = getKeypoint(keypoints, 'left_hip');
    const rightHip = getKeypoint(keypoints, 'right_hip');

    if (leftKnee && rightKnee && leftHip && rightHip && 
        [leftKnee, rightKnee, leftHip, rightHip].every(k => k.score > MIN_CONFIDENCE_TO_DRAW)) {
      
      // Calculate knee angles for landing quality
      const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
      const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
      const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

      // Draw landing quality circle around feet
      let landingColor = 'rgba(255, 0, 0, 0.6)'; // Poor
      if (avgKneeAngle < 120) landingColor = 'rgba(0, 255, 0, 0.6)'; // Perfect
      else if (avgKneeAngle < 140) landingColor = 'rgba(255, 255, 0, 0.6)'; // Good

      const footCenterX = (leftAnkle.x + rightAnkle.x) / 2;
      const footCenterY = (leftAnkle.y + rightAnkle.y) / 2;

      ctx.strokeStyle = landingColor;
      ctx.fillStyle = landingColor.replace('0.6', '0.2');
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(footCenterX, footCenterY, 60, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  }
}

function calculateAngle(point1: Keypoint, point2: Keypoint, point3: Keypoint): number {
  const radians = Math.atan2(point3.y - point2.y, point3.x - point2.x) - 
                  Math.atan2(point1.y - point2.y, point1.x - point2.x);
  let angle = Math.abs(radians * 180 / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

// --- MAIN DRAWING FUNCTION ---

export const drawPose = (
  ctx: CanvasRenderingContext2D,
  pose: posedetection.Pose,
  exercise: Exercise,
  formScore: number,
  keypointHistory: Keypoint[][],
  pulseWarning: boolean,
  jumpGroundLevel?: number,
  currentJumpHeight?: number,
  renderParticleEffects?: (ctx: CanvasRenderingContext2D) => void,
  jumpCalibrationData?: {
    calibrationProgress: number;
    isStable: boolean;
    kneeAngle: number;
    minKneeAngle: number;
    isCalibrating: boolean;
    isInitializing?: boolean;
  }
) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  if (!pose) return;

  const { keypoints } = pose;

  // Render particle effects first (behind everything)
  if (renderParticleEffects) {
    renderParticleEffects(ctx);
  }

  // ENHANCEMENT FIRST: Only show form quality feedback during active jumping, not calibration/initialization
  const isCalibrating = jumpCalibrationData?.isCalibrating ?? false;
  const isInitializing = jumpCalibrationData?.isInitializing ?? false;
  drawFormQualityOverlay(ctx, formScore, pulseWarning && !isCalibrating && !isInitializing, isCalibrating || isInitializing);
  drawFormZone(ctx, keypoints, exercise);
  
  // Draw jump-specific indicators
  if (exercise === 'jumps') {
    // Show calibration guide during setup phase
    if (jumpCalibrationData?.isCalibrating) {
      drawJumpCalibrationGuide(
        ctx, 
        keypoints, 
        jumpCalibrationData.calibrationProgress,
        jumpCalibrationData.isStable,
        jumpCalibrationData.kneeAngle,
        jumpCalibrationData.minKneeAngle
      );
    } else {
      // Show normal jump indicators during actual jumping
      drawJumpHeightIndicators(ctx, keypoints, jumpGroundLevel, currentJumpHeight);
    }
  }
  
  drawTrajectoryTrails(ctx, keypointHistory, exercise);
  drawSkeletonWithColors(ctx, keypoints);
  drawKeypointsWithConfidence(ctx, keypoints, exercise);
};
