import { useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Exercise,
  WorkoutMode,
  CoachModel,
  SessionSummaries,
  ChatMessage,
  CoachPersonality,
} from "@/lib/types";
import { getRandomFeedback } from "@/lib/feedbackUtils";
import { getPersonalityFeedback } from "@/lib/coachPersonalities";

// Legacy personality type for API compatibility
type LegacyPersonality = "supportive" | "competitive" | "zen";

// Fallback feedback when AI services are unavailable
const getFallbackFeedback = (
  exercise: Exercise,
  personality: LegacyPersonality,
  issues: string[] = [],
  formScore?: number
): string => {
  // Map legacy personality to new personality for fallback
  const newPersonality: CoachPersonality =
    personality === "supportive"
      ? "SNEL"
      : personality === "zen"
      ? "STEDDIE"
      : "RASTA";
  // Use personality-driven feedback as fallback
  if (issues.length > 0) {
    return getPersonalityFeedback(newPersonality, "form_feedback", formScore);
  }

  return getPersonalityFeedback(newPersonality, "encouragement");
};

interface UseAIFeedbackProps {
  exercise: Exercise;
  coachPersonality: LegacyPersonality;
  workoutMode: WorkoutMode;
  onFormFeedback: (message: string) => void;
}

export const useAIFeedback = ({
  exercise,
  coachPersonality,
  workoutMode,
  onFormFeedback,
}: UseAIFeedbackProps) => {
  const aiFeedbackCooldown = useRef(false);
  const apiErrorCount = useRef(0);
  const lastErrorTime = useRef(0);

  const getAIFeedback = useCallback(
    async (data: Record<string, unknown>) => {
      if (aiFeedbackCooldown.current || workoutMode === "assessment") return;

      // Check if we've had too many API errors recently
      const now = Date.now();
      const timeSinceLastError = now - lastErrorTime.current;

      // If we've had 3+ errors in the last 5 minutes, skip AI calls
      if (apiErrorCount.current >= 3 && timeSinceLastError < 300000) {
        const lastIssues = (data.formIssues as string[]) || [];
        const fallbackFeedback = getFallbackFeedback(
          exercise,
          coachPersonality,
          lastIssues
        );
        onFormFeedback(fallbackFeedback);
        return;
      }

      aiFeedbackCooldown.current = true;
      setTimeout(() => {
        aiFeedbackCooldown.current = false;
      }, 4000); // 4-second cooldown

      const lastIssues = (data.formIssues as string[]) || [];

      if (!navigator.onLine) {
        const personalityFeedback = getFallbackFeedback(
          exercise,
          coachPersonality,
          lastIssues
        );
        onFormFeedback(personalityFeedback);
        return;
      }

      try {
        const { data: responseData, error } = await supabase.functions.invoke(
          "coach-gemini",
          {
            body: {
              type: "feedback",
              exercise,
              personality: coachPersonality,
              ...data,
            },
          }
        );
        if (error) throw error;
        if (responseData.feedback) {
          onFormFeedback(responseData.feedback);
          // Reset error count on successful call
          apiErrorCount.current = 0;
        }
      } catch (error) {
        // Track API errors
        apiErrorCount.current++;
        lastErrorTime.current = now;

        // Only log errors in development mode to reduce console spam
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `AI feedback error (${apiErrorCount.current}/3):`,
            error
          );
        }

        // Always provide helpful fallback feedback when AI services fail
        const fallbackFeedback = getFallbackFeedback(
          exercise,
          coachPersonality,
          lastIssues
        );
        onFormFeedback(fallbackFeedback);
      }
    },
    [exercise, coachPersonality, workoutMode, onFormFeedback]
  );

  const getAISessionSummary = useCallback(
    async (
      summaryData: Record<string, unknown>,
      models: CoachModel[]
    ): Promise<SessionSummaries> => {
      if (!navigator.onLine) {
        return {
          gemini:
            "You're offline. Connect to the internet to get a session summary.",
        };
      }
      if (models.length === 0) {
        return {};
      }

      const userApiKeys = JSON.parse(
        localStorage.getItem("user-api-keys") || "{}"
      );

      const promises = models.map((model) =>
        supabase.functions.invoke("coach-gemini", {
          body: {
            userApiKeys,
            model,
            type: "summary",
            exercise,
            personality: coachPersonality,
            ...summaryData,
          },
        })
      );

      const results = await Promise.allSettled(promises);
      const summaries: SessionSummaries = {};

      results.forEach((result, index) => {
        const model = models[index];
        if (result.status === "fulfilled" && !result.value.error) {
          summaries[model] =
            result.value.data.feedback ||
            `Could not generate summary from ${model}.`;
        } else {
          summaries[model] = getFallbackSummary(exercise, summaryData);
          console.error(
            `Error getting AI session summary for ${model}:`,
            result.status === "rejected" ? result.reason : result.value.error
          );
        }
      });

      return summaries;
    },
    [exercise, coachPersonality]
  );

  const getAIChatResponse = useCallback(
    async (
      chatHistory: ChatMessage[],
      sessionData: Record<string, unknown>,
      model: CoachModel
    ): Promise<string> => {
      if (!navigator.onLine) {
        return "You're offline. Please connect to the internet to chat with the coach.";
      }

      const userApiKeys = JSON.parse(
        localStorage.getItem("user-api-keys") || "{}"
      );

      try {
        const { data: responseData, error } = await supabase.functions.invoke(
          "coach-gemini",
          {
            body: {
              userApiKeys,
              model,
              type: "chat",
              exercise,
              personality: coachPersonality,
              ...sessionData,
              chatHistory,
            },
          }
        );

        if (error) throw error;

        return (
          responseData.feedback || "Sorry, I couldn't come up with a response."
        );
      } catch (error) {
        console.error(`Error getting AI chat response for ${model}:`, error);
        return getFallbackChatResponse(exercise, sessionData);
      }
    },
    [exercise, coachPersonality]
  );

  return { getAIFeedback, getAISessionSummary, getAIChatResponse };
};

// Fallback session summary when AI is unavailable
const getFallbackSummary = (
  exercise: Exercise,
  data: Record<string, unknown>
): string => {
  const reps = (data.reps as number) || 0;
  const avgScore = (data.averageFormScore as number) || 0;

  return `Session complete! You finished ${reps} ${exercise.replace(
    "-",
    " "
  )} with ${avgScore.toFixed(
    1
  )}% average form score. Keep up the consistent training!`;
};

// Fallback chat response when AI is unavailable
const getFallbackChatResponse = (
  exercise: Exercise,
  data: Record<string, unknown>
): string => {
  return "I'm temporarily unavailable. Keep focusing on your form and consistency!";
};
