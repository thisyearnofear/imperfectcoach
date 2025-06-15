import { Achievement, AchievementId } from "@/lib/types";
import { Star, Award, Trophy, BadgeCheck, Zap } from "lucide-react";

export const ACHIEVEMENTS: Record<AchievementId, Omit<Achievement, 'id'>> = {
  first_rep: {
    name: "First Rep!",
    description: "You completed your first rep. The journey begins!",
    icon: Star,
  },
  ten_reps: {
    name: "10 Rep Club",
    description: "You completed 10 reps in a single session.",
    icon: Award,
  },
  perfect_form_rep: {
    name: "Perfect Form",
    description: "You completed a rep with a perfect score of 100.",
    icon: BadgeCheck,
  },
  great_form_session: {
    name: "Form Virtuoso",
    description: "Maintained an average form score above 95% after 5 reps.",
    icon: Trophy,
  },
  consistent_performer: {
    name: "Mr. Consistent",
    description: "Kept a steady rhythm with low rep time deviation over 10 reps.",
    icon: Zap,
  },
};
