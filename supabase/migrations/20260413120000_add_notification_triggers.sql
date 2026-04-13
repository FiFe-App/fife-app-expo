-- Notification triggers for buzinessRecommendations and profileRecommendations
--
-- Prerequisites (run once as superuser, not part of migration):
--   Local dev:
--     ALTER DATABASE postgres SET "app.supabase_url" = 'http://supabase_kong_<project>:8000';
--     ALTER DATABASE postgres SET "app.service_role_key" = '<local-service-role-jwt>';
--   Production:
--     ALTER DATABASE postgres SET "app.supabase_url" = 'https://<project-ref>.supabase.co';
--     ALTER DATABASE postgres SET "app.service_role_key" = '<production-service-role-jwt>';

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
  supabase_url     := current_setting('app.supabase_url', true);
  service_role_key := current_setting('app.service_role_key', true);

  IF supabase_url IS NULL OR supabase_url = ''
     OR service_role_key IS NULL OR service_role_key = ''
  THEN
    RAISE WARNING 'notify trigger: app.supabase_url or app.service_role_key not configured';
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

ALTER FUNCTION public.trigger_notify_on_record_created() OWNER TO postgres;

-- Trigger on buzinessRecommendations
DROP TRIGGER IF EXISTS on_buziness_recommendation_created ON public."buzinessRecommendations";
CREATE TRIGGER on_buziness_recommendation_created
  AFTER INSERT ON public."buzinessRecommendations"
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notify_on_record_created();

-- Trigger on profileRecommendations
DROP TRIGGER IF EXISTS on_profile_recommendation_created ON public."profileRecommendations";
CREATE TRIGGER on_profile_recommendation_created
  AFTER INSERT ON public."profileRecommendations"
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notify_on_record_created();
