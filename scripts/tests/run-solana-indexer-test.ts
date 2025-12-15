import { Buffer } from "buffer";
import { PublicKey } from "@solana/web3.js";
import { Response } from "undici";

// Ensure atob exists for the browser-specific logic inside the indexer
if (typeof (globalThis as any).atob === "undefined") {
  (globalThis as any).atob = (input: string) => Buffer.from(input, "base64").toString("binary");
}

// Provide Response globally for fetch mocks when running under Node
if (typeof (globalThis as any).Response === "undefined") {
  (globalThis as any).Response = Response;
}

/**
 * Set up a minimal Vite-like import.meta.env shim so the indexer can resolve its config
 */
function ensureImportMetaEnv() {
  const meta = import.meta as any;
  meta.env = meta.env || {};
  meta.env.VITE_SOLANA_DEVNET_RPC_URL = meta.env.VITE_SOLANA_DEVNET_RPC_URL || "https://api.devnet.solana.com";
  meta.env.VITE_HELIUS_API_KEY = meta.env.VITE_HELIUS_API_KEY || "test-helius-key";
}

ensureImportMetaEnv();

interface MockAccount {
  pubkey: string;
  account: {
    data: [string, string];
  };
}

function createMockAccount(pubkey: string, userPublicKey: string, stats: {
  totalScore: number;
  bestSingleScore: number;
  submissionCount: number;
  lastSubmissionTime: number;
  firstSubmissionTime: number;
}): MockAccount {
  const buffer = Buffer.alloc(8 + 32 + 8 * 7); // match minimum length expected (96 bytes)
  let offset = 0;

  // 8-byte discriminator (unused but keeps structure consistent)
  offset += 8;

  const userKey = new PublicKey(userPublicKey);
  buffer.set(userKey.toBuffer(), offset);
  offset += 32;

  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  view.setBigUint64(offset, BigInt(stats.totalScore), true);
  offset += 8;
  view.setBigUint64(offset, BigInt(stats.bestSingleScore), true);
  offset += 8;
  view.setBigUint64(offset, BigInt(stats.submissionCount), true);
  offset += 8;
  view.setBigUint64(offset, BigInt(stats.lastSubmissionTime), true);
  offset += 8;
  view.setBigUint64(offset, BigInt(stats.firstSubmissionTime), true);
  offset += 8;

  // Pad remaining slots to satisfy deserializer expectations
  view.setBigUint64(offset, 0n, true);
  offset += 8;
  view.setBigUint64(offset, 0n, true);

  const base64 = Buffer.from(buffer).toString("base64");

  return {
    pubkey,
    account: {
      data: [base64, "base64"],
    },
  };
}

async function main() {
  // Dynamically import modules after env shim is in place
  const [{ getTopUsersFromSolana, clearLeaderboardCache }, { SOLANA_JUMPS_PROGRAM_ID, SOLANA_PULLUPS_PROGRAM_ID }] = await Promise.all([
    import("@/lib/solana/indexer"),
    import("@/lib/solana/leaderboard"),
  ]);

  const testUser = "4FzyJeDxqRn2SKwVLdh2gi9MCvrSvgkCvHDZnNyBpd5v";

  const mockPullupAccount = createMockAccount(
    "PullupScore11111111111111111111111111111111",
    testUser,
    {
      totalScore: 42,
      bestSingleScore: 30,
      submissionCount: 4,
      lastSubmissionTime: 1_700_000_000,
      firstSubmissionTime: 1_699_000_000,
    }
  );

  const mockJumpAccount = createMockAccount(
    "JumpScore111111111111111111111111111111111",
    testUser,
    {
      totalScore: 128,
      bestSingleScore: 90,
      submissionCount: 6,
      lastSubmissionTime: 1_700_100_000,
      firstSubmissionTime: 1_698_000_000,
    }
  );

  const mockResponses = new Map<string, MockAccount[]>([
    [SOLANA_PULLUPS_PROGRAM_ID.toString(), [mockPullupAccount]],
    [SOLANA_JUMPS_PROGRAM_ID.toString(), [mockJumpAccount]],
  ]);

  globalThis.fetch = (async (_endpoint: string, requestInit?: RequestInit) => {
    const body = requestInit?.body as string;
    const { params } = JSON.parse(body);
    const [programId] = params;
    const items = mockResponses.get(programId) ?? [];

    return new Response(
      JSON.stringify({ result: { value: items, pageKey: undefined } }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }) as typeof fetch;

  clearLeaderboardCache();
  const results = await getTopUsersFromSolana(10);

  console.log("\n🔍 Mock Solana indexer output (top users)\n");
  console.table(
    results.map((entry) => ({
      user: entry.user,
      pullups: Number(entry.pullups),
      jumps: Number(entry.jumps),
      totalScore: entry.totalScore.toString(),
    }))
  );
}

main().catch((error) => {
  console.error("❌ Solana indexer test failed", error);
  process.exit(1);
});
