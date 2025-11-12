import { useCallback, useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { submitScoreToSolana, getTopUsersFromSolana, getUserScorePDA, getExerciseProgramId, type ExerciseType } from "@/lib/solana/leaderboard";
import { PublicKey, Transaction, TransactionInstruction, SystemProgram } from "@solana/web3.js";
import { solanaWalletManager, type SolanaWalletState } from "@/lib/payments/solana-wallet-adapter";

interface UseSolanaWalletState {
  solanaAddress?: string;
  isSolanaConnected: boolean;
  isSolanaLoading: boolean;
  solanaError?: string;
}

// Helper function to submit score using solanaWalletManager
async function submitScoreViaManager(
  managerState: SolanaWalletState,
  leaderboardAddress: PublicKey,
  score: number,
  exercise: ExerciseType
): Promise<string> {
  if (!managerState.publicKey || !managerState.adapter) {
    throw new Error("Wallet manager not properly initialized");
  }

  // Derive user score PDA
  const [userScorePda] = getUserScorePDA(
    managerState.publicKey,
    leaderboardAddress,
    exercise
  );

  // Build instruction
  const programId = getExerciseProgramId(exercise);
  const discriminator = new Uint8Array([0xe0, 0x2a, 0x17, 0x1b, 0xd1, 0x4b, 0xc6, 0x64]);
  
  // Create score buffer (4 bytes, little-endian u32)
  const scoreBuf = new Uint8Array(4);
  const scoreView = new DataView(scoreBuf.buffer);
  scoreView.setUint32(0, score, true); // true = little-endian
  
  // Combine discriminator and score
  const instructionData = new Uint8Array(discriminator.length + scoreBuf.length);
  instructionData.set(discriminator, 0);
  instructionData.set(scoreBuf, discriminator.length);

  const instruction = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: leaderboardAddress, isSigner: false, isWritable: true },
      { pubkey: userScorePda, isSigner: false, isWritable: true },
      { pubkey: managerState.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: instructionData,
  });

  // Build transaction
  const latestBlockhash = await managerState.connection.getLatestBlockhash();
  const transaction = new Transaction({
    feePayer: managerState.publicKey,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  }).add(instruction);

  // Sign and send using manager
  const signed = await managerState.adapter.signTransaction!(transaction);
  const signature = await managerState.connection.sendRawTransaction(signed.serialize());

  // Wait for confirmation
  await managerState.connection.confirmTransaction({
    signature,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  });

  return signature;
}

