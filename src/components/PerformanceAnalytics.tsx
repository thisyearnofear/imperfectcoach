
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

const dataUrlToFile = async (dataUrl: string, fileName: string): Promise<File | null> => {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], fileName, { type: blob.type });
  } catch (error) {
    console.error("Error converting data URL to file:", error);
    return null;
  }
};

const PerformanceAnalytics = ({
  repHistory,
  sessionStart,
  totalReps,
  averageFormScore,
  exercise,
}: PerformanceAnalyticsProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
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
  
  const handleShareCard = async () => {
    if (cardRef.current === null) {
      toast.error("Component not ready, please wait.");
      return;
    }
    
    toast.info("Generating summary card...");

    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, { 
        cacheBust: true, 
        // Ensure a solid background for the exported image
        backgroundColor: 'hsl(224 71.4% 4.1%)',
      });

      const fileName = `workout-summary-${new Date().toISOString().slice(0, 10)}.png`;
      const file = await dataUrlToFile(dataUrl, fileName);

      if (!file) {
        toast.error("Failed to create image file for sharing.");
        return;
      }
      
      const exerciseName = exercise.charAt(0).toUpperCase() + exercise.slice(1).replace('-', ' ');
      const shareData = {
        files: [file],
        title: `${exerciseName} Workout Summary`,
        text: `I just completed a workout on Fit AI! Total Reps: ${totalReps}, Avg. Form: ${averageFormScore.toFixed(0)}%. #FitAI #Workout`,
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: download the image
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Summary card downloaded! You can share it from your gallery.");
      }
    } catch (err) {
      console.error("Failed to share card:", err);
      toast.error("Oops! Something went wrong while creating your summary card.");
    }
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
    <Card ref={cardRef} className="bg-card">
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
        <Button onClick={handleShareCard} variant="default" size="sm" className="w-full" disabled={repHistory.length === 0}>
          <Share2 className="mr-2 h-4 w-4" />
          Share Summary
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
      <div className="px-6 pb-4 text-center text-xs text-muted-foreground/50">
        Generated by Fit AI Vision Arena
      </div>
    </Card>
  );
};

export default PerformanceAnalytics;
