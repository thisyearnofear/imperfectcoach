---
description: Integrate PayAI for x402 Monetization
---

# Implementation Plan - PayAI Integration

This plan integrates `@payai/x402` to handle the "receiving" side of the x402 protocol (monetization). This complements the 0xGasless AgentKit (which provides the "spending" identity side).

## Critical Analysis

> [!NOTE]
> We currently have a gap: `aws-lambda/index.mjs` verifies **signatures** (intent) but does not verify **settlement** (transaction success). A user could sign a challenge but essentially "mock" the payment without actually moving funds on-chain if we don't check for settlement.
> **PayAI solves this** by acting as a Facilitator that handles verification AND settlement.

## Proposed Changes

### 1. AWS Lambda (Server - Monetization)

**File**: `aws-lambda/package.json`
- [ ] Add dependency: `@payai/x402` (or `@payai/x402-node` if specific).

**File**: `aws-lambda/index.mjs`
- [ ] **Consolidation**: Replace our manual `verifyMessage` and signature checks with `PayAI.verify()`.
- [ ] **Enhancement**: Ensure `createPaymentChallenge` returns a valid PayAI-compatible challenge (PayAI likely has a helper for this too).
- [ ] This offloads the "trust" aspect to PayAI's facilitator network, ensuring we actually get paid.

### 2. Client Side (Payer)

**File**: `src/lib/payments/x402-signer.ts`
- [ ] Check if `AgentKit` (integrated in previous step) produces signatures compatible with `PayAI` verification. (They should both follow standard x402 specs).
- [ ] If PayAI requires specific metadata in the challenge, update the client to respect it.

## Verification Plan

### Automated Tests
- [ ] Run `test-x402-solana.mjs` (or updated `test-payai.mjs`).
- [ ] Verify that a valid signature results in a valid settlement check.

### Manual Verification
- [ ] Trigger a premium analysis request.
- [ ] Observe usage of the PayAI facilitator URL in the network tab (if applicable) or backend logs.
