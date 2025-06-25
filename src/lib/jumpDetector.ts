import * as posedetection from "@tensorflow-models/pose-detection";
import { calculateAngle } from "@/lib/pose-analysis";

class CircularArray<T> extends Array<T> {
  maxLength: number;

  constructor(maxLength: number) {
    super();
    this.maxLength = maxLength;
  }

  push(...elements: T[]): number {
    super.push(...elements);
    while (this.length > this.maxLength) {
      this.shift();
    }
    return this.length;
  }

  sum(): number {
    return this.reduce((a, b) => a + (b as number), 0);
  }

  mean(): number {
    if (this.length === 0) return 0;
    return this.sum() / this.length;
  }

  std(): number {
    if (this.length < 2) return 0;
    const mean = this.mean();
    const variance =
      this.map((val) => Math.pow((val as number) - mean, 2)).reduce(
        (a, b) => a + b,
        0
      ) / this.length;
    return Math.sqrt(variance);
  }
}

// Enhanced jump states for strict pose validation
export type JumpState =
  | "GROUNDED"
  | "PREPARING"
  | "CROUCHED"
  | "EXPLODING"
  | "AIRBORNE"
  | "LANDING";

interface PoseStability {
  anklePositions: CircularArray<{
    left: { x: number; y: number };
    right: { x: number; y: number };
  }>;
  shoulderPositions: CircularArray<{
    left: { x: number; y: number };
    right: { x: number; y: number };
  }>;
  hipPositions: CircularArray<{
    left: { x: number; y: number };
    right: { x: number; y: number };
  }>;
}

export class EnhancedJumpDetector {
  private y: CircularArray<number>;
  private filteredY: CircularArray<number>;
  private signals: CircularArray<number>;
  private lag: number;
  private threshold: number;
  private influence: number;

  // Enhanced pose tracking
  private poseStability: PoseStability;
  private stableFrameCount: number = 0;
  private crouchFrameCount: number = 0;
  private jumpState: JumpState = "GROUNDED";
  private groundLevel: number | null = null;
  private lastValidPose: posedetection.Keypoint[] | null = null;
  private troubleCounter: number = 0; // Track how long user has been trying

  // Thresholds for pose validation - Made extremely user-friendly
  private readonly STABILITY_REQUIRED_FRAMES = 1; // Just 1 frame for instant calibration (~0.03 seconds)
  private readonly CROUCH_REQUIRED_FRAMES = 2; // Quick crouch detection
  private readonly MAX_MOVEMENT_THRESHOLD = 25; // Increased from 15 to 25 pixels - allows more natural movement
  private readonly MIN_CROUCH_ANGLE = 120; // Reduced to 120 degrees - much more forgiving for natural standing
  private readonly TAKEOFF_CROUCH_ANGLE = 100; // degrees
  private readonly LANDING_DETECTION_ANGLE = 120; // degrees

  constructor(
    lag: number = 10,
    threshold: number = 1.5,
    influence: number = 0.3
  ) {
    this.lag = lag;
    this.threshold = threshold;
    this.influence = influence;
    this.y = new CircularArray<number>(lag);
    this.signals = new CircularArray<number>(lag);
    this.filteredY = new CircularArray<number>(lag);

    this.poseStability = {
      anklePositions: new CircularArray(this.STABILITY_REQUIRED_FRAMES),
      shoulderPositions: new CircularArray(this.STABILITY_REQUIRED_FRAMES),
      hipPositions: new CircularArray(this.STABILITY_REQUIRED_FRAMES),
    };
  }

  public analyzePoseForJump(keypoints: posedetection.Keypoint[]): {
    isValidJump: boolean;
    jumpState: JumpState;
    feedback: string;
    shouldCompleteRep: boolean;
    currentHeight: number;
    calibrationData?: {
      calibrationProgress: number;
      isStable: boolean;
      kneeAngle: number;
      minKneeAngle: number;
      isCalibrating: boolean;
    };
  } {
    // Extract required keypoints
    const requiredPoints = this.getRequiredKeypoints(keypoints);
    if (!requiredPoints) {
      // If we're in the middle of a jump sequence and keypoints fail temporarily,
      // use last valid pose to continue the sequence instead of resetting
      if (this.jumpState !== "GROUNDED" && this.lastValidPose) {
        const fallbackPoints = this.getRequiredKeypoints(this.lastValidPose);
        if (fallbackPoints) {
          // Continue with last valid pose but give feedback about visibility
          const result = this.processJumpWithPoints(fallbackPoints);
          return {
            ...result,
            feedback:
              result.feedback +
              " (Pose detection unstable - try to stay visible)",
          };
        }
      }

      return {
        isValidJump: false,
        jumpState: this.jumpState,
        feedback: "Make sure your full body is visible in the frame.",
        shouldCompleteRep: false,
        currentHeight: 0,
      };
    }

    // Store valid pose for potential fallback
    this.lastValidPose = keypoints;

    return this.processJumpWithPoints(requiredPoints);
  }

