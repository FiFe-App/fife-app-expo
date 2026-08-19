-------------------------------------------------------------------
-- The notifications onboarding step (/csatlakozom/ertesitesek) is gone.
-- Each preference is now asked contextually as a card on /me, so we
-- need to remember which questions have already been put to the user.
-- NULL = never asked, timestamp = asked (whatever the answer was).
-------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS push_asked_at           timestamptz,
  ADD COLUMN IF NOT EXISTS emotion_prompt_asked_at timestamptz,
  ADD COLUMN IF NOT EXISTS newsletter_asked_at     timestamptz;

-- Existing users already answered these during onboarding, so don't
-- ambush them with cards for questions they've been asked before.
-- emotion_prompt_asked_at stays NULL: that question was never asked.
UPDATE public.profiles
  SET push_asked_at = now(), newsletter_asked_at = now()
  WHERE push_asked_at IS NULL AND newsletter_asked_at IS NULL;

GRANT SELECT (push_asked_at) ON public.profiles TO authenticated;
GRANT SELECT (push_asked_at) ON public.profiles TO anon;
GRANT SELECT (emotion_prompt_asked_at) ON public.profiles TO authenticated;
GRANT SELECT (emotion_prompt_asked_at) ON public.profiles TO anon;
GRANT SELECT (newsletter_asked_at) ON public.profiles TO authenticated;
GRANT SELECT (newsletter_asked_at) ON public.profiles TO anon;

-------------------------------------------------------------------
-- Transactional email is no longer opt-in at signup, and without a
-- default of true new accounts would receive nothing at all until
-- they discover the settings screen. Marketing (newsletter) stays
-- opt-in.
-------------------------------------------------------------------
ALTER TABLE public.profiles
  ALTER COLUMN notify_email SET DEFAULT true;

-- The daily mood reminder is now an explicit ask on /me. Defaulting it
-- to true would schedule a local notification the user never agreed to
-- (and, before this change, one that silently never fired because the
-- OS permission was only ever requested for notify_push).
ALTER TABLE public.profiles
  ALTER COLUMN emotion_daily_prompt SET DEFAULT false;

-------------------------------------------------------------------
-- handle_new_user no longer receives notification metadata from the
-- signup form, so the COALESCE fallbacks are what every new account
-- gets. The *_asked_at columns are left NULL so the cards appear.
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
  return new;
end;
$$;

-------------------------------------------------------------------
-- get_my_notification_prefs also returns the "already asked" state,
-- so the client can decide which prompt cards to render in one call.
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
  SELECT p.notify_push, p.notify_email, p.newsletter, p.emotion_daily_prompt,
         p.push_asked_at, p.emotion_prompt_asked_at, p.newsletter_asked_at
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.get_my_notification_prefs() TO authenticated;
