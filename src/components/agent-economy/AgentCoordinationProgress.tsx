/**
 * AgentCoordinationProgress
 * 
 * Animated visualization showing agents discovering and coordinating.
 * Displays the multi-agent flow in real-time during processing.
 * 
 * Mobile-optimized with vertical layout and subtle animations.
 */

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AgentCoordinationResult, ContributionStatus } from '@/lib/agents/types';
import { formatNetworkName, getRandomProcessingMessage, AGENT_PROFILES } from '@/lib/agents/agent-economy-context';

interface AgentCoordinationProgressProps {
    coordination: AgentCoordinationResult;
    progress: number; // 0-100
    currentStep?: string;
    className?: string;
}

export function AgentCoordinationProgress({
    coordination,
    progress,
    currentStep,
    className,
}: AgentCoordinationProgressProps) {
    const allAgents = [coordination.coordinator, ...coordination.contributors];

    const getStatusStyles = (status: ContributionStatus) => {
        switch (status) {
            case 'complete':
                return {
                    border: 'border-green-500/50',
                    bg: 'bg-green-500/10',
                    dot: 'bg-green-400',
                    text: 'text-green-400',
                };
            case 'processing':
            case 'negotiating':
                return {
                    border: 'border-blue-500/50',
                    bg: 'bg-blue-500/10',
                    dot: 'bg-blue-400 animate-pulse',
                    text: 'text-blue-400',
                };
            case 'discovering':
                return {
                    border: 'border-yellow-500/50',
                    bg: 'bg-yellow-500/10',
                    dot: 'bg-yellow-400 animate-pulse',
                    text: 'text-yellow-400',
                };
            case 'failed':
                return {
                    border: 'border-red-500/50',
                    bg: 'bg-red-500/10',
                    dot: 'bg-red-400',
                    text: 'text-red-400',
                };
            default:
                return {
                    border: 'border-gray-700',
                    bg: 'bg-gray-800/30',
                    dot: 'bg-gray-500',
                    text: 'text-gray-500',
                };
        }
    };

    const getStatusLabel = (status: ContributionStatus): string => {
        switch (status) {
            case 'complete': return 'Done';
            case 'processing': return 'Working...';
            case 'negotiating': return 'Negotiating...';
            case 'discovering': return 'Discovering...';
            case 'failed': return 'Failed';
            default: return 'Waiting';
        }
    };

    return (
        <div className={cn("space-y-4", className)}>
            {/* Progress Header */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-purple-300">
                        {currentStep || 'Coordinating agents...'}
                    </span>
                    <span className="text-muted-foreground tabular-nums">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            {/* Agent Coordination Flow */}
            <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Agent Coordination
                </h4>

                <div className="relative">
                    {/* Connection Lines (visual) */}
                    <div className="absolute left-[22px] top-8 bottom-4 w-px bg-gradient-to-b from-purple-500/50 via-blue-500/30 to-transparent" />

                    {/* Agent Cards */}
                    <div className="space-y-2">
                        {allAgents.map((agent, index) => {
                            const styles = getStatusStyles(agent.status);
                            const isCoordinator = agent.role === 'coordinator';

                            return (
                                <div
                                    key={agent.agentId}
                                    className={cn(
                                        "relative flex items-center gap-3 p-3 rounded-lg border transition-all duration-300",
                                        styles.border,
                                        styles.bg,
                                        agent.status === 'processing' && "shadow-md shadow-blue-500/10"
                                    )}
                                >
                                    {/* Connection Node */}
                                    <div className={cn(
                                        "absolute left-[18px] w-2 h-2 rounded-full z-10",
                                        styles.dot
                                    )} />

                                    {/* Agent Icon */}
                                    <div className={cn(
                                        "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl",
                                        isCoordinator ? "bg-purple-500/20" : "bg-gray-800/50",
                                        "ml-4" // Offset for connection line
                                    )}>
                                        {agent.emoji}
                                    </div>

                                    {/* Agent Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium truncate">
                                                {agent.agentName}
                                            </span>
                                            {isCoordinator && (
                                                <Badge variant="outline" className="text-[10px] h-4 px-1 bg-purple-500/20 border-purple-500/30">
                                                    coordinator
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={cn("text-xs", styles.text)}>
                                                {getStatusLabel(agent.status)}
                                            </span>
                                            {agent.statusMessage && (
                                                <span className="text-xs text-muted-foreground truncate">
                                                    • {agent.statusMessage}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Cost Badge */}
                                    <div className="flex-shrink-0">
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-xs tabular-nums",
                                                agent.status === 'complete' && "bg-green-500/10 border-green-500/30"
                                            )}
                                        >
                                            {parseFloat(agent.cost) === 0 ? 'FREE' : `$${agent.cost}`}
                                        </Badge>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Network Info */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
                <div className="flex items-center gap-2">
                    <span>⛓️</span>
                    <span>{formatNetworkName(coordination.primaryNetwork)}</span>
                </div>
                <span>{coordination.routingReason}</span>
            </div>
        </div>
    );
}
