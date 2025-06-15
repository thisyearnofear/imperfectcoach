import { useState, useEffect } from "react";
import { toast } from "sonner";
import { RepData, Achievement, AchievementId } from "@/lib/types";
import { ACHIEVEMENTS } from "@/lib/achievements";

export const useAchievements = (
  reps: number,
  repHistory: RepData[],
  averageFormScore: number,
  repTimingStdDev?: number,
) => {
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<AchievementId>>(new Set());

  useEffect(() => {
    const checkAchievements = () => {
      const newAchievements: AchievementId[] = [];

      // Achievement: First Rep
      if (reps >= 1 && !unlockedAchievements.has("first_rep")) {
        newAchievements.push("first_rep");
      }

      // Achievement: 10 Reps
      if (reps >= 10 && !unlockedAchievements.has("ten_reps")) {
        newAchievements.push("ten_reps");
      }

      // Achievement: Perfect Form Rep
      if (repHistory.some(rep => rep.score === 100) && !unlockedAchievements.has("perfect_form_rep")) {
        newAchievements.push("perfect_form_rep");
      }
      
      // Achievement: Great Form Session
      if (reps > 5 && averageFormScore >= 95 && !unlockedAchievements.has("great_form_session")) {
        newAchievements.push("great_form_session");
      }

      // Achievement: Consistent Performer
      if (reps > 10 && repTimingStdDev !== undefined && repTimingStdDev < 1.5 && !unlockedAchievements.has("consistent_performer")) {
        newAchievements.push("consistent_performer");
      }

      if (newAchievements.length > 0) {
        const updatedAchievements = new Set(unlockedAchievements);
        newAchievements.forEach(id => {
          updatedAchievements.add(id);
          const achievement = ACHIEVEMENTS[id];
          if (achievement) {
            toast.success("🏆 Achievement Unlocked!", {
              description: achievement.name,
              duration: 5000,
            });
          }
        });
        setUnlockedAchievements(updatedAchievements);
      }
    };

    checkAchievements();
  }, [reps, repHistory, averageFormScore, unlockedAchievements, repTimingStdDev]);
  
  useEffect(() => {
    if (repHistory.length === 0 && reps === 0) {
      setUnlockedAchievements(new Set());
    }
  }, [repHistory, reps]);

  const achievements: Achievement[] = Array.from(unlockedAchievements).map(id => ({
    id,
    ...ACHIEVEMENTS[id],
  }));

  return { achievements };
};
