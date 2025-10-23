import { useState, useEffect, KeyboardEvent, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles, Command } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromptInputProps {
  onSend: (message: string) => void | Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  showExamples?: boolean;
  examples?: string[];
  showRecents?: boolean;
  className?: string;
}

const DEFAULT_EXAMPLES = [
  "How can I improve my form?",
  "What should I focus on next?",
  "Analyze my performance trends",
];

const SLASH_COMMANDS = [
  { command: "/form", description: "Get form analysis", template: "Analyze my form and give me specific tips" },
  { command: "/progress", description: "View progress", template: "Show me my progress over time" },
  { command: "/compare", description: "Compare sessions", template: "Compare my recent sessions" },
  { command: "/tips", description: "Get quick tips", template: "Give me 3 quick tips to improve" },
];

export function PromptInput({
  onSend,
  placeholder = "Ask a question...",
  disabled = false,
  isLoading = false,
  showExamples = false,
  examples = DEFAULT_EXAMPLES,
  showRecents = true,
  className,
}: PromptInputProps) {
  const [input, setInput] = useState("");
  const [recentPrompts, setRecentPrompts] = useState<string[]>([]);
  const [showCommands, setShowCommands] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState(SLASH_COMMANDS);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent prompts from localStorage
  useEffect(() => {
    if (showRecents) {
      try {
        const stored = localStorage.getItem("recent-prompts");
        if (stored) {
          setRecentPrompts(JSON.parse(stored).slice(0, 3));
        }
      } catch (error) {
        console.error("Failed to load recent prompts:", error);
      }
    }
  }, [showRecents]);

  // Detect slash commands
  useEffect(() => {
    if (input.startsWith("/")) {
      const query = input.slice(1).toLowerCase();
      const filtered = SLASH_COMMANDS.filter(
        cmd => cmd.command.slice(1).toLowerCase().includes(query) ||
               cmd.description.toLowerCase().includes(query)
      );
      setFilteredCommands(filtered);
      setShowCommands(filtered.length > 0);
    } else {
      setShowCommands(false);
    }
  }, [input]);

  const saveRecentPrompt = (prompt: string) => {
    if (!showRecents) return;
    
    try {
      const updated = [prompt, ...recentPrompts.filter(p => p !== prompt)].slice(0, 3);
      setRecentPrompts(updated);
      localStorage.setItem("recent-prompts", JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save recent prompt:", error);
    }
  };

  const handleCommandSelect = (template: string) => {
    setInput(template);
    setShowCommands(false);
    inputRef.current?.focus();
  };

  const handleSend = async () => {
    if (!input.trim() || disabled || isLoading) return;
    
    const message = input.trim();
    setInput("");
    setShowCommands(false);
    saveRecentPrompt(message);
    await onSend(message);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (showCommands && filteredCommands.length > 0) {
        // Select first command on Enter
        handleCommandSelect(filteredCommands[0].template);
      } else {
        handleSend();
      }
    } else if (e.key === "Escape") {
      setShowCommands(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
  };

  const handleRecentClick = (recent: string) => {
    setInput(recent);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Example chips */}
      {showExamples && examples.length > 0 && !isLoading && (
        <div className="flex flex-wrap gap-2">
          {examples.map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example)}
              disabled={disabled}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="h-3 w-3" />
              {example}
            </button>
          ))}
        </div>
      )}

      {/* Recent prompts */}
      {showRecents && recentPrompts.length > 0 && !isLoading && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground self-center">Recent:</span>
          {recentPrompts.map((recent, index) => (
            <Badge
              key={index}
              variant="outline"
              className="cursor-pointer hover:bg-accent transition-colors text-xs"
              onClick={() => handleRecentClick(recent)}
            >
              {recent.length > 30 ? `${recent.slice(0, 30)}...` : recent}
            </Badge>
          ))}
        </div>
      )}

      {/* Input with send button */}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled || isLoading}
            className="flex-1"
          />
          
          {/* Slash command dropdown */}
          {showCommands && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md">
              {filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.command}
                  onClick={() => handleCommandSelect(cmd.template)}
                  className="w-full px-3 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2 text-sm"
                >
                  <Command className="h-3 w-3 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">{cmd.command}</div>
                    <div className="text-xs text-muted-foreground">{cmd.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <Button
          onClick={handleSend}
          disabled={disabled || isLoading || !input.trim()}
          size="icon"
          className="flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Hint for slash commands (future enhancement) */}
      {!disabled && !isLoading && (
        <p className="text-xs text-muted-foreground text-center">
          Press Enter to send • Type / for commands
        </p>
      )}
    </div>
  );
}