export function useSolanaWallet() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, connected, signTransaction, disconnect } = wallet;

  const [state, setState] = useState<UseSolanaWalletState>({
    solanaAddress: publicKey?.toBase58(),
    isSolanaConnected: connected,
    isSolanaLoading: false,
  });

  // Update state when wallet connection changes
  // Check both wallet adapter context AND solanaWalletManager singleton
  useEffect(() => {
    const checkWalletState = () => {
      // Check wallet adapter context first
      const adapterConnected = connected;
      const adapterAddress = publicKey?.toBase58();
      
      // Also check solanaWalletManager singleton
      const managerState = solanaWalletManager.getState();
      const managerConnected = managerState.connected;
      const managerAddress = managerState.publicKey?.toString();
      
      // Use whichever is connected
      const isConnected = adapterConnected || managerConnected;
      const address = adapterAddress || managerAddress;
      
      console.log("🔗 Solana Wallet State Check:", {
        adapterConnected,
        adapterAddress,
        managerConnected,
        managerAddress,
        finalConnected: isConnected,
        finalAddress: address,
      });
      
      setState((prev) => {
        // Only update if values changed to avoid unnecessary re-renders
        if (prev.isSolanaConnected !== isConnected || prev.solanaAddress !== address) {
          return {
            ...prev,
            solanaAddress: address,
            isSolanaConnected: isConnected,
          };
        }
        return prev;
      });
    };
    
    // Check immediately
    checkWalletState();
    
    // Subscribe to solanaWalletManager events
    const unsubscribe = solanaWalletManager.on('change', checkWalletState);
    
    // Cleanup: unsubscribe from events
    return () => {
      unsubscribe();
    };
  }, [publicKey, connected]);

  const connectSolanaWallet = useCallback(async () => {
    // Wallet adapter handles connection UI - nothing to do here
    toast.success("Connect your Solana wallet from the popup");
  }, []);

  const disconnectSolanaWallet = useCallback(async () => {
    try {
      await disconnect();
      setState((prev) => ({
        ...prev,
        solanaAddress: undefined,
        isSolanaConnected: false,
      }));
      toast.success("Disconnected from Solana wallet");
    } catch (error) {
      console.error("Error disconnecting Solana wallet:", error);
      toast.error("Failed to disconnect Solana wallet");
    }
  }, [disconnect]);

  const submitScoreToSolanaContract = useCallback(
    async (
      pullups: number,
      jumps: number,
      leaderboardAddress: PublicKey
    ): Promise<{ signature?: string }> => {
      // Check if wallet is connected via either adapter context OR manager
      const managerState = solanaWalletManager.getState();
      const isWalletConnected = (publicKey && signTransaction && connected) || managerState.connected;
      const walletPubKey = publicKey || managerState.publicKey;
      
      if (!isWalletConnected || !walletPubKey) {
        toast.error("Please connect your Solana wallet first");
        return {};
      }
      
      console.log("🔑 Using Solana wallet:", {
        fromAdapter: connected,
        fromManager: managerState.connected,
        address: walletPubKey.toString(),
      });

      // Determine exercise type based on what's non-zero
      let exerciseType: "pullups" | "jumps";
      let score: number;

      if (pullups > 0) {
        exerciseType = "pullups";
        score = pullups;
      } else if (jumps > 0) {
        exerciseType = "jumps";
        score = jumps;
      } else {
        toast.error("Please complete at least one exercise");
        return {};
      }

      try {
        setState((prev) => ({
          ...prev,
          isSolanaLoading: true,
        }));

        let signature: string;
        
        // Use adapter context if available, otherwise use manager
        if (connected && signTransaction) {
          signature = await submitScoreToSolana(
            connection,
            wallet,
            leaderboardAddress,
            score,
            exerciseType
          );
        } else {
          // Use solanaWalletManager for transaction
          console.log("📝 Building transaction with solanaWalletManager...");
          signature = await submitScoreViaManager(
            managerState,
            leaderboardAddress,
            score,
            exerciseType
          );
        }

        toast.success(
          `✅ ${exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1)} score submitted to Solana! Signature: ${signature.slice(0, 8)}...`
        );

        return { signature };
      } catch (error) {
        console.error("Error submitting score to Solana:", error);
        const errorMsg = error instanceof Error ? error.message : "Failed to submit score";
        setState((prev) => ({
          ...prev,
          solanaError: errorMsg,
        }));
        toast.error(`❌ Failed to submit ${exerciseType} score: ${errorMsg}`);
        return {};
      } finally {
        setState((prev) => ({
          ...prev,
          isSolanaLoading: false,
        }));
      }
    },
    [publicKey, signTransaction, connected, connection, wallet]
  );

  const getSolanaLeaderboard = useCallback(
    async (limit: number = 10) => {
      try {
        const leaderboard = await getTopUsersFromSolana(limit);
        return leaderboard;
      } catch (error) {
        console.error("Error fetching Solana leaderboard:", error);
        return [];
      }
    },
    []
  );

  return {
    // State
    solanaAddress: state.solanaAddress,
    isSolanaConnected: state.isSolanaConnected,
    isSolanaLoading: state.isSolanaLoading,
    solanaError: state.solanaError,

    // Actions
    connectSolanaWallet,
    disconnectSolanaWallet,
    submitScoreToSolanaContract,
    getSolanaLeaderboard,

    // Raw wallet
    wallet,
  };
}
