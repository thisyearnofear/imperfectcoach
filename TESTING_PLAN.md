# Agent Economy Integration Testing Plan

## Overview
This testing plan ensures the safe integration of Kestra AI orchestration and Oumi model enhancements into the Imperfect Coach agent economy.

## Test Categories

### 1. Unit Tests (Already Created)
- ✅ Integration layer configuration
- ✅ Service access control
- ✅ Health check functionality
- ✅ Fallback behavior

### 2. Integration Tests (To Be Created)

#### A. Agent Marketplace Integration
```bash
# Test file: src/lib/agents/marketplace.test.ts
```

**Test Cases:**
- ✅ Discover available agents with different filters
- ✅ Agent ranking and selection logic
- ✅ Error handling for unavailable agents
- ✅ Performance with large agent pools

#### B. Kestra Orchestrator Integration
```bash
# Test file: src/lib/agents/kestra-orchestrator.test.ts
```

**Test Cases:**
- ✅ Synthesis prompt generation
- ✅ API communication and error handling
- ✅ Response parsing and validation
- ✅ Cross-validation logic
- ✅ Timeout and retry behavior

#### C. Oumi Model Integration
```bash
# Test file: src/lib/agents/oumi-integration.test.ts
```

**Test Cases:**
- ✅ Model training data preparation
- ✅ API communication patterns
- ✅ Enhancement prompt generation
- ✅ Confidence calculation
- ✅ Error recovery

### 3. End-to-End Tests

#### A. Full Analysis Flow
```typescript
// Test the complete analysis pipeline
async function testFullAnalysisFlow() {
  const integration = new AgentEconomyIntegration({
    enableKestra: true,
    enableOumi: true
  });

  const request = {
    workoutData: {
      exercise: 'squat',
      reps: 10,
      formScore: 85,
      duration: 60
    },
    userContext: {
      fitnessLevel: 'intermediate',
      goals: ['strength'],
      preferences: []
    }
  };

  const result = await integration.executeAnalysis(request);
  
  // Verify result structure
  expect(result).toHaveProperty('analysis');
  expect(result).toHaveProperty('confidence');
  expect(result.confidence).toBeGreaterThan(0.7);
}
```

#### B. Fallback Scenarios
```typescript
// Test graceful degradation
async function testFallbackScenarios() {
  // Test 1: Kestra available, Oumi unavailable
  // Test 2: Both unavailable, fallback to legacy
  // Test 3: Partial failure during execution
  // Test 4: Network errors and retries
}
```

### 4. Performance Tests

#### A. Response Time Benchmarks
```bash
# Target: < 2000ms for full analysis
# Test with different workloads:
- Small workout (5 reps)
- Medium workout (20 reps)
- Large workout (50 reps)
```

#### B. Memory Usage
```bash
# Monitor memory usage during:
- Agent discovery
- Parallel execution
- Synthesis phase
- Model enhancement
```

### 5. Security Tests

#### A. API Key Protection
- ✅ Ensure API keys are not logged
- ✅ Verify keys are not exposed in error messages
- ✅ Test key rotation scenarios

#### B. Input Validation
- ✅ Test with malformed workout data
- ✅ Test with oversized payloads
- ✅ Test with special characters and injection attempts

### 6. Configuration Tests

#### A. Feature Flag Testing
```bash
# Test all combinations:
- Kestra only
- Oumi only  
- Both enabled
- Both disabled
- Marketplace variations
```

#### B. Environment Variable Testing
```bash
# Test with:
- Missing variables (should fail gracefully)
- Invalid variables (should validate)
- Different workspace IDs
```

## Test Execution Plan

### Phase 1: Unit Tests (Current)
- ✅ Create basic unit tests for integration layer
- ✅ Verify configuration logic
- ✅ Test error handling

### Phase 2: Integration Tests (Next)
- Create marketplace integration tests
- Create Kestra orchestrator tests
- Create Oumi model tests

### Phase 3: End-to-End Tests
- Test complete analysis flow
- Test fallback scenarios
- Test error recovery

### Phase 4: Performance & Security
- Benchmark response times
- Test memory usage
- Verify security controls

## Test Execution Commands

```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Run all tests
npm test
```

## Success Criteria

1. **Unit Tests**: 100% pass rate
2. **Integration Tests**: 95%+ pass rate
3. **End-to-End Tests**: 90%+ pass rate
4. **Performance**: < 2000ms average response time
5. **Memory**: < 100MB peak usage
6. **Reliability**: < 1% error rate in production simulation

## Rollback Plan

If tests fail:
1. Disable feature flags in `.env`
2. Revert to legacy agent system
3. Analyze failure patterns
4. Fix and retest

```bash
# Emergency rollback
ENABLE_KESTRA_ORCHESTRATION=false
ENABLE_OUMI_ENHANCEMENTS=false
```

## Monitoring Plan

Post-deployment monitoring:
- Response time metrics
- Error rate tracking
- Agent availability monitoring
- Payment success rates
- User satisfaction metrics

## Documentation Updates Required

1. ✅ Update `.env.example` with new variables
2. ✅ Add integration guide
3. ✅ Update architecture documentation
4. ✅ Create deployment checklist
5. ✅ Add troubleshooting guide

## Next Steps

1. ✅ Create integration layer (DONE)
2. ✅ Add basic unit tests (DONE)
3. ⏳ Create integration tests
4. ⏳ Set up test environment
5. ⏳ Run initial test suite
6. ⏳ Analyze results and fix issues
7. ⏳ Gradual rollout to production
