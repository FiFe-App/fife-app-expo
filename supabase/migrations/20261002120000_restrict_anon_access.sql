-- Restrict what the public anon key can reach.
--
-- The anon key ships inside the app and the web bundle, so it is public: what
-- it can read, anyone can read. Logged-out visitors legitimately need only the
-- public biznisz page (app/biznisz/[id].tsx and the Netlify social preview),
-- the public profile columns, and the app version gate. This migration narrows
-- everything else back to that.
--
-- 1. buziness: 20260926120000_security_hardening rewrote the read policy with
--    in_my_world() and dropped the `auth.uid() IS NOT NULL OR public` gate that
--    20260908120000_add_buziness_public had added, so every listing was
--    readable without logging in again. Restored.
-- 2. buzinessRecommendations / comments / contacts: anon only sees the rows
--    belonging to a public listing (or, for contacts, to its author).
-- 3. Function grants. Note: `REVOKE EXECUTE … FROM PUBLIC` does NOT take a
--    function away from anon or authenticated — Supabase's default privileges
--    grant EXECUTE to both roles directly. sync_buziness_tags and
--    sync_interest_tags were therefore callable by anyone, logged in or not, and
--    could rewrite any listing's or user's tags. Their only real callers are
--    SECURITY DEFINER triggers and the service role.
-- 4. Old baseline grants let anon INSERT/UPDATE/DELETE/TRUNCATE most tables.
--    RLS blocked the rows, but anon never writes through the API — revoked.
-- 5. Default privileges: new functions no longer become callable by anon
--    automatically. A function a logged-out screen needs must be granted to
--    anon explicitly (like get_app_version_status).

-------------------------------------------------------------------
-- 1. buziness
-------------------------------------------------------------------
DROP POLICY IF EXISTS "Enable read access for all users" ON public.buziness;
CREATE POLICY "Enable read access for all users"
  ON public.buziness AS PERMISSIVE FOR SELECT TO public
  USING (
    author = auth.uid()
    OR (
      public.in_my_world(author)
      AND (auth.uid() IS NOT NULL OR buziness."public")
    )
  );

-------------------------------------------------------------------
-- 2. Rows hanging off a listing
-------------------------------------------------------------------
-- The buziness subqueries below run under buziness RLS as well, so for anon
-- they can only ever see public listings; the explicit `public` checks keep the
-- intent readable.

DROP POLICY IF EXISTS "Enable read access for all users" ON public."buzinessRecommendations";
CREATE POLICY "Enable read access for all users"
  ON public."buzinessRecommendations" AS PERMISSIVE FOR SELECT TO public
  USING (
    author = auth.uid()
    OR (
      public.in_my_world(author)
      AND (
        auth.uid() IS NOT NULL
        OR EXISTS (
          SELECT 1 FROM public.buziness b
          WHERE b.id = "buzinessRecommendations".buziness_id AND b."public"
        )
      )
    )
  );

-- The public page reads the comments of `buziness/<id>`; comments on profiles
-- stay for signed-in users.
DROP POLICY IF EXISTS "Enable read access for all users" ON public.comments;
CREATE POLICY "Enable read access for all users"
  ON public.comments AS PERMISSIVE FOR SELECT TO public
  USING (
    author = auth.uid()
    OR (
      public.in_my_world(author)
      AND (
        auth.uid() IS NOT NULL
        OR EXISTS (
          SELECT 1 FROM public.buziness b
          WHERE comments.key = 'buziness/' || b.id AND b."public"
        )
      )
    )
  );

-- NULL `public` still counts as public, as in 20260926120000.
DROP POLICY IF EXISTS "Enable read access for all users" ON public.contacts;
CREATE POLICY "Enable read access for all users"
  ON public.contacts AS PERMISSIVE FOR SELECT TO public
  USING (
    author = auth.uid()
    OR (
      contacts."public" IS DISTINCT FROM false
      AND public.in_my_world(author)
      AND (
        auth.uid() IS NOT NULL
        OR EXISTS (
          SELECT 1 FROM public.buziness b
          WHERE b.author = contacts.author AND b."public"
        )
      )
    )
  );

-------------------------------------------------------------------
-- 3. Functions only triggers and the service role may call
-------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.sync_buziness_tags(bigint, text[]) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_interest_tags(uuid, text[])  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tags_pending_embedding(integer)   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.interest_buziness_feed(text[], boolean, double precision, boolean, boolean, integer, integer)
  FROM PUBLIC, anon, authenticated;

-------------------------------------------------------------------
-- 4. anon never writes through the API
-------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES
  ON ALL TABLES IN SCHEMA public FROM anon;

-------------------------------------------------------------------
-- 5. Future objects
-------------------------------------------------------------------
-- Postgres itself grants EXECUTE on new functions to PUBLIC, and Supabase adds
-- anon on top; both are removed here. authenticated and service_role keep their
-- direct default grants, so nothing changes for signed-in callers.
-- The PUBLIC grant is a global default, which a per-schema ALTER DEFAULT
-- PRIVILEGES cannot take away — hence the statement without IN SCHEMA.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON TABLES FROM anon;
