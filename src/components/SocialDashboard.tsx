import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Activity, 
  Target, 
  Trophy,
  Settings,
  Bell,
  Search,
  ArrowLeft,
  Zap,
  ExternalLink
} from "lucide-react";
import PrivacySettings from "@/components/PrivacySettings";
import { Input } from "@/components/ui/input";
import MyPassport from "@/components/MyPassport";
import { useSocialContext } from "@/contexts/SocialContext";
import { useMemoryIdentity } from "@/hooks/useMemoryIdentity";
import { UnifiedWallet } from "@/components/UnifiedWallet";

const SocialDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { getFriendActivity, getFriendChallenges, friendAddresses } = useSocialContext();
  const { identityGraph, isLoading: isIdentityLoading } = useMemoryIdentity(address);

  // Search through connected identities
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !identityGraph?.identities) {
      return [];
    }

    const query = searchQuery.toLowerCase();
    return identityGraph.identities
      .filter((identity: any) => {
        const username = identity.username?.toLowerCase() || '';
        const platform = identity.platform?.toLowerCase() || '';
        return username.includes(query) || platform.includes(query);
      })
      .slice(0, 5)
      .map((identity: any) => ({
        id: identity.id,
        username: identity.username || identity.id.substring(0, 10),
        avatar: identity.avatar,
        platform: identity.platform,
        social: {
          followers: identity.social?.followers,
          following: identity.social?.following,
          verified: identity.social?.verified,
        },
      }));
  }, [searchQuery, identityGraph]);

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      twitter: '𝕏',
      farcaster: '🟣',
      lens: '👁️',
      github: '💻',
      zora: '🎨',
    };
    return icons[platform] || '🔗';
  };

  const challengeMessages = [
    "I challenge you to a workout! 💪 Let's see who can nail better form scores!",
    "You've been challenged! 🥊 Think you can beat my form? Prove it on Imperfect Coach!",
    "Form battle incoming! 🔥 Can you handle the challenge? Let's go!",
    "I just threw down the gauntlet 🎯 Your move on Imperfect Coach!",
    "Think you're stronger? 💯 Let's settle this with a form competition!",
    "Challenge accepted... or will you? 😤 Join me on Imperfect Coach!",
    "Time to show off those gains! 💥 I'm challenging you to beat my form score!",
    "My form is unbeatable... or is it? 👀 Challenge me back on Imperfect Coach!",
    "Feeling confident? 😎 Let's test your form against mine!",
    "The fitness gauntlet has been thrown 🏆 Think you can beat my score?",
    "I'm coming for that crown 👑 Can you handle my form challenge?",
    "Rep battle! 🚀 Let's see who's got the better technique on Imperfect Coach!",
    "Your form vs my form. 🥋 Who's the real champion?",
    "I dare you... 😏 Join me on Imperfect Coach and let's settle this!",
  ];

  const getRandomChallengeMessage = () => {
    return challengeMessages[Math.floor(Math.random() * challengeMessages.length)];
  };

  const generateChallengeImage = (): string => {
    // Generate a simple SVG graphic for social sharing (without emojis to avoid encoding issues)
    const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#667eea;stop-opacity:1" /><stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" /></linearGradient></defs><rect width="1200" height="630" fill="url(#grad)"/><text x="600" y="200" font-size="72" font-weight="bold" text-anchor="middle" fill="white" font-family="Arial">YOU'VE BEEN CHALLENGED</text><text x="600" y="300" font-size="48" text-anchor="middle" fill="white" font-family="Arial" font-weight="500">Form Battle</text><text x="600" y="380" font-size="48" text-anchor="middle" fill="white" font-family="Arial" font-weight="500">on Imperfect Coach</text><text x="600" y="520" font-size="42" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="Arial">imperfectcoach.netlify.app</text><rect x="350" y="550" width="500" height="60" rx="10" fill="rgba(255,255,255,0.2)" stroke="white" stroke-width="2"/><text x="600" y="595" font-size="32" text-anchor="middle" fill="white" font-family="Arial" font-weight="bold">ACCEPT CHALLENGE</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const handleChallenge = (friend: any) => {
    const challengeText = `@${friend.username} ${getRandomChallengeMessage()}`;
    const appUrl = 'https://imperfectcoach.netlify.app/';
    const challengeImage = generateChallengeImage();
    
    const platformHandlers: Record<string, (text: string) => void> = {
      twitter: (text) => {
        const fullText = `${text}\n\n${appUrl}`;
        // Twitter Intent URL - users will need to add image manually or use Twitter's native card
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}`,
          '_blank',
          'noopener,noreferrer'
        );
      },
      farcaster: (text) => {
        const fullText = `${text}\n\n${appUrl}`;
        // Farcaster supports embedding images in frame metadata
        window.open(
          `https://warpcast.com/~/compose?text=${encodeURIComponent(fullText)}`,
          '_blank',
          'noopener,noreferrer'
        );
      },
      lens: (text) => {
        const fullText = `${text}\n\n${appUrl}`;
        // Lens/Hey.xyz has image support
        window.open(
          `https://hey.xyz/?text=${encodeURIComponent(fullText)}`,
          '_blank',
          'noopener,noreferrer'
        );
      },
      github: (text) => {
        // GitHub doesn't have a direct compose URL with image support
        // Copy challenge text to clipboard for easy sharing
        const message = `${text}\n\n${appUrl}`;
        navigator.clipboard.writeText(message);
        alert(`Challenge copied to clipboard! Paste it in a GitHub issue or discussion.\n\n${message}`);
      },
      zora: (text) => {
        const fullText = `${text}\n\n${appUrl}`;
        // Open Zora with challenge text
        window.open(
          `https://zora.co`,
          '_blank',
          'noopener,noreferrer'
        );
      },
    };

    const handler = platformHandlers[friend.platform] || platformHandlers.farcaster;
    handler(challengeText);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="h-9 w-9"
            title="Back to workout"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Social Dashboard</h1>
            <p className="text-muted-foreground">
              Connect with friends and track your social fitness journey
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isConnected ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:block">Connect wallet to access social features</span>
              <UnifiedWallet variant="inline" />
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search friends..."
                  className="pl-8 w-40 md:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Challenges</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Achievements</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <MyPassport />
            <div className="space-y-6">
              <PrivacySettings />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity Feed</CardTitle>
              </CardHeader>
              <CardContent>
                {getFriendActivity().length > 0 ? (
                  <div className="space-y-3">
                    {getFriendActivity().map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <p className="font-medium text-sm">
                              {activity.username || activity.userId.substring(0, 6)}...
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {activity.exercise && activity.reps ? (
                              <span>{activity.reps} {activity.exercise}</span>
                            ) : (
                              <span className="capitalize">{activity.type}</span>
                            )}
                            {activity.message && (
                              <span> - {activity.message}</span>
                            )}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground text-right">
                          {new Date(activity.timestamp).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No activity yet from your friends</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Find Friends & Challenge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search identities..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {searchResults.length === 0 && !isIdentityLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Search your connected identities to challenge friends</p>
                  </div>
                )}

                {isIdentityLoading && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Loading identities...</p>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((friend) => (
                      <div key={friend.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex items-center gap-2">
                            {friend.avatar && (
                              <img src={friend.avatar} alt={friend.username} className="h-8 w-8 rounded-full" />
                            )}
                            <span className="text-lg">{getPlatformIcon(friend.platform)}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{friend.username}</p>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                                {friend.platform}
                              </span>
                            </div>
                            {friend.social?.followers && (
                              <p className="text-xs text-muted-foreground">
                                {friend.social.followers.toLocaleString()} followers
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleChallenge(friend)}
                          className="gap-1 ml-2 shrink-0"
                        >
                          <Zap className="h-3 w-3" />
                          Challenge
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Challenges</CardTitle>
              </CardHeader>
              <CardContent>
                {getFriendChallenges().length > 0 ? (
                  <div className="space-y-3">
                    {getFriendChallenges().map((challenge) => (
                      <div
                        key={challenge.id}
                        className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm capitalize">
                              {challenge.exercise} Challenge
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Target: {challenge.target} reps
                            </p>
                          </div>
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                            {challenge.participants.length} participants
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-muted-foreground">
                            Expires: {new Date(challenge.deadline).toLocaleDateString()}
                          </span>
                        </div>
                        <Button size="sm" className="w-full" variant="outline">
                          View Challenge
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No active challenges yet. Find friends above!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Achievements will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialDashboard;