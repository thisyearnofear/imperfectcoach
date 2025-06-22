import { useUserAuth, useUserBlockchain, useUserDisplay } from "./useUserHooks";

type Feature =
  | "AI_SUMMARY"
  | "ACHIEVEMENTS"
  | "FULL_ANALYTICS"
  | "AI_CHAT";

export function useFeatureGate(feature: Feature): boolean {
  const { isAuthenticated } = useUserAuth();
  const { hasSubmittedScore } = useUserBlockchain();
  const { basename } = useUserDisplay();

  if (!isAuthenticated) {
    return false;
  }

  switch (feature) {
    case "AI_SUMMARY":
    case "ACHIEVEMENTS":
      return hasSubmittedScore;
    case "FULL_ANALYTICS":
    case "AI_CHAT":
      return hasSubmittedScore && !!basename;
    default:
      return false;
  }
}