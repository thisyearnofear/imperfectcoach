# 🏋️ Imperfect Coach

**Autonomous AI Agent for Personalized Fitness Coaching**

> 🤖 **Solana x402 Hackathon Submission**  
> Target: Best x402 Agent Application ($20,000 prize)  
> Built with Amazon Bedrock AgentCore • Amazon Nova Lite • Multi-step Reasoning

**🔗 Live Demo:** [imperfectcoach.netlify.app](https://imperfectcoach.netlify.app)

---

## 🎯 What is Imperfect Coach?

Imperfect Coach is an **autonomous AI agent system** that combines computer vision, multi-step reasoning, and tool integration to deliver personalized fitness coaching. The agent independently analyzes workout performance, queries historical data, benchmarks against similar athletes, and generates adaptive training plans—all without human intervention.

We're transforming AI agents from simple payment users to payment optimizers with intelligent multi-chain routing.

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

### 💰 Intelligent Multi-Chain Payments
- **Smart Payment Routing**: AI automatically selects optimal blockchain (Base or Solana)
- **Cost Optimization**: Up to 90% fee savings on micro-payments via Solana
- **Seamless Experience**: Single payment flow with invisible chain selection
- **Graceful Fallback**: Base network as reliable backup if Solana unavailable

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
git clone https://github.com/thisyearnofear/imperfecthigher
cd imperfecthigher
npm install
npm run dev
```

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
- x402pay protocol (Base + Solana)
- CDP Wallet (autonomous treasury)
- USDC on Base & SOL/USDC on Solana

---

## 📚 Documentation

### User Guides
- **[User Guide](docs/USER_GUIDE.md)** - Complete features and usage instructions
- **[Demo Script](docs/DEMO_SCRIPT.md)** - 3-minute presentation for hackathon judges

### Technical Documentation
- **[Architecture](docs/ARCHITECTURE.md)** - Complete system design and implementation
- **[Development](docs/DEVELOPMENT.md)** - Setup, testing, and development practices
- **[Deployment](docs/DEPLOYMENT.md)** - Deployment procedures and monitoring
- **[Solana Payments](docs/SOLANA_PAYMENTS.md)** - Multi-chain payment implementation

### Quick References
- **[AWS Deployment Script](aws-lambda/deploy.sh)** - One-command Lambda deployment
- **[Supabase Functions](supabase/)** - Edge function source code

---

## 🎯 Solana x402 Hackathon Value

### Why We'll Win
1. **Working Agent**: Sophisticated AI fitness coach vs. hackathon prototypes
2. **Proven x402**: Enhanced existing integration with intelligent routing
3. **Smart Economic Decisions**: First agent to make autonomous payment routing
4. **Multi-Chain Pioneer**: Demonstrates true autonomous economic intelligence

### Demo Experience
Watch our AI fitness coach make real-time economic decisions:
- **$0.001 micro-tip** → Automatically selects Solana (90% fee savings)
- **$0.05 premium analysis** → Offers user choice with live cost comparison  
- **$0.10 agent coaching** → Intelligently chooses Base (established infrastructure)

All seamless. All autonomous. All while maintaining a single user experience.

---

## 📄 License

This project is licensed under the MIT License

---

## 🙏 Acknowledgments

**Solana x402 Hackathon** - For pushing the boundaries of internet payments  
**Amazon Bedrock Team** - For AgentCore and Nova Lite  
**TensorFlow.js & MediaPipe** - Computer vision foundation  
**Base & Coinbase** - CDP Wallet infrastructure and Smart Wallet

---
*Built with ❤️ for athletes everywhere. Submitted to Solana x402 Hackathon.*