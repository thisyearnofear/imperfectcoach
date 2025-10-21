import { useState, useRef, useCallback } from "react";

export interface UseUpgradeFlowOptions {
  /**
   * Delay before scrolling (in milliseconds)
   * @default 100
   */
  scrollDelay?: number;
  
  /**
   * Scroll behavior
   * @default "smooth"
   */
  scrollBehavior?: ScrollBehavior;
  
  /**
   * Block alignment for scroll
   * @default "center"
   */
  scrollBlock?: ScrollLogicalPosition;
}

/**
 * Consolidates the upgrade flow pattern used throughout the app:
 * - Modal state management
 * - Auto-scroll to target section
 * - Ref for scroll target
 * 
 * Used in: PostWorkoutFlow, CoachSummarySelector, SingleActionCTA, 
 * SmartTierRecommendation, and more.
 */
export function useUpgradeFlow(options: UseUpgradeFlowOptions = {}) {
  const {
    scrollDelay = 100,
    scrollBehavior = "smooth",
    scrollBlock = "center",
  } = options;

  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const scrollTargetRef = useRef<HTMLDivElement>(null);

  /**
   * Opens the upsell modal and scrolls to the target section
   */
  const openUpgrade = useCallback(
    (customDelay?: number) => {
      setIsUpsellOpen(true);
      
      const delay = customDelay ?? scrollDelay;
      setTimeout(() => {
        scrollTargetRef.current?.scrollIntoView({
          behavior: scrollBehavior,
          block: scrollBlock,
        });
      }, delay);
    },
    [scrollDelay, scrollBehavior, scrollBlock]
  );

  /**
   * Closes the upsell modal
   */
  const closeUpgrade = useCallback(() => {
    setIsUpsellOpen(false);
  }, []);

  /**
   * Scrolls to target without opening modal
   */
  const scrollToTarget = useCallback(
    (customDelay?: number) => {
      const delay = customDelay ?? scrollDelay;
      setTimeout(() => {
        scrollTargetRef.current?.scrollIntoView({
          behavior: scrollBehavior,
          block: scrollBlock,
        });
      }, delay);
    },
    [scrollDelay, scrollBehavior, scrollBlock]
  );

  return {
    // State
    isUpsellOpen,
    setIsUpsellOpen,
    
    // Ref for scroll target
    scrollTargetRef,
    
    // Actions
    openUpgrade,
    closeUpgrade,
    scrollToTarget,
  };
}
