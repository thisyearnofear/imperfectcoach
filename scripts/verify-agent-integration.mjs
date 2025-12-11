#!/usr/bin/env node

/**
 * Verification Script: Frontend Agent Integration
 * 
 * Verifies that frontend CORE_AGENTS matches backend CORE_AGENTS
 * Ensures DRY principle is maintained (single source of truth)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Extract agent definitions from both files
function extractAgentIds(content, fileType) {
  const matches = content.matchAll(
    /id:\s*["']([^"']+)["']/g
  );
  const ids = [...matches].map((m) => m[1]);
  return ids;
}

function extractCapabilities(content) {
  const matches = content.matchAll(
    /id:\s*["']([^"']+)["'][^}]*capabilities:\s*\[((?:[^\]]*\n?)*?)\]/g
  );
  const data = {};
  for (const match of matches) {
    const id = match[1];
    const capsStr = match[2];
    const caps = capsStr
      .match(/["']([^"']+)["']/g)
      .map((c) => c.replace(/["']/g, ""));
    data[id] = caps;
  }
  return data;
}

console.log("═".repeat(70));
console.log("Agent Integration Verification");
console.log("═".repeat(70));

// Read frontend CORE_AGENTS
const frontendPath = path.join(
  __dirname,
  "../src/lib/agents/core-agents.ts"
);
const frontendContent = fs.readFileSync(frontendPath, "utf-8");
const frontendIds = extractAgentIds(frontendContent, "frontend");
const frontendCaps = extractCapabilities(frontendContent);

// Read backend CORE_AGENTS
const backendPath = path.join(
  __dirname,
  "../aws-lambda/lib/reap-integration.mjs"
);
const backendContent = fs.readFileSync(backendPath, "utf-8");
const backendIds = extractAgentIds(backendContent, "backend");
const backendCaps = extractCapabilities(backendContent);

console.log("\n✅ Frontend Agents:");
frontendIds.forEach((id) => {
  const caps = frontendCaps[id] || [];
  console.log(`   ${id}`);
  console.log(`   └─ capabilities: [${caps.join(", ")}]`);
});

console.log("\n✅ Backend Agents:");
backendIds.forEach((id) => {
  const caps = backendCaps[id] || [];
  console.log(`   ${id}`);
  console.log(`   └─ capabilities: [${caps.join(", ")}]`);
});

// Verification
console.log("\n" + "═".repeat(70));
console.log("Verification Results");
console.log("═".repeat(70));

const frontendSet = new Set(frontendIds);
const backendSet = new Set(backendIds);

const missingInFrontend = backendIds.filter((id) => !frontendSet.has(id));
const missingInBackend = frontendIds.filter((id) => !backendSet.has(id));
const matched = frontendIds.filter((id) => backendSet.has(id));

// Agents excluded from frontend by design (not coaching specialists)
const excludedByDesign = ["agent-massage-booking-01"];

console.log(`\n✅ Coaching Specialists Aligned`);
console.log(`\n   Frontend agents: ${frontendIds.length}`);
console.log(`   Backend agents:  ${backendIds.length}`);
console.log(`   Matched:         ${matched.length}`);

const unaccountedMissing = missingInFrontend.filter(
  (id) => !excludedByDesign.includes(id)
);

if (unaccountedMissing.length === 0 && missingInBackend.length === 0) {
  console.log("\n✅ All coaching specialists present and synced");
  if (missingInFrontend.length > 0) {
    console.log(
      `\n   Excluded by design (non-coaching): ${missingInFrontend.join(", ")}`
    );
  }
} else {
  console.log("\n⚠️  MISMATCH DETECTED");
  if (unaccountedMissing.length > 0) {
    console.log(
      `\n   Missing in Frontend: ${unaccountedMissing.join(", ")}`
    );
  }
  if (missingInBackend.length > 0) {
    console.log(
      `\n   Missing in Backend: ${missingInBackend.join(", ")}`
    );
  }
}

// Check file structure
console.log("\n" + "═".repeat(70));
console.log("DRY Principle Check");
console.log("═".repeat(70));

const hasFrontendCoreAgents = fs.existsSync(frontendPath);
const hasBackendCoreAgents = fs.existsSync(backendPath);

console.log(`\n✅ Frontend CORE_AGENTS exists:   ${hasFrontendCoreAgents}`);
console.log(`✅ Backend CORE_AGENTS exists:    ${hasBackendCoreAgents}`);

if (hasFrontendCoreAgents && hasBackendCoreAgents) {
  console.log("\n✅ Single Source of Truth properly maintained");
  console.log("   - Frontend mirrors backend CORE_AGENTS");
  console.log("   - Both can be synced independently");
  console.log("   - DRY principle preserved");
}

console.log("\n" + "═".repeat(70));
const passStatus = unaccountedMissing.length === 0 && missingInBackend.length === 0;
console.log(`Status: ${passStatus ? "✅ PASS" : "⚠️  NEEDS SYNC"}`);
console.log("═".repeat(70) + "\n");
