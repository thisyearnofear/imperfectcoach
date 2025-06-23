import * as posedetection from '@tensorflow-models/pose-detection';
import { calculateAngle } from '@/lib/pose-analysis';

// Progressive readiness levels - much better UX than binary ready/not-ready
export type ReadinessLevel = 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT' | 'READY';

export interface ReadinessScore {
    overall: ReadinessLevel;
    score: number; // 0-100
    issues: ReadinessIssue[];
    feedback: string;
    canProceed: boolean;
}

export interface ReadinessIssue {
    type: 'VISIBILITY' | 'POSITIONING' | 'STABILITY' | 'POSTURE';
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    message: string;
    suggestion: string;
    fixable: boolean;
}

export interface ReadinessConfig {
    exercise: 'jumps' | 'pull-ups';
    adaptiveThresholds: boolean; // Learn from user over time
    strictMode: boolean; // For competitions vs casual use
    stabilityFrames: number; // How many frames to require stability
}

/**
 * Intelligent pose readiness system with progressive feedback and adaptive thresholds
 * This replaces the old binary "ready/not ready" system with a more user-friendly approach
 */
export class PoseReadinessSystem {
    private frameHistory: posedetection.Keypoint[][] = [];
    private stabilityHistory: number[] = [];
    private userCalibrationData: Map<string, number> = new Map(); // Learn user's typical poses
    private readonly maxHistoryFrames = 30;
    
    constructor(private config: ReadinessConfig) {}
    
    /**
     * Analyze pose readiness with progressive scoring and actionable feedback
     */
    public analyzePoseReadiness(
        keypoints: posedetection.Keypoint[], 
        videoDimensions: { width: number, height: number }
    ): ReadinessScore {
        // Track pose history for stability analysis
        this.updatePoseHistory(keypoints);
        
        const issues: ReadinessIssue[] = [];
        let totalScore = 0;
        let weightSum = 0;
        
        // 1. Keypoint Visibility Analysis (40% weight)
        const visibilityAnalysis = this.analyzeKeypointVisibility(keypoints);
        issues.push(...visibilityAnalysis.issues);
        totalScore += visibilityAnalysis.score * 0.4;
        weightSum += 0.4;
        
        // 2. Body Positioning Analysis (25% weight)
        const positioningAnalysis = this.analyzeBodyPositioning(keypoints, videoDimensions);
        issues.push(...positioningAnalysis.issues);
        totalScore += positioningAnalysis.score * 0.25;
        weightSum += 0.25;
        
        // 3. Pose Stability Analysis (20% weight)
        const stabilityAnalysis = this.analyzePoseStability();
        issues.push(...stabilityAnalysis.issues);
        totalScore += stabilityAnalysis.score * 0.2;
        weightSum += 0.2;
        
        // 4. Exercise-Specific Posture Analysis (15% weight)
        const postureAnalysis = this.analyzeExercisePosture(keypoints);
        issues.push(...postureAnalysis.issues);
        totalScore += postureAnalysis.score * 0.15;
        weightSum += 0.15;
        
        const finalScore = weightSum > 0 ? totalScore / weightSum : 0;
        
        return {
            overall: this.scoreToReadinessLevel(finalScore),
            score: Math.round(finalScore),
            issues: issues.sort((a, b) => this.severityToNumber(b.severity) - this.severityToNumber(a.severity)),
            feedback: this.generateProgressiveFeedback(finalScore, issues),
            canProceed: this.canUserProceed(finalScore, issues)
        };
    }
    
    private analyzeKeypointVisibility(keypoints: posedetection.Keypoint[]) {
        const requiredKeypoints = this.getRequiredKeypoints();
        const issues: ReadinessIssue[] = [];
        let visibleCount = 0;
        let totalConfidence = 0;
        
        const keypointsMap = new Map(keypoints.map(k => [k.name, k]));
        
        for (const keypointName of requiredKeypoints) {
            const keypoint = keypointsMap.get(keypointName);
            const confidence = keypoint?.score ?? 0;
            
            if (confidence > 0.25) { // Even more lenient: 0.3 -> 0.25
                visibleCount++;
                totalConfidence += confidence;
            } else {
                const severity = confidence < 0.05 ? 'HIGH' : confidence < 0.15 ? 'MEDIUM' : 'LOW'; // More forgiving severity levels
                issues.push({
                    type: 'VISIBILITY',
                    severity,
                    message: `${keypointName.replace('_', ' ')} not clearly visible`,
                    suggestion: this.getVisibilitySuggestion(keypointName, confidence),
                    fixable: true
                });
            }
        }
        
        const visibilityScore = (visibleCount / requiredKeypoints.length) * 100;
        const confidenceScore = requiredKeypoints.length > 0 ? (totalConfidence / requiredKeypoints.length) * 100 : 0;
        
        return {
            score: Math.min(visibilityScore, confidenceScore),
            issues
        };
    }
    
