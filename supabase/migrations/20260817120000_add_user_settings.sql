-- One row per user holding every preference that used to live only in the
-- device's redux-persist blob (mantra, Lusta Lista, previous searches, theme,
-- saved biznisz, dismiss flags) plus the notification state that was a set of
-- loose columns on public.profiles.
--
-- Privacy: the free-text personal fields (mantra, tasks, previousSearches) are
-- encrypted client-side into encrypted_data/nonce with the account key in
-- public.emotion_keys, so the server never sees them. This keeps the promise the
-- app makes on the /me screen ("az itt megadott adataidat titkosítva tároljuk").
-- The remaining columns are UI flags with no personal content, and the
-- notification columns must stay readable because the `notify` edge function and
-- the newsletter recipient query read them server-side.
--
-- Two client owners write this row, over disjoint column sets:
--   useUserSettings      — the encrypted blob, theme, dismiss flags, saved biznisz
--   useNotificationPrefs — the notify_*/newsletter/emotion_daily_prompt flags
--                          and their *_asked_at stamps

CREATE TABLE IF NOT EXISTS public.user_settings (
  author                           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Opaque to the server. Plaintext shape:
  --   { mantra: string, tasks: TaskItem[], previousSearches: string[] }
  encrypted_data                   text,
  nonce                            text,

  theme_preference                 text    NOT NULL DEFAULT 'auto'
                                     CHECK (theme_preference IN ('light', 'dark', 'auto')),
  is_it_safe_dismissed             boolean NOT NULL DEFAULT false,
  invite_card_dismissed            boolean NOT NULL DEFAULT false,
  home_add_buziness_card_dismissed boolean NOT NULL DEFAULT false,
  saved_buzinesses                 jsonb   NOT NULL DEFAULT '[]'::jsonb,

  -- Defaults mirror the public.profiles columns these replace, as of
  -- 20260816120001_notification_prompt_state.sql: transactional email is on by
  -- default, marketing and the daily mood reminder are opt-in.
  notify_push                      boolean NOT NULL DEFAULT false,
  notify_email                     boolean NOT NULL DEFAULT true,
  newsletter                       boolean NOT NULL DEFAULT false,
  emotion_daily_prompt             boolean NOT NULL DEFAULT false,

  -- NULL = the user has never been asked this question, so /me still shows the
  -- prompt card for it. A timestamp means asked, whatever the answer was.
  push_asked_at                    timestamptz,
  emotion_prompt_asked_at          timestamptz,
  newsletter_asked_at              timestamptz,

  created_at                       timestamptz NOT NULL DEFAULT now(),
  updated_at                       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own settings select" ON public.user_settings
  FOR SELECT USING (auth.uid() = author);

CREATE POLICY "own settings insert" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = author);

CREATE POLICY "own settings update" ON public.user_settings
  FOR UPDATE USING (auth.uid() = author);

-- No DELETE policy: rows go away with the account via ON DELETE CASCADE.
-- Table-level grants are safe here because this table is never publicly
-- readable, so new columns do not need their own GRANT SELECT (col) the way
-- public.profiles columns do.
GRANT SELECT, INSERT, UPDATE ON public.user_settings TO authenticated;

-------------------------------------------------------------------
-- updated_at is maintained server-side because the client sync uses it to
-- resolve last-write-wins between devices.
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_settings_set_updated_at ON public.user_settings;
CREATE TRIGGER user_settings_set_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-------------------------------------------------------------------
-- Backfill: every existing profile gets a settings row carrying its current
-- notification state, including which prompts it has already been shown — the
-- *_asked_at values were themselves backfilled by
-- 20260816120001_notification_prompt_state.sql, which runs before this. Losing
-- them here would re-ask every existing user every question.
--
-- The encrypted fields stay NULL until the user's client uploads them.
-------------------------------------------------------------------
INSERT INTO public.user_settings (
  author, notify_push, notify_email, newsletter, emotion_daily_prompt,
  push_asked_at, emotion_prompt_asked_at, newsletter_asked_at
)
SELECT p.id, p.notify_push, p.notify_email, p.newsletter, p.emotion_daily_prompt,
       p.push_asked_at, p.emotion_prompt_asked_at, p.newsletter_asked_at
FROM public.profiles p
ON CONFLICT (author) DO NOTHING;

