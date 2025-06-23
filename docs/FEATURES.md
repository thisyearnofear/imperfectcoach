# Imperfect Coach - Features Documentation

## 🧹 Recently Cleaned Up (v2.0 Refactor)

### Removed Components & Functionality

#### 1. **useBlockchainScores Hook** ❌

- **Status**: Completely removed (redundant with UserContext)
- **Reason**: Duplicated functionality now handled by UserContext
- **Migration**: All blockchain interactions now use `useUserBlockchain()` hook

#### 2. **Complex BottomSection Interface** ❌

- **Before**: 24 props including analytics, chat, summaries
- **After**: 6 essential props (reps, formScore, repHistory, exercise, debug)
- **Reason**: Streamlined for mobile UX, reduced cognitive load

#### 3. **Always-Visible Advanced Features** ❌

- **Removed**: Auto-expanded performance analytics, AI coach selection, achievements
- **Replaced**: Progressive disclosure with collapsible sections
- **Reason**: Overwhelming for mobile users, poor conversion to blockchain submission

## 🎯 Current Active Features

### Core Workout Experience

- ✅ **Exercise Selection**: Pull-ups, Jumps
- ✅ **Real-time Form Analysis**: TensorFlow.js pose detection
- ✅ **Rep Counting**: Computer vision based
- ✅ **Form Scoring**: Real-time feedback (0-100%)
- ✅ **Workout Modes**: Training vs Assessment

### Blockchain Integration

- ✅ **Wallet Connection**: Coinbase Smart Wallet
- ✅ **SIWE Authentication**: Sign In With Ethereum
- ✅ **Score Submission**: Contract interaction on Base Sepolia
- ✅ **Global Leaderboard**: Real-time blockchain data
- ✅ **Transaction Tracking**: CDP-powered insights
- ✅ **Basename Resolution**: ENS-style addresses

### User Experience

- ✅ **Progressive Disclosure**: Context-aware UI flow
- ✅ **Mobile-First**: Optimized for phone usage
- ✅ **Smart Refresh**: Manual refresh with staleness indicators
- ✅ **Visual Hierarchy**: Blue (setup) → Green (success) color system

## 🚧 Features Temporarily Removed (Available for Re-integration)

### 1. **AI Coach Summaries** 📋

- **Component**: `CoachSummarySelector.tsx` (still exists)
- **Functionality**: Multi-model AI feedback (Gemini, OpenAI, Anthropic)
- **Status**: Hidden in advanced section, needs prop integration
- **Re-integration Plan**: Add to PostWorkoutFlow advanced section with proper props

### 2. **Performance Analytics** 📊

- **Component**: `PerformanceAnalytics.tsx` (still exists)
- **Functionality**: Detailed charts, rep timing analysis, session metrics
- **Status**: Placeholder in advanced section
- **Re-integration Plan**: Add back with simplified props interface

### 3. **Achievement System** 🏆

- **Component**: `UnlockedAchievements.tsx` (still exists)
- **Functionality**: Milestone tracking, badges, progress indicators
- **Status**: Completely removed from UI flow
- **Re-integration Plan**: Add to PostWorkoutFlow or separate achievements page

### 4. **AI Chat Interface** 💬

- **Functionality**: Real-time chat with AI coaches during/after workouts
- **Status**: Props removed, backend still functional
- **Re-integration Plan**: Consider dedicated chat page or sidebar

### 5. **Detailed Analytics Dashboard** 📈

- **Components**: Full `PerformanceAnalytics` with chat, summaries, timings
- **Status**: Simplified to placeholder
- **Re-integration Plan**: Create dedicated analytics page for power users

## 🔮 Future Feature Roadmap

### Short Term (Next 2-4 weeks)

- [ ] **Re-integrate AI Coach Summaries** in PostWorkoutFlow advanced section
- [ ] **Add Achievement Notifications** for milestone completion
- [ ] **Enhanced Transaction Status** with real-time confirmations
- [ ] **Leaderboard Filtering** by timeframe, personal bests

### Medium Term (1-2 months)

- [ ] **Dedicated Analytics Page** for detailed performance tracking
- [ ] **Social Features**: Follow other athletes, team challenges
- [ ] **Multi-Chain Support**: Expand beyond Base Sepolia
- [ ] **NFT Achievements**: Mint workout milestones as NFTs

### Long Term (3+ months)

- [ ] **AI Personal Trainer**: Adaptive workout programs
- [ ] **Live Competitions**: Real-time multiplayer challenges
- [ ] **Integration with Fitness Devices**: Apple Health, Garmin, etc.
- [ ] **DAO Governance**: Community-driven feature development

## 🔧 Developer Notes

### Code Architecture

- **Clean Separation**: UI components vs business logic
- **Single Source of Truth**: UserContext for all user state
- **Progressive Enhancement**: Features unlock based on user state
- **Mobile-First**: All components responsive by default

### Re-integration Guidelines

1. **Maintain Progressive Disclosure**: Don't overwhelm users
2. **Keep Props Minimal**: Use context for shared state
3. **Test Mobile Experience**: Ensure features work on small screens
4. **Preserve Performance**: Lazy load heavy features

### Dependencies to Watch

- `@coinbase/coinbase-sdk`: For enhanced CDP features
- `thirdweb`: For basename resolution
- `wagmi`: Core blockchain interactions
- `@tensorflow/tfjs`: Computer vision features

## 📊 Impact Metrics

### Before Refactor (Metrics to Beat)

- High bounce rate after workout completion
- Low blockchain submission conversion (~15%)
- Mobile users overwhelmed by information density

### Target Metrics (v2.0)

- [ ] > 40% blockchain submission conversion
- [ ] <3 second time-to-understand next action
- [ ] > 80% mobile user satisfaction
- [ ] <2 clicks to complete primary action

## 🤝 Contributing

When adding features back:

1. Start with PostWorkoutFlow integration
2. Keep mobile experience as priority
3. Use progressive disclosure patterns
4. Test with real users before deployment
5. Update this document with changes

---

## Blockchain Contracts (Deployed June 2025)

- **ImperfectCoachPassport.sol**: `0x7c95712a2bce65e723cE99C190f6bd6ff73c4212`
- **CoachOperator.sol**: `0xdEc2d60c9526106a8e4BBd01d70950f6694053A3`
- **RevenueSplitter.sol**: `0x6C9BCfF8485B12fb8bd73B77638cd6b2dD0CF9C`

**RevenueSplitter Configuration:**

- Payees: `["0x55A5705453Ee82c742274154136Fce8149597058", "0x3D86Ff165D8bEb8594AE05653249116a6d1fF3f1", "0xec4F3Ac60AE169fE27bed005F3C945A112De2c5A"]`
- Shares: `[70, 20, 10]`
- Initial Owner: `0xdEc2d60c9526106a8e4BBd01d70950f6694053A3`

---

**Last Updated**: December 2024  
**Version**: 2.0 (Post-UX Refactor)  
**Maintainer**: Development Team