    private analyzeBodyPositioning(keypoints: posedetection.Keypoint[], videoDimensions: { width: number, height: number }) {
        const issues: ReadinessIssue[] = [];
        const keypointsMap = new Map(keypoints.map(k => [k.name, k]));
        
        const leftShoulder = keypointsMap.get('left_shoulder');
        const rightShoulder = keypointsMap.get('right_shoulder');
        const leftAnkle = keypointsMap.get('left_ankle');
        const rightAnkle = keypointsMap.get('right_ankle');
        
        if (!leftShoulder || !rightShoulder || !leftAnkle || !rightAnkle) {
            return { score: 0, issues };
        }
        
        let positioningScore = 100;
        
        // Horizontal centering - progressive scoring instead of binary
        const bodyCenterX = (leftShoulder.x + rightShoulder.x) / 2;
        const frameCenterX = videoDimensions.width / 2;
        const horizontalOffset = Math.abs(bodyCenterX - frameCenterX);
        const horizontalOffsetRatio = horizontalOffset / (videoDimensions.width / 2);
        
        if (horizontalOffsetRatio > 0.6) { // Much more lenient: 0.4 -> 0.6
            positioningScore -= 20; // Reduced penalty: 30 -> 20
            issues.push({
                type: 'POSITIONING',
                severity: 'MEDIUM', // Reduced severity: HIGH -> MEDIUM
                message: 'You need to be more centered in the frame',
                suggestion: `Move ${bodyCenterX < frameCenterX ? 'right' : 'left'} to center yourself`,
                fixable: true
            });
        } else if (horizontalOffsetRatio > 0.4) { // More lenient: 0.25 -> 0.4
            positioningScore -= 10; // Reduced penalty: 15 -> 10
            issues.push({
                type: 'POSITIONING',
                severity: 'LOW', // Reduced severity: MEDIUM -> LOW
                message: 'Try to center yourself better in the frame',
                suggestion: `Move slightly ${bodyCenterX < frameCenterX ? 'right' : 'left'}`,
                fixable: true
            });
        }
        
        // Body size in frame - progressive scoring
        const bodyHeight = Math.abs(leftShoulder.y - leftAnkle.y);
        const bodyHeightRatio = bodyHeight / videoDimensions.height;
        
        if (bodyHeightRatio < 0.2) { // Much more lenient: 0.3 -> 0.2
            positioningScore -= 15; // Reduced penalty: 25 -> 15
            issues.push({
                type: 'POSITIONING',
                severity: 'MEDIUM', // Reduced severity: HIGH -> MEDIUM
                message: 'You appear too small in the frame',
                suggestion: 'Move closer to the camera',
                fixable: true
            });
        } else if (bodyHeightRatio < 0.3) { // More lenient: 0.4 -> 0.3
            positioningScore -= 5; // Reduced penalty: 10 -> 5
            issues.push({
                type: 'POSITIONING',
                severity: 'LOW',
                message: 'Consider moving a bit closer to the camera',
                suggestion: 'Step forward slightly for better detection',
                fixable: true
            });
        } else if (bodyHeightRatio > 0.9) { // More lenient: 0.8 -> 0.9
            positioningScore -= 10; // Reduced penalty: 15 -> 10
            issues.push({
                type: 'POSITIONING',
                severity: 'LOW', // Reduced severity: MEDIUM -> LOW
                message: 'You appear too close to the camera',
                suggestion: 'Step back so your full body is visible',
                fixable: true
            });
        }
        
        return {
            score: Math.max(0, positioningScore),
            issues
        };
    }
    
