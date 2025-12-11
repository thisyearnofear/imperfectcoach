/**
 * AgentValueProposition
 * 
 * Explains the agent economy value proposition:
 * "5 Specialists, 1 Price"
 * 
 * Shows the agents that will coordinate and the cost savings.
 * Used in upsell cards before purchase.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
    AGENT_PROFILES,
    getAgentProfilesList,
    AGENT_ECONOMY_VALUE,
    TRADITIONAL_COSTS
} from '@/lib/agents/agent-economy-context';

interface AgentValuePropositionProps {
    variant?: 'compact' | 'full';
    showNetwork?: boolean;
    network?: string;
    className?: string;
}

export function AgentValueProposition({
    variant = 'full',
    showNetwork = true,
    network = 'avalanche-c-chain',
    className,
}: AgentValuePropositionProps) {
    const agents = getAgentProfilesList();
    const specialists = agents.filter(a => a.role !== 'coordinator');

    const networkLabels: Record<string, string> = {
        'avalanche-c-chain': 'Avalanche',
        'base-sepolia': 'Base',
        'solana-devnet': 'Solana',
    };

    if (variant === 'compact') {
        return (
            <div className={cn("space-y-3", className)}>
                {/* Headline */}
                <div className="text-center">
                    <div className="text-lg font-bold">
                        {agents.length} Specialists • 1 Price
                    </div>
                    <div className="text-sm text-muted-foreground">
                        ${AGENT_ECONOMY_VALUE.userCost} instead of ${AGENT_ECONOMY_VALUE.singleSession}
                    </div>
                </div>

                {/* Agent Icons Row */}
                <div className="flex justify-center gap-2">
                    {agents.map((agent) => (
                        <div
                            key={agent.id}
                            className="flex flex-col items-center gap-1"
                            title={agent.name}
                        >
                            <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-lg">
                                {agent.emoji}
                            </div>
                        </div>
                    ))}
                </div>

                {showNetwork && (
                    <div className="text-center text-xs text-muted-foreground">
                        ⛓️ Settled via x402 on {networkLabels[network] || network}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={cn("space-y-4", className)}>
            {/* Hero Message */}
            <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30">
                    <span className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                        {agents.length} SPECIALISTS • 1 PRICE
                    </span>
                </div>
                <div className="text-sm text-muted-foreground">
                    Pay ${AGENT_ECONOMY_VALUE.userCost} — Get ${AGENT_ECONOMY_VALUE.singleSession} of expertise
                </div>
            </div>

            {/* Agent List */}
            <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Your Coach Coordinates:
                </p>

                <div className="grid grid-cols-1 gap-2">
                    {agents.map((agent) => (
                        <div
                            key={agent.id}
                            className={cn(
                                "flex items-center gap-3 p-2.5 rounded-lg border transition-colors",
                                agent.role === 'coordinator'
                                    ? "border-purple-500/30 bg-purple-500/5"
                                    : "border-border/50 bg-card/30"
                            )}
                        >
                            {/* Icon */}
                            <div className={cn(
                                "flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-lg",
                                agent.role === 'coordinator'
                                    ? "bg-purple-500/20"
                                    : "bg-muted/30"
                            )}>
                                {agent.emoji}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{agent.name}</span>
                                    {agent.role === 'coordinator' && (
                                        <Badge variant="outline" className="text-[10px] h-4 px-1">
                                            main
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                    {agent.description}
                                </p>
                            </div>

                            {/* Cost */}
                            <div className="flex-shrink-0">
                                <span className={cn(
                                    "text-xs font-medium",
                                    parseFloat(agent.baseCost) === 0 ? "text-green-400" : "text-muted-foreground"
                                )}>
                                    {parseFloat(agent.baseCost) === 0 ? 'FREE' : `$${agent.baseCost}`}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Value Comparison */}
            <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Traditional cost</span>
                    <span className="line-through text-muted-foreground">
                        ${AGENT_ECONOMY_VALUE.singleSession}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-400">Your cost</span>
                    <span className="text-lg font-bold text-green-400">
                        ${AGENT_ECONOMY_VALUE.userCost}
                    </span>
                </div>
                <div className="text-center">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Save {AGENT_ECONOMY_VALUE.savingsPercent.toFixed(0)}%
                    </Badge>
                </div>
            </div>

            {/* Network Info */}
            {showNetwork && (
                <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <span>⛓️</span>
                    <span>All payments settled via x402 on {networkLabels[network] || network}</span>
                </div>
            )}
        </div>
    );
}
