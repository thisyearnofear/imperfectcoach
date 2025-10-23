import { useState } from "react";
import { CoachModel, SessionSummaries, ChatMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquarePlus, Lock } from "lucide-react";
import { useFeatureAvailability } from "@/hooks/useFeatureGate";
import { PromptInput } from "@/components/PromptInput";
import { cn } from "@/lib/utils";

interface AIChatProps {
  summaries: SessionSummaries;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string, model: CoachModel) => Promise<void>;
  remainingQueries?: number;
  onUpgrade?: () => void;
  isPremiumContext?: boolean;
}

const coachName = (model: string) =>
  model.charAt(0).toUpperCase() + model.slice(1);

export function AIChat({
  summaries,
  messages,
  isLoading,
  onSendMessage,
  remainingQueries = 999,
  onUpgrade,
  isPremiumContext = false,
}: AIChatProps) {
  const { tier } = useFeatureAvailability("MULTIPLE_AI_COACHES");
  const allCoachOptions = ["gemini", "openai", "anthropic"] as CoachModel[];
  const availableCoaches = isPremiumContext
    ? allCoachOptions
    : (Object.keys(summaries) as CoachModel[]);
  const [selectedCoach, setSelectedCoach] = useState<CoachModel>(
    availableCoaches[0] || "gemini"
  );

  const handleSend = async (message: string) => {
    if (remainingQueries <= 0) return;
    await onSendMessage(message, selectedCoach);
  };

  if (availableCoaches.length === 0) return null;

  return (
    <div className="w-full pt-4 mt-4 border-t border-border/50">
      <h4 className="text-sm font-semibold mb-3 flex items-center justify-center gap-2">
        <MessageSquarePlus className="h-4 w-4" />
        Follow-up with a Coach
        {remainingQueries < 999 && (
          <Badge variant="outline" className="text-xs">
            {remainingQueries} queries left
          </Badge>
        )}
      </h4>

      {messages.length > 0 && (
        <div className="space-y-3 mb-3">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-end gap-2 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-lg px-3 py-2 max-w-[80%] text-sm break-words ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-end gap-2 justify-start">
              <div className="rounded-lg px-3 py-2 bg-muted text-sm animate-pulse">
                Thinking...
              </div>
            </div>
          )}
        </div>
      )}

      {remainingQueries <= 0 ? (
        <div className="text-center p-4 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
            <Lock className="h-4 w-4" />
            <span className="text-sm">No more queries available</span>
          </div>
          {onUpgrade && (
            <Button onClick={onUpgrade} size="sm" variant="outline">
              Get More Queries - $0.05
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Coach Selection Buttons */}
          <div className="flex gap-2 justify-center mb-3">
            {allCoachOptions.map((coach) => {
              const isAvailable = availableCoaches.includes(coach);
              const isSelected = selectedCoach === coach;

              return (
                <Button
                  key={coach}
                  onClick={() => isAvailable && setSelectedCoach(coach)}
                  disabled={!isAvailable}
                  size="sm"
                  variant={isSelected && isAvailable ? "default" : "outline"}
                  className={cn(
                    "flex items-center gap-1",
                    !isAvailable && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {coachName(coach)}
                </Button>
              );
            })}
          </div>

          {!isPremiumContext &&
            !availableCoaches.includes("openai") &&
            !availableCoaches.includes("anthropic") &&
            onUpgrade && (
              <div className="text-center mb-3">
                <button
                  onClick={onUpgrade}
                  className="text-xs bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded-full transition-colors"
                >
                  Unlock OpenAI & Anthropic - $0.05
                </button>
              </div>
            )}

          <PromptInput
            onSend={handleSend}
            placeholder={`Ask ${coachName(selectedCoach)}...`}
            disabled={remainingQueries <= 0}
            isLoading={isLoading}
            showExamples={messages.length === 0}
            examples={[
              "How can I improve my form?",
              "What should I focus on next?",
              "Analyze my performance trends",
            ]}
            showRecents={true}
          />
        </>
      )}
    </div>
  );
}
