-- Fix and harden the auth of the notify webhook.
--
-- Symptom this addresses: every DB-triggered call to /functions/v1/notify came
-- back 401, with the request log showing
--   request.headers.user_agent          = pg_net/0.14.0
--   request.sb.jwt.authorization.payload.role = anon
-- i.e. trigger_notify_on_record_created() sent the project's *anon* key as the
-- bearer token instead of the service role key, because that is what
-- private.app_config.service_role_key contained. Notifications were dropped at
-- the gateway, before any of the function's own code ran.
--
-- This migration cannot fix the stored value (it is a secret and must not live
-- in git). Run this once against production and check `looks_correct`:
--
--   UPDATE private.app_config SET value = '<service role key>'
--    WHERE key = 'service_role_key';
--   SELECT * FROM private.notify_config_status();
--
-- What the migration does add is the means to see the problem: a status
-- function, a reader for pg_net's response log, and a warning raised at INSERT
-- time when the configured key is not a service role key.

-------------------------------------------------------------------
-- 1. Decode the role claim out of a legacy (JWT) Supabase API key
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.jwt_role(token text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  payload text;
BEGIN
  IF token IS NULL OR array_length(string_to_array(token, '.'), 1) <> 3 THEN
    RETURN NULL;  -- not a JWT: the newer sb_secret_… / sb_publishable_… keys are opaque
  END IF;

  payload := translate(split_part(token, '.', 2), '-_', '+/');       -- base64url -> base64
  payload := rpad(payload, ((length(payload) + 3) / 4) * 4, '=');    -- restore padding

  RETURN (convert_from(decode(payload, 'base64'), 'utf8')::jsonb) ->> 'role';
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.jwt_role(text) FROM PUBLIC, anon, authenticated;

-------------------------------------------------------------------
-- 2. Report on the notify configuration without exposing the key
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.notify_config_status()
RETURNS TABLE (
  supabase_url       text,
  key_configured     boolean,
  key_kind           text,
  key_role           text,
  key_fingerprint    text,
  webhook_secret_set boolean,
  looks_correct      boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private
AS $$
DECLARE
  v_url    text := private.get_app_config('supabase_url');
  v_key    text := private.get_app_config('service_role_key');
  v_secret text := private.get_app_config('notify_secret');
  v_role   text;
  v_kind   text;
BEGIN
  v_role := private.jwt_role(v_key);
  v_kind := CASE
              WHEN COALESCE(v_key, '') = ''            THEN 'missing'
              WHEN v_key LIKE 'sb_secret_%'            THEN 'secret-api-key'
              WHEN v_key LIKE 'sb_publishable_%'       THEN 'publishable-api-key'
              WHEN v_role IS NOT NULL                  THEN 'legacy-jwt'
              ELSE 'unknown'
            END;

  RETURN QUERY SELECT
    v_url,
    COALESCE(v_key, '') <> '',
    v_kind,
    v_role,
    CASE WHEN COALESCE(v_key, '') = '' THEN NULL ELSE left(md5(v_key), 8) END,
    COALESCE(v_secret, '') <> '',
    COALESCE(v_url, '') <> ''
      AND v_kind IN ('legacy-jwt', 'secret-api-key')
      AND (v_role IS NULL OR v_role = 'service_role');
END;
$$;

REVOKE EXECUTE ON FUNCTION private.notify_config_status() FROM PUBLIC, anon, authenticated;

-------------------------------------------------------------------
-- 3. Read back what the edge function actually answered
--    net.http_post() is fire-and-forget; the responses land here.
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.notify_recent_calls(max_rows int DEFAULT 20)
RETURNS TABLE (
  created     timestamptz,
  status_code int,
  error_msg   text,
  content     text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private
AS $$
BEGIN
  IF to_regclass('net._http_response') IS NULL THEN
    RAISE NOTICE 'pg_net response table not available — is the pg_net extension installed?';
    RETURN;
  END IF;

  RETURN QUERY
    SELECT r.created, r.status_code, r.error_msg, r.content
    FROM net._http_response r
    ORDER BY r.created DESC
    LIMIT max_rows;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.notify_recent_calls(int) FROM PUBLIC, anon, authenticated;

-------------------------------------------------------------------
-- 4. Trigger: warn on a misconfigured key, and support a dedicated
--    webhook secret so notify no longer has to be handed an API key
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_notify_on_record_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url     text;
  service_role_key text;
  notify_secret    text;
  key_role         text;
  headers          jsonb;
  payload          jsonb;
BEGIN
  supabase_url     := private.get_app_config('supabase_url');
  service_role_key := private.get_app_config('service_role_key');
  notify_secret    := private.get_app_config('notify_secret');

  IF supabase_url IS NULL OR supabase_url = ''
     OR service_role_key IS NULL OR service_role_key = ''
  THEN
    RAISE WARNING 'notify trigger: supabase_url or service_role_key not configured in private.app_config';
    RETURN NEW;
  END IF;

  -- The anon key is a valid JWT, so a call made with it is not rejected until it
  -- reaches the edge function. Say so here, where the cause is still visible.
  key_role := private.jwt_role(service_role_key);
  IF key_role IS NOT NULL AND key_role <> 'service_role' THEN
    RAISE WARNING 'notify trigger: private.app_config.service_role_key holds a key with role "%", not the service role key — notify will reject the call', key_role;
  END IF;

  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || service_role_key
  );

  -- Preferred credential when both sides are configured: it is independent of
  -- the project's API keys, so rotating them cannot break notifications.
  IF COALESCE(notify_secret, '') <> '' THEN
    headers := headers || jsonb_build_object('x-notify-secret', notify_secret);
  END IF;

  payload := jsonb_build_object(
    'table',  TG_TABLE_NAME,
    'record', row_to_json(NEW)
  );

  PERFORM net.http_post(
    url     := supabase_url || '/functions/v1/notify',
    headers := headers,
    body    := payload
  );

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.trigger_notify_on_record_created() OWNER TO postgres;
