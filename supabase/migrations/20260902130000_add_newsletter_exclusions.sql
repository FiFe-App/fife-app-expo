-- Per-issue exception list: addresses to skip for this send only.
--
-- Distinct from public.newsletter_unsubscribes, which is permanent and belongs
-- to the recipient. This one belongs to the issue and is the sender's call —
-- "everyone except these few" — so it is a column on the newsletter rather than
-- a row in the suppression table, and it does not survive to the next issue.
--
-- The exclusion lives in get_newsletter_recipients rather than in the edge
-- function so that the count shown in the admin before sending and the list the
-- send actually walks are produced by the same query. A count that does not
-- subtract the exceptions is worse than no count at all.

ALTER TABLE "public"."newsletters"
  ADD COLUMN IF NOT EXISTS "excluded" "text"[];

COMMENT ON COLUMN "public"."newsletters"."excluded" IS
  'Addresses to skip for this issue only, whatever the audience says. Applies to an explicit recipients list too: an address named in both is skipped. Not a substitute for newsletter_unsubscribes, which is permanent.';

-------------------------------------------------------------------
-- get_newsletter_recipients gains the exception list.
--
-- Dropped rather than replaced, for the same reason as the audience parameter:
-- a third defaulted parameter would leave the two-argument version behind as an
-- overload and make every two-argument call ambiguous.
--
-- Safe mid-deploy in the same way: migrations are pushed before functions are
-- deployed, and in that window the previous notify function calls this with
-- (p_emails, p_audience), which resolves here with p_exclude defaulted to NULL.
-------------------------------------------------------------------
DROP FUNCTION IF EXISTS "public"."get_newsletter_recipients"("text"[]);
DROP FUNCTION IF EXISTS "public"."get_newsletter_recipients"("text"[], "text");

-- OR REPLACE so the file stays re-runnable: the DROPs above only remove the
-- older signatures, so a second run would otherwise hit "function already
-- exists with same argument types".
CREATE OR REPLACE FUNCTION "public"."get_newsletter_recipients"(
  "p_emails"   "text"[] DEFAULT NULL,
  "p_audience" "text"   DEFAULT 'subscribers',
  "p_exclude"  "text"[] DEFAULT NULL
)
RETURNS TABLE("email" "text", "full_name" "text")
LANGUAGE "sql"
SECURITY DEFINER
SET "search_path" = "public"
AS $$
  WITH excluded AS (
    -- Normalised the same way as every address the resolver returns, so an
    -- exception typed as " Anna@Example.HU " still matches anna@example.hu.
    SELECT DISTINCT lower(trim(x.address))::text AS email
    FROM unnest(COALESCE(p_exclude, ARRAY[]::text[])) AS x(address)
    WHERE trim(x.address) <> ''
  ),
  targets AS (
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
  )
  -- Applied last, and to every mode: an exception overrides even an address
  -- named explicitly in p_emails. Excluding someone is always the safe answer.
  AND NOT EXISTS (
    SELECT 1 FROM excluded x WHERE x.email = t.email
  );
$$;

-- DROP took the old grants with it, so the full set is re-applied here.
-- Revoking from anon/authenticated alone is not enough: CREATE FUNCTION grants
-- EXECUTE to PUBLIC by default and both roles inherit it through PUBLIC. This
-- function returns every user's email address.
ALTER FUNCTION "public"."get_newsletter_recipients"("text"[], "text", "text"[]) OWNER TO "postgres";
REVOKE EXECUTE ON FUNCTION "public"."get_newsletter_recipients"("text"[], "text", "text"[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION "public"."get_newsletter_recipients"("text"[], "text", "text"[]) FROM "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_newsletter_recipients"("text"[], "text", "text"[]) TO "service_role";
