import { useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Exercise,
  CoachPersonality,
  WorkoutMode,
  CoachModel,
  SessionSummaries,
  ChatMessage,
} from "@/lib/types";
import { getRandomFeedback } from "@/lib/feedbackUtils";

// Fallback feedback when AI services are unavailable
const getFallbackFeedback = (
  exercise: Exercise,
  issues: string[] = []
): string => {
  const fallbackMessages = {
    "pull-ups": [
      "Keep pushing! Focus on full range of motion and controlled movement.",
      "Great effort! Remember to engage your core and avoid swinging.",
      "Nice work! Try to pull your chest to the bar for maximum benefit.",
      "Keep it up! Control the descent to maximize muscle engagement.",
    ],
    jumps: [
      "Explosive power! Focus on soft landings to protect your joints.",
      "Great height! Remember to land with bent knees for safety.",
      "Nice jumps! Try to maintain consistent form throughout the set.",
      "Keep jumping! Focus on quick takeoffs and controlled landings.",
    ],
    default: [
      "Great workout! Keep maintaining good form and consistency.",
      "Nice effort! Focus on quality over quantity.",
      "Keep it up! Remember to breathe and stay focused.",
      "Excellent work! Consistency is key to improvement.",
    ],
  };

  const messages = fallbackMessages[exercise] || fallbackMessages.default;

  // If there are specific issues, provide targeted advice
  if (issues.length > 0) {
    const issueAdvice = {
      form: "Focus on maintaining proper form - slow and controlled movements work best.",
      range: "Try to achieve full range of motion for maximum effectiveness.",
      pace: "Consider adjusting your pace - quality repetitions are more valuable than speed.",
      fatigue:
        "Take a moment to rest if needed - proper form is more important than pushing through fatigue.",
    };

    for (const issue of issues) {
      if (issueAdvice[issue.toLowerCase()]) {
        return issueAdvice[issue.toLowerCase()];
      }
    }
  }

  // Return random motivational message
  return messages[Math.floor(Math.random() * messages.length)];
};

interface UseAIFeedbackProps {
  exercise: Exercise;
  coachPersonality: CoachPersonality;
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

  const getAIFeedback = useCallback(
    async (data: Record<string, unknown>) => {
      if (aiFeedbackCooldown.current || workoutMode === "assessment") return;

      aiFeedbackCooldown.current = true;
      setTimeout(() => {
        aiFeedbackCooldown.current = false;
      }, 4000); // 4-second cooldown

      const lastIssues = (data.formIssues as string[]) || [];

      if (!navigator.onLine) {
        onFormFeedback(getRandomFeedback(lastIssues));
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
        }
      } catch (error) {
        console.error("Error getting AI feedback:", error);
        // Provide more helpful fallback feedback based on exercise type
        const fallbackFeedback = getFallbackFeedback(exercise, lastIssues);
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

  if (exercise === "pull-ups") {
    return `Session Complete! You performed ${reps} pull-ups with an average form score of ${avgScore.toFixed(
      1
    )}%. Focus on maintaining full range of motion and controlled movement for continued improvement.`;
  } else if (exercise === "jumps") {
    return `Great jumping session! You completed ${reps} jumps with ${avgScore.toFixed(
      1
    )}% average form. Keep working on explosive takeoffs and soft landings for optimal performance.`;
  }

  return `Workout complete! You finished ${reps} repetitions with ${avgScore.toFixed(
    1
  )}% average form score. Keep up the consistent training for continued progress.`;
};

// Fallback chat response when AI is unavailable
const getFallbackChatResponse = (
  exercise: Exercise,
  data: Record<string, unknown>
): string => {
  const responses = [
    "I'm currently offline, but keep focusing on your form and consistency!",
    "AI coach temporarily unavailable. Remember: quality over quantity in every rep!",
    "Service temporarily down. Keep up the great work and maintain proper breathing!",
    "I'll be back soon! In the meantime, focus on controlled movements and full range of motion.",
  ];

  return responses[Math.floor(Math.random() * responses.length)];
};
