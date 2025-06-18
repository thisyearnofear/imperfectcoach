import React from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { BarChart2 as AnalyticsIcon } from "lucide-react";
import CoachFeedback from "@/components/CoachFeedback";
import PerformanceAnalytics from "@/components/PerformanceAnalytics";
import UnlockedAchievements from "@/components/UnlockedAchievements";
import DebugPanel from "@/components/DebugPanel";
import { CoachSummarySelector } from "@/components/CoachSummarySelector";
import { CoachModel, Exercise, RepData, SessionSummaries, Achievement, PoseData, WorkoutMode, ChatMessage } from '@/lib/types';

interface BottomSectionProps {
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

export const BottomSection = (props: BottomSectionProps) => {
    return (
        <div className="w-full">
            {/* Analytics Section - Full width since CoachFeedback is now in sidebar */}
            <div className="flex flex-col gap-4">
                    {/* Performance Analytics */}
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

                    
                {/* Debug Panel */}
                {props.isDebugMode && <DebugPanel poseData={props.poseData} />}
            </div>
        </div>
    );
};
