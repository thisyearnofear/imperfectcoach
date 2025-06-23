
import { useRef, useCallback } from 'react';

/**
 * Provides audio feedback for reps and form corrections.
 * Uses Web Audio API for beeps and SpeechSynthesis for voice.
 */
export const useAudioFeedback = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastSpeechTime = useRef<number>(0);
  const lastSpeechText = useRef<string>('');

  // Memoized function to play a simple beep sound.
  const playBeep = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    if (!audioContextRef.current) {
      // Lazy initialization of AudioContext on first user interaction.
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5 note
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  }, []);

  // Memoized function to speak text using the browser's TTS engine.
  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const now = Date.now();
      const timeSinceLastSpeech = now - lastSpeechTime.current;
      
      // Throttle speech: don't speak the same thing within 2 seconds, or anything within 1 second
      if (timeSinceLastSpeech < 1000 || (text === lastSpeechText.current && timeSinceLastSpeech < 2000)) {
        return;
      }
      
      lastSpeechTime.current = now;
      lastSpeechText.current = text;
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.0; // Slightly slower for clarity
      utterance.pitch = 1.0; // More natural pitch
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  return { playBeep, speak };
};