  private processJumpWithPoints(
    requiredPoints: ReturnType<typeof this.getRequiredKeypoints>
  ) {
    if (!requiredPoints) {
      return {
        isValidJump: false,
        jumpState: this.jumpState,
        feedback: "Pose detection failed",
        shouldCompleteRep: false,
        currentHeight: 0,
      };
    }

    const {
      leftHip,
      rightHip,
      leftKnee,
      rightKnee,
      leftAnkle,
      rightAnkle,
      leftShoulder,
      rightShoulder,
    } = requiredPoints;

    // Calculate pose metrics
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

    const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;
    const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const torsoY = (avgShoulderY + (leftHip.y + rightHip.y) / 2) / 2;

    // Update statistical detector
    this.y.push(torsoY);
    const statisticalSignal = this.updateStatisticalDetector(torsoY);

    // Track pose stability
    this.updatePoseStability(requiredPoints);

    // State machine for jump validation
    return this.processJumpState(
      avgKneeAngle,
      avgAnkleY,
      torsoY,
      statisticalSignal,
      requiredPoints
    );
  }

  private getRequiredKeypoints(keypoints: posedetection.Keypoint[]) {
    // Core points needed for jump detection - shoulders removed as they're not essential
    const corePoints = [
      "left_hip",
      "right_hip",
      "left_knee",
      "right_knee",
      "left_ankle",
      "right_ankle",
    ];
    const optionalPoints = ["left_shoulder", "right_shoulder"];

    const found = Object.fromEntries(
      [...corePoints, ...optionalPoints].map((name) => [
        name.replace("_", ""),
        keypoints.find((k) => k.name === name),
      ])
    );

    // Only require core points for jump detection - shoulders are optional
    const coreVisible = corePoints.every((name) => {
      const point = found[name.replace("_", "")];
      return point && point.score > 0.3;
    });

    // Debug keypoint detection
    if (process.env.NODE_ENV === "development" && !coreVisible) {
      const missingPoints = corePoints.filter((name) => {
        const point = found[name.replace("_", "")];
        return !point || point.score <= 0.3;
      });
      console.log(`❌ Missing core keypoints: ${missingPoints.join(", ")}`);
    }

    if (!coreVisible) return null;

    // Use shoulders if available, otherwise use hip positions as fallback
    const leftShoulder =
      found.leftshoulder?.score > 0.3 ? found.leftshoulder : found.lefthip;
    const rightShoulder =
      found.rightshoulder?.score > 0.3 ? found.rightshoulder : found.righthip;

    return {
      leftHip: found.lefthip!,
      rightHip: found.righthip!,
      leftKnee: found.leftknee!,
      rightKnee: found.rightknee!,
      leftAnkle: found.leftankle!,
      rightAnkle: found.rightankle!,
      leftShoulder: leftShoulder!,
      rightShoulder: rightShoulder!,
    };
  }

  private updatePoseStability(
    points: ReturnType<typeof this.getRequiredKeypoints>
  ) {
    if (!points) return;

    this.poseStability.anklePositions.push({
      left: { x: points.leftAnkle.x, y: points.leftAnkle.y },
      right: { x: points.rightAnkle.x, y: points.rightAnkle.y },
    });

    this.poseStability.shoulderPositions.push({
      left: { x: points.leftShoulder.x, y: points.leftShoulder.y },
      right: { x: points.rightShoulder.x, y: points.rightShoulder.y },
    });

    this.poseStability.hipPositions.push({
      left: { x: points.leftHip.x, y: points.leftHip.y },
      right: { x: points.rightHip.x, y: points.rightHip.y },
    });
  }

