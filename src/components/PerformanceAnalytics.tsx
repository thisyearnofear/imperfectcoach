
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
  Area,
  AreaChart,
} from "recharts";
import { RepData, Exercise, SessionSummaries, CoachModel, PullupRepDetails, JumpRepDetails, ChatMessage } from "@/lib/types";
import { exportToCSV, shareCardImage, exportChartImage } from "@/lib/exportUtils";
import { AIChat } from "@/components/AIChat";

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
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  onSendMessage: (message: string, model: CoachModel) => Promise<void>;
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
  chatMessages,
  isChatLoading,
  onSendMessage,
}: PerformanceAnalyticsProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  
  const isPullupSession = exercise === 'pull-ups' && repHistory.some(rep => rep.details && 'peakElbowFlexion' in rep.details);
  const isJumpSession = exercise === 'jumps' && repHistory.some(rep => rep.details && 'jumpHeight' in rep.details);

  // Calculate jump-specific analytics
  const jumpAnalytics = isJumpSession ? (() => {
    const jumpDetails = repHistory.map(rep => rep.details as JumpRepDetails).filter(Boolean);
    const jumpHeights = jumpDetails.map(d => d.jumpHeight);
    const landingFlexions = jumpDetails.map(d => d.landingKneeFlexion);
    
    const avgHeight = jumpHeights.length > 0 ? jumpHeights.reduce((a, b) => a + b, 0) / jumpHeights.length : 0;
    const maxHeight = jumpHeights.length > 0 ? Math.max(...jumpHeights) : 0;
    const heightConsistency = jumpHeights.length > 1 ? 
      100 - Math.sqrt(jumpHeights.map(h => Math.pow(h - avgHeight, 2)).reduce((a, b) => a + b, 0) / jumpHeights.length) : 100;
    const avgLandingForm = landingFlexions.length > 0 ? landingFlexions.reduce((a, b) => a + b, 0) / landingFlexions.length : 0;
    const goodLandings = landingFlexions.filter(f => f < 160).length;
    const landingSuccessRate = landingFlexions.length > 0 ? (goodLandings / landingFlexions.length) * 100 : 0;
    
    return { avgHeight, maxHeight, heightConsistency, avgLandingForm, landingSuccessRate };
  })() : null;

  const chartData = repHistory.map((rep, index) => {
    const pullupDetails = isPullupSession ? (rep.details as PullupRepDetails) : undefined;
    const jumpDetails = isJumpSession ? (rep.details as JumpRepDetails) : undefined;
    return {
      name: `Rep ${index + 1}`,
      rep: index + 1,
      score: rep.score,
      'Top ROM': pullupDetails?.peakElbowFlexion,
      'Bottom ROM': pullupDetails?.bottomElbowExtension,
      Asymmetry: pullupDetails?.asymmetry,
      'Jump Height': jumpDetails?.jumpHeight,
      'Landing Quality': jumpDetails?.landingKneeFlexion ? (jumpDetails.landingKneeFlexion < 160 ? 100 : 60) : undefined,
      'Raw Landing Flexion': jumpDetails?.landingKneeFlexion,
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
          A comprehensive analysis of your {exercise.replace('-', ' ')} session.
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

        {/* Jump-specific metrics */}
        {isJumpSession && jumpAnalytics && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-6 p-3 bg-muted/30 rounded-lg">
            <div>
              <span className="font-semibold text-foreground">Avg Height:</span>
              <span className="ml-2 text-muted-foreground">{jumpAnalytics.avgHeight.toFixed(0)}px</span>
            </div>
            <div>
              <span className="font-semibold text-foreground">Max Height:</span>
              <span className="ml-2 text-muted-foreground">{jumpAnalytics.maxHeight.toFixed(0)}px</span>
            </div>
            <div>
              <span className="font-semibold text-foreground">Height Consistency:</span>
              <span className="ml-2 text-muted-foreground">{jumpAnalytics.heightConsistency.toFixed(0)}%</span>
            </div>
            <div>
              <span className="font-semibold text-foreground">Landing Success:</span>
              <span className="ml-2 text-muted-foreground">{jumpAnalytics.landingSuccessRate.toFixed(0)}%</span>
            </div>
          </div>
        )}

        <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
          {isJumpSession ? "Jump Performance Analysis" : "Rep Analysis"}
        </h4>
        <div className="h-60" ref={chartRef}>
          <ResponsiveContainer width="100%" height="100%">
            {isJumpSession ? (
              <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" domain={[0, 100]} stroke="hsl(var(--primary))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--accent-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))",
                    fontSize: "12px",
                    padding: "6px 10px"
                  }}
                  labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
                  formatter={(value, name) => {
                    if (name === 'Jump Height') return [`${value}px`, 'Height'];
                    if (name === 'Landing Quality') return [`${value === 100 ? 'Good' : 'Stiff'}`, 'Landing'];
                    return [value, name];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar yAxisId="left" dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={20} animationDuration={800} />
                <Line yAxisId="right" type="monotone" dataKey="Jump Height" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line yAxisId="left" type="monotone" dataKey="Landing Quality" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </ComposedChart>
            ) : (
              <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" domain={[0, 100]} stroke="hsl(var(--primary))" fontSize={12} tickLine={false} axisLine={false} />
                {(isPullupSession) && <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--accent-foreground))" fontSize={12} tickLine={false} axisLine={false} />}
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
                {isPullupSession && <Line yAxisId="right" type="monotone" dataKey="Top ROM" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />}
                {isPullupSession && <Line yAxisId="right" type="monotone" dataKey="Bottom ROM" stroke="#eab308" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />}
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
      {(isSummaryLoading || sessionSummaries) && (
        <CardFooter className="flex-col items-start gap-4 pt-4 border-t mx-6">
          {isSummaryLoading && !sessionSummaries && (
            <div className="w-full">
                <h4 className="text-sm font-semibold mb-2">AI Coach Summaries</h4>
                <p className="text-sm text-muted-foreground animate-pulse">Your coaches are analyzing your performance...</p>
            </div>
          )}
          {sessionSummaries && Object.keys(sessionSummaries).length > 0 && (
             <div className="w-full space-y-4">
                <h4 className="text-sm font-semibold">AI Coach Summaries</h4>
                {isSummaryLoading && <p className="text-sm text-muted-foreground animate-pulse">Updating summaries...</p>}
                {Object.entries(sessionSummaries).map(([model, summary]) => (
                    <div key={model}>
                        <p className="font-semibold text-primary text-sm">{coachName(model)}'s take:</p>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{summary}</p>
                    </div>
                ))}
                 <AIChat 
                    summaries={sessionSummaries}
                    messages={chatMessages}
                    isLoading={isChatLoading}
                    onSendMessage={onSendMessage}
                />
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
