-- 1. Add newsletter column to profiles (default false)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS newsletter boolean NOT NULL DEFAULT false;

-- 2. Change notify_push default from true to false
ALTER TABLE public.profiles
  ALTER COLUMN notify_push SET DEFAULT false;

-- 3. Grant SELECT on newsletter column
GRANT SELECT (newsletter) ON public.profiles TO authenticated;
GRANT SELECT (newsletter) ON public.profiles TO anon;

-------------------------------------------------------------------
-- 4. Update handle_new_user to include newsletter and default
--    notify_push to false
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.profiles (
    id, full_name, avatar_url, username,
    location, location_radius_m,
    notify_push, notify_email, newsletter
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
    COALESCE((new.raw_user_meta_data->>'newsletter')::boolean, false)
  );
  return new;
end;
$$;

-------------------------------------------------------------------
-- 5. Update get_my_notification_prefs to return newsletter
-------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_my_notification_prefs();

CREATE FUNCTION public.get_my_notification_prefs()
RETURNS TABLE(notify_push boolean, notify_email boolean, newsletter boolean)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.notify_push, p.notify_email, p.newsletter
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.get_my_notification_prefs() TO authenticated;

-------------------------------------------------------------------
-- 6. Update get_notification_prefs_for to return newsletter
-------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_notification_prefs_for(uuid);

CREATE FUNCTION public.get_notification_prefs_for(user_id uuid)
RETURNS TABLE(notify_push boolean, notify_email boolean, email text, push_token text, full_name text, newsletter boolean)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.notify_push, p.notify_email, a.email, p.push_token, p.full_name, p.newsletter
  FROM public.profiles p
  JOIN auth.users a ON a.id = p.id
  WHERE p.id = user_id;
$$;
REVOKE EXECUTE ON FUNCTION public.get_notification_prefs_for(uuid) FROM anon, authenticated;
