# 🏋️ Imperfect Coach

**AI-Powered Fitness Form Analysis & Coaching Platform**

Transform your workouts with real-time AI coaching that analyzes your form, counts your reps, and provides personalized feedback to help you achieve perfect technique.

---

## 🎯 What is Imperfect Coach?

Imperfect Coach is an advanced web-based fitness application that uses computer vision and AI to provide real-time form analysis and coaching for your workouts. Simply use your camera, and our AI coaches will guide you through exercises with instant feedback.

**🔗 Live Demo:** [Try Imperfect Coach](https://imperfectcoach.netlify.app)

---

## ✨ Key Features

### 🎥 Real-Time Form Analysis
- **Advanced Pose Detection**: 17-point body tracking using TensorFlow.js
- **Instant Feedback**: Real-time form corrections and technique tips
- **Accurate Rep Counting**: Automatic repetition detection with range-of-motion validation
- **Form Scoring**: 0-100% accuracy rating for each exercise

### 🤖 AI-Powered Coaching
- **Multiple AI Coaches**: Choose from Gemini, OpenAI, or Anthropic-powered coaching
- **Personalized Feedback**: Tailored advice based on your specific form issues
- **Coaching Personalities**: Competitive, Supportive, or Zen coaching styles
- **Interactive Chat**: Ask questions about your performance and get detailed explanations

### 💪 Exercise Support
**Pull-ups**
- Elbow angle analysis and chin-over-bar verification
- Range of motion tracking and asymmetry detection
- Power and consistency scoring

**Jumps**
- Jump height measurement and landing technique analysis
- Power scoring and consistency tracking
- Form optimization suggestions

### 🏆 Performance Tracking
- **Blockchain Leaderboards**: Permanent score tracking on Base Sepolia
- **Progress Analytics**: Detailed performance metrics and improvement tracking
- **Achievement System**: Unlock milestones and earn on-chain NFT badges
- **Session History**: Review past workouts and track your journey

### 💎 Premium Analysis
- **Deep-Dive Reports**: Comprehensive AI analysis using Amazon Bedrock
- **Advanced Metrics**: Detailed form breakdown, consistency scoring, and personalized recommendations
- **Secure Payments**: Pay with USDC on Base Sepolia for premium features

---

## 🚀 Getting Started

### Prerequisites
- Modern web browser with camera access
- Optional: Coinbase Smart Wallet for blockchain features

### Quick Start
```bash
# Clone the repository
git clone https://github.com/thisyearnofear/imperfecthigher
cd imperfecthigher

# Install dependencies
bun install
# or npm install

# Start development server
bun run dev
# or npm run dev
```

### Using the App
1. **Grant Camera Access**: Allow the app to use your camera
2. **Choose Exercise**: Select pull-ups or jumps
3. **Select AI Coach**: Pick your preferred coaching style
4. **Start Working Out**: Follow real-time guidance and form analysis
5. **Track Progress**: View your performance analytics and compete on leaderboards

---

## 🛠️ Technology Stack

**Frontend**
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui components
- TensorFlow.js + MediaPipe for pose detection

**AI & Machine Learning**
- Multiple AI providers (Gemini, OpenAI, Anthropic)
- Amazon Bedrock (Nova Lite) for premium analysis
- Real-time pose estimation and movement analysis

**Blockchain**
- Wagmi + Viem for Ethereum interactions
- Coinbase Smart Wallet integration
- Base Sepolia network for fast, low-cost transactions

**Backend**
- Supabase Edge Functions for real-time AI coaching
- AWS Lambda for premium analysis processing
- x402pay protocol for seamless crypto payments

---

## 📊 Production Deployment

All systems are live and operational on Base Sepolia testnet:

### Smart Contracts
- **RevenueSplitter**: `0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA`
- **ImperfectCoachPassport**: `0x7c95712a2bce65e723cE99C190f6bd6ff73c4212`
- **Leaderboards**: Jumps & Pull-ups tracking with permanent records

### Infrastructure
- **Premium Analysis**: AWS Lambda deployed in eu-north-1
- **AI Coaching**: Supabase Edge Functions with multiple AI providers
- **Payment Processing**: Full x402pay integration with automatic settlement

---

## 💰 Economic Model

Imperfect Coach operates as an autonomous platform with transparent economics:

- **Free Tier**: Real-time coaching and basic analytics
- **Premium Tier**: $0.05 USDC for comprehensive AI analysis reports
- **Revenue Distribution**: 70% platform development, 20% user rewards, 10% referrals
- **Autonomous Treasury**: CDP Wallet manages payments and distributions automatically

---

## 🏗️ Architecture

The platform is built with modularity and performance in mind:

```
Frontend (React/TypeScript)
├── Real-time pose detection (TensorFlow.js)
├── AI coaching integration (multiple providers)
└── Blockchain wallet integration (Coinbase Smart Wallet)

Backend Services
├── Supabase Edge Functions (real-time AI coaching)
├── AWS Lambda (premium analysis)
└── Smart Contracts (payments, leaderboards, achievements)

Blockchain Layer (Base Sepolia)
├── Payment processing (x402pay)
├── Revenue distribution (RevenueSplitter)
└── Permanent records (leaderboards, NFTs)
```

---

## 📚 Documentation

For detailed implementation and deployment information:

- **[CDP & x402 Integration Guide](docs/CDP_X402_INTEGRATION_SUMMARY.md)** - Complete payment flow implementation
- **[Production Roadmap](docs/PRODUCTION_ROADMAP.md)** - Development phases and architecture decisions
- **[AWS Deployment Guide](aws-lambda/DEPLOYMENT_GUIDE.md)** - Backend service deployment instructions

---

## 📄 License

This project is licensed under the MIT License

---

## 🙏 Acknowledgments

- TensorFlow.js team for pose detection capabilities
- MediaPipe for computer vision models
- The AI providers (Google, OpenAI, Anthropic) for coaching intelligence
- shadcn/ui for beautiful component library
- Coinbase for Smart Wallet and CDP infrastructure

---

*Built with ❤️ for the fitness community. Submitted to Coinbase's "Agents in Action" hackathon.*
