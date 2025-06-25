# 🏋️ Imperfect Coach

**AI-Powered Fitness Form Analysis & Coaching Platform**

Transform your workouts with real-time AI coaching that analyzes your form, counts your reps, and provides personalized feedback to help you achieve perfect technique.

## 🎯 What is Imperfect Coach?

Imperfect Coach is an advanced web-based fitness application that uses computer vision and AI to provide real-time form analysis and coaching for your workouts. Simply use your camera, and our AI coaches will guide you through exercises with instant feedback.

### 🚀 Key Features

- **🎥 Real-Time Form Analysis**: Advanced pose detection analyzes your movement patterns
- **🤖 Multiple AI Coaches**: Choose from Gemini, OpenAI, or Anthropic-powered coaching personalities
- **📊 Detailed Performance Analytics**: Track your progress with comprehensive metrics
- **🎯 Exercise Support**: Currently supports pull-ups and jumps with detailed form scoring
- **📱 Cross-Platform**: Works on desktop and mobile devices
- **🎨 Multiple Coach Personalities**: Competitive, Supportive, or Zen coaching styles
- **⏱️ Training & Assessment Modes**: Practice with feedback or test yourself silently
- **🔗 Blockchain Leaderboard**: Connect Coinbase Smart Wallet to compete on Base Sepolia
- **🏆 Permanent Score Tracking**: Your achievements are recorded forever on the blockchain

### 💪 Supported Exercises

**Pull-ups**

- Elbow angle analysis
- Range of motion tracking
- Asymmetry detection
- Chin-over-bar verification

**Jumps**

- Jump height measurement
- Landing technique analysis
- Power scoring
- Consistency tracking

## 🛠️ Technology Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui components
- **AI/ML**: TensorFlow.js + MediaPipe Pose Detection
- **AI Coaching**: Integration with Gemini, OpenAI, and Anthropic APIs
- **Backend**: Supabase Edge Functions (Deno runtime)
- **Blockchain**: Wagmi + Viem + Coinbase Smart Wallet
- **Network**: Base Sepolia (Ethereum L2)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Modern web browser with camera access
- Optional: AI API keys for enhanced coaching

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd imperfecthigher

# Install dependencies
bun install
# or
npm install

