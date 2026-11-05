-- Security hardening (audit 2026-09).
--
-- 1. profiles: 20260427130000 granted table-wide SELECT to anon/authenticated,
--    which undid the column-level lockdown of 20260304120000 — every user's
--    home location, push token, bad_boy flag and notification settings were
--    readable with the public anon key. Authenticated also held UPDATE on every
--    column, so a ghosted user could clear their own bad_boy flag.
-- 2. "hide blocked profiles" was PERMISSIVE, i.e. OR'd with the same-world
--    policy, which made every profile (bad_boy ones included) visible.
-- 3. handle_new_user stopped writing bad_boy in 20260604120100, so the ghost
--    system silently stopped applying to new sign-ups.
-- 4. nearest_profiles returned exact coordinates with an unbounded radius.
-- 5. contacts ignored its `public` flag.
-- 6. messages: blocked users could still message; a message could point at
--    another user's image path, which then became readable by the recipient.
-- 7. eventResponses: FOR ALL USING (true) let anyone rewrite anyone's rows.
-- 8. buziness: owners could write embedding / embedding_text directly and so
--    rig search ranking.
-- 9. get_popular_search_queries exposed every user's raw search text to anon.

-------------------------------------------------------------------
-- Helper: is `other` in the caller's world (bad_boy isolation)?
-- SECURITY DEFINER because callers no longer hold SELECT on profiles.bad_boy,
-- and the policies below used to read it through a subquery.
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.in_my_world(other uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = other AND bad_boy = public.is_bad_boy()
  );
$$;

ALTER FUNCTION public.in_my_world(uuid) OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.in_my_world(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.in_my_world(uuid) TO anon, authenticated, service_role;

ALTER FUNCTION public.is_blocked_by(uuid) SET search_path = public;

-------------------------------------------------------------------
-- 1. profiles: column-level privileges only
-- (REVOKE on the table also drops the column-level grants.)
-------------------------------------------------------------------
REVOKE ALL ON public.profiles FROM anon, authenticated;

GRANT SELECT (id, username, full_name, avatar_url, website, created_at, updated_at, viewed_functions)
  ON public.profiles TO anon, authenticated;

-- app/user/edit.tsx upserts exactly these columns; tutorialReducer updates
-- viewed_functions. Location and push token go through SECURITY DEFINER RPCs.
GRANT INSERT (id, username, full_name, avatar_url, website, created_at, updated_at, viewed_functions)
  ON public.profiles TO authenticated;
GRANT UPDATE (id, username, full_name, avatar_url, website, created_at, updated_at, viewed_functions)
  ON public.profiles TO authenticated;

GRANT ALL ON public.profiles TO service_role;

-------------------------------------------------------------------
-- 2. Blocking must narrow visibility, not widen it
-------------------------------------------------------------------
DROP POLICY IF EXISTS "hide blocked profiles" ON public.profiles;
CREATE POLICY "hide blocked profiles"
  ON public.profiles
  AS RESTRICTIVE
  FOR SELECT
  TO public
  USING (
    id = auth.uid()
    OR NOT public.is_blocked_by(id)
  );

-------------------------------------------------------------------
-- 3. handle_new_user: persist bad_boy again (same body as 20260828120000
--    plus the bad_boy column). Sign-up flows that send no flag stay normal.
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  inviter uuid;
begin
  insert into public.profiles (
    id, full_name, avatar_url, username,
    location, location_radius_m,
    notify_push, notify_email, newsletter, emotion_daily_prompt,
    bad_boy
  )
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
    COALESCE((new.raw_user_meta_data->>'notify_push')::boolean, false),
    COALESCE((new.raw_user_meta_data->>'notify_email')::boolean, true),
    COALESCE((new.raw_user_meta_data->>'newsletter')::boolean, false),
    COALESCE((new.raw_user_meta_data->>'emotion_daily_prompt')::boolean, false),
    COALESCE((new.raw_user_meta_data->>'bad_boy')::boolean, false)
  );

  insert into public.user_settings (
    author, notify_push, notify_email, newsletter, emotion_daily_prompt
  )
  values (
    new.id,
    COALESCE((new.raw_user_meta_data->>'notify_push')::boolean, false),
    COALESCE((new.raw_user_meta_data->>'notify_email')::boolean, true),
    COALESCE((new.raw_user_meta_data->>'newsletter')::boolean, false),
    COALESCE((new.raw_user_meta_data->>'emotion_daily_prompt')::boolean, false)
  )
  on conflict (author) do nothing;

  if new.raw_user_meta_data->>'invited_by' ~*
     '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    inviter := (new.raw_user_meta_data->>'invited_by')::uuid;

    insert into public.invitations (author, guest)
    select inviter, new.id
    where inviter <> new.id
      and exists (select 1 from public.profiles p where p.id = inviter)
    on conflict (guest) do nothing;
  end if;

  return new;
end;
$$;

ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

-------------------------------------------------------------------
-- Same-world SELECT policies, rewritten to use in_my_world()
-------------------------------------------------------------------
DROP POLICY IF EXISTS "Enable read access for all users" ON public.buziness;
CREATE POLICY "Enable read access for all users"
  ON public.buziness AS PERMISSIVE FOR SELECT TO public
  USING (author = auth.uid() OR public.in_my_world(author));

DROP POLICY IF EXISTS "Enable read access for all users" ON public."buzinessRecommendations";
CREATE POLICY "Enable read access for all users"
  ON public."buzinessRecommendations" AS PERMISSIVE FOR SELECT TO public
  USING (author = auth.uid() OR public.in_my_world(author));

