-- "Csak nekik": address one issue by pasting a comma-separated list.
--
-- newsletters.recipients (text[]) already meant "send to exactly these
-- addresses, subscription state ignored", but writing it means typing a
-- Postgres array literal ('{a@b.hu,c@d.hu}') into the Studio table editor.
-- recipients_csv takes the list in the shape it is copied out of a mail client:
--
--   recipients_csv = 'a@b.hu, c@d.hu'  → only those two
--   recipients_csv NULL or blank       → recipients decides, exactly as before
--                                        (NULL there = every subscriber)
--
-- A BEFORE INSERT trigger parses it into recipients, so the audience an issue
-- actually went to is still recorded in the one column, and the notify webhook
-- — an AFTER INSERT trigger that posts row_to_json(NEW) — sees the parsed array
-- without any change to the edge function.
--
-- Unsubscribed addresses stay filtered out of both modes by
-- get_newsletter_recipients: "csak nekik" narrows the audience, it does not
-- override anyone's opt-out.

ALTER TABLE "public"."newsletters"
  ADD COLUMN IF NOT EXISTS "recipients_csv" "text";

COMMENT ON COLUMN "public"."newsletters"."recipients_csv"
  IS 'Csak nekik: comma-separated address list, parsed into recipients on insert. NULL/blank leaves recipients as given.';

-------------------------------------------------------------------
-- parse_recipient_list — 'a@b.hu, C@D.hu ' → {a@b.hu,c@d.hu}
--
-- Splits on commas, semicolons and whitespace, so a list pasted out of a mail
-- client or spread over several lines parses too. Addresses come back
-- lowercased and de-duplicated, which is how get_newsletter_recipients and
-- newsletter_unsubscribes compare them.
--
-- A token that is not an address raises rather than being dropped: silently
-- ignoring a typo turns into an issue that quietly misses part of its audience.
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."parse_recipient_list"("p_list" "text")
RETURNS "text"[]
LANGUAGE "plpgsql"
IMMUTABLE
SET "search_path" = ''
AS $$
DECLARE
  parsed  text[];
  invalid text;
BEGIN
  IF p_list IS NULL OR btrim(p_list) = '' THEN
    RETURN NULL;
  END IF;

  SELECT array_agg(DISTINCT lower(t.token) ORDER BY lower(t.token))
  INTO parsed
  FROM regexp_split_to_table(btrim(p_list), '[,;[:space:]]+') AS t(token)
  WHERE t.token <> '';

  SELECT a INTO invalid
  FROM unnest(COALESCE(parsed, ARRAY[]::text[])) AS a
  WHERE a !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  LIMIT 1;

  IF invalid IS NOT NULL THEN
    RAISE EXCEPTION 'recipients_csv: % is not an email address', invalid;
  END IF;

  RETURN parsed;
END;
$$;

ALTER FUNCTION "public"."parse_recipient_list"("text") OWNER TO "postgres";

-- Nothing here touches data, but newsletters are service-role territory and
-- the grant is kept explicit rather than left at the default PUBLIC.
REVOKE EXECUTE ON FUNCTION "public"."parse_recipient_list"("text") FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION "public"."parse_recipient_list"("text") FROM "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."parse_recipient_list"("text") TO "service_role";

-------------------------------------------------------------------
-- Fill recipients from recipients_csv on insert.
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."newsletters_apply_recipients_csv"()
RETURNS TRIGGER
LANGUAGE "plpgsql"
SET "search_path" = ''
AS $$
DECLARE
  parsed text[];
BEGIN
  IF NEW.recipients_csv IS NULL OR btrim(NEW.recipients_csv) = '' THEN
    RETURN NEW;
  END IF;

  -- Two answers to the same question. Picking one silently would mail the
  -- wrong people, and which one won would only be visible after the fact.
  IF NEW.recipients IS NOT NULL AND array_length(NEW.recipients, 1) > 0 THEN
    RAISE EXCEPTION 'set recipients or recipients_csv, not both';
  END IF;

  parsed := public.parse_recipient_list(NEW.recipients_csv);

  -- Never fall through to "everybody". An empty result means the list was meant
  -- to be narrow and came out unusable, and leaving recipients NULL at that
  -- point sends the issue to the whole subscriber base.
  IF parsed IS NULL OR array_length(parsed, 1) IS NULL THEN
    RAISE EXCEPTION 'recipients_csv held no address: %', NEW.recipients_csv;
  END IF;

  NEW.recipients := parsed;
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."newsletters_apply_recipients_csv"() OWNER TO "postgres";

-- BEFORE, so on_newsletter_created (AFTER INSERT) posts the parsed recipients
-- to the notify function. INSERT only: an issue is sent by inserting it, and
-- the edge function writes status/sent_count back to the same row afterwards —
-- re-running this on those updates would only re-derive what is already there.
DROP TRIGGER IF EXISTS "on_newsletter_recipients_csv" ON "public"."newsletters";
CREATE TRIGGER "on_newsletter_recipients_csv"
  BEFORE INSERT ON "public"."newsletters"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."newsletters_apply_recipients_csv"();
