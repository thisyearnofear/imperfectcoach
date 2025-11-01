import { Achievement, AchievementId } from "@/lib/types";
import { Star, Award, Trophy, BadgeCheck, Zap, Brain, MessageSquare, Sparkles, Flame, Target, TrendingUp, Heart } from "lucide-react";

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
  first_ai_analysis: {
    name: "AI Insights",
    description: "You got your first AI analysis of your workout!",
    icon: Brain,
  },
  ai_conversation: {
    name: "Coach Chat",
    description: "You had a conversation with an AI coach.",
    icon: MessageSquare,
  },
  agent_explorer: {
  name: "Agent Explorer",
  description: "You tried multiple AI coaches in one session.",
  icon: Sparkles,
  },
  streak_master: {
    name: "Streak Master",
    description: "Maintained a 7-day workout streak! 🔥",
    icon: Flame,
  },
  goal_crusher: {
    name: "Goal Crusher",
    description: "Hit your personal best in pull-ups or jumps!",
    icon: Target,
  },
  form_perfectionist: {
    name: "Form Perfectionist",
    description: "Achieved 95%+ form score for 10 consecutive reps.",
    icon: TrendingUp,
  },
  community_champion: {
    name: "Community Champion",
    description: "Shared your workout and inspired others!",
    icon: Heart,
  },
};
