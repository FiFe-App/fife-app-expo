-- Expose popular search queries from the embedding cache to authenticated users.
-- Returns query_text ordered by hit_count so the app can show search suggestions.
-- The underlying table has no RLS policies (service_role only), so we use a
-- SECURITY DEFINER function to safely surface only the query text + hit count.

CREATE OR REPLACE FUNCTION public.get_popular_search_queries(
  p_prefix   text    DEFAULT '',
  p_limit    integer DEFAULT 8
)
RETURNS TABLE (query_text text, hit_count integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    qec.query_text,
    qec.hit_count
  FROM public.query_embedding_cache qec
  WHERE
    p_prefix = ''
    OR qec.query_text ILIKE (p_prefix || '%')
  ORDER BY qec.hit_count DESC, qec.last_used_at DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_popular_search_queries(text, integer) TO authenticated, anon;
