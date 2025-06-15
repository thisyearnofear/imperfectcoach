import { useEffect, useRef, useState } from 'react';
import * as posedetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import { supabase } from '@/integrations/supabase/client';

// Type definitions
type VideoStatus = "idle" | "pending" | "granted" | "denied";
type RepState = 'DOWN' | 'UP';

export interface PoseData {
  keypoints: posedetection.Keypoint[];
  leftElbowAngle: number;
  rightElbowAngle: number;
}

interface UsePoseDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  cameraStatus: VideoStatus;
  onRepCount: (count: (prevCount: number) => number) => void;
  onFormFeedback: (message: string) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isDebugMode: boolean;
  onPoseData: (data: PoseData) => void;
  onFormScoreUpdate: (score: number) => void;
}

// Utility function to calculate angle between three points
const calculateAngle = (a: posedetection.Keypoint, b: posedetection.Keypoint, c: posedetection.Keypoint): number => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);

    if (angle > 180.0) {
        angle = 360 - angle;
    }
    return angle;
};

// Drawing utilities
const drawKeypoints = (keypoints: posedetection.Keypoint[], ctx: CanvasRenderingContext2D) => {
    keypoints.forEach(keypoint => {
        if (keypoint.score && keypoint.score > 0.5) {
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'aqua';
            ctx.fill();
        }
    });
};

const drawSkeleton = (keypoints: posedetection.Keypoint[], ctx: CanvasRenderingContext2D) => {
    const adjacentKeyPoints = posedetection.util.getAdjacentPairs(posedetection.SupportedModels.MoveNet);
    
    adjacentKeyPoints.forEach(([i, j]) => {
        const kp1 = keypoints[i];
        const kp2 = keypoints[j];

        if (kp1.score && kp2.score && kp1.score > 0.5 && kp2.score > 0.5) {
            ctx.beginPath();
            ctx.moveTo(kp1.x, kp1.y);
            ctx.lineTo(kp2.x, kp2.y);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'aqua';
            ctx.stroke();
        }
    });
};

