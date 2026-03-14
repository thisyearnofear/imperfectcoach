# Imperfect Coach - Core Architecture & Technology

## Overview

Imperfect Coach is an autonomous AI agent system that demonstrates x402-style payment flows with coordinated specialist agents (fitness coach, nutrition planner, biomechanics analyzer, recovery specialist). The system follows x402 payment verification and settlement patterns but currently operates with internally defined CORE_AGENTS rather than a fully decentralized agent discovery network.

**Status**: Phase 1 (Consolidation) ✅ - Unified, persistent agent registry implemented. See "Agent Registry Implementation" below.

## Core Components

### AI Agent System (Powered by Amazon Nova 2)
- **Amazon Bedrock AgentCore** - Multi-step reasoning and tool use
- **Amazon Nova 2 Lite** - Next-gen LLM providing **Extended Thinking** (step-by-step biomechanical reasoning)
- **Joint-Stress Analysis** - Injury-aware coaching for Back and Knee pain prevention
- **TensorFlow.js + MediaPipe** - Pose detection for form analysis

### Multi-Chain Blockchain Infrastructure
- **x402 Protocol Implementation** - Server-driven payment challenges with signature verification
- **Multi-chain Support**: Base Sepolia, Avalanche Fuji, Solana Devnet
- **USDC Payment Verification** - Cryptographic verification of payments
- **AgentRegistry Contract** - On-chain agent profiles, capabilities, and reputation

### Payment Architecture
- **x402 Payment Router** - Centralized payment negotiation logic
- **Signature Verification** - Cryptographic verification of EVM (EIP-191) and Solana (Ed25519) signatures
- **Real Blockchain Settlement** - Native token transfers on EVM and Solana networks
- **Multi-Wallet Support** - EVM and Solana wallet integration

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     USER INTERFACE                       │
│              React + TypeScript + Vite                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   AI COACHING TIERS                      │
├─────────────────────────────────────────────────────────┤
│  FREE        →  Supabase Edge (Gemini/OpenAI/Claude)   │
│  PREMIUM     →  AWS Lambda + Nova 2 Lite ($0.05)       │
│                (Joint-Stress + Extended Thinking)       │
│  AGENT       →  AWS Lambda + Bedrock AgentCore ($0.10)  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              MULTI-CHAIN BLOCKCHAIN                     │
├─────────────────────────────────────────────────────────┤
│  Payments    →  x402 + Immediate Settlement            │
│  Base        →  USDC (Base Sepolia) - Agent discovery  │
│  Avalanche   →  USDC (Fuji) - Primary settlement       │
│  Solana      →  SOL/USDC (Devnet) - Fallback           │
│  Registry    →  AgentRegistry.sol - Agent profiles     │
│  Records     →  ImperfectCoachPassport NFT              │
│  Leaderboard →  On-chain permanent tracking             │
└─────────────────────────────────────────────────────────┘
```

## Core Agents

The system implements 5 CORE_AGENTS with **multi-chain settlement** (Base, Avalanche, Solana):

1. **Fitness Coach 💪** - Coordinator, primary fitness analysis
2. **Nutrition Planner 🥗** - Specialized nutrition planning
3. **Recovery Planner 😴** - Recovery optimization and planning
4. **Biomechanics Analyst 🏋️** - Form analysis and movement quality
5. **Recovery Booking 💆** - Massage & physiotherapy booking

Each agent has:
- Reputation scoring (94-98/100)
- Capability-based discovery
- Tiered pricing (Basic/Pro/Premium)
- x402 payment integration
- **Multi-chain settlement** (clients choose Base, Avalanche, or Solana at payment time)

**Chain-Agnostic Design**: Agents are not tied to specific chains. All agents support settlement on all chains. Client picks the chain at payment negotiation, not at agent discovery.

## x402 Payment Protocol

The x402 protocol enables true decentralized agent economies:

### Flow
1. Agent A requests service from Agent B (without payment)
2. Agent B returns HTTP 402 with service pricing & requirements
3. Agent A signs the challenge with its identity
4. Agent A retries with signed payment authorization
5. Agent B verifies signature and settles on-chain
6. Service executes and both agents update state

### Implementation
- **EVM Networks** - EIP-191 signature verification
- **Solana** - Ed25519 signature verification
- **Challenge Format** - Standardized across all networks
- **Payment Router** - Centralized negotiation logic

## Key Technologies

### AI & Agent System
- Amazon Bedrock AgentCore (multi-step reasoning)
- Amazon Nova 2 Lite (Extended Thinking & Joint-Stress Analysis)
- TensorFlow.js + MediaPipe (pose detection)

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Wagmi + Viem (blockchain integration)

### Backend
- AWS Lambda (eu-north-1)
- Supabase Edge Functions
- Smart Contracts (Base/Avalanche)

### Payments & Agent Economy
- x402 protocol (HTTP 402 Payment Required)
- USDC stablecoin with automatic network routing
- Permissionless agent discovery via self-hosted registry
- AgentRegistry Contract for profiles and reputation

## Agent Registry Implementation

### Architecture
The agent discovery system uses a three-layer architecture:

1. **Self-Hosted Registry** (Primary)
   - `aws-lambda/lib/agents.mjs` - Unified agent registry with persistent storage
   - Supports core agents (guaranteed availability) and dynamic agents (externally registered)
   - Methods: `queryByCapability()`, `register()`, `getById()`, `updateHeartbeat()`, `deactivate()`

2. **REST API** (agent-discovery.mjs)
   - `GET /agents?capability=X` - Discover agents by capability
   - `POST /agents/register` - Permissionless agent registration (EIP-191 signed)
   - `POST /agents/heartbeat` - Liveness tracking
   - `POST /agents/{id}/book` - Service booking
   - `POST /agents/{id}/availability` - Tier and availability updates

3. **Persistent Storage** (DynamoDB-ready)
   - Core agents: Hardcoded fallback (5 fitness specialists)
   - Dynamic agents: Runtime-registered externally managed agents
   - Attributes: ID, name, endpoint, capabilities, pricing, reputation, lastHeartbeat, status

### Discovery Flow
```
Client Request → agent-discovery.mjs → AgentRegistry
                                       ├─ Query core agents
                                       ├─ Query dynamic agents (DynamoDB)
                                       └─ Filter by capability, reputation, tier
