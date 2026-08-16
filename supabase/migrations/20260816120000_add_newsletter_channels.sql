-- Let a newsletter go out as a push notification, an email, or both.
--
--   INSERT INTO public.newsletters (type, subject, body) VALUES ('push', ...)
--
-- Push goes to newsletter subscribers who have a push token AND still have
-- push notifications enabled — `newsletter` is the marketing consent,
-- `notify_push` is the channel consent, and a push newsletter needs both.

-------------------------------------------------------------------
-- 1. Channel selection + push copy
-------------------------------------------------------------------
ALTER TABLE "public"."newsletters"
  ADD COLUMN IF NOT EXISTS "type"              "text" NOT NULL DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS "push_text"         "text",
  ADD COLUMN IF NOT EXISTS "push_sent_count"   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "push_failed_count" integer NOT NULL DEFAULT 0;

ALTER TABLE "public"."newsletters" DROP CONSTRAINT IF EXISTS "newsletters_type_check";
ALTER TABLE "public"."newsletters"
  ADD CONSTRAINT "newsletters_type_check" CHECK ("type" IN ('email', 'push', 'both'));

COMMENT ON COLUMN "public"."newsletters"."type"
  IS 'email (default), push, or both. Push needs profiles.notify_push = true and a push token.';
COMMENT ON COLUMN "public"."newsletters"."push_text"
  IS 'Notification body. Falls back to the HTML body stripped to plain text.';

-- Counters are per channel now; rename the originals so the pair reads evenly.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletters' AND column_name = 'sent_count'
  ) THEN
    ALTER TABLE public.newsletters RENAME COLUMN sent_count TO email_sent_count;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'newsletters' AND column_name = 'failed_count'
  ) THEN
    ALTER TABLE public.newsletters RENAME COLUMN failed_count TO email_failed_count;
  END IF;
END $$;

-------------------------------------------------------------------
-- 2. Recipients now carry the push channel too
--
--    Return type changes, so the function has to be dropped first.
-------------------------------------------------------------------
DROP FUNCTION IF EXISTS "public"."get_newsletter_recipients"("text"[]);

CREATE OR REPLACE FUNCTION "public"."get_newsletter_recipients"("p_emails" "text"[] DEFAULT NULL)
RETURNS TABLE("email" "text", "full_name" "text", "push_token" "text", "notify_push" boolean)
LANGUAGE "sql"
SECURITY DEFINER
SET "search_path" = "public"
AS $$
  WITH targets AS (
    -- Explicit list: exactly the given addresses, subscription state ignored.
    -- Addresses that belong to a user carry that user's name and push token.
    SELECT DISTINCT
      lower(trim(e.address))::text AS email,
      p.full_name,
      p.push_token,
      p.notify_push
    FROM unnest(COALESCE(p_emails, ARRAY[]::text[])) AS e(address)
    LEFT JOIN auth.users u ON lower(u.email) = lower(trim(e.address))
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE p_emails IS NOT NULL
      AND array_length(p_emails, 1) > 0
      AND trim(e.address) <> ''

    UNION

    -- Default: everybody subscribed to the newsletter.
    SELECT DISTINCT
      lower(u.email)::text AS email,
      p.full_name,
      p.push_token,
      p.notify_push
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE (p_emails IS NULL OR array_length(p_emails, 1) IS NULL)
      AND p.newsletter = true
      AND u.email IS NOT NULL
      AND u.email <> ''
  )
  SELECT t.email, t.full_name, t.push_token, t.notify_push
  FROM targets t
  WHERE NOT EXISTS (
    SELECT 1 FROM public.newsletter_unsubscribes n WHERE n.email = t.email
  );
$$;

ALTER FUNCTION "public"."get_newsletter_recipients"("text"[]) OWNER TO "postgres";

REVOKE EXECUTE ON FUNCTION "public"."get_newsletter_recipients"("text"[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION "public"."get_newsletter_recipients"("text"[]) FROM "anon", "authenticated";
