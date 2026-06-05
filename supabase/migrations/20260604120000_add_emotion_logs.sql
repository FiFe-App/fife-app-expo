-- 1. Add emotion_check_enabled column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS emotion_check_enabled boolean NOT NULL DEFAULT true;

GRANT SELECT (emotion_check_enabled) ON public.profiles TO authenticated;
GRANT SELECT (emotion_check_enabled) ON public.profiles TO anon;

-- 2. Update get_my_notification_prefs to return emotion_check_enabled
DROP FUNCTION IF EXISTS public.get_my_notification_prefs();

CREATE FUNCTION public.get_my_notification_prefs()
RETURNS TABLE(notify_push boolean, notify_email boolean, newsletter boolean, emotion_check_enabled boolean)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.notify_push, p.notify_email, p.newsletter, p.emotion_check_enabled
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.get_my_notification_prefs() TO authenticated;

-- 3. Update handle_new_user to include emotion_check_enabled
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.profiles (
    id, full_name, avatar_url, username,
    location, location_radius_m,
    notify_push, notify_email, newsletter, emotion_check_enabled
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
    COALESCE((new.raw_user_meta_data->>'emotion_check_enabled')::boolean, true)
  );
  return new;
end;
$$;

-- 4. Create emotion_logs table
CREATE TABLE IF NOT EXISTS public.emotion_logs (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rate       smallint NOT NULL CHECK (rate BETWEEN 1 AND 5),
  log_date   date NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (author, log_date)
);

ALTER TABLE public.emotion_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own logs select" ON public.emotion_logs
  FOR SELECT USING (auth.uid() = author);

CREATE POLICY "own logs insert" ON public.emotion_logs
  FOR INSERT WITH CHECK (auth.uid() = author);

CREATE POLICY "own logs update" ON public.emotion_logs
  FOR UPDATE USING (auth.uid() = author);

GRANT SELECT, INSERT, UPDATE ON public.emotion_logs TO authenticated;
