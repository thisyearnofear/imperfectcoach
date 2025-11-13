# 🏋️ Imperfect Coach - User Guide

**Autonomous AI Agent for Personalized Fitness Coaching**

> 🤖 **Solana x402 Hackathon Submission**  
> Target: Best x402 Agent Application ($20,000 prize)

## 🎯 What is Imperfect Coach?

Imperfect Coach is an **autonomous AI agent system** that combines computer vision, multi-step reasoning, and tool integration to deliver personalized fitness coaching. The agent independently analyzes workout performance, queries historical data, benchmarks against similar athletes, and generates adaptive training plans—all without human intervention.

We're transforming AI agents from simple payment users to payment optimizers with intelligent multi-chain routing.

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

## 🚀 Quick Start

### For Users
1. Visit [imperfectcoach.netlify.app](https://imperfectcoach.netlify.app)
2. Grant camera access
3. Choose exercise (pull-ups or jumps)
4. Select coach personality
5. Work out with real-time feedback
6. Optionally upgrade to Premium or Agent tier for deeper insights

### Payment Experience
```
User: "I want analysis" → Click "Smart Pay" → AI chooses optimal chain → Pay → Get result
```

The AI analyzes payment context and automatically selects:
- **Micro-payments (<$0.01)**: Solana for ultra-low fees (90%+ savings)
- **Premium Analysis ($0.05)**: User choice with cost optimization
- **Agent Coaching ($0.10)**: Base for established infrastructure

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

## 🙋 FAQs

**Q: Do I need to pay for every workout?**
A: No! Free tier is always available. Only pay when you want deep analysis or agent coaching.

**Q: Can I use Agent tier without Premium?**
A: Yes! Each tier stands alone. Agent includes everything from Premium plus autonomous coaching.

**Q: How long does Agent analysis take?**
A: Typically 10-15 seconds. You'll see progress in real-time.

**Q: What if I don't have crypto?**
A: Set up Coinbase Smart Wallet in 2 minutes. We'll guide you through it.

**Q: Does the agent really make autonomous decisions?**
A: Yes! Watch it work - you'll see it independently choose which tools to use based on your data.

**Q: Is my workout data private?**
A: Absolutely. Only you can see your analysis. We don't share data.

## 💪 Exercise-Specific Features

### Pull-Up Detection & Communication Improvements

#### ReadinessSystem.ts - Pull-Up Posture Analysis
- Validates all 13 required keypoints (nose, wrists, elbows, shoulders, hips, knees, ankles)
- Detects if user is in hanging position vs standing
- Provides specific feedback for lower body visibility issues
- Checks upper body critical points (head, hands, shoulders)
- Suggests optimal camera angles (45° or side view)
- Progressive scoring system (0-100) with severity-based issues

#### PoseDetectionGuide.tsx - Exercise-Specific Requirements
- Shows required keypoints count for each exercise:
  - **Pull-ups:** "Head, hands, elbows, shoulders, hips, knees, feet (13 points)"
  - **Jumps:** "Shoulders, hips, knees, ankles (8 points)"
- Includes camera angle tip for pull-ups: "Tip: Side or 45° angle works best"
- Tasteful, compact design that doesn't overwhelm users

#### pullupProcessor.ts - Specific Visibility Feedback
- Enhanced keypoint visibility checking with specific body part feedback
- Replaced generic "Make sure you're fully in view!" with actionable messages
- Identifies exactly which body parts aren't visible:
  - "Can't see your hands"
  - "Can't see your feet & knees"
- Smart aggregation: "Step back - need to see full body" when 3+ parts missing

#### drawing.ts - Enhanced Visual Feedback
- Improved `drawFormZone()` for pull-ups with better visual cues
- Added labeled reference lines and success indicators
- "Chin target" line (green) shows where nose needs to reach
- "Full extension" line (yellow) calculated from arm length
- Green circle appears around nose when chin is over bar
- Only shows zones when actually hanging (prevents clutter)
- Subtle, non-intrusive labels for clarity

### Jump Detection & Communication Improvements

#### PoseDetectionGuide.tsx - Jump-Specific Requirements
- Shows required keypoints count for jumps: "Shoulders, hips, knees, ankles (8 points)"
- Provides clear visual guidance for optimal positioning

#### jumpProcessor.ts - Enhanced Jump Analysis
- Accurate jump height measurement with granular feedback
- Landing technique analysis with knee flexion scoring
- Explosiveness detection based on takeoff velocity
- Flight symmetry analysis to detect body drift
- Landing impact analysis to prevent injury
- Power endurance bonuses for consistent performance

#### Visual Feedback System
The system provides real-time visual cues during jumps:

👁️ **Visual Signals Guide**
Watch for these visual cues during your workout:

📸 **Screen Flash** - Red flash when poor form detected
📍 **Landmarks** - Yellow dots show detected body points
✅ **Ready State** - Green indicates good starting position
🔄 **Rep Count** - Blue pulse when rep is counted

💡 Keep your whole body visible in the frame for best results

🦘 **Jumps requires:**
Shoulders, hips, knees, ankles (8 points)

## 📚 Documentation References

For technical documentation, see:
- **[Architecture](ARCHITECTURE.md)** - Complete system design
- **[Development](DEVELOPMENT.md)** - Setup and development guides
- **[Deployment](DEPLOYMENT.md)** - Deployment procedures
- **[Solana Payments](SOLANA_PAYMENTS.md)** - Solana payment implementation

---
*Built with ❤️ for athletes everywhere. Powered by Amazon Bedrock AgentCore.*