# Environment Setup Guide for Enhanced Agent Economy

## Quick Start

```bash
# Copy the example file
cp .env.example .env.local

# Install dependencies
npm install

# Start development server
npm run dev
```

## Feature Flags Configuration

### Basic Setup (Recommended for Development)
```env
# Enable enhanced features
ENABLE_KESTRA_ORCHESTRATION=true
ENABLE_OUMI_ENHANCEMENTS=true
ENABLE_AGENT_MARKETPLACE=true

# Disable real payments during development
ENABLE_REAL_X402_PAYMENTS=false

# Enable fallback for safety
FALLBACK_TO_LEGACY=true
```

### Production Setup
```env
# Enable all features
ENABLE_KESTRA_ORCHESTRATION=true
ENABLE_OUMI_ENHANCEMENTS=true
ENABLE_AGENT_MARKETPLACE=true

# Enable real payments (after thorough testing)
ENABLE_REAL_X402_PAYMENTS=true

# Keep fallback enabled for reliability
FALLBACK_TO_LEGACY=true
```

### Minimal Setup (Legacy Mode)
```env
# Disable enhanced features
ENABLE_KESTRA_ORCHESTRATION=false
ENABLE_OUMI_ENHANCEMENTS=false
ENABLE_AGENT_MARKETPLACE=false
ENABLE_REAL_X402_PAYMENTS=false

# Fallback will be used automatically
FALLBACK_TO_LEGACY=true
```

## Service Configuration

### Kestra AI Orchestration

**Required when `ENABLE_KESTRA_ORCHESTRATION=true`**

```env
# Your Kestra instance URL
KESTRA_API_URL=https://your-kestra-instance.com

# API key with proper permissions
KESTRA_API_KEY=your_kestra_api_key_here

# Workspace ID for fitness analysis
KESTRA_WORKSPACE_ID=fitness-analysis-workspace
```

**How to get Kestra credentials:**
1. Deploy Kestra instance (Docker, Kubernetes, or cloud)
2. Create a workspace for fitness analysis
3. Generate API key with execution permissions
4. Configure AI synthesis flow in Kestra

### Oumi Model Training

**Required when `ENABLE_OUMI_ENHANCEMENTS=true`**

```env
# Your Oumi API key
OUMI_API_KEY=your_oumi_api_key_here

# Workspace ID for fitness models
OUMI_WORKSPACE_ID=fitness-models-workspace
```

**How to get Oumi credentials:**
1. Sign up at https://oumi.ai
2. Create a workspace for fitness models
3. Generate API key
4. Set up base models (CLIP, Llama, Mixtral)

## Deployment Scenarios

### Scenario 1: Full Enhanced Features (Recommended)
```env
ENABLE_KESTRA_ORCHESTRATION=true
ENABLE_OUMI_ENHANCEMENTS=true
ENABLE_AGENT_MARKETPLACE=true
ENABLE_REAL_X402_PAYMENTS=false  # Start with simulation
FALLBACK_TO_LEGACY=true

KESTRA_API_URL=https://kestra.yourdomain.com
KESTRA_API_KEY=your_key
KESTRA_WORKSPACE_ID=fitness

OUMI_API_KEY=your_key
OUMI_WORKSPACE_ID=fitness-models
```

### Scenario 2: Kestra Only (Synthesis without Custom Models)
```env
ENABLE_KESTRA_ORCHESTRATION=true
ENABLE_OUMI_ENHANCEMENTS=false
ENABLE_AGENT_MARKETPLACE=true
ENABLE_REAL_X402_PAYMENTS=false
FALLBACK_TO_LEGACY=true

KESTRA_API_URL=https://kestra.yourdomain.com
KESTRA_API_KEY=your_key
KESTRA_WORKSPACE_ID=fitness
```

### Scenario 3: Marketplace Only (Agent Discovery without Synthesis)
```env
ENABLE_KESTRA_ORCHESTRATION=false
ENABLE_OUMI_ENHANCEMENTS=false
ENABLE_AGENT_MARKETPLACE=true
ENABLE_REAL_X402_PAYMENTS=false
FALLBACK_TO_LEGACY=true
```

### Scenario 4: Testing and Development
```env
ENABLE_KESTRA_ORCHESTRATION=true
ENABLE_OUMI_ENHANCEMENTS=true
ENABLE_AGENT_MARKETPLACE=true
ENABLE_REAL_X402_PAYMENTS=false  # Use simulation
FALLBACK_TO_LEGACY=true

# Use mock URLs for development
KESTRA_API_URL=https://mock-kestra.api
KESTRA_API_KEY=mock-key
KESTRA_WORKSPACE_ID=test

OUMI_API_KEY=mock-key
OUMI_WORKSPACE_ID=test
```

## Troubleshooting

### Common Issues

**Issue: Enhanced features not working**
```bash
# Check if feature flags are enabled
console.log(process.env.ENABLE_KESTRA_ORCHESTRATION)

# Verify API keys are set
console.log(process.env.KESTRA_API_KEY)
```

