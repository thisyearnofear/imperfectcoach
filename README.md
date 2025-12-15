# 🏋️ Imperfect Coach

**Autonomous AI Agent for Personalized Fitness Coaching**

**🔗 Live Demo:** [imperfectcoach.netlify.app](https://imperfectcoach.netlify.app)

x402-powered agent coordination system where specialized agents work together to provide comprehensive fitness analysis. Multi-chain support: Avalanche, Base, Solana.

---

## 🎯 What is Imperfect Coach?

Imperfect Coach is an **autonomous AI agent system** that demonstrates x402 protocol concepts with coordinated specialist agents (fitness coach, nutrition planner, biomechanics analyzer, recovery specialist). The agents coordinate internally using x402-style payment verification.

**Note**: The Reap Protocol agent discovery is under development. The system currently uses internally defined CORE_AGENTS.

Users benefit from:
- **Specialist Agent Coordination**: Multiple AI agents contribute specialized expertise
- **x402 Payment Protocol**: Cryptographic payment verification and authorization
- **Transparent Processing**: Visibility into which agents contributed to analysis
- **Reputation-Driven Quality**: Agent performance tracking within the system
- **Multi-Chain Flexibility**: Support for Base, Avalanche, and Solana wallets

---

## ✨ Key Features

### 🤖 Autonomous AI Coach Agent
- **Multi-Step Reasoning**: Agent decides which analysis tools to invoke (up to 5 reasoning iterations)
- **4 Integrated Tools**: Pose analysis, workout history, performance benchmarking, training plan generation
- **Autonomous Decision-Making**: Zero human intervention - agent thinks and acts independently
- **Amazon Bedrock AgentCore**: Full implementation of tool use and reasoning loop primitives

### 🎥 Real-Time Form Analysis
- **Advanced Pose Detection**: 17-point body tracking (TensorFlow.js + MediaPipe)
- **Instant Feedback**: Real-time form corrections and technique tips
- **Accurate Rep Counting**: Automatic detection with range-of-motion validation
- **Form Scoring**: 0-100% accuracy rating per exercise

### 💰 x402 Agent Economy (Real Settlement, No Escrow)
- **Internal Specialists**: 4 core agents (Fitness Coach, Nutrition, Recovery, Biomechanics)
- **x402 Protocol Compliance**: Follows x402 request-response patterns with real settlement
  - **Multi-chain by default**: Base Sepolia & Avalanche Fuji
  - **Dynamic routing**: Per-agent payment addresses
  - **Plugin-ready**: Extensible for future discovery APIs
- **Signature-Based Verification**: Cryptographic verification of EVM/Solana signatures
- **Real Blockchain Settlement**: Native token transfers (ETH/AVAX/SOL) on blockchain
- **AgentRegistry Contract**: On-chain agent profiles, capabilities, and reputation
  - **Base Sepolia**: `0xfE997dEdF572CA17d26400bCDB6428A8278a0627` ✅ Verified
  - **Avalanche Fuji**: `0x1c2127562C52f2cfDd74e23A227A2ece6dFb42DC` ✅ Verified
- **Smart Chain Routing**: Payment verification and settlement routing by network
- **Primary Network**: Base Sepolia (for payment verification and settlement)
- **Transaction Audit**: On-chain transaction logging for all payments
- **Zero Escrow**: No pre-locking of funds, immediate blockchain settlement
- **Future Ready**: Reap Protocol discovery when available

### 🧠 Coaching & Service Tiers
- **Free**: Real-time coaching (Gemini/OpenAI/Anthropic)
- **Premium ($0.05 USDC)**: Deep-dive Amazon Bedrock analysis
- **Agent Marketplace**: Multi-tier services (Basic/Pro/Premium) with SLA guarantees
  - Basic: Standard analysis, 8s SLA
  - Pro: Priority processing, 3s SLA (2.5x price)
  - Premium: Ultra-fast, <500ms SLA (5x price)

### 💪 Supported Exercises
- **Pull-ups**: Elbow angle, chin-over-bar, ROM tracking, asymmetry detection
- **Jumps**: Height measurement, landing technique, power scoring, consistency

### 🏆 On-Chain Progress Tracking
- **Blockchain Leaderboards**: Permanent records on Base Sepolia
- **NFT Passport**: Soulbound achievement tracking
- **Session History**: Review past workouts and improvements

---

## 🚀 Quick Start

### For Users
1. Visit [imperfectcoach.netlify.app](https://imperfectcoach.netlify.app)
2. Grant camera access
3. Choose exercise (pull-ups or jumps)
4. Select coach personality
5. Work out with real-time feedback
6. Optionally upgrade to Premium or Agent tier for deeper insights

### For Developers
```bash
git clone https://github.com/thisyearnofear/imperfectcoach
cd imperfectcoach
# Install pnpm if you don't have it: npm install -g pnpm
pnpm install
pnpm run dev
```

> **Note**: This project now uses pnpm as the package manager for better disk space efficiency and faster installations. While npm still works, pnpm is recommended.

---

## 🛠️ Technology Stack

**AI & Agent System**
- Amazon Bedrock AgentCore (multi-step reasoning)
- Amazon Nova Lite (LLM decision-making)
- TensorFlow.js + MediaPipe (pose detection)

**Frontend**
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Wagmi + Viem (blockchain)

**Backend**
- AWS Lambda (eu-north-1)
- Supabase Edge Functions
- Smart Contracts (Base Sepolia)

**Payments & Agent Economy**
- x402 protocol (HTTP 402 Payment Required, immediate settlement)
- **Avalanche C-Chain** (primary - Fuji testnet), Base Sepolia, Solana Devnet
- USDC stablecoin with automatic network routing
- **Reap Protocol**: Real agent discovery (Phase A), negotiation (Phase B), settlement (Phase C)
- **AgentRegistry Contract**: On-chain agent profiles, pricing, and reputation

---

## 📚 Documentation

### Technical Documentation
- **[Core Architecture](docs/CORE_ARCHITECTURE.md)** - Complete system design and x402 implementation
- **[Development Guide](docs/DEVELOPMENT_GUIDE.md)** - Setup, testing, and development practices
- **[Deployment & Operations](docs/DEPLOYMENT_OPERATIONS.md)** - Deployment procedures and monitoring
- **[Agent Economy & Features](docs/AGENT_ECONOMY_FEATURES.md)** - Agent economy and core features

### Quick References
- **[LLM Documentation](docs/llms.txt)** - Complete documentation for AI agents
- **[Avalanche Deployment](aws-lambda/deploy-s3.sh)** - Automated deployment script
- **[Supabase Functions](supabase/)** - Edge function source code

---

## 📄 License

This project is licensed under the MIT License

---

## 🙏 Acknowledgments

**Amazon Bedrock Team** - For AgentCore and Nova Lite  
**TensorFlow.js & MediaPipe** - Computer vision foundation  
**Base & Coinbase** - CDP Wallet infrastructure and Smart Wallet