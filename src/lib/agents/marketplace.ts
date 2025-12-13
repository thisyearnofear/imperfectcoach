/**
 * Agent Marketplace
 * Real agent discovery, ranking, and registration system
 */

interface AgentDiscoveryQuery {
  capability: string;
  maxCost?: number;
  minQuality?: number;
  maxResponseTime?: number;
  preferredNetwork?: string;
}

interface AgentRanking {
  agent: Record<string, unknown>;
  score: number;
  predictedQuality: number;
  costEfficiency: number;
  availability: {
    slots: number;
    nextAvailable: number;
    sla: number;
  };
}

interface RegistrationRequest {
  profile: {
    id: string;
    name: string;
    emoji: string;
    capabilities: string[];
    pricing: Record<string, unknown>;
    endpoint: string;
    description: string;
    location?: string;
    tags?: string[];
  };
  signature: string;
  verificationData: {
    publicKey: string;
    domain: string;
    timestamp: number;
  };
}

interface AgentProfile {
  id: string;
  name: string;
  emoji: string;
  capabilities: string[];
  pricing: Record<string, unknown>;
  reputationScore: number;
  successRate: number;
  location?: string;
  protocol?: string;
  tags?: string[];
  registeredAt?: number;
  verificationLevel?: string;
  status?: string;
  lastHeartbeat?: number;
  currentLoad?: number;
  nextAvailable?: number;
  avgResponseTime?: number;
  hasPremiumVerification?: boolean;
  hasBasicVerification?: boolean;
  serviceAvailability?: Record<string, unknown>;
}

interface VerificationResult {
  valid: boolean;
  level: 'basic' | 'verified' | 'premium';
}

export class AgentMarketplace {
  private reapClient: null;
  private localRegistry: Map<string, AgentProfile> = new Map();

  constructor() {
    // Initialize Reap client (would be real implementation)
    this.reapClient = this.initializeReapClient();
  }

  /**
   * Discover and intelligently rank agents for a capability
   */
  async discoverAndRankAgents(
    capability: string, 
    requirements: AgentDiscoveryQuery
  ): Promise<AgentRanking[]> {
    console.log(`🔍 Discovering agents for ${capability}...`);

    try {
      // Query Reap Protocol for real agents
      const reapAgents = await this.queryReapRegistry(capability);
      
      // Get locally registered agents
      const localAgents = this.getLocalAgents(capability);

      // Combine and rank all candidates
      const allCandidates = [...reapAgents, ...localAgents];
      
      const rankings: AgentRanking[] = allCandidates.map(agent => ({
        agent,
        score: this.calculateAgentScore(agent as AgentProfile, requirements),
        predictedQuality: this.predictServiceQuality(agent as AgentProfile),
        costEfficiency: this.calculateCostEfficiency(agent as AgentProfile, requirements),
        availability: this.getAgentAvailability(agent as AgentProfile)
      }));

      // Sort by composite score (quality + cost efficiency + availability)
      return rankings
        .sort((a, b) => {
          const scoreA = (a.score * 0.4) + (a.costEfficiency * 0.3) + (a.predictedQuality * 0.3);
          const scoreB = (b.score * 0.4) + (b.costEfficiency * 0.3) + (b.predictedQuality * 0.3);
          return scoreB - scoreA;
        });

    } catch (error) {
      console.error("Agent discovery failed:", error);
      // Fallback to local agents only
      return this.rankLocalAgents(capability, requirements);
    }
  }

