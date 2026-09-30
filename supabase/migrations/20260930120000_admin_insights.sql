-- Admin insights: user list, report list and a weekly report email.
--
-- The admin app (admin/, Netlify Functions) calls these with the service role
-- key. They expose auth.users emails, so they are service role only — never
-- callable by anon/authenticated, same as get_newsletter_recipients().
--
-- Weekly report flow:
--   pg_cron (Mon 05:00 and 06:00 UTC)
--     └─ private.trigger_weekly_admin_report()
--          └─ pg_net POST → /functions/v1/weekly-report
--               └─ sends only when it is 08:00 in Europe/Budapest, so exactly
--                  one of the two runs goes out, summer or winter time.

-------------------------------------------------------------------
-- 1. admin_list_users — paginated, filterable user list
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."admin_list_users"(
  "p_search"   "text"    DEFAULT NULL,
  "p_bad_boy"  boolean   DEFAULT NULL,  -- NULL = everyone
  "p_reported" boolean   DEFAULT false, -- true = only users with at least one report
  "p_limit"    integer   DEFAULT 50,
  "p_offset"   integer   DEFAULT 0
)
RETURNS TABLE(
  "id"              "uuid",
  "full_name"       "text",
  "username"        "text",
  "email"           "text",
  "registered_at"   timestamp with time zone,
  "last_sign_in_at" timestamp with time zone,
  "email_confirmed" boolean,
  "bad_boy"         boolean,
  "report_count"    bigint,
  "buziness_count"  bigint,
  "total_count"     bigint
)
LANGUAGE "sql"
STABLE
SECURITY DEFINER
SET "search_path" = "public"
AS $$
  WITH base AS (
    SELECT
      u.id,
      p.full_name,
      p.username,
      u.email::text AS email,
      u.created_at AS registered_at,
      u.last_sign_in_at,
      u.email_confirmed_at IS NOT NULL AS email_confirmed,
      COALESCE(p.bad_boy, false) AS bad_boy,
      (SELECT count(*) FROM public.reports r WHERE r.reported_profile_id = u.id) AS report_count,
      (SELECT count(*) FROM public.buziness b WHERE b.author = u.id) AS buziness_count
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
  )
  SELECT b.*, count(*) OVER () AS total_count
  FROM base b
  WHERE (p_bad_boy IS NULL OR b.bad_boy = p_bad_boy)
    AND (NOT COALESCE(p_reported, false) OR b.report_count > 0)
    AND (
      COALESCE(trim(p_search), '') = ''
      OR b.full_name ILIKE '%' || trim(p_search) || '%'
      OR b.username  ILIKE '%' || trim(p_search) || '%'
      OR b.email     ILIKE '%' || trim(p_search) || '%'
    )
  ORDER BY b.registered_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 500)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

ALTER FUNCTION "public"."admin_list_users"("text", boolean, boolean, integer, integer) OWNER TO "postgres";
REVOKE EXECUTE ON FUNCTION "public"."admin_list_users"("text", boolean, boolean, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION "public"."admin_list_users"("text", boolean, boolean, integer, integer) FROM "anon", "authenticated";
GRANT  EXECUTE ON FUNCTION "public"."admin_list_users"("text", boolean, boolean, integer, integer) TO "service_role";

-------------------------------------------------------------------
-- 2. admin_list_reports — reports with both parties resolved
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."admin_list_reports"(
  "p_reported_id" "uuid"  DEFAULT NULL,
  "p_reason"      "text"  DEFAULT NULL,
  "p_limit"       integer DEFAULT 50,
  "p_offset"      integer DEFAULT 0
)
RETURNS TABLE(
  "id"               bigint,
  "created_at"       timestamp with time zone,
  "reason"           "text",
  "description"      "text",
  "author_id"        "uuid",
  "author_name"      "text",
  "author_email"     "text",
  "reported_id"      "uuid",
  "reported_name"    "text",
  "reported_email"   "text",
  "reported_bad_boy" boolean,
  "total_count"      bigint
)
LANGUAGE "sql"
STABLE
SECURITY DEFINER
SET "search_path" = "public"
AS $$
  SELECT
    r.id,
    r.created_at,
    r.reason,
    r.description,
    r.author,
    ap.full_name,
    au.email::text,
    r.reported_profile_id,
    rp.full_name,
    ru.email::text,
    COALESCE(rp.bad_boy, false),
    count(*) OVER ()
  FROM public.reports r
  LEFT JOIN auth.users      au ON au.id = r.author
  LEFT JOIN public.profiles ap ON ap.id = r.author
  LEFT JOIN auth.users      ru ON ru.id = r.reported_profile_id
  LEFT JOIN public.profiles rp ON rp.id = r.reported_profile_id
  WHERE (p_reported_id IS NULL OR r.reported_profile_id = p_reported_id)
    AND (COALESCE(p_reason, '') = '' OR r.reason = p_reason)
  ORDER BY r.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 500)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

ALTER FUNCTION "public"."admin_list_reports"("uuid", "text", integer, integer) OWNER TO "postgres";
REVOKE EXECUTE ON FUNCTION "public"."admin_list_reports"("uuid", "text", integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION "public"."admin_list_reports"("uuid", "text", integer, integer) FROM "anon", "authenticated";
GRANT  EXECUTE ON FUNCTION "public"."admin_list_reports"("uuid", "text", integer, integer) TO "service_role";

-------------------------------------------------------------------
-- 3. admin_weekly_stats — numbers for the weekly report
--
--    "New bad boys" are users registered in the period with bad_boy = true:
--    there is no timestamp for later flips of the flag.
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."admin_weekly_stats"(
  "p_from" timestamp with time zone,
  "p_to"   timestamp with time zone
)
RETURNS "jsonb"
LANGUAGE "sql"
STABLE
SECURITY DEFINER
SET "search_path" = "public"
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
    'total_users',    (SELECT count(*) FROM auth.users),
    'total_buziness', (SELECT count(*) FROM public.buziness),
    'total_bad_boys', (SELECT count(*) FROM public.profiles WHERE bad_boy),
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

ALTER FUNCTION "public"."admin_weekly_stats"(timestamp with time zone, timestamp with time zone) OWNER TO "postgres";
REVOKE EXECUTE ON FUNCTION "public"."admin_weekly_stats"(timestamp with time zone, timestamp with time zone) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION "public"."admin_weekly_stats"(timestamp with time zone, timestamp with time zone) FROM "anon", "authenticated";
GRANT  EXECUTE ON FUNCTION "public"."admin_weekly_stats"(timestamp with time zone, timestamp with time zone) TO "service_role";

-------------------------------------------------------------------
-- 4. Weekly report schedule
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.trigger_weekly_admin_report()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private
AS $$
DECLARE
  v_url text := private.get_app_config('supabase_url');
  v_key text := private.get_app_config('service_role_key');
BEGIN
  IF COALESCE(v_url, '') = '' OR COALESCE(v_key, '') = '' THEN
    RAISE WARNING 'weekly report: supabase_url or service_role_key not configured in private.app_config';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url     := v_url || '/functions/v1/weekly-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body    := '{}'::jsonb
  );
END;
$$;

ALTER FUNCTION private.trigger_weekly_admin_report() OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION private.trigger_weekly_admin_report() FROM PUBLIC, anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Both 05:00 and 06:00 UTC: one of them is 08:00 in Budapest (CEST / CET).
-- The edge function drops the other one. cron.schedule() with an existing
-- job name replaces that job, so re-running this is safe.
SELECT cron.schedule(
  'weekly-admin-report',
  '0 5,6 * * 1',
  $cron$SELECT private.trigger_weekly_admin_report()$cron$
);