    private analyzePoseStability() {
        const issues: ReadinessIssue[] = [];
        
        if (this.frameHistory.length < 3) {
            return { score: 50, issues }; // Neutral score while gathering data
        }
        
        // Calculate movement over recent frames
        const recentFrames = this.frameHistory.slice(-5);
        const movements = this.calculateFrameToFrameMovement(recentFrames);
        const avgMovement = movements.reduce((a, b) => a + b, 0) / movements.length;
        
        let stabilityScore = 100;
        
        if (avgMovement > 40) { // Much more lenient: 25 -> 40
            stabilityScore -= 25; // Reduced penalty: 40 -> 25
            issues.push({
                type: 'STABILITY',
                severity: 'MEDIUM', // Reduced severity: HIGH -> MEDIUM
                message: 'Try to stay more still',
                suggestion: 'Stand steady for a moment to calibrate',
                fixable: true
            });
        } else if (avgMovement > 25) { // More lenient: 15 -> 25
            stabilityScore -= 10; // Reduced penalty: 20 -> 10
            issues.push({
                type: 'STABILITY',
                severity: 'LOW', // Reduced severity: MEDIUM -> LOW
                message: 'Almost steady - hold still a bit longer',
                suggestion: 'Minimize movement for better calibration',
                fixable: true
            });
        }
        
        this.stabilityHistory.push(stabilityScore);
        if (this.stabilityHistory.length > 10) {
            this.stabilityHistory.shift();
        }
        
        return {
            score: Math.max(0, stabilityScore),
            issues
        };
    }
    
    private analyzeExercisePosture(keypoints: posedetection.Keypoint[]) {
        const issues: ReadinessIssue[] = [];
        
        if (this.config.exercise === 'jumps') {
            return this.analyzeJumpPosture(keypoints, issues);
        } else if (this.config.exercise === 'pull-ups') {
            return this.analyzePullupPosture(keypoints, issues);
        }
        
        return { score: 100, issues };
    }
    
    private analyzeJumpPosture(keypoints: posedetection.Keypoint[], issues: ReadinessIssue[]) {
        const keypointsMap = new Map(keypoints.map(k => [k.name, k]));
        
        const leftHip = keypointsMap.get('left_hip');
        const rightHip = keypointsMap.get('right_hip');
        const leftKnee = keypointsMap.get('left_knee');
        const rightKnee = keypointsMap.get('right_knee');
        const leftAnkle = keypointsMap.get('left_ankle');
        const rightAnkle = keypointsMap.get('right_ankle');
        
        if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) {
            return { score: 0, issues };
        }
        
        const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
        const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
        const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
        
        let postureScore = 100;
        
        // Much more adaptive thresholds based on user's typical posture
        const idealKneeAngle = this.config.adaptiveThresholds ? 
            this.userCalibrationData.get('preferred_knee_angle') ?? 140 : 140; // More lenient: 155 -> 140
        
        if (avgKneeAngle < idealKneeAngle - 30) { // Much more lenient: 20 -> 30
            postureScore -= 20; // Reduced penalty: 30 -> 20
            issues.push({
                type: 'POSTURE',
                severity: 'LOW', // Reduced severity: MEDIUM -> LOW
                message: 'Stand up straighter for better jump detection',
                suggestion: 'Straighten your legs to a comfortable standing position',
                fixable: true
            });
        } else if (avgKneeAngle < idealKneeAngle - 15) { // More lenient: 10 -> 15
            postureScore -= 5; // Reduced penalty: 10 -> 5
            issues.push({
                type: 'POSTURE',
                severity: 'LOW',
                message: 'Try standing slightly straighter',
                suggestion: 'Relax into a natural standing posture',
                fixable: true
            });
        }
        
        // Learn user's preferred posture over time - even more lenient
        if (this.config.adaptiveThresholds && avgKneeAngle > 120) { // More lenient: 140 -> 120
            this.userCalibrationData.set('preferred_knee_angle', avgKneeAngle);
        }
        
