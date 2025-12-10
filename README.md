# 🏋️ Imperfect Coach

**Autonomous AI Agent for Personalized Fitness Coaching**

**🔗 Live Demo:** [imperfectcoach.netlify.app](https://imperfectcoach.netlify.app)
 
> **🏆 Avalanche Hack2Build: x402 Agent Economy Participant**  
> Building a decentralized agent economy where autonomous agents negotiate, pay for, and exchange services via x402 protocol on Avalanche, Base, and Solana.

---

## 🎯 What is Imperfect Coach?

Imperfect Coach is an **autonomous AI agent system** that demonstrates a **decentralized agent economy powered by x402**. Multiple specialized agents (fitness coach, nutrition planner, massage booking, calendar coordinator) negotiate, pay, and exchange services with each other using x402 micropayments—without any centralized middleman.

**The Vision**: Agents don't just use payments; they architect entire service workflows, make autonomous routing decisions, and coordinate multi-agent solutions. All transactions are metered, auditable, and revenue-split transparently.

Users benefit from:
- **Integrated Services**: One interface, multiple specialized agents cooperating
- **Cost Transparency**: See exactly which agent did what and charged how much
- **Agent Competition**: Services compete for quality and price
- **Privacy Control**: Grant/revoke agent access to your data anytime

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

### 💰 x402 Decentralized Agent Economy
- **Agent-to-Agent Payments**: Nutrition Agent pays Fitness Agent for data via x402
- **Smart Routing**: Agents autonomously choose chains based on cost, speed, reliability
- **Multichain Support**: Avalanche C-Chain (primary), Base Sepolia, Solana Devnet
- **Zero Account Friction**: No signup, no KYC, just agent wallet + signature
- **Transparent Settlement**: All payments logged on-chain, user sees full audit trail

### 🧠 Three Coaching Tiers
- **Free**: Real-time coaching (Gemini/OpenAI/Anthropic)
- **Premium ($0.05 USDC)**: Deep-dive Amazon Bedrock analysis
- **Agent ($0.10 USDC)**: Autonomous multi-step reasoning + personalized 4-week training plans

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

**Payments**
- x402 protocol (HTTP 402 Payment Required)
- Base Sepolia, Avalanche C-Chain, Solana Devnet
- USDC stablecoin settlement

---

## 📚 Documentation

### Technical Documentation
- **[Architecture](docs/ARCHITECTURE.md)** - Complete system design and x402 implementation
- **[Development](docs/DEVELOPMENT.md)** - Setup, testing, and development practices
- **[Deployment](docs/DEPLOYMENT.md)** - Deployment procedures and monitoring

### Quick References
- **[AWS Deployment Script](aws-lambda/deploy.sh)** - One-command Lambda deployment
- **[Supabase Functions](supabase/)** - Edge function source code

---

## 📄 License

This project is licensed under the MIT License

---

## 🙏 Acknowledgments

**Amazon Bedrock Team** - For AgentCore and Nova Lite  
**TensorFlow.js & MediaPipe** - Computer vision foundation  
**Base & Coinbase** - CDP Wallet infrastructure and Smart Wallet