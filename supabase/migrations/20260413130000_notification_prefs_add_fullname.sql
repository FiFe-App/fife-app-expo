-- Add full_name to get_notification_prefs_for so email templates can personalise the greeting
-- Must DROP first because the return type changes (Postgres does not allow CREATE OR REPLACE for this)
DROP FUNCTION IF EXISTS public.get_notification_prefs_for(uuid);

CREATE FUNCTION public.get_notification_prefs_for(user_id uuid)
RETURNS TABLE(notify_push boolean, notify_email boolean, email text, push_token text, full_name text)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.notify_push, p.notify_email, a.email, p.push_token, p.full_name
  FROM public.profiles p
  JOIN auth.users a ON a.id = p.id
  WHERE p.id = user_id;
$$;
REVOKE EXECUTE ON FUNCTION public.get_notification_prefs_for(uuid) FROM anon, authenticated;
