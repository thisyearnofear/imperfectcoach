
import React from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { BarChart2 as AnalyticsIcon, Settings } from "lucide-react";
import CoachFeedback from "@/components/CoachFeedback";
import PerformanceAnalytics from "@/components/PerformanceAnalytics";
import UnlockedAchievements from "@/components/UnlockedAchievements";
import DebugPanel from "@/components/DebugPanel";
import { CoachSummarySelector } from "@/components/CoachSummarySelector";
import { ApiKeySettings } from "@/components/ApiKeySettings";
import { CoachModel, Exercise, RepData, SessionSummaries, Achievement, PoseData, WorkoutMode, ChatMessage } from '@/lib/types';

interface RightPanelProps {
    reps: number;
    formFeedback: string;
    formScore: number;
    coachModel: CoachModel;
    workoutMode: WorkoutMode;
    analyticsRef: React.RefObject<HTMLDivElement>;
    isAnalyticsOpen: boolean;
    setIsAnalyticsOpen: (open: boolean) => void;
    selectedCoaches: CoachModel[];
    setSelectedCoaches: (coaches: CoachModel[]) => void;
    isWorkoutActive: boolean;
    isSummaryLoading: boolean;
    repHistory: RepData[];
    exercise: Exercise;
    sessionDuration: string;
    repTimings: { avg: number; stdDev: number; };
    sessionSummaries: SessionSummaries | null;
    achievements: Achievement[];
    isDebugMode: boolean;
    poseData: PoseData | null;
    onTryAgain: () => void;
    chatMessages: ChatMessage[];
    isChatLoading: boolean;
    onSendMessage: (message: string, model: CoachModel) => Promise<void>;
}

export const RightPanel = (props: RightPanelProps) => {
    return (
        <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="hidden lg:block">
              <CoachFeedback 
                reps={props.reps} 
                formFeedback={props.formFeedback} 
                formScore={props.formScore} 
                coachModel={props.coachModel} 
                workoutMode={props.workoutMode} 
              />
            </div>
            
            <div ref={props.analyticsRef}>
              <Collapsible open={props.isAnalyticsOpen} onOpenChange={props.setIsAnalyticsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <AnalyticsIcon className="mr-2 h-4 w-4" />
                    Show Performance &amp; Achievements
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-4 animate-fade-in">
                  <div className="bg-card p-4 rounded-lg border">
                    <CoachSummarySelector 
                      selectedCoaches={props.selectedCoaches}
                      onSelectionChange={props.setSelectedCoaches}
                      disabled={props.isWorkoutActive || props.isSummaryLoading}
                    />
                  </div>
                  <PerformanceAnalytics
                    repHistory={props.repHistory}
                    totalReps={props.reps}
                    averageFormScore={props.formScore}
                    exercise={props.exercise}
                    sessionDuration={props.sessionDuration}
                    repTimings={props.repTimings}
                    sessionSummaries={props.sessionSummaries}
                    isSummaryLoading={props.isSummaryLoading}
                    onTryAgain={props.onTryAgain}
                    chatMessages={props.chatMessages}
                    isChatLoading={props.isChatLoading}
                    onSendMessage={props.onSendMessage}
                  />
                  <UnlockedAchievements achievements={props.achievements} />
                </CollapsibleContent>
              </Collapsible>
            </div>

            <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    Advanced Settings
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-4 animate-fade-in">
                    <div className="bg-card p-4 rounded-lg border">
                        <h4 className="text-sm font-semibold mb-2">Custom API Keys</h4>
                        <p className="text-xs text-muted-foreground mb-4">
                            Optionally provide your own API keys. They are stored only in your browser and are used instead of the default keys.
                        </p>
                        <ApiKeySettings />
                    </div>
                </CollapsibleContent>
              </Collapsible>
            
            {props.isDebugMode && <DebugPanel poseData={props.poseData} />}
          </div>
    );
};
