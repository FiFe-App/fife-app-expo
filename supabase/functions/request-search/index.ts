// Search (and the "for me" feed) over the kérések, counterpart of business-search: the query's
// vector is made here (with the shared cache) and handed to public.requests_feed, which mixes
// the literal and the semantic score. The feed is called with the CALLER's JWT, so auth.uid()
// inside the function is the caller and the world / block rules apply to them.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import OpenAI from "npm:openai";
import { getQueryEmbedding } from "../_shared/queryEmbedding.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("URL") || "http://127.0.0.1:54321";
const supabaseServiceRoleKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_QUERY_LENGTH = 200;
const MAX_TAKE = 100;
const MAX_INTERESTS = 20;
const SCOPES = ["for_me", "all", "mine", "solved"];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : fallback;
  return Math.min(Math.max(n, min), max);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  // A client acting as the caller: getUser() verifies the token, and the same client runs the
  // feed, so auth.uid() in SQL is the caller.
  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  if (!supabaseServiceRoleKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
    return json({ error: "Missing Supabase credentials" }, 500);
  }
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const query = typeof body.query === "string" ? body.query.trim().slice(0, MAX_QUERY_LENGTH) : "";
  const scope = typeof body.scope === "string" && SCOPES.includes(body.scope) ? body.scope : "all";
  const skip = clampInt(body.skip, 0, 0, Number.MAX_SAFE_INTEGER);
  const take = clampInt(body.take, 10, 1, MAX_TAKE);
  const lat = typeof body.lat === "number" && Number.isFinite(body.lat) ? body.lat : null;
  const long = typeof body.long === "number" && Number.isFinite(body.long) ? body.long : null;
  const interests: string[] = Array.isArray(body.interests)
    ? Array.from(
        new Set(
          body.interests
            .filter((t: unknown): t is string => typeof t === "string")
            .map((t: string) => t.trim())
            .filter((t: string) => t.length > 0),
        ),
      ).slice(0, MAX_INTERESTS)
    : [];

  // "AI-s megtalálhatóság": with it off, the search text never leaves for OpenAI. Read
  // server-side — a privacy choice the client could set for itself is not a choice.
  let embedding: number[] | null = null;
  if (query) {
    const { data: settings, error: settingsError } = await supabase
      .from("user_settings")
      .select("ai_enhance")
      .eq("author", user.id)
      .maybeSingle();
    if (settingsError) {
      console.error("Could not read the caller's ai_enhance flag:", settingsError.message);
    }
    if ((settings?.ai_enhance ?? false) && openaiApiKey) {
      try {
        embedding = await getQueryEmbedding(supabase, new OpenAI({ apiKey: openaiApiKey }), query);
      } catch (e) {
        // The literal half still works without the vector.
        console.error("query embedding failed, searching by text only:", e);
      }
    }
  }

  const { data, error } = await supabaseUser.rpc("requests_feed", {
    p_scope: scope,
    p_query: query || null,
    p_lat: lat,
    p_long: long,
    p_skip: skip,
    p_take: take,
    p_interests: interests,
    p_query_embedding: embedding,
  });
  if (error) {
    console.error("requests_feed error", error);
    return json({ error: "Search failed" }, 500);
  }

  return json(data ?? []);
});