```

### Registration Flow
```
External Agent → POST /agents/register
                 ├─ Verify EIP-191 signature (TODO)
                 ├─ Create agent with type='dynamic'
                 └─ Persist to registry (in-memory + DynamoDB)
```

### Current Implementation Status
| Component | Status | Notes |
|-----------|--------|-------|
| Core agents | ✅ | 5 fitness specialists, guaranteed fallback |
| Unified registry | ✅ | Single source of truth via agents.mjs |
| Persistent storage | ✅ | DynamoDB integration complete |
| External discovery | ✅ | queryByCapability() with filtering |
| Permissionless join | ✅ | register() endpoint operational |
| Signature verification | ✅ | EIP-191 signature validation in register() |
| Dynamic persistence | ✅ | Cold-start loading from DynamoDB |

### Why This Approach

**Previous**: Reap Protocol integration was planned for agent discovery, but Reap is designed for agentic commerce (product search, inventory verification, autonomous purchasing), not agent discovery.

**Current**: Self-hosted registry provides:
- True permissionless agent discovery
- Independence from third-party services
- Dynamic agent registration without pre-arrangement
- Foundation for true X402 (unknown agents can find and pay each other)

**Future**: Reap can be integrated for agentic commerce features:
- Agents autonomously booking recovery services
- Purchasing supplements/equipment recommendations
- Verifying supplier inventory before recommendations
- Web2/Web3 settlement bridge for commerce transactions

## Phase 2: Production Enhancements

Complete X402 implementation with production-grade security:

1. **Deploy DynamoDB table**
   - Create AgentRegistry table with agentId as primary key
   - Add GSI on (type, status) for efficient querying
   - Enable point-in-time recovery

2. **Integrate cryptographic library**
   - Replace format validation with actual EIP-191 recovery
   - Use viem or ethers.js for signature verification
   - Support multi-chain signers (EVM + Solana)

3. **Test permissionless registration**
   - Create test agent with EIP-191 signed identity
   - Verify persistence across Lambda cold starts
   - Test heartbeat and stale agent cleanup

4. **Add rate limiting & spam prevention**
   - Limit registrations per IP/hour
   - Require minimum reputation for discovery priority
   - Auto-deactivate agents after 7 days without heartbeat

5. **Add metrics & monitoring**
   - Track registration requests
   - Monitor discovery queries
   - Alert on stale agents and failed verifications