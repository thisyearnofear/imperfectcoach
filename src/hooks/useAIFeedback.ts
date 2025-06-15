import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Exercise, CoachPersonality, WorkoutMode, CoachModel, SessionSummaries } from '@/lib/types';
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

  const getAISessionSummary = useCallback(async (summaryData: Record<string, any>, models: CoachModel[]): Promise<SessionSummaries> => {
    if (!navigator.onLine) {
        return { "gemini": "You're offline. Connect to the internet to get a session summary."};
    }
    if (models.length === 0) {
        return {};
    }

    const promises = models.map(model => 
        supabase.functions.invoke('coach-gemini', { // The function is still named 'coach-gemini' in Supabase
            body: { 
                model, // Pass the specific model for the summary
                type: 'summary',
                exercise,
                personality: coachPersonality,
                ...summaryData 
            }
        })
    );

    const results = await Promise.allSettled(promises);
    const summaries: SessionSummaries = {};

    results.forEach((result, index) => {
        const model = models[index];
        if (result.status === 'fulfilled' && !result.value.error) {
            summaries[model] = result.value.data.feedback || `Could not generate summary from ${model}.`;
        } else {
            summaries[model] = `There was an issue generating your summary from ${model}.`;
            console.error(`Error getting AI session summary for ${model}:`, result.status === 'rejected' ? result.reason : result.value.error);
        }
    });

    return summaries;
  }, [exercise, coachPersonality]);

  return { getAIFeedback, getAISessionSummary };
};
