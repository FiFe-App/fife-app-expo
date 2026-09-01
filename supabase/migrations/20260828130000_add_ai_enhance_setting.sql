-- Creating a biznisz and running a search both send user-written text to
-- OpenAI: create-buziness sends the listing's title and description, and
-- business-search sends the search query itself (see the "AI-s
-- megtalálhatóság" switch in the app). Both exist to make people findable,
-- but neither was ever something the user could decline.
--
-- One flag decides it, for both directions at once, and the edge functions
-- read it server-side rather than trusting the client:
--
--   ai_enhance = false → nothing of that user's text leaves for OpenAI. Their
--                        listings rank by full-text search alone, and their
--                        own searches are keyword-only.
--
-- Default false, so a new account opts in rather than out — the prompt card on
-- /me does the asking. Everyone who already exists is grandfathered to true by
-- the backfill below: their listings were embedded long ago, and silently
-- dropping them out of semantic search would cost them reach they never agreed
-- to lose. ai_asked_at stays NULL for them too, so they are still asked once
-- and can say no.
ALTER TABLE public.user_settings
  ADD COLUMN ai_enhance  boolean NOT NULL DEFAULT false,
  -- NULL = never asked, matching push_asked_at and its siblings.
  ADD COLUMN ai_asked_at timestamptz;

UPDATE public.user_settings SET ai_enhance = true;

-- handle_new_user needs no change: it inserts user_settings with an explicit
-- column list, so a new signup takes the false default above.

-------------------------------------------------------------------
-- get_my_notification_prefs: hand the two new columns to the client.
--
-- Recreated wholesale (the return type changes) with the same shape as
-- 20260817120000_add_user_settings.sql. The notification columns keep their
-- COALESCE fallback onto public.profiles, where they used to live; these two
-- never lived there, so they come straight from user_settings — with a
-- COALESCE to the same defaults as the columns themselves, for a user whose
-- settings row is somehow missing.
-------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_my_notification_prefs();

CREATE FUNCTION public.get_my_notification_prefs()
RETURNS TABLE(
  notify_push boolean,
  notify_email boolean,
  newsletter boolean,
  emotion_daily_prompt boolean,
  ai_enhance boolean,
  push_asked_at timestamptz,
  emotion_prompt_asked_at timestamptz,
  newsletter_asked_at timestamptz,
  ai_asked_at timestamptz
)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(s.notify_push,             p.notify_push),
    COALESCE(s.notify_email,            p.notify_email),
    COALESCE(s.newsletter,              p.newsletter),
    COALESCE(s.emotion_daily_prompt,    p.emotion_daily_prompt),
    COALESCE(s.ai_enhance,              false),
    COALESCE(s.push_asked_at,           p.push_asked_at),
    COALESCE(s.emotion_prompt_asked_at, p.emotion_prompt_asked_at),
    COALESCE(s.newsletter_asked_at,     p.newsletter_asked_at),
    s.ai_asked_at
  FROM public.profiles p
  LEFT JOIN public.user_settings s ON s.author = p.id
  WHERE p.id = auth.uid();
$$;

-- Scoped to auth.uid() so it is harmless to anon, but keep the grant explicit
-- rather than relying on the implicit PUBLIC one.
REVOKE EXECUTE ON FUNCTION public.get_my_notification_prefs() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_notification_prefs() TO authenticated;
