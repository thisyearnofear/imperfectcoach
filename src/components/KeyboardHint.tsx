import { Command } from "lucide-react";
import { cn } from "@/lib/utils";

interface KeyboardHintProps {
  keys: string[];
  description: string;
  variant?: "default" | "compact";
  className?: string;
}

export function KeyboardHint({
  keys,
  description,
  variant = "default",
  className,
}: KeyboardHintProps) {
  if (variant === "compact") {
    return (
      <div className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>
        <Command className="h-3 w-3" />
        <span>{keys.join(" ")}</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center gap-2 text-sm text-muted-foreground", className)}>
      <span>{description}</span>
      <div className="inline-flex items-center gap-1">
        {keys.map((key, index) => (
          <kbd
            key={index}
            className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
