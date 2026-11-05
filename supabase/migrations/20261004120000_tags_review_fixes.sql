-- Fixes from a review of the tag system (20260922120000..140000).
--
-- 1. Autocomplete leaked private interests. public.tags holds every live tag, the ones
--    that only exist as somebody's interest (user_settings.interests) included, and both
--    the table and search_tags were readable by every signed-in user — so a private
--    interest showed up in everyone's suggestions, with a count of how many people have
--    it. Suggestions now come only from tags at least one listing uses, the count is the
--    number of listings, and the table itself is no longer readable through the API.
-- 2. A tag could be deleted between sync_*_tags looking it up and linking it (its last
--    user dropping it in a parallel transaction), failing the save on a foreign key
--    error. The syncers now take the tag rows with an upsert, which locks them.
-- 3. interest_buziness_feed ignored the caller's location, so the default home feed was
--    nationwide while the client asks for 100 km. Listings in range now come first. They
--    are sorted ahead rather than filtered, so the feed still never comes back empty in
--    a sparse area.
-- 4. The feed ran the tag-similarity check once per listing and grouped the whole table
--    for the recommendation counts on every page. The similar tags are now found once
--    per call (tags × interests, both small), and the counts are taken for the returned
--    page only.

-------------------------------------------------------------------
-- 1. Autocomplete only from listing tags
-------------------------------------------------------------------
-- SECURITY DEFINER because the table below is no longer readable by the caller.
-- `usage_count` keeps its name for the client (hooks/useTagSuggestions.ts) but now
-- counts listings only.
CREATE OR REPLACE FUNCTION public.search_tags(p_prefix text, p_limit integer DEFAULT 8)
RETURNS TABLE(name text, usage_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT t.name, u.n AS usage_count
  FROM public.tags t
  CROSS JOIN LATERAL (
    SELECT count(*)::integer AS n FROM public.buziness_tags bt WHERE bt.tag_id = t.id
  ) u
  WHERE public.normalize_tag(p_prefix) <> ''
    AND t.normalized LIKE public.normalize_tag(p_prefix) || '%'
    AND u.n > 0
  ORDER BY u.n DESC, t.normalized
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 8), 1), 20);
$$;

ALTER FUNCTION public.search_tags(text, integer) OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.search_tags(text, integer) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.search_tags(text, integer) TO authenticated, service_role;

-- Nothing in the app reads public.tags directly; business-search and embed-tags use the
-- service role, which bypasses RLS.
DROP POLICY IF EXISTS "tags are public" ON public.tags;
REVOKE ALL ON public.tags FROM anon, authenticated;

