-- Admin: content moderation (reports, businesses, requests, help contacts),
-- weekly report additions and permanent admin IP bans.
--
-- Reports. Since 20261029120000_generalise_reports.sql a report can be about a
-- message, a group message, a biznisz or a comment, and since
-- 20261030120000_add_requests.sql also a request (target_type + target_id +
-- target_excerpt; reported_profile_id is the author, or NULL once deleted).
-- Comments hang off their parent through comments.key: 'buziness/<id>' or
-- 'request/<id>', so a comment report can be traced back to the content it
-- was written under.
--
-- This file was first written as 20261112120000_admin_content_reports.sql,
-- which collided with dev's 20261112120000_requests_embeddings.sql: Supabase
-- tracks migrations by that version prefix, so one of the two would have been
-- skipped. It never ran anywhere under the old name.
--
-- Every function here is service role only, like the rest of the admin_*
-- functions: they return emails.

-------------------------------------------------------------------
-- 1. admin_list_reports — with the reported content resolved
--    The return type changes, which CREATE OR REPLACE cannot do.
-------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.admin_list_reports(uuid, text, integer, integer);
DROP FUNCTION IF EXISTS public.admin_list_reports(uuid, text, text, bigint, integer, integer);

CREATE OR REPLACE FUNCTION public.admin_list_reports(
  p_reported_id  uuid    DEFAULT NULL,
  p_reason       text    DEFAULT NULL,
  p_target_type  text    DEFAULT NULL,
  p_content_type text    DEFAULT NULL,  -- 'biznisz' | 'request', with p_content_id:
  p_content_id   bigint  DEFAULT NULL,  -- that content and the comments under it
  p_limit        integer DEFAULT 50,
  p_offset       integer DEFAULT 0
)
RETURNS TABLE(
  id               bigint,
  created_at       timestamp with time zone,
  reason           text,
  description      text,
  target_type      text,
  target_id        text,
  target_excerpt   text,
  content_type     text,
  content_id       bigint,
  content_title    text,
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
  WITH parent AS (
    -- Which biznisz / request the report is about, directly or via a comment.
    SELECT
      r.id AS report_id,
      CASE
        WHEN r.target_type IN ('biznisz', 'request') THEN r.target_type
        WHEN r.target_type = 'comment' THEN
          CASE split_part(c.key, '/', 1)
            WHEN 'buziness' THEN 'biznisz'
            WHEN 'request'  THEN 'request'
          END
      END AS content_type,
      CASE
        WHEN r.target_type IN ('biznisz', 'request') AND r.target_id ~ '^[0-9]{1,18}$'
          THEN r.target_id::bigint
        WHEN r.target_type = 'comment' AND c.key ~ '^(buziness|request)/[0-9]{1,18}$'
          THEN split_part(c.key, '/', 2)::bigint
      END AS content_id
    FROM public.reports r
    -- The cast sits inside CASE on purpose: AND gives no evaluation order, so
    -- "target_id ~ regex AND c.id = target_id::bigint" can still cast a
    -- malformed id and fail the whole list. CASE does guarantee the order.
    LEFT JOIN public.comments c
      ON c.id = CASE
                  WHEN r.target_type = 'comment' AND r.target_id ~ '^[0-9]{1,18}$'
                    THEN r.target_id::bigint
                END
  )
  SELECT
    r.id,
    r.created_at,
    r.reason,
    r.description,
    r.target_type,
    r.target_id,
    r.target_excerpt,
    CASE WHEN pa.content_id IS NOT NULL THEN pa.content_type END,
    pa.content_id,
    CASE pa.content_type WHEN 'biznisz' THEN b.title WHEN 'request' THEN rq.title END,
    r.author,
    ap.full_name,
    au.email::text,
    r.reported_profile_id,
    rp.full_name,
    ru.email::text,
    COALESCE(rp.bad_boy, false),
    count(*) OVER ()
  FROM public.reports r
  JOIN parent pa ON pa.report_id = r.id
  LEFT JOIN public.buziness b  ON pa.content_type = 'biznisz' AND b.id  = pa.content_id
  LEFT JOIN public.requests rq ON pa.content_type = 'request' AND rq.id = pa.content_id
  LEFT JOIN auth.users      au ON au.id = r.author
  LEFT JOIN public.profiles ap ON ap.id = r.author
  LEFT JOIN auth.users      ru ON ru.id = r.reported_profile_id
  LEFT JOIN public.profiles rp ON rp.id = r.reported_profile_id
  WHERE (p_reported_id IS NULL OR r.reported_profile_id = p_reported_id)
    AND (COALESCE(p_reason, '') = '' OR r.reason = p_reason)
    AND (COALESCE(p_target_type, '') = '' OR r.target_type = p_target_type)
    AND (p_content_id IS NULL OR (pa.content_type = p_content_type AND pa.content_id = p_content_id))
  ORDER BY r.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 500)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

