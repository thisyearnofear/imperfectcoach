# 🏋️ Imperfect Coach

**Autonomous AI Agent for Personalized Fitness Coaching**

**🔗 Live Demo:** [imperfectcoach.netlify.app](https://imperfectcoach.netlify.app)
 
> **🏆 Avalanche Hack2Build: x402 Agent Economy**  
> **Avalanche C-Chain primary deployment** with decentralized agent economy where autonomous agents negotiate, pay for, and exchange services via x402 protocol. Multi-chain support: Avalanche, Base, Solana.

---

## 🎯 What is Imperfect Coach?

Imperfect Coach is an **autonomous AI agent system** that demonstrates a **decentralized agent economy powered by x402 and Reap Protocol**. Multiple specialized agents (fitness coach, nutrition planner, biomechanics analyzer, recovery specialist) discover each other via Reap, negotiate x402 pricing in real-time, and exchange services using trustless micropayments.

**The Vision**: Agents autonomously discover specialists, negotiate pricing, execute transactions, and build reputation—all without escrow contracts or central orchestration. Every service is paid immediately via x402. Every SLA is tracked on-chain.

Users benefit from:
- **True Agent Economy**: Agents compete and pay each other for quality, driving better results
- **Real-Time Pricing Discovery**: Each request triggers fresh agent negotiation
- **Transparent Cost Breakdown**: Exact breakdown of which agent earned what via x402
- **Reputation-Driven Quality**: Agent success rates verified on-chain
- **Multi-Chain Flexibility**: Fast on Avalanche, cheap on Base, optimized for Solana

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

### 💰 x402 Agent Economy (Immediate Payments, No Escrow)
- **Agent-to-Agent x402 Payments**: Agents pay each other directly for services
- **Reap Protocol Discovery**: Real agent discovery from Reap registries (Phase A ✅)
- **Real-Time Negotiation**: Dynamic pricing negotiation per request (Phase B ✅)
- **Immediate Settlement**: Direct USDC transfers via x402, no batching (Phase C ✅)
- **AgentRegistry Contract**: On-chain agent profiles, capabilities, and reputation
  - **Base Sepolia**: `0xfE997dEdF572CA17d26400bCDB6428A8278a0627` ✅ Verified
  - **Avalanche Fuji**: `0x1c2127562C52f2cfDd74e23A227A2ece6dFb42DC` ✅ Verified
- **Smart Chain Routing**: Agents autonomously select networks by cost/speed
- **Primary Network**: Avalanche C-Chain (fastest finality for agent coordination)
- **Multi-Chain Support**: Base Sepolia, Solana Devnet for flexibility
- **On-Chain Reputation**: Agent success rates tracked and verified
- **Zero Escrow**: No pre-locking of funds, immediate peer-to-peer value exchange

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
- **[Architecture](docs/ARCHITECTURE.md)** - Complete system design and x402 implementation
- **[Development](docs/DEVELOPMENT.md)** - Setup, testing, and development practices
- **[Deployment](docs/DEPLOYMENT.md)** - Deployment procedures and monitoring

### Quick References
- **[AWS Deployment Guide](docs/AWS_DEPLOYMENT_SETUP.md)** - Lambda deployment via S3
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