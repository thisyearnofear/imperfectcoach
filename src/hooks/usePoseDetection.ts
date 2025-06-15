import { useEffect, useRef, useState } from 'react';
import * as posedetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

// Type definitions
type VideoStatus = "idle" | "pending" | "granted" | "denied";
type RepState = 'DOWN' | 'UP';

interface UsePoseDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  cameraStatus: VideoStatus;
  onRepCount: (count: (prevCount: number) => number) => void;
  onFormFeedback: (message: string) => void;
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

export const usePoseDetection = ({ videoRef, cameraStatus, onRepCount, onFormFeedback }: UsePoseDetectionProps) => {
  const detectorRef = useRef<posedetection.PoseDetector | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const [repState, setRepState] = useState<RepState>('DOWN');

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
      if (detectorRef.current && videoRef.current && videoRef.current.readyState === 4) {
        const poses = await detectorRef.current.estimatePoses(videoRef.current);

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
            
            const chinAboveWrists = nose.y < leftWrist.y && nose.y < rightWrist.y;
            const armsStraight = leftElbowAngle > 160 && rightElbowAngle > 160;

            if (repState === 'DOWN' && chinAboveWrists) {
              setRepState('UP');
              onFormFeedback('Great height!');
            } else if (repState === 'UP' && armsStraight) {
              setRepState('DOWN');
              onRepCount(prev => prev + 1);
              onFormFeedback('Nice rep!');
            } else if (repState === 'UP' && !armsStraight) {
              onFormFeedback('Extend your arms fully!');
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
  }, [cameraStatus, videoRef, repState, onRepCount, onFormFeedback]);

  // Cleanup detector on unmount
  useEffect(() => {
    return () => {
        detectorRef.current?.dispose();
    }
  }, []);
};
