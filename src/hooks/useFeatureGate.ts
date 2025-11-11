import { useUserAuth, useUserBlockchain, useUserDisplay } from "./useUserHooks";
import { usePremiumAccess } from "./usePremiumAccess";
import { useSolanaWallet } from "./useSolanaWallet";

type Feature =
  | "AI_SUMMARY"
  | "ACHIEVEMENTS"
  | "FULL_ANALYTICS"
  | "AI_CHAT"
  | "MULTIPLE_AI_COACHES"
  | "BEDROCK_ANALYSIS"
  | "ADVANCED_EXPORTS"
  | "PREMIUM_ANALYTICS";

type UserTier = "free" | "connected" | "premium";

export function useFeatureGate(feature: Feature): boolean {
  const tier = useUserTier();

  switch (feature) {
    case "AI_SUMMARY":
      return tier !== "free"; // Connected and premium get basic AI summary
    case "ACHIEVEMENTS":
      return tier !== "free"; // Connected and premium get achievements
    case "MULTIPLE_AI_COACHES":
    case "BEDROCK_ANALYSIS":
    case "AI_CHAT":
    case "ADVANCED_EXPORTS":
    case "PREMIUM_ANALYTICS":
      return tier === "premium"; // Only premium gets these features
    case "FULL_ANALYTICS":
      return true; // All tiers get analytics (but different levels)
    default:
      return false;
  }
}

export function useUserTier(): UserTier {
  const { isAuthenticated } = useUserAuth();
  const { hasSubmittedScore } = useUserBlockchain();
  const { basename } = useUserDisplay();
  const { hasPremiumAccess } = usePremiumAccess();
  const { isSolanaConnected } = useSolanaWallet();

  if (hasPremiumAccess) {
    return "premium";
  }

  // Users with connected wallet (Base or Solana) are "connected" tier
  // This allows them to see and use the blockchain submission feature
  if (isAuthenticated || isSolanaConnected) {
    return "connected";
  }

  return "free";
}

// Utility hook for checking if features should be shown as disabled
export function useFeatureAvailability(feature: Feature): {
  available: boolean;
  showDisabled: boolean;
  tier: UserTier;
} {
  const tier = useUserTier();
  const available = useFeatureGate(feature);

  // Show disabled state for premium features when user is connected but not premium
  const showDisabled =
    !available &&
    ((tier === "connected" &&
      [
        "MULTIPLE_AI_COACHES",
        "BEDROCK_ANALYSIS",
        "AI_CHAT",
        "ADVANCED_EXPORTS",
        "PREMIUM_ANALYTICS",
      ].includes(feature)) ||
      (tier === "free" &&
        [
          "AI_SUMMARY",
          "ACHIEVEMENTS",
          "MULTIPLE_AI_COACHES",
          "BEDROCK_ANALYSIS",
          "AI_CHAT",
          "ADVANCED_EXPORTS",
          "PREMIUM_ANALYTICS",
        ].includes(feature)));

  return { available, showDisabled, tier };
}
