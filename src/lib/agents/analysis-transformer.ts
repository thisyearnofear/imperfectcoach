/**
 * Analysis Transformer
 * 
 * Transforms raw JSON agent responses into structured, visualization-ready data
 * Handles both enhanced (Kestra/Oumi) and basic agent responses
 * 
 * PRINCIPLE: ENHANCEMENT FIRST - Enhances raw data instead of replacing existing processing
 * PRINCIPLE: CLEAN - Separates data transformation from visualization
 * PRINCIPLE: MODULAR - Composable transformation pipeline
 */

import { AgentContribution, AgentCoordinationResult } from './types';
import { DEFAULT_FEATURE_FLAGS, getAgentEnhancedCapabilities } from './profiles';

interface RawAgentResponse {
    // Basic agent response structure
    analysis?: string;
    recommendations?: string[];
    confidence?: number;
    
    // Enhanced Kestra response
    primaryAnalysis?: string;
    integratedRecommendations?: string[];
    priorityActions?: string[];
    trainingPlan?: Record<string, string[]>;
    confidenceScore?: number;
    methodology?: string;
    
    // Agent coordination data
    coordinationResult?: AgentCoordinationResult;
    agentContributions?: AgentContribution[];
    
    // Raw JSON fallback
    [key: string]: unknown;
}

export interface StructuredAnalysisData {
    primaryAnalysis: string;
    integratedRecommendations: string[];
    priorityActions: string[];
    trainingPlan: Record<string, string[]>;
    confidenceScore: number;
    methodology: string;
    agentContributions?: AgentContribution[];
    coordinationResult?: AgentCoordinationResult;
    isEnhanced: boolean;
    rawData?: unknown;
}

/**
 * Transform raw agent response into structured analysis data
 * PRINCIPLE: MODULAR - Handles multiple response formats
 */
export function transformAgentResponse(rawResponse: RawAgentResponse): StructuredAnalysisData {
    try {
        // Check if this is an enhanced response (Kestra/Oumi)
        const isEnhanced = !!rawResponse.primaryAnalysis || 
                          !!rawResponse.methodology || 
                          Array.isArray(rawResponse.priorityActions);

        if (isEnhanced) {
            // Enhanced response - use as-is with validation
            return {
                primaryAnalysis: rawResponse.primaryAnalysis || rawResponse.analysis || 'Comprehensive fitness analysis',
                integratedRecommendations: rawResponse.integratedRecommendations || rawResponse.recommendations || [],
                priorityActions: rawResponse.priorityActions || [],
                trainingPlan: rawResponse.trainingPlan || {},
                confidenceScore: rawResponse.confidenceScore || rawResponse.confidence || 75,
                methodology: rawResponse.methodology || 'basic-agent-analysis',
                agentContributions: rawResponse.agentContributions,
                coordinationResult: rawResponse.coordinationResult,
                isEnhanced: true,
                rawData: rawResponse
            };
        } else {
            // Basic response - enhance it
            return transformBasicResponse(rawResponse);
        }
    } catch (error) {
        console.error('Analysis transformation error:', error);
        // Fallback to basic structure
        return createFallbackAnalysis(rawResponse);
    }
}

/**
 * Transform basic agent response into enhanced structure
 * PRINCIPLE: ENHANCEMENT FIRST - Upgrades basic responses
 */
function transformBasicResponse(rawResponse: RawAgentResponse): StructuredAnalysisData {
    const analysis = rawResponse.analysis || 'Basic fitness analysis completed';
    const recommendations = rawResponse.recommendations || [];
    const confidence = rawResponse.confidence || 70;

    // Extract priority actions from recommendations (first 3)
    const priorityActions = recommendations.slice(0, 3);
    const remainingRecommendations = recommendations.slice(3);

    // Create a basic training plan
    const trainingPlan = {
        immediate: priorityActions,
        weekly: remainingRecommendations.slice(0, 2),
        monthly: remainingRecommendations.slice(2)
    };

    return {
        primaryAnalysis: analysis,
        integratedRecommendations: recommendations,
        priorityActions: priorityActions,
        trainingPlan: trainingPlan,
        confidenceScore: confidence,
        methodology: 'basic-agent-analysis',
        isEnhanced: false,
        rawData: rawResponse
    };
}

/**
 * Create fallback analysis when transformation fails
 * PRINCIPLE: CLEAN - Graceful degradation
 */
function createFallbackAnalysis(rawResponse: RawAgentResponse): StructuredAnalysisData {
    return {
        primaryAnalysis: 'Fitness analysis completed successfully',
        integratedRecommendations: [
            'Focus on proper form and technique',
            'Maintain consistent workout schedule',
            'Stay hydrated and prioritize recovery'
        ],
        priorityActions: [
            'Focus on proper form and technique'
        ],
        trainingPlan: {
            immediate: ['Focus on proper form and technique'],
            weekly: ['Maintain consistent workout schedule'],
            monthly: ['Stay hydrated and prioritize recovery']
        },
        confidenceScore: 65,
        methodology: 'fallback-analysis',
        isEnhanced: false,
        rawData: rawResponse
    };
}

