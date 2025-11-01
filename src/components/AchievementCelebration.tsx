import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Achievement } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Trophy, Sparkles } from 'lucide-react';

interface AchievementCelebrationProps {
  achievement: Achievement;
  onComplete: () => void;
}

const ConfettiPiece = ({ delay }: { delay: number }) => {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full"
      style={{ backgroundColor: color }}
      initial={{
        x: Math.random() * window.innerWidth,
        y: -10,
        rotate: 0,
      }}
      animate={{
        y: window.innerHeight + 10,
        rotate: 360,
        x: Math.random() * window.innerWidth,
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        delay: delay,
        ease: 'easeOut',
      }}
    />
  );
};

const AchievementCelebration = ({ achievement, onComplete }: AchievementCelebrationProps) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Start confetti after a short delay
    const timer = setTimeout(() => setShowConfetti(true), 500);

    // Auto-complete after 4 seconds
    const completeTimer = setTimeout(onComplete, 4000);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Confetti */}
        {showConfetti && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 50 }).map((_, i) => (
              <ConfettiPiece key={i} delay={i * 0.05} />
            ))}
          </div>
        )}

        {/* Celebration Modal */}
        <motion.div
          className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-8 rounded-2xl shadow-2xl text-white text-center max-w-sm mx-4"
          initial={{ scale: 0.5, rotate: -10 }}
          animate={{
            scale: 1,
            rotate: 0,
            transition: {
              type: 'spring',
              duration: 0.6,
              bounce: 0.4,
            },
          }}
          exit={{ scale: 0.8, opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', bounce: 0.6 }}
          >
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-yellow-200" />
          </motion.div>

          <motion.h2
            className="text-2xl font-bold mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Achievement Unlocked!
          </motion.h2>

          <motion.div
            className="flex items-center justify-center gap-3 mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
          >
            <achievement.icon className="w-8 h-8" />
            <div className="text-left">
              <h3 className="text-xl font-semibold">{achievement.name}</h3>
              <p className="text-sm opacity-90">{achievement.description}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <Trophy className="w-4 h-4 mr-1" />
              +100 XP
            </Badge>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AchievementCelebration;
