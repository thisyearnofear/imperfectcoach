import type { Keypoint } from '@tensorflow-models/pose-detection';

export type Exercise = "pull-ups" | "jumps" | "squats";

export type RepState = 'DOWN' | 'UP' | 'GROUNDED' | 'AIRBORNE';

export type CameraStatus = "idle" | "pending" | "granted" | "denied";

export interface RepData {
  timestamp: number;
  score: number;
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
  };
  aiFeedbackPayload?: Record<string, any>;
}

export type CoachPersonality = "competitive" | "supportive" | "zen";

export type CoachModel = "gemini" | "openai" | "anthropic";

export type AchievementId =
  | "first_rep"
  | "ten_reps"
  | "perfect_form_rep"
  | "great_form_session";

export type WorkoutMode = "training" | "assessment";

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}
