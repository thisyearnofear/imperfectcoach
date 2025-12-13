/**
 * Agent Economy Integration Layer
 * Provides safe, configurable access to enhanced agent capabilities
 */

import { EnhancedAgentOrchestrator } from './enhanced-orchestrator';
import { KestraOrchestrator } from './kestra-orchestrator';
import { OumiFitnessModels } from './oumi-integration';
import { RealX402Settlement } from './real-payments';
import { AgentMarketplace } from './marketplace';

// Configuration interface
interface AgentEconomyConfig {
  enableKestra: boolean;
  enableOumi: boolean;
  enableRealPayments: boolean;
  enableMarketplace: boolean;
  fallbackToLegacy: boolean;
}

// Default configuration (safe defaults)
const DEFAULT_CONFIG: AgentEconomyConfig = {
  enableKestra: process.env.ENABLE_KESTRA_ORCHESTRATION === 'true',
  enableOumi: process.env.ENABLE_OUMI_ENHANCEMENTS === 'true',
  enableRealPayments: process.env.ENABLE_REAL_X402_PAYMENTS === 'true',
  enableMarketplace: true, // Marketplace is safer to enable
  fallbackToLegacy: true
};

// Singleton instances with lazy initialization
let enhancedOrchestrator: EnhancedAgentOrchestrator | null = null;
let kestraOrchestrator: KestraOrchestrator | null = null;
let oumiModels: OumiFitnessModels | null = null;
let realPayments: RealX402Settlement | null = null;
let agentMarketplace: AgentMarketplace | null = null;

export class AgentEconomyIntegration {
  private config: AgentEconomyConfig;

  constructor(config: Partial<AgentEconomyConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Safe access to enhanced orchestrator
  async getEnhancedOrchestrator(): Promise<EnhancedAgentOrchestrator> {
    if (!this.config.enableKestra || !this.config.enableOumi) {
      throw new Error('Enhanced orchestrator requires both Kestra and Oumi to be enabled');
    }

    if (!enhancedOrchestrator) {
      enhancedOrchestrator = new EnhancedAgentOrchestrator();
    }
    return enhancedOrchestrator;
  }

  // Safe access to Kestra orchestrator
  async getKestraOrchestrator(): Promise<KestraOrchestrator> {
    if (!this.config.enableKestra) {
      throw new Error('Kestra orchestrator is disabled');
    }

    if (!kestraOrchestrator) {
      if (!process.env.KESTRA_API_URL || !process.env.KESTRA_API_KEY) {
        throw new Error('Kestra configuration missing');
      }

      kestraOrchestrator = new KestraOrchestrator({
        apiUrl: process.env.KESTRA_API_URL,
        apiKey: process.env.KESTRA_API_KEY,
        workspaceId: process.env.KESTRA_WORKSPACE_ID || 'default'
      });
    }
    return kestraOrchestrator;
  }

  // Safe access to Oumi models
  async getOumiModels(): Promise<OumiFitnessModels> {
    if (!this.config.enableOumi) {
      throw new Error('Oumi models are disabled');
    }

    if (!oumiModels) {
      if (!process.env.OUMI_API_KEY) {
        throw new Error('Oumi API key missing');
      }

      oumiModels = new OumiFitnessModels(
        process.env.OUMI_API_KEY,
        process.env.OUMI_WORKSPACE_ID || 'default'
      );
    }
    return oumiModels;
  }

  // Safe access to marketplace (generally safer)
  async getAgentMarketplace(): Promise<AgentMarketplace> {
    if (!this.config.enableMarketplace) {
      throw new Error('Agent marketplace is disabled');
    }

    if (!agentMarketplace) {
      agentMarketplace = new AgentMarketplace();
    }
    return agentMarketplace;
  }

  // Safe access to real payments
  async getRealPayments(): Promise<RealX402Settlement> {
    if (!this.config.enableRealPayments) {
      throw new Error('Real payments are disabled');
    }

    if (!realPayments) {
      realPayments = new RealX402Settlement();
    }
    return realPayments;
  }

  // Health check for the entire system
  async checkSystemHealth(): Promise<{
    kestraAvailable: boolean;
    oumiAvailable: boolean;
    marketplaceAvailable: boolean;
    paymentsAvailable: boolean;
    recommendations: string[];
  }> {
    const result = {
      kestraAvailable: false,
      oumiAvailable: false,
      marketplaceAvailable: false,
      paymentsAvailable: false,
      recommendations: [] as string[]
    };

    // Check marketplace (safest)
    try {
      const marketplace = await this.getAgentMarketplace();
      const agents = await marketplace.discoverAvailableAgents({});
      result.marketplaceAvailable = agents.length > 0;
    } catch (error) {
      console.warn('Marketplace health check failed:', error);
    }

    // Check Kestra if enabled
    if (this.config.enableKestra) {
      try {
        const kestra = await this.getKestraOrchestrator();
        // Simple ping test
        const response = await fetch(`${process.env.KESTRA_API_URL}/api/v1/health`, {
          headers: {
            'Authorization': `Bearer ${process.env.KESTRA_API_KEY}`
          }
        });
        result.kestraAvailable = response.ok;
      } catch (error) {
        console.warn('Kestra health check failed:', error);
        result.recommendations.push('Check Kestra API configuration and network connectivity');
      }
    }

    // Check Oumi if enabled
    if (this.config.enableOumi) {
      try {
        const oumi = await this.getOumiModels();
        // Simple model list test
        const response = await fetch(`${oumi['baseUrl']}/models`, {
          headers: {
            'Authorization': `Bearer ${process.env.OUMI_API_KEY}`
          }
        });
        result.oumiAvailable = response.ok;
      } catch (error) {
        console.warn('Oumi health check failed:', error);
        result.recommendations.push('Check Oumi API configuration and credentials');
      }
    }

    return result;
  }

  // Fallback to legacy system
  async executeLegacyAnalysis(request: any): Promise<any> {
    console.log('🔄 Falling back to legacy agent system');
    // Import and use the existing agent system
    const { analyzeWorkout } = await import('./core-agents');
    return analyzeWorkout(request);
  }

  // Main execution method with fallback
  async executeAnalysis(request: any): Promise<any> {
    try {
      // Check if enhanced system is available and enabled
      const health = await this.checkSystemHealth();
      
      if (health.kestraAvailable && health.oumiAvailable && this.config.enableKestra && this.config.enableOumi) {
        const orchestrator = await this.getEnhancedOrchestrator();
        return await orchestrator.executeEnhancedAnalysis(request);
      } else {
        console.log('⚠️ Enhanced system not fully available, using marketplace + Kestra fallback');
        
        if (health.kestraAvailable && this.config.enableKestra) {
          // Use Kestra-only fallback
          const kestra = await this.getKestraOrchestrator();
          const marketplace = await this.getAgentMarketplace();
          
          // Get agents from marketplace
          const agents = await marketplace.discoverAvailableAgents({});
          
          // Simple synthesis with available agents
          return {
            analysis: 'Fallback analysis using available agents',
            agentsUsed: agents.map(a => a.name),
            method: 'kestra-fallback'
          };
        }
      }
    } catch (error) {
      console.error('Enhanced analysis failed:', error);
      
      if (this.config.fallbackToLegacy) {
        return this.executeLegacyAnalysis(request);
      } else {
        throw error;
      }
    }
  }
}

// Singleton instance for easy access
export const agentEconomy = new AgentEconomyIntegration();