-- Encrypt rate+note client-side; server only stores opaque ciphertext going forward.
ALTER TABLE public.emotion_logs
  ADD COLUMN encrypted_data text,
  ADD COLUMN nonce text;

-- Existing plaintext rows cannot be encrypted server-side (no key exists there by design).
-- rate/note become legacy/nullable and are backfilled client-side on next load.
ALTER TABLE public.emotion_logs ALTER COLUMN rate DROP NOT NULL;
ALTER TABLE public.emotion_logs DROP CONSTRAINT IF EXISTS emotion_logs_rate_check;
