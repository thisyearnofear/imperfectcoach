import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

const SocialNavigation = () => {
  return (
    <Button variant="outline" size="sm" asChild>
      <Link to="/social">
        <Users className="h-4 w-4 mr-2" />
        Social
      </Link>
    </Button>
  );
};

export default SocialNavigation;