  private isPoseStable(): boolean {
    if (
      this.poseStability.anklePositions.length < this.STABILITY_REQUIRED_FRAMES
    )
      return false;

    // Since we only need 1 frame now, this is much simpler
    if (this.STABILITY_REQUIRED_FRAMES === 1) {
      // For single frame requirement, just check if we have basic pose data
      return true; // With knee angle check already passing, this is sufficient
    }

    // Use RECENT movement instead of maximum historical movement
    const ankleMovement = this.calculateRecentMovement(
      this.poseStability.anklePositions
    );
    const hipMovement = this.calculateRecentMovement(
      this.poseStability.hipPositions
    );

    // Shoulders are now optional, so only check them if we have valid data
    const shoulderMovement =
      this.poseStability.shoulderPositions.length >=
      this.STABILITY_REQUIRED_FRAMES
        ? this.calculateRecentMovement(this.poseStability.shoulderPositions)
        : 0; // If no shoulder data, don't penalize

    // Extremely forgiving thresholds for real-world use - allow natural body sway
    const ANKLE_THRESHOLD = 75; // pixels - very forgiving for ankles (natural sway)
    const HIP_THRESHOLD = 80; // pixels - very forgiving for hips
    const SHOULDER_THRESHOLD = 100; // pixels - extremely forgiving for shoulders

    const coreStable =
      ankleMovement < ANKLE_THRESHOLD && hipMovement < HIP_THRESHOLD;
    const shoulderStable =
      shoulderMovement === 0 || shoulderMovement < SHOULDER_THRESHOLD;

    // Debug logging to help understand why calibration fails
    if (process.env.NODE_ENV === "development") {
      console.log(
        `📊 Stability Check - Ankle: ${ankleMovement.toFixed(
          1
        )}px (limit: ${ANKLE_THRESHOLD}), Hip: ${hipMovement.toFixed(
          1
        )}px (limit: ${HIP_THRESHOLD}), Shoulder: ${shoulderMovement.toFixed(
          1
        )}px (limit: ${SHOULDER_THRESHOLD}), Final Stable: ${
          coreStable && shoulderStable
        }`
      );
    }

    return coreStable && shoulderStable;
  }

  private calculateRecentMovement(
    positions: CircularArray<{
      left: { x: number; y: number };
      right: { x: number; y: number };
    }>
  ): number {
    if (positions.length < 2) return 0;

    // Only look at movement in the last 2 frames (most recent)
    // This is much more forgiving than historical maximum
    const recentFrames = Math.min(2, positions.length);
    let totalMovement = 0;
    let frameCount = 0;

    for (
      let i = positions.length - recentFrames;
      i < positions.length - 1;
      i++
    ) {
      const prev = positions[i];
      const curr = positions[i + 1];

      const leftMovement = Math.sqrt(
        Math.pow(curr.left.x - prev.left.x, 2) +
          Math.pow(curr.left.y - prev.left.y, 2)
      );
      const rightMovement = Math.sqrt(
        Math.pow(curr.right.x - prev.right.x, 2) +
          Math.pow(curr.right.y - prev.right.y, 2)
      );

      totalMovement += Math.max(leftMovement, rightMovement);
      frameCount++;
    }

    // Return average recent movement instead of maximum historical
    return frameCount > 0 ? totalMovement / frameCount : 0;
  }

  private calculateMaxMovement(
    positions: CircularArray<{
      left: { x: number; y: number };
      right: { x: number; y: number };
    }>
  ): number {
    if (positions.length < 2) return 0;

    let maxMovement = 0;
    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1];
      const curr = positions[i];

      const leftMovement = Math.sqrt(
        Math.pow(curr.left.x - prev.left.x, 2) +
          Math.pow(curr.left.y - prev.left.y, 2)
      );
      const rightMovement = Math.sqrt(
        Math.pow(curr.right.x - prev.right.x, 2) +
          Math.pow(curr.right.y - prev.right.y, 2)
      );

