import { useCallback } from "react";
import { Exercise, CoachPersonality } from "@/lib/types";

interface UseAWSAIFeedbackProps {
  exercise: Exercise;
  coachPersonality: CoachPersonality;
}

interface WorkoutData {
  exercise: string;
  reps: number;
  averageFormScore: number;
  duration?: number;
  repHistory?: any[];
}

interface SNELResponse {
  coach: 'SNEL';
  emoji: '🐌';
  tier: 'basic';
  feedback: string;
  note?: string;
}

interface STEDDIEResponse {
  coach: 'STEDDIE';
  emoji: '🐢';
  tier: 'premium';
  analysis: string;
}

// AWS Lambda endpoints
const SNEL_ENDPOINT = "https://your-api-id.execute-api.eu-north-1.amazonaws.com/snel-basic-coach";
const STEDDIE_ENDPOINT = "https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout";

export const useAWSAIFeedback = ({ exercise, coachPersonality }: UseAWSAIFeedbackProps) => {

  // SNEL 🐌 Basic Feedback - Free tier
  const getSNELFeedback = useCallback(
    async (data: { reps: number; averageFormScore: number; type?: string }): Promise<string> => {
      try {
        console.log('🐌 Calling SNEL basic coach...');

        const response = await fetch(SNEL_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            exercise,
            personality: coachPersonality,
            ...data
          })
        });

        if (!response.ok) {
          throw new Error(`SNEL API error: ${response.status}`);
        }

        const result: SNELResponse = await response.json();
        console.log('🐌 SNEL feedback received:', result.feedback);

        return result.feedback;

      } catch (error) {
        console.error('🐌 SNEL error:', error);

        // Smart fallback for SNEL
        const fallbacks = {
          'pull-ups': [
            "Nice work! Focus on controlled movement. 🐌",
            "Great effort! Pull with your back muscles. 🐌",
            "Solid reps! Keep that core engaged. 🐌"
          ],
          'jumps': [
            "Good height! Land softly on your toes. 🐌",
            "Explosive power! Bend knees on landing. 🐌",
            "Nice rhythm! Stay light on your feet. 🐌"
          ]
        };

        const exerciseFallbacks = fallbacks[exercise] || fallbacks['pull-ups'];
        return exerciseFallbacks[Math.floor(Math.random() * exerciseFallbacks.length)];
      }
    },
    [exercise, coachPersonality]
  );

  // STEDDIE 🐢 Premium Analysis - Paid tier
  const getSTEDDIEAnalysis = useCallback(
    async (workoutData: WorkoutData, paymentWrapper?: any): Promise<string> => {
      try {
        console.log('🐢 Calling STEDDIE premium analysis...');

        // Use payment wrapper if provided (x402 payments)
        const fetchFn = paymentWrapper || fetch;

        const response = await fetchFn(STEDDIE_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(workoutData)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(errorData.error || `STEDDIE API error: ${response.status}`);
        }

        const result = await response.json();
        console.log('🐢 STEDDIE analysis received');

        // Handle both old format (analysis) and new format (analysis field)
        return result.analysis || result.feedback || "Analysis completed successfully";

      } catch (error) {
        console.error('🐢 STEDDIE error:', error);
        throw error; // Let calling code handle premium errors
      }
    },
    []
  );

  // Quick feedback for real-time coaching
  const getQuickFeedback = useCallback(
    async (data: { reps: number; averageFormScore: number; lastIssues?: string[] }): Promise<string> => {
      // For real-time feedback, always use SNEL (basic, fast)
      return getSNELFeedback({ ...data, type: 'feedback' });
    },
    [getSNELFeedback]
  );

  // Session summary after workout
  const getSessionSummary = useCallback(
    async (workoutData: WorkoutData): Promise<{ snel: string; steddie?: string }> => {
      try {
        // Always get basic SNEL summary
        const snelSummary = await getSNELFeedback({
          reps: workoutData.reps,
          averageFormScore: workoutData.averageFormScore,
          type: 'summary'
        });

        return {
          snel: snelSummary,
          // STEDDIE would be called separately via premium flow
        };
      } catch (error) {
        console.error('Session summary error:', error);
        return {
          snel: "Great workout! Keep up the consistent effort. 🐌"
        };
      }
    },
    [getSNELFeedback]
  );

  // Chat functionality (basic only for now)
  const getChatResponse = useCallback(
    async (message: string, context: WorkoutData): Promise<string> => {
      try {
        const response = await fetch(SNEL_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            exercise,
            personality: coachPersonality,
            type: 'chat',
            message,
            ...context
          })
        });

        if (!response.ok) {
          throw new Error(`Chat API error: ${response.status}`);
        }

        const result: SNELResponse = await response.json();
        return result.feedback;

      } catch (error) {
        console.error('Chat error:', error);
        return "I'm having trouble connecting right now. Try asking again! 🐌";
      }
    },
    [exercise, coachPersonality]
  );

  return {
    // Basic tier (SNEL 🐌)
    getSNELFeedback,
    getQuickFeedback,
    getSessionSummary,
    getChatResponse,

    // Premium tier (STEDDIE 🐢)
    getSTEDDIEAnalysis,
  };
};
