-- Replace current_setting('app.*') with a private.app_config table
-- because Supabase hosted Postgres does not support custom app.* settings.

-- 1. Create the config table in the private schema (already exists)
CREATE TABLE IF NOT EXISTS private.app_config (
  key   text PRIMARY KEY,
  value text NOT NULL
);

-- RLS: table lives in private schema, inaccessible to anon/authenticated by default.
-- Only postgres / service_role can read it.
ALTER TABLE private.app_config ENABLE ROW LEVEL SECURITY;

-- 2. Helper function usable from SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION private.get_app_config(config_key text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = private
AS $$
  SELECT value FROM private.app_config WHERE key = config_key;
$$;

-- Only postgres owner can call it (used inside other SECURITY DEFINER functions)
REVOKE EXECUTE ON FUNCTION private.get_app_config(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.get_app_config(text) FROM anon;
REVOKE EXECUTE ON FUNCTION private.get_app_config(text) FROM authenticated;

-- 3. Rewrite trigger to read from private.app_config instead of current_setting
CREATE OR REPLACE FUNCTION public.trigger_notify_on_record_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url     text;
  service_role_key text;
  payload          jsonb;
BEGIN
  supabase_url     := private.get_app_config('supabase_url');
  service_role_key := private.get_app_config('service_role_key');

  IF supabase_url IS NULL OR supabase_url = ''
     OR service_role_key IS NULL OR service_role_key = ''
  THEN
    RAISE WARNING 'notify trigger: supabase_url or service_role_key not configured in private.app_config';
    RETURN NEW;
  END IF;

  payload := jsonb_build_object(
    'table',  TG_TABLE_NAME,
    'record', row_to_json(NEW)
  );

  PERFORM net.http_post(
    url     := supabase_url || '/functions/v1/notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body    := payload
  );

  RETURN NEW;
END;
$$;
