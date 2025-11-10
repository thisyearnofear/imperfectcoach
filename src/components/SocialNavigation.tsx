import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Activity, 
  Target, 
  Trophy,
  MessageCircle
} from "lucide-react";
import { useSocialContext } from "@/contexts/SocialContext";
import { useAccount } from "wagmi";

const SocialNavigation = () => {
  const { address } = useAccount();
  const { friendAddresses, socialActivities, socialChallenges } = useSocialContext();
  
  // Count active challenges
  const activeChallenges = socialChallenges.filter(
    challenge => challenge.status === 'active'
  ).length;

  return (
    <div className="flex items-center gap-2 p-2 bg-card rounded-lg border">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/social">
          <Users className="h-4 w-4 mr-2" />
          Social
        </Link>
      </Button>
      
      <Button variant="ghost" size="sm" asChild>
        <Link to="/social?tab=activity">
          <Activity className="h-4 w-4 mr-2" />
          Activity
          {socialActivities.length > 0 && (
            <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {Math.min(socialActivities.length, 99)}
            </span>
          )}
        </Link>
      </Button>
      
      <Button variant="ghost" size="sm" asChild>
        <Link to="/social?tab=challenges">
          <Target className="h-4 w-4 mr-2" />
          Challenges
          {activeChallenges > 0 && (
            <span className="ml-2 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {activeChallenges}
            </span>
          )}
        </Link>
      </Button>
      
      <Button variant="ghost" size="sm" asChild>
        <Link to="/social?tab=achievements">
          <Trophy className="h-4 w-4 mr-2" />
          Achievements
        </Link>
      </Button>
    </div>
  );
};

export default SocialNavigation;