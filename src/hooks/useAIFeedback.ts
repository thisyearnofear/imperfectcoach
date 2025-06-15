import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Exercise, CoachPersonality, WorkoutMode } from '@/lib/types';
import { getRandomFeedback } from '@/lib/feedbackUtils';

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

  const getAIFeedback = useCallback(async (data: Record<string, any>) => {
    if (aiFeedbackCooldown.current || workoutMode === 'assessment') return;
    
    aiFeedbackCooldown.current = true;
    setTimeout(() => { aiFeedbackCooldown.current = false; }, 4000); // 4-second cooldown

    const lastIssues = data.formIssues || [];

    if (!navigator.onLine) {
        onFormFeedback(getRandomFeedback(lastIssues));
        return;
    }

    try {
      const { data: responseData, error } = await supabase.functions.invoke('coach-gemini', {
        body: { exercise, personality: coachPersonality, ...data }
      });
      if (error) throw error;
      if (responseData.feedback) {
        onFormFeedback(responseData.feedback);
      }
    } catch (error) {
      console.error('Error getting AI feedback:', error);
      onFormFeedback(getRandomFeedback(lastIssues));
    }
  }, [exercise, coachPersonality, workoutMode, onFormFeedback]);

  const getAISessionSummary = useCallback(async (summaryData: Record<string, any>) => {
    if (!navigator.onLine) {
        return "You're offline. Connect to the internet to get a session summary.";
    }
    try {
        const { data: responseData, error } = await supabase.functions.invoke('coach-gemini', {
            body: { 
                type: 'summary',
                exercise,
                personality: coachPersonality,
                ...summaryData 
            }
        });
        if (error) throw error;
        return responseData.feedback || "Could not generate summary.";
    } catch (error) {
        console.error('Error getting AI session summary:', error);
        return "There was an issue generating your session summary.";
    }
  }, [exercise, coachPersonality]);

  return { getAIFeedback, getAISessionSummary };
};
