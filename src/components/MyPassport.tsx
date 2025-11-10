import { useAccount, useReadContract } from "wagmi";
import { IMPERFECT_COACH_PASSPORT_CONFIG } from "@/lib/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMemoryIdentity } from "@/hooks/useMemoryIdentity";
import { useSocialContext } from "@/contexts/SocialContext";
import { Users, Trophy, Calendar, Shield, Verified } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";

// Define a type for the passport data structure to ensure type safety
type PassportData = {
  level: number;
  totalPullups: number;
  totalJumps: number;
  pullupPersonalBest: number;
  jumpPersonalBest: number;
  currentStreak: number;
  longestStreak: number;
  totalWorkoutSessions: bigint;
};

const MyPassport = () => {
const { address, isConnected } = useAccount();
  const { getSocialIdentities, isLoading: identityLoading } = useMemoryIdentity(address);

  // 1. Fetch the user's tokenId first
  const { data: tokenId, isLoading: isLoadingTokenId } = useReadContract({
    ...IMPERFECT_COACH_PASSPORT_CONFIG,
    functionName: "getTokenId",
    args: [address!],
    query: {
      enabled: isConnected && !!address,
    },
  });

  // 2. Fetch the full passport data, enabled only when tokenId is available
  const {
    data: passportData,
    isLoading: isLoadingPassport,
    error: passportError,
  } = useReadContract({
    ...IMPERFECT_COACH_PASSPORT_CONFIG,
    functionName: "getPassportData",
    args: [address!],
    query: {
      enabled:
        isConnected && !!address && !!tokenId && (tokenId as bigint) > 0n,
    },
  });

  // 3. Fetch the token URI, enabled only when tokenId is available
  const {
    data: tokenUriData,
    isLoading: isLoadingTokenUri,
    error: tokenUriError,
  } = useReadContract({
    ...IMPERFECT_COACH_PASSPORT_CONFIG,
    functionName: "tokenURI",
    args: [tokenId as bigint],
    query: {
      enabled: !!tokenId && (tokenId as bigint) > 0n,
    },
  });

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            My WIP Passport
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Please connect your wallet to view your passport.</p>
          <div className="space-y-3">
            {/* Preview of what's coming */}
            <div className="border rounded-lg p-3 bg-muted/30">
              <h4 className="text-sm font-medium mb-2">What you'll unlock:</h4>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Workout achievements & stats</li>
                <li>• Social connections & leaderboards</li>
                <li>• Unique NFT collectible</li>
                <li>• Community recognition</li>
              </ul>
            </div>
            
            {/* Social Preview - show even without wallet connection */}
            <div className="border-t pt-3 mt-2">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                <span className="text-lg">🌐</span>
                Connect Your Identities
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                Link your social profiles to start building your identity
              </p>
              <Button size="sm" variant="outline" disabled>
                Connect Profiles
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoadingTokenId || isLoadingPassport || isLoadingTokenUri) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My WIP Passport</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (
    passportError ||
    tokenUriError ||
    !tokenId ||
    (tokenId as bigint) === 0n
  ) {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="text-2xl">🏆</span>
            My WIP Passport
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-amber-600 mt-0.5">🚧</span>
              <div>
                <p className="font-medium text-amber-800">Passport in Progress</p>
                <p className="text-sm text-amber-700">
                  Complete workouts and submit them to mint your unique NFT passport!
                </p>
              </div>
            </div>
          </div>
          
          {/* Progress Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Your Progress</span>
              <span className="text-sm text-muted-foreground">0/5 workouts</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-amber-500 h-2 rounded-full" style={{ width: '20%' }}></div>
            </div>
            <p className="text-xs text-muted-foreground">
              Complete 5 workouts to unlock your passport minting
            </p>
          </div>
          
          {/* Preview Stats */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between p-2 bg-muted/50 rounded">
              <span className="text-gray-600">Level:</span>
              <span className="font-semibold">-</span>
            </div>
            <div className="flex justify-between p-2 bg-muted/50 rounded">
              <span className="text-gray-600">Sessions:</span>
              <span className="font-semibold">0</span>
            </div>
            <div className="flex justify-between p-2 bg-muted/50 rounded">
              <span className="text-gray-600">Streak:</span>
              <span className="font-semibold">0d</span>
            </div>
            <div className="flex justify-between p-2 bg-muted/50 rounded">
              <span className="text-gray-600">Pull-ups:</span>
              <span className="font-semibold text-green-600">0</span>
            </div>
          </div>
          
          {/* Social Identities Preview */}
          <div className="border-t pt-3 mt-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="text-lg">🌐</span>
                Connected Identities
              </h4>
              <Button variant="link" size="sm" className="h-6 p-0 text-xs" asChild>
                <Link to="/social">View All</Link>
              </Button>
            </div>
            
            {identityLoading ? (
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-18" />
              </div>
            ) : (
              <>
                {getSocialIdentities().length > 0 ? (
                  <div className="space-y-3">
                    {/* Social Metrics */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <Users className="h-4 w-4 mx-auto text-muted-foreground" />
                        <p className="text-sm font-medium">{getSocialIdentities().length}</p>
                        <p className="text-xs text-muted-foreground">Profiles</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <Trophy className="h-4 w-4 mx-auto text-muted-foreground" />
                        <p className="text-sm font-medium">
                          {getSocialIdentities().reduce((sum, identity) => 
                            sum + (identity.social?.followers || 0), 0) > 0 
                            ? `${(getSocialIdentities().reduce((sum, identity) => 
                                sum + (identity.social?.followers || 0), 0) / 1000).toFixed(1)}k` 
                            : '0'}
                        </p>
                        <p className="text-xs text-muted-foreground">Followers</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <Calendar className="h-4 w-4 mx-auto text-muted-foreground" />
                        <p className="text-sm font-medium">0</p>
                        <p className="text-xs text-muted-foreground">Achievements</p>
                      </div>
                    </div>
                    
                    {/* Connected Profiles */}
                    <div>
                      <h5 className="text-xs font-medium text-muted-foreground mb-2">Connected Profiles</h5>
                      <div className="space-y-2">
                        {getSocialIdentities().map((identity) => (
                          <div 
                            key={identity.id}
                            className="flex items-center justify-between p-2 rounded-lg border bg-card"
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                              {identity.platform === 'farcaster' && <span className="text-lg">🟣</span>}
                              {identity.platform === 'twitter' && <span className="text-lg">🐦</span>}
                              {identity.platform === 'github' && <span className="text-lg">💻</span>}
                              {identity.platform === 'lens' && <span className="text-lg">👁️</span>}
                                {identity.platform === 'zora' && <span className="text-lg">🎨</span>}
                               </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {identity.username || identity.id.substring(0, 10) + '...'}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <span className="capitalize">{identity.platform}</span>
                                  {identity.social?.verified && (
                                    <Verified className="h-3 w-3 text-blue-500" />
                                  )}
                                </div>
                              </div>
                            </div>
                            {identity.social?.followers && (
                              <Badge variant="secondary" className="text-xs">
                                {identity.social.followers > 1000 
                                  ? `${(identity.social.followers / 1000).toFixed(1)}k` 
                                  : identity.social.followers}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Connect your social profiles to enhance your identity
                    </p>
                    <Button size="sm" variant="outline" className="mt-2">
                      Connect Profiles
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Call to Action */}
          <div className="border-t pt-4 mt-4">
            <Button className="w-full" variant="default">
              Start Workout to Progress
            </Button>
          </div>
          
          {passportError && (
            <details className="mt-2 text-xs text-red-500">
              <summary>Technical Details</summary>
              <p>{passportError.message}</p>
            </details>
          )}
        </CardContent>
      </Card>
    );
  }

  // Decode the base64 JSON URI to get the image
  const getImageFromTokenURI = (uri: string): string | null => {
    try {
      if (!uri || typeof uri !== "string") {
        console.warn("Invalid token URI format:", uri);
        return null;
      }

      // Handle malformed or partial data - return null silently
      if (
        uri.length < 10 ||
        uri.includes("rt #") ||
        uri.includes("de") ||
        uri.includes("Token does not exist") ||
        uri.includes("Unknown")
      ) {
        return null;
      }

      // Handle data URI format
      if (uri.startsWith("data:application/json;base64,")) {
        try {
          const base64Data = uri.substring(uri.indexOf(",") + 1);

          // Validate base64 data before parsing
          if (!base64Data || base64Data.length === 0) {
            console.warn("Empty base64 data in token URI");
            return null;
          }

          const jsonString = atob(base64Data);

          // Check if the decoded string looks like JSON
          if (
            !jsonString.trim().startsWith("{") &&
            !jsonString.trim().startsWith("[")
          ) {
            console.warn("Decoded base64 data is not valid JSON format");
            return null;
          }

          const json = JSON.parse(jsonString);
          return json.image || null;
        } catch (e) {
          // Silently handle parsing errors to avoid console spam
          if (process.env.NODE_ENV === "development") {
            console.warn(
              "Failed to parse base64 JSON in token URI - this may be expected for some tokens"
            );
          }
          return null;
        }
      }

      // Handle direct JSON string
      if (uri.startsWith("{")) {
        try {
          const json = JSON.parse(uri);
          return json.image || null;
        } catch (e) {
          console.error("Failed to parse JSON string:", e);
          return null;
        }
      }

      // Handle HTTP URL (return as is)
      if (uri.startsWith("http")) {
        return uri;
      }

      console.warn("Unrecognized token URI format:", uri);
      return null;
    } catch (e) {
      console.error("Failed to parse token URI:", e);
      return null;
    }
  };

  const imageUrl = tokenUriData
    ? getImageFromTokenURI(tokenUriData as string)
    : null;
  const typedPassportData = passportData as PassportData | null;

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="text-2xl">🏆</span>
          My WIP Passport
          {tokenId && (
            <span className="text-sm font-normal text-muted-foreground">
              #{tokenId.toString()}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {typedPassportData && (
          <>
            <div className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Level</span>
              <span className="text-lg font-bold text-blue-600">
                {typedPassportData.level.toString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Sessions:</span>
                <span className="font-semibold">
                  {typedPassportData.totalWorkoutSessions.toString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Streak:</span>
                <span className="font-semibold">
                  {typedPassportData.currentStreak.toString()}d
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pull-ups:</span>
                <span className="font-semibold text-green-600">
                  {typedPassportData.totalPullups.toString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Jumps:</span>
                <span className="font-semibold text-blue-600">
                  {typedPassportData.totalJumps.toString()}
                </span>
              </div>
            </div>

            {typedPassportData.longestStreak >
            typedPassportData.currentStreak && (
            <div className="text-xs text-center text-muted-foreground border-t pt-2">
            Best streak: {typedPassportData.longestStreak.toString()} days
            </div>
            )}
            </>
            )}

        {/* Social Identities Section */}
        {isConnected && (
          <div className="border-t pt-3 mt-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="text-lg">🌐</span>
                Connected Identities
              </h4>
              <Button variant="link" size="sm" className="h-6 p-0 text-xs" asChild>
                <Link to="/social">View All</Link>
              </Button>
            </div>
            
            {identityLoading ? (
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-18" />
              </div>
            ) : (
              <>
                {getSocialIdentities().length > 0 ? (
                  <div className="space-y-3">
                    {/* Social Metrics */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <Users className="h-4 w-4 mx-auto text-muted-foreground" />
                        <p className="text-sm font-medium">{getSocialIdentities().length}</p>
                        <p className="text-xs text-muted-foreground">Profiles</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <Trophy className="h-4 w-4 mx-auto text-muted-foreground" />
                        <p className="text-sm font-medium">
                          {getSocialIdentities().reduce((sum, identity) => 
                            sum + (identity.social?.followers || 0), 0) > 0 
                            ? `${(getSocialIdentities().reduce((sum, identity) => 
                                sum + (identity.social?.followers || 0), 0) / 1000).toFixed(1)}k` 
                            : '0'}
                        </p>
                        <p className="text-xs text-muted-foreground">Followers</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <Calendar className="h-4 w-4 mx-auto text-muted-foreground" />
                        <p className="text-sm font-medium">0</p>
                        <p className="text-xs text-muted-foreground">Achievements</p>
                      </div>
                    </div>
                    
                    {/* Connected Profiles */}
                    <div>
                      <h5 className="text-xs font-medium text-muted-foreground mb-2">Connected Profiles</h5>
                      <div className="space-y-2">
                        {getSocialIdentities().map((identity) => (
                          <div 
                            key={identity.id}
                            className="flex items-center justify-between p-2 rounded-lg border bg-card"
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                              {identity.platform === 'farcaster' && <span className="text-lg">🟣</span>}
                              {identity.platform === 'twitter' && <span className="text-lg">🐦</span>}
                              {identity.platform === 'github' && <span className="text-lg">💻</span>}
                              {identity.platform === 'lens' && <span className="text-lg">👁️</span>}
                                {identity.platform === 'zora' && <span className="text-lg">🎨</span>}
                              </div>
                              <div>
                              <p className="text-sm font-medium">
                                {identity.username || identity.id.substring(0, 10) + '...'}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <span className="capitalize">{identity.platform}</span>
                              {identity.social?.verified && (
                                <Verified className="h-3 w-3 text-blue-500" />
                                )}
                                </div>
                               </div>
                            </div>
                            {identity.social?.followers && (
                              <Badge variant="secondary" className="text-xs">
                                {identity.social.followers > 1000 
                                  ? `${(identity.social.followers / 1000).toFixed(1)}k` 
                                  : identity.social.followers}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No social identities found. Connect your profiles to enhance your passport!
                  </p>
                )}
              </>
            )}
          </div>
        )}


      </CardContent>
    </Card>
  );
};

export default MyPassport;
