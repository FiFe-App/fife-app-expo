-- The `buzinessImages` bucket was created by hand in the dashboard, so it only
-- ever existed on the hosted project: a fresh `supabase db reset` brings up the
-- storage policies for it (they came along in the schema dump) but not the
-- bucket row itself, and every upload fails with "Bucket not found".
--
-- It is also still configured for the days when a biznisz could only carry
-- images, so the audio and video uploads have nothing to land in. Creating and
-- widening it are the same statement.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'buzinessImages',
  'buzinessImages',
  -- Biznisz media is shown to everyone and read via getPublicUrl(), so unlike
  -- the private messageImages bucket this one is public.
  true,
  52428800, -- 50 MB, matches MAX_MEDIA_SIZE in BuzinessMediaUpload.tsx
  ARRAY[
    -- images
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif',
    -- video (mirrors VIDEO_EXTENSIONS in lib/functions/getMediaKind.ts)
    'video/3gpp',
    'video/mp4',
    'video/mpeg',
    'video/ogg',
    'video/quicktime',
    'video/webm',
    'video/x-matroska',
    'video/x-msvideo',
    -- audio (mirrors AUDIO_EXTENSIONS in lib/functions/getMediaKind.ts)
    'audio/3gpp',
    'audio/aac',
    'audio/amr',
    'audio/flac',
    'audio/mp4',
    'audio/mpeg',
    'audio/ogg',
    'audio/opus',
    'audio/wav',
    'audio/webm',
    'audio/x-m4a',
    'audio/x-wav'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- The access policies already exist on both the hosted project and in the
-- schema dump, so they are not repeated here.
