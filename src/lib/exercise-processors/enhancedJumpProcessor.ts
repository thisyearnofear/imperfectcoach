import * as posedetection from "@tensorflow-models/pose-detection";
import { calculateAngle } from "@/lib/pose-analysis";
import { RepState, PoseData, ProcessorResult, JumpRepDetails } from "@/lib/types";
import { convertHeight } from "@/lib/heightConversion";

export interface JumpState {
  isCalibrated: boolean;
  groundLevel: number | null;
  lastAnkleY: number | null;
  consecutiveAirborneFrames: number;
  consecutiveGroundedFrames: number;
  peakHeight: number;
  jumpStartTime: number | null;
  // ENHANCEMENT: Graceful onboarding phase
  initializationStartTime: number | null;
  isInitializing: boolean;
  repsCompleted: number; // Track reps to defer feedback
  // FIX: Track if a valid jump was detected (not just any airborne state)
  validJumpDetected: boolean;
  // ENHANCED: Rich analytics for AI analysis
  movementAnalytics?: {
    takeoffVelocity: number[]; // Explosiveness patterns
    flightTime: number; // Airborne duration
    bodyControl: number[]; // Stability during flight
    powerConsistency: number[]; // Height maintenance across reps
  };
}

interface JumpProcessorParams {
  keypoints: posedetection.Keypoint[];
  repState: RepState;
  internalReps: number;
  lastRepIssues: string[];
  jumpState: JumpState;
}

/**
 * Enhanced Jump Processor - Consolidated, minimal, and reliable
 * 
 * CORE PRINCIPLES APPLIED:
 * - ENHANCEMENT FIRST: Improves existing detection without adding complexity
 * - AGGRESSIVE CONSOLIDATION: Removes overlapping detection systems
 * - PREVENT BLOAT: Single source of truth for jump detection
 * - DRY: Unified logic for all jump states
 * - CLEAN: Clear separation between calibration, detection, and scoring
 * - PERFORMANT: Minimal processing, adaptive thresholds
 */
export const processJumpsEnhanced = ({
  keypoints,
  repState,
  internalReps,
  lastRepIssues,
  jumpState,
}: JumpProcessorParams): (Omit<ProcessorResult, "feedback"> & {
  feedback?: string;
  jumpState?: JumpState;
}) | null => {

  // CLEAN: Extract required keypoints with clear validation
  const requiredPoints = extractJumpKeypoints(keypoints);
  if (!requiredPoints) {
    return {
      feedback: "Make sure your full body is visible in the frame.",
      isRepCompleted: false,
      poseData: { keypoints },
    };
  }

  const { leftHip, rightHip, leftKnee, rightKnee, leftAnkle, rightAnkle } = requiredPoints;

  // DRY: Single calculation for all ankle and knee metrics
  const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;
  const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
  const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
  const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

  const poseData: PoseData = { keypoints, leftKneeAngle, rightKneeAngle };

  // ENHANCEMENT FIRST: Instant calibration with movement-based validation
  if (!jumpState.isCalibrated) {
    return calibrateInstantly(jumpState, avgAnkleY, avgKneeAngle, poseData);
  }

  // PERFORMANT: Adaptive thresholds based on user's natural movement
  const movementThreshold = calculateAdaptiveThreshold(jumpState, avgAnkleY);
  const isIntentionalJump = detectIntentionalJump(jumpState, avgAnkleY, avgKneeAngle, movementThreshold);

  // CLEAN: Simple state machine with clear transitions
  return processJumpMovement({
    jumpState,
    avgAnkleY,
    avgKneeAngle,
    isIntentionalJump,
    repState,
    internalReps,
    lastRepIssues,
    poseData,
  });
};

// MODULAR: Clear separation of concerns
function extractJumpKeypoints(keypoints: posedetection.Keypoint[]) {
  const required = ['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'];
  const found = Object.fromEntries(
    required.map(name => [name.replace('_', ''), keypoints.find(k => k.name === name)])
  );

  const allVisible = required.every(name => {
    const point = found[name.replace('_', '')];
    return point && point.score > 0.4; // Reasonable threshold
  });

  return allVisible ? {
    leftHip: found.lefthip!,
    rightHip: found.righthip!,
    leftKnee: found.leftknee!,
    rightKnee: found.rightknee!,
    leftAnkle: found.leftankle!,
    rightAnkle: found.rightankle!,
  } : null;
}