        return {
            score: Math.max(0, postureScore),
            issues
        };
    }
    
    private analyzePullupPosture(keypoints: posedetection.Keypoint[], issues: ReadinessIssue[]) {
        // Implement pull-up specific posture analysis
        return { score: 100, issues };
    }
    
    private updatePoseHistory(keypoints: posedetection.Keypoint[]) {
        this.frameHistory.push(keypoints);
        if (this.frameHistory.length > this.maxHistoryFrames) {
            this.frameHistory.shift();
        }
    }
    
    private calculateFrameToFrameMovement(frames: posedetection.Keypoint[][]): number[] {
        if (frames.length < 2) return [0];
        
        const movements: number[] = [];
        const trackedKeypoints = ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'];
        
        for (let i = 1; i < frames.length; i++) {
            const prevFrame = new Map(frames[i-1].map(k => [k.name, k]));
            const currFrame = new Map(frames[i].map(k => [k.name, k]));
            
            let totalMovement = 0;
            let keypointCount = 0;
            
            for (const kpName of trackedKeypoints) {
                const prev = prevFrame.get(kpName);
                const curr = currFrame.get(kpName);
                
                if (prev && curr && prev.score > 0.3 && curr.score > 0.3) {
                    const movement = Math.sqrt(
                        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
                    );
                    totalMovement += movement;
                    keypointCount++;
                }
            }
            
            movements.push(keypointCount > 0 ? totalMovement / keypointCount : 0);
        }
        
        return movements;
    }
    
    private getRequiredKeypoints(): string[] {
        if (this.config.exercise === 'jumps') {
            return ['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle', 'left_shoulder', 'right_shoulder'];
        } else {
            return ['left_wrist', 'right_wrist', 'left_elbow', 'right_elbow', 'left_shoulder', 'right_shoulder'];
        }
    }
    
    private getVisibilitySuggestion(keypointName: string, confidence: number): string {
        const bodyPart = keypointName.replace('_', ' ');
        
        if (confidence < 0.1) {
            return `Make sure your ${bodyPart} is clearly visible and not blocked`;
        } else if (confidence < 0.2) {
            return `Improve lighting or adjust position to see your ${bodyPart} better`;
        } else {
            return `Slight adjustment needed for ${bodyPart} visibility`;
        }
    }
    
    private scoreToReadinessLevel(score: number): ReadinessLevel {
        if (score >= 70) return 'READY'; // Much lower threshold: 85 -> 70
        if (score >= 55) return 'EXCELLENT'; // Lower: 70 -> 55
        if (score >= 40) return 'GOOD'; // Lower: 55 -> 40
        if (score >= 25) return 'FAIR'; // Lower: 35 -> 25
        return 'POOR';
    }
    
    private severityToNumber(severity: 'LOW' | 'MEDIUM' | 'HIGH'): number {
        switch (severity) {
            case 'HIGH': return 3;
            case 'MEDIUM': return 2;
            case 'LOW': return 1;
        }
    }
    
    private generateProgressiveFeedback(score: number, issues: ReadinessIssue[]): string {
        if (score >= 70) { // Lower threshold: 85 -> 70
            return "Excellent! You're ready to start your workout.";
        }
        
        const highPriorityIssues = issues.filter(i => i.severity === 'HIGH' && i.fixable);
        if (highPriorityIssues.length > 0) {
            return highPriorityIssues[0].suggestion;
        }
        
        const mediumPriorityIssues = issues.filter(i => i.severity === 'MEDIUM' && i.fixable);
        if (mediumPriorityIssues.length > 0) {
            return mediumPriorityIssues[0].suggestion;
        }
        
        if (score >= 35) { // Much lower threshold: 55 -> 35
            return "Almost ready! Make small adjustments and you'll be set.";
        }
        
        if (score >= 20) { // New encouraging threshold
            return "You're getting there! Follow the suggestions to improve.";
        }
        
        return "Let's get you set up properly. Follow the suggestions above.";
    }
    
    private canUserProceed(score: number, issues: ReadinessIssue[]): boolean {
        // Much more lenient - allow users to proceed easily
        const hasHighSeverityIssues = issues.some(i => i.severity === 'HIGH');
        
        if (this.config.strictMode) {
            return score >= 60 || !hasHighSeverityIssues; // Relaxed: was 80
        } else {
            return score >= 40 || !hasHighSeverityIssues; // Much more relaxed: was 60
        }
    }
    
    public reset() {
        this.frameHistory = [];
        this.stabilityHistory = [];
    }
}