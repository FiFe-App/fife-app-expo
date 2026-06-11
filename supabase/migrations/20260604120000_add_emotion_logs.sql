CREATE TABLE IF NOT EXISTS public.emotion_logs (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rate       smallint NOT NULL CHECK (rate BETWEEN 1 AND 5),
  note       text,
  log_date   date NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (author, log_date)
);

ALTER TABLE public.emotion_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own logs select" ON public.emotion_logs
  FOR SELECT USING (auth.uid() = author);

CREATE POLICY "own logs insert" ON public.emotion_logs
  FOR INSERT WITH CHECK (auth.uid() = author);

CREATE POLICY "own logs update" ON public.emotion_logs
  FOR UPDATE USING (auth.uid() = author);

GRANT SELECT, INSERT, UPDATE ON public.emotion_logs TO authenticated;
