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
    <Card>
      <CardHeader>
        <CardTitle>My WIP Passport</CardTitle>
      </CardHeader>
      <CardContent>
        {!imageUrl && typedPassportData && (
          <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mb-4 flex items-center justify-center">
            <div className="text-center text-sm text-gray-600">
              <div className="text-2xl font-bold text-blue-600">
                #{tokenId?.toString()}
              </div>
              <div>NFT Image Loading...</div>
            </div>
          </div>
        )}
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Imperfect Coach Passport NFT"
            className="w-full rounded-lg mb-4"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        {typedPassportData && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p>
              <strong>Level:</strong> {typedPassportData.level.toString()}
            </p>
            <p>
              <strong>Total Sessions:</strong>{" "}
              {typedPassportData.totalWorkoutSessions.toString()}
            </p>
            <p>
              <strong>Pull-ups:</strong>{" "}
              {typedPassportData.totalPullups.toString()}
            </p>
            <p>
              <strong>Jumps:</strong> {typedPassportData.totalJumps.toString()}
            </p>
            <p>
              <strong>Current Streak:</strong>{" "}
              {typedPassportData.currentStreak.toString()} days
            </p>
            <p>
              <strong>Longest Streak:</strong>{" "}
              {typedPassportData.longestStreak.toString()} days
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyPassport;
