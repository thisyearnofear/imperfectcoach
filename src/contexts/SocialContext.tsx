import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMemoryIdentity } from '@/hooks/useMemoryIdentity';
import { useAccount } from 'wagmi';
import { BlockchainScore } from '@/lib/types';

interface SocialActivity {
  id: string;
  type: 'workout' | 'achievement' | 'challenge' | 'streak';
  userId: string;
  username?: string;
  timestamp: number;
  exercise?: string;
  reps?: number;
  score?: number;
  message?: string;
  relatedUsers?: string[];
}

interface SocialChallenge {
  id: string;
  creator: string;
  participants: string[];
  exercise: string;
  target: number;
  deadline: number;
  status: 'active' | 'completed' | 'expired';
  createdAt: number;
}

interface SocialAchievement {
  id: string;
  userId: string;
  type: 'workout_shared' | 'challenge_completed' | 'social_connected' | 'friend_invited' | 'activity_commented';
  title: string;
  description: string;
  platform: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface SocialContextType {
  socialActivities: SocialActivity[];
  socialChallenges: SocialChallenge[];
  socialAchievements: SocialAchievement[];
  friendAddresses: string[];
  isLoading: boolean;
  error: string | null;
  addSocialActivity: (activity: Omit<SocialActivity, 'id'>) => void;
  createChallenge: (challenge: Omit<SocialChallenge, 'id' | 'status' | 'createdAt'>) => string;
  joinChallenge: (challengeId: string) => void;
  addSocialAchievement: (achievement: Omit<SocialAchievement, 'id'>) => void;
  getActiveChallenges: () => SocialChallenge[];
  getCompletedChallenges: () => SocialChallenge[];
  getUserChallenges: (userId: string) => SocialChallenge[];
  getFriendChallenges: () => SocialChallenge[];
  updateChallengeStatus: (challengeId: string, status: 'active' | 'completed' | 'expired') => void;
  getFriendActivity: (limit?: number) => SocialActivity[];
  getFilteredFriendActivity: (timeFilter: 'today' | 'week' | 'month', limit?: number) => SocialActivity[];
  getGroupedFriendActivity: (timeFilter: 'today' | 'week' | 'month', limit?: number) => Record<string, SocialActivity[]>;
  getUserAchievements: (userId: string) => SocialAchievement[];
  getPlatformAchievements: (platform: string) => SocialAchievement[];
  getRecentAchievements: (limit?: number) => SocialAchievement[];
  getFriendLeaderboard: () => BlockchainScore[];
  refreshSocialData: () => void;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

interface SocialProviderProps {
  children: ReactNode;
  initialActivities?: SocialActivity[];
}

export const SocialProvider: React.FC<SocialProviderProps> = ({ children, initialActivities = [] }) => {
  const { address: currentUserAddress } = useAccount();
  const { identityGraph, isLoading: isIdentityLoading, error: identityError } = useMemoryIdentity(currentUserAddress);
  
  const [socialActivities, setSocialActivities] = useState<SocialActivity[]>(initialActivities);
  const [socialChallenges, setSocialChallenges] = useState<SocialChallenge[]>([]);
  const [socialAchievements, setSocialAchievements] = useState<SocialAchievement[]>([]);
  const [friendAddresses, setFriendAddresses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract friend addresses from social identities
  useEffect(() => {
    if (identityGraph?.identities && Array.isArray(identityGraph.identities)) {
      const addresses = identityGraph.identities
        .filter(id => id && ['farcaster', 'twitter', 'lens', 'zora', 'github'].includes(id.platform))
        .map(id => id.id)
        .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates
      
      setFriendAddresses(addresses);
    } else {
      setFriendAddresses([]);
    }
  }, [identityGraph]);

  // Combine identity loading state with our own loading state
  useEffect(() => {
    setIsLoading(isIdentityLoading);
    setError(identityError);
  }, [isIdentityLoading, identityError]);

  // Add social activity
  const addSocialActivity = (activity: Omit<SocialActivity, 'id'>) => {
    const newActivity: SocialActivity = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    setSocialActivities(prev => [newActivity, ...prev]); // Add to beginning for newest first
  };

  // Create a new challenge
  const createChallenge = (challenge: Omit<SocialChallenge, 'id' | 'status' | 'createdAt'>): string => {
    const newChallenge: SocialChallenge = {
      ...challenge,
      id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'active',
      createdAt: Date.now(),
    };
    
    setSocialChallenges(prev => [...prev, newChallenge]);
    return newChallenge.id;
  };

  // Join an existing challenge
  const joinChallenge = (challengeId: string) => {
    setSocialChallenges(prev => 
      prev.map(challenge => 
        challenge.id === challengeId && !challenge.participants.includes(currentUserAddress || '')
          ? { 
              ...challenge, 
              participants: [...challenge.participants, currentUserAddress || ''] 
            }
          : challenge
      )
    );
  };

  // Get active challenges
  const getActiveChallenges = (): SocialChallenge[] => {
    return socialChallenges.filter(challenge => challenge.status === 'active');
  };

  // Get completed challenges
  const getCompletedChallenges = (): SocialChallenge[] => {
    return socialChallenges.filter(challenge => challenge.status === 'completed');
  };

  // Get challenges created by a specific user
  const getUserChallenges = (userId: string): SocialChallenge[] => {
    return socialChallenges.filter(challenge => challenge.creator === userId);
  };

  // Get challenges involving friends
  const getFriendChallenges = (): SocialChallenge[] => {
    return socialChallenges.filter(challenge => 
      challenge.participants.some(participant => friendAddresses.includes(participant))
    );
  };

  // Add social achievement
  const addSocialAchievement = (achievement: Omit<SocialAchievement, 'id'>) => {
    const newAchievement: SocialAchievement = {
      ...achievement,
      id: `achievement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    setSocialAchievements(prev => [newAchievement, ...prev]);
  };

  // Get user achievements
  const getUserAchievements = (userId: string): SocialAchievement[] => {
    return socialAchievements.filter(achievement => achievement.userId === userId);
  };

  // Get achievements by platform
  const getPlatformAchievements = (platform: string): SocialAchievement[] => {
    return socialAchievements.filter(achievement => achievement.platform === platform);
  };

  // Get friend activity
  const getFriendActivity = (limit?: number): SocialActivity[] => {
    const friendActivities = socialActivities.filter(activity =>
      friendAddresses.includes(activity.userId)
    );
    
    const sortedActivities = friendActivities
      .sort((a, b) => b.timestamp - a.timestamp);
    
    return limit ? sortedActivities.slice(0, limit) : sortedActivities;
  };

  // Get filtered friend activity
  const getFilteredFriendActivity = (timeFilter: 'today' | 'week' | 'month', limit?: number): SocialActivity[] => {
    const now = Date.now();
    let timeLimit: number;
    
    switch (timeFilter) {
      case 'today':
        timeLimit = now - (24 * 60 * 60 * 1000);
        break;
      case 'week':
        timeLimit = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        timeLimit = now - (30 * 24 * 60 * 60 * 1000);
        break;
      default:
        timeLimit = 0;
    }
    
    const filteredActivities = socialActivities.filter(activity =>
      friendAddresses.includes(activity.userId) && activity.timestamp >= timeLimit
    );
    
    const sortedActivities = filteredActivities
      .sort((a, b) => b.timestamp - a.timestamp);
    
    return limit ? sortedActivities.slice(0, limit) : sortedActivities;
  };

  // Get recent achievements
  const getRecentAchievements = (limit = 10): SocialAchievement[] => {
    return socialAchievements
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  };

  // Get grouped friend activity by day
  const getGroupedFriendActivity = (timeFilter: 'today' | 'week' | 'month', limit?: number): Record<string, SocialActivity[]> => {
    const filteredActivities = getFilteredFriendActivity(timeFilter, limit);
    
    return filteredActivities.reduce((groups, activity) => {
      const date = new Date(activity.timestamp);
      const dateKey = date.toDateString();
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(activity);
      return groups;
    }, {} as Record<string, SocialActivity[]>);
  };

  // Placeholder for friend leaderboard (would integrate with actual blockchain leaderboard)
  const getFriendLeaderboard = (): BlockchainScore[] => {
    // This would typically fetch the actual leaderboard and filter for friends
    // For now, returning empty array as a placeholder
    return [];
  };

  // Update challenge status
  const updateChallengeStatus = (challengeId: string, status: 'active' | 'completed' | 'expired') => {
    setSocialChallenges(prev =>
      prev.map(challenge =>
        challenge.id === challengeId
          ? { ...challenge, status }
          : challenge
      )
    );
  };

  // Refresh social data (e.g. when new workout is completed)
  const refreshSocialData = () => {
    setIsLoading(true);
    // In a real implementation, this would fetch fresh social data
    // For now, just reset loading state
    setTimeout(() => setIsLoading(false), 500);
  };

  const value = {
    socialActivities,
    socialChallenges,
    socialAchievements,
    friendAddresses,
    isLoading,
    error,
    addSocialActivity,
    createChallenge,
    joinChallenge,
    addSocialAchievement,
    getActiveChallenges,
    getCompletedChallenges,
    getUserChallenges,
    getFriendChallenges,
    updateChallengeStatus,
    getFriendActivity,
    getFilteredFriendActivity,
    getGroupedFriendActivity,
    getUserAchievements,
    getPlatformAchievements,
    getRecentAchievements,
    getFriendLeaderboard,
    refreshSocialData,
  };

  return (
    <SocialContext.Provider value={value}>
      {children}
    </SocialContext.Provider>
  );
};

export const useSocialContext = (): SocialContextType => {
  const context = useContext(SocialContext);
  if (context === undefined) {
    throw new Error('useSocialContext must be used within a SocialProvider');
  }
  return context;
};