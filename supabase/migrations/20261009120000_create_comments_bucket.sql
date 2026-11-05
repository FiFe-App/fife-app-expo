-- Like `buzinessImages` (see 20260817130000_create_buziness_media_bucket.sql),
-- the `comments` bucket was created by hand in the dashboard, so only its
-- storage policies came along in the schema dump: on a fresh database every
-- comment image upload fails with "Bucket not found" while the comment text
-- itself is saved.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'comments',
  'comments',
  -- Comment images are shown to everyone who can read the comment and are
  -- read via getPublicUrl() (components/comments/Comments.tsx), so public.
  true,
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
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- The upload / delete policies (own uid folder) already exist on the hosted
-- project and in the schema dump, so they are not repeated here.
