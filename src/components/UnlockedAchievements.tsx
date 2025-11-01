
import { Achievement } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';

interface AchievementProgress {
  id: string;
  current: number;
  target: number;
  description: string;
}

interface UnlockedAchievementsProps {
  achievements: Achievement[];
  progress?: AchievementProgress[];
}

const UnlockedAchievements = ({ achievements, progress = [] }: UnlockedAchievementsProps) => {
  if (achievements.length === 0) {
    return (
      <div className="bg-card p-4 rounded-lg border border-border/40 text-center">
        <h4 className="font-semibold mb-2 text-primary">Achievements</h4>
        <p className="text-muted-foreground">Keep working out to unlock achievements!</p>
      </div>
    );
  }

  return (
  <div className="bg-card p-4 rounded-lg border border-border/40 space-y-4">
  <h4 className="font-semibold text-primary flex items-center gap-2">
    <span className="text-2xl">🏆</span>
  Achievements
  </h4>

  {/* Unlocked Achievements */}
  {achievements.length > 0 && (
  <div>
  <h5 className="text-sm font-medium text-muted-foreground mb-2">Unlocked ({achievements.length})</h5>
  <div className="flex flex-wrap gap-2">
  <TooltipProvider>
  {achievements.map((achievement, index) => (
  <motion.div
      key={achievement.id}
        initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            >
                <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="secondary" className="flex items-center gap-2 cursor-pointer border-yellow-500/50 hover:bg-yellow-500/20 hover:scale-105 transition-transform">
                        <achievement.icon className="h-4 w-4 text-yellow-500" />
                        <span>{achievement.name}</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{achievement.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              ))}
            </TooltipProvider>
          </div>
        </div>
      )}

      {/* Progress Towards Next Achievements */}
      {progress.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-muted-foreground mb-2">In Progress</h5>
          <div className="space-y-3">
            {progress.map((item) => (
              <div key={item.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{item.description}</span>
                  <span className="text-muted-foreground">{item.current}/{item.target}</span>
                </div>
                <Progress
                  value={(item.current / item.target) * 100}
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {achievements.length === 0 && progress.length === 0 && (
        <div className="text-center py-4">
          <p className="text-muted-foreground">Start working out to unlock achievements!</p>
        </div>
      )}
    </div>
  );
};

export default UnlockedAchievements;