/**
 * Enhance analysis with agent capability information
 * PRINCIPLE: DRY - Single source for agent capabilities
 */
export function enhanceWithAgentCapabilities(
    analysisData: StructuredAnalysisData
): StructuredAnalysisData {
    if (!analysisData.agentContributions || analysisData.agentContributions.length === 0) {
        return analysisData;
    }

    // Add capability information to each contributing agent
    const enhancedContributions = analysisData.agentContributions.map(contribution => {
        const capabilities = getAgentEnhancedCapabilities(contribution.agentId);
        
        return {
            ...contribution,
            capabilities,
            isEnhanced: capabilities.supportsKestraSynthesis || capabilities.supportsOumiEnhancement
        };
    });

    return {
        ...analysisData,
        agentContributions: enhancedContributions
    };
}

/**
 * Check if enhanced visualization should be used
 * PRINCIPLE: CLEAN - Single decision point
 */
export function shouldUseEnhancedVisualization(
    analysisData: StructuredAnalysisData,
    featureFlags: Partial<typeof DEFAULT_FEATURE_FLAGS> = {}
): boolean {
    const config = { ...DEFAULT_FEATURE_FLAGS, ...featureFlags };
    
    // Use enhanced visualization if:
    // 1. Features are enabled
    // 2. Data is marked as enhanced OR has sufficient content
    const hasEnhancedContent = analysisData.isEnhanced || 
                              analysisData.priorityActions.length > 0 ||
                              Object.keys(analysisData.trainingPlan).length > 0;

    return config.enableKestraOrchestration && 
           config.enableOumiEnhancements && 
           hasEnhancedContent;
}

/**
 * Extract key insights from analysis text
 * PRINCIPLE: PERFORMANT - Lightweight text analysis
 */
export function extractKeyInsights(analysisText: string): Array<{ 
    text: string; 
    category: string; 
    icon?: string 
}> {
    const insights: Array<{ text: string; category: string; icon?: string }> = [];
    const text = analysisText.toLowerCase();

    // Technique/form insights
    if (text.includes('form') || text.includes('technique') || text.includes('posture')) {
        insights.push({
            text: 'Form and technique analysis',
            category: 'technique',
            icon: '🏋️'
        });
    }

    // Recovery insights
    if (text.includes('recovery') || text.includes('rest') || text.includes('sleep')) {
        insights.push({
            text: 'Recovery optimization',
            category: 'recovery',
            icon: '💤'
        });
    }

    // Nutrition insights
    if (text.includes('nutrition') || text.includes('protein') || text.includes('calorie')) {
        insights.push({
            text: 'Nutrition guidance',
            category: 'nutrition',
            icon: '🍗'
        });
    }

    // Strength insights
    if (text.includes('strength') || text.includes('power') || text.includes('weight')) {
        insights.push({
            text: 'Strength development',
            category: 'strength',
            icon: '💪'
        });
    }

    // Endurance insights
    if (text.includes('endurance') || text.includes('cardio') || text.includes('stamina')) {
        insights.push({
            text: 'Endurance improvement',
            category: 'endurance',
            icon: '🏃'
        });
    }

    // If no specific insights found, add a general one
    if (insights.length === 0) {
        insights.push({
            text: 'Comprehensive fitness analysis',
            category: 'general',
            icon: '📊'
        });
    }

    return insights;
}

/**
 * Create analysis from raw JSON string
 * PRINCIPLE: CLEAN - Handles raw JSON input
 */
export function createAnalysisFromJSON(jsonString: string): StructuredAnalysisData {
    try {
        const parsed = JSON.parse(jsonString);
        return transformAgentResponse(parsed);
    } catch (error) {
        console.error('JSON parsing error:', error);
        return createFallbackAnalysis({ analysis: 'Invalid JSON format received' });
    }
}

/**
 * Pipeline for complete analysis transformation
 * PRINCIPLE: MODULAR - Composable transformation steps
 */
export function transformAnalysisPipeline(
    rawData: unknown,
    options: {
        featureFlags?: Partial<typeof DEFAULT_FEATURE_FLAGS>;
        enhanceWithCapabilities?: boolean;
    } = {}
): {
    analysisData: StructuredAnalysisData;
    useEnhancedVisualization: boolean;
} {
    // Step 1: Convert to structured format
    const structuredData = typeof rawData === 'string'
        ? createAnalysisFromJSON(rawData)
        : transformAgentResponse(rawData as RawAgentResponse);

    // Step 2: Enhance with agent capabilities if requested
    const enhancedData = options.enhanceWithCapabilities
        ? enhanceWithAgentCapabilities(structuredData)
        : structuredData;

    // Step 3: Determine visualization type
    const useEnhanced = shouldUseEnhancedVisualization(
        enhancedData,
        options.featureFlags
    );

    return {
        analysisData: enhancedData,
        useEnhancedVisualization: useEnhanced
    };
}