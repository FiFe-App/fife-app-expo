-- Create nearest_profiles function for location-based profile search with pagination
-- SECURITY DEFINER: runs as the function owner (admin) to access private location data
CREATE OR REPLACE FUNCTION "public"."nearest_profiles"(
    "lat" double precision, 
    "long" double precision, 
    "distance" double precision, 
    "skip" integer DEFAULT 0, 
    "take" integer DEFAULT 6
) RETURNS TABLE(
    "id" uuid, 
    "full_name" text, 
    "username" text,
    "avatar_url" text,
    "website" text,
    "created_at" timestamp without time zone, 
    "recommendations" bigint,
    "lat" double precision, 
    "long" double precision, 
    "distance" double precision,
    "buzinesses" json
)
LANGUAGE "sql"
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT 
    p.id, 
    p.full_name,
    p.username,
    p.avatar_url,
    p.website,
    p.created_at, 
    COALESCE(COUNT(pr.id), 0) as recommendations,
    ST_Y(p.location::geometry) as lat,
    ST_X(p.location::geometry) as long,
    ROUND(ST_Distance(p.location, ST_Point(long, lat)::geography)::numeric) as distance,
    COALESCE(
      JSON_AGG(
        JSON_BUILD_OBJECT('title', b.title)
      ) FILTER (WHERE b.title IS NOT NULL), 
      '[]'::json
    ) as buzinesses
  FROM public.profiles p 
  LEFT JOIN public."profileRecommendations" pr ON p.id = pr.profile_id
  LEFT JOIN public.buziness b ON p.id = b.author
  WHERE 
    p.location IS NOT NULL
    AND p.id IS DISTINCT FROM auth.uid()
    AND ST_Distance(p.location, ST_Point(long, lat)::geography) <= distance + COALESCE(p.location_radius_m, 0)
  GROUP BY p.id, p.full_name, p.username, p.avatar_url, p.website, p.created_at, p.location, p.location_radius_m
  ORDER BY ST_Distance(p.location, ST_Point(long, lat)::geography) ASC
  OFFSET CASE WHEN skip >= 0 THEN skip END ROWS
  LIMIT CASE WHEN take >= 0 THEN take END;
$$;
