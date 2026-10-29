-- Alert the operator when someone is reported and when someone signs up.
-- Reuses trigger_notify_on_record_created(); the notify edge function routes
-- these two tables to ADMIN_NOTIFY_EMAIL / ADMIN_USER_ID instead of to a user.
--
-- profiles rows are created by handle_new_user() on auth.users INSERT, so the
-- trigger fires at sign-up, before the email is confirmed.

DROP TRIGGER IF EXISTS on_report_created ON public.reports;
CREATE TRIGGER on_report_created
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notify_on_record_created();

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notify_on_record_created();
