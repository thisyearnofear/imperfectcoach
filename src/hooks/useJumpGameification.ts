
import { useState, useRef, useCallback } from 'react';
import { RepData, JumpRepDetails } from '@/lib/types';
import { ParticleSystem } from '@/lib/jumpEffects';

interface JumpStats {
  personalBest: number;
  consistencyStreak: number;
  totalJumps: number;
  avgHeight: number;
  powerLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite';
}

export const useJumpGameification = () => {
  const [jumpStats, setJumpStats] = useState<JumpStats>({
    personalBest: 0,
    consistencyStreak: 0,
    totalJumps: 0,
    avgHeight: 0,
    powerLevel: 'beginner'
  });

  const [achievements, setAchievements] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const particleSystem = useRef(new ParticleSystem());
  const lastJumpHeight = useRef(0);

  const triggerVibration = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const updateJumpStats = useCallback((repData: RepData) => {
    const details = repData.details as JumpRepDetails;
    if (!details) return;

    const { jumpHeight } = details;
    
    setJumpStats(prev => {
      const newTotalJumps = prev.totalJumps + 1;
      const newAvgHeight = ((prev.avgHeight * prev.totalJumps) + jumpHeight) / newTotalJumps;
      
      // Check for personal best
      const isPersonalBest = jumpHeight > prev.personalBest;
      if (isPersonalBest) {
        triggerVibration([100, 50, 100]);
      }

      // Check consistency (within 20% of average)
      const isConsistent = Math.abs(jumpHeight - newAvgHeight) <= newAvgHeight * 0.2;
      const newStreak = isConsistent ? prev.consistencyStreak + 1 : 0;

      // Determine power level
      let powerLevel: JumpStats['powerLevel'] = 'beginner';
      if (newAvgHeight >= 80) powerLevel = 'elite';
      else if (newAvgHeight >= 60) powerLevel = 'advanced';
      else if (newAvgHeight >= 40) powerLevel = 'intermediate';

      return {
        personalBest: Math.max(prev.personalBest, jumpHeight),
        consistencyStreak: newStreak,
        totalJumps: newTotalJumps,
        avgHeight: newAvgHeight,
        powerLevel
      };
    });

    lastJumpHeight.current = jumpHeight;
  }, [triggerVibration]);

  const checkMilestones = useCallback((x: number, y: number, jumpHeight: number) => {
    const milestones = [
      { height: 40, name: 'Good Jump!', color: 'yellow' },
      { height: 60, name: 'Great Jump!', color: 'orange' },
      { height: 80, name: 'Amazing Jump!', color: 'gold' },
      { height: 100, name: 'Incredible!', color: 'rainbow' }
    ];

    for (const milestone of milestones) {
      if (jumpHeight >= milestone.height && !achievements.includes(milestone.name)) {
        setAchievements(prev => [...prev, milestone.name]);
        particleSystem.current.createSparkleEffect(x, y, 12);
        triggerVibration([50, 100, 50]);
        break;
      }
    }
  }, [achievements, triggerVibration]);

  const createJumpTrail = useCallback((x: number, y: number) => {
    particleSystem.current.createTrailParticle(x, y);
  }, []);

  const celebrateSessionEnd = useCallback((centerX: number, centerY: number) => {
    setShowCelebration(true);
    particleSystem.current.createConfettiEffect(centerX, centerY, 20);
    triggerVibration([200, 100, 200, 100, 200]);
    
    setTimeout(() => {
      setShowCelebration(false);
    }, 3000);
  }, [triggerVibration]);

  const updateParticles = useCallback(() => {
    particleSystem.current.update();
  }, []);

  const renderEffects = useCallback((ctx: CanvasRenderingContext2D) => {
    particleSystem.current.render(ctx);
  }, []);

  const clearEffects = useCallback(() => {
    particleSystem.current.clear();
    setAchievements([]);
    setJumpStats({
      personalBest: 0,
      consistencyStreak: 0,
      totalJumps: 0,
      avgHeight: 0,
      powerLevel: 'beginner'
    });
  }, []);

  return {
    jumpStats,
    achievements,
    showCelebration,
    updateJumpStats,
    checkMilestones,
    createJumpTrail,
    celebrateSessionEnd,
    updateParticles,
    renderEffects,
    clearEffects
  };
};
