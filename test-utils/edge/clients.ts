/**
 * Clients and the raw invoker used by the edge-function tests.
 *
 * `supabase.functions.invoke()` throws away the status code, and half of what
 * these tests assert *is* the status code (401 vs 400 vs 404), so functions are
 * called with plain `fetch` instead.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { resolveStack, type EdgeStack } from "./stack";

let stack: EdgeStack | null = null;

/** Resolved once per process; throws with instructions if no stack is reachable. */
export function edgeStack(): EdgeStack {
  if (!stack) stack = resolveStack();
  return stack;
}

/** Service-role client: bypasses RLS. Used to seed, inspect and clean up. */
export function adminClient(): SupabaseClient {
  const { url, serviceRoleKey } = edgeStack();
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Anon client — what the app itself ships with. */
export function anonClient(): SupabaseClient {
  const { url, anonKey } = edgeStack();
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface InvokeOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  /** Bearer token. Omit entirely to send no Authorization header at all. */
  token?: string;
  body?: unknown;
  query?: Record<string, string>;
  /** Follow redirects instead of returning the 302 (default: return it). */
  followRedirects?: boolean;
}

/** Calls a deployed edge function and hands back the raw Response. */
export async function invokeFunction(
  name: string,
  { method = "POST", token, body, query, followRedirects = false }: InvokeOptions = {},
): Promise<Response> {
  const { url, anonKey } = edgeStack();
  const target = new URL(`${url}/functions/v1/${name}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    target.searchParams.set(key, value);
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  // The gateway wants an apikey on every call; the Authorization header is what
  // the function under test actually authenticates, so it stays under test control.
  headers.apikey = anonKey;
  if (token) headers.Authorization = `Bearer ${token}`;

  return fetch(target, {
    method,
    headers,
    body: body === undefined || method === "GET" ? undefined : JSON.stringify(body),
    redirect: followRedirects ? "follow" : "manual",
  });
}

/**
 * Response body as parsed JSON, or the raw text when it isn't JSON — the
 * gateway's own errors are HTML/plain text, and a test that expected JSON should
 * fail on the assertion rather than on a parse error.
 */
export async function readBody(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
