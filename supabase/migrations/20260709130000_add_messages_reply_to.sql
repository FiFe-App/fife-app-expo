-- Allow messages to quote/reply to another message in the same conversation.

ALTER TABLE public.messages
  ADD COLUMN reply_to bigint REFERENCES public.messages(id) ON DELETE SET NULL;
