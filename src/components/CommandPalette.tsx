import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Activity,
  Dumbbell,
  TrendingUp,
  Settings,
  History,
  Trophy,
  Zap,
  User,
  Home,
  Brain,
  Wallet,
  Search,
} from "lucide-react";

interface CommandPaletteProps {
  onExerciseSelect?: (exercise: "pull-ups" | "jumps") => void;
  onNavigate?: (path: string) => void;
  onAskAgent?: (context?: string) => void;
  onOpenApiKeys?: () => void;
  hasActiveSession?: boolean;
  lastWorkoutStats?: {
    exercise: string;
    reps: number;
    score: number;
  };
}

export const CommandPalette = ({
  onExerciseSelect,
  onNavigate,
  onAskAgent,
  onOpenApiKeys,
  hasActiveSession = false,
  lastWorkoutStats,
}: CommandPaletteProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Keyboard shortcut listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Handle command selection
  const runCommand = useCallback(
    (command: () => void) => {
      setOpen(false);
      command();
    },
    []
  );

  // Navigation commands
  const handleNavigate = useCallback(
    (path: string) => {
      if (onNavigate) {
        onNavigate(path);
      } else {
        navigate(path);
      }
    },
    [navigate, onNavigate]
  );

  // Exercise commands
  const handleExercise = useCallback(
    (exercise: "pull-ups" | "jumps") => {
      if (onExerciseSelect) {
        onExerciseSelect(exercise);
      } else {
        navigate(`/?exercise=${exercise}`);
      }
    },
    [navigate, onExerciseSelect]
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() => runCommand(() => handleExercise("pull-ups"))}
          >
            <Dumbbell className="mr-2 h-4 w-4" />
            <span>Start Pull-ups</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => handleExercise("jumps"))}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            <span>Start Jumps</span>
            <CommandShortcut>⌘J</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => handleNavigate("/leaderboard"))}
          >
            <Trophy className="mr-2 h-4 w-4" />
            <span>View Leaderboard</span>
            <CommandShortcut>⌘L</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => handleNavigate("/"))}
          >
            <Home className="mr-2 h-4 w-4" />
            <span>Home</span>
            <CommandShortcut>⌘H</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => handleNavigate("/history"))}
          >
            <History className="mr-2 h-4 w-4" />
            <span>Workout History</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => handleNavigate("/settings"))}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <CommandShortcut>⌘,</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => handleNavigate("/profile"))}
          >
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* AI Agent Commands */}
        {(hasActiveSession || lastWorkoutStats || onAskAgent || onOpenApiKeys) && (
          <>
            <CommandGroup heading="AI Agent">
              {hasActiveSession && onAskAgent && (
                <CommandItem
                  onSelect={() => runCommand(() => onAskAgent?.("current-session"))}
                >
                  <Brain className="mr-2 h-4 w-4" />
                  <span>Ask Agent About Current Session</span>
                  <CommandShortcut>⇧⌘A</CommandShortcut>
                </CommandItem>
              )}
              {lastWorkoutStats && onAskAgent && (
                <CommandItem
                  onSelect={() => runCommand(() => onAskAgent?.("last-workout"))}
                >
                  <History className="mr-2 h-4 w-4" />
                  <span>
                    Analyze Last Workout ({lastWorkoutStats.reps} {lastWorkoutStats.exercise})
                  </span>
                </CommandItem>
              )}
              {onAskAgent && (
                <CommandItem
                  onSelect={() => runCommand(() => onAskAgent?.())}
                >
                  <Brain className="mr-2 h-4 w-4" />
                  <span>Ask Agent a Question</span>
                </CommandItem>
              )}
              {onOpenApiKeys && (
                <CommandItem
                  onSelect={() => runCommand(() => onOpenApiKeys?.())}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Manage API Keys</span>
                </CommandItem>
              )}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Features */}
        <CommandGroup heading="Features">
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                // Trigger AI analysis
                const button = document.querySelector(
                  '[data-command="ai-analysis"]'
                ) as HTMLButtonElement;
                button?.click();
              })
            }
          >
            <Brain className="mr-2 h-4 w-4" />
            <span>Get AI Analysis</span>
            <CommandShortcut>⌘A</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                // Trigger wallet connection
                const button = document.querySelector(
                  '[data-command="wallet-connect"]'
                ) as HTMLButtonElement;
                button?.click();
              })
            }
          >
            <Wallet className="mr-2 h-4 w-4" />
            <span>Connect Wallet</span>
            <CommandShortcut>⌘W</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                // Trigger premium upgrade
                const button = document.querySelector(
                  '[data-command="upgrade"]'
                ) as HTMLButtonElement;
                button?.click();
              })
            }
          >
            <Zap className="mr-2 h-4 w-4" />
            <span>Upgrade to Premium</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Search */}
        <CommandGroup heading="Search">
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                // Focus search input if exists
                const searchInput = document.querySelector(
                  '[role="search"]'
                ) as HTMLInputElement;
                searchInput?.focus();
              })
            }
          >
            <Search className="mr-2 h-4 w-4" />
            <span>Search Workouts</span>
            <CommandShortcut>/</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

// Hook to use command palette programmatically
export const useCommandPalette = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return { open, setOpen };
};

// Individual keyboard shortcuts hook
export const useKeyboardShortcuts = (
  shortcuts: Record<string, () => void>
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘P / Ctrl+P - Pull-ups
      if (e.key === "p" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        shortcuts.pullups?.();
      }

      // ⌘J / Ctrl+J - Jumps
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        shortcuts.jumps?.();
      }

      // ⌘L / Ctrl+L - Leaderboard
      if (e.key === "l" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        shortcuts.leaderboard?.();
      }

      // ⌘H / Ctrl+H - Home
      if (e.key === "h" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        shortcuts.home?.();
      }

      // ⌘A / Ctrl+A - AI Analysis
      if (e.key === "a" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        shortcuts.aiAnalysis?.();
      }

      // ⌘, / Ctrl+, - Settings
      if (e.key === "," && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        shortcuts.settings?.();
      }

      // / - Search
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        shortcuts.search?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
};

export default CommandPalette;
