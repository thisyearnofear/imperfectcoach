/**
 * AnalysisDisplayExample
 * 
 * Example component demonstrating how to use the enhanced UI/UX components
 * Shows both enhanced and basic analysis displays with proper error handling
 * 
 * PRINCIPLE: ENHANCEMENT FIRST - Demonstrates upgrading from basic to enhanced UI
 */

import React, { useState, useEffect } from 'react';
import { EnhancedAnalysisVisualizer, BasicAnalysisFallback } from './EnhancedAnalysisVisualizer';
import { transformAnalysisPipeline } from '@/lib/agents/analysis-transformer';
import { DEFAULT_FEATURE_FLAGS } from '@/lib/agents/profiles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

interface AnalysisDisplayExampleProps {
    // Raw agent response data (could be JSON string or object)
    rawAnalysisData: unknown;
    
    // Loading state
    isLoading?: boolean;
    
    // Error state
    error?: string | null;
    
    // Callback for retry
    onRetry?: () => void;
    
    // UI customization
    showHeader?: boolean;
    showRetryButton?: boolean;
    className?: string;
}

export function AnalysisDisplayExample({
    rawAnalysisData,
    isLoading = false,
    error = null,
    onRetry,
    showHeader = true,
    showRetryButton = true,
    className,
}: AnalysisDisplayExampleProps) {
    const [transformedData, setTransformedData] = useState<{
        analysisData: any;
        useEnhancedVisualization: boolean;
        isTransforming: boolean;
        transformError: string | null;
    }>({
        analysisData: null,
        useEnhancedVisualization: false,
        isTransforming: true,
        transformError: null,
    });

    useEffect(() => {
        if (!rawAnalysisData || isLoading) return;

        const transformData = async () => {
            try {
                const result = await transformAnalysisPipeline(rawAnalysisData, {
                    featureFlags: DEFAULT_FEATURE_FLAGS,
                    enhanceWithCapabilities: true,
                });

                setTransformedData({
                    analysisData: result.analysisData,
                    useEnhancedVisualization: result.useEnhancedVisualization,
                    isTransforming: false,
                    transformError: null,
                });
            } catch (transformError) {
                console.error('Data transformation failed:', transformError);
                setTransformedData({
                    analysisData: null,
                    useEnhancedVisualization: false,
                    isTransforming: false,
                    transformError: 'Failed to process analysis data',
                });
            }
        };

        transformData();
    }, [rawAnalysisData, isLoading]);

    // Handle various states
    if (isLoading) {
        return (
            <Card className={className}>
                {showHeader && (
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Processing Your Analysis
                        </CardTitle>
                    </CardHeader>
                )}
                <CardContent>
                    <div className="space-y-4 text-center py-8">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
                        <p className="text-sm text-gray-500">
                            Combining insights from multiple specialized agents...
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error || transformedData.transformError) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-500">
                        <AlertCircle className="h-5 w-5" />
                        Analysis Error
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-red-400 mb-4">
                        {error || transformedData.transformError}
                    </p>
                    {showRetryButton && onRetry && (
                        <Button 
                            variant="outline"
                            onClick={onRetry}
                            className="w-full"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry Analysis
                        </Button>
                    )}
                </CardContent>
            </Card>
        );
    }

    if (transformedData.isTransforming) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Preparing Your Results
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/5"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!transformedData.analysisData) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-500">
                        <AlertTriangle className="h-5 w-5" />
                        No Analysis Available
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-yellow-600">
                        Analysis data is not available. Please complete a workout to generate insights.
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Render the appropriate visualization based on data quality
    if (transformedData.useEnhancedVisualization) {
        return (
            <EnhancedAnalysisVisualizer
                analysisData={transformedData.analysisData}
                isLoading={false}
                error={null}
                showAdvanced={true}
                className={className}
            />
        );
    } else {
        // Fallback to basic visualization for non-enhanced data
        return (
            <BasicAnalysisFallback
                analysis={transformedData.analysisData.primaryAnalysis}
                recommendations={transformedData.analysisData.integratedRecommendations}
                className={className}
            />
        );
    }
}

