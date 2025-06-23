import { useAccount, useReadContract } from "wagmi";
import { IMPERFECT_COACH_PASSPORT_CONFIG } from "@/lib/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
          <CardTitle>My WIP Passport</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please connect your wallet to view your passport.</p>
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
      <Card>
        <CardHeader>
          <CardTitle>My WIP Passport</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-amber-600 mb-2">
            Your passport NFT is still being generated...
          </p>
          <p className="text-sm text-muted-foreground">
            Complete a few more workouts and submit them to the blockchain to
            mint your passport!
          </p>
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
          const jsonString = atob(uri.substring(uri.indexOf(",") + 1));
          const json = JSON.parse(jsonString);
          return json.image || null;
        } catch (e) {
          console.error("Failed to parse base64 JSON:", e);
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
      </CardContent>
    </Card>
  );
};

export default MyPassport;