-------------------------------------------------------------------
-- 2. Syncers that lock the tags they link
-------------------------------------------------------------------
-- The DO UPDATE is a deliberate no-op write: unlike DO NOTHING it returns the existing
-- row's id and holds its row lock until commit. A parallel transaction that drops the
-- tag's last use waits for us in bump_tag_usage, sees the usage we added, and keeps the
-- tag. If that transaction got there first and deleted the row, the upsert waits for it
-- and then inserts a fresh one. Rows are taken in `normalized` order so two syncs of
-- overlapping tag lists lock in the same order and cannot deadlock each other.
CREATE OR REPLACE FUNCTION public.sync_buziness_tags(p_buziness_id bigint, p_tags text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  ids bigint[];
BEGIN
  WITH input AS (
    SELECT DISTINCT ON (public.normalize_tag(raw)) btrim(raw) AS name, public.normalize_tag(raw) AS normalized
    FROM unnest(COALESCE(p_tags, ARRAY[]::text[])) AS raw
    WHERE public.normalize_tag(raw) <> ''
    ORDER BY public.normalize_tag(raw)
  ), up AS (
    INSERT INTO public.tags (name, normalized)
    SELECT name, normalized FROM input
    ON CONFLICT (normalized) DO UPDATE SET normalized = EXCLUDED.normalized
    RETURNING id
  )
  SELECT COALESCE(array_agg(id), ARRAY[]::bigint[]) INTO ids FROM up;

  DELETE FROM public.buziness_tags
  WHERE buziness_id = p_buziness_id AND NOT (tag_id = ANY (ids));

  INSERT INTO public.buziness_tags (buziness_id, tag_id)
  SELECT p_buziness_id, unnest(ids)
  ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_interest_tags(p_author uuid, p_tags text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  ids bigint[];
BEGIN
  WITH input AS (
    SELECT DISTINCT ON (public.normalize_tag(raw)) btrim(raw) AS name, public.normalize_tag(raw) AS normalized
    FROM unnest(COALESCE(p_tags, ARRAY[]::text[])) AS raw
    WHERE public.normalize_tag(raw) <> ''
    ORDER BY public.normalize_tag(raw)
  ), up AS (
    INSERT INTO public.tags (name, normalized)
    SELECT name, normalized FROM input
    ON CONFLICT (normalized) DO UPDATE SET normalized = EXCLUDED.normalized
    RETURNING id
  )
  SELECT COALESCE(array_agg(id), ARRAY[]::bigint[]) INTO ids FROM up;

  DELETE FROM public.interest_tags
  WHERE author = p_author AND NOT (tag_id = ANY (ids));

  INSERT INTO public.interest_tags (author, tag_id)
  SELECT p_author, unnest(ids)
  ON CONFLICT DO NOTHING;
END;
$$;

-------------------------------------------------------------------
-- 3 + 4. The feed: location-aware, and similarity computed once
-------------------------------------------------------------------
-- The signature changes, so the old one goes rather than lingering as an overload.
DROP FUNCTION IF EXISTS public.interest_buziness_feed(text[], boolean, double precision, boolean, boolean, integer, integer);

CREATE OR REPLACE FUNCTION public.interest_buziness_feed(
  p_interests text[],
  p_semantic boolean DEFAULT true,
  p_match_threshold double precision DEFAULT 0.6,
  p_ingyen boolean DEFAULT false,
  p_bad_boy boolean DEFAULT false,
  p_skip integer DEFAULT 0,
  p_take integer DEFAULT 20,
  p_lat double precision DEFAULT NULL,
  p_long double precision DEFAULT NULL,
  p_max_distance double precision DEFAULT NULL
)
RETURNS TABLE(
  id bigint,
  title text,
  description character varying,
  author uuid,
  created_at timestamp with time zone,
  images text[],
  location extensions.geography,
  radius real,
  recommendations integer,
  lat double precision,
  long double precision,
  distance double precision,
  defaultcontact bigint,
  ingyen boolean,
  is_match boolean
)
LANGUAGE sql
STABLE
-- extensions is on the path because this leans on three of them: pgroonga's &@~,
-- pgvector's <#> and PostGIS.
SET search_path = public, extensions
AS $function$
  WITH q AS (
    -- The pgroonga query, ORed across the tags. ESCAPING IS load-bearing: the tags are
    -- user input and pgroonga's query language has operators (OR, -, parentheses,
    -- quotes). Each tag is wrapped in quotes with its own quotes and backslashes
    -- escaped, so its contents can never be read as syntax. NULL when there are no
    -- usable tags, which makes the literal half below match nothing.
    SELECT string_agg(
             '"' || replace(replace(t, '\', '\\'), '"', '\"') || '"',
             ' OR '
           ) AS literal
    FROM unnest(COALESCE(p_interests, ARRAY[]::text[])) AS t
    WHERE btrim(t) <> ''
  ),
  here AS (
    SELECT CASE WHEN p_lat IS NOT NULL AND p_long IS NOT NULL
                THEN st_point(p_long, p_lat)::geography END AS pt
  ),
  interest AS (
    -- The interest tags' own vectors, straight out of the dictionary. Nothing is
    -- embedded at request time; embed-tags fills these in ahead of us.
    SELECT tg.embedding
    FROM public.tags tg
    WHERE tg.embedding IS NOT NULL
      AND tg.normalized = ANY (
        SELECT public.normalize_tag(x)
        FROM unnest(COALESCE(p_interests, ARRAY[]::text[])) AS x
      )
  ),
  near_tags AS (
    -- Every dictionary tag close to ANY interest, found once for the whole call.
    -- Tag against tag, never against buziness.embedding — that column blends the name,
    -- every tag and the description into one vector, on which ORing the tags would
    -- collapse into ANDing them.
    SELECT btag.id
    FROM public.tags btag
    WHERE p_semantic
      AND btag.embedding IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM interest i
        WHERE (-(btag.embedding <#> i.embedding)) > p_match_threshold
      )
  ),
  matched AS (
    -- Semantic half: ANY of the listing's own tags is near ANY interest.
    SELECT bt.buziness_id AS id
    FROM public.buziness_tags bt
    WHERE bt.tag_id IN (SELECT id FROM near_tags)
    UNION
    -- Literal half: an interest appears in the title (pgroonga index ix_memos_content).
    SELECT b.id
    FROM public.buziness b
    WHERE (SELECT literal FROM q) IS NOT NULL
      AND b.title &@~ (SELECT literal FROM q)
  ),
  page AS (
    SELECT
      b.id,
      (m.id IS NOT NULL) AS is_match,
      -- No location or no limit from the caller means everything counts as in range.
      COALESCE(
        p_max_distance IS NULL OR p_max_distance <= 0 OR h.pt IS NULL
          OR st_dwithin(b.location, h.pt, p_max_distance),
        false
      ) AS in_range
    FROM public.buziness b
    JOIN public.profiles p ON p.id = b.author AND p.bad_boy = p_bad_boy
    CROSS JOIN here h
    LEFT JOIN matched m ON m.id = b.id
    WHERE (NOT p_ingyen OR b.ingyen = true)
    -- One fully deterministic ordering, so skip-based paging neither repeats nor drops
    -- rows. With no interests and no location this is exactly the old
    -- "created_at DESC, id DESC".
    ORDER BY in_range DESC, is_match DESC, b.created_at DESC, b.id DESC
    OFFSET GREATEST(COALESCE(p_skip, 0), 0)
    LIMIT  LEAST(GREATEST(COALESCE(p_take, 20), 1), 100)
  )
  SELECT
    b.id, b.title, b.description, b.author, b.created_at, b.images, b.location,
    b.radius,
    (SELECT count(*)::integer FROM public."buzinessRecommendations" br
      WHERE br.buziness_id = b.id) AS recommendations,
    st_y(b.location::geometry) AS lat,
    st_x(b.location::geometry) AS long,
    CASE WHEN h.pt IS NOT NULL THEN st_distance(b.location, h.pt) END AS distance,
    b."defaultContact",
    b.ingyen,
    pg.is_match
  FROM page pg
  JOIN public.buziness b ON b.id = pg.id
  CROSS JOIN here h
  ORDER BY pg.in_range DESC, pg.is_match DESC, b.created_at DESC, b.id DESC
$function$;

-- Only the business-search edge function calls it, with the service role.
REVOKE EXECUTE ON FUNCTION public.interest_buziness_feed(text[], boolean, double precision, boolean, boolean, integer, integer, double precision, double precision, double precision)
  FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.interest_buziness_feed(text[], boolean, double precision, boolean, boolean, integer, integer, double precision, double precision, double precision)
  TO service_role;
