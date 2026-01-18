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

#### x402 v2 Migration Plan

Our current "x402-style" integration is v1-compliant, but the recently announced x402 v2 standard offers significant improvements in security, efficiency, and interoperability. To keep our platform at the cutting edge, we should plan to migrate to v2.

**Gap Analysis Summary:**

*   **Major Gaps**:
    *   **Identity**: We use raw private keys in environment variables, whereas v2 moves to formal wallet-based identity.
    *   **Sessions**: We treat each call atomically. v2's reusable sessions would significantly improve efficiency for agent-to-agent communication.
    *   **Standardization**: Our implementation is custom. Adopting v2 would provide access to standard libraries, tooling, and better developer experience.
*   **Partial Gaps**:
    *   **API Discovery**: Our discovery mechanism is bespoke. v2 will provide a standard for better interoperability.

**Migration Recommendations:**

1.  **Adopt a Canonical x402 v2 Library**: Replace our custom implementation in `aws-lambda/lib/reap-integration.mjs` with an official x402 v2 library (once available).
2.  **Implement Wallet-Based Identity**: Refactor our key management to move away from raw private keys in `.env` files and towards a more secure and flexible wallet solution.
3.  **Utilize Reusable Sessions**: Modify our agent communication logic (e.g., in `agent-coach-handler.mjs`) to leverage reusable sessions for better performance and lower costs.
4.  **Standardize Agent Discovery**: Migrate our custom `AgentRegistry` and discovery logic to the new v2 standard to improve interoperability.

#### Reap Protocol Integration Plan

Our codebase includes a currently disabled integration with the Reap Protocol (`aws-lambda/lib/reap-integration.mjs`), an "Agentic Commerce Platform" designed to bridge Web2 and Web3. Properly integrating Reap will unlock advanced capabilities for our agents, such as discovering other agents and eventually purchasing goods and services autonomously.

**Key Features of Reap Protocol:**
*   **Agentic Commerce:** Allows AI agents to interact with e-commerce.
*   **Discovery:** Standardized mechanism for finding products and other AI agents.
*   **On-Chain Settlement:** Handles atomic purchases without needing ABI knowledge.
*   **Multi-Chain Support:** Compatible with our existing multi-chain architecture.

**Integration Steps:**

1.  **Install SDK:** Add the `@reap-protocol/sdk` to the `aws-lambda` service's `package.json`.
2.  **Enable Reap Client:** In `aws-lambda/lib/reap-integration.mjs`, enable the `ReapClient` by uncommenting the import and initialization logic. The client will be configured with the appropriate private key and middleware URLs provided by Reap.
3.  **Implement Agent Discovery:** Replace the mock/placeholder logic in the `discoverReapAgents` function with live calls to the `client.searchAgents` method from the SDK. This will allow our system to dynamically find other x402-compatible agents.
4.  **Implement Payment Negotiation:** Update the `negotiatePaymentWithAgent` function to use the Reap SDK for handling x402 payment challenges and settlements, removing the current mock implementation.
5.  **Update Environment:** Add the necessary `REAP_` environment variables to `.env.example` to ensure the integration is configurable.

### Phase 4: Multi-Service Marketplace
- Calendar, Massage Booking, Nutrition agents coordination
- Budget-based service orchestration
- Multi-agent payment chains

### Phase 5: Autonomous Agent Chaining
- Complex requests triggering agent chains
- Independent settlements per agent
- Dynamic specialization discovery