-------------------------------------------------------------------
-- handle_new_user: also create the settings row on signup.
-- The profiles insert is carried over verbatim from
-- 20260816120001_notification_prompt_state.sql so signup behaviour is
-- unchanged. The *_asked_at columns are left NULL so the prompt cards appear.
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.profiles (
    id, full_name, avatar_url, username,
    location, location_radius_m,
    notify_push, notify_email, newsletter, emotion_daily_prompt
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
    COALESCE((new.raw_user_meta_data->>'emotion_daily_prompt')::boolean, false)
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

  return new;
end;
$$;

ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-------------------------------------------------------------------
-- Repoint the notification readers at public.user_settings.
--
-- All three keep their exact name, arguments and return columns, so
-- supabase/functions/notify and the app's existing callers need no change.
-- profiles stays the driving table and user_settings is LEFT JOINed with a
-- COALESCE fallback, so a user without a settings row still resolves to their
-- old flags instead of vanishing from notifications or the newsletter.
-------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_my_notification_prefs();

CREATE FUNCTION public.get_my_notification_prefs()
RETURNS TABLE(
  notify_push boolean,
  notify_email boolean,
  newsletter boolean,
  emotion_daily_prompt boolean,
  push_asked_at timestamptz,
  emotion_prompt_asked_at timestamptz,
  newsletter_asked_at timestamptz
)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(s.notify_push,             p.notify_push),
    COALESCE(s.notify_email,            p.notify_email),
    COALESCE(s.newsletter,              p.newsletter),
    COALESCE(s.emotion_daily_prompt,    p.emotion_daily_prompt),
    COALESCE(s.push_asked_at,           p.push_asked_at),
    COALESCE(s.emotion_prompt_asked_at, p.emotion_prompt_asked_at),
    COALESCE(s.newsletter_asked_at,     p.newsletter_asked_at)
  FROM public.profiles p
  LEFT JOIN public.user_settings s ON s.author = p.id
  WHERE p.id = auth.uid();
$$;
-- Scoped to auth.uid() so it is harmless to anon, but keep the grant explicit
-- rather than relying on the implicit PUBLIC one.
REVOKE EXECUTE ON FUNCTION public.get_my_notification_prefs() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_notification_prefs() TO authenticated;

DROP FUNCTION IF EXISTS public.get_notification_prefs_for(uuid);

CREATE FUNCTION public.get_notification_prefs_for(user_id uuid)
RETURNS TABLE(notify_push boolean, notify_email boolean, email text, push_token text, full_name text, newsletter boolean)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(s.notify_push,  p.notify_push),
    COALESCE(s.notify_email, p.notify_email),
    a.email,
    p.push_token,
    p.full_name,
    COALESCE(s.newsletter,   p.newsletter)
  FROM public.profiles p
  JOIN auth.users a ON a.id = p.id
  LEFT JOIN public.user_settings s ON s.author = p.id
  WHERE p.id = user_id;
$$;

-- This function returns any user's email and push token, so it must stay
-- service-role only. Revoking from anon/authenticated alone is NOT enough:
-- CREATE FUNCTION grants EXECUTE to PUBLIC by default, and both roles inherit
-- it through PUBLIC. Previous definitions of this function omitted the PUBLIC
-- revoke, which left it callable by any signed-in user.
REVOKE EXECUTE ON FUNCTION public.get_notification_prefs_for(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_notification_prefs_for(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_notification_prefs_for(uuid) TO service_role;

-------------------------------------------------------------------
-- The newsletter audience is resolved from the same flag, so it has to read
-- the new home too — otherwise unsubscribing would appear to work in the app
-- while the next issue still went out to the stale profiles.newsletter value.
-- Body carried over from 20260811120000_add_newsletters.sql; only the default
-- branch's subscription test changes.
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."get_newsletter_recipients"("p_emails" "text"[] DEFAULT NULL)
RETURNS TABLE("email" "text", "full_name" "text")
LANGUAGE "sql"
SECURITY DEFINER
SET "search_path" = "public"
AS $$
  WITH targets AS (
    -- Explicit list: exactly the given addresses, subscription state ignored.
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

    -- Default: everybody subscribed to the newsletter.
    SELECT DISTINCT
      lower(u.email)::text AS email,
      p.full_name
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    LEFT JOIN public.user_settings s ON s.author = p.id
    WHERE (p_emails IS NULL OR array_length(p_emails, 1) IS NULL)
      AND COALESCE(s.newsletter, p.newsletter) = true
      AND u.email IS NOT NULL
      AND u.email <> ''
  )
  SELECT t.email, t.full_name
  FROM targets t
  WHERE NOT EXISTS (
    SELECT 1 FROM public.newsletter_unsubscribes n WHERE n.email = t.email
  );
$$;

ALTER FUNCTION "public"."get_newsletter_recipients"("text"[]) OWNER TO "postgres";
REVOKE EXECUTE ON FUNCTION "public"."get_newsletter_recipients"("text"[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION "public"."get_newsletter_recipients"("text"[]) FROM "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_newsletter_recipients"("text"[]) TO "service_role";

-------------------------------------------------------------------
-- The newsletter suppression list is keyed off writes to the `newsletter`
-- flag, so both directions of that flow have to follow it to its new home.
--
-- 1. Resubscribing clears the tombstone. The existing trigger fires on
--    profiles, which the app no longer writes — without a matching trigger on
--    user_settings, a user who unsubscribed by email and then flipped the
--    switch back on in the app would stay suppressed forever, with the app
--    showing the newsletter as on. The profiles trigger is left in place so
--    app versions still writing the old column keep working.
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."clear_newsletter_unsubscribe_from_settings"()
RETURNS TRIGGER
LANGUAGE "plpgsql"
SECURITY DEFINER
SET "search_path" = "public"
AS $$
BEGIN
  DELETE FROM public.newsletter_unsubscribes n
  USING auth.users u
  WHERE u.id = NEW.author
    AND n.email = lower(u.email);
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."clear_newsletter_unsubscribe_from_settings"() OWNER TO "postgres";

DROP TRIGGER IF EXISTS "on_newsletter_resubscribe" ON "public"."user_settings";
CREATE TRIGGER "on_newsletter_resubscribe"
  AFTER UPDATE OF "newsletter" ON "public"."user_settings"
  FOR EACH ROW
  WHEN (NEW.newsletter = true AND OLD.newsletter IS DISTINCT FROM NEW.newsletter)
  EXECUTE FUNCTION "public"."clear_newsletter_unsubscribe_from_settings"();

-------------------------------------------------------------------
-- 2. Unsubscribing by email must clear the flag where the app now reads it.
--    Delivery already stops via the suppression list, but leaving
--    user_settings.newsletter = true would show the switch still on in the
--    app, and would silently resume sending if the tombstone were ever
--    cleared. Body carried over from 20260811120000_add_newsletters.sql with
--    the extra UPDATE; profiles is still written for old app versions.
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."newsletter_unsubscribe"("p_email" "text")
RETURNS boolean
LANGUAGE "plpgsql"
SECURITY DEFINER
SET "search_path" = "public"
AS $$
DECLARE
  normalized text := lower(trim(p_email));
BEGIN
  IF normalized IS NULL OR normalized = '' THEN
    RETURN false;
  END IF;

  INSERT INTO public.newsletter_unsubscribes (email)
  VALUES (normalized)
  ON CONFLICT (email) DO NOTHING;

  UPDATE public.user_settings s
  SET newsletter = false
  FROM auth.users u
  WHERE u.id = s.author
    AND lower(u.email) = normalized
    AND s.newsletter = true;

  UPDATE public.profiles p
  SET newsletter = false
  FROM auth.users u
  WHERE u.id = p.id
    AND lower(u.email) = normalized
    AND p.newsletter = true;

  RETURN true;
END;
$$;

ALTER FUNCTION "public"."newsletter_unsubscribe"("text") OWNER TO "postgres";
REVOKE EXECUTE ON FUNCTION "public"."newsletter_unsubscribe"("text") FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION "public"."newsletter_unsubscribe"("text") FROM "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."newsletter_unsubscribe"("text") TO "service_role";

-------------------------------------------------------------------
-- The notification columns on profiles are now deprecated but deliberately
-- kept. Migrations deploy on merge while the app ships separately via EAS/OTA,
-- so app versions already in the wild would hard-error if they vanished. A
-- follow-up migration drops them once clients have rolled over (and the
-- COALESCE fallbacks above can be simplified at the same time).
--
-- profiles.push_token is NOT a preference and stays where it is:
-- update_my_push_token() keeps writing it.
-------------------------------------------------------------------
COMMENT ON COLUMN public.profiles.notify_push             IS 'deprecated: moved to public.user_settings.notify_push';
COMMENT ON COLUMN public.profiles.notify_email            IS 'deprecated: moved to public.user_settings.notify_email';
COMMENT ON COLUMN public.profiles.newsletter              IS 'deprecated: moved to public.user_settings.newsletter';
COMMENT ON COLUMN public.profiles.emotion_daily_prompt    IS 'deprecated: moved to public.user_settings.emotion_daily_prompt';
COMMENT ON COLUMN public.profiles.push_asked_at           IS 'deprecated: moved to public.user_settings.push_asked_at';
COMMENT ON COLUMN public.profiles.emotion_prompt_asked_at IS 'deprecated: moved to public.user_settings.emotion_prompt_asked_at';
COMMENT ON COLUMN public.profiles.newsletter_asked_at     IS 'deprecated: moved to public.user_settings.newsletter_asked_at';
