import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { getTransactionHistory } from "@/lib/cdp";

interface PremiumSession {
  transactionHash: string;
  timestamp: number;
  expiresAt: number;
  walletAddress: string;
  amount: string;
  currency: string;
}

const PREMIUM_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const PREMIUM_STORAGE_KEY = "premium-sessions";

export function usePremiumAccess() {
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [premiumSessions, setPremiumSessions] = useState<PremiumSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { address } = useAccount();

  // Load premium sessions from localStorage
  const loadPremiumSessions = (): PremiumSession[] => {
    try {
      const stored = localStorage.getItem(PREMIUM_STORAGE_KEY);
      if (stored) {
        const sessions = JSON.parse(stored) as PremiumSession[];
        // Filter out expired sessions
        const validSessions = sessions.filter(
          (session) => session.expiresAt > Date.now()
        );
        return validSessions;
      }
    } catch (error) {
      console.error("Error loading premium sessions:", error);
    }
    return [];
  };

  // Save premium sessions to localStorage
  const savePremiumSessions = (sessions: PremiumSession[]) => {
    try {
      localStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error("Error saving premium sessions:", error);
    }
  };

  // Check if current wallet has active premium access
  const checkPremiumAccess = useCallback(
    (sessions: PremiumSession[]): boolean => {
      if (!address) return false;

      const now = Date.now();
      const activeSessions = sessions.filter(
        (session) =>
          session.walletAddress.toLowerCase() === address.toLowerCase() &&
          session.expiresAt > now
      );

      return activeSessions.length > 0;
    },
    [address]
  );

  // Add a new premium session
  const addPremiumSession = (
    transactionHash: string,
    amount: string = "0.05",
    currency: string = "USDC"
  ) => {
    if (!address) return;

    const newSession: PremiumSession = {
      transactionHash,
      timestamp: Date.now(),
      expiresAt: Date.now() + PREMIUM_SESSION_DURATION,
      walletAddress: address,
      amount,
      currency,
    };

    const updatedSessions = [...premiumSessions, newSession];
    setPremiumSessions(updatedSessions);
    savePremiumSessions(updatedSessions);
    setHasPremiumAccess(checkPremiumAccess(updatedSessions));

    console.log("✅ Premium session added:", {
      hash: transactionHash,
      wallet: address,
      expiresIn:
        Math.round(PREMIUM_SESSION_DURATION / (1000 * 60 * 60)) + " hours",
    });
  };

  // Get active premium session for current wallet
  const getActivePremiumSession = (): PremiumSession | null => {
    if (!address) return null;

    const now = Date.now();
    const activeSession = premiumSessions.find(
      (session) =>
        session.walletAddress.toLowerCase() === address.toLowerCase() &&
        session.expiresAt > now
    );

    return activeSession || null;
  };

  // Get time remaining for current premium session
  const getPremiumTimeRemaining = (): number => {
    const activeSession = getActivePremiumSession();
    if (!activeSession) return 0;

    return Math.max(0, activeSession.expiresAt - Date.now());
  };

  // Format time remaining as human-readable string
  const formatTimeRemaining = (): string => {
    const remaining = getPremiumTimeRemaining();
    if (remaining <= 0) return "Expired";

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  // Sync with CDP transaction history to auto-detect premium purchases
  const syncWithTransactionHistory = useCallback(() => {
    try {
      const txHistory = getTransactionHistory();
      const premiumPayments = txHistory.filter(
        (tx) =>
          tx.type === "payment" &&
          tx.amount === "0.05" &&
          tx.currency === "USDC" &&
          tx.description?.includes("premium") &&
          tx.status === "confirmed"
      );

      let sessionsUpdated = false;
      const existingHashes = premiumSessions.map((s) => s.transactionHash);

      premiumPayments.forEach((payment) => {
        if (!existingHashes.includes(payment.hash)) {
          // Calculate expiry from transaction timestamp
          const expiresAt = payment.timestamp + PREMIUM_SESSION_DURATION;

          // Only add if not expired
          if (expiresAt > Date.now()) {
            const session: PremiumSession = {
              transactionHash: payment.hash,
              timestamp: payment.timestamp,
              expiresAt,
              walletAddress: address || "",
              amount: payment.amount || "0.05",
              currency: payment.currency || "USDC",
            };

            premiumSessions.push(session);
            sessionsUpdated = true;
          }
        }
      });

      if (sessionsUpdated) {
        setPremiumSessions([...premiumSessions]);
        savePremiumSessions(premiumSessions);
        console.log("🔄 Premium sessions synced from transaction history");
      }
    } catch (error) {
      console.error("Error syncing premium sessions:", error);
    }
  }, [premiumSessions, address]);

  // Initialize and check for premium access
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);

      // Load existing sessions
      const sessions = loadPremiumSessions();
      setPremiumSessions(sessions);

      // Check if current wallet has premium access
      const hasAccess = checkPremiumAccess(sessions);
      setHasPremiumAccess(hasAccess);

      // Sync with transaction history if connected
      if (address) {
        syncWithTransactionHistory();
      }

      setIsLoading(false);
    };

    initialize();
  }, [address, checkPremiumAccess, syncWithTransactionHistory]);

  // Periodically check for expired sessions
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const validSessions = premiumSessions.filter(
        (session) => session.expiresAt > now
      );

      if (validSessions.length !== premiumSessions.length) {
        setPremiumSessions(validSessions);
        savePremiumSessions(validSessions);
        setHasPremiumAccess(checkPremiumAccess(validSessions));
        console.log("🧹 Expired premium sessions cleaned up");
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [premiumSessions, address, checkPremiumAccess]);

  return {
    hasPremiumAccess,
    premiumSessions,
    isLoading,
    addPremiumSession,
    getActivePremiumSession,
    getPremiumTimeRemaining,
    formatTimeRemaining,
    syncWithTransactionHistory,
  };
}

export type PremiumAccessHook = ReturnType<typeof usePremiumAccess>;
