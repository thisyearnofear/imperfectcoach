import { useState, useEffect, useCallback } from 'react';
import { CoachPersonality, getCoachInfo, getPersonalityFeedback } from '@/lib/coachPersonalities';

interface UserPerformance {
  averageFormScore: number;
  sessionCount: number;
  recentStreak: number;
  currentEnergy: 'low' | 'medium' | 'high';
}

interface AdaptiveCoachingOptions {
  userPerformance?: UserPerformance;
  preferredPersonality?: CoachPersonality;
  enableVoice?: boolean;
}

export const useAdaptiveCoaching = (options: AdaptiveCoachingOptions = {}) => {
  const { userPerformance, preferredPersonality, enableVoice = false } = options;
  const [currentPersonality, setCurrentPersonality] = useState<CoachPersonality>(
    preferredPersonality || 'RASTA'
  );
  const [voiceEnabled, setVoiceEnabled] = useState(enableVoice);

  // Adapt personality based on user performance
  useEffect(() => {
    if (!userPerformance) return;

    const { averageFormScore, sessionCount, recentStreak, currentEnergy } = userPerformance;

    let adaptedPersonality = preferredPersonality || 'RASTA';

    // New users get more supportive coaching
    if (sessionCount < 3) {
      adaptedPersonality = 'SNEL';
    }
    // Experienced users with good form get competitive coaching
    else if (averageFormScore > 85 && recentStreak > 5) {
      adaptedPersonality = 'RASTA';
    }
    // Users struggling get zen/mindful coaching
    else if (averageFormScore < 70 || currentEnergy === 'low') {
      adaptedPersonality = 'STEDDIE';
    }

    setCurrentPersonality(adaptedPersonality);
  }, [userPerformance, preferredPersonality]);

  const getAdaptiveFeedback = useCallback((
    context: 'encouragement' | 'form_feedback' | 'rep_complete' | 'session_start' | 'milestone',
    formScore?: number,
    milestoneData?: { type: string; value: number }
  ): string => {
    let feedback = getPersonalityFeedback(currentPersonality, context, formScore);

    // Add personalized elements based on performance
    if (userPerformance && context === 'encouragement') {
      if (userPerformance.recentStreak > 3) {
        feedback += ` You're on fire with a ${userPerformance.recentStreak}-day streak! 🔥`;
      }
    }

    if (context === 'milestone' && milestoneData) {
      const { type, value } = milestoneData;
      if (type === 'personal_best') {
        feedback = `🎉 Personal best! ${value} reps - you're crushing it!`;
      } else if (type === 'streak') {
        feedback = `🔥 ${value} day streak! You're unstoppable!`;
      }
    }

    return feedback;
  }, [currentPersonality, userPerformance]);

  const speakFeedback = useCallback(async (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;

    try {
      const utterance = new SpeechSynthesisUtterance(text);

      // Configure voice based on personality
      const voices = speechSynthesis.getVoices();
      const coachInfo = getCoachInfo(currentPersonality);

      // Try to find an appropriate voice
      let selectedVoice = voices.find(voice =>
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('alex')
      ) || voices[0];

      if (currentPersonality === 'RASTA') {
        // More energetic voice for competitive coach
        utterance.rate = 1.1;
        utterance.pitch = 1.0;
      } else if (currentPersonality === 'STEDDIE') {
        // Calmer voice for zen coach
        utterance.rate = 0.9;
        utterance.pitch = 0.9;
      } else {
        // Balanced voice for supportive coach
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
      }

      utterance.voice = selectedVoice;

      // Stop any current speech
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.warn('Voice synthesis failed:', error);
    }
  }, [voiceEnabled, currentPersonality]);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => !prev);
  }, []);

  return {
    currentPersonality,
    voiceEnabled,
    getAdaptiveFeedback,
    speakFeedback,
    toggleVoice,
    coachInfo: getCoachInfo(currentPersonality),
  };
};
