import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Share2, 
  Twitter, 
  MessageCircle,
  Copy,
  Check
} from "lucide-react";
import { useWorkoutShare } from "@/hooks/useWorkoutShare";
import { Exercise } from "@/lib/types";
import { toast } from "sonner";

interface SocialShareButtonProps {
  exercise: Exercise;
  totalReps: number;
  averageFormScore: number;
  className?: string;
}

const SocialShareButton = ({
  exercise,
  totalReps,
  averageFormScore,
  className
}: SocialShareButtonProps) => {
  const { shareWorkout, success } = useWorkoutShare();
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    shareWorkout({
      exercise,
      totalReps,
      averageFormScore,
      repHistory: [],
      visibility: 'friends',
    });
    
    toast.success("Workout shared with your friends!");
  };

  const handleCopyLink = () => {
    // In a real app, this would copy a shareable link
    navigator.clipboard.writeText(
      `Just crushed ${totalReps} ${exercise} with ${averageFormScore}% form! #ImperfectCoach`
    );
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTwitterShare = () => {
    const text = `Just crushed ${totalReps} ${exercise} with ${averageFormScore}% form! #ImperfectCoach`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        className={className}
      >
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>
      
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={handleTwitterShare}
        >
          <Twitter className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopyLink}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default SocialShareButton;