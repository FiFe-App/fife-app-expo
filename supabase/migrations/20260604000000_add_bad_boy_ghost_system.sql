-- Ghost system: track whether a user skipped the community pledge at registration.
-- bad_boy = true  → user did NOT type "Nem leszek rosszindulatú" (silently ghosted)
-- bad_boy = false → user completed the pledge (normal access)
-- Ghosted users can log in but silently receive empty results for all other users,
-- comments, businesses, etc. They are never informed of their ghosted status.

-- 1. Add bad_boy column to profiles (default true = assume bad until proven otherwise)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bad_boy boolean NOT NULL DEFAULT false;

-- 2. Update handle_new_user to persist bad_boy from signup metadata
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS "public"."handle_new_user"();

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.profiles (id, full_name, avatar_url, username, location, location_radius_m, bad_boy)
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
    END,
    COALESCE((new.raw_user_meta_data->>'bad_boy')::boolean, true)
  );
  return new;
end;
$$;

ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Helper: returns true if the current authenticated user is a bad boy
--    Anon users (not logged in) are NOT bad boys.
CREATE OR REPLACE FUNCTION public.is_bad_boy()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    ELSE COALESCE(
      (SELECT bad_boy FROM public.profiles WHERE id = auth.uid()),
      true  -- unknown profile → treat as bad boy (defensive default)
    )
  END;
$$;

ALTER FUNCTION public.is_bad_boy() OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION public.is_bad_boy() TO anon;
GRANT EXECUTE ON FUNCTION public.is_bad_boy() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_bad_boy() TO service_role;

-- 4. RLS policies: each user only sees content from their own "world"
--    bad boys see only bad boys; non-bad-boys see only non-bad-boys.
--    Own content is always visible regardless.

-- Helper: bad_boy flag of the current user (NULL-safe, cached per statement)
-- Used inline as a subquery so Postgres can cache it within a single statement.

-- profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (
    id = auth.uid()
    OR bad_boy = public.is_bad_boy()
  );

-- buziness
DROP POLICY IF EXISTS "Enable read access for all users" ON public.buziness;
CREATE POLICY "Enable read access for all users"
  ON public.buziness
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (
    author = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = author AND bad_boy = public.is_bad_boy()
    )
  );

-- buzinessRecommendations read: same world
DROP POLICY IF EXISTS "Enable read access for all users" ON public."buzinessRecommendations";
CREATE POLICY "Enable read access for all users"
  ON public."buzinessRecommendations"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (
    author = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = author AND bad_boy = public.is_bad_boy()
    )
  );

-- buzinessRecommendations write: only own, only within own world
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public."buzinessRecommendations";
CREATE POLICY "Enable delete for users based on user_id"
  ON public."buzinessRecommendations"
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((SELECT auth.uid()) = author)
  WITH CHECK ((SELECT auth.uid()) = author);

-- comments read: same world
DROP POLICY IF EXISTS "Enable read access for all users" ON public.comments;
CREATE POLICY "Enable read access for all users"
  ON public.comments
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (
    author = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = author AND bad_boy = public.is_bad_boy()
    )
  );

-- comments write: only own
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.comments;
CREATE POLICY "Enable insert for users based on user_id"
  ON public.comments
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((SELECT auth.uid()) = author);

DROP POLICY IF EXISTS "Enable update for users based on email" ON public.comments;
CREATE POLICY "Enable update for users based on email"
  ON public.comments
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((SELECT auth.uid()) = author);

DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.comments;
CREATE POLICY "Enable delete for users based on user_id"
  ON public.comments
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((SELECT auth.uid()) = author);

-- profileRecommendations read: same world
DROP POLICY IF EXISTS "Enable read access for all users" ON public."profileRecommendations";
CREATE POLICY "Enable read access for all users"
  ON public."profileRecommendations"
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    author = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = author AND bad_boy = public.is_bad_boy()
    )
  );

-- profileRecommendations write: only own
DROP POLICY IF EXISTS "Edit for Author" ON public."profileRecommendations";
CREATE POLICY "Edit for Author"
  ON public."profileRecommendations"
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((SELECT auth.uid()) = author)
  WITH CHECK ((SELECT auth.uid()) = author);

-- contacts: same world rule
DROP POLICY IF EXISTS "Enable read access for all users" ON public.contacts;
CREATE POLICY "Enable read access for all users"
  ON public.contacts
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (
    author = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = author AND bad_boy = public.is_bad_boy()
    )
  );

-- 5. nearest_profiles: silently return nothing for bad boys
DROP FUNCTION IF EXISTS "public"."nearest_profiles"(double precision, double precision, double precision, integer, integer);

CREATE OR REPLACE FUNCTION "public"."nearest_profiles"(
    "p_lat" double precision,
    "p_long" double precision,
    "p_distance" double precision,
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
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  -- Bad boys silently get nothing
  IF public.is_bad_boy() THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.username,
    p.avatar_url,
    p.website,
    p.created_at,
    (SELECT COUNT(*) FROM public."profileRecommendations" pr WHERE pr.profile_id = p.id) AS recommendations,
    ST_Y(p.location::geometry) AS lat,
    ST_X(p.location::geometry) AS long,
    ROUND(ST_Distance(p.location, ST_Point(p_long, p_lat)::geography)::numeric)::double precision AS distance,
    COALESCE(
      (SELECT JSON_AGG(ROW_TO_JSON(b))
       FROM public.buziness b
       WHERE b.author = p.id),
      '[]'::json
    ) AS buzinesses
  FROM public.profiles p
  WHERE
    p.location IS NOT NULL
    AND p.id IS DISTINCT FROM auth.uid()
    AND p.bad_boy = public.is_bad_boy()
    AND ST_Distance(p.location, ST_Point(p_long, p_lat)::geography) <= p_distance + COALESCE(p.location_radius_m, 0)
  ORDER BY ST_Distance(p.location, ST_Point(p_long, p_lat)::geography) ASC
  OFFSET CASE WHEN "skip" >= 0 THEN "skip" END ROWS
  LIMIT CASE WHEN "take" >= 0 THEN "take" END;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.nearest_profiles(double precision, double precision, double precision, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.nearest_profiles(double precision, double precision, double precision, integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.nearest_profiles(double precision, double precision, double precision, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nearest_profiles(double precision, double precision, double precision, integer, integer) TO service_role;
