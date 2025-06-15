
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

    const timings = repHistory
      .slice(1)
      .map((rep, i) => (rep.timestamp - repHistory[i].timestamp) / 1000);
    const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
    const stdDev = Math.sqrt(
      timings.map((t) => Math.pow(t - avg, 2)).reduce((a, b) => a + b, 0) /
        timings.length
    );

    return {
      repTimings: { avg, stdDev },
      sessionDuration: formattedDuration,
    };
  }, [repHistory, sessionStart]);

  return { repTimings, sessionDuration };
};