  /**
   * Register a new dynamic agent with verification
   */
  async registerDynamicAgent(request: RegistrationRequest): Promise<{
    success: boolean;
    agentId: string;
    verificationLevel: 'basic' | 'verified' | 'premium';
    error?: string;
  }> {
    try {
      console.log(`📝 Registering agent: ${request.profile.name}`);

      // Verify agent identity signature
      const verification = await this.verifyAgentIdentity(
        request.profile.id,
        request.signature,
        request.verificationData
      );

      if (!verification.valid) {
        return {
          success: false,
          agentId: request.profile.id,
          verificationLevel: 'basic',
          error: 'Identity verification failed'
        };
      }

      // Create agent profile with verification status
      const agentProfile = {
        ...request.profile,
        registeredAt: Date.now(),
        verificationLevel: verification.level,
        reputationScore: verification.level === 'premium' ? 90 : 
                         verification.level === 'verified' ? 75 : 50,
        status: 'active',
        lastHeartbeat: Date.now(),
        tags: [...(request.profile.tags || []), 'dynamic', verification.level]
      };

      // Register with Reap Protocol if available
      if (this.reapClient) {
        try {
          await this.reapClient.registerAgent(agentProfile);
        } catch (error) {
          console.warn('Reap registration failed, using local registry:', error);
        }
      }

      // Store in local registry
      this.localRegistry.set(request.profile.id, agentProfile);

      console.log(`✅ Agent registered: ${request.profile.name} (${verification.level})`);

      return {
        success: true,
        agentId: request.profile.id,
        verificationLevel: verification.level
      };

    } catch (error) {
      console.error('Agent registration failed:', error);
      return {
        success: false,
        agentId: request.profile.id,
        verificationLevel: 'basic',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get agent's real-time availability and performance metrics
   */
  async getAgentAvailability(agentId: string): Promise<{
    status: 'active' | 'busy' | 'offline';
    responseTime: number;
    successRate: number;
    load: number;
    nextSlot: number;
  }> {
    try {
      // Check local registry first
      const localAgent = this.localRegistry.get(agentId);
      
      if (localAgent) {
        // Check heartbeat
        const lastHeartbeat = localAgent.lastHeartbeat || 0;
        const timeSinceHeartbeat = Date.now() - lastHeartbeat;
        
        let status: 'active' | 'busy' | 'offline' = 'active';
        if (timeSinceHeartbeat > 60000) { // 1 minute timeout
          status = 'offline';
        } else if (localAgent.currentLoad && localAgent.currentLoad > 0.8) {
          status = 'busy';
        }

        return {
          status,
          responseTime: localAgent.avgResponseTime || 2000,
          successRate: localAgent.successRate || 0.95,
          load: localAgent.currentLoad || 0.3,
          nextSlot: localAgent.nextAvailable || Date.now()
        };
      }

      // Query Reap for external agents
      if (this.reapClient) {
        const reapData = await this.reapClient.getAgentMetrics(agentId);
        return {
          status: reapData.status,
          responseTime: reapData.avgResponseTime,
          successRate: reapData.successRate,
          load: reapData.currentLoad,
          nextSlot: reapData.nextSlot
        };
      }

      // Default fallback
      return {
        status: 'active',
        responseTime: 2000,
        successRate: 0.95,
        load: 0.3,
        nextSlot: Date.now()
      };

    } catch (error) {
      console.error(`Availability check failed for ${agentId}:`, error);
      return {
        status: 'offline',
        responseTime: 999999,
        successRate: 0,
        load: 1,
        nextSlot: Date.now() + 3600000
      };
    }
  }

  /**
   * Update agent's availability in real-time
   */
  async updateAgentAvailability(
    agentId: string, 
    availability: {
      currentLoad?: number;
      nextAvailable?: number;
      status?: 'active' | 'busy' | 'offline';
    }
  ): Promise<void> {
    const agent = this.localRegistry.get(agentId);
    if (agent) {
      agent.currentLoad = availability.currentLoad ?? agent.currentLoad;
      agent.nextAvailable = availability.nextAvailable ?? agent.nextAvailable;
      agent.status = availability.status ?? agent.status;
      agent.lastHeartbeat = Date.now();
      
      this.localRegistry.set(agentId, agent);
      
      // Sync to Reap if available
      if (this.reapClient) {
        try {
          await this.reapClient.updateAgentMetrics(agentId, availability);
        } catch (error) {
          console.warn('Failed to sync availability to Reap:', error);
        }
      }
    }
  }

  // Private helper methods

  private initializeReapClient(): any {
    // In production, this would initialize the actual Reap Protocol client
    // For now, return null to use local registry only
    return null;
  }

  private async queryReapRegistry(capability: string): Promise<any[]> {
    try {
      // Mock Reap query - in production would be real API call
      const mockAgents = [
        {
          id: 'reap-biomechanics-001',
          name: 'Reap Biomechanics Pro',
          emoji: '🔬',
          capabilities: ['biomechanics_analysis'],
          pricing: { biomechanics_analysis: { baseFee: '0.06', asset: 'USDC', chain: 'base-sepolia' } },
          reputationScore: 94,
          successRate: 0.96,
          location: 'US-East-1',
          protocol: 'x402',
          tags: ['reap', 'verified', 'biomechanics']
        },
        {
          id: 'reap-nutrition-002',
          name: 'Reap Nutrition Expert',
          emoji: '🥗',
          capabilities: ['nutrition_planning'],
          pricing: { nutrition_planning: { baseFee: '0.04', asset: 'USDC', chain: 'base-sepolia' } },
          reputationScore: 91,
          successRate: 0.93,
          location: 'EU-West-1',
          protocol: 'x402',
          tags: ['reap', 'nutrition']
        }
      ];

      return mockAgents.filter(agent => 
        agent.capabilities.includes(capability)
      );

    } catch (error) {
      console.error('Reap query failed:', error);
      return [];
    }
  }

  private getLocalAgents(capability: string): any[] {
    const agents = Array.from(this.localRegistry.values());
    return agents.filter(agent => 
      agent.capabilities.includes(capability) && agent.status === 'active'
    );
  }

  private rankLocalAgents(capability: string, requirements: AgentDiscoveryQuery): AgentRanking[] {
    const localAgents = this.getLocalAgents(capability);
    
    return localAgents.map(agent => ({
      agent,
      score: this.calculateAgentScore(agent, requirements),
      predictedQuality: this.predictServiceQuality(agent),
      costEfficiency: this.calculateCostEfficiency(agent, requirements),
      availability: this.getAgentAvailability(agent.id)
    }));
  }

  private calculateAgentScore(agent: AgentProfile, requirements: AgentDiscoveryQuery): number {
    let score = 0;

    // Reputation score (40% weight)
    const reputationWeight = 0.4;
    score += (agent.reputationScore || 50) * reputationWeight;

    // Success rate (30% weight)
    const successWeight = 0.3;
    score += ((agent.successRate || 0.8) * 100) * successWeight;

    // Cost factor (20% weight)
    if (requirements.maxCost) {
      const cost = parseFloat(agent.pricing.baseFee || '0.05');
      const costScore = Math.max(0, 100 - (cost / requirements.maxCost * 100));
      score += costScore * 0.2;
    }

    // Location preference (10% weight)
    if (requirements.preferredNetwork && agent.location) {
      // Simple location matching logic
      const locationMatch = agent.location.includes(requirements.preferredNetwork) ? 1 : 0.7;
      score += locationMatch * 10;
    }

    return score;
  }

  private predictServiceQuality(agent: AgentProfile): number {
    // ML-based quality prediction (simplified)
    let quality = agent.reputationScore || 50;
    
    // Boost for verified agents
    if (agent.tags?.includes('verified')) quality += 10;
    if (agent.tags?.includes('premium')) quality += 15;
    
    // Boost for recent activity
    const hoursSinceHeartbeat = (Date.now() - (agent.lastHeartbeat || 0)) / 3600000;
    if (hoursSinceHeartbeat < 1) quality += 5;
    else if (hoursSinceHeartbeat > 24) quality -= 10;
    
    // Boost for protocol features
    if (agent.protocol === 'x402') quality += 5;
    
    return Math.min(100, Math.max(0, quality));
  }

  private calculateCostEfficiency(agent: AgentProfile, requirements: AgentDiscoveryQuery): number {
    if (!requirements.maxCost) return 50;
    
    const cost = parseFloat(agent.pricing.baseFee || '0.05');
    const maxCost = requirements.maxCost;
    
    if (cost > maxCost) return 0;
    
    // Higher efficiency for lower cost within budget
    return ((maxCost - cost) / maxCost) * 100;
  }

  private getAgentAvailability(agent: AgentProfile): { slots: number; nextAvailable: number; sla: number } {
    return {
      slots: agent.serviceAvailability?.basic?.slots || 100,
      nextAvailable: agent.serviceAvailability?.basic?.nextAvailable || Date.now(),
      sla: agent.serviceAvailability?.basic?.responseSLA || 5000
    };
  }

  private async verifyAgentIdentity(
    agentId: string, 
    signature: string, 
    verificationData: { publicKey: string; domain: string; timestamp: number }
  ): Promise<VerificationResult> {
    try {
      // Verify signature is valid for agent's public key
      const isSignatureValid = await this.validateSignature(
        verificationData.publicKey,
        signature,
        verificationData.domain
      );

      if (!isSignatureValid) {
        return { valid: false, level: 'basic' };
      }

      // Determine verification level based on agent metadata
      const agent = this.localRegistry.get(agentId) || {};
      
      if (agent.hasPremiumVerification) {
        return { valid: true, level: 'premium' };
      } else if (agent.hasBasicVerification) {
        return { valid: true, level: 'verified' };
      } else {
        return { valid: true, level: 'basic' };
      }

    } catch (error) {
      console.error('Identity verification failed:', error);
      return { valid: false, level: 'basic' };
    }
  }

  private async validateSignature(publicKey: string, signature: string, domain: string): Promise<boolean> {
    // In production, this would use proper cryptographic verification
    // For now, simple mock validation
    return signature && signature.length > 20;
  }
}