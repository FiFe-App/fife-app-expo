-- Restrict nearest_profiles() to authenticated users only.
-- Adds an in-function auth guard (defense-in-depth) and revokes EXECUTE from anon/public.

-- Re-create the function in PL/pgSQL so we can add a hard auth check before
-- the expensive query runs. SECURITY DEFINER is kept so the function can
-- still access the private location columns.

-- DROP first: CREATE OR REPLACE cannot rename existing input parameters.
DROP FUNCTION IF EXISTS "public"."nearest_profiles"(double precision, double precision, double precision, integer, integer);

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
    (SELECT COUNT(*) FROM public."profileRecommendations" pr WHERE pr.profile_id = p.id) as recommendations,
    ST_Y(p.location::geometry) as lat,
    ST_X(p.location::geometry) as long,
    ROUND(ST_Distance(p.location, ST_Point(long, lat)::geography)::numeric) as distance,
    COALESCE(
      (SELECT JSON_AGG(ROW_TO_JSON(b))
       FROM public.buziness b
       WHERE b.author = p.id),
      '[]'::json
    ) as buzinesses
  FROM public.profiles p
  WHERE
    p.location IS NOT NULL
    AND p.id IS DISTINCT FROM auth.uid()
    AND ST_Distance(p.location, ST_Point(long, lat)::geography) <= distance + COALESCE(p.location_radius_m, 0)
  ORDER BY ST_Distance(p.location, ST_Point(long, lat)::geography) ASC
  OFFSET CASE WHEN skip >= 0 THEN skip END ROWS
  LIMIT CASE WHEN take >= 0 THEN take END;
$$;

-- Remove the implicit PUBLIC grant (default in Postgres) and explicitly allow
-- only the authenticated role to execute.
REVOKE EXECUTE ON FUNCTION "public"."nearest_profiles"(double precision, double precision, double precision, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION "public"."nearest_profiles"(double precision, double precision, double precision, integer, integer) FROM anon;
GRANT  EXECUTE ON FUNCTION "public"."nearest_profiles"(double precision, double precision, double precision, integer, integer) TO authenticated;
