-- Add PGroonga full-text index on embedding_text for synonym-based search
CREATE INDEX IF NOT EXISTS ix_buziness_embedding_text
  ON public.buziness USING pgroonga (embedding_text);

-- Update hybrid_buziness_search to also match via full-text on embedding_text
CREATE OR REPLACE FUNCTION public.hybrid_buziness_search(
  query_text text,
  query_embedding extensions.vector,
  lat double precision,
  long double precision,
  distance double precision,
  skip integer,
  take integer,
  full_text_weight double precision DEFAULT 0,
  semantic_weight double precision DEFAULT 1,
  match_threshold double precision DEFAULT 0.6,
  rrf_k integer DEFAULT 50
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
  defaultcontact bigint
)
LANGUAGE sql
AS $function$
  SET search_path TO public;
  SELECT
    b.id, b.title, b.description, b.author, b.created_at, b.images, b.location,
    count(br.id) as recommendations,
    st_y(location::geometry) as lat,
    st_x(location::geometry) as long,
    st_distance(location, st_point(long, lat)::geography) as distance,
    b.embedding <#> query_embedding as relevance,
    b."defaultContact"
  FROM public.buziness b
  LEFT OUTER JOIN public."buzinessRecommendations" br
    ON b.id = br.buziness_id
  WHERE
    CASE
      WHEN query_text = '' THEN true
      ELSE (
        b.embedding <#> query_embedding < -match_threshold
        OR b.embedding_text &@~ query_text
      )
    END
  GROUP BY b.id
  ORDER BY
    CASE WHEN query_text != '' THEN (b.embedding <#> query_embedding) END,
    st_distance(location, st_point(long, lat)::geography) ASC
  OFFSET CASE WHEN skip >= 0 THEN skip END ROWS
  LIMIT  CASE WHEN take >= 0 THEN take END
$function$;
