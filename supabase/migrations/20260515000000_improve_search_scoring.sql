-- Improve hybrid_buziness_search with combined relevance scoring
-- Distance is used only for sorting (tiebreaker), not as a filter or score component
-- match_threshold (default 0.5) is a hard embedding-relevance filter when a query exists

-- Drop all known overloaded signatures to avoid ambiguity
DROP FUNCTION IF EXISTS public.hybrid_buziness_search(
  text, extensions.vector, double precision, double precision, double precision,
  integer, integer, double precision, double precision, double precision, integer
);
DROP FUNCTION IF EXISTS public.hybrid_buziness_search(
  text, extensions.vector, double precision, double precision, double precision,
  integer, integer, double precision, double precision, double precision, integer, boolean
);
DROP FUNCTION IF EXISTS public.hybrid_buziness_search(
  text, extensions.vector, double precision, double precision, double precision,
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
      b."defaultContact",
      b.ingyen
    FROM public.buziness b
    LEFT OUTER JOIN public."buzinessRecommendations" br
      ON b.id = br.buziness_id
    WHERE
      CASE
        WHEN query_text = '' THEN true
        ELSE b.embedding <#> query_embedding < -match_threshold
      END
      AND (NOT filter_ingyen OR b.ingyen = true)
    GROUP BY b.id
  )
  SELECT
    s.id, s.title, s.description, s.author,
    s.created_at, s.images, s.location,
    s.recommendations, s.lat, s.long,
    s.dist AS distance,
    CASE WHEN query_text != '' THEN -(s.embedding_dist) ELSE 0.0 END AS relevance,
    s."defaultContact" AS defaultcontact,
    s.ingyen
  FROM scored s
  ORDER BY
    CASE WHEN query_text != '' THEN query_weight * s.embedding_dist ELSE 0.0 END
    + distance_weight * (s.dist / GREATEST(MAX(s.dist) OVER(), 1.0))
    - recommendation_weight * ln(1.0 + s.recommendations)
    ASC,
    s.dist ASC
  OFFSET CASE WHEN skip >= 0 THEN skip END ROWS
  LIMIT  CASE WHEN take >= 0 THEN take END
$function$;
