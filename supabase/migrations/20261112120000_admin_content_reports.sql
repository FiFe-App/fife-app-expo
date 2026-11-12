-- Admin: content reports and a business list.
--
-- Since 20261029120000_generalise_reports.sql a report can be about a message,
-- a group message, a biznisz or a comment, not only a profile (target_type +
-- target_id + target_excerpt; reported_profile_id is the author, or NULL once
-- the author is deleted). admin_list_reports did not return any of that, so the
-- admin could not see what had been reported.
--
-- Comments on a biznisz are stored with comments.key = 'buziness/<id>'
-- (app/biznisz/[id].tsx), so a comment report can be traced back to its biznisz.
--
-- Service role only, like the rest of the admin_* functions: they return emails.

-------------------------------------------------------------------
-- 1. admin_list_reports — now with the reported content
--    The return type changes, which CREATE OR REPLACE cannot do.
-------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.admin_list_reports(uuid, text, integer, integer);

CREATE OR REPLACE FUNCTION public.admin_list_reports(
  p_reported_id uuid    DEFAULT NULL,
  p_reason      text    DEFAULT NULL,
  p_target_type text    DEFAULT NULL,
  p_buziness_id bigint  DEFAULT NULL,  -- the biznisz itself and comments under it
  p_limit       integer DEFAULT 50,
  p_offset      integer DEFAULT 0
)
RETURNS TABLE(
  id               bigint,
  created_at       timestamp with time zone,
  reason           text,
  description      text,
  target_type      text,
  target_id        text,
  target_excerpt   text,
  buziness_id      bigint,
  buziness_title   text,
  author_id        uuid,
  author_name      text,
  author_email     text,
  reported_id      uuid,
  reported_name    text,
  reported_email   text,
  reported_bad_boy boolean,
  total_count      bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH resolved AS (
    SELECT
      r.*,
      CASE
        WHEN r.target_type = 'biznisz' AND r.target_id ~ '^[0-9]{1,18}$'
          THEN r.target_id::bigint
        WHEN r.target_type = 'comment' AND r.target_id ~ '^[0-9]{1,18}$'
          THEN (
            SELECT substring(c.key FROM '^buziness/([0-9]{1,18})$')::bigint
            FROM public.comments c
            WHERE c.id = r.target_id::bigint
          )
      END AS buziness_id
    FROM public.reports r
  )
  SELECT
    r.id,
    r.created_at,
    r.reason,
    r.description,
    r.target_type,
    r.target_id,
    r.target_excerpt,
    r.buziness_id,
    b.title,
    r.author,
    ap.full_name,
    au.email::text,
    r.reported_profile_id,
    rp.full_name,
    ru.email::text,
    COALESCE(rp.bad_boy, false),
    count(*) OVER ()
  FROM resolved r
  LEFT JOIN public.buziness  b  ON b.id  = r.buziness_id
  LEFT JOIN auth.users      au ON au.id = r.author
  LEFT JOIN public.profiles ap ON ap.id = r.author
  LEFT JOIN auth.users      ru ON ru.id = r.reported_profile_id
  LEFT JOIN public.profiles rp ON rp.id = r.reported_profile_id
  WHERE (p_reported_id IS NULL OR r.reported_profile_id = p_reported_id)
    AND (COALESCE(p_reason, '') = '' OR r.reason = p_reason)
    AND (COALESCE(p_target_type, '') = '' OR r.target_type = p_target_type)
    AND (p_buziness_id IS NULL OR r.buziness_id = p_buziness_id)
  ORDER BY r.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 500)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

ALTER FUNCTION public.admin_list_reports(uuid, text, text, bigint, integer, integer) OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.admin_list_reports(uuid, text, text, bigint, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_list_reports(uuid, text, text, bigint, integer, integer) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_list_reports(uuid, text, text, bigint, integer, integer) TO service_role;

-------------------------------------------------------------------
-- 2. admin_list_buzinesses — paginated, filterable business list
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_buzinesses(
  p_search   text    DEFAULT NULL,
  p_reported boolean DEFAULT false,  -- true = only those with a report on it or its comments
  p_public   boolean DEFAULT NULL,   -- NULL = both
  p_limit    integer DEFAULT 50,
  p_offset   integer DEFAULT 0
)
RETURNS TABLE(
  id                   bigint,
  title                text,
  description          text,
  created_at           timestamp with time zone,
  public               boolean,
  ingyen               boolean,
  author_id            uuid,
  author_name          text,
  author_email         text,
  author_bad_boy       boolean,
  report_count         bigint,
  comment_report_count bigint,
  total_count          bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH base AS (
    SELECT
      b.id,
      b.title,
      b.description,
      b.created_at,
      b.public,
      b.ingyen,
      b.author AS author_id,
      p.full_name AS author_name,
      u.email::text AS author_email,
      COALESCE(p.bad_boy, false) AS author_bad_boy,
      (SELECT count(*) FROM public.reports r
        WHERE r.target_type = 'biznisz' AND r.target_id = b.id::text) AS report_count,
      (SELECT count(*) FROM public.reports r
        JOIN public.comments c ON r.target_id = c.id::text
        WHERE r.target_type = 'comment' AND c.key = 'buziness/' || b.id) AS comment_report_count
    FROM public.buziness b
    LEFT JOIN public.profiles p ON p.id = b.author
    LEFT JOIN auth.users      u ON u.id = b.author
  )
  SELECT x.*, count(*) OVER () AS total_count
  FROM base x
  WHERE (p_public IS NULL OR x.public = p_public)
    AND (NOT COALESCE(p_reported, false) OR x.report_count + x.comment_report_count > 0)
    AND (
      COALESCE(trim(p_search), '') = ''
      OR x.title        ILIKE '%' || trim(p_search) || '%'
      OR x.description  ILIKE '%' || trim(p_search) || '%'
      OR x.author_name  ILIKE '%' || trim(p_search) || '%'
      OR x.author_email ILIKE '%' || trim(p_search) || '%'
    )
  ORDER BY x.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 500)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

ALTER FUNCTION public.admin_list_buzinesses(text, boolean, boolean, integer, integer) OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.admin_list_buzinesses(text, boolean, boolean, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_list_buzinesses(text, boolean, boolean, integer, integer) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_list_buzinesses(text, boolean, boolean, integer, integer) TO service_role;
