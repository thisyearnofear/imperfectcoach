# Agent Economy & Features Guide

## Overview

The Imperfect Coach implements an agent coordination system where specialized agents work together to provide comprehensive fitness analysis. The system follows x402 protocol patterns for payment negotiation, though currently operates with internally defined CORE_AGENTS rather than a fully decentralized agent network.

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
- **Internal Discovery**: Uses predefined CORE_AGENTS in the system
- **Capability-based**: Find agents by specific capabilities
- **Reputation-based**: Agents ranked by reputation scores
- **SLA-constrained**: Response time requirements

## x402 Agent-to-Agent Payments

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

### Phase 4: Multi-Service Marketplace
- Calendar, Massage Booking, Nutrition agents coordination
- Budget-based service orchestration
- Multi-agent payment chains

### Phase 5: Autonomous Agent Chaining
- Complex requests triggering agent chains
- Independent settlements per agent
- Dynamic specialization discovery