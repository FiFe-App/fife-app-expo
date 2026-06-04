-- Ghost system: track whether a user accepted the community guidelines at registration.
-- Users who skipped the pledge ("Nem leszek rosszindulatú") are silently ghosted:
-- they can log in and use the app but cannot see or interact with other users/content.

-- 1. Add good_boy column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS good_boy boolean NOT NULL DEFAULT false;

-- 2. Update handle_new_user to persist good_boy from signup metadata
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS "public"."handle_new_user"();

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.profiles (id, full_name, avatar_url, username, location, location_radius_m, good_boy)
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
    COALESCE((new.raw_user_meta_data->>'good_boy')::boolean, false)
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

-- 3. Helper function: returns true if the current authenticated user is a good_boy
--    Returns true for anon (unauthenticated) so public access still works.
CREATE OR REPLACE FUNCTION public.is_good_boy()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN true
    ELSE COALESCE(
      (SELECT good_boy FROM public.profiles WHERE id = auth.uid()),
      false
    )
  END;
$$;

ALTER FUNCTION public.is_good_boy() OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION public.is_good_boy() TO anon;
GRANT EXECUTE ON FUNCTION public.is_good_boy() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_good_boy() TO service_role;

-- 4. Update RLS policies to ghost non-good_boy users
--    They silently receive empty results — they don't know they're ghosted.

-- profiles: others' profiles invisible to ghosted users
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (
    id = auth.uid()          -- always see own profile
    OR public.is_good_boy()  -- good_boy users see everyone
  );

-- buziness: read access gated on good_boy
DROP POLICY IF EXISTS "Enable read access for all users" ON public.buziness;
CREATE POLICY "Enable read access for all users"
  ON public.buziness
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (
    author = auth.uid()      -- always see own buziness
    OR public.is_good_boy()
  );

-- buzinessRecommendations: read gated on good_boy
DROP POLICY IF EXISTS "Enable read access for all users" ON public."buzinessRecommendations";
CREATE POLICY "Enable read access for all users"
  ON public."buzinessRecommendations"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (public.is_good_boy());

-- buzinessRecommendations: write gated on good_boy
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public."buzinessRecommendations";
CREATE POLICY "Enable delete for users based on user_id"
  ON public."buzinessRecommendations"
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (
    (SELECT auth.uid()) = author
    AND public.is_good_boy()
  )
  WITH CHECK (
    (SELECT auth.uid()) = author
    AND public.is_good_boy()
  );

-- comments: read/write gated on good_boy
DROP POLICY IF EXISTS "Enable read access for all users" ON public.comments;
CREATE POLICY "Enable read access for all users"
  ON public.comments
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (public.is_good_boy());

DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.comments;
CREATE POLICY "Enable insert for users based on user_id"
  ON public.comments
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (
    (SELECT auth.uid()) = author
    AND public.is_good_boy()
  );

DROP POLICY IF EXISTS "Enable update for users based on email" ON public.comments;
CREATE POLICY "Enable update for users based on email"
  ON public.comments
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING (
    (SELECT auth.uid()) = author
    AND public.is_good_boy()
  );

DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.comments;
CREATE POLICY "Enable delete for users based on user_id"
  ON public.comments
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING (
    (SELECT auth.uid()) = author
    AND public.is_good_boy()
  );

-- profileRecommendations: read/write gated on good_boy
DROP POLICY IF EXISTS "Enable read access for all users" ON public."profileRecommendations";
CREATE POLICY "Enable read access for all users"
  ON public."profileRecommendations"
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (public.is_good_boy());

DROP POLICY IF EXISTS "Edit for Author" ON public."profileRecommendations";
CREATE POLICY "Edit for Author"
  ON public."profileRecommendations"
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (
    (SELECT auth.uid()) = author
    AND public.is_good_boy()
  )
  WITH CHECK (
    (SELECT auth.uid()) = author
    AND public.is_good_boy()
  );

-- contacts: ghosted users cannot see others' contacts
DROP POLICY IF EXISTS "Enable read access for all users" ON public.contacts;
CREATE POLICY "Enable read access for all users"
  ON public.contacts
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (
    author = auth.uid()
    OR public.is_good_boy()
  );
