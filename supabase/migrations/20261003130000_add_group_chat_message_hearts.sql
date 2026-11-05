-- Heart reactions on group chat messages.
--
-- 1:1 chats store a heart as a `heart-<id>` row in public.messages, which works
-- because there are only two people to tell apart. In a group anyone can heart
-- a message, so hearts get their own table: one row per (message, user).
--
-- group_id is copied from the message so realtime can filter on it — a
-- subscription filter can only look at the row's own columns.

CREATE TABLE public.group_chat_message_hearts (
  message_id bigint NOT NULL REFERENCES public.group_chat_messages(id) ON DELETE CASCADE,
  user_id    uuid   NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id   uuid   NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

CREATE INDEX group_chat_message_hearts_group_id_idx
  ON public.group_chat_message_hearts (group_id);
CREATE INDEX group_chat_message_hearts_user_id_idx
  ON public.group_chat_message_hearts (user_id);

ALTER TABLE public.group_chat_message_hearts ENABLE ROW LEVEL SECURITY;

-- Same audience as the messages themselves.
CREATE POLICY "Hearts are readable with the group"
ON public.group_chat_message_hearts
FOR SELECT
TO authenticated
USING (
  public.is_public_group_chat(group_id)
  OR public.is_group_chat_member(group_id, (SELECT auth.uid()))
);

-- Members heart as themselves, and only messages that really are in that group
-- (otherwise group_id could be made up to reach another group's feed).
CREATE POLICY "Members can heart messages in their groups"
ON public.group_chat_message_hearts
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND public.is_group_chat_member(group_id, (SELECT auth.uid()))
  AND EXISTS (
    SELECT 1 FROM public.group_chat_messages m
    WHERE m.id = message_id AND m.group_id = group_chat_message_hearts.group_id
  )
);

CREATE POLICY "Users can take back their own hearts"
ON public.group_chat_message_hearts
FOR DELETE
TO authenticated
USING (
  user_id = (SELECT auth.uid())
);

GRANT SELECT, INSERT, DELETE ON public.group_chat_message_hearts TO authenticated;
GRANT ALL ON public.group_chat_message_hearts TO service_role;

-- DELETE events carry the replica identity, i.e. the primary key — message_id
-- and user_id, which is all the app needs to drop a heart.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_chat_message_hearts;
  END IF;
END;
$$;
