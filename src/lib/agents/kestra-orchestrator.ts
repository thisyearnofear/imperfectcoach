/**
 * Kestra AI Agent Orchestrator
 * Uses Kestra's built-in AI agents to synthesize data from multiple fitness agents
 * into a comprehensive, intelligent analysis
 */

interface KestraConfig {
  apiUrl: string;
  apiKey: string;
  workspaceId: string;
}

interface AgentContributions {
  coach: {
    name: string;
    analysis: string;
    confidence: number;
    recommendations: string[];
  };
  nutrition: {
    name: string;
    analysis: string;
    recommendations: string[];
    mealPlan?: unknown;
  };
  biomechanics: {
    name: string;
    analysis: string;
    findings: string[];
    corrections: string[];
  };
  recovery: {
    name: string;
    analysis: string;
    program: string[];
    metrics: Record<string, unknown>;
  };
  booking?: {
    name: string;
    recommendations: string[];
    availability: Record<string, unknown>;
  };
}

interface SynthesisRequest {
  workoutData: {
    exercise: string;
    reps: number;
    formScore: number;
    duration: number;
    poseData?: unknown;
  };
  contributions: AgentContributions;
  userContext: {
    fitnessLevel: string;
    goals: string[];
    preferences: string[];
  };
}

interface KestraResponse {
  analysis: string;
  recommendations: string[];
  training_plan: {
    immediate: string[];
    weekly: string[];
    monthly: string[];
  };
  key_insights: string[];
  confidence_factors: string[];
}

interface ValidationResult {
  confidence: number;
}

export class KestraOrchestrator {
  private config: KestraConfig;

  constructor(config: KestraConfig) {
    this.config = config;
  }

  async synthesizeComprehensiveAnalysis(request: SynthesisRequest): Promise<{
    primaryAnalysis: string;
    integratedRecommendations: string[];
    priorityActions: string[];
    trainingPlan: Record<string, string[]>;
    confidenceScore: number;
    methodology: string;
  }> {
    try {
      // Step 1: Create Kestra AI agent prompt that synthesizes all agent data
      const synthesisPrompt = this.createSynthesisPrompt(request);
      
      // Step 2: Use Kestra's AI agent for synthesis
      const kestraResponse: KestraResponse = await this.callKestraAI(synthesisPrompt);
      
      // Step 3: Cross-reference and validate insights
      const validation: ValidationResult = await this.crossValidateInsights(kestraResponse, request.contributions);
      
      // Step 4: Generate prioritized action plan
      const actionPlan = await this.generatePriorityActions(kestraResponse, request.userContext);
      
      return {
        primaryAnalysis: kestraResponse.analysis,
        integratedRecommendations: kestraResponse.recommendations,
        priorityActions: actionPlan.priorities,
        trainingPlan: actionPlan.trainingPlan,
        confidenceScore: validation.confidence,
        methodology: "kestra-ai-synthesis"
      };
      
    } catch (error) {
      console.error("Kestra synthesis failed:", error);
      throw new Error("Failed to synthesize agent data via Kestra");
    }
  }

  private createSynthesisPrompt(request: SynthesisRequest): string {
    return `You are an expert fitness analyst AI using data from 5 specialized agents to provide comprehensive analysis.

WORKOUT CONTEXT:
- Exercise: ${request.workoutData.exercise}
- Performance: ${request.workoutData.reps} reps, ${request.workoutData.formScore}% form score
- Duration: ${request.workoutData.duration} seconds
- User Level: ${request.userContext.fitnessLevel}

AGENT CONTRIBUTIONS:

🏋️ COACH AGENT:
${request.contributions.coach.analysis}
Recommendations: ${request.contributions.coach.recommendations.join(', ')}

🥗 NUTRITION AGENT:
${request.contributions.nutrition.analysis}
Recommendations: ${request.contributions.nutrition.recommendations.join(', ')}

💪 BIOMECHANICS AGENT:
Findings: ${request.contributions.biomechanics.findings.join(', ')}
Corrections: ${request.contributions.biomechanics.corrections.join(', ')}

😴 RECOVERY AGENT:
${request.contributions.recovery.analysis}
Program: ${request.contributions.recovery.program.join(', ')}

${request.contributions.booking ? `💆 BOOKING AGENT:
Recommendations: ${request.contributions.booking.recommendations.join(', ')}` : ''}

SYNTHESIS TASK:
1. Integrate all agent insights into a cohesive analysis
2. Identify interconnections between nutrition, form, and recovery
3. Resolve any conflicting recommendations
4. Prioritize actions based on user context and goals
5. Generate a specific, actionable training plan

OUTPUT FORMAT:
{
  "analysis": "Comprehensive integrated analysis (2-3 paragraphs)",
  "recommendations": ["Priority recommendation 1", "Priority recommendation 2", ...],
  "training_plan": {
    "immediate": ["Today/tomorrow actions"],
    "weekly": ["This week's focus"],
    "monthly": ["Long-term development"]
  },
  "key_insights": ["Major insight 1", "Major insight 2", ...],
  "confidence_factors": ["Why this analysis is reliable"]
}

User Goals: ${request.userContext.goals.join(', ')}
User Preferences: ${request.userContext.preferences.join(', ')}`;
  }

