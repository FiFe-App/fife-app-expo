-- Repair migration: re-applies schema changes from migrations 20260301181930,
-- 20260301192730, and 20260304120000 which were recorded as applied on remote
-- but whose SQL never actually executed.
-- All statements are idempotent (IF NOT EXISTS / CREATE OR REPLACE / IF EXISTS).

-------------------------------------------------------------------
-- 1. Add missing column (from initial schema, absent on remote)
-------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location_radius_m real;

-------------------------------------------------------------------
-- 2. Re-apply 20260301181930: handle_new_user with location fields
-------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS "public"."handle_new_user"();
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.profiles (id, full_name, avatar_url, username, location, location_radius_m)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'username',
    CASE
      WHEN new.raw_user_meta_data->>'location' IS NOT NULL
      THEN extensions.ST_GeogFromText('SRID=4326;' || (new.raw_user_meta_data->>'location'))
      ELSE NULL
    END,
    CASE
      WHEN new.raw_user_meta_data->>'location_radius_m' IS NOT NULL
      THEN (new.raw_user_meta_data->>'location_radius_m')::real
      ELSE NULL
    END
  );
  return new;
end;
$$;

ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-------------------------------------------------------------------
-- 3. Re-apply 20260301192730: nearest_profiles function
-------------------------------------------------------------------
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

-------------------------------------------------------------------
-- 4. Re-apply 20260304120000: make location columns private
-------------------------------------------------------------------

-- Revoke table-level SELECT (column-level REVOKE won't override table-level GRANT)
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.profiles FROM authenticated;

-- Grant SELECT on only the non-private columns
GRANT SELECT (
    id, updated_at, username, full_name, avatar_url, website, created_at, viewed_functions
  ) ON public.profiles TO anon;
GRANT SELECT (
    id, updated_at, username, full_name, avatar_url, website, created_at, viewed_functions
  ) ON public.profiles TO authenticated;

-- Keep INSERT/UPDATE for authenticated (RLS policies handle row restriction)
GRANT INSERT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;

-- Helper: read own location
CREATE OR REPLACE FUNCTION "public"."get_my_profile_location"() RETURNS TABLE(
    "location_wkt" text,
    "location_radius_m" real
  ) LANGUAGE "sql" SECURITY DEFINER
SET search_path = public, extensions
AS $$
SELECT CASE
    WHEN p.location IS NOT NULL THEN ST_AsText(p.location::geometry)
    ELSE NULL
  END as location_wkt,
  p.location_radius_m
FROM public.profiles p
WHERE p.id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION "public"."get_my_profile_location"() TO authenticated;
REVOKE EXECUTE ON FUNCTION "public"."get_my_profile_location"() FROM anon;
REVOKE EXECUTE ON FUNCTION "public"."get_my_profile_location"() FROM public;

-- Helper: write own location
CREATE OR REPLACE FUNCTION "public"."update_my_profile_location"(
    "lat" double precision,
    "long" double precision,
    "radius_m" real
  ) RETURNS void LANGUAGE "sql" SECURITY DEFINER
SET search_path = public, extensions
AS $$
UPDATE public.profiles
SET location = CASE
    WHEN lat IS NULL OR long IS NULL THEN NULL
    ELSE ST_GeogFromText('SRID=4326;POINT(' || long || ' ' || lat || ')')
  END,
  location_radius_m = radius_m
WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION "public"."update_my_profile_location"(double precision, double precision, real) TO authenticated;
REVOKE EXECUTE ON FUNCTION "public"."update_my_profile_location"(double precision, double precision, real) FROM anon;
REVOKE EXECUTE ON FUNCTION "public"."update_my_profile_location"(double precision, double precision, real) FROM public;