DROP POLICY IF EXISTS "Enable read access for all users" ON public.comments;
CREATE POLICY "Enable read access for all users"
  ON public.comments AS PERMISSIVE FOR SELECT TO public
  USING (author = auth.uid() OR public.in_my_world(author));

DROP POLICY IF EXISTS "Enable read access for all users" ON public."profileRecommendations";
CREATE POLICY "Enable read access for all users"
  ON public."profileRecommendations" AS PERMISSIVE FOR SELECT TO authenticated
  USING (author = auth.uid() OR public.in_my_world(author));

-------------------------------------------------------------------
-- 5. contacts: honour the `public` flag (NULL counts as public — the app has
--    always written true and older rows may be NULL)
-------------------------------------------------------------------
DROP POLICY IF EXISTS "Enable read access for all users" ON public.contacts;
CREATE POLICY "Enable read access for all users"
  ON public.contacts AS PERMISSIVE FOR SELECT TO public
  USING (
    author = auth.uid()
    OR (public IS DISTINCT FROM false AND public.in_my_world(author))
  );

-------------------------------------------------------------------
-- 4. nearest_profiles: bounded radius and page size, coarse coordinates,
--    blocked users excluded. Signature and return shape unchanged.
-------------------------------------------------------------------
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
DECLARE
  max_distance constant double precision := 100000; -- matches the app's 100 km search
  radius double precision := LEAST(GREATEST(COALESCE(p_distance, 0), 0), max_distance);
  page_size integer := LEAST(GREATEST(COALESCE("take", 6), 0), 50);
  page_offset integer := GREATEST(COALESCE("skip", 0), 0);
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
    -- ~1 km precision: enough for a map pin, not a home address
    ROUND(ST_Y(p.location::geometry)::numeric, 2)::double precision AS lat,
    ROUND(ST_X(p.location::geometry)::numeric, 2)::double precision AS long,
    -- rounded to 100 m so distances from several points can't trilaterate
    (ROUND(ST_Distance(p.location, ST_Point(p_long, p_lat)::geography)::numeric, -2))::double precision AS distance,
    COALESCE(
      (SELECT JSON_AGG(ROW_TO_JSON(b))
       FROM (
         SELECT bz.id, bz.title, bz.description, bz.author, bz.created_at,
                bz.images, bz.ingyen, bz.radius, bz."defaultContact"
         FROM public.buziness bz
         WHERE bz.author = p.id
       ) b),
      '[]'::json
    ) AS buzinesses
  FROM public.profiles p
  WHERE
    p.location IS NOT NULL
    AND p.id IS DISTINCT FROM auth.uid()
    AND p.bad_boy = public.is_bad_boy()
    AND NOT public.is_blocked_by(p.id)
    AND ST_Distance(p.location, ST_Point(p_long, p_lat)::geography) <= radius + COALESCE(p.location_radius_m, 0)
  ORDER BY ST_Distance(p.location, ST_Point(p_long, p_lat)::geography) ASC
  OFFSET page_offset
  LIMIT page_size;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.nearest_profiles(double precision, double precision, double precision, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.nearest_profiles(double precision, double precision, double precision, integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.nearest_profiles(double precision, double precision, double precision, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nearest_profiles(double precision, double precision, double precision, integer, integer) TO service_role;

-------------------------------------------------------------------
-- 6. messages: no messaging across a block; images must be the sender's own
-------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author
    AND NOT public.is_blocked_by("to"::uuid)
    AND (image IS NULL OR split_part(image, '/', 1) = author::text)
  );

DROP POLICY IF EXISTS "Chat participants can view message images" ON storage.objects;
CREATE POLICY "Chat participants can view message images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'messageImages'
  AND (
    (SELECT auth.uid()::text) = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1
      FROM public.messages m
      WHERE m.image = storage.objects.name
        AND m."to" = (SELECT auth.uid())
        AND m.author::text = (storage.foldername(storage.objects.name))[1]
    )
  )
);

-------------------------------------------------------------------
-- 7. eventResponses: readable by signed-in users, writable only by the owner
-------------------------------------------------------------------
DROP POLICY IF EXISTS "Enable all for authenticated users only" ON public."eventResponses";

CREATE POLICY "Enable read for authenticated users"
  ON public."eventResponses" FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users manage own responses"
  ON public."eventResponses" FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-------------------------------------------------------------------
-- 8. buziness: embeddings are written only by service_role (edge functions)
-------------------------------------------------------------------
REVOKE INSERT, UPDATE ON public.buziness FROM anon, authenticated;
GRANT INSERT (author, title, description, images, location, radius, "defaultContact", ingyen)
  ON public.buziness TO authenticated;
GRANT UPDATE (author, title, description, images, location, radius, "defaultContact", ingyen)
  ON public.buziness TO authenticated;

-------------------------------------------------------------------
-- 9. Popular search suggestions: signed-in only, only queries several
--    people have searched for, bounded page size.
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_popular_search_queries(
  p_prefix   text    DEFAULT '',
  p_limit    integer DEFAULT 8
)
RETURNS TABLE (query_text text, hit_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    qec.query_text,
    qec.hit_count
  FROM public.query_embedding_cache qec
  WHERE
    qec.hit_count >= 3
    AND (p_prefix = '' OR qec.query_text ILIKE (replace(replace(replace(p_prefix, '\', '\\'), '%', '\%'), '_', '\_') || '%'))
  ORDER BY qec.hit_count DESC, qec.last_used_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 8), 0), 20);
$$;

REVOKE EXECUTE ON FUNCTION public.get_popular_search_queries(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_popular_search_queries(text, integer) TO authenticated, service_role;
