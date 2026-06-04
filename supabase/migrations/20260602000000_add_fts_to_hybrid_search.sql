-- Add full-text search (PGroonga) to hybrid_buziness_search
-- Rows matching query_text in title, description, or embedding_text are always included.
-- Embedding score, distance, and recommendations still drive ordering.

-- Add PGroonga index on description (title and embedding_text already indexed)
CREATE INDEX IF NOT EXISTS ix_buziness_description
  ON public.buziness USING pgroonga (description);

-- Drop previous signature (without fts_weight) to avoid overload ambiguity
DROP FUNCTION IF EXISTS public.hybrid_buziness_search(
  text, extensions.vector, double precision, double precision,
  integer, integer, double precision, double precision, double precision, double precision, boolean
);

SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.hybrid_buziness_search(
  query_text text,
  query_embedding extensions.vector,
  lat double precision,
  long double precision,
  skip integer,
  take integer,
  match_threshold double precision DEFAULT 0.5,
  query_weight double precision DEFAULT 1.0,
  distance_weight double precision DEFAULT 0.0,
  recommendation_weight double precision DEFAULT 0.3,
  fts_weight double precision DEFAULT 0.5,
  filter_ingyen boolean DEFAULT false
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
  relevance double precision,
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
      st_distance(b.location, st_point(long, lat)::geography) AS dist,
      b.embedding <#> query_embedding AS embedding_dist,
      CASE WHEN query_text != '' THEN (
        (CASE WHEN b.title &@~ query_text THEN 1.0 ELSE 0.0 END)
        + (CASE WHEN b.description &@~ query_text THEN 0.5 ELSE 0.0 END)
        + (CASE WHEN b.embedding_text &@~ query_text THEN 0.5 ELSE 0.0 END)
      ) ELSE 0.0 END AS fts_score,
      b."defaultContact",
      b.ingyen
    FROM public.buziness b
    LEFT OUTER JOIN public."buzinessRecommendations" br
      ON b.id = br.buziness_id
    WHERE
      CASE
        WHEN query_text = '' THEN true
        ELSE (
          b.embedding <#> query_embedding < -match_threshold
          OR b.title &@~ query_text
          OR b.description &@~ query_text
          OR b.embedding_text &@~ query_text
        )
      END
      AND (NOT filter_ingyen OR b.ingyen = true)
    GROUP BY b.id
  )
  SELECT
    s.id, s.title, s.description, s.author,
    s.created_at, s.images, s.location,
    s.recommendations, s.lat, s.long,
    s.dist AS distance,
    CASE WHEN query_text != '' THEN COALESCE(-(s.embedding_dist), 0.0) ELSE 0.0 END AS relevance,
    s."defaultContact" AS defaultcontact,
    s.ingyen
  FROM scored s
  ORDER BY
    CASE WHEN query_text != '' THEN query_weight * COALESCE(s.embedding_dist, 0.0) ELSE 0.0 END
    + distance_weight * (s.dist / GREATEST(MAX(s.dist) OVER(), 1.0))
    - recommendation_weight * ln(1.0 + s.recommendations)
    - fts_weight * s.fts_score
    ASC,
    s.dist ASC
  OFFSET CASE WHEN skip >= 0 THEN skip END ROWS
  LIMIT  CASE WHEN take >= 0 THEN take END
$function$;
