-- anon gets no table access at all.
--
-- 20261002120000_restrict_anon_access narrowed what the public anon key could
-- read to public listings. This goes the rest of the way: anon loses every
-- privilege on every table, view and sequence in `public`, and EXECUTE on every
-- function there except the few below. What a logged-out visitor legitimately
-- needs is served by those functions, which return exactly the fields the
-- screen shows and nothing else:
--
--   get_public_buziness(id)       app/biznisz/[id].tsx and the Netlify social
--                                 preview — a listing its author made public
--   get_public_profile_card(id)   app/meghivo/[uid].tsx — whose invite it is
--   get_app_version_status(…)     the update gate, already anon-callable
--
-- Signed-in users are untouched: authenticated keeps exactly the privileges it
-- has today, and the RLS policies still decide what it sees.

-------------------------------------------------------------------
-- 1. What logged-out screens may read
-------------------------------------------------------------------
-- The same rows the anon RLS of 20261002120000 allowed, in one round trip:
-- the listing (public, author not shadow-banned), its author's name and
-- picture, the author's public contacts, the recommendations and the comments.
-- `location` is returned as text (hex EWKB), the same thing PostgREST sends for
-- the column, so locationToCoords() reads both. NULL when there is nothing
-- public under that id.
CREATE OR REPLACE FUNCTION public.get_public_buziness(p_id bigint)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'id', b.id,
    'title', b.title,
    'description', b.description,
    'images', b.images,
    'ingyen', b.ingyen,
    'location', b.location::text,
    'radius', b.radius,
    'created_at', b.created_at,
    'author', b.author,
    'defaultContact', b."defaultContact",
    'public', b."public",
    'profiles', jsonb_build_object('full_name', p.full_name, 'avatar_url', p.avatar_url),
    'contacts', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
          'id', c.id, 'author', c.author, 'created_at', c.created_at,
          'data', c.data, 'public', c."public", 'title', c.title, 'type', c.type
        ) ORDER BY c.id)
      FROM public.contacts c
      WHERE c.author = b.author AND c."public" IS DISTINCT FROM false
    ), '[]'::jsonb),
    'recommendations', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
          'id', r.id, 'author', r.author, 'buziness_id', r.buziness_id, 'created_at', r.created_at,
          'profiles', jsonb_build_object('full_name', rp.full_name, 'avatar_url', rp.avatar_url)
        ) ORDER BY r.created_at)
      FROM public."buzinessRecommendations" r
      JOIN public.profiles rp ON rp.id = r.author
      WHERE r.buziness_id = b.id AND rp.bad_boy IS NOT TRUE
    ), '[]'::jsonb),
    'comments', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
          'id', cm.id, 'author', cm.author, 'created_at', cm.created_at,
          'key', cm.key, 'text', cm.text, 'image', cm.image,
          'profiles', jsonb_build_object('full_name', cp.full_name)
        ) ORDER BY cm.created_at DESC)
      FROM public.comments cm
      JOIN public.profiles cp ON cp.id = cm.author
      WHERE cm.key = 'buziness/' || b.id AND cp.bad_boy IS NOT TRUE
    ), '[]'::jsonb)
  )
  FROM public.buziness b
  JOIN public.profiles p ON p.id = b.author
  WHERE b.id = p_id
    AND b."public"
    AND p.bad_boy IS NOT TRUE;
$$;

-- The inviter's card on the invite page. Only by exact id, so it cannot be used
-- to list people.
CREATE OR REPLACE FUNCTION public.get_public_profile_card(p_id uuid)
RETURNS TABLE (id uuid, full_name text, username text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.id, p.full_name, p.username, p.avatar_url
  FROM public.profiles p
  WHERE p.id = p_id AND p.bad_boy IS NOT TRUE;
$$;

ALTER FUNCTION public.get_public_buziness(bigint) OWNER TO postgres;
ALTER FUNCTION public.get_public_profile_card(uuid) OWNER TO postgres;

-------------------------------------------------------------------
-- 2. Tables, views, sequences
-------------------------------------------------------------------
-- Revoking a table privilege also revokes the matching column privileges, so
-- this takes the column-level SELECT grants on profiles with it.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- anon is a member of PUBLIC, so a privilege granted to PUBLIC would still
-- reach it. Hand any such privilege to the roles that actually use the API
-- before taking it away from PUBLIC, so nobody but anon loses anything.
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT c.oid::regclass AS rel, a.privilege_type
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    CROSS JOIN LATERAL aclexplode(c.relacl) a
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p', 'v', 'm', 'f', 'S')
      AND a.grantee = 0 -- PUBLIC
  LOOP
    EXECUTE format('GRANT %s ON %s TO authenticated, service_role', t.privilege_type, t.rel);
    EXECUTE format('REVOKE %s ON %s FROM PUBLIC', t.privilege_type, t.rel);
  END LOOP;
END;
$$;

-------------------------------------------------------------------
-- 3. Functions
-------------------------------------------------------------------
-- A SECURITY DEFINER function runs with its owner's rights, so one that anon
-- can call reads past the table revokes above. Every function in `public`
-- loses anon (and PUBLIC, which anon is part of) except the allowlist.
-- Postgres grants EXECUTE to PUBLIC by default, so before PUBLIC goes, every
-- other role that can call the function today gets a direct grant; nothing
-- changes for authenticated, the service role or Supabase's own roles. (Trigger
-- functions need no EXECUTE to fire.) Extensions live in `extensions`, not
-- here, so PostGIS and pgvector are not touched.
DO $$
DECLARE
  f regprocedure;
  r text;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind IN ('f', 'p')
      -- functions an extension installed here belong to the extension
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d
        WHERE d.classid = 'pg_proc'::regclass AND d.objid = p.oid AND d.deptype = 'e'
      )
  LOOP
    FOREACH r IN ARRAY ARRAY[
      'authenticated', 'service_role',
      'supabase_auth_admin', 'supabase_storage_admin', 'supabase_realtime_admin'
    ] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r)
         AND has_function_privilege(r, f, 'EXECUTE') THEN
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO %I', f, r);
      END IF;
    END LOOP;
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', f);
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_buziness(bigint) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_profile_card(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_app_version_status(text, text) TO anon;

-------------------------------------------------------------------
-- 4. Future objects
-------------------------------------------------------------------
-- 20261002120000 already stops new functions from being callable by anon and
-- new tables from being writable by it; new tables are not readable either.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
