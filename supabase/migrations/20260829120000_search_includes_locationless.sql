-- A biznisz can be marked "Bárhol" in the editor — available anywhere, no map
-- pin, `location IS NULL`. Those listings never came back from a text search.
--
-- The radius filter was the reason. `st_distance(NULL, …)` is NULL, so
-- `NULL <= max_distance` is NULL rather than true and the row was filtered out.
-- The two escape hatches in front of it never fire in practice: the app always
-- sends a point and a distance (the search circle, the device GPS, or the
-- Budapest default with 100 km — see hooks/useBuzinessSearch.ts). Only the
-- no-query listing branch of business-search, which does not filter by distance
-- at all, ever showed them — which is why they appear under "Közeli bizniszek"
-- and vanish the moment somebody types a query.
--
-- Letting them past the filter is not enough on its own: the ORDER BY multiplies
-- `dist` by `distance_sort`, and `0 * NULL` is NULL in SQL, so the whole sort
-- expression collapses to NULL for these rows and they sort last — off the first
-- page of any paginated search. Both reads of `dist` in the ORDER BY are
-- therefore COALESCEd to 0: something available everywhere is available where
-- the searcher is, so it takes no distance penalty.
--
-- The `dist` column itself is left as it was, so the function keeps returning
-- distance = NULL for these rows. The client needs that to tell "no location"
-- (shown as "Bárhol elérhető") from "right next to you".
--
-- Everything else is carried over verbatim from
-- 20260604000002_hybrid_search_bad_boy_filter.sql. The signature is unchanged,
-- so this is a CREATE OR REPLACE and the existing grants stay as they are.

SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.hybrid_buziness_search(
  query_text text,
  query_embedding extensions.vector,
  lat double precision,
  long double precision,
  max_distance double precision DEFAULT 0,
  skip integer DEFAULT 0,
  take integer DEFAULT 20,
  match_threshold double precision DEFAULT 0.3,
  fts_weight double precision DEFAULT 0.5,
  semantic_weight double precision DEFAULT 1.0,
  score_sort double precision DEFAULT 1.0,
  distance_sort double precision DEFAULT 0.0,
  recommendation_sort double precision DEFAULT 0.3,
  filter_ingyen boolean DEFAULT false,
  filter_bad_boy boolean DEFAULT false
)
RETURNS TABLE(
  id bigint,
  title text,
  description character varying,
  author uuid,
  created_at timestamp with time zone,
  images text[],
  location extensions.geography,
  recommendations integer,
  lat double precision,
  long double precision,
  distance double precision,
  score double precision,
  defaultcontact bigint,
  ingyen boolean
)
LANGUAGE sql
AS $function$
  WITH scored AS (
    SELECT
      b.id, b.title, b.description, b.author, b.created_at, b.images, b.location,
      count(br.id)::integer AS recommendations,
      st_y(b.location::geometry) AS lat,
      st_x(b.location::geometry) AS long,
      -- NULL for a "Bárhol" biznisz, and returned that way on purpose.
      CASE WHEN lat != 0 OR long != 0
        THEN st_distance(b.location, st_point(long, lat)::geography)
        ELSE 0.0
      END AS dist,
      -- Semantic score: negated inner product distance (higher = better, 0 to 1 range)
      COALESCE(-(b.embedding <#> query_embedding), 0.0) AS semantic_score,
      -- FTS score: 0-2 (title=1, description=0.5, embedding_text=0.5)
      CASE WHEN query_text != '' THEN (
        (CASE WHEN b.title &@~ query_text THEN 1.0 ELSE 0.0 END)
        + (CASE WHEN b.description &@~ query_text THEN 0.5 ELSE 0.0 END)
        + (CASE WHEN b.embedding_text &@~ query_text THEN 0.5 ELSE 0.0 END)
      ) ELSE 0.0 END AS fts_score,
      b."defaultContact",
      b.ingyen
    FROM public.buziness b
    JOIN public.profiles p ON p.id = b.author AND p.bad_boy = filter_bad_boy
    LEFT OUTER JOIN public."buzinessRecommendations" br
      ON b.id = br.buziness_id
    WHERE
      (NOT filter_ingyen OR b.ingyen = true)
      -- A listing with no location is everywhere, so no radius excludes it.
      AND (max_distance <= 0 OR (lat = 0 AND long = 0)
        OR b.location IS NULL
        OR st_distance(b.location, st_point(long, lat)::geography) <= max_distance)
    GROUP BY b.id
  )
  SELECT
    s.id, s.title, s.description, s.author,
    s.created_at, s.images, s.location,
    s.recommendations, s.lat, s.long,
    s.dist AS distance,
    (s.fts_score * fts_weight + s.semantic_score * semantic_weight) AS score,
    s."defaultContact" AS defaultcontact,
    s.ingyen
  FROM scored s
  WHERE
    CASE
      WHEN query_text = '' THEN true
      ELSE (s.fts_score * fts_weight + s.semantic_score * semantic_weight) > match_threshold
    END
  ORDER BY
    - score_sort * (s.fts_score * fts_weight + s.semantic_score * semantic_weight)
    + distance_sort * (COALESCE(s.dist, 0) / GREATEST(MAX(s.dist) OVER(), 1.0))
    - recommendation_sort * ln(1.0 + s.recommendations)
    ASC,
    COALESCE(s.dist, 0) ASC
  OFFSET CASE WHEN skip >= 0 THEN skip END ROWS
  LIMIT  CASE WHEN take >= 0 THEN take END
$function$;
