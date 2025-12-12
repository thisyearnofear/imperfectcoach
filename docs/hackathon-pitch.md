# Imperfect Coach - Hack2Build: Payments x402 Pitch Script

**Project:** Imperfect Coach
**Track:** AI-Powered Financial Agents / Consumer Payments & API Services
**Network:** Avalanche Fuji

---

## 1. The Hook (30 Seconds)
*(Screen: Show a split screen. Left side: "Traditional Coach: $350/mo". Right side: "Imperfect Coach: $0.10/session")*

**Speaker:**
"Elite fitness coaching is a luxury. You either pay $350 a month for a human expert who manages your form, nutrition, and recovery... or you use a free app that just counts your steps. There is no middle ground."

"But what if you could hire a team of experts—a biomechanist, a nutritionist, and a head coach—for ten cents?"

"<b>Meet Imperfect Coach.</b> We didn't just build an AI assistant. We built an <b>Agent Economy</b>. Using x402 and Avalanche, our AI doesn't just 'chat' with you—it hires other agents to help you."

---

## 2. The Tech & The "Magic" (45 Seconds)
*(Screen: Architecture Diagram showing User -> Lead Agent -> Specialist Agents, connected by x402 payment lines)*

**Speaker:**
"Here is the breakthrough. Most AI apps are monolithic. We built a modular swarm of agents, powered by the **x402 Protocol**.

1.  **The User** pays a micro-fee (USDC on Avalanche) to unlock the **Lead Coach Agent**.
2.  **The Lead Agent** (running on AWS Lambda with Bedrock Nova Lite) analyzes your request.
3.  **The Magic:** If the Lead Agent sees you need specialized help—like deep form analysis or a custom meal plan—it acts as an *economic agent*. It uses its own wallet to **pay** specialized micro-services (Specialist Agents) in real-time.

"This is **Agent-to-Agent (A2A) Commerce**. No subscriptions. No API keys. Just autonomous agents paying each other for services using x402 standards."

---

## 3. The Demo (90 Seconds)
*(Screen: The Imperfect Coach App - 'ServiceBookingFlow' / 'AgentCoachUpsell' Screen)*

**Speaker:**
"Let's see it live on Avalanche Fuji."

**(Action: User finishes a workout/game on screen. Click 'Agent Access' button.)**
"I've just finished a squat session. I want a Pro Analysis. I click 'Unlock Agents'.

**(Action: 402 Payment Challenge popup appears.)**
"Immediately, the API responds with a **402 Payment Required** challenge. This isn't a stripe checkout. It's a cryptographic challenge. I sign this with my wallet—paying just $0.10 USDC."

**(Action: 'Processing... Agent Reasoning' animation.)**
"Now, the **Lead Coach Agent** wakes up. It sends the payment proof to the backend. But watch the logs..."

**(Action: Show Terminal/Logs overlay visualizing the backend logic.)**
"The Lead Coach analyzes my form score (85%). It realizes I have a mobility issue. It decides: *"I need a biomechanics expert."*

"The Lead Coach **autonomously sends a micropayment** to the **Biomechanics Specialist Agent**. The Specialist proves its worth, returns the data, and the Lead Coach synthesizes it all."

**(Action: Final Analysis Report appears on screen with 'Nutrition' and 'Form' sections.)**
"And here is the result. A fully personalized report, sourced from multiple expert AI models, settled instantly on-chain. $350 of value for one dime."

---

## 4. Why This Matters (Closing)
*(Screen: Slides with 'Impact' points)*

**Speaker:**
"We aren't just selling fitness. We are proving a new business model for the AI era:
1.  **Monetization for Agents:** Developers can build 'Specialist Agents' (e.g., a perfect Squat Analyzer) and monetize them via x402 without building a full UI. Other agents will pay them!
2.  **Privacy & Granularity:** Users pay *per workout*, not for a monthly sub they'll forget to cancel.
3.  **Avalanche Speed:** Instant settlement makes this agent-to-agent chatter feel real-time."

"Imperfect Coach is the first step toward a world where AI agents are economic citizens. Thank you."

---

## Appendix: Technical Highlights for Judges

*   **Protocol:** [x402](https://x402.org/) (HTTP 402 Payment Required Standard)
*   **Infrastructure:** AWS Lambda (Serverless Agents) + Amazon Bedrock (Nova Lite Models)
*   **Blockchain:** Avalanche Fuji (USDC Settlement)
*   **Agent Identity:** Coinbase Developer Platform (CDP) MPC Wallets / AgentKit
*   **Key Innovation:** First implementation of recursive x402 payments (User pays Agent -> Agent pays Agent).
