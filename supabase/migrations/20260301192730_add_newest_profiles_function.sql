-- Create newest_profiles function for location-based profile search with pagination
CREATE OR REPLACE FUNCTION "public"."newest_profiles"(
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
    "location" "extensions"."geography",
    "location_radius_m" real,
    "recommendations" bigint,
    "lat" double precision, 
    "long" double precision, 
    "distance" double precision,
    "buzinesses" json
)
LANGUAGE "sql"
AS $$
  SET search_path TO public; 
  SELECT 
    p.id, 
    p.full_name,
    p.username,
    p.avatar_url,
    p.website,
    p.created_at, 
    p.location,
    p.location_radius_m,
    COALESCE(COUNT(pr.id), 0) as recommendations,
    CASE 
      WHEN p.location IS NOT NULL 
      THEN ST_Y(p.location::geometry) 
      ELSE NULL 
    END as lat,
    CASE 
      WHEN p.location IS NOT NULL 
      THEN ST_X(p.location::geometry) 
      ELSE NULL 
    END as long,
    CASE 
      WHEN p.location IS NOT NULL 
      THEN ST_Distance(p.location, ST_Point(long, lat)::geography) 
      ELSE NULL 
    END as distance,
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
    CASE 
      WHEN p.location IS NOT NULL 
      THEN ST_Distance(p.location, ST_Point(long, lat)::geography) <= distance
      ELSE true 
    END
  GROUP BY p.id, p.full_name, p.username, p.avatar_url, p.website, p.created_at, p.location, p.location_radius_m
  ORDER BY p.created_at DESC
  OFFSET CASE WHEN skip >= 0 THEN skip END ROWS
  LIMIT CASE WHEN take >= 0 THEN take END;
$$;
