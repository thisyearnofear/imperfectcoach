import { useRef, useCallback } from "react";
import {
  Exercise,
  WorkoutMode,
  CoachModel,
  SessionSummaries,
  ChatMessage,
  CoachPersonality,
} from "@/lib/types";
import { getPersonalityFeedback } from "@/lib/coachPersonalities";
import { API_ENDPOINTS } from "@/lib/config";

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

  const invokeCoachApi = useCallback(async (payload: Record<string, unknown>) => {
    const response = await fetch(API_ENDPOINTS.AI_COACH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Coach API request failed with status ${response.status}`);
    }

    return response.json();
  }, []);

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
        const result = await invokeCoachApi({
          type: "feedback",
          exercise,
          personality: coachPersonality,
          ...data,
        });

        if (result.feedback) {
          onFormFeedback(result.feedback);
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
    [exercise, coachPersonality, workoutMode, onFormFeedback, invokeCoachApi]
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

      if (!models.includes("gemini")) {
        return { gemini: getFallbackSummary(exercise, summaryData) };
      }

      try {
        const userApiKeys = JSON.parse(localStorage.getItem("user-api-keys") || "{}");
        const result = await invokeCoachApi({
          userApiKeys,
          model: "gemini",
          type: "summary",
          exercise: (summaryData.exercise as string) || exercise,
          personality: coachPersonality,
          ...summaryData,
        });

        return {
          gemini: result.feedback || getFallbackSummary(exercise, summaryData),
        };
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("Error getting AI session summary:", error);
        }
        return { gemini: getFallbackSummary(exercise, summaryData) };
      }
    },
    [exercise, coachPersonality, invokeCoachApi]
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

      // Only try Gemini to reduce API errors
      if (model !== "gemini") {
        return getFallbackChatResponse(exercise, sessionData);
      }

      try {
        const userApiKeys = JSON.parse(localStorage.getItem("user-api-keys") || "{}");
        const responseData = await invokeCoachApi({
          userApiKeys,
          model,
          type: "chat",
          exercise,
          personality: coachPersonality,
          ...sessionData,
          chatHistory,
        });

        return (
          responseData.feedback || "Sorry, I couldn't come up with a response."
        );
      } catch (error) {
        // Only log in development mode to reduce console spam
        if (process.env.NODE_ENV === "development") {
          console.warn(`Error getting AI chat response for ${model}:`, error);
        }
        return getFallbackChatResponse(exercise, sessionData);
      }
    },
    [exercise, coachPersonality, invokeCoachApi]
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
  
  // Format exercise name properly
  const exerciseName = exercise === "pull-ups" ? "pull ups" : exercise;

  return `Session complete! You finished ${reps} ${exerciseName} with ${avgScore.toFixed(
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
