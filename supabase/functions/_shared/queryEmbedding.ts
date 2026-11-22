// Embedding of a search query, with the shared cache (public.query_embedding_cache).
// Same pipeline and cache keys as business-search, so a query already embedded for a
// biznisz search costs nothing for a kérés search, and vice versa.
import { embedText, EMBEDDING_MODEL_VERSION } from "./embedding.ts";

async function hashQuery(normalized: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// deno-lint-ignore no-explicit-any
type Supabase = any;
// deno-lint-ignore no-explicit-any
type OpenAI = any;

/**
 * The vector of `query`, or null when there is nothing to embed. The caller decides whether
 * the AI may be used at all (the user's ai_enhance flag) and simply does not call this when
 * not. Cache failures never fail the search: the vector is made fresh instead.
 */
export async function getQueryEmbedding(
  supabase: Supabase,
  openai: OpenAI,
  query: string,
): Promise<number[] | null> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return null;
  const queryHash = await hashQuery(normalized);

  const { data: cached, error: cacheError } = await supabase
    .from("query_embedding_cache")
    .select("embedding, hit_count")
    .eq("query_hash", queryHash)
    .eq("model_version", EMBEDDING_MODEL_VERSION)
    .maybeSingle();
  if (cacheError) console.warn("embedding cache lookup failed", cacheError.message);

  if (cached) {
    // Postgres returns vector columns as a text string "[0.1,...]".
    const embedding = typeof cached.embedding === "string"
      ? JSON.parse(cached.embedding)
      : cached.embedding;
    // Fire-and-forget usage stats.
    supabase
      .from("query_embedding_cache")
      .update({ last_used_at: new Date().toISOString(), hit_count: cached.hit_count + 1 })
      .eq("query_hash", queryHash)
      .eq("model_version", EMBEDDING_MODEL_VERSION)
      .then(() => {});
    return embedding;
  }

  const { embedding_text, embedding } = await embedText(openai, query, {
    temperature: 0,
    maxOutputTokens: 500,
  });
  supabase
    .from("query_embedding_cache")
    .insert({
      query_hash: queryHash,
      query_text: normalized,
      embedding_text,
      embedding,
      model_version: EMBEDDING_MODEL_VERSION,
    })
    .then(() => {});
  return embedding;
}