// ENHANCEMENT FIRST: Graceful onboarding with initialization phase
function calibrateInstantly(
  jumpState: JumpState,
  avgAnkleY: number,
  avgKneeAngle: number,
  poseData: PoseData
) {
  // CLEAN: Initialize timer on first call
  if (jumpState.initializationStartTime === null) {
    jumpState.initializationStartTime = Date.now();
    jumpState.isInitializing = true;
  }

  // MODULAR: Separate initialization from calibration for better UX
  const initializationDuration = 3000; // 3 second grace period
  const timeIntoInitialization = Date.now() - jumpState.initializationStartTime;
  const isStillInitializing = timeIntoInitialization < initializationDuration;

  // Only require user to be standing reasonably straight
  if (avgKneeAngle > 130) { // Very forgiving threshold
    jumpState.isCalibrated = true;
    jumpState.groundLevel = avgAnkleY;
    jumpState.lastAnkleY = avgAnkleY;

    // Skip the perfect message during initialization, be more casual
    const feedback = isStillInitializing
      ? "I see you! Ready to jump."
      : "Perfect! Jump whenever you're ready.";

    jumpState.isInitializing = isStillInitializing;

    return {
      feedback,
      isRepCompleted: false,
      poseData,
      jumpState,
    };
  }

  // CLEAN: Encouraging messages during initialization phase
  const feedback = isStillInitializing
    ? "Getting ready... stand naturally with legs straight."
    : "Stand with legs straight and I'll calibrate.";

  jumpState.isInitializing = isStillInitializing;

  return {
    feedback,
    isRepCompleted: false,
    poseData,
    jumpState,
  };
}

// PERFORMANT: Adaptive thresholds prevent false positives from walking/squats
// FIX: Increased base threshold from 15 to 30 to differentiate jumps from squats
function calculateAdaptiveThreshold(jumpState: JumpState, currentAnkleY: number): number {
  if (!jumpState.lastAnkleY || !jumpState.groundLevel) {
    return 30; // Increased default threshold for better jump/squat discrimination
  }

  // Learn from user's natural movement patterns
  const recentMovement = Math.abs(currentAnkleY - jumpState.lastAnkleY);
  const baseThreshold = 30; // Increased from 15 to 30

  // If user moves a lot naturally, increase threshold to prevent false positives
  const adaptiveThreshold = Math.max(baseThreshold, recentMovement * 1.5);

  jumpState.lastAnkleY = currentAnkleY;
  return Math.min(adaptiveThreshold, 60); // Increased cap from 40 to 60
}

// CLEAN: Clear logic for distinguishing intentional jumps from walking/squats
// FIX: More strict requirements to prevent squat detection as jumps
function detectIntentionalJump(
  jumpState: JumpState,
  avgAnkleY: number,
  avgKneeAngle: number,
  threshold: number
): boolean {
  if (!jumpState.groundLevel) return false;

  const heightDifference = jumpState.groundLevel - avgAnkleY;

  // FIX: More strict requirements for jump detection:
  // 1. Significant upward movement (ankles well above ground level)
  const hasSignificantHeight = heightDifference > threshold;

  // 2. Extended legs indicate jumping (during squat, knees are bent <120°)
  const hasJumpingPosture = avgKneeAngle > 150; // Increased from 140 to 150 for stricter check

  // 3. Additional check: Must be a clear jump, not just raised heels
  const isClearlyAirborne = heightDifference > 25; // Minimum 25px off ground

  return hasSignificantHeight && hasJumpingPosture && isClearlyAirborne;
}

