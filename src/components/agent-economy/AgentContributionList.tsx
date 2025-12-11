/**
 * AgentContributionList
 * 
 * Reusable component showing which agents contributed to a result
 * with their costs, status, and contribution summaries.
 * 
 * Used in:
 * - Agent analysis results (post-payment)
 * - Agent economy explainer sections
 * - Value proposition displays
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { AgentContribution, AgentCoordinationResult } from '@/lib/agents/types';
import { formatNetworkName, AGENT_ECONOMY_VALUE } from '@/lib/agents/agent-economy-context';

interface AgentContributionListProps {
    coordination: AgentCoordinationResult;
    variant?: 'compact' | 'detailed';
    showSavings?: boolean;
    showTransaction?: boolean;
    className?: string;
}

export function AgentContributionList({
    coordination,
    variant = 'detailed',
    showSavings = true,
    showTransaction = true,
    className,
}: AgentContributionListProps) {
    const allContributions = [coordination.coordinator, ...coordination.contributors];
    const completedCount = allContributions.filter(c => c.status === 'complete').length;

    const getStatusIcon = (status: AgentContribution['status']) => {
        switch (status) {
            case 'complete':
                return <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />;
            case 'processing':
            case 'negotiating':
            case 'discovering':
                return <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin" />;
            case 'failed':
                return <AlertCircle className="h-3.5 w-3.5 text-red-400" />;
            default:
                return <div className="h-3.5 w-3.5 rounded-full border border-gray-500" />;
        }
    };

    const getExplorerUrl = (chain: string, txHash?: string): string | null => {
        if (!txHash) return null;
        const explorers: Record<string, string> = {
            'avalanche-c-chain': `https://testnet.snowscan.xyz/tx/${txHash}`,
            'base-sepolia': `https://sepolia.basescan.org/tx/${txHash}`,
            'solana-devnet': `https://explorer.solana.com/tx/${txHash}?cluster=devnet`,
        };
        return explorers[chain] || null;
    };

    if (variant === 'compact') {
        return (
            <div className={cn("space-y-2", className)}>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                        {completedCount}/{allContributions.length} specialists
                    </span>
                    <span className="font-medium">${coordination.totalCost}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                    {allContributions.map((contrib) => (
                        <Badge
                            key={contrib.agentId}
                            variant="outline"
                            className={cn(
                                "text-xs",
                                contrib.status === 'complete' && "border-green-500/30 bg-green-500/10",
                                contrib.status === 'processing' && "border-blue-500/30 bg-blue-500/10",
                                contrib.status === 'failed' && "border-red-500/30 bg-red-500/10"
                            )}
                        >
                            {contrib.emoji} {contrib.agentName.split(' ')[0]}
                        </Badge>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={cn("rounded-lg border border-border/50 bg-card/50 overflow-hidden", className)}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                        💰 What You Paid For
                    </h4>
                    <Badge variant="outline" className="text-xs bg-purple-500/10 border-purple-500/30">
                        {allContributions.length} Specialists
                    </Badge>
                </div>
            </div>

            {/* Agent List */}
            <div className="divide-y divide-border/30">
                {allContributions.map((contrib) => (
                    <div
                        key={contrib.agentId}
                        className={cn(
                            "px-4 py-3 flex items-center gap-3 transition-colors",
                            contrib.status === 'processing' && "bg-blue-500/5"
                        )}
                    >
                        {/* Status Icon */}
                        <div className="flex-shrink-0">
                            {getStatusIcon(contrib.status)}
                        </div>

                        {/* Agent Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-base">{contrib.emoji}</span>
                                <span className="text-sm font-medium truncate">{contrib.agentName}</span>
                                {contrib.role === 'coordinator' && (
                                    <Badge variant="outline" className="text-[10px] h-4 px-1">
                                        coord
                                    </Badge>
                                )}
                            </div>
                            {contrib.statusMessage && contrib.status === 'processing' && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    {contrib.statusMessage}
                                </p>
                            )}
                            {contrib.result && contrib.status === 'complete' && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    {contrib.result}
                                </p>
                            )}
                        </div>

                        {/* Cost */}
                        <div className="flex-shrink-0 text-right">
                            <span className={cn(
                                "text-sm tabular-nums",
                                parseFloat(contrib.cost) === 0 ? "text-green-400" : "text-foreground"
                            )}>
                                {parseFloat(contrib.cost) === 0 ? 'FREE' : `$${contrib.cost}`}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer - Totals & Savings */}
            <div className="px-4 py-3 border-t border-border/50 bg-muted/30 space-y-2">
                {/* Total */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="text-sm font-bold">${coordination.totalCost} USDC</span>
                </div>

                {/* Savings Comparison */}
                {showSavings && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Traditional cost</span>
                        <span>~${coordination.estimatedValue}</span>
                    </div>
                )}
                {showSavings && (
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-green-400 font-medium">Your savings</span>
                        <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/30 text-green-400">
                            {coordination.savingsPercent.toFixed(0)}% off
                        </Badge>
                    </div>
                )}

                {/* Network Info */}
                {showTransaction && coordination.coordinator.transactionHash && (
                    <div className="pt-2 border-t border-border/30">
                        <a
                            href={getExplorerUrl(coordination.primaryNetwork, coordination.coordinator.transactionHash) || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                        >
                            <span>⛓️</span>
                            <span>Verified on {formatNetworkName(coordination.primaryNetwork)}</span>
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
