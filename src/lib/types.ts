
import type { Keypoint } from '@tensorflow-models/pose-detection';

export type Exercise = "pull-ups" | "jumps" | "squats";

export type RepState = 'DOWN' | 'UP' | 'GROUNDED' | 'AIRBORNE';

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
}
