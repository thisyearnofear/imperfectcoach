
import { useMemo } from "react";
import { RepData } from "@/lib/types";

export const usePerformanceStats = (
  repHistory: RepData[],
  sessionStart: number | null
) => {
  const { repTimings, sessionDuration } = useMemo(() => {
    let duration = 0;
    if (sessionStart) {
      duration = (Date.now() - sessionStart) / 1000;
    }
    const minutes = Math.floor(duration / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(duration % 60)
      .toString()
      .padStart(2, "0");
    const formattedDuration = `${minutes}:${seconds}`;

    if (!repHistory || repHistory.length < 2) {
      return {
        repTimings: { avg: 0, stdDev: 0 },
        sessionDuration: formattedDuration,
      };
    }

    // Performance optimization: calculate rep timings efficiently
    const timings = [];
    for (let i = 1; i < repHistory.length; i++) {
      timings.push((repHistory[i].timestamp - repHistory[i - 1].timestamp) / 1000);
    }
    
    const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
    
    // Performance optimization: calculate std dev with single pass
    let sumOfSquares = 0;
    for (const t of timings) {
      sumOfSquares += Math.pow(t - avg, 2);
    }
    const stdDev = Math.sqrt(sumOfSquares / timings.length);

    return {
      repTimings: { avg, stdDev },
      sessionDuration: formattedDuration,
    };
  }, [repHistory, sessionStart]);

  return { repTimings, sessionDuration };
};