  private async callKestraAI(prompt: string): Promise<KestraResponse> {
    // Using Kestra's AI agent API
    const response = await fetch(`${this.config.apiUrl}/api/v1/executions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'X-Kestra-Namespace': 'fitness-analysis'
      },
      body: JSON.stringify({
        flowId: 'ai-synthesis',
        inputs: {
          prompt: prompt,
          model: 'claude-3-sonnet',
          temperature: 0.3,
          maxTokens: 2048
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Kestra API error: ${response.statusText}`);
    }

    const execution = await response.json() as { id: string };
    
    // Wait for execution to complete (Kestra is async)
    return await this.waitForCompletion(execution.id);
  }

  private async waitForCompletion(executionId: string, timeout = 30000): Promise<KestraResponse> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const response = await fetch(`${this.config.apiUrl}/api/v1/executions/${executionId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });
      
      if (response.ok) {
        const execution = await response.json() as { 
          state: string; 
          outputs?: Array<{ name: string; value: string }>; 
          error?: string; 
        };
        
        if (execution.state === 'SUCCESS') {
          // Extract outputs from the execution
          const resultOutput = execution.outputs?.find((o) => o.name === 'result');
          return JSON.parse(resultOutput?.value || '{}') as KestraResponse;
        } else if (execution.state === 'FAILED') {
          throw new Error(`Kestra execution failed: ${execution.error}`);
        }
      }
      
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Kestra execution timeout');
  }

  private async crossValidateInsights(synthesis: KestraResponse, contributions: AgentContributions): Promise<ValidationResult> {
    // Validate that synthesis addresses all agent contributions
    let coveredPoints = 0;
    let totalPoints = 0;

    // Check nutrition recommendations are addressed
    if (synthesis.analysis.toLowerCase().includes('nutrition') || 
        synthesis.recommendations.some((r: string) => r.toLowerCase().includes('nutrition'))) {
      coveredPoints++;
    }
    totalPoints++;

    // Check biomechanics findings are addressed
    if (synthesis.analysis.toLowerCase().includes('form') || 
        synthesis.analysis.toLowerCase().includes('technique')) {
      coveredPoints++;
    }
    totalPoints++;

    // Check recovery recommendations
    if (synthesis.analysis.toLowerCase().includes('recovery') || 
        synthesis.analysis.toLowerCase().includes('rest')) {
      coveredPoints++;
    }
    totalPoints++;

    const coverageRatio = coveredPoints / totalPoints;
    const confidence = Math.min(95, 70 + (coverageRatio * 25)); // Base 70%, up to 95%

    return { confidence };
  }

  private async generatePriorityActions(synthesis: KestraResponse, userContext: SynthesisRequest['userContext']): Promise<Record<string, unknown>> {
    // Analyze synthesis to create prioritized action plan
    const immediate = synthesis.training_plan?.immediate || [];
    const weekly = synthesis.training_plan?.weekly || [];
    const monthly = synthesis.training_plan?.monthly || [];

    // Adjust based on user goals and fitness level
    const adjustedActions = this.adjustActionsForContext(immediate, weekly, monthly, userContext);

    return {
      priorities: this.prioritizeActions(adjustedActions.immediate, userContext),
      trainingPlan: adjustedActions
    };
  }

  private adjustActionsForContext(
    immediate: string[], 
    weekly: string[], 
    monthly: string[], 
    context: SynthesisRequest['userContext']
  ): Record<string, string[]> {
    // Adjust recommendations based on user's fitness level and goals
    const adjusted = { immediate, weekly, monthly };

    if (context.fitnessLevel === 'beginner') {
      // Simplify complex recommendations
      adjusted.immediate = immediate.map((action: string) => {
        if (action.toLowerCase().includes('advanced')) {
          return action.replace(/advanced/gi, 'fundamental');
        }
        return action;
      });
    }

    if (context.goals.includes('weight_loss')) {
      // Emphasize calorie burn and nutrition
      adjusted.immediate.push('Focus on compound movements for maximum calorie burn');
      adjusted.weekly.push('Track caloric intake and protein consumption');
    }

    if (context.goals.includes('strength')) {
      // Emphasize progressive overload
      adjusted.immediate.push('Focus on compound lifts with proper progressive overload');
      adjusted.weekly.push('Increase weight by 2.5-5% each week for primary lifts');
    }

    return adjusted;
  }

  private prioritizeActions(actions: string[], context: SynthesisRequest['userContext']): string[] {
    // Rank actions by importance for user's goals
    const priorities = actions.map((action, index) => ({
      action,
      index,
      priority: this.calculateActionPriority(action, context)
    }));

    return priorities
      .sort((a, b) => b.priority - a.priority)
      .map(p => p.action);
  }

  private calculateActionPriority(action: string, context: SynthesisRequest['userContext']): number {
    let priority = 50; // Base priority

    // Boost priority for goal-relevant actions
    if (context.goals.some((goal: string) => action.toLowerCase().includes(goal))) {
      priority += 30;
    }

    // Boost priority for safety/form-related actions
    if (action.toLowerCase().includes('form') || action.toLowerCase().includes('technique')) {
      priority += 20;
    }

    // Boost priority for recovery-related actions
    if (action.toLowerCase().includes('recovery') || action.toLowerCase().includes('rest')) {
      priority += 15;
    }

    return priority;
  }
}