**Issue: Health checks failing**
```bash
# Test Kestra connection
curl -H "Authorization: Bearer YOUR_KEY" https://your-kestra-url/api/v1/health

# Test Oumi connection  
curl -H "Authorization: Bearer YOUR_KEY" https://api.oumi.ai/models
```

**Issue: Fallback not working**
```bash
# Ensure fallback is enabled
FALLBACK_TO_LEGACY=true

# Check that legacy agents are available
console.log(AGENT_PROFILES)
```

## Security Best Practices

1. **Never commit `.env.local` to git**
2. **Use different keys for development and production**
3. **Rotate API keys regularly**
4. **Restrict API key permissions**
5. **Use environment-specific configuration**

## Monitoring

Add these to your monitoring dashboard:

```javascript
// Track feature usage
analytics.track('EnhancedAnalysisUsed', {
    kestraEnabled: process.env.ENABLE_KESTRA_ORCHESTRATION,
    oumiEnabled: process.env.ENABLE_OUMI_ENHANCEMENTS,
    fallbackUsed: !canUseEnhancedCoordination()
});

// Monitor health checks
const health = await checkEnhancedSystemHealth();
analytics.track('SystemHealth', health);
```

## Gradual Rollout Strategy

1. **Phase 1: Marketplace Only**
   - Test agent discovery without synthesis
   - Monitor performance and reliability

2. **Phase 2: Kestra Synthesis**
   - Enable AI-powered analysis synthesis
   - Monitor confidence scores and quality

3. **Phase 3: Oumi Enhancements**
   - Enable custom model enhancements
   - Monitor confidence boost metrics

4. **Phase 4: Real Payments**
   - Enable blockchain payments
   - Monitor transaction success rates

## Configuration Validation

```javascript
// Validate configuration on startup
function validateConfiguration() {
    if (process.env.ENABLE_KESTRA_ORCHESTRATION === 'true') {
        if (!process.env.KESTRA_API_URL) {
            console.warn('⚠️ Kestra URL missing');
        }
        if (!process.env.KESTRA_API_KEY) {
            console.warn('⚠️ Kestra API key missing');
        }
    }

    if (process.env.ENABLE_OUMI_ENHANCEMENTS === 'true') {
        if (!process.env.OUMI_API_KEY) {
            console.warn('⚠️ Oumi API key missing');
        }
    }
}

validateConfiguration();
```

## Environment-Specific Configuration

### Development (`.env.development`)
```env
ENABLE_KESTRA_ORCHESTRATION=true
ENABLE_OUMI_ENHANCEMENTS=true
ENABLE_REAL_X402_PAYMENTS=false
FALLBACK_TO_LEGACY=true

# Mock services for development
KESTRA_API_URL=https://mock-kestra.api
OUMI_API_KEY=mock-key-development
```

### Staging (`.env.staging`)
```env
ENABLE_KESTRA_ORCHESTRATION=true
ENABLE_OUMI_ENHANCEMENTS=true
ENABLE_REAL_X402_PAYMENTS=false
FALLBACK_TO_LEGACY=true

# Real services but with test data
KESTRA_API_URL=https://staging-kestra.yourdomain.com
KESTRA_API_KEY=staging-key
OUMI_API_KEY=staging-key
```

### Production (`.env.production`)
```env
ENABLE_KESTRA_ORCHESTRATION=true
ENABLE_OUMI_ENHANCEMENTS=true
ENABLE_REAL_X402_PAYMENTS=true
FALLBACK_TO_LEGACY=true

# Production services
KESTRA_API_URL=https://kestra.yourdomain.com
KESTRA_API_KEY=production-key
OUMI_API_KEY=production-key
```

## Quick Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ENABLE_KESTRA_ORCHESTRATION` | No | `true` | Enable Kestra AI synthesis |
| `ENABLE_OUMI_ENHANCEMENTS` | No | `true` | Enable Oumi model enhancements |
| `ENABLE_REAL_X402_PAYMENTS` | No | `false` | Enable real blockchain payments |
| `ENABLE_AGENT_MARKETPLACE` | No | `true` | Enable dynamic agent discovery |
| `FALLBACK_TO_LEGACY` | No | `true` | Fallback to legacy system on errors |
| `KESTRA_API_URL` | If Kestra enabled | - | Kestra instance URL |
| `KESTRA_API_KEY` | If Kestra enabled | - | Kestra API key |
| `KESTRA_WORKSPACE_ID` | If Kestra enabled | - | Kestra workspace ID |
| `OUMI_API_KEY` | If Oumi enabled | - | Oumi API key |
| `OUMI_WORKSPACE_ID` | If Oumi enabled | - | Oumi workspace ID |

## Support

For issues with:
- **Kestra setup**: Check Kestra documentation
- **Oumi models**: Contact Oumi support
- **Feature flags**: Review this guide
- **Fallback behavior**: Check console logs

## Next Steps

1. ✅ Copy `.env.example` to `.env.local`
2. ✅ Fill in required API keys and URLs
3. ✅ Adjust feature flags as needed
4. ✅ Test with `npm run dev`
5. ✅ Monitor health checks
6. ✅ Gradually enable features in production