export const usePoseDetection = ({ videoRef, cameraStatus, onRepCount, onFormFeedback, canvasRef, isDebugMode, onPoseData, onFormScoreUpdate }: UsePoseDetectionProps) => {
  const detectorRef = useRef<posedetection.PoseDetector | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const [repState, setRepState] = useState<RepState>('DOWN');
  const [internalReps, setInternalReps] = useState(0);
  const aiFeedbackCooldown = useRef(false);
  const lastRepIssues = useRef<string[]>([]);
  const repScores = useRef<number[]>([]);

  const getAIFeedback = async (data: Record<string, any>) => {
    if (aiFeedbackCooldown.current) return;
    aiFeedbackCooldown.current = true;
    setTimeout(() => { aiFeedbackCooldown.current = false; }, 4000); // 4-second cooldown

    try {
      const { data: responseData, error } = await supabase.functions.invoke('coach-gemini', {
        body: {
          exercise: 'pull-up', // Changed to pull-up
          ...data,
        }
      });
      if (error) throw error;
      if (responseData.feedback) {
        onFormFeedback(responseData.feedback);
      }
    } catch (error) {
      console.error('Error getting AI feedback:', error);
    }
  };

  const incrementReps = () => {
    onRepCount(prev => prev + 1);
    setInternalReps(prev => prev + 1);
  };

  // Load the model
  useEffect(() => {
    const loadModel = async () => {
      onFormFeedback('Loading pose detection model...');
      await tf.setBackend('webgl');
      const detectorConfig = { modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
      const detector = await posedetection.createDetector(posedetection.SupportedModels.MoveNet, detectorConfig);
      detectorRef.current = detector;
      onFormFeedback('Model loaded. Ready to start!');
    };

    if (cameraStatus === 'granted' && !detectorRef.current) {
      loadModel();
    }
  }, [cameraStatus, onFormFeedback]);

  // Main detection loop
  useEffect(() => {
    const detectPose = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const detector = detectorRef.current;
      
      if (detector && video && video.readyState === 4) {
        const poses = await detector.estimatePoses(video);

        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Match canvas dimensions to video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (isDebugMode && poses && poses.length > 0) {
              drawKeypoints(poses[0].keypoints, ctx);
              drawSkeleton(poses[0].keypoints, ctx);
            }
          }
        }

        if (poses && poses.length > 0) {
          const keypoints = poses[0].keypoints;
          
          const nose = keypoints.find(k => k.name === 'nose');
          const leftWrist = keypoints.find(k => k.name === 'left_wrist');
          const rightWrist = keypoints.find(k => k.name === 'right_wrist');
          const leftShoulder = keypoints.find(k => k.name === 'left_shoulder');
          const rightShoulder = keypoints.find(k => k.name === 'right_shoulder');
          const leftElbow = keypoints.find(k => k.name === 'left_elbow');
          const rightElbow = keypoints.find(k => k.name === 'right_elbow');

          if (nose && leftWrist && rightWrist && leftShoulder && rightShoulder && leftElbow && rightElbow) {
            
            if (nose.score < 0.5 || leftWrist.score < 0.5 || rightWrist.score < 0.5) {
                onFormFeedback("Make sure you're fully in view!");
                return;
            }

            const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
            const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
            
            if (isDebugMode) {
              onPoseData({
                keypoints: keypoints,
                leftElbowAngle,
                rightElbowAngle,
              });
            }

            // --- FORM ANALYSIS & REP COUNTING FOR PULL-UPS ---
            let currentRepScore = 100;
            const currentIssues: string[] = [];

            // 1. Check for Asymmetry
            const angleDifference = Math.abs(leftElbowAngle - rightElbowAngle);
            if (angleDifference > 25) {
                currentIssues.push('asymmetry');
                onFormFeedback("Pull evenly with both arms!");
            }

            // Pull-up specific logic
            const chinAboveWrists = nose.y < leftWrist.y && nose.y < rightWrist.y;
            const armsFullyExtended = leftElbowAngle > 160 && rightElbowAngle > 160;

            const feedbackPayload = {
              reps: internalReps,
              leftElbowAngle,
              rightElbowAngle,
              repState,
              formIssues: lastRepIssues.current,
            };

            // State transitions for PULL-UP
            if (repState === 'DOWN' && chinAboveWrists) {
                // Just finished the UP part of the motion
                setRepState('UP');

                const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
                if (nose.y > wrist.y) { // Simplified: chin not above wrists
                    currentIssues.push('partial_top_rom');
                    onFormFeedback("Get your chin over the bar!");
                }
                
                getAIFeedback(feedbackPayload);

            } else if (repState === 'UP' && armsFullyExtended) {
                // Just finished the DOWN part of the motion, completing a rep
                setRepState('DOWN');
                incrementReps();

                if (leftElbowAngle < 160 || rightElbowAngle < 160) {
                    currentIssues.push('partial_bottom_rom');
                    onFormFeedback("Full extension at the bottom!");
                }
                
                // Score the rep
                if (currentIssues.includes('asymmetry')) currentRepScore -= 30;
                if (currentIssues.includes('partial_top_rom')) currentRepScore -= 25;
                if (currentIssues.includes('partial_bottom_rom')) currentRepScore -= 25;
                
                lastRepIssues.current = [...new Set(currentIssues)];
                repScores.current.push(Math.max(0, currentRepScore));
                if (repScores.current.length > 5) repScores.current.shift(); // Keep last 5 scores

                const avgScore = repScores.current.reduce((a, b) => a + b, 0) / repScores.current.length;
                onFormScoreUpdate(avgScore);

                getAIFeedback({ ...feedbackPayload, reps: internalReps + 1, formIssues: lastRepIssues.current });
            }
          }
        }
      }
      animationFrameId.current = requestAnimationFrame(detectPose);
    };

    if (cameraStatus === 'granted' && detectorRef.current) {
      animationFrameId.current = requestAnimationFrame(detectPose);
    } else {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [cameraStatus, videoRef, repState, onRepCount, onFormFeedback, canvasRef, isDebugMode, onPoseData, onFormScoreUpdate, internalReps]);

  // Cleanup detector on unmount
  useEffect(() => {
    return () => {
        detectorRef.current?.dispose();
    }
  }, []);
};
