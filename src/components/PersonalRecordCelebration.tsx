import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PersonalRecordCelebrationProps {
  isVisible: boolean;
  recordType: 'rep' | 'form' | 'jump' | 'combo';
  exercise: 'pull-ups' | 'jumps';
  newValue: number;
  onComplete: () => void;
}

const ConfettiPiece = ({ delay }: { delay: number }) => {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const leftPos = `${Math.random() * 100}%`;

  return (
    <motion.div
      className="absolute w-3 h-3 rounded-full"
      style={{ backgroundColor: color }}
      initial={{
        left: leftPos,
        top: '-10px',
        rotate: 0,
      }}
      animate={{
        top: '100vh',
        rotate: 360,
        left: `calc(${leftPos} + ${Math.random() > 0.5 ? '' : '-'}${Math.random() * 100}vw)`,
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        delay: delay,
        ease: 'easeOut',
      }}
    />
  );
};

const PersonalRecordCelebration: React.FC<PersonalRecordCelebrationProps> = ({ 
  isVisible, 
  recordType, 
  exercise, 
  newValue, 
  onComplete 
}) => {
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isVisible) {
      // Auto-complete after 5 seconds
      timer = setTimeout(() => {
        onComplete();
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  const getRecordMessage = () => {
    switch (recordType) {
      case 'rep':
        return `New Personal Record! ${newValue} ${exercise}`;
      case 'form':
        return `New Form Record! ${newValue}%`;
      case 'jump':
        return `New Jump Height Record! ${newValue} cm`;
      case 'combo':
        return `New All-Time Record!`;
      default:
        return `Personal Record!`;
    }
  };

  const getRecordIcon = () => {
    switch (recordType) {
      case 'rep':
        return <Trophy className="w-12 h-12 text-yellow-400" />;
      case 'form':
        return <Star className="w-12 h-12 text-green-400" />;
      case 'jump':
        return <Sparkles className="w-12 h-12 text-purple-400" />;
      case 'combo':
        return <Sparkles className="w-12 h-12 text-pink-400" />;
      default:
        return <Trophy className="w-12 h-12 text-yellow-400" />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Confetti */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 80 }).map((_, i) => (
            <ConfettiPiece key={i} delay={i * 0.02} />
          ))}
        </div>

        {/* Celebration Modal */}
        <motion.div
          className="relative bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-8 rounded-2xl shadow-2xl text-white text-center max-w-sm mx-4 z-10"
          initial={{ scale: 0.5, rotate: -5 }}
          animate={{
            scale: 1,
            rotate: 0,
            transition: {
              type: 'spring',
              duration: 0.8,
              bounce: 0.4,
            },
          }}
          exit={{ scale: 0.5, opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', bounce: 0.6 }}
          >
            {getRecordIcon()}
          </motion.div>

          <motion.h2
            className="text-2xl font-bold mb-2 mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Personal Record!
          </motion.h2>

          <motion.p
            className="text-lg font-semibold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {getRecordMessage()}
          </motion.p>

          <motion.p
            className="text-sm mb-6 opacity-90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Congratulations! You've reached a new milestone in your fitness journey.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Button
              onClick={onComplete}
              className="bg-white text-orange-600 hover:bg-gray-100 font-bold"
            >
              Continue Workout
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PersonalRecordCelebration;