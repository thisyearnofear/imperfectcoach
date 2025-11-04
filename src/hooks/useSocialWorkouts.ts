import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useMemoryIdentity } from './useMemoryIdentity';
import { useSocialContext } from '@/contexts/SocialContext';
import { Exercise, RepData } from '@/lib/types';

interface SocialWorkoutData {
  exercise: Exercise;
  totalReps: number;
  averageFormScore: number;
  repHistory: RepData[];
}

interface SocialWorkoutFeatures {
  initiateChallenge: (exercise: Exercise, target: number, friends: string[]) => string;
  shareWorkout: (workoutData: SocialWorkoutData) => void;
  getConnectedFriends: () => string[];
  getFriendActivity: (limit?: number) => any[];
  challengeFriend: (friendAddress: string, exercise: Exercise, target: number) => void;
  isFriend: (address: string) => boolean;
  isLoading: boolean;
  error: string | null;
}

export const useSocialWorkouts = (): SocialWorkoutFeatures => {
  const { address: currentUserAddress } = useAccount();
  const { identityGraph, isLoading: isIdentityLoading, error: identityError } = useMemoryIdentity(currentUserAddress);
  const { 
    addSocialActivity, 
    createChallenge, 
    getFriendActivity, 
    friendAddresses 
  } = useSocialContext();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(isIdentityLoading);
    setError(identityError);
  }, [isIdentityLoading, identityError]);

  const initiateChallenge = (exercise: Exercise, target: number, friends: string[]): string => {
    const challengeId = createChallenge({
      creator: currentUserAddress || '',
      participants: [currentUserAddress || '', ...friends],
      exercise: exercise,
      target: target,
      deadline: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'active',
    });

    // Add challenge activity
    addSocialActivity({
      type: 'challenge',
      userId: currentUserAddress || '',
      message: `Started a ${target} ${exercise} challenge!`,
      timestamp: Date.now(),
      exercise: exercise,
      relatedUsers: friends,
    });

    return challengeId;
  };

  const shareWorkout = (workoutData: SocialWorkoutData) => {
    addSocialActivity({
      type: 'workout',
      userId: currentUserAddress || '',
      timestamp: Date.now(),
      exercise: workoutData.exercise,
      reps: workoutData.totalReps,
      score: workoutData.averageFormScore,
      message: `Just completed ${workoutData.totalReps} ${workoutData.exercise} with ${workoutData.averageFormScore}% form accuracy!`,
    });
  };

  const getConnectedFriends = (): string[] => {
    return friendAddresses;
  };

  const challengeFriend = (friendAddress: string, exercise: Exercise, target: number) => {
    const challengeId = createChallenge({
      creator: currentUserAddress || '',
      participants: [currentUserAddress || '', friendAddress],
      exercise: exercise,
      target: target,
      deadline: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'active',
    });

    // Add challenge activity
    addSocialActivity({
      type: 'challenge',
      userId: currentUserAddress || '',
      message: `Challenged ${friendAddress.substring(0, 6)}... to ${target} ${exercise}!`,
      timestamp: Date.now(),
      exercise: exercise,
      relatedUsers: [friendAddress],
    });

    return challengeId;
  };

  const isFriend = (address: string): boolean => {
    return friendAddresses.includes(address);
  };

  return {
    initiateChallenge,
    shareWorkout,
    getConnectedFriends,
    getFriendActivity,
    challengeFriend,
    isFriend,
    isLoading,
    error,
  };
};