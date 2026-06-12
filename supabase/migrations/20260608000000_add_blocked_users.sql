CREATE TABLE public.blocked_users (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  blocker_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE (blocker_id, blocked_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can insert own blocks"
  ON public.blocked_users FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "users can delete own blocks"
  ON public.blocked_users FOR DELETE
  USING (auth.uid() = blocker_id);

CREATE POLICY "users can read own blocks"
  ON public.blocked_users FOR SELECT
  USING (auth.uid() = blocker_id);

-- Returns true if either party has blocked the other (checked from both sides)
CREATE OR REPLACE FUNCTION public.is_blocked_by(other_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE (blocker_id = auth.uid() AND blocked_id = other_user)
       OR (blocker_id = other_user AND blocked_id = auth.uid())
  );
$$;

-- Hide blocked users from each other in the profiles table
CREATE POLICY "hide blocked profiles"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR NOT public.is_blocked_by(id)
  );
