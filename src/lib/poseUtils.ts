
import type { Keypoint } from '@tensorflow-models/pose-detection';

/**
 * Calculates the angle in degrees between three keypoints.
 * @param a - The first keypoint (e.g., shoulder).
 * @param b - The second keypoint (the vertex, e.g., elbow).
 * @param c - The third keypoint (e.g., wrist).
 * @returns The angle in degrees (0-180).
 */
export const calculateAngle = (a: Keypoint, b: Keypoint, c: Keypoint): number => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);

    if (angle > 180.0) {
        angle = 360 - angle;
    }
    return angle;
};
