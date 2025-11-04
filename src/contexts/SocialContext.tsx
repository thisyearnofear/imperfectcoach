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

interface SocialContextType {
  socialActivities: SocialActivity[];
  socialChallenges: SocialChallenge[];
  friendAddresses: string[];
  isLoading: boolean;
  error: string | null;
  addSocialActivity: (activity: Omit<SocialActivity, 'id'>) => void;
  createChallenge: (challenge: Omit<SocialChallenge, 'id' | 'status' | 'createdAt'>) => string;
  joinChallenge: (challengeId: string) => void;
  getFriendActivity: (limit?: number) => SocialActivity[];
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
  const [friendAddresses, setFriendAddresses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract friend addresses from social identities
  useEffect(() => {
    if (identityGraph?.identities) {
      const addresses = identityGraph.identities
        .filter(id => ['farcaster', 'twitter', 'lens'].includes(id.platform))
        .map(id => id.id)
        .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates
      
      setFriendAddresses(addresses);
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

  // Get friend activity (activities from connected social identities)
  const getFriendActivity = (limit = 10): SocialActivity[] => {
    return socialActivities
      .filter(activity => friendAddresses.includes(activity.userId))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  };

  // Placeholder for friend leaderboard (would integrate with actual blockchain leaderboard)
  const getFriendLeaderboard = (): BlockchainScore[] => {
    // This would typically fetch the actual leaderboard and filter for friends
    // For now, returning empty array as a placeholder
    return [];
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
    friendAddresses,
    isLoading,
    error,
    addSocialActivity,
    createChallenge,
    joinChallenge,
    getFriendActivity,
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