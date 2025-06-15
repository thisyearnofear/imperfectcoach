
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CoachModel } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

interface HeaderProps {
  coachModel: CoachModel;
  onCoachModelChange: (model: CoachModel) => void;
  onSettingsClick: () => void;
}

const Header = ({ coachModel, onCoachModelChange, onSettingsClick }: HeaderProps) => {
  return (
    <header className="p-4 border-b border-border/40">
      <div className="container mx-auto flex justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-primary shrink-0">Imperfect Coach</h1>
        <div className="flex items-center gap-2">
          <div className="w-full max-w-[150px] sm:max-w-[200px]">
            <Select value={coachModel} onValueChange={onCoachModelChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select Coach" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Coach Gemini</SelectItem>
                <SelectItem value="openai">Coach OpenAI</SelectItem>
                <SelectItem value="anthropic">Coach Anthropic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={onSettingsClick} className="lg:hidden">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
