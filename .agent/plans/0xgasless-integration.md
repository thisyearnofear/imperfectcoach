---
description: Integrate 0xGasless AgentKit for x402 Payment Protocol
---

# Implementation Plan - 0xGasless AgentKit Integration

This plan integrates `@0xgasless/agentkit` into the `imperfectcoach` ecosystem to robustly handle x402 identity and payments, replacing manual verification logic where possible and enabling true Agent-to-Agent interaction capabilities.

## User Review Required

> [!IMPORTANT]
> This plan replaces custom "manual" x402 verification code with the `@0xgasless/agentkit`. 
> **Impact**: 
> - `aws-lambda/index.mjs`: Significant code reduction (consolidation).
> - `package.json`: Adding 1 dependency.
> - `Client Compatibility`: We must ensure our client `x402-signer.ts` generates signatures compatible with AgentKit's verification.

## Proposed Changes

### 1. AWS Lambda Agent (Server Side)

**File**: `aws-lambda/package.json`
- [ ] Add dependency: `@0xgasless/agentkit`

**File**: `aws-lambda/index.mjs`
- [ ] Import `AgentKit` and `X402Facilitator`.
- [ ] Initialize Agent Identity (even if just for receiving payments initially).
- [ ] **Consolidate**: Replace custom `createPaymentChallenge` and `verifyPaymentSignature` with `AgentKit.createChallenge()` and `AgentKit.verify()`.
- [ ] Ensure the "Payment Required" (402) response format matches the 0xGasless standard.

### 2. Client Side (Frontend)

**File**: `src/lib/payments/x402-signer.ts`
- [ ] Audit `signChallenge` to ensure it matches AgentKit's expected signing format (likely keeping it simple, but ensuring serialization aligns).
- [ ] Enhance `X402Challenge` interface availability.

### 3. Documentation

**File**: `docs/ARCHITECTURE.md`
- [ ] Update "x402" section to reflect the use of `0xGasless AgentKit`.
- [ ] Remove manual "Correct x402 Flow" description if AgentKit abstracts it differently.

## Verification Plan

### Automated Tests
- [ ] Run `node aws-lambda/test-x402-solana.mjs` (or create new `test-agentkit.mjs`) to verify the new Lambda flow accepts signatures.
- [ ] Verify both **Base** and **Avalanche** configurations work (AgentKit should support multi-chain).

### Manual Verification
- [ ] Start Lambda locally.
- [ ] Trigger a payment challenge.
- [ ] Sign via frontend/script.
- [ ] Verify successful 200 OK response.
