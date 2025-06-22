# Production Roadmap: From MVP to Autonomous On-Chain Coach

**Status as of 2025-06-22:**

- **Phase 1: Core Architecture Solidified - COMPLETE**
  - `RevenueSplitter.sol` contract created.
  - `ImperfectCoachPassport.sol` and `CoachOperator.sol` refactored with a secure operator pattern.
- **Phase 2: Premium User Flow - IN PROGRESS**
  - Placeholder `premium-analysis` function created.
  - `deno.json` added to support Supabase function development.
  - Codebase refactored to be DRY with a new `pose-analysis` module.

---

This document outlines the strategic roadmap to evolve the Imperfect Coach from its current MVP state to a production-ready, autonomous on-chain coaching business, as envisioned in the `HACKATHON_PLAN.md`.

The focus is on creating a **DRY, performant, modular, and intuitive** codebase.

---

## Phase 1: Solidify the Core Architecture (Modularity & Performance)

This phase focuses on establishing distinct systems for the free and paid tiers, ensuring performance and creating a clean separation of concerns.

### 1. Evolve to a Two-Tier Backend System

- **Current:** Supabase Edge Functions handle all AI coaching requests.
- **Proposed:**
  - **Free Tier (Real-Time):** Continue using **Supabase Edge Functions** for the existing low-latency AI coaching (Gemini, OpenAI, etc.).
  - **Paid Tier (Deep Dive):** Introduce a new, dedicated **AWS Lambda function** to handle the premium, computationally intensive "Bedrock Deep Dive" analysis.
- **Rationale:**
  - **Performance:** Prevents expensive Bedrock analysis from impacting the real-time feedback system.
  - **Modularity:** Cleanly separates the logic and dependencies of the free and premium products.
  - **Cost-Efficiency:** Allows for independent optimization of infrastructure for each service.

### 2. Finalize the Smart Contract Suite

The existing contracts need to be production-ready and the core economic component must be added.

- **`ImperfectCoachPassport.sol` ([contracts/ImperfectCoachPassport.sol](contracts/ImperfectCoachPassport.sol)):**

  - **Action:** Ensure it is non-transferable (soulbound). The `updatePassport` function must be strictly permissioned, callable only by the `CoachOperator.sol` contract.

- **`CoachOperator.sol` ([contracts/CoachOperator.sol](contracts/CoachOperator.sol)):**

  - **Action:** This contract acts as the on-chain agent. It must be the designated operator with authority to call `updatePassport`. Its ownership should be transferred to a secure backend wallet (e.g., managed via AWS KMS) that the new Lambda function will use.

- **`RevenueSplitter.sol` (New Contract):**
  - **Action:** Create and deploy this new contract as outlined in the hackathon plan.
  - **Design:**
    - It will receive and hold funds from user payments (`x402pay`).
    - It will have a `distribute()` function to send funds to the Platform Treasury, User Rewards, and Referrers.
    - The `distribute()` function must be permissioned, callable only by the `CoachOperator` or a trusted admin.
  - **Modularity:** This isolates all financial logic into a single, auditable contract.

---

## Phase 2: Implement the Premium User Flow (DRY & Intuitive)

This phase connects the new architecture with a seamless user experience, focusing on code reuse and clear frontend components.

### 1. Key Bedrock Integration Insights

Based on the AWS documentation, our integration strategy will be as follows:

- **SDK:** We will use the **AWS SDK for JavaScript v3** within the `premium-analysis` Lambda function. Its modular nature allows us to bundle only the necessary Bedrock client, keeping the function lightweight.
- **Initial API Choice:** For the "Deep Dive" feature, the `InvokeModel` API is the most direct and appropriate choice. It allows us to send a single, comprehensive workout data payload and receive a detailed analysis.
- **Future Evolution (Autonomous Agent):** The **Bedrock Agents** framework, combined with the `Converse` API and its **Tool Use** capability, provides a clear path for evolving the coach into a truly autonomous agent. We can define our on-chain functions (like `updatePassport`) as tools that the agent can decide to call, fulfilling the project's ultimate vision.

### 2. Implement the `x402pay`-Gated Endpoint

- **Action:** Create a new API endpoint, e.g., `POST /analyze-workout`. This endpoint will be fronted by an API Gateway that integrates with **`x402pay`** for payment verification and triggers the new AWS Lambda function.

### 3. Orchestrate the "Deep Dive" Flow

1.  **Frontend:** User clicks "Unlock Deep Dive." The app uses an `x402pay` client to handle the payment.
2.  **API Call:** On successful payment, the frontend sends the workout data to `POST /analyze-workout`.
3.  **Backend (Lambda):**
    a. Verifies the `x402pay` receipt.
    b. Invokes **Amazon Bedrock** for the rich analysis.
    c. Calls the `updatePassport` function on-chain via the `CoachOperator`.
    d. Returns analysis results to the frontend.

### 4. Keep the Codebase DRY (Don't Repeat Yourself)

- **Problem:** Client-side processors ([`jumpProcessor.ts`](src/lib/exercise-processors/jumpProcessor.ts), [`pullupProcessor.ts`](src/lib/exercise-processors/pullupProcessor.ts)) and the premium backend both need to analyze pose data.
- **Solution:** Refactor the core pose analysis logic into a shared utility module (e.g., `src/lib/pose-analysis/`).
  - This module will contain functions to extract keypoints, angles, etc.
  - Both the client-side processors and the frontend (when preparing the premium payload) will use this shared module.

### 5. Build the Frontend Experience

- **Payment UI (`x402pay`):**

  - **Strategy:** We will use the `x402-fetch` library to handle the client-side payment flow. This library wraps the standard `fetch` API to automatically manage the HTTP 402 `Payment Required` challenge.
  - **Implementation:**
    1.  Create a new `PremiumAnalysisUpsell.tsx` component. This will be a modal that clearly presents the value of the "Deep Dive" analysis for a small fee (e.g., $0.25).
    2.  When the user clicks the "Pay and Analyze" button, the component will use a `fetch` instance wrapped with `wrapFetchWithPayment` from `x402-fetch`.
    3.  The wrapped fetch will call our `POST /analyze-workout` endpoint. The `x402-fetch` library will handle the 402 response, prompt the user to sign the payment with their connected wallet, and automatically resubmit the request with the required `X-PAYMENT` header.
  - **Component Placement:** This new upsell component will be integrated into the `PostWorkoutFlow.tsx` component, presenting the offer to the user immediately after they complete a free workout session.

- **`MyPassport` Component:** Create a component to display the WIP Passport NFT.
  - It should fetch and render NFT metadata (`level`, `totalReps`) from its metadata URI using `wagmi`/`viem`.
  - This will be the centerpiece of the user's "My Progress" dashboard.

---

## Phase 3: Activate the Autonomous Economic Loop

This final phase brings the self-sustaining on-chain business to life.

### 1. Channel Revenue

- **Action:** Configure the `x402pay` integration to direct all payments to the address of the `RevenueSplitter.sol` contract.

### 2. Automate Payouts

- **Action:** Implement a mechanism to trigger the `RevenueSplitter.sol` contract's `distribute()` function.
  - **Automation:** A scheduled task (e.g., AWS EventBridge rule) can call `distribute()` periodically.
  - **Initial Step:** Begin by calling this function manually via a secure admin interface.

### 3. On-Chain Referrals

- **Action:** Extend the `RevenueSplitter.sol` to manage referrer addresses and their revenue shares, enabling automated, on-chain referral payouts.
