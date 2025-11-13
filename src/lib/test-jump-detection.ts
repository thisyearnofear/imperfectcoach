/**
 * Test script for consolidated jump detection
 * Run this to verify the new system works correctly
 */

import { processJumpsEnhanced, createJumpState } from './exercise-processors/enhancedJumpProcessor';

// Mock keypoints for testing
const createMockKeypoints = (ankleY: number, kneeAngle: number = 150) => {
  const hipY = ankleY - 100;
  const kneeY = ankleY - 50;
  
  return [
    { name: 'left_hip', x: 100, y: hipY, score: 0.9 },
    { name: 'right_hip', x: 120, y: hipY, score: 0.9 },
    { name: 'left_knee', x: 95, y: kneeY, score: 0.9 },
    { name: 'right_knee', x: 125, y: kneeY, score: 0.9 },
    { name: 'left_ankle', x: 90, y: ankleY, score: 0.9 },
    { name: 'right_ankle', x: 130, y: ankleY, score: 0.9 },
  ];
};

// Test scenarios
export function testJumpDetection() {
  console.log('🧪 Testing Consolidated Jump Detection System');
  
  const jumpState = createJumpState();
  let repState: 'GROUNDED' | 'AIRBORNE' = 'GROUNDED';
  
  // Test 1: Calibration (should be instant)
  console.log('\n📏 Test 1: Calibration');
  const standingKeypoints = createMockKeypoints(200, 160); // Standing straight
  const calibrationResult = processJumpsEnhanced({
    keypoints: standingKeypoints,
    repState,
    internalReps: 0,
    lastRepIssues: [],
    jumpState,
  });
  
  console.log('Calibration result:', {
    feedback: calibrationResult?.feedback,
    isCalibrated: jumpState.isCalibrated,
    groundLevel: jumpState.groundLevel,
  });
  
  // Test 2: Walking movement (should NOT trigger jump)
  console.log('\n🚶 Test 2: Walking Movement (should not trigger jump)');
  const walkingKeypoints = createMockKeypoints(195, 155); // Slight movement
  const walkingResult = processJumpsEnhanced({
    keypoints: walkingKeypoints,
    repState,
    internalReps: 0,
    lastRepIssues: [],
    jumpState,
  });
  
  console.log('Walking result:', {
    feedback: walkingResult?.feedback,
    newRepState: walkingResult?.newRepState,
    shouldTriggerJump: walkingResult?.newRepState === 'AIRBORNE',
  });
  
  // Test 3: Intentional jump (should trigger)
  console.log('\n🦘 Test 3: Intentional Jump (should trigger)');
  const jumpKeypoints = createMockKeypoints(170, 165); // Significant height + extended legs
  const jumpResult = processJumpsEnhanced({
    keypoints: jumpKeypoints,
    repState,
    internalReps: 0,
    lastRepIssues: [],
    jumpState,
  });
  
  if (jumpResult?.newRepState) {
    repState = jumpResult.newRepState;
  }
  
  console.log('Jump result:', {
    feedback: jumpResult?.feedback,
    newRepState: jumpResult?.newRepState,
    jumpTriggered: jumpResult?.newRepState === 'AIRBORNE',
    peakHeight: jumpState.peakHeight,
  });
  
  // Test 4: Landing (should complete rep)
  console.log('\n🛬 Test 4: Landing (should complete rep)');
  const landingKeypoints = createMockKeypoints(198, 130); // Back to ground with bent knees
  const landingResult = processJumpsEnhanced({
    keypoints: landingKeypoints,
    repState,
    internalReps: 0,
    lastRepIssues: [],
    jumpState,
  });
  
  console.log('Landing result:', {
    feedback: landingResult?.feedback,
    isRepCompleted: landingResult?.isRepCompleted,
    score: landingResult?.repCompletionData?.score,
    newRepState: landingResult?.newRepState,
  });
  
  console.log('\n✅ Test Complete - Check results above');
  
  return {
    calibrationWorks: jumpState.isCalibrated,
    walkingIgnored: walkingResult?.newRepState !== 'AIRBORNE',
    jumpDetected: jumpResult?.newRepState === 'AIRBORNE',
    repCompleted: landingResult?.isRepCompleted,
  };
}

// Run test if this file is executed directly
if (typeof window === 'undefined') {
  testJumpDetection();
}
