-- Invitations: who brought whom into the app.
--
-- The invite card's link now carries the inviter's uid
-- (https://fifeapp.hu/meghivo/<uid>). That uid is kept for the whole
-- "csatlakozom" flow, so by the time the account exists both sides are known:
-- the `author` who sent the invite and the `guest` who joined because of it.
--
-- A guest joins once, so `guest` is the real key here. That is also what makes
-- the client-side insert at the end of registration
-- (lib/invitations/recordInvitation.ts) safe next to the trigger below, which
-- has usually written the row already during sign-up: the second write hits
-- ON CONFLICT DO NOTHING instead of creating a duplicate.
--
-- Both foreign keys cascade, the same way every other profile-owned table was
-- fixed up in 20260526120000_fix_cascade_delete_for_user_deletion.sql —
-- without that, deleting an account would fail on this table.

CREATE TABLE IF NOT EXISTS "public"."invitations" (
  "id"         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "author"     uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
  "guest"      uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  CONSTRAINT "invitations_guest_key" UNIQUE ("guest"),
  -- Nobody invites themselves — a link opened by its own author is not an
  -- invitation, and letting one in would inflate the inviter's count.
  CONSTRAINT "invitations_author_not_guest" CHECK ("author" <> "guest")
);

ALTER TABLE "public"."invitations" OWNER TO "postgres";

-- "Who did I bring in?" is the query this table exists for.
CREATE INDEX IF NOT EXISTS "invitations_author_idx" ON "public"."invitations" ("author");

ALTER TABLE "public"."invitations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read invitations they are part of"
  ON "public"."invitations" FOR SELECT
  USING ((( SELECT "auth"."uid"() ) = "author") OR (( SELECT "auth"."uid"() ) = "guest"));

-- Only the guest may record their own invitation. The inviter cannot write
-- rows crediting themselves, and the CHECK above stops a guest from crediting
-- themselves either. handle_new_user below is SECURITY DEFINER and bypasses
-- this policy; it exists for the fallback insert the client does once the
-- profile is in place.
CREATE POLICY "guests can record their own invitation"
  ON "public"."invitations" FOR INSERT
  WITH CHECK (( SELECT "auth"."uid"() ) = "guest");

-------------------------------------------------------------------
-- handle_new_user: record the invitation as part of sign-up.
--
-- The profiles/user_settings inserts are carried over verbatim from
-- 20260817120000_add_user_settings.sql, so signup behaviour is otherwise
-- unchanged. The new tail runs right after the profile row exists — the FK
-- needs it — and only when the sign-up metadata carried an inviter:
-- app/csatlakozom/email-regisztracio.tsx puts it there as `invited_by`.
--
-- The uuid is validated by pattern before it is cast: metadata is client
-- supplied, and a malformed value must not be able to abort a registration.
-- An inviter who no longer exists is skipped for the same reason (the FK
-- would raise), as is a uid equal to the new user's own.
-------------------------------------------------------------------
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  inviter uuid;
begin
  insert into public.profiles (
    id, full_name, avatar_url, username,
    location, location_radius_m,
    notify_push, notify_email, newsletter, emotion_daily_prompt
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
    COALESCE((new.raw_user_meta_data->>'notify_push')::boolean, false),
    COALESCE((new.raw_user_meta_data->>'notify_email')::boolean, true),
    COALESCE((new.raw_user_meta_data->>'newsletter')::boolean, false),
    COALESCE((new.raw_user_meta_data->>'emotion_daily_prompt')::boolean, false)
  );

  insert into public.user_settings (
    author, notify_push, notify_email, newsletter, emotion_daily_prompt
  )
  values (
    new.id,
    COALESCE((new.raw_user_meta_data->>'notify_push')::boolean, false),
    COALESCE((new.raw_user_meta_data->>'notify_email')::boolean, true),
    COALESCE((new.raw_user_meta_data->>'newsletter')::boolean, false),
    COALESCE((new.raw_user_meta_data->>'emotion_daily_prompt')::boolean, false)
  )
  on conflict (author) do nothing;

  if new.raw_user_meta_data->>'invited_by' ~*
     '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    inviter := (new.raw_user_meta_data->>'invited_by')::uuid;

    insert into public.invitations (author, guest)
    select inviter, new.id
    where inviter <> new.id
      and exists (select 1 from public.profiles p where p.id = inviter)
    on conflict (guest) do nothing;
  end if;

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
