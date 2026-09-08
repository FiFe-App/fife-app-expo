-- A newsletter's audience is now an explicit property of the issue rather than
-- an implicit consequence of `recipients` being NULL.
--
--   'subscribers' (default) — the newsletter opt-ins, i.e. what NULL recipients
--                             has always meant. Unchanged behaviour.
--   'all'                   — every registered user with a confirmed address.
--                             For announcements and win-back sends, where the
--                             point is to reach people who have not opted in.
--
-- The distinction was previously invisible: the admin's "Küldés mindenkinek"
-- button sent to opt-ins only, and the edge function logged both cases the same
-- way, so an issue that reached six of several hundred users looked like a
-- delivery failure rather than a correct count of a small audience.
--
-- The unsubscribe suppression list applies to BOTH audiences — 'all' means
-- "everyone who has not said no", never "everyone".

ALTER TABLE "public"."newsletters"
  ADD COLUMN IF NOT EXISTS "audience" "text" NOT NULL DEFAULT 'subscribers';

ALTER TABLE "public"."newsletters"
  DROP CONSTRAINT IF EXISTS "newsletters_audience_check";
ALTER TABLE "public"."newsletters"
  ADD CONSTRAINT "newsletters_audience_check"
  CHECK ("audience" IN ('subscribers', 'all'));

COMMENT ON COLUMN "public"."newsletters"."audience" IS
  'subscribers = newsletter opt-ins only (default). all = every registered user with a confirmed email. Ignored when recipients is set. The unsubscribe suppression list applies to both.';

COMMENT ON COLUMN "public"."newsletters"."recipients" IS
  'NULL/empty = resolve from the audience column. Otherwise exactly these email addresses, whatever the audience says.';

-------------------------------------------------------------------
-- get_newsletter_recipients gains the audience parameter.
--
-- The function has to be dropped rather than replaced: adding a defaulted
-- parameter with CREATE OR REPLACE leaves the old one-argument function in
-- place as a second overload, and every existing one-argument call would then
-- fail as ambiguous.
--
-- Dropping it mid-deploy is safe. The deploy pushes migrations before it
-- deploys functions, and in that window the old notify function calls this with
-- p_emails alone, which resolves here with p_audience defaulted to
-- 'subscribers' — exactly what it used to do.
--
-- Body carried over from 20260817120000_add_user_settings.sql; only the default
-- branch's WHERE test changes.
-------------------------------------------------------------------
DROP FUNCTION IF EXISTS "public"."get_newsletter_recipients"("text"[]);

-- OR REPLACE rather than a bare CREATE so the whole file stays re-runnable: the
-- DROP above only removes the one-argument version, so a second run would hit
-- "function already exists with same argument types".
CREATE OR REPLACE FUNCTION "public"."get_newsletter_recipients"(
  "p_emails"   "text"[] DEFAULT NULL,
  "p_audience" "text"   DEFAULT 'subscribers'
)
RETURNS TABLE("email" "text", "full_name" "text")
LANGUAGE "sql"
SECURITY DEFINER
SET "search_path" = "public"
AS $$
  WITH targets AS (
    -- Explicit list: exactly the given addresses, subscription state and
    -- audience both ignored.
    SELECT DISTINCT
      lower(trim(e.address))::text AS email,
      (
        SELECT p.full_name
        FROM public.profiles p
        JOIN auth.users u ON u.id = p.id
        WHERE lower(u.email) = lower(trim(e.address))
        LIMIT 1
      ) AS full_name
    FROM unnest(COALESCE(p_emails, ARRAY[]::text[])) AS e(address)
    WHERE p_emails IS NOT NULL
      AND array_length(p_emails, 1) > 0
      AND trim(e.address) <> ''

    UNION

    -- No explicit list: the audience decides.
    --
    -- 'all' additionally requires a confirmed address. Unconfirmed sign-ups are
    -- where the dead addresses are, and a first bulk send to a dormant list is
    -- the worst possible moment to hand a pile of bounces to the receiving
    -- side. Opt-ins are not filtered this way: they asked for the mail, and
    -- their behaviour is unchanged from before this migration.
    SELECT DISTINCT
      lower(u.email)::text AS email,
      p.full_name
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    LEFT JOIN public.user_settings s ON s.author = p.id
    WHERE (p_emails IS NULL OR array_length(p_emails, 1) IS NULL)
      AND u.email IS NOT NULL
      AND u.email <> ''
      AND CASE
            WHEN p_audience = 'all' THEN u.email_confirmed_at IS NOT NULL
            ELSE COALESCE(s.newsletter, p.newsletter) = true
          END
  )
  SELECT t.email, t.full_name
  FROM targets t
  WHERE NOT EXISTS (
    SELECT 1 FROM public.newsletter_unsubscribes n WHERE n.email = t.email
  );
$$;

-- DROP took the old grants with it, so the full set is re-applied here.
-- Revoking from anon/authenticated alone is not enough: CREATE FUNCTION grants
-- EXECUTE to PUBLIC by default and both roles inherit it through PUBLIC. This
-- function returns every user's email address.
ALTER FUNCTION "public"."get_newsletter_recipients"("text"[], "text") OWNER TO "postgres";
REVOKE EXECUTE ON FUNCTION "public"."get_newsletter_recipients"("text"[], "text") FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION "public"."get_newsletter_recipients"("text"[], "text") FROM "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_newsletter_recipients"("text"[], "text") TO "service_role";
