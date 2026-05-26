-- Add notification preference columns and push token to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_push boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_email boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS push_token text;

-- Grant SELECT on the new columns (matching existing column-level grants)
GRANT SELECT (notify_push, notify_email) ON public.profiles TO authenticated;
GRANT SELECT (notify_push, notify_email) ON public.profiles TO anon;

-------------------------------------------------------------------
-- Update handle_new_user to also insert notification preferences
-------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS "public"."handle_new_user"();
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.profiles (
    id, full_name, avatar_url, username,
    location, location_radius_m,
    notify_push, notify_email
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
    COALESCE((new.raw_user_meta_data->>'notify_push')::boolean, true),
    COALESCE((new.raw_user_meta_data->>'notify_email')::boolean, false)
  );
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
-- Helper: read own notification prefs
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_notification_prefs()
RETURNS TABLE(notify_push boolean, notify_email boolean)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.notify_push, p.notify_email
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.get_my_notification_prefs() TO authenticated;

-------------------------------------------------------------------
-- Helper: read notification prefs + email for a user (service role only)
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_notification_prefs_for(user_id uuid)
RETURNS TABLE(notify_push boolean, notify_email boolean, email text, push_token text)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.notify_push, p.notify_email, a.email, p.push_token
  FROM public.profiles p
  JOIN auth.users a ON a.id = p.id
  WHERE p.id = user_id;
$$;
REVOKE EXECUTE ON FUNCTION public.get_notification_prefs_for(uuid) FROM anon, authenticated;

-------------------------------------------------------------------
-- Helper: update own push token (authenticated users only)
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_my_push_token(token text)
RETURNS void LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
  SET push_token = token
  WHERE id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.update_my_push_token(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.update_my_push_token(text) FROM anon;