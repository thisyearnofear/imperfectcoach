
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Header = () => {
  return (
    <header className="p-4 border-b border-border/40">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">Imperfect Coach</h1>
        <div className="w-[180px]">
          <Select defaultValue="gemini">
            <SelectTrigger>
              <SelectValue placeholder="Select Coach" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini">Coach Gemini</SelectItem>
              <SelectItem value="future-coach" disabled>More coaches soon</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
};

export default Header;
