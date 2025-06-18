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

## 🎮 How to Use

1. **Grant Camera Access**: Allow the app to use your camera
2. **Choose Exercise**: Select pull-ups or jumps
3. **Select Coach**: Pick your AI coach and personality
4. **Choose Mode**: Training (with feedback) or Assessment (silent testing)
5. **Start Working Out**: Follow the real-time guidance and form analysis

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
