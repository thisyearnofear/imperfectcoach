
import { PoseData } from '@/lib/types';

interface DebugPanelProps {
  poseData: PoseData | null;
}

const DebugPanel = ({ poseData }: DebugPanelProps) => {
  if (!poseData) {
    return (
      <div className="bg-card p-4 rounded-lg border border-border/40 mt-4">
        <h3 className="font-semibold text-primary">Debug Panel</h3>
        <p className="text-muted-foreground text-sm">No pose data available.</p>
      </div>
    );
  }

  const { keypoints, leftElbowAngle, rightElbowAngle, leftKneeAngle, rightKneeAngle, leftHipAngle, rightHipAngle } = poseData;

  const relevantKeypoints = keypoints.filter(k => 
    ['nose', 'left_wrist', 'right_wrist', 'left_elbow', 'right_elbow', 'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'].includes(k.name || '')
  );

  return (
    <div className="bg-card p-4 rounded-lg border border-border/40 mt-4">
      <h3 className="font-semibold text-primary mb-2">Debug Panel</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {leftElbowAngle && <div><span className="font-semibold">L Elbow Angle:</span> {leftElbowAngle.toFixed(1)}°</div>}
        {rightElbowAngle && <div><span className="font-semibold">R Elbow Angle:</span> {rightElbowAngle.toFixed(1)}°</div>}
        {leftKneeAngle && <div><span className="font-semibold">L Knee Angle:</span> {leftKneeAngle.toFixed(1)}°</div>}
        {rightKneeAngle && <div><span className="font-semibold">R Knee Angle:</span> {rightKneeAngle.toFixed(1)}°</div>}
        {leftHipAngle && <div><span className="font-semibold">L Hip Angle:</span> {leftHipAngle.toFixed(1)}°</div>}
        {rightHipAngle && <div><span className="font-semibold">R Hip Angle:</span> {rightHipAngle.toFixed(1)}°</div>}
        
        {relevantKeypoints.map(k => (
          <div key={k.name} className="col-span-2">
            <span className="font-semibold capitalize">{k.name?.replace('_', ' ')}:</span>
            <span className="ml-2">
              (x: {k.x.toFixed(0)}, y: {k.y.toFixed(0)})
            </span>
            <span className="ml-2 text-muted-foreground">
              Score: {(k.score || 0).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebugPanel;
