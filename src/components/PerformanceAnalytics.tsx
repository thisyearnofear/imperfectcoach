
import { useRef } from "react";
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
import { RepData, Exercise, SessionSummaries, CoachModel } from "@/lib/types";
import { exportToCSV, shareCardImage, exportChartImage } from "@/lib/exportUtils";

interface PerformanceAnalyticsProps {
  repHistory: RepData[];
  totalReps: number;
  averageFormScore: number;
  exercise: Exercise;
  sessionDuration: string;
  repTimings: { avg: number; stdDev: number };
  sessionSummaries: SessionSummaries | null;
  isSummaryLoading: boolean;
}

const PerformanceAnalytics = ({
  repHistory,
  totalReps,
  averageFormScore,
  exercise,
  sessionDuration,
  repTimings,
  sessionSummaries,
  isSummaryLoading,
}: PerformanceAnalyticsProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  
  const chartData = repHistory.map((rep, index) => ({
    name: `Rep ${index + 1}`,
    score: rep.score,
  }));

  const coachName = (model: string) => model.charAt(0).toUpperCase() + model.slice(1);

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
              <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} animationDuration={800} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      {(isSummaryLoading || sessionSummaries) && (
        <CardFooter className="flex-col items-start gap-4 pt-4 border-t -mb-2 mx-6">
          {isSummaryLoading && (
            <div className="w-full">
                <h4 className="text-sm font-semibold mb-2">AI Coach Summaries</h4>
                <p className="text-sm text-muted-foreground animate-pulse">Your coaches are analyzing your performance...</p>
            </div>
          )}
          {sessionSummaries && Object.keys(sessionSummaries).length > 0 && (
             <div className="w-full space-y-4">
                <h4 className="text-sm font-semibold">AI Coach Summaries</h4>
                {Object.entries(sessionSummaries).map(([model, summary]) => (
                    <div key={model}>
                        <p className="font-semibold text-primary text-sm">{coachName(model)}'s take:</p>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{summary}</p>
                    </div>
                ))}
            </div>
          )}
        </CardFooter>
      )}
      <CardFooter className="flex flex-col sm:flex-row gap-2 pt-6">
        <Button onClick={() => shareCardImage(cardRef, exercise, totalReps, averageFormScore)} variant="default" size="sm" className="w-full" disabled={repHistory.length === 0}>
          <Share2 className="mr-2 h-4 w-4" />
          Share Summary
        </Button>
        <Button onClick={() => exportChartImage(chartRef)} variant="outline" size="sm" className="w-full" disabled={repHistory.length === 0}>
          <ImageIcon className="mr-2 h-4 w-4" />
          Export Chart
        </Button>
        <Button onClick={() => exportToCSV(repHistory)} variant="outline" size="sm" className="w-full" disabled={repHistory.length === 0}>
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
