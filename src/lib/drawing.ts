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
  left_leg: 'rgba(255, 0, 255, 0.9)',  // magenta
  right_leg: 'rgba(255, 0, 255, 0.9)', // magenta
};

const EXERCISE_HIGHLIGHT_JOINTS: Record<Exercise, string[]> = {
  'pull-ups': ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist', 'nose'],
  'squats': ['left_hip', 'right_hip', 'left_knee', 'right_knee'],
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

    if (leftWrist && rightWrist && leftShoulder && leftWrist.score > MIN_CONFIDENCE_TO_DRAW && rightWrist.score > MIN_CONFIDENCE_TO_DRAW && leftShoulder.score > MIN_CONFIDENCE_TO_DRAW) {
      // Top of range (chin over bar) - Green line
      const topY = Math.min(leftWrist.y, rightWrist.y);
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
      ctx.lineWidth = 4;
      ctx.setLineDash([15, 8]);
      ctx.beginPath();
      ctx.moveTo(0, topY);
      ctx.lineTo(ctx.canvas.width, topY);
      ctx.stroke();

      // Bottom of range (full extension) - Yellow line
      const bottomY = leftShoulder.y + (leftShoulder.y - topY) * 0.1; // Approximate full extension
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
      ctx.beginPath();
      ctx.moveTo(0, bottomY);
      ctx.lineTo(ctx.canvas.width, bottomY);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash
    }
  }
  // TODO: Add form zones for squats and jumps
}

function drawFormQualityOverlay(ctx: CanvasRenderingContext2D, score: number, pulse: boolean) {
  if (score >= 95 && !pulse) return; // No overlay for near-perfect score
  const quality = Math.max(0, Math.min(1, score / 100));
  
  const red = Math.round(255 * (1 - quality));
  const green = Math.round(255 * quality);
  const baseAlpha = 0.1 + (0.2 * (1 - quality));

  // Pulse effect for warnings
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
      if (highlightedJoints.includes(keypoint.name || '')) {
        radius = 10;
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, radius + Math.sin(Date.now() / 200) * 3, 0, 2 * Math.PI);
        ctx.fill();
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(keypoint.x, keypoint.y, radius, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
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
  renderParticleEffects?: (ctx: CanvasRenderingContext2D) => void
) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  if (!pose) return;

  const { keypoints } = pose;

  // Render particle effects first (behind everything)
  if (renderParticleEffects) {
    renderParticleEffects(ctx);
  }

  drawFormQualityOverlay(ctx, formScore, pulseWarning);
  drawFormZone(ctx, keypoints, exercise);
  
  // Draw jump-specific indicators
  if (exercise === 'jumps') {
    drawJumpHeightIndicators(ctx, keypoints, jumpGroundLevel, currentJumpHeight);
  }
  
  drawTrajectoryTrails(ctx, keypointHistory, exercise);
  drawSkeletonWithColors(ctx, keypoints);
  drawKeypointsWithConfidence(ctx, keypoints, exercise);
};