ALTER FUNCTION public.admin_list_reports(uuid, text, text, text, bigint, integer, integer) OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.admin_list_reports(uuid, text, text, text, bigint, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_list_reports(uuid, text, text, text, bigint, integer, integer) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_list_reports(uuid, text, text, text, bigint, integer, integer) TO service_role;

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

-------------------------------------------------------------------
-- 3. admin_list_requests — paginated, filterable request list
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_requests(
  p_search   text    DEFAULT NULL,
  p_reported boolean DEFAULT false,  -- true = only those with a report on it or its comments
  p_status   text    DEFAULT NULL,   -- 'open' | 'solved' | NULL = both
  p_limit    integer DEFAULT 50,
  p_offset   integer DEFAULT 0
)
RETURNS TABLE(
  id                   bigint,
  title                text,
  description          text,
  tags                 text[],
  created_at           timestamp with time zone,
  status               text,
  solved_at            timestamp with time zone,
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
      q.id,
      q.title,
      q.description,
      q.tags,
      q.created_at,
      q.status,
      q.solved_at,
      q.author AS author_id,
      p.full_name AS author_name,
      u.email::text AS author_email,
      COALESCE(p.bad_boy, false) AS author_bad_boy,
      (SELECT count(*) FROM public.reports r
        WHERE r.target_type = 'request' AND r.target_id = q.id::text) AS report_count,
      (SELECT count(*) FROM public.reports r
        JOIN public.comments c ON r.target_id = c.id::text
        WHERE r.target_type = 'comment' AND c.key = 'request/' || q.id) AS comment_report_count
    FROM public.requests q
    LEFT JOIN public.profiles p ON p.id = q.author
    LEFT JOIN auth.users      u ON u.id = q.author
  )
  SELECT x.*, count(*) OVER () AS total_count
  FROM base x
  WHERE (COALESCE(p_status, '') = '' OR x.status = p_status)
    AND (NOT COALESCE(p_reported, false) OR x.report_count + x.comment_report_count > 0)
    AND (
      COALESCE(trim(p_search), '') = ''
      OR x.title        ILIKE '%' || trim(p_search) || '%'
      OR x.description  ILIKE '%' || trim(p_search) || '%'
      OR x.author_name  ILIKE '%' || trim(p_search) || '%'
      OR x.author_email ILIKE '%' || trim(p_search) || '%'
      OR EXISTS (SELECT 1 FROM unnest(x.tags) AS t(tag) WHERE t.tag ILIKE '%' || trim(p_search) || '%')
    )
  ORDER BY x.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 500)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

