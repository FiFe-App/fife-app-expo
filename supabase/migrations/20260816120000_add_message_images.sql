-- Allow chat messages to carry an image.
-- The image itself lives in the new `messageImages` storage bucket, the column
-- keeps its object path (`<author uid>/<file name>`).

ALTER TABLE public.messages
  ADD COLUMN image text;

-- Private bucket: unlike avatars or biznisz images, chat images must only be
-- readable by the two participants of the conversation, so the app reads them
-- through signed URLs and the policies below.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'messageImages',
  'messageImages',
  false,
  10485760, -- 10 MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif'
  ]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload message images to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'messageImages'
  AND (SELECT auth.uid()::text) = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own message images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'messageImages'
  AND (SELECT auth.uid()::text) = (storage.foldername(name))[1]
);

-- The sender can always read their own uploads (the file is uploaded before the
-- message row exists), the recipient only once a message points at the file.
CREATE POLICY "Chat participants can view message images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'messageImages'
  AND (
    (SELECT auth.uid()::text) = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1
      FROM public.messages m
      WHERE m.image = storage.objects.name
        AND m."to" = (SELECT auth.uid())
    )
  )
);
