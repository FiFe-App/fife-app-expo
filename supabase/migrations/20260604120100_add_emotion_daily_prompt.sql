-- Add emotion_daily_prompt column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS emotion_daily_prompt boolean NOT NULL DEFAULT true;

GRANT SELECT (emotion_daily_prompt) ON public.profiles TO authenticated;
GRANT SELECT (emotion_daily_prompt) ON public.profiles TO anon;

-- Update get_my_notification_prefs to return emotion_daily_prompt
DROP FUNCTION IF EXISTS public.get_my_notification_prefs();

CREATE FUNCTION public.get_my_notification_prefs()
RETURNS TABLE(notify_push boolean, notify_email boolean, newsletter boolean, emotion_daily_prompt boolean)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.notify_push, p.notify_email, p.newsletter, p.emotion_daily_prompt
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.get_my_notification_prefs() TO authenticated;

-- Update handle_new_user to include emotion_daily_prompt
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
    COALESCE((new.raw_user_meta_data->>'notify_email')::boolean, false),
    COALESCE((new.raw_user_meta_data->>'newsletter')::boolean, false),
    COALESCE((new.raw_user_meta_data->>'emotion_daily_prompt')::boolean, true)
  );
  return new;
end;
$$;
