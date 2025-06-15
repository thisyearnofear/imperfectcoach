import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, LineChart as LineChartIcon } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
} from "recharts";
import { RepData } from "@/lib/types";

interface PerformanceAnalyticsProps {
  repHistory: RepData[];
  sessionStart: number | null;
  totalReps: number;
  averageFormScore: number;
}

const PerformanceAnalytics = ({
  repHistory,
  sessionStart,
  totalReps,
  averageFormScore,
}: PerformanceAnalyticsProps) => {
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

  const handleExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,Rep,Score,Timestamp\n";
    repHistory.forEach((rep, index) => {
      csvContent += `${index + 1},${rep.score.toFixed(0)},${new Date(
        rep.timestamp
      ).toISOString()}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "session_analytics.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = repHistory.map((rep, index) => ({
    name: `Rep ${index + 1}`,
    score: rep.score,
  }));

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChartIcon className="h-5 w-5 text-primary" />
          Performance Analytics
        </CardTitle>
        <CardDescription>
          A summary of your current workout session.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-6">
          <div>
            <span className="font-semibold text-foreground">Duration:</span>
            <span className="ml-2 text-muted-foreground">{sessionDuration}</span>
          </div>
          <div>
            <span className="font-semibold text-foreground">Total Reps:</span>
            <span className="ml-2 text-muted-foreground">{totalReps}</span>
          </div>
          <div>
            <span className="font-semibold text-foreground">Avg Score:</span>
            <span className="ml-2 text-muted-foreground">{averageFormScore.toFixed(0)}</span>
          </div>
          <div>
            <span className="font-semibold text-foreground">Consistency:</span>
            <span className="ml-2 text-muted-foreground">{repTimings.stdDev.toFixed(2)}s (SD)</span>
          </div>
        </div>

        <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Form Score Trend</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "14px" }} />
              <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleExport} variant="outline" size="sm" className="w-full" disabled={repHistory.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export Session Data
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PerformanceAnalytics;