# Start development server
bun run dev
# or
npm run dev
```

### Environment Setup

Create a `.env.local` file for API keys (optional):

```env
VITE_GEMINI_API_KEY=your_gemini_key
VITE_OPENAI_API_KEY=your_openai_key
VITE_ANTHROPIC_API_KEY=your_anthropic_key
```

### Blockchain Setup

To enable blockchain features:

1. Deploy the smart contract to Base Sepolia (see `BLOCKCHAIN_SETUP.md`)
2. Update the contract address in `src/lib/contracts.ts`
3. Users can then connect their Coinbase Smart Wallet to compete!

## 🎮 How to Use

1. **Grant Camera Access**: Allow the app to use your camera
2. **Choose Exercise**: Select pull-ups or jumps
3. **Select Coach**: Pick your AI coach and personality
4. **Choose Mode**: Training (with feedback) or Assessment (silent testing)
5. **Start Working Out**: Follow the real-time guidance and form analysis
6. **Connect Wallet** (Optional): Link your Coinbase Smart Wallet to compete on the blockchain
7. **Submit Scores**: After workouts, submit your performance to the permanent leaderboard

## 📊 Features in Detail

### Real-Time Analysis

- **Pose Detection**: 17-point body tracking
- **Form Scoring**: 0-100% accuracy rating
- **Rep Counting**: Automatic repetition detection
- **Issue Detection**: Identifies form problems instantly

### AI Coaching

- **Personalized Feedback**: Tailored to your performance
- **Multiple Personalities**: Choose coaching style that motivates you
- **Progress Tracking**: Session summaries and improvement suggestions
- **Interactive Chat**: Ask questions about your performance

### Performance Analytics

- **Session Statistics**: Detailed breakdowns of each workout
- **Progress Charts**: Visual representation of improvement
- **Achievement System**: Unlock milestones as you progress
- **Export Data**: Download your performance history
- **Blockchain Leaderboard**: Compete with others on a tamper-proof leaderboard
- **Permanent Records**: Your best performances are stored forever on Base Sepolia

## 🚀 Deployment Status

**All systems deployed and operational on Base Sepolia!**

### 📄 Smart Contracts

| Contract                   | Address                                      | Status      |
| -------------------------- | -------------------------------------------- | ----------- |
| **ImperfectCoachPassport** | `0x7c95712a2bce65e723cE99C190f6bd6ff73c4212` | ✅ Deployed |
| **CoachOperator**          | `0xdEc2d60c9526106a8e4BBd01d70950f6694053A3` | ✅ Deployed |
| **RevenueSplitter**        | `0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA` | ✅ Deployed |
| **Jumps Leaderboard**      | `0xc5fB32a87A0D54f2AEbc773F0038d32c79AA1004` | ✅ Deployed |
| **Pullups Leaderboard**    | `0x69FD29376c3e77C494Fa4c25aac4A8810f511305` | ✅ Deployed |

### 🎯 Platform Features

- ✅ **Real-time pose detection** - Jump detection working perfectly
- ✅ **AI coaching integration** - Gemini, OpenAI, Anthropic powered feedback
- ✅ **Blockchain leaderboards** - Live on Base Sepolia with automatic score submission
- ✅ **Premium analysis** - Amazon Nova Lite integration with AWS Lambda deployed
- ✅ **Revenue distribution** - Autonomous 70/20/10 split to stakeholders
- ✅ **CDP Wallet integration** - Complete with autonomous treasury management

### 💰 Revenue Distribution

**RevenueSplitter Contract** (Traditional): `0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9CA`

- **Platform Treasury** (70%): `0x55A5705453Ee82c742274154136Fce8149597058`
- **User Rewards Pool** (20%): `0x3D86Ff165D8bEb8594AE05653249116a6d1fF3f1`
- **Referrer Pool** (10%): `0xec4F3Ac60AE169fE27bed005F3C945A112De2c5A`

**CDP Autonomous Treasury** (New - Successfully Deployed):

- **Treasury Account**: `0x7011910452cA4ab9e5c3047aA4a25297C144158a`
- **User Rewards Account**: `0x16FF42346F2E24C869ea305e8318BC3229815c11`
- **Referrer Account**: `0xF9468bd2D62E933ADbaD715D8da18c54f70dd94F`

### 🏆 Hackathon Status

**Targeting:** Coinbase "Agents in Action" Hackathon

- **Category**: Best Use of x402pay + CDP Wallet ($5,000 prize)
- **Bonus**: Amazon Bedrock integration ($10,000 AWS credits + SF demo)
- **Current**: MVP complete, CDP Wallet integration in progress

---

## 💎 Premium Analysis & Payment Flow

Unlock advanced AI-powered workout analysis with our premium tier:

- **Premium Analysis Service:**
  - **AWS Lambda Function:** `imperfect-coach-premium-analysis` deployed in `eu-north-1`
  - **AI Model:** Amazon Nova Lite (`amazon.nova-lite-v1:0`) for comprehensive fitness analysis
  - **API Endpoint:** `https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout`
  - **Performance:** 3-second response time with detailed analysis and actionable feedback
  - **Features:** Form analysis, consistency scoring, power assessment, and personalized recommendations
- **On-Chain Payment:**
  - Uses x402 payment protocol for secure, blockchain-based payments
  - Payments are sent directly to the RevenueSplitter contract
  - Integration ready for production deployment

## 💸 RevenueSplitter Contract

- **Address:** `0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9C`
- **Payees:**
  - `0x55A5705453Ee82c742274154136Fce8149597058` (70%)
  - `0x3D86Ff165D8bEb8594AE05653249116a6d1fF3f1` (20%)
  - `0xec4F3Ac60AE169fE27bed005F3C945A112De2c5A` (10%)
- **Shares:** `[70, 20, 10]`
- **Initial Owner:** `0xdEc2d60c9526106a8e4BBd01d70950f6694053A3`

---

## 🛣️ Roadmap & Future Plans

- **Phase 1:** Core architecture, smart contracts, and blockchain leaderboard (complete)
- **Phase 2:** Premium analysis, on-chain payments, and AWS integration (live)
- **Phase 3:** Autonomous economic loop, referral payouts, and advanced analytics (planned)

For full details, see `docs/PRODUCTION_ROADMAP.md` and `docs/ARCHITECTURE.md`.

---

## 🔧 Development

### Key Components

- **VideoFeed**: Camera integration and pose detection
- **ExerciseProcessor**: Movement analysis and rep counting
- **AIFeedback**: Integration with AI coaching APIs
- **PerformanceAnalytics**: Data visualization and statistics

### Build Commands

```bash
# Development
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Lint code
bun run lint
```

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- TensorFlow.js team for pose detection capabilities
- MediaPipe for computer vision models
- The AI providers (Google, OpenAI, Anthropic) for coaching intelligence
- shadcn/ui for beautiful component library