      maxMovement = Math.max(maxMovement, leftMovement, rightMovement);
    }

    return maxMovement;
  }

  private processJumpState(
    avgKneeAngle: number,
    avgAnkleY: number,
    torsoY: number,
    statisticalSignal: number,
    points: ReturnType<typeof this.getRequiredKeypoints>
  ) {
    const isStable = this.isPoseStable();
    const isStatisticallyAirborne = statisticalSignal < 0;
    const currentHeight = this.groundLevel
      ? Math.max(0, this.groundLevel - avgAnkleY)
      : 0;

    // Debug logging for all blockers
    if (process.env.NODE_ENV === "development") {
      console.log(`🔍 Calibration Debug:
                Jump State: ${this.jumpState}
                Knee Angle: ${avgKneeAngle.toFixed(1)}° (need: ${
        this.MIN_CROUCH_ANGLE
      }°+)
                Is Stable: ${isStable}
                Stable Frames: ${this.stableFrameCount}/${
        this.STABILITY_REQUIRED_FRAMES
      }
                Required Points Available: ${!!points}
                All Conditions Met: ${
                  avgKneeAngle > this.MIN_CROUCH_ANGLE && isStable
                }
            `);
    }

    switch (this.jumpState) {
      case "GROUNDED":
        if (avgKneeAngle > this.MIN_CROUCH_ANGLE && isStable) {
          this.stableFrameCount++;
          if (this.stableFrameCount >= this.STABILITY_REQUIRED_FRAMES) {
            // Establish ground level
            if (!this.groundLevel) {
              this.groundLevel = avgAnkleY;
            }
            return {
              isValidJump: false,
              jumpState: this.jumpState,
              feedback:
                "Perfect! Now crouch down and explode upward for your jump!",
              shouldCompleteRep: false,
              currentHeight: 0,
              calibrationData: {
                calibrationProgress: 100,
                isStable: true,
                kneeAngle: avgKneeAngle,
                minKneeAngle: this.MIN_CROUCH_ANGLE,
                isCalibrating: false,
              },
            };
          } else {
            const progress = Math.round(
              (this.stableFrameCount / this.STABILITY_REQUIRED_FRAMES) * 100
            );
            return {
              isValidJump: false,
              jumpState: this.jumpState,
              feedback: `Stay still to calibrate... ${progress}%`,
              shouldCompleteRep: false,
              currentHeight: 0,
              calibrationData: {
                calibrationProgress: progress,
                isStable: isStable,
                kneeAngle: avgKneeAngle,
                minKneeAngle: this.MIN_CROUCH_ANGLE,
                isCalibrating: true,
              },
            };
          }
        } else if (avgKneeAngle < this.MIN_CROUCH_ANGLE && this.groundLevel) {
          this.jumpState = "PREPARING";
          this.stableFrameCount = 0;
          this.crouchFrameCount = 0;
        } else if (avgKneeAngle > this.MIN_CROUCH_ANGLE - 10) {
          // More forgiving - allow slightly bent knees
          this.stableFrameCount = Math.max(0, this.stableFrameCount - 1); // Slow decay instead of reset
          return {
            isValidJump: false,
            jumpState: this.jumpState,
            feedback: "Almost there! Stand a bit straighter and hold still.",
            shouldCompleteRep: false,
            currentHeight: 0,
            calibrationData: {
              calibrationProgress: Math.max(
                0,
                (this.stableFrameCount / this.STABILITY_REQUIRED_FRAMES) * 100
              ),
              isStable: isStable,
              kneeAngle: avgKneeAngle,
              minKneeAngle: this.MIN_CROUCH_ANGLE,
              isCalibrating: true,
            },
          };
        } else {
          this.stableFrameCount = 0;
          return {
            isValidJump: false,
            jumpState: this.jumpState,
            feedback: "Stand up straight and stay still to start.",
            shouldCompleteRep: false,
            currentHeight: 0,
            calibrationData: {
              calibrationProgress: 0,
              isStable: isStable,
              kneeAngle: avgKneeAngle,
              minKneeAngle: this.MIN_CROUCH_ANGLE,
              isCalibrating: true,
            },
          };
        }
        break;

      case "PREPARING":
        if (avgKneeAngle < this.TAKEOFF_CROUCH_ANGLE) {
          this.crouchFrameCount++;
          if (this.crouchFrameCount >= this.CROUCH_REQUIRED_FRAMES) {
            this.jumpState = "CROUCHED";
          }
          return {
            isValidJump: false,
            jumpState: this.jumpState,
            feedback: "Good crouch! Now explode upward!",
            shouldCompleteRep: false,
            currentHeight: 0,
          };
        } else if (avgKneeAngle > this.MIN_CROUCH_ANGLE) {
          // Return to standing
          this.jumpState = "GROUNDED";
          this.stableFrameCount = 0;
          return {
            isValidJump: false,
            jumpState: this.jumpState,
            feedback: "Ready position. Crouch down to prepare for jump.",
            shouldCompleteRep: false,
            currentHeight: 0,
          };
        }
        break;

      case "CROUCHED":
        if (isStatisticallyAirborne && currentHeight > 5) {
          this.jumpState = "EXPLODING";
          return {
            isValidJump: true,
            jumpState: this.jumpState,
            feedback: "Perfect takeoff!",
            shouldCompleteRep: false,
            currentHeight: currentHeight,
          };
        } else if (avgKneeAngle > this.MIN_CROUCH_ANGLE) {
          // Stood up without jumping
          this.jumpState = "GROUNDED";
          this.stableFrameCount = 0;
          return {
            isValidJump: false,
            jumpState: this.jumpState,
            feedback: "Jump from the crouch position!",
            shouldCompleteRep: false,
            currentHeight: 0,
          };
        }
        break;

      case "EXPLODING":
        if (currentHeight > 10) {
          // Minimum height for valid jump
          this.jumpState = "AIRBORNE";
        }
        return {
          isValidJump: true,
          jumpState: this.jumpState,
          feedback: "Great explosion!",
          shouldCompleteRep: false,
          currentHeight: currentHeight,
        };

      case "AIRBORNE":
        if (!isStatisticallyAirborne && currentHeight < 8) {
          this.jumpState = "LANDING";
          return {
            isValidJump: true,
            jumpState: this.jumpState,
            feedback:
              avgKneeAngle < this.LANDING_DETECTION_ANGLE
                ? "Excellent soft landing!"
                : "Bend your knees more on landing!",
            shouldCompleteRep: true, // This triggers rep completion
            currentHeight: currentHeight,
          };
        }
        return {
          isValidJump: true,
          jumpState: this.jumpState,
          feedback: "Nice height!",
          shouldCompleteRep: false,
          currentHeight: currentHeight,
        };

      case "LANDING":
        if (avgKneeAngle > this.MIN_CROUCH_ANGLE && isStable) {
          this.jumpState = "GROUNDED";
          this.stableFrameCount = 0;
          return {
            isValidJump: false,
            jumpState: this.jumpState,
            feedback: "Great jump! Ready for another?",
            shouldCompleteRep: false,
            currentHeight: 0,
          };
        }
        return {
          isValidJump: false,
          jumpState: this.jumpState,
          feedback: "Stand up straight to reset.",
          shouldCompleteRep: false,
          currentHeight: currentHeight,
        };
    }

    return {
      isValidJump: false,
      jumpState: this.jumpState,
      feedback: "Get into position...",
      shouldCompleteRep: false,
      currentHeight: currentHeight,
    };
  }

  private updateStatisticalDetector(newValue: number): number {
    if (this.y.length < this.lag) {
      return 0;
    }

    const leadSlice = this.y.slice(0, this.y.length - 1);
    const lead = new CircularArray<number>(this.lag);
    lead.push(...leadSlice);

    const mean = lead.mean();
    const std = lead.std();

    if (std > 0 && Math.abs(newValue - mean) > this.threshold * std) {
      const signal = newValue > mean ? 1 : -1;
      this.signals.push(signal);

      const influencedValue =
        this.influence * newValue +
        (1 - this.influence) *
          (this.filteredY[this.filteredY.length - 1] || newValue);
      this.filteredY.push(influencedValue);
    } else {
      this.signals.push(0);
      this.filteredY.push(newValue);
    }

    return this.signals[this.signals.length - 1] || 0;
  }

  public reset(): void {
    this.jumpState = "GROUNDED";
    this.stableFrameCount = 0;
    this.crouchFrameCount = 0;
    this.groundLevel = null;
    this.y = new CircularArray<number>(this.lag);
    this.signals = new CircularArray<number>(this.lag);
    this.filteredY = new CircularArray<number>(this.lag);
    this.poseStability = {
      anklePositions: new CircularArray(this.STABILITY_REQUIRED_FRAMES),
      shoulderPositions: new CircularArray(this.STABILITY_REQUIRED_FRAMES),
      hipPositions: new CircularArray(this.STABILITY_REQUIRED_FRAMES),
    };
  }
}

