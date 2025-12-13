/**
 * Quick Start Integration Example
 * How to use the new enhanced agent system in your existing components
 */

import { KestraOrchestrator } from '@/lib/agents/kestra-orchestrator';
import { EnhancedAgentOrchestrator } from '@/lib/agents/enhanced-orchestrator';

// Option 1: Quick Kestra Enhancement (Drop-in replacement)
export async function enhancedFiveAgentAnalysis(workoutData: any, userContext: any) {
  const kestra = new KestraOrchestrator({
    apiUrl: process.env.KESTRA_API_URL!,
    apiKey: process.env.KESTRA_API_KEY!,
    workspaceId: process.env.KESTRA_WORKSPACE_ID!
  });

  // Get your existing 5 agent contributions
  const agentContributions = {
    coach: { name: 'Coach', analysis: 'Your existing coach analysis...', recommendations: [] },
    nutrition: { name: 'Nutrition', analysis: 'Your existing nutrition analysis...', recommendations: [] },
    biomechanics: { name: 'Biomechanics', analysis: 'Your existing biomechanics analysis...', findings: [], corrections: [] },
    recovery: { name: 'Recovery', analysis: 'Your existing recovery analysis...', program: [], metrics: {} },
    booking: { name: 'Booking', recommendations: ['Your existing booking recommendations...'], availability: {} }
  };

  // Use Kestra to synthesize into comprehensive analysis
  const synthesis = await kestra.synthesizeComprehensiveAnalysis({
    workoutData,
    contributions: agentContributions,
    userContext
  });

  return {
    primaryAnalysis: synthesis.primaryAnalysis,
    integratedRecommendations: synthesis.integratedRecommendations,
    priorityActions: synthesis.priorityActions,
    confidenceScore: synthesis.confidenceScore,
    methodology: "kestra-ai-synthesis"
  };
}

// Option 2: Full Enhanced Orchestrator (Complete upgrade)
export async function executeEnhancedAgentAnalysis(workoutData: any, userContext: any) {
  const orchestrator = new EnhancedAgentOrchestrator();

  const result = await orchestrator.executeEnhancedAnalysis({
    workoutData,
    userContext: {
      fitnessLevel: 'intermediate',
      goals: ['strength', 'endurance'],
      preferences: ['compound_movements'],
      constraints: ['time_limited']
    },
    tier: 'premium',
    maxBudget: '0.25',
    preferredNetwork: 'base-sepolia'
  });

  return result;
}

// Option 3: Hybrid approach - Keep existing + add Kestra synthesis
export function enhancedAgentCoachUpsell(workoutData: any) {
  // Your existing agent coach upsell component...
  
  const handleEnhancedAnalysis = async () => {
    try {
      // Get existing analysis from your current system
      const existingAnalysis = await getCurrentAgentAnalysis(workoutData);
      
      // Enhance with Kestra synthesis
      const enhanced = await enhancedFiveAgentAnalysis(workoutData, {
        fitnessLevel: workoutData.fitnessLevel || 'intermediate',
        goals: workoutData.goals || ['general_fitness'],
        preferences: workoutData.preferences || []
      });
      
      setAgentAnalysis({
        ...existingAnalysis,
        enhancedSynthesis: enhanced,
        qualityBoost: 'kestra-ai'
      });
      
    } catch (error) {
      console.error('Enhanced analysis failed, falling back to original:', error);
      // Fall back to your existing analysis
    }
  };

  return { handleEnhancedAnalysis };
}

// Environment Variables to Add
/*
KESTRA_API_URL=https://api.kestra.io
KESTRA_API_KEY=your_kestra_api_key
KESTRA_WORKSPACE_ID=your_workspace_id

OUMI_API_KEY=your_oumi_api_key  
OUMI_WORKSPACE_ID=your_oumi_workspace_id

PAYOU_API_KEY=your_payai_api_key
FACILITATOR_ADDRESS=your_facilitator_address
*/