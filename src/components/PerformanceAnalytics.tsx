
import { useMemo, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, LineChart as LineChartIcon, Share2, Image as ImageIcon } from "lucide-react";
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
import { RepData, Exercise } from "@/lib/types";
import { toast } from "sonner";
import * as htmlToImage from "html-to-image";


interface PerformanceAnalyticsProps {
  repHistory: RepData[];
  sessionStart: number | null;
  totalReps: number;
  averageFormScore: number;
  exercise: Exercise;
}

const PerformanceAnalytics = ({
  repHistory,
  sessionStart,
  totalReps,
  averageFormScore,
  exercise,
}: PerformanceAnalyticsProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
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

  const handleExportCSV = () => {
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
  
  const handleShare = () => {
    const exerciseName = exercise.charAt(0).toUpperCase() + exercise.slice(1).replace('-', ' ');
    const summary = `My workout session summary:
- Exercise: ${exerciseName}
- Duration: ${sessionDuration}
- Total Reps: ${totalReps}
- Average Form Score: ${averageFormScore.toFixed(0)}
- Consistency (StDev): ${repTimings.stdDev.toFixed(2)}s`;
    
    navigator.clipboard.writeText(summary).then(() => {
      toast.success("Results copied to clipboard!");
    }, () => {
      toast.error("Failed to copy results.");
    });
  };

  const handleExportChart = () => {
    if (chartRef.current === null) {
      return;
    }

    htmlToImage.toPng(chartRef.current, { cacheBust: true, backgroundColor: 'hsl(240 10% 3.9%)' }) // Match card background
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `form-score-trend-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to export chart.");
      });
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
        <div className="h-48" ref={chartRef}>
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
      <CardFooter className="flex flex-col sm:flex-row gap-2 pt-6">
        <Button onClick={handleShare} variant="outline" size="sm" className="w-full" disabled={repHistory.length === 0}>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
        <Button onClick={handleExportChart} variant="outline" size="sm" className="w-full" disabled={repHistory.length === 0}>
          <ImageIcon className="mr-2 h-4 w-4" />
          Export Chart
        </Button>
        <Button onClick={handleExportCSV} variant="outline" size="sm" className="w-full" disabled={repHistory.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PerformanceAnalytics;
