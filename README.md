# 🏋️ Imperfect Coach: AI Biomechanics Lab

**Autonomous Injury-Aware AI Agent powered by Amazon Nova 2**

**🔗 Live Demo:** [imperfectcoach.netlify.app](https://imperfectcoach.netlify.app)

Imperfect Coach is a next-generation **AI Biomechanics Lab** that uses **Amazon Nova 2** and **Bedrock AgentCore** to provide clinical-grade movement analysis. Unlike generic fitness apps, it specializes in **Injury-Aware Coaching**, using multimodal vision to detect biomechanical stress in the back and knees.

---

## 🎯 What's New (Hackathon Edition)

We have pivoted from a basic coach to a **Digital Clinical Review** system leveraging the latest Amazon AI capabilities:

- **Amazon Nova 2 "Extended Thinking"**: The coach now performs step-by-step internal reasoning on the physics of your movement before giving feedback.
- **Multimodal "Visual Second Opinion"**: Nova 2 analyzes high-resolution frames of your workout to detect technical flaws that raw pose data might miss.
- **Injury-Aware Diagnostics**: Specialized analysis modes for **Back (Lumbar)** and **Knee (Patella)** safety.
- **Autonomous Rehab Protocols**: The agent autonomously triggers a recovery specialist tool to prescribe personalized mobility flows based on your detected stress levels.

---

## ✨ Key Features

### 🧠 Advanced Nova 2 Reasoning
- **Extended Thinking**: Deep dive into leverage, stability, and joint torque.
- **Multimodal Vision**: Simultaneous analysis of 17-point pose data and raw visual evidence.
- **Agentic Decision Making**: Autonomous coordination between Fitness and Recovery agents via x402.

### 🎥 Clinical Form Analysis
- **Joint Stress Detection**: Real-time monitoring for knee valgus and lumbar rounding.
- **Visual Feedback**: Transparent "Look under the hood" at the AI's reasoning process.
- **High-Signal Coaching**: Professional-grade technique corrections and preventative tips.

### 💰 x402 Agent Economy
- **Autonomous Settlement**: Immediate blockchain settlement (Base, Avalanche, Solana) between agents.
- **Specialist Marketplace**: Book tiered recovery services with guaranteed SLAs.
- **Transparent Audit**: On-chain logging of all agent-to-agent service calls.

---

## 🛠️ Technology Stack

**AI & Agent System**
- **Amazon Nova 2 Lite** (Core Reasoning & Multimodal Vision)
- **Amazon Bedrock AgentCore** (Autonomous Tool Use & Multi-step Loop)
- **TensorFlow.js + MediaPipe** (17-point Pose Detection)

**Payments & Web3**
- **x402 Protocol** (HTTP 402 Monetization)
- **Multi-Chain Settlement** (Base Sepolia, Avalanche Fuji, Solana Devnet)
- **AgentRegistry Contract** (On-chain reputations & capabilities)

### 💰 x402-Style Payment System (Real Settlement, No Escrow)
- **Internal Specialists**: 4 core agents (Fitness Coach, Nutrition, Recovery, Biomechanics)
- **x402-Style Protocol**: Implements server-driven payment challenges with signature verification and settlement
  - **Multi-chain by default**: Base Sepolia & Avalanche Fuji
  - **Dynamic routing**: Per-agent payment addresses
  - **Plugin-ready**: Extensible for future discovery APIs
- **Signature-Based Verification**: Cryptographic verification of EVM/Solana signatures
- **Real Blockchain Settlement**: Native token transfers (ETH/AVAX/SOL) on blockchain
- **AgentRegistry Contract**: On-chain agent profiles, capabilities, and reputation
  - **Base Sepolia**: `0xfE997dEdF572CA17d26400bCDB6428A8278a0627` ✅ Verified
  - **Avalanche Fuji**: `0x1c2127562C52f2cfDd74e23A227A2ece6dFb42DC` ✅ Verified
  - **Solana Devnet**: `9u4eVWRf8a7vMDCHsguakB6vxcnCuJssBVBbQAYrKdog` ✅ Verified
- **Smart Chain Routing**: Payment verification and settlement routing by network
- **Primary Network**: Base Sepolia (for payment verification and settlement)
- **Transaction Audit**: On-chain transaction logging for all payments
- **Zero Escrow**: No pre-locking of funds, immediate blockchain settlement

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
- **Reap Protocol**: Agentic commerce platform (search products, verify inventory, purchase autonomously with Web2/Web3 settlement bridge)
- **AgentRegistry Contract**: On-chain agent profiles, pricing, and reputation

---

## 📚 Documentation

### Phase 2-3 Agent Discovery (Latest - Live)
- **[Agent Discovery Service](aws-lambda/DYNAMODB_INTEGRATION.md)** - Permissionless agent discovery, registration, and booking
  - ✅ Phase 2: Core agent discovery service deployed
  - ✅ Phase 3: DynamoDB persistence enabled
  - ✅ API Gateway: Live endpoint for user testing
  - 📍 Live URL: `https://r03m1wznai.execute-api.eu-north-1.amazonaws.com/prod/agents`
  - 🔗 Multi-chain: Base, Avalanche, Solana support

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