// Keep the old JumpDetector for backward compatibility
export class JumpDetector {
  private y: CircularArray<number>;
  private filteredY: CircularArray<number>;
  private signals: CircularArray<number>;
  private lag: number;
  private threshold: number;
  private influence: number;

  constructor(lag: number, threshold: number, influence: number) {
    this.lag = lag;
    this.threshold = threshold;
    this.influence = influence;
    this.y = new CircularArray<number>(lag);
    this.signals = new CircularArray<number>(lag);
    this.filteredY = new CircularArray<number>(lag);
  }

  public update(newValue: number): number {
    this.y.push(newValue);

    if (this.y.length < this.lag) {
      return 0;
    }

    const leadSlice = this.y.slice(0, this.y.length - 1);
    const lead = new CircularArray<number>(this.lag);
    lead.push(...leadSlice);

    const mean = lead.mean();
    const std = lead.std();

    if (std > 0 && Math.abs(newValue - mean) > this.threshold * std) {
      const signal = newValue > mean ? 1 : -1;
      this.signals.push(signal);

      const influencedValue =
        this.influence * newValue +
        (1 - this.influence) *
          (this.filteredY[this.filteredY.length - 1] || newValue);
      this.filteredY.push(influencedValue);
    } else {
      this.signals.push(0);
      this.filteredY.push(newValue);
    }

    return this.signals[this.signals.length - 1] || 0;
  }
}
