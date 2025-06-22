# Imperfect Coach: Agents in Action Hackathon Plan

## 1. The Vision: The Autonomous On-Chain Coach

Our project, **Imperfect Coach**, is an AI-powered fitness platform that helps users improve their exercise form. For this hackathon, we are elevating it into an **autonomous, on-chain coaching business**.

The core of this vision is the **"Work-in-Progress (WIP) Passport" NFT**: a dynamic, soulbound token that represents a user's fitness journey. The AI coach itself becomes an autonomous agent that manages its own economics—charging for its services, rewarding users for their progress, and paying contributors, all on-chain.

This directly aligns with our brand of being "less imperfect every day" and becoming "on-chain olympians."

## 2. Feature Tiers & Differentiation

To create a compelling user funnel and justify the pay-per-use model, we will establish clear feature tiers.

### Tier 1: "Guest" (Disconnected User - Free)

- **Access:** Users can access the **real-time, client-side form analysis** for free. This provides instant visual feedback and rep counting during the workout using TensorFlow.js.
- **The "Free Sample":** This is our core acquisition loop. It showcases the power of our computer vision technology. The feedback is immediate but ephemeral—it is not saved.
- **Limitation:** No historical tracking, no in-depth analysis, and no on-chain identity.

### Tier 2: "Olympian in Training" (Connected User - Paid)

- **Access:** By connecting their **CDP Wallet**, users can engage with the paid, on-chain features.
- **The Differentiation (Why they pay with x402pay):**
  1.  **"The Bedrock Deep Dive":** The payment unlocks a comprehensive, server-side analysis of their entire workout video via **Amazon Bedrock**. This is our premium feature. It goes beyond real-time cues to identify subtle patterns, consistency metrics, and generates a rich, actionable summary.
  2.  **"Proof-of-Progress" NFT Mint/Update:** The results of this "Deep Dive" are used to mint or update their **WIP Passport NFT**. This creates a permanent, verifiable on-chain record of their achievements.
  3.  **Historical Analytics:** Unlocks access to the "My Progress" dashboard to track their journey over time.

## 3. Hackathon Strategy: Targeting "Best Use of x402pay + CDP Wallet"

Our primary target is the **$5,000 "Best Use of x402pay + CDP Wallet" prize**, including the **$10,000 AWS Activate bonus**. Our tiered model provides a perfect use case.

### How We Meet the Criteria:

- **The Payment Loop (Revenue In → Payment Out):**

  - **Revenue In:** Users pay a small fee (e.g., $0.25) per workout analysis using **x402pay**. This gates access to the high-quality AI feedback.
  - **Payment Out:** The revenue is automatically split and disbursed via **CDP Wallet** to multiple parties:
    1.  **Platform Treasury:** To cover AI model inference costs (e.g., Amazon Bedrock).
    2.  **User Rewards:** A portion can be "reflected" back to users who maintain high consistency or hit milestones, funding their next analysis.
    3.  **Coach/Referrer Payouts:** An onchain referral system on BASE, contributors get an automatic cut.

- **The Autonomous Agent:**

  - Our AI Coach is the agent. It's a self-funding application that uses its own CDP Wallet to manage its treasury and execute payouts without manual intervention.

- **Real-World Relevance & Creativity:**
  - We are tackling the massive fitness and wellness market with a novel web3-native business model. The evolving "WIP Passport" NFT is a creative primitive that makes on-chain interaction meaningful and personal.

## 4. The User Experience Flow (Demo Narrative)

This flow is designed to be a compelling 5-minute demo.

1.  **The Free Experience:** A "Guest" user starts a workout. They receive **free, real-time form feedback** directly on their screen. It's helpful, but it disappears after the session.
2.  **The On-Chain Offer:** After the workout, the user is presented with an offer: "Unlock your full potential. Get a permanent record and a deep-dive analysis of your workout for just $0.25."
3.  **Onboarding & Payment:** The user connects their **CDP Wallet**. They approve the **$0.25 payment via x402pay** and, in the same flow, mint their free **"WIP Passport" NFT**.
4.  **The Bedrock Deep Dive:** The payment unlocks the premium analysis. Our **Amazon Bedrock** agent processes the full workout video, generating in-depth insights.
5.  **The Reward & On-Chain Proof:** The user sees their detailed analysis. In parallel, their Passport NFT is updated on-chain with the new stats, visibly "leveling up" on their "My Progress" page.
6.  **The Autonomous Payout:** The agent's CDP Wallet automatically splits the $0.25 revenue as planned, demonstrating the complete, self-sustaining economic loop.

## 5. Technical Architecture

- **Smart Contracts (Solidity):**

  - `ImperfectCoachPassport.sol`: An ERC-721 soulbound (non-transferable) contract. It will have public metadata traits (`level`, `totalReps`, `personalBest`) and an `updatePassport` function restricted to our system's wallet.
  - `RevenueSplitter.sol`: A simple contract managed by our agent's CDP Wallet to handle the logic for fund disbursement.

- **Backend (Supabase Edge Functions / AWS Lambda):**

  - `POST /analyze-workout`: A `x402pay`-gated endpoint. It verifies the payment receipt and then invokes an **Amazon Bedrock** model for the form analysis.
  - `POST /update-passport`: An internal endpoint called after successful analysis to trigger the on-chain metadata update.

- **Frontend (React/Vite):**
  - Integrate the `x402pay` client to handle the API payment flow.
  - Create a `MyPassport` component to render the dynamic NFT image and traits from its metadata URI.
  - Build a simple, clear UI for the "Pay for Analysis" step.

## 6. AWS Bedrock Integration (For the Bonus Prize)

We will use **Amazon Bedrock** as the "brain" for our premium, paid analysis, creating a clear distinction from the free tier.

- **Differentiated Use Case:**
  - **Free Tier:** Uses client-side TensorFlow.js for real-time, frame-by-frame feedback.
  - **Paid Tier (`x402pay` Gated):** Uses a powerful **Amazon Bedrock** model for a holistic, post-workout "Deep Dive" analysis. This is our value proposition for payment—a more sophisticated, computationally intensive analysis that provides richer insights than the real-time version.
- **Justification:** This tiered approach makes our use of Bedrock a clear, premium service, justifying the monetization and making it a perfect fit for the bonus prize. The integration is deep, essential, and directly tied to the revenue model.

This revised plan positions **Imperfect Coach** as a premier entry for the Agents in Action hackathon, with a clear user funnel and a powerful, differentiated value proposition.

---

potential paid extra

Option 2: Track Key Metrics Throughout the Rep
What to add: Instead of just sending the final angles, we could capture the minimum and maximum angles for the elbows and shoulders during the entire repetition. This would give the AI a much better sense of the user's full range of motion.
Trade-offs:
Pros: This provides a much more detailed picture of the user's movement, allowing for more precise feedback on range of motion.
Cons: This is a more complex change, as it requires us to store and manage these values throughout the rep. It would also increase the size of the data payload.
Option 3: Send the Full Pose Data
What to add: We could send the complete set of 33 keypoints for the entire body at the top and bottom of the repetition. This would give the AI the most comprehensive possible view of the user's form.
Trade-offs:
Pros: This is the most powerful option, giving the AI complete freedom to analyze any aspect of the user's pose. It could lead to the most insightful and unexpected feedback.
Cons: This is the most complex option to implement and would significantly increase the size of the data payload, which could have performance implications.
