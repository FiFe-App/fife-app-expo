-- Fix: Add ON DELETE CASCADE to all FK constraints referencing auth.users and public.profiles
-- Without these, supabaseAdmin.auth.admin.deleteUser() fails with
-- "AuthApiError: Database error deleting user" because Postgres blocks the delete.

-- ── Constraints referencing auth.users ──────────────────────────────────────

-- private.email_log: SET NULL to preserve audit logs after user deletion
ALTER TABLE "private"."email_log"
  DROP CONSTRAINT IF EXISTS "email_log_user_id_fkey";
ALTER TABLE "private"."email_log"
  ADD CONSTRAINT "email_log_user_id_fkey"
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- public.buzinessRecommendations
ALTER TABLE "public"."buzinessRecommendations"
  DROP CONSTRAINT IF EXISTS "buzinessRecommendations_author_fkey1";
ALTER TABLE "public"."buzinessRecommendations"
  ADD CONSTRAINT "buzinessRecommendations_author_fkey1"
  FOREIGN KEY (author) REFERENCES auth.users(id) ON DELETE CASCADE;

-- public.comments: SET NULL so comments survive user deletion (author shown as 'Törölt felhasználó')
ALTER TABLE "public"."comments"
  DROP CONSTRAINT IF EXISTS "comments_author_fkey";
ALTER TABLE "public"."comments"
  ADD CONSTRAINT "comments_author_fkey"
  FOREIGN KEY (author) REFERENCES auth.users(id) ON DELETE SET NULL;

-- public.contacts
ALTER TABLE "public"."contacts"
  DROP CONSTRAINT IF EXISTS "contacts_author_fkey";
ALTER TABLE "public"."contacts"
  ADD CONSTRAINT "contacts_author_fkey"
  FOREIGN KEY (author) REFERENCES auth.users(id) ON DELETE CASCADE;

-- public.messages (author and recipient)
ALTER TABLE "public"."messages"
  DROP CONSTRAINT IF EXISTS "messages_author_fkey";
ALTER TABLE "public"."messages"
  ADD CONSTRAINT "messages_author_fkey"
  FOREIGN KEY (author) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."messages"
  DROP CONSTRAINT IF EXISTS "messages_to_fkey";
ALTER TABLE "public"."messages"
  ADD CONSTRAINT "messages_to_fkey"
  FOREIGN KEY ("to") REFERENCES auth.users(id) ON DELETE CASCADE;

-- public.profileRecommendations
ALTER TABLE "public"."profileRecommendations"
  DROP CONSTRAINT IF EXISTS "profileRecommendations_author_fkey1";
ALTER TABLE "public"."profileRecommendations"
  ADD CONSTRAINT "profileRecommendations_author_fkey1"
  FOREIGN KEY (author) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ── Constraints referencing public.profiles ──────────────────────────────────
-- profiles itself cascades from auth.users, so these must also cascade to allow
-- the profile row to be deleted as part of the auth.users cascade.

-- public.buzinessRecommendations
ALTER TABLE "public"."buzinessRecommendations"
  DROP CONSTRAINT IF EXISTS "buzinessRecommendations_author_fkey";
ALTER TABLE "public"."buzinessRecommendations"
  ADD CONSTRAINT "buzinessRecommendations_author_fkey"
  FOREIGN KEY (author) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- public.comments: SET NULL so comments survive profile deletion (author shown as 'Törölt felhasználó')
ALTER TABLE "public"."comments"
  DROP CONSTRAINT IF EXISTS "comments_author_fkey1";
ALTER TABLE "public"."comments"
  ADD CONSTRAINT "comments_author_fkey1"
  FOREIGN KEY (author) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- public.eventResponses
ALTER TABLE "public"."eventResponses"
  DROP CONSTRAINT IF EXISTS "eventResponses_user_fkey";
ALTER TABLE "public"."eventResponses"
  ADD CONSTRAINT "eventResponses_user_fkey"
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- public.events
ALTER TABLE "public"."events"
  DROP CONSTRAINT IF EXISTS "events_author_fkey";
ALTER TABLE "public"."events"
  ADD CONSTRAINT "events_author_fkey"
  FOREIGN KEY (author) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- public.posts
ALTER TABLE "public"."posts"
  DROP CONSTRAINT IF EXISTS "posts_author_fkey";
ALTER TABLE "public"."posts"
  ADD CONSTRAINT "posts_author_fkey"
  FOREIGN KEY (author) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- public.profileRecommendations (author and profile_id)
ALTER TABLE "public"."profileRecommendations"
  DROP CONSTRAINT IF EXISTS "profileRecommendations_author_fkey";
ALTER TABLE "public"."profileRecommendations"
  ADD CONSTRAINT "profileRecommendations_author_fkey"
  FOREIGN KEY (author) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."profileRecommendations"
  DROP CONSTRAINT IF EXISTS "profileRecommendations_profile_id_fkey";
ALTER TABLE "public"."profileRecommendations"
  ADD CONSTRAINT "profileRecommendations_profile_id_fkey"
  FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
