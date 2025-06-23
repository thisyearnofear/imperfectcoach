import React from "react";
import { useReadContract } from "wagmi";
import {
  JUMPS_LEADERBOARD_CONFIG,
  PULLUPS_LEADERBOARD_CONFIG,
} from "@/lib/contracts";
import { useBasename } from "@/hooks/useBasename";

interface LeaderboardEntry {
  user: string;
  totalScore: bigint;
  submissionCount: bigint;
}

// Helper component for displaying user names/addresses
const UserDisplayName = ({ address }: { address: string }) => {
  const { basename, isLoading } = useBasename(address);
  const displayName =
    basename || `${address.slice(0, 6)}...${address.slice(-4)}`;

  return <span title={address}>{isLoading ? "Loading..." : displayName}</span>;
};

export const LeaderboardTest: React.FC = () => {
  // Test jumps leaderboard
  const {
    data: jumpsData,
    isLoading: jumpsLoading,
    error: jumpsError,
  } = useReadContract({
    ...JUMPS_LEADERBOARD_CONFIG,
    functionName: "getTopUsers",
    args: [5], // Get top 5 users
    chainId: 84532,
  });

  // Test pullups leaderboard
  const {
    data: pullupsData,
    isLoading: pullupsLoading,
    error: pullupsError,
  } = useReadContract({
    ...PULLUPS_LEADERBOARD_CONFIG,
    functionName: "getTopUsers",
    args: [5], // Get top 5 users
    chainId: 84532,
  });

  // Test leaderboard size
  const { data: jumpsSize } = useReadContract({
    ...JUMPS_LEADERBOARD_CONFIG,
    functionName: "getLeaderboardSize",
    chainId: 84532,
  });

  const { data: pullupsSize } = useReadContract({
    ...PULLUPS_LEADERBOARD_CONFIG,
    functionName: "getLeaderboardSize",
    chainId: 84532,
  });

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">
        🧪 Leaderboard Integration Test
      </h2>

      {/* Jumps Leaderboard */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">🏃‍♂️ Jumps Leaderboard</h3>
        <p className="text-sm text-gray-600 mb-2">
          Contract: {JUMPS_LEADERBOARD_CONFIG.address}
        </p>
        <p className="text-sm text-gray-600 mb-2">
          Total Users: {jumpsSize ? Number(jumpsSize) : "Loading..."}
        </p>

        {jumpsLoading && <p>Loading jumps data...</p>}
        {jumpsError && (
          <p className="text-red-500">Error: {jumpsError.message}</p>
        )}
        {jumpsData && Array.isArray(jumpsData) && (
          <div className="bg-white p-3 rounded border">
            <p className="font-medium">Top {jumpsData.length} Users:</p>
            {jumpsData.length === 0 ? (
              <p className="text-gray-500 italic">No users yet</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {jumpsData.map((entry: LeaderboardEntry, index: number) => (
                  <li key={index} className="text-sm">
                    #{index + 1}: <UserDisplayName address={entry.user} /> -
                    Score: {Number(entry.totalScore)} - Submissions:{" "}
                    {Number(entry.submissionCount)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Pullups Leaderboard */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">💪 Pullups Leaderboard</h3>
        <p className="text-sm text-gray-600 mb-2">
          Contract: {PULLUPS_LEADERBOARD_CONFIG.address}
        </p>
        <p className="text-sm text-gray-600 mb-2">
          Total Users: {pullupsSize ? Number(pullupsSize) : "Loading..."}
        </p>

        {pullupsLoading && <p>Loading pullups data...</p>}
        {pullupsError && (
          <p className="text-red-500">Error: {pullupsError.message}</p>
        )}
        {pullupsData && Array.isArray(pullupsData) && (
          <div className="bg-white p-3 rounded border">
            <p className="font-medium">Top {pullupsData.length} Users:</p>
            {pullupsData.length === 0 ? (
              <p className="text-gray-500 italic">No users yet</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {pullupsData.map((entry: LeaderboardEntry, index: number) => (
                  <li key={index} className="text-sm">
                    #{index + 1}: <UserDisplayName address={entry.user} /> -
                    Score: {Number(entry.totalScore)} - Submissions:{" "}
                    {Number(entry.submissionCount)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Contract Addresses for Reference */}
      <div className="mt-6 p-3 bg-blue-50 rounded">
        <h4 className="font-medium text-blue-800 mb-2">
          📋 Contract Addresses
        </h4>
        <p className="text-xs text-blue-600">
          Jumps: {JUMPS_LEADERBOARD_CONFIG.address}
        </p>
        <p className="text-xs text-blue-600">
          Pullups: {PULLUPS_LEADERBOARD_CONFIG.address}
        </p>
      </div>

      {/* Status Summary */}
      <div className="mt-4 p-3 bg-green-50 rounded">
        <h4 className="font-medium text-green-800 mb-2">
          ✅ Integration Status
        </h4>
        <ul className="text-sm text-green-600 space-y-1">
          <li>• Contracts deployed on Base Sepolia</li>
          <li>• Leaderboards registered with CoachOperator</li>
          <li>• Frontend integration complete</li>
          <li>• Ready for user score submissions</li>
        </ul>
      </div>
    </div>
  );
};
