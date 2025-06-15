
import { Achievement } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UnlockedAchievementsProps {
  achievements: Achievement[];
}

const UnlockedAchievements = ({ achievements }: UnlockedAchievementsProps) => {
  if (achievements.length === 0) {
    return (
      <div className="bg-card p-4 rounded-lg border border-border/40 text-center">
        <h4 className="font-semibold mb-2 text-primary">Achievements</h4>
        <p className="text-muted-foreground">Keep working out to unlock achievements!</p>
      </div>
    );
  }

  return (
    <div className="bg-card p-4 rounded-lg border border-border/40">
      <h4 className="font-semibold mb-3 text-primary">Achievements Unlocked</h4>
      <div className="flex flex-wrap gap-2">
        <TooltipProvider>
          {achievements.map((achievement) => (
            <Tooltip key={achievement.id}>
              <TooltipTrigger>
                <Badge variant="secondary" className="flex items-center gap-2 cursor-pointer border-yellow-500/50 hover:bg-yellow-500/20">
                  <achievement.icon className="h-4 w-4 text-yellow-500" />
                  <span>{achievement.name}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{achievement.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
};

export default UnlockedAchievements;
