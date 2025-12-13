/**
 * Integration Layer Tests
 * Basic tests for the agent economy integration layer
 */

import { AgentEconomyIntegration } from './integration-layer';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

describe('AgentEconomyIntegration', () => {
  let integration: AgentEconomyIntegration;

  beforeEach(() => {
    // Reset environment variables
    process.env.ENABLE_KESTRA_ORCHESTRATION = 'false';
    process.env.ENABLE_OUMI_ENHANCEMENTS = 'false';
    process.env.ENABLE_REAL_X402_PAYMENTS = 'false';
    
    integration = new AgentEconomyIntegration();
  });

  describe('Configuration', () => {
    it('should use default configuration when no options provided', () => {
      expect(integration['config'].enableKestra).toBe(false);
      expect(integration['config'].enableOumi).toBe(false);
      expect(integration['config'].enableRealPayments).toBe(false);
      expect(integration['config'].enableMarketplace).toBe(true);
      expect(integration['config'].fallbackToLegacy).toBe(true);
    });

    it('should override defaults with provided configuration', () => {
      const customIntegration = new AgentEconomyIntegration({
        enableKestra: true,
        enableOumi: true,
        fallbackToLegacy: false
      });
      
      expect(customIntegration['config'].enableKestra).toBe(true);
      expect(customIntegration['config'].enableOumi).toBe(true);
      expect(customIntegration['config'].fallbackToLegacy).toBe(false);
    });

    it('should read configuration from environment variables', () => {
      process.env.ENABLE_KESTRA_ORCHESTRATION = 'true';
      process.env.ENABLE_OUMI_ENHANCEMENTS = 'true';
      
      const envIntegration = new AgentEconomyIntegration();
      
      expect(envIntegration['config'].enableKestra).toBe(true);
      expect(envIntegration['config'].enableOumi).toBe(true);
    });
  });

  describe('Service Access', () => {
    it('should throw error when accessing disabled Kestra orchestrator', async () => {
      await expect(integration.getKestraOrchestrator())
        .rejects
        .toThrow('Kestra orchestrator is disabled');
    });

    it('should throw error when accessing disabled Oumi models', async () => {
      await expect(integration.getOumiModels())
        .rejects
        .toThrow('Oumi models are disabled');
    });

    it('should allow access to marketplace by default', async () => {
      // This should not throw
      await expect(integration.getAgentMarketplace()).resolves.not.toThrow();
    });

    it('should throw error when marketplace is disabled', async () => {
      const noMarketplace = new AgentEconomyIntegration({
        enableMarketplace: false
      });
      
      await expect(noMarketplace.getAgentMarketplace())
        .rejects
        .toThrow('Agent marketplace is disabled');
    });
  });

  describe('Health Checks', () => {
    it('should return health status with recommendations', async () => {
      // Mock fetch for marketplace check
      global.fetch = vi.fn(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        })
      ) as Mock;

      const health = await integration.checkSystemHealth();
      
      expect(health).toHaveProperty('marketplaceAvailable');
      expect(health).toHaveProperty('kestraAvailable');
      expect(health).toHaveProperty('oumiAvailable');
      expect(health).toHaveProperty('paymentsAvailable');
      expect(health).toHaveProperty('recommendations');
      expect(Array.isArray(health.recommendations)).toBe(true);
    });

    it('should handle failed health checks gracefully', async () => {
      // Mock failed fetch
      global.fetch = vi.fn(() => 
        Promise.reject(new Error('Network error'))
      ) as Mock;

      const health = await integration.checkSystemHealth();
      
      // Should not throw, just return false for availability
      expect(health.marketplaceAvailable).toBe(false);
      expect(health.kestraAvailable).toBe(false);
      expect(health.oumiAvailable).toBe(false);
    });
  });

  describe('Fallback Behavior', () => {
    it('should execute legacy analysis when fallback is enabled', async () => {
      // Mock the legacy analysis
      vi.mock('./core-agents', () => ({
        analyzeWorkout: vi.fn(() => Promise.resolve({ 
          analysis: 'legacy analysis',
          method: 'legacy'
        }))
      }));

      const result = await integration.executeLegacyAnalysis({});
      
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('method');
    });

    it('should use fallback when enhanced system fails and fallback is enabled', async () => {
      // Mock failed enhanced analysis
      vi.spyOn(integration, 'checkSystemHealth').mockResolvedValue({
        kestraAvailable: false,
        oumiAvailable: false,
        marketplaceAvailable: false,
        paymentsAvailable: false,
        recommendations: ['Use fallback']
      });

      // Mock legacy analysis
      vi.spyOn(integration, 'executeLegacyAnalysis').mockResolvedValue({
        analysis: 'fallback analysis',
        method: 'legacy-fallback'
      });

      const result = await integration.executeAnalysis({});
      
      expect(result).toHaveProperty('analysis');
      expect(result.analysis).toBe('fallback analysis');
    });

    it('should throw error when enhanced system fails and fallback is disabled', async () => {
      const noFallback = new AgentEconomyIntegration({
        fallbackToLegacy: false
      });

      // Mock failed enhanced analysis
      vi.spyOn(noFallback, 'checkSystemHealth').mockResolvedValue({
        kestraAvailable: false,
        oumiAvailable: false,
        marketplaceAvailable: false,
        paymentsAvailable: false,
        recommendations: []
      });

      await expect(noFallback.executeAnalysis({}))
        .rejects
        .toThrow('Enhanced analysis failed');
    });
  });
});