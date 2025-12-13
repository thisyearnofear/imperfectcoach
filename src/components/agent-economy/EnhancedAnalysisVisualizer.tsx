/**
 * EnhancedAnalysisVisualizer
 * 
 * Transforms raw JSON agent responses into beautiful, interactive visualizations
 * with animated insights, confidence indicators, and actionable recommendations.
 * 
 * PRINCIPLE: ENHANCEMENT FIRST - Enhances existing analysis display instead of replacing
 * PRINCIPLE: CLEAN - Separates visualization logic from data processing
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Lightbulb, BarChart2, ShieldCheck, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { AgentCoordinationResult, AgentContribution } from '@/lib/agents/types';
import { getAgentEnhancedCapabilities } from '@/lib/agents/profiles';

interface EnhancedAnalysisData {
    primaryAnalysis: string;
    integratedRecommendations: string[];
    priorityActions: string[];
    trainingPlan: Record<string, string[]>;
    confidenceScore: number;
    methodology: string;
    agentContributions?: AgentContribution[];
    coordinationResult?: AgentCoordinationResult;
}

interface EnhancedAnalysisVisualizerProps {
    analysisData: EnhancedAnalysisData;
    isLoading?: boolean;
    error?: string | null;
    className?: string;
    showAdvanced?: boolean;
}

export function EnhancedAnalysisVisualizer({
    analysisData,
    isLoading = false,
    error = null,
    className,
    showAdvanced = true,
}: EnhancedAnalysisVisualizerProps) {
    const [activeTab, setActiveTab] = useState('insights');
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        recommendations: true,
        trainingPlan: true,
        confidence: false,
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Calculate confidence level visualization
    const getConfidenceLevel = (score: number) => {
        if (score >= 90) return { level: 'Exceptional', color: 'bg-green-500' };
        if (score >= 80) return { level: 'High', color: 'bg-blue-500' };
        if (score >= 70) return { level: 'Good', color: 'bg-purple-500' };
        if (score >= 60) return { level: 'Fair', color: 'bg-yellow-500' };
        return { level: 'Low', color: 'bg-red-500' };
    };

    const confidence = getConfidenceLevel(analysisData.confidenceScore);

    // Extract key insights from analysis
    const keyInsights = useMemo(() => {
        if (!analysisData.primaryAnalysis) return [];
        
        // Simple extraction - could be enhanced with NLP
        const insights: { text: string; icon: React.ReactNode; category: string }[] = [];
        
        if (analysisData.primaryAnalysis.includes('form') || analysisData.primaryAnalysis.includes('technique')) {
            insights.push({
                text: 'Form improvement opportunities identified',
                icon: <ShieldCheck className="h-4 w-4 text-blue-500" />,
                category: 'technique'
            });
        }

        if (analysisData.primaryAnalysis.includes('recovery') || analysisData.primaryAnalysis.includes('rest')) {
            insights.push({
                text: 'Recovery optimization recommendations',
                icon: <Lightbulb className="h-4 w-4 text-green-500" />,
                category: 'recovery'
            });
        }

        if (analysisData.primaryAnalysis.includes('nutrition') || analysisData.primaryAnalysis.includes('protein')) {
            insights.push({
                text: 'Nutrition guidance provided',
                icon: <Zap className="h-4 w-4 text-purple-500" />,
                category: 'nutrition'
            });
        }

        return insights.length > 0 ? insights : [{
            text: 'Comprehensive fitness analysis',
            icon: <BarChart2 className="h-4 w-4 text-indigo-500" />,
            category: 'general'
        }];
    }, [analysisData.primaryAnalysis]);

    // Enhanced agent contribution visualization
    const enhancedAgents = useMemo(() => {
        if (!analysisData.agentContributions) return [];
        
        return analysisData.agentContributions.map(contribution => {
            const capabilities = getAgentEnhancedCapabilities(contribution.agentId);
            return {
                ...contribution,
                capabilities,
                isEnhanced: capabilities.supportsKestraSynthesis || capabilities.supportsOumiEnhancement
            };
        });
    }, [analysisData.agentContributions]);

    if (error) {
        return (
            <Card className={cn("border-red-500", className)}>
                <CardHeader>
                    <CardTitle className="text-red-500 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Analysis Error
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-red-400">{error}</p>
                    <p className="text-sm text-gray-500 mt-2">
                        The system has automatically fallen back to basic analysis.
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (isLoading) {
        return (
            <Card className={cn("animate-pulse", className)}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Enhancing Your Analysis...
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                    <Progress value={75} className="mt-4" />
                    <p className="text-sm text-gray-500 mt-2 text-center">
                        Combining insights from {enhancedAgents.length} specialized agents...
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={cn("space-y-4", className)}>
            {/* Confidence Indicator */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-blue-500" />
                            Analysis Confidence: {Math.round(analysisData.confidenceScore)}%
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="relative w-24 h-24">
                                <svg className="w-24 h-24 transform -rotate-90">
                                    <circle cx="48" cy="48" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r="40"
                                        stroke="#3b82f6"
                                        strokeWidth="8"
                                        fill="none"
                                        strokeDasharray="251.2"
                                        strokeDashoffset={251.2 * (1 - analysisData.confidenceScore / 100)}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Badge className={cn(confidence.color, "text-white text-sm")}>
                                        {confidence.level}
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-600">
                                    This analysis combines insights from {enhancedAgents.length} specialized agents
                                    using {analysisData.methodology.replace(/-/g, ' ')} synthesis.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Key Insights */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-yellow-500" />
                            Key Insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {keyInsights.map((insight, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 * index }}
                                    className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start gap-3">
                                        {insight.icon}
                                        <div>
                                            <p className="font-medium text-sm">{insight.text}</p>
                                            <Badge variant="secondary" className="mt-1 text-xs">
                                                {insight.category}
                                            </Badge>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Main Analysis with Tabs */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-0">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid grid-cols-3 bg-gray-100 rounded-lg p-1">
                                <TabsTrigger value="insights" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    <BarChart2 className="h-4 w-4 mr-2" />
                                    Insights
                                </TabsTrigger>
                                <TabsTrigger value="recommendations" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Recommendations
                                </TabsTrigger>
                                <TabsTrigger value="plan" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    <Zap className="h-4 w-4 mr-2" />
                                    Training Plan
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <AnimatePresence mode="wait">
                            {activeTab === 'insights' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="prose prose-sm max-w-none">
                                        <p className="text-gray-700 leading-relaxed">
                                            {analysisData.primaryAnalysis}
                                        </p>
                                    </div>
                                    
                                    {showAdvanced && analysisData.coordinationResult && (
                                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm font-medium text-gray-700 mb-2">
                                                🤖 AI Synthesis Methodology
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                This analysis was created using <strong>{analysisData.methodology.replace(/-/g, ' ')}</strong> 
                                                which intelligently combines insights from multiple specialized agents to provide 
                                                a comprehensive, personalized fitness assessment.
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'recommendations' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-medium text-gray-700">
                                            Priority Actions ({analysisData.priorityActions.length})
                                        </h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleSection('recommendations')}
                                            className="h-6 w-6 p-0"
                                        >
                                            {expandedSections.recommendations ? (
                                                <ChevronUp className="h-4 w-4" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                    
                                    <AnimatePresence>
                                        {expandedSections.recommendations && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="space-y-2">
                                                    {analysisData.priorityActions.map((action, index) => (
                                                        <motion.div
                                                            key={index}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.05 * index }}
                                                            className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                                                        >
                                                            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                                                                <span className="text-blue-600 text-sm font-medium">
                                                                    {index + 1}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-700 flex-1">
                                                                {action}
                                                            </p>
                                                            <Badge variant="outline" className="text-xs">
                                                                Priority {index + 1}
                                                            </Badge>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    
                                    {analysisData.integratedRecommendations.length > analysisData.priorityActions.length && (
                                        <div className="mt-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-medium text-gray-700">
                                                    Additional Recommendations
                                                </h3>
                                            </div>
                                            <div className="mt-2 space-y-2">
                                                {analysisData.integratedRecommendations.slice(analysisData.priorityActions.length).map((rec, index) => (
                                                    <div key={index} className="flex items-start gap-3 p-2 text-sm text-gray-600">
                                                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                        <span>{rec}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'plan' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-4"
                                >
                                    {Object.entries(analysisData.trainingPlan).map(([period, actions]) => (
                                        <div key={period} className="border border-gray-100 rounded-lg">
                                            <div
                                                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                                                onClick={() => toggleSection(`trainingPlan-${period}`)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-3 h-3 rounded-full ${
                                                        period === 'immediate' ? 'bg-red-500' :
                                                        period === 'weekly' ? 'bg-yellow-500' :
                                                        'bg-green-500'
                                                    }`} />
                                                    <h3 className="font-medium text-gray-700 capitalize">
                                                        {period.replace(/_/g, ' ')} Plan
                                                    </h3>
                                                    <Badge variant="outline" className="text-xs">
                                                        {actions.length} actions
                                                    </Badge>
                                                </div>
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                    {expandedSections[`trainingPlan-${period}`] ? (
                                                        <ChevronUp className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                            <AnimatePresence>
                                                {expandedSections[`trainingPlan-${period}`] && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden px-3 pb-3"
                                                    >
                                                        <div className="space-y-2">
                                                            {actions.map((action, index) => (
                                                                <div key={index} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-md">
                                                                    <div className="w-5 h-5 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                        <span className="text-gray-600 text-xs">
                                                                            {index + 1}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm text-gray-700">
                                                                        {action}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Enhanced Agent Contributions */}
            {showAdvanced && enhancedAgents.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                🤖 Enhanced Agent Contributions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                {enhancedAgents.map((agent, index) => (
                                    <motion.div
                                        key={agent.agentId}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.05 * index }}
                                        className="border border-gray-100 rounded-lg p-3 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-lg">{agent.emoji}</span>
                                            <span className="font-medium text-sm">{agent.name}</span>
                                            {agent.isEnhanced && (
                                                <Badge variant="outline" className="text-xs border-blue-200 text-blue-600">
                                                    Enhanced
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 mb-1">
                                            {agent.capability}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {agent.capabilities.supportsKestraSynthesis && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Kestra AI
                                                </Badge>
                                            )}
                                            {agent.capabilities.supportsOumiEnhancement && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Oumi Model
                                                </Badge>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    );
}

// Helper component for when enhanced analysis is not available
interface BasicAnalysisFallbackProps {
    analysis: string;
    recommendations: string[];
    className?: string;
}

export function BasicAnalysisFallback({ analysis, recommendations, className }: BasicAnalysisFallbackProps) {
    return (
        <Card className={cn("border-0 shadow-lg", className)}>
            <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-blue-500" />
                    Fitness Analysis
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                        {analysis}
                    </p>
                </div>
                
                {recommendations.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="font-medium text-gray-700 mb-2">Recommendations</h3>
                        {recommendations.map((rec, index) => (
                            <div key={index} className="flex items-start gap-3 p-2 border border-gray-100 rounded-lg">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{rec}</span>
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                    <p>💡 <strong>Enhanced Analysis Available:</strong> Upgrade to see AI-powered insights from multiple specialized agents with confidence scoring and personalized training plans.</p>
                </div>
            </CardContent>
        </Card>
    );
}