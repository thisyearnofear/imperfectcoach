
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CoachModel } from "@/lib/types";

interface HeaderProps {
  coachModel: CoachModel;
  onCoachModelChange: (model: CoachModel) => void;
}

const Header = ({ coachModel, onCoachModelChange }: HeaderProps) => {
  return (
    <header className="p-4 border-b border-border/40">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">Imperfect Coach</h1>
        <div className="w-[200px]">
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
      </div>
    </header>
  );
};

export default Header;
