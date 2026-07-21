-- Add BUZINESS contact type so a help_contacts entry can eventually point
-- at a buziness page instead of a raw phone/web/place value. The row's
-- "data" column will hold the referenced buziness id as text.
--
-- Postgres requires a new enum value to be committed before it can be used
-- elsewhere, so this migration only adds the value (same pattern as
-- 20260217224700_add_message_contact_type.sql) — no BUZINESS rows are
-- seeded yet.

ALTER TYPE "public"."contact_type" ADD VALUE IF NOT EXISTS 'BUZINESS';
