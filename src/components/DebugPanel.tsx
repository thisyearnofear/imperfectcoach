import { PoseData } from '@/hooks/usePoseDetection';

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

  const { keypoints, leftElbowAngle, rightElbowAngle } = poseData;

  const relevantKeypoints = keypoints.filter(k => 
    ['nose', 'left_wrist', 'right_wrist', 'left_elbow', 'right_elbow', 'left_shoulder', 'right_shoulder'].includes(k.name || '')
  );

  return (
    <div className="bg-card p-4 rounded-lg border border-border/40 mt-4">
      <h3 className="font-semibold text-primary mb-2">Debug Panel</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div><span className="font-semibold">L Elbow Angle:</span> {leftElbowAngle.toFixed(1)}°</div>
        <div><span className="font-semibold">R Elbow Angle:</span> {rightElbowAngle.toFixed(1)}°</div>
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
