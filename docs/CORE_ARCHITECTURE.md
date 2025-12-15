# Imperfect Coach - Core Architecture & Technology

## Overview

Imperfect Coach is an autonomous AI agent system that demonstrates a decentralized agent economy powered by x402 protocol. Multiple specialized agents (fitness coach, nutrition planner, biomechanics analyzer, recovery specialist) coordinate to provide comprehensive fitness analysis using x402 payment negotiation for services.

**Note**: The Reap Protocol integration is currently under development and disabled. The agent economy operates with internally defined CORE_AGENTS.

## Core Components

### AI Agent System
- **Amazon Bedrock AgentCore** - Multi-step reasoning and tool use
- **Amazon Nova Lite** - LLM decision-making for analysis
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
│  PREMIUM     →  AWS Lambda + Nova Lite ($0.05)          │
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

The system implements 4 CORE_AGENTS:

1. **Fitness Coach 💪** - Coordinator, primary fitness analysis
2. **Nutrition Planner 🥗** - Specialized nutrition planning
3. **Recovery Planner 😴** - Recovery optimization and planning
4. **Biomechanics Analyst 🏋️** - Form analysis and movement quality

Each agent has:
- Reputation scoring (94-98/100)
- Capability-based discovery
- Tiered pricing (Basic/Pro/Premium)
- x402 payment integration

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
- Amazon Nova Lite (LLM decision-making)
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
- Reap Protocol for agent discovery
- AgentRegistry Contract for profiles and reputation