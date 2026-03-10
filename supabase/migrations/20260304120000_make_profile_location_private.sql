-- Make profile.location and profile.location_radius_m private
-- Users can only read their own location via get_my_profile_location()
-- nearest_profiles accesses location internally via SECURITY DEFINER

-- Revoke table-level SELECT first (column-level REVOKE won't override table-level GRANT)
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.profiles FROM authenticated;

-- Grant SELECT on only the non-private columns
GRANT SELECT (id, updated_at, username, full_name, avatar_url, website, created_at, viewed_functions) ON public.profiles TO anon;
GRANT SELECT (id, updated_at, username, full_name, avatar_url, website, created_at, viewed_functions) ON public.profiles TO authenticated;

-- Keep INSERT/UPDATE for authenticated (RLS "own profile" policies handle row restriction)
GRANT INSERT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;

-- Helper: let authenticated users read their OWN location via a SECURITY DEFINER function
CREATE OR REPLACE FUNCTION "public"."get_my_profile_location"()
RETURNS TABLE(
    "location_wkt" text,
    "location_radius_m" real
)
LANGUAGE "sql"
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    CASE
      WHEN p.location IS NOT NULL
      THEN ST_AsText(p.location::geometry)
      ELSE NULL
    END as location_wkt,
    p.location_radius_m
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION "public"."get_my_profile_location"() TO authenticated;
REVOKE EXECUTE ON FUNCTION "public"."get_my_profile_location"() FROM anon;
REVOKE EXECUTE ON FUNCTION "public"."get_my_profile_location"() FROM public;
