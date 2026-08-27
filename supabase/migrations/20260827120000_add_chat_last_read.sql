-- Chat "last read" markers were device-only (redux-persist/AsyncStorage), so
-- a reinstall or new device lost them entirely and every conversation came
-- back marked unread. Moves them into public.user_settings, following the
-- same pattern as 20260817120000_add_user_settings.sql.
--
-- Shape: { [otherUserId: string]: isoTimestamp }. Not encrypted like
-- mantra/tasks/previousSearches — these are just per-conversation read
-- timestamps, no personal content — written by useUserSettings.ts.
ALTER TABLE public.user_settings
  ADD COLUMN chat_last_read jsonb NOT NULL DEFAULT '{}'::jsonb;