ALTER FUNCTION public.admin_list_requests(text, boolean, text, integer, integer) OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.admin_list_requests(text, boolean, text, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_list_requests(text, boolean, text, integer, integer) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_list_requests(text, boolean, text, integer, integer) TO service_role;

-------------------------------------------------------------------
-- 4. admin_list_help_contacts — suggestions awaiting review and live ones
--    (20260830140000: suggestions come in with public = false, and there was
--    no way to publish them other than editing the row by hand)
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_help_contacts(
  p_status text    DEFAULT 'pending',  -- 'pending' | 'public' | NULL = both
  p_search text    DEFAULT NULL,
  p_limit  integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id           bigint,
  created_at   timestamp with time zone,
  type         text,
  title        text,
  data         text,
  description  text,
  public       boolean,
  author_id    uuid,
  author_name  text,
  author_email text,
  total_count  bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    h.id,
    h.created_at,
    h.type::text,
    h.title,
    h.data,
    h.description,
    h.public,
    h.author,
    p.full_name,
    u.email::text,
    count(*) OVER ()
  FROM public.help_contacts h
  LEFT JOIN public.profiles p ON p.id = h.author
  LEFT JOIN auth.users      u ON u.id = h.author
  WHERE (COALESCE(p_status, '') = ''
         OR (p_status = 'pending' AND NOT h.public)
         OR (p_status = 'public'  AND h.public))
    AND (
      COALESCE(trim(p_search), '') = ''
      OR h.title       ILIKE '%' || trim(p_search) || '%'
      OR h.data        ILIKE '%' || trim(p_search) || '%'
      OR h.description ILIKE '%' || trim(p_search) || '%'
    )
  ORDER BY h.created_at DESC, h.id DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 500)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

ALTER FUNCTION public.admin_list_help_contacts(text, text, integer, integer) OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.admin_list_help_contacts(text, text, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_list_help_contacts(text, text, integer, integer) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_list_help_contacts(text, text, integer, integer) TO service_role;

-------------------------------------------------------------------
-- 5. admin_weekly_stats — plus requests and pending help contacts
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_weekly_stats(
  p_from timestamp with time zone,
  p_to   timestamp with time zone
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH prev AS (
    SELECT p_from - (p_to - p_from) AS prev_from, p_from AS prev_to
  )
  SELECT jsonb_build_object(
    'from', p_from,
    'to',   p_to,
    'new_users',
      (SELECT count(*) FROM auth.users u WHERE u.created_at >= p_from AND u.created_at < p_to),
    'new_users_prev',
      (SELECT count(*) FROM auth.users u, prev WHERE u.created_at >= prev.prev_from AND u.created_at < prev.prev_to),
    'new_buziness',
      (SELECT count(*) FROM public.buziness b WHERE b.created_at >= p_from AND b.created_at < p_to),
    'new_buziness_prev',
      (SELECT count(*) FROM public.buziness b, prev WHERE b.created_at >= prev.prev_from AND b.created_at < prev.prev_to),
    'new_requests',
      (SELECT count(*) FROM public.requests q WHERE q.created_at >= p_from AND q.created_at < p_to),
    'new_requests_prev',
      (SELECT count(*) FROM public.requests q, prev WHERE q.created_at >= prev.prev_from AND q.created_at < prev.prev_to),
    'new_reports',
      (SELECT count(*) FROM public.reports r WHERE r.created_at >= p_from AND r.created_at < p_to),
    'new_reports_prev',
      (SELECT count(*) FROM public.reports r, prev WHERE r.created_at >= prev.prev_from AND r.created_at < prev.prev_to),
    'new_bad_boys',
      (SELECT count(*) FROM auth.users u JOIN public.profiles p ON p.id = u.id
        WHERE p.bad_boy AND u.created_at >= p_from AND u.created_at < p_to),
    'new_bad_boys_prev',
      (SELECT count(*) FROM auth.users u JOIN public.profiles p ON p.id = u.id, prev
        WHERE p.bad_boy AND u.created_at >= prev.prev_from AND u.created_at < prev.prev_to),
    'total_users',           (SELECT count(*) FROM auth.users),
    'total_buziness',        (SELECT count(*) FROM public.buziness),
    'total_bad_boys',        (SELECT count(*) FROM public.profiles WHERE bad_boy),
    'pending_help_contacts', (SELECT count(*) FROM public.help_contacts WHERE NOT public),
    'buzinesses', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'id', b.id,
               'title', b.title,
               'author_name', p.full_name,
               'author_bad_boy', COALESCE(p.bad_boy, false)
             ) ORDER BY b.created_at)
      FROM public.buziness b
      LEFT JOIN public.profiles p ON p.id = b.author
      WHERE b.created_at >= p_from AND b.created_at < p_to
    ), '[]'::jsonb)
  );
$$;

ALTER FUNCTION public.admin_weekly_stats(timestamp with time zone, timestamp with time zone) OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.admin_weekly_stats(timestamp with time zone, timestamp with time zone) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_weekly_stats(timestamp with time zone, timestamp with time zone) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_weekly_stats(timestamp with time zone, timestamp with time zone) TO service_role;

-------------------------------------------------------------------
-- 6. admin_ip_bans — permanent bans after too many failed admin logins
--    Written by the admin Netlify login function once an IP reaches the
--    failure limit; lifted only by hand (admin Biztonság page, or SQL).
-------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_ip_bans (
  ip              text PRIMARY KEY,
  banned_at       timestamp with time zone NOT NULL DEFAULT now(),
  failed_attempts integer NOT NULL DEFAULT 0,
  last_attempt_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.admin_ip_bans
  IS 'IPs permanently locked out of the admin panel. Lift with: delete from public.admin_ip_bans where ip = ''<ip>'';';

-- RLS on with no policies, and no grants: only the service role reaches it.
ALTER TABLE public.admin_ip_bans ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_ip_bans FROM anon, authenticated;
