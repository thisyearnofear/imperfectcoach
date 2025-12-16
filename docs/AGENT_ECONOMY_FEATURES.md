# Agent Economy & Features Guide

## Overview

The Imperfect Coach implements an agent coordination system where specialized agents work together to provide comprehensive fitness analysis. The system follows x402 protocol patterns for payment negotiation and settlement, with a unified agent registry enabling both internal core agents and external permissionless agent registration.

## Agent Coordination Architecture

### Core Agents
The system implements 4 CORE_AGENTS that work together:

1. **Fitness Coach 💪** (Coordinator)
   - Primary fitness analysis and coordination
   - Reputation: 98/100
   - Cost: $0.04-0.05 USDC

2. **Nutrition Planner 🥗** (Specialist)  
   - Specialized nutrition planning
   - Reputation: 95/100
   - Cost: $0.03 USDC

3. **Recovery Planner 😴** (Specialist)
   - Recovery optimization and planning
   - Reputation: 94/100
   - Cost: $0.05 USDC

4. **Biomechanics Analyst 🏋️** (Specialist)
   - Form analysis and movement quality
   - Reputation: 96/100
   - Cost: $0.08 USDC

### Service Tiers
Each agent offers tiered services with different SLA guarantees:

- **Basic Tier**: Standard analysis, 8s SLA (2.5x price of base)
- **Pro Tier**: Priority processing, 3s SLA (2.5x price)
- **Premium Tier**: Ultra-fast, <500ms SLA (5x price)

### Agent Discovery
- **Core Agents**: Predefined CORE_AGENTS (5 fitness specialists) as guaranteed fallback
- **External Agents**: Permissionless registration via `/agents/register` (EIP-191 signed)
- **Capability-based**: `GET /agents?capability=X` queries unified registry
- **Reputation-based**: Agents ranked by reputation scores (0-100)
- **SLA-constrained**: Response time requirements and tier availability
- **Implementation**: Unified registry in `aws-lambda/lib/agents.mjs` with DynamoDB-ready persistence

## x402-Style Agent Coordination Payments

### Payment Flow
```
User requests analysis ($0.10)
         ↓
Coach Agent coordinates internally
         ↓
For each specialist:
  1. Internal lookup from CORE_AGENTS
  2. x402 signature verification
  3. Real blockchain settlement (native tokens)
  4. Service execution
         ↓
Coach synthesizes results
         ↓
User receives comprehensive analysis
```

### Multi-Chain Support
- **Base Sepolia**: Primary network for payment verification
- **Avalanche Fuji**: Payment verification network
- **Solana Devnet**: Solana payment verification
- **Automatic Routing**: System selects optimal network for signature verification

### Real Blockchain Settlement
- No escrow required
- Cryptographic signature verification (EIP-191/EVM, Ed25519/Solana)
- Real native token transfers (ETH/AVAX/SOL) on blockchain
- On-chain transaction audit trails

## AI Coach Features

### Multi-Step Reasoning
- Amazon Bedrock AgentCore implementation
- Up to 5 reasoning iterations
- Tool use and autonomous decision-making
- Amazon Nova Lite LLM for decision-making

### Integrated Tools
1. **Pose Analysis** - Real-time form evaluation
2. **Workout History** - Performance pattern analysis
3. **Performance Benchmarking** - Comparison to athlete database
4. **Training Plan Generation** - Personalized 4-week programs

### Exercise Support
- **Pull-ups**: Elbow angle, chin-over-bar, ROM tracking, asymmetry detection
- **Jumps**: Height measurement, landing technique, power scoring, consistency
- **Form Scoring**: 0-100% accuracy rating per exercise
- **Real-time Feedback**: Instant corrections and technique tips

## On-Chain Features

### AgentRegistry Contract
Deployed on both Base Sepolia and Avalanche Fuji:

- Agent registration with capabilities and pricing
- Discovery queries by capability and reputation
- Pricing management per capability and tier
- Reputation tracking with heartbeat and uptime

### Leaderboards
- Permanent records on Base Sepolia
- Separate contracts for each exercise type
- Transparent ranking system

### Achievement System
- NFT Passport for soulbound achievements
- Session history and progress tracking
- Blockchain-based verification

## UX Design

### Progressive Disclosure
- **First interaction**: Simple "5 specialists, 1 price" messaging
- **During processing**: Show agents discovering and coordinating  
- **After completion**: Full breakdown of which agents contributed

### Transparency as Value
- Users see exactly which agents contributed
- Cost breakdown per specialist
- Network and transaction details
- Traditional cost comparison (99% savings)

### Mobile-First Design
- Vertical layouts for agent coordination
- Touch-friendly interactions
- Collapsible details for cost breakdowns
- Mobile-optimized animations

## Agent Coordination Process

### Discovery Phase
```
🔍 Discovering Nutrition Planner... [27%]
💳 Negotiating with Nutrition Planner ($0.03)... [34%]
🥗 Nutrition Planner analyzing... [41%]
🔍 Discovering Biomechanics Analyst... [55%]
💳 Negotiating with Biomechanics Analyst ($0.08)... [62%]
🏋️ Biomechanics Analyst analyzing... [69%]
```

### Payment Verification
1. User pays total amount ($0.10)
2. Coach Agent pays specialists individually
3. Each payment verified on-chain
4. Service completed and results returned

### Result Synthesis
- Individual specialist contributions combined
- Quality assurance check
- Comprehensive analysis delivered
- Agent contribution breakdown provided

## Service Tiers & Pricing

### Free Tier
- Real-time coaching with basic AI
- Form feedback and rep counting
- Limited analysis depth

### Premium Tier ($0.05)
- Deep-dive Amazon Bedrock analysis
- Multi-step reasoning
- Comprehensive workout assessment

### Agent Tier ($0.10)
- 5 coordinated specialists
- Real-time agent-to-agent payments
- Comprehensive multi-perspective analysis
- 99% cost savings vs traditional coaching

## Future Enhancements

### Potential Technology Upgrades

#### Exercise Detection with Roboflow

To address the reliability issues with the current free, client-side jump and pull-up detection, we are considering using **Roboflow**. This would represent a significant architectural shift but could offer substantial improvements in accuracy.

*   **Overview**: Roboflow is a production-ready platform for building, training, and deploying custom computer vision models. We would train a model on our own curated video data of jumps and pull-ups.
*   **Pros**:
    *   **Higher Accuracy**: By training on our own data, we can create a highly accurate model tuned to our specific needs.
*   **Cons**:
    *   **Cost**: Requires a paid subscription (starting from ~$49/month), as a production application would exceed the free tier.
    *   **Latency**: Introduces network latency, as video frames would need to be sent to an external API. This eliminates the current real-time feedback and would require a UI/UX redesign to handle asynchronous processing.
*   **Integration Effort (High)**:
    1.  **Data Collection**: Requires building a labeled dataset of exercise videos.
    2.  **Architectural Overhaul**: The current `usePoseDetection` hook and exercise processing logic would need to be replaced with API calls to Roboflow.
    3.  **UI/UX Redesign**: The user interface must be adapted to handle the asynchronous nature of the feedback.

**Recommendation**: A Proof of Concept (PoC) should be developed on the Roboflow free tier to validate the accuracy improvements before committing to a full integration.

### Phase 4: Multi-Service Marketplace
- Calendar, Massage Booking, Nutrition agents coordination
- Budget-based service orchestration
- Multi-agent payment chains

### Phase 5: Autonomous Agent Chaining
- Complex requests triggering agent chains
- Independent settlements per agent
- Dynamic specialization discovery