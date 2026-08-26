-- Dismiss flag for the new "Szeretnél az appon belül chatelni?" home prompt,
-- mirroring home_add_buziness_card_dismissed exactly (see
-- 20260817120000_add_user_settings.sql) — written by useUserSettings.ts.
ALTER TABLE public.user_settings
  ADD COLUMN home_messaging_card_dismissed boolean NOT NULL DEFAULT false;
