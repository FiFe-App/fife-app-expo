-- Public group chats.
--
-- Kept in their own tables instead of overloading public.messages: the 1:1
-- chat's RLS ("author or recipient"), its unread counting, its notify trigger
-- and the messageImages storage policy all assume a message has exactly one
-- recipient, and none of that has to change this way.
--
--   group_chats          one row per group (title shown in the chat list)
--   group_chat_members   who joined, and when — also gates writing
--   group_chat_messages  the messages themselves
--
-- A public group can be read by any signed-in user; only members can post.
-- For now there is a single seeded group, "FiFe Chat csoport". Groups are
-- created by migrations / the service role only, there is no insert policy.

-------------------------------------------------------------------
-- 1. Tables
-------------------------------------------------------------------
CREATE TABLE public.group_chats (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  is_public   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.group_chat_members (
  group_id  uuid NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX group_chat_members_user_id_idx
  ON public.group_chat_members (user_id);

CREATE TABLE public.group_chat_messages (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  group_id   uuid NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
  author     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text       text NOT NULL DEFAULT '' CHECK (char_length(text) <= 1000),
  reply_to   bigint REFERENCES public.group_chat_messages(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX group_chat_messages_group_created_idx
  ON public.group_chat_messages (group_id, created_at DESC);

-------------------------------------------------------------------
-- 2. Helpers
-------------------------------------------------------------------
-- SECURITY DEFINER so the policies below can ask "is this user a member" /
-- "is this group public" without recursing into the tables' own RLS.
CREATE OR REPLACE FUNCTION public.is_group_chat_member(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_chat_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_public_group_chat(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_public FROM public.group_chats WHERE id = p_group_id),
    false
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_group_chat_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_public_group_chat(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_group_chat_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_public_group_chat(uuid) TO authenticated;

-------------------------------------------------------------------
-- 3. Row level security
-------------------------------------------------------------------
ALTER TABLE public.group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in can see public group chats"
ON public.group_chats
FOR SELECT
TO authenticated
USING (
  is_public OR public.is_group_chat_member(id, (SELECT auth.uid()))
);

-- The member list of a public group is public too (it is shown in the app).
CREATE POLICY "Group members are visible with the group"
ON public.group_chat_members
FOR SELECT
TO authenticated
USING (
  public.is_public_group_chat(group_id)
  OR public.is_group_chat_member(group_id, (SELECT auth.uid()))
);

CREATE POLICY "Users can join public group chats"
ON public.group_chat_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND public.is_public_group_chat(group_id)
);

CREATE POLICY "Users can leave group chats"
ON public.group_chat_members
FOR DELETE
TO authenticated
USING (
  user_id = (SELECT auth.uid())
);

CREATE POLICY "Group messages are readable with the group"
ON public.group_chat_messages
FOR SELECT
TO authenticated
USING (
  public.is_public_group_chat(group_id)
  OR public.is_group_chat_member(group_id, (SELECT auth.uid()))
);

CREATE POLICY "Members can post to their group chats"
ON public.group_chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  author = (SELECT auth.uid())
  AND public.is_group_chat_member(group_id, (SELECT auth.uid()))
);

CREATE POLICY "Users can delete their own group messages"
ON public.group_chat_messages
FOR DELETE
TO authenticated
USING (
  author = (SELECT auth.uid())
);

GRANT SELECT ON public.group_chats TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.group_chat_members TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.group_chat_messages TO authenticated;

-------------------------------------------------------------------
-- 4. Realtime
-------------------------------------------------------------------
-- DELETE events only carry the primary key unless the replica identity is
-- full; the app only needs `id`, so the default is enough.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_chat_messages;
  END IF;
END;
$$;

-------------------------------------------------------------------
-- 5. Push notifications (built, NOT enabled yet)
-------------------------------------------------------------------
-- The notify edge function has a `group_chat_messages` branch that pushes the
-- message to every other member. It is switched off twice: this trigger is
-- created disabled, and the branch itself checks
-- GROUP_CHAT_NOTIFICATIONS_ENABLED.
-- TODO: to go live, run `ALTER TABLE public.group_chat_messages ENABLE TRIGGER
-- on_group_chat_message_created;` in a new migration and flip the flag in
-- supabase/functions/notify/index.ts.
CREATE TRIGGER on_group_chat_message_created
  AFTER INSERT ON public.group_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notify_on_record_created();

ALTER TABLE public.group_chat_messages DISABLE TRIGGER on_group_chat_message_created;

-------------------------------------------------------------------
-- 6. Seed the one group we have for now
-------------------------------------------------------------------
-- Fixed id: the app links to it as FIFE_GROUP_CHAT_ID (lib/chat/groupChats.ts).
INSERT INTO public.group_chats (id, title, description)
VALUES (
  '6f1e5c2a-0b7d-4c1e-9a53-f1fe00c4a700',
  'FiFe Chat csoport',
  'Nyilvános csoport, ahová bárki csatlakozhat.'
)
ON CONFLICT (id) DO NOTHING;
