import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Zap, Target, Trophy, Star, HeartPulse } from 'lucide-react';

const WelcomeMessage = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);

  const messages = [
    {
      icon: <Dumbbell className="w-12 h-12" />,
      title: "Welcome to Imperfect Coach!",
      description: "Your personal AI fitness companion that focuses on progress, not perfection.",
      badge: "AI-Powered"
    },
    {
      icon: <Zap className="w-12 h-12" />,
      title: "Real-time Form Analysis",
      description: "Advanced pose detection provides instant feedback to keep you safe and effective.",
      badge: "Smart Coaching"
    },
    {
      icon: <Target className="w-12 h-12" />,
      title: "Improve Your Movement",
      description: "Tracked reps, form scores, and personalized feedback help you get stronger every day.",
      badge: "Progressive"
    },
    {
      icon: <HeartPulse className="w-12 h-12" />,
      title: "Ready to Start?",
      description: "Allow camera access to begin your AI-powered fitness journey. Remember: progress over perfection!",
      badge: "Begin"
    }
  ];

  useEffect(() => {
    if (step === messages.length - 1) {
      // Auto-complete after showing the last message for a few seconds
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onComplete, 500); // Allow animation to complete
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [step, messages.length, onComplete]);

  const nextStep = () => {
    if (step < messages.length - 1) {
      setStep(prev => prev + 1);
    } else {
      setVisible(false);
      setTimeout(onComplete, 500); // Allow animation to complete
    }
  };

  const skipTutorial = () => {
    setVisible(false);
    setTimeout(onComplete, 500);
  };

  if (!visible) return null;

  const currentMessage = messages[step];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-background to-muted p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-card p-6 md:p-8 rounded-2xl shadow-xl max-w-md w-full border border-border/40 text-center"
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
      >
        <motion.div
          className="flex justify-center mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
        >
          <div className="p-4 bg-primary/10 rounded-full">
            {currentMessage.icon}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Badge variant="secondary" className="mb-4">
            {currentMessage.badge}
          </Badge>
          
          <h2 className="text-2xl font-bold mb-3 text-foreground">
            {currentMessage.title}
          </h2>
          
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {currentMessage.description}
          </p>
        </motion.div>

        <motion.div
          className="flex flex-col gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button 
            onClick={nextStep}
            className="w-full"
          >
            {step < messages.length - 1 ? 'Next' : 'Start Workout!'}
          </Button>
          
          {step === messages.length - 1 && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={skipTutorial}
            >
              Skip Tutorial
            </Button>
          )}
        </motion.div>

        <div className="flex justify-center mt-6 space-x-1">
          {messages.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted'
              }`}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeMessage;