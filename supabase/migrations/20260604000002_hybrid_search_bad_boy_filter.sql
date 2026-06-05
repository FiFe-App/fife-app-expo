-- Add filter_bad_boy parameter to hybrid_buziness_search.
-- Results are restricted to businesses whose author is in the same "world"
-- (bad_boy = filter_bad_boy), mirroring the RLS logic for direct table queries.

-- Drop previous signature (without filter_bad_boy)
DROP FUNCTION IF EXISTS public.hybrid_buziness_search(
  text, extensions.vector, double precision, double precision,
  double precision, integer, integer, double precision, double precision, double precision,
  double precision, double precision, double precision, boolean
);

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
      AND (max_distance <= 0 OR (lat = 0 AND long = 0)
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
    + distance_sort * (s.dist / GREATEST(MAX(s.dist) OVER(), 1.0))
    - recommendation_sort * ln(1.0 + s.recommendations)
    ASC,
    s.dist ASC
  OFFSET CASE WHEN skip >= 0 THEN skip END ROWS
  LIMIT  CASE WHEN take >= 0 THEN take END
$function$;
