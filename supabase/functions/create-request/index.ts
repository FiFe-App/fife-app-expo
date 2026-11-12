// Creates a kérés. Counterpart of create-buziness: the row is written here, with the service
// role, because its embedding columns (embedding / embedding_text) may only be written by the
// server — the client has no INSERT privilege on public.requests (see
// 20261112120000_requests_embeddings.sql).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import OpenAI from "npm:openai";
import { embedText, requestEmbeddingInput } from "../_shared/embedding.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("URL") || "http://127.0.0.1:54321";
const supabaseServiceRoleKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mirrors the CHECK constraints on public.requests and lib/requests/types.ts REQUEST_LIMITS.
const TITLE_MIN = 3;
const TITLE_MAX = 120;
const DESCRIPTION_MAX = 2000;
const TAGS_MAX = 10;
const TAG_MAX_LENGTH = 40;
const RADIUS_MIN = 100;
const RADIUS_MAX = 200000;
const POINT = /^POINT\((-?\d{1,3}(?:\.\d+)?) (-?\d{1,2}(?:\.\d+)?)\)$/;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Require a valid authenticated JWT (the public anon key authenticates no one).
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  if (!supabaseServiceRoleKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
    return json({ error: "Missing Supabase credentials" }, 500);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  // --- validation: the body is untrusted; nothing is spread into the row ---
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
    return json({ error: `Title must be ${TITLE_MIN}-${TITLE_MAX} characters` }, 400);
  }

  const description = body.description == null ? "" : body.description;
  if (typeof description !== "string" || description.trim().length > DESCRIPTION_MAX) {
    return json({ error: "Description is too long" }, 400);
  }

  let tags: string[] = [];
  if (body.tags != null) {
    if (!Array.isArray(body.tags) || body.tags.some((t) => typeof t !== "string")) {
      return json({ error: "Tags must be a list of strings" }, 400);
    }
    const seen = new Set<string>();
    for (const raw of body.tags as string[]) {
      const tag = raw.trim();
      if (!tag) continue;
      if (tag.length > TAG_MAX_LENGTH) return json({ error: "A tag is too long" }, 400);
      if (seen.has(tag.toLowerCase())) continue;
      seen.add(tag.toLowerCase());
      tags.push(tag);
    }
    if (tags.length > TAGS_MAX) return json({ error: `At most ${TAGS_MAX} tags` }, 400);
  }

  // "Bárhol": no location and no radius. Otherwise a WKT point (lon lat) and a radius in meters.
  let location: string | null = null;
  let radius: number | null = null;
  if (body.location != null) {
    const match = typeof body.location === "string" ? POINT.exec(body.location) : null;
    const lon = match ? Number(match[1]) : NaN;
    const lat = match ? Number(match[2]) : NaN;
    if (!match || lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      return json({ error: "Location must be POINT(lon lat)" }, 400);
    }
    location = body.location as string;
    radius = typeof body.radius === "number" ? body.radius : 5000;
    if (!Number.isFinite(radius) || radius < RADIUS_MIN || radius > RADIUS_MAX) {
      return json({ error: `Radius must be ${RADIUS_MIN}-${RADIUS_MAX} meters` }, 400);
    }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  // The row is written with the service role client, which bypasses RLS, so the author is
  // the caller — never anything from the body.
  const author = user.id;

  // "AI-s megtalálhatóság": read here, not taken from the request. No settings row (or an
  // unreadable one) means the text stays put.
  const { data: settings, error: settingsError } = await supabase
    .from("user_settings")
    .select("ai_enhance")
    .eq("author", author)
    .maybeSingle();
  if (settingsError) {
    console.error("Could not read the author's ai_enhance flag:", settingsError.message);
  }
  const aiEnhance: boolean = settings?.ai_enhance ?? false;

  let embedding_text: string | null = null;
  let embedding: number[] | null = null;
  if (aiEnhance && openaiApiKey) {
    try {
      const openai = new OpenAI({ apiKey: openaiApiKey });
      ({ embedding_text, embedding } = await embedText(
        openai,
        requestEmbeddingInput({ title, tags, description: description as string }),
      ));
    } catch (e) {
      // Unlike a biznisz, a kérés is worth saving without its vector: it is found by its text
      // until fill-embeddings catches up.
      console.error("embedding failed, saving the request without it:", e);
      embedding_text = null;
      embedding = null;
    }
  } else {
    console.log("ai_enhance is off (or no OpenAI key) for", author, "— no embedding");
  }

  const { data: created, error } = await supabase
    .from("requests")
    .insert({
      author,
      title,
      description: (description as string).trim(),
      tags,
      location,
      radius,
      embedding,
      embedding_text,
    })
    .select("id")
    .single();

  if (error || !created) {
    // The open-requests limit is raised by a trigger, in words written for the user.
    if (error?.message?.includes("nyitott kérésed")) return json({ error: error.message }, 400);
    console.error("Error creating request:", error);
    return json({ error: "Failed to create request" }, 500);
  }

  return json({ id: created.id });
});
