
import type { Keypoint } from '@tensorflow-models/pose-detection';

export type Exercise = "pull-ups" | "jumps";

export type RepState = 'DOWN' | 'UP' | 'GROUNDED' | 'AIRBORNE' | 'READY';

export type CameraStatus = "idle" | "pending" | "granted" | "denied";

export type HeightUnit = "cm" | "inches" | "feet" | "meters";

export interface PullupRepDetails {
  peakElbowFlexion: number; // Min angle at top
  bottomElbowExtension: number; // Max angle at bottom
  asymmetry: number; // Max difference between arm angles during rep
}

export interface JumpRepDetails {
  jumpHeight: number; // In pixels, relative to ground level
  landingKneeFlexion: number; // Average knee angle on landing
}

export interface RepData {
  timestamp: number;
  score: number;
  details?: PullupRepDetails | JumpRepDetails;
}

export interface PoseData {
  keypoints: Keypoint[];
  leftElbowAngle?: number;
  rightElbowAngle?: number;
  leftKneeAngle?: number;
  rightKneeAngle?: number;
  leftHipAngle?: number;
  rightHipAngle?: number;
  leftShoulderAngle?: number;
  rightShoulderAngle?: number;
}

export interface ProcessorResult {
  newRepState?: RepState;
  poseData: PoseData;
  feedback?: string;
  formCheckSpeak?: { issue: string; phrase: string };
  isRepCompleted: boolean;
  repCompletionData?: {
    score: number;
    issues: string[];
    details?: PullupRepDetails | JumpRepDetails;
  };
  aiFeedbackPayload?: Record<string, any>;
}

export type CoachPersonality = "competitive" | "supportive" | "zen";

export type CoachModel = "gemini" | "openai" | "anthropic";

export type SessionSummaries = {
  [key in CoachModel]?: string;
};

export type AchievementId =
  | "first_rep"
  | "ten_reps"
  | "perfect_form_rep"
  | "great_form_session"
  | "consistent_performer";

export type WorkoutMode = "training" | "assessment";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Blockchain-related types
export interface BlockchainScore {
  user: string;
  pullups: number;
  jumps: number;
  timestamp: number;
}

export interface UserProfile {
  address: string;
  username?: string;
  totalPullups: number;
  totalJumps: number;
  lastSubmission: number;
  rank?: number;
}

export interface ContractConfig {
  address: string;
  abi: readonly any[];
}
