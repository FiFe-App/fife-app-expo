import type { Config, Context } from "https://edge.netlify.com";

import { buildBuzinessMeta, injectSocialMeta } from "./socialMeta.ts";

/**
 * Link previews for /biznisz/<id> on fifeapp.hu.
 *
 * Everything on the site is the same index.html (see the catch-all redirect in
 * netlify.toml), so a biznisz link posted on Facebook or sent in Messenger
 * would otherwise preview as the app itself: the crawler reads the head and
 * leaves before any JavaScript runs. This runs at the edge, looks the biznisz
 * up, and writes its title, description and first picture into the head of the
 * HTML on the way out.
 *
 * It reads with the public anon key, so the RLS policy decides what a stranger
 * may see: only a biznisz whose author marked it public exists here. Anything
 * else — a private one, an unknown id, /biznisz/new, /biznisz/edit/… — is
 * served untouched, with the app-wide preview from app/+html.tsx.
 */

const SITE_URL = "https://fifeapp.hu";
const FALLBACK_IMAGE = `${SITE_URL}/og-image.png`;

// Both are public values (the anon key is the one shipped in the web bundle);
// the defaults keep previews working on a deploy that has no environment
// variables set, and Netlify's own variables win when they are.
const SUPABASE_URL =
  Deno.env.get("EXPO_PUBLIC_SUPABASE_URL") ??
  "https://pdzuvfkkrhtrrrcckwzj.supabase.co";
const SUPABASE_ANON_KEY =
  Deno.env.get("EXPO_PUBLIC_SUPABASE_ANON_KEY") ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkenV2Zmtrcmh0cnJyY2Nrd3pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI5MzQ5NDcsImV4cCI6MjAzODUxMDk0N30.N2CBbhzVSXMjMo6yzjAZ78rwGCK_ABbYiP49nxVTlYk";

/** A crawler that waits is a crawler that shows nothing. */
const LOOKUP_TIMEOUT_MS = 2500;

const fetchPublicBuziness = async (id: string) => {
  const url =
    `${SUPABASE_URL}/rest/v1/buziness` +
    `?select=id,title,description,images&id=eq.${encodeURIComponent(id)}&limit=1`;
  try {
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  } catch (error) {
    console.warn("social-preview: could not load biznisz", id, error);
    return null;
  }
};

export default async (request: Request, context: Context) => {
  const response = await context.next();

  if (!(response.headers.get("content-type") ?? "").includes("text/html"))
    return response;

  const id = new URL(request.url).pathname.split("/")[2] ?? "";
  if (!/^\d+$/.test(id)) return response;

  const row = await fetchPublicBuziness(id);
  if (!row?.title) return response;

  const html = await response.text();
  const meta = buildBuzinessMeta(row, {
    siteUrl: SITE_URL,
    supabaseUrl: SUPABASE_URL,
    fallbackImage: FALLBACK_IMAGE,
  });

  const headers = new Headers(response.headers);
  // The body is a different length now, and the CDN sets the new one itself.
  headers.delete("content-length");

  return new Response(injectSocialMeta(html, meta), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export const config: Config = { path: "/biznisz/*" };