// MODULAR: Composable jump movement processing with enhanced analytics
function processJumpMovement({
  jumpState,
  avgAnkleY,
  avgKneeAngle,
  isIntentionalJump,
  repState,
  internalReps,
  lastRepIssues,
  poseData,
}: {
  jumpState: JumpState;
  avgAnkleY: number;
  avgKneeAngle: number;
  isIntentionalJump: boolean;
  repState: RepState;
  internalReps: number;
  lastRepIssues: string[];
  poseData: PoseData;
}) {
  const baseResult = { isRepCompleted: false, poseData, jumpState };

  if (isIntentionalJump) {
    jumpState.consecutiveAirborneFrames++;
    jumpState.consecutiveGroundedFrames = 0;

    // Track peak height with enhanced analytics
    const currentHeight = jumpState.groundLevel! - avgAnkleY;
    jumpState.peakHeight = Math.max(jumpState.peakHeight, currentHeight);

    // FIX: Mark as valid jump only after being airborne for minimum frames
    // This prevents squat standing motions from being counted
    if (jumpState.consecutiveAirborneFrames >= 3 && currentHeight >= 25) {
      jumpState.validJumpDetected = true;
    }

    // ENHANCED: Collect rich movement analytics for AI
    if (!jumpState.movementAnalytics) {
      jumpState.movementAnalytics = {
        takeoffVelocity: [],
        flightTime: 0,
        bodyControl: [],
        powerConsistency: [],
      };
    }

    // Calculate takeoff velocity (for explosiveness analysis)
    if (jumpState.lastAnkleY) {
      const velocity = jumpState.lastAnkleY - avgAnkleY; // Upward velocity
      jumpState.movementAnalytics.takeoffVelocity.push(velocity);
    }

    if (jumpState.jumpStartTime === null) {
      jumpState.jumpStartTime = Date.now();
    }

    if (repState === "GROUNDED") {
      return {
        ...baseResult,
        newRepState: "AIRBORNE" as RepState,
        feedback: "Great jump! Keep going up!",
      };
    }

    return {
      ...baseResult,
      feedback: `Nice height: ${Math.round(convertHeight(currentHeight, "cm"))}cm!`,
    };
  } else {
    jumpState.consecutiveGroundedFrames++;
    jumpState.consecutiveAirborneFrames = 0;

    // FIX: Complete rep only when:
    // 1. User lands after being airborne (repState check)
    // 2. Stayed grounded for at least 4 frames (increased from 2 for stability)
    // 3. Had a valid jump with meaningful height (not just small movements)
    const minPeakHeightForValidJump = 20; // Must have at least 20px peak height

    if (repState === "AIRBORNE" && jumpState.consecutiveGroundedFrames >= 4) {
      // Only count as valid rep if the jump was meaningful
      if (jumpState.validJumpDetected && jumpState.peakHeight >= minPeakHeightForValidJump) {
        jumpState.repsCompleted++;
        const repData = generateJumpRepData(jumpState, avgKneeAngle, internalReps, lastRepIssues);

        // Reset jump state for next rep
        jumpState.peakHeight = 0;
        jumpState.jumpStartTime = null;
        jumpState.validJumpDetected = false;

        // ENHANCEMENT: Positive first-rep feedback, normal feedback after
        const isFirstRep = jumpState.repsCompleted === 1;
        const feedback = isFirstRep
          ? "Great first jump! Keep it up!"
          : repData.score >= 70 ? "Excellent jump!" : "Good jump! Try for more height next time.";

        return {
          ...baseResult,
          newRepState: "GROUNDED" as RepState,
          isRepCompleted: true,
          repCompletionData: repData,
          feedback,
        };
      } else {
        // Movement detected but not a valid jump - reset without counting
        jumpState.peakHeight = 0;
        jumpState.jumpStartTime = null;
        jumpState.validJumpDetected = false;

        return {
          ...baseResult,
          newRepState: "GROUNDED" as RepState,
        };
      }
    }

    return baseResult;
  }
}

// ORGANIZED: Predictable scoring with clear metrics
function generateJumpRepData(
  jumpState: JumpState,
  avgKneeAngle: number,
  internalReps: number,
  lastRepIssues: string[]
) {
  const jumpHeight = jumpState.peakHeight;
  const currentIssues: string[] = [];

  // Height scoring (60% of total score)
  let heightScore = 0;
  if (jumpHeight >= 60) heightScore = 100;
  else if (jumpHeight >= 40) heightScore = 80;
  else if (jumpHeight >= 25) heightScore = 60;
  else if (jumpHeight >= 15) heightScore = 40;
  else {
    heightScore = 20;
    currentIssues.push("low_jump");
  }

  // Landing scoring (40% of total score)
  let landingScore = 100;
  if (avgKneeAngle < 120) landingScore = 100;
  else if (avgKneeAngle < 140) landingScore = 80;
  else if (avgKneeAngle < 160) landingScore = 60;
  else {
    landingScore = 40;
    currentIssues.push("stiff_landing");
  }

  const finalScore = Math.round(heightScore * 0.6 + landingScore * 0.4);

  return {
    score: finalScore,
    issues: [...new Set(currentIssues)],
    details: {
      jumpHeight,
      landingKneeFlexion: avgKneeAngle,
      powerScore: heightScore,
      landingScore,
    } as JumpRepDetails & {
      powerScore: number;
      landingScore: number;
    },
  };
}

// Export jump state management utilities
export function createJumpState(): JumpState {
  return {
    isCalibrated: false,
    groundLevel: null,
    lastAnkleY: null,
    consecutiveAirborneFrames: 0,
    consecutiveGroundedFrames: 0,
    peakHeight: 0,
    jumpStartTime: null,
    initializationStartTime: null,
    isInitializing: true, // Start in initialization phase
    repsCompleted: 0,
    validJumpDetected: false, // FIX: Track if a valid jump was detected
  };
}

export function resetJumpState(jumpState: JumpState): void {
  jumpState.isCalibrated = false;
  jumpState.groundLevel = null;
  jumpState.lastAnkleY = null;
  jumpState.consecutiveAirborneFrames = 0;
  jumpState.consecutiveGroundedFrames = 0;
  jumpState.peakHeight = 0;
  jumpState.jumpStartTime = null;
  // Don't reset initialization timer - let it persist across sets
  jumpState.repsCompleted = 0;
  jumpState.validJumpDetected = false; // FIX: Reset valid jump flag
}
