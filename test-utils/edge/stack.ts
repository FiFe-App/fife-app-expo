/**
 * Connection details for the Supabase stack the edge-function tests run against.
 *
 * These tests create rows, upload files and delete auth users, so the target is
 * resolved deliberately rather than picked up from whatever happens to be in the
 * shell: local by default, and never the production project.
 *
 * Resolution order for each value:
 *   1. an explicit `EDGE_TEST_*` variable (highest precedence — set it to point
 *      the run somewhere specific),
 *   2. the standard `SUPABASE_*` variable,
 *   3. `supabase status -o env` (i.e. whatever `supabase start` is running).
 */
import { execFileSync } from "node:child_process";

export interface EdgeStack {
  /** Base URL of the API gateway, e.g. http://127.0.0.1:54321 */
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  /** Only set when the OpenAI-backed paths can be exercised for real. */
  openAiKey: string | null;
  /**
   * Key the unsubscribe links are signed with. Mirrors the precedence in
   * `_shared/unsubscribe.ts` so a token minted here verifies over there.
   */
  newsletterSecret: string;
}

/**
 * The production project. The suite deletes what it creates, and a stray
 * `SUPABASE_URL` in the environment is all it would take to aim that at real
 * users, so this ref is refused outright — no override.
 */
const PRODUCTION_PROJECT_REF = "pdzuvfkkrhtrrrcckwzj";

const LOCAL_HOSTS = new Set([
  "127.0.0.1",
  "localhost",
  "::1",
  "0.0.0.0",
  "host.docker.internal",
]);

let statusCache: Record<string, string> | null = null;

/** `supabase status -o env` output, or {} when no stack is running. */
function supabaseStatusEnv(): Record<string, string> {
  if (statusCache) return statusCache;
  statusCache = {};
  try {
    const out = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 60_000,
    });
    for (const line of out.split("\n")) {
      const match = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
      if (match) statusCache[match[1]] = match[2];
    }
  } catch {
    // No CLI, or no stack running. resolveStack() reports that with context.
  }
  return statusCache;
}

function pick(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  // Nothing in the environment — ask the running stack, once per process.
  const status = supabaseStatusEnv();
  for (const name of names) {
    if (status[name]) return status[name];
  }
  return "";
}

/**
 * Refuses any target that isn't a local stack. Remote targets (a throwaway
 * staging project) need EDGE_TEST_ALLOW_REMOTE=1 stated out loud; production is
 * refused either way.
 */
export function assertSafeTarget(url: string): void {
  if (url.includes(PRODUCTION_PROJECT_REF)) {
    throw new Error(
      `Refusing to run destructive edge-function tests against the production project (${url}).`,
    );
  }
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    throw new Error(`EDGE_TEST_SUPABASE_URL is not a valid URL: ${url}`);
  }
  if (LOCAL_HOSTS.has(host)) return;
  if (process.env.EDGE_TEST_ALLOW_REMOTE === "1") return;
  throw new Error(
    `${url} is not a local Supabase stack. These tests create and delete data; ` +
      "point them at `supabase start` (http://127.0.0.1:54321), or set " +
      "EDGE_TEST_ALLOW_REMOTE=1 if you really mean to use a disposable remote project.",
  );
}

export function resolveStack(): EdgeStack {
  const url = pick("EDGE_TEST_SUPABASE_URL", "SUPABASE_URL", "API_URL") || "http://127.0.0.1:54321";
  assertSafeTarget(url);

  const anonKey = pick("EDGE_TEST_ANON_KEY", "SUPABASE_ANON_KEY", "ANON_KEY");
  const serviceRoleKey = pick(
    "EDGE_TEST_SERVICE_ROLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SERVICE_ROLE_KEY",
  );

  if (!anonKey || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase keys for the edge-function tests.\n" +
        "Start the local stack with `npx supabase start` (the keys are then read from " +
        "`supabase status`), or export SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY.\n" +
        `Target was ${url}.`,
    );
  }

  // Written back so the CLI lookup happens once: globalSetup resolves the stack
  // in the main process, and Jest's workers inherit this env when they fork.
  process.env.EDGE_TEST_SUPABASE_URL = url;
  process.env.EDGE_TEST_ANON_KEY = anonKey;
  process.env.EDGE_TEST_SERVICE_ROLE_KEY = serviceRoleKey;

  return {
    url: url.replace(/\/+$/, ""),
    anonKey,
    serviceRoleKey,
    openAiKey: process.env.OPENAI_API_KEY || null,
    // Same fallback the edge function uses when NEWSLETTER_SECRET is unset.
    newsletterSecret: process.env.NEWSLETTER_SECRET || serviceRoleKey,
  };
}