// Example usage with different data formats
interface ExampleUsageProps {
    exampleType: 'enhanced' | 'basic' | 'json' | 'error' | 'loading';
}

export function AnalysisDisplayExampleUsage({ exampleType }: ExampleUsageProps) {
    const [retryCount, setRetryCount] = useState(0);

    // Example data for different scenarios
    const getExampleData = () => {
        switch (exampleType) {
            case 'enhanced':
                return {
                    primaryAnalysis: 'Your squat form shows excellent depth and knee alignment. The analysis reveals a 92% technique efficiency score, indicating professional-level execution. Minor improvements could be made in hip mobility during the descent phase.',
                    integratedRecommendations: [
                        'Incorporate hip mobility drills before squat sessions',
                        'Focus on controlled eccentric phase (3-second descent)',
                        'Add pause squats to build strength at bottom position',
                        'Maintain current protein intake for optimal recovery',
                        'Consider adding yoga for improved flexibility'
                    ],
                    priorityActions: [
                        'Incorporate hip mobility drills before squat sessions',
                        'Focus on controlled eccentric phase (3-second descent)',
                        'Add pause squats to build strength at bottom position'
                    ],
                    trainingPlan: {
                        immediate: [
                            'Add 5 minutes of hip mobility drills to warmup',
                            'Practice 3-second eccentric squats (3 sets of 5)'
                        ],
                        weekly: [
                            'Include pause squats in 2 workouts this week',
                            'Increase protein intake by 10g on workout days'
                        ],
                        monthly: [
                            'Add yoga session twice per week for flexibility',
                            'Schedule form check with coach in 4 weeks'
                        ]
                    },
                    confidenceScore: 92,
                    methodology: 'kestra-ai-synthesis',
                    agentContributions: [
                        { agentId: 'agent-fitness-core', agentName: 'Fitness Coach', emoji: '🏋️', capability: 'fitness_analysis', cost: '0.04', status: 'complete' },
                        { agentId: 'agent-biomechanics', agentName: 'Biomechanics Expert', emoji: '🦴', capability: 'biomechanics_analysis', cost: '0.02', status: 'complete' },
                        { agentId: 'agent-recovery', agentName: 'Recovery Specialist', emoji: '💆', capability: 'recovery_planning', cost: '0.01', status: 'complete' }
                    ]
                };

            case 'basic':
                return {
                    analysis: 'Your squat form looks good overall. Consider working on depth and knee alignment.',
                    recommendations: [
                        'Practice deeper squats',
                        'Focus on knee alignment',
                        'Add mobility exercises'
                    ],
                    confidence: 75
                };

            case 'json':
                return JSON.stringify({
                    analysis: 'Basic JSON analysis',
                    recommendations: ['Recommendation 1', 'Recommendation 2'],
                    confidence: 70
                });

            case 'error':
                return null;

            case 'loading':
                return null;
        }
    };

    const data = getExampleData();
    
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Analysis Display Example: {exampleType}</h2>
            
            <AnalysisDisplayExample
                rawAnalysisData={data}
                isLoading={exampleType === 'loading'}
                error={exampleType === 'error' ? 'Failed to load analysis data' : null}
                onRetry={() => {
                    console.log('Retry clicked');
                    setRetryCount(prev => prev + 1);
                }}
                showHeader={true}
                showRetryButton={true}
            />
            
            {exampleType === 'error' && (
                <div className="text-center text-sm text-gray-500">
                    Retry count: {retryCount}
                </div>
            )}
        </div>
    );
}

// Helper components for the example
function AlertCircle({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12" y2="16"></line>
        </svg>
    );
}

function AlertTriangle({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12" y2="17"></line>
        </svg>
    );
}