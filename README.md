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

## Contracts

deployed on base sepolia

@/contracts/ImperfectCoachPassport.sol

ImperfectCoachPassport.sol
0x7ACE72cdD241e26be842381fF2AfAcBB9d969718

@/contracts/CoachOperator.sol

CoachOperator.sol
0x11640405F7552124dB36195158e59Ff791Df47C2

ExerciseLeaderboard.sol
0xa946cF9253Fe3734F3ea794DaEB7D5Dd7fB81E03

\_exercisename: jumps

ExerciseLeaderboard.sol
0xB6084cff5e0345432De6CE0d4a6EBdfDc7C4E82A

\_exercisename: pullups

config/tuple

addLeaderboard
exercise:
0x58857c61e1c66c3364b0e545b626ef16ecce5b7b1b9ab12c0857bcb9ee9d12d5
leaderboardAddress:
0xB6084cff5e0345432De6CE0d4a6EBdfDc7C4E82A
config:
[50, 300, 10, true]

addLeaderboard
exercise:
0x6b3e0e693d98ab1b983d1bfa5a9cbeb4004247dfd98cdb9ae7b2595f64132e41
leaderboardAddress:
0xa946cF9253Fe3734F3ea794DaEB7D5Dd7fB81E03
config:
[50, 300, 10, true]

Transfeed Passport Ownership
The CoachOperator needs to own the Passport contract to mint/update passports.

Authorized Leaderboard Operators
Each leaderboard needs to authorize the CoachOperator to add scores.
Call on each ExerciseLeaderboard contract:
solidityaddOperator

---

## 💎 Premium Analysis & Payment Flow

Unlock advanced AI-powered workout analysis with our premium tier:

- **Premium Analysis Service:**
  - Powered by AWS Lambda and Amazon Bedrock for deep-dive feedback
  - Public API Gateway endpoint: `https://viaqmsudab.execute-api.eu-north-1.amazonaws.com/analyze-workout`
  - Accessed via the PremiumAnalysisUpsell component in the app
- **On-Chain Payment:**
  - Uses x402 payment protocol for secure, blockchain-based payments
  - Payments are sent directly to the RevenueSplitter contract

## 💸 RevenueSplitter Contract

- **Address:** `0x3Daa73E9597DD13a3a8311E079C1406b1F52AF16`
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

### Project Structure

```
src/
├── components/          # React components
│   ├── sections/       # Layout sections
│   └── ui/            # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/               # Utilities and processors
│   ├── exercise-processors/  # Exercise-specific logic
│   └── types.ts       # TypeScript definitions
└── pages/             # Main application pages

supabase/
└── functions/         # Edge functions for AI processing
```

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

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues and pull requests.

### Development Guidelines

1. Follow TypeScript best practices
2. Use the existing component patterns
3. Add proper error handling
4. Test on both desktop and mobile
5. Ensure camera permissions work correctly

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- TensorFlow.js team for pose detection capabilities
- MediaPipe for computer vision models
- The AI providers (Google, OpenAI, Anthropic) for coaching intelligence
- shadcn/ui for beautiful component library
