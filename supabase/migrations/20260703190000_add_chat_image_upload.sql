-- Add image attachment support to chat messages.
--
-- Images live in a PRIVATE storage bucket ("messageImages", must be created
-- manually via the Dashboard/CLI with "Public bucket" left OFF) since chat is
-- 1:1 and, unlike comments/avatars, shouldn't be readable by anyone who
-- guesses the path. Access is enforced by RLS below and the app reads images
-- via signed URLs (see components/SupabaseImage.tsx `signed` prop).

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS image text;

-- messages had no UPDATE policy — needed so the sender can attach the
-- storage path to their own message row once the upload finishes.
CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (auth.uid() = author)
WITH CHECK (auth.uid() = author);

-- Uploads go to messageImages/{senderUid}/{filename}, same folder-per-uploader
-- convention as the avatars/comments/buzinessImages buckets.
CREATE POLICY "Users can upload their own chat images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'messageImages'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

CREATE POLICY "Users can delete their own chat images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'messageImages'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- Reads are gated through the messages table itself: only the sender or
-- recipient of the message that references this image path may read it
-- (i.e. only they can successfully create a signed URL for it).
CREATE POLICY "Chat participants can read chat images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'messageImages'
  AND EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.image = storage.objects.name
      AND (m.author = auth.uid() OR m."to" = auth.uid())
  )
);
