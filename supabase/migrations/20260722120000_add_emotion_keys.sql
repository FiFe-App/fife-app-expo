-- Per-user emotion-log encryption key, stored server-side so logs survive an
-- app reinstall and can be decrypted on any of the user's devices.
--
-- Trade-off (chosen deliberately): the key is recoverable from the account, so
-- anyone with database access can decrypt a user's logs. This replaces the prior
-- device-only key, which permanently lost all logs whenever the app was reinstalled.
CREATE TABLE IF NOT EXISTS public.emotion_keys (
  author     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  key        text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.emotion_keys ENABLE ROW LEVEL SECURITY;

-- A user may read and create their own key. There is intentionally no UPDATE or
-- DELETE policy: the key is immutable once set, so it can never be rotated out
-- from under ciphertext that was encrypted with it.
CREATE POLICY "own key select" ON public.emotion_keys
  FOR SELECT USING (auth.uid() = author);

CREATE POLICY "own key insert" ON public.emotion_keys
  FOR INSERT WITH CHECK (auth.uid() = author);

GRANT SELECT, INSERT ON public.emotion_keys TO authenticated;
