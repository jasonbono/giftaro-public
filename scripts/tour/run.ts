/**
 * Orchestrator for the app tour.
 *
 *   1. Wipe + re-create a local SQLite DB (scripts/tour/.tour.db).
 *   2. Push the Drizzle schema into it.
 *   3. Spawn `next dev` on port 3001 with stub env (local DB, fake Stripe).
 *   4. Wait for the dev server to be reachable.
 *   5. Run seed.ts (sign up users via better-auth, insert gifts/contributions).
 *   6. Run capture.ts (Playwright screenshots + intercepted email HTML).
 *   7. Build tour.html and open it.
 *   8. Kill the dev server on exit.
 *
 * The dev server is intentionally on a different port than the human's
 * `npm run dev` (3000) so the two don't collide.
 */
import { spawn, execSync, type ChildProcess } from "child_process";
import fs from "fs";
import path from "path";
import { seed } from "./seed";
import { capture } from "./capture";
import { buildHtml, currentBranch } from "./build-html";

const ROOT = path.resolve(__dirname, "../..");
const DB_FILE = path.join(__dirname, ".tour.db");
const DB_URL = `file:${DB_FILE}`;
const OUT_DIR = path.join(__dirname, "output");
const OUT_HTML = path.join(OUT_DIR, "tour.html");
const PORT = 3001;

const STUB_ENV: Record<string, string> = {
  PORT: String(PORT),
  TURSO_DATABASE_URL: DB_URL,
  TURSO_AUTH_TOKEN: "",
  BETTER_AUTH_SECRET: "tour-secret-not-for-prod-do-not-use-12345678",
  BETTER_AUTH_URL: `http://localhost:${PORT}`,
  GOOGLE_CLIENT_ID: "stub",
  GOOGLE_CLIENT_SECRET: "stub",
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: "stub",
  STRIPE_SECRET_KEY: "sk_test_stub",
  STRIPE_WEBHOOK_SECRET: "whsec_stub",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_stub",
  RESEND_API_KEY: "re_stub_tour_only",
  OPENAI_API_KEY: "sk-stub",
  NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}`,
};
// Set these in our own process so capture.ts (which runs in-process) sees
// them when it imports src/lib/email.ts.
for (const [k, v] of Object.entries(STUB_ENV)) process.env[k] = v;
const ENV = { ...process.env, ...STUB_ENV };

let dev: ChildProcess | null = null;

function cleanup() {
  if (dev && !dev.killed) {
    try { process.kill(-dev.pid!); } catch {}
    try { dev.kill("SIGKILL"); } catch {}
  }
}
process.on("exit", cleanup);
process.on("SIGINT", () => { cleanup(); process.exit(130); });
process.on("SIGTERM", () => { cleanup(); process.exit(143); });

async function waitForServer(url: string, timeoutMs: number) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url);
      if (r.status < 500) return;
    } catch {}
    await new Promise((res) => setTimeout(res, 500));
  }
  throw new Error(`dev server didn't come up at ${url} within ${timeoutMs}ms`);
}

async function main() {
  // Step 1: fresh DB file
  if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);

  // Step 2: push schema using the tour-specific drizzle config (sqlite
  // dialect → no Turso auth token required).
  console.log("→ Pushing schema to local SQLite…");
  execSync("npx drizzle-kit push --force --config=scripts/tour/drizzle.config.ts", {
    cwd: ROOT, env: ENV, stdio: "inherit",
  });

  // Step 3: spawn dev server (own process group so we can kill the tree)
  console.log(`→ Starting dev server on :${PORT}…`);
  dev = spawn("npx", ["next", "dev", "-p", String(PORT)], {
    cwd: ROOT,
    env: ENV,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  dev.stdout?.on("data", (b) => process.stdout.write(`[dev] ${b}`));
  dev.stderr?.on("data", (b) => process.stderr.write(`[dev] ${b}`));

  // Step 4: wait for it
  await waitForServer(`http://localhost:${PORT}/sign-in`, 90_000);

  // Step 5: seed
  console.log("→ Seeding cast…");
  const cast = await seed(DB_URL);

  // Step 6: capture
  console.log("→ Capturing screenshots…");
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const shots = await capture(cast, OUT_DIR);

  // Step 7: build HTML
  console.log(`→ Building ${path.relative(ROOT, OUT_HTML)}…`);
  buildHtml(shots, OUT_DIR, OUT_HTML, currentBranch());

  cleanup();

  console.log(`\n✓ Tour ready: ${OUT_HTML}`);
  console.log(`  ${shots.length} screenshots across ${new Set(shots.map((s) => s.section)).size} sections`);

  // Open the file (mac-specific; harmless elsewhere)
  try { execSync(`open "${OUT_HTML}"`); } catch {}
}

main().catch((e) => {
  console.error(e);
  cleanup();
  process.exit(1);
});
