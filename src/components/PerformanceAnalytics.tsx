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
import { Download, LineChart as LineChartIcon, Share2, Image as ImageIcon, RotateCw } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  Bar,
} from "recharts";
import { RepData, Exercise, SessionSummaries, CoachModel, PullupRepDetails } from "@/lib/types";
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
  onTryAgain: () => void;
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
  onTryAgain,
}: PerformanceAnalyticsProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  
  const isPullupSession = exercise === 'pull-ups' && repHistory.some(rep => rep.details);

  const chartData = repHistory.map((rep, index) => {
    const details = rep.details as PullupRepDetails | undefined;
    return {
      name: `Rep ${index + 1}`,
      score: rep.score,
      'Top ROM': details?.peakElbowFlexion,
      'Bottom ROM': details?.bottomElbowExtension,
      Asymmetry: details?.asymmetry,
    };
  });

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

        <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Rep Analysis</h4>
        <div className="h-60" ref={chartRef}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" domain={[0, 100]} stroke="hsl(var(--primary))" fontSize={12} tickLine={false} axisLine={false} />
              {isPullupSession && <YAxis yAxisId="right" orientation="right" domain={[0, 180]} stroke="hsl(var(--accent-foreground))" fontSize={12} tickLine={false} axisLine={false} />}
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                  fontSize: "12px",
                  padding: "6px 10px"
                }}
                labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar yAxisId="left" dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={20} animationDuration={800} />
              {isPullupSession && <Line yAxisId="right" type="monotone" dataKey="Top ROM" stroke="hsl(var(--green-500))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />}
              {isPullupSession && <Line yAxisId="right" type="monotone" dataKey="Bottom ROM" stroke="hsl(var(--yellow-500))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />}
            </ComposedChart>
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
      <CardFooter className="flex flex-wrap gap-2 pt-6">
        <Button onClick={onTryAgain} variant="default" size="sm" className="flex-grow min-w-[calc(50%-0.25rem)]" disabled={repHistory.length === 0}>
          <RotateCw />
          Try Again
        </Button>
        <Button onClick={() => shareCardImage(cardRef, exercise, totalReps, averageFormScore)} variant="outline" size="sm" className="flex-grow min-w-[calc(50%-0.25rem)]" disabled={repHistory.length === 0}>
          <Share2 />
          Share Summary
        </Button>
        <Button onClick={() => exportChartImage(chartRef)} variant="outline" size="sm" className="flex-grow min-w-[calc(50%-0.25rem)]" disabled={repHistory.length === 0}>
          <ImageIcon />
          Export Chart
        </Button>
        <Button onClick={() => exportToCSV(repHistory)} variant="outline" size="sm" className="flex-grow min-w-[calc(50%-0.25rem)]" disabled={repHistory.length === 0}>
          <Download />
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
