-- Reports used to target a profile only. App Store guideline 1.2 wants every
-- kind of user generated content to be reportable, so a report now names what
-- is being reported: target_type + target_id. reported_profile_id stays as the
-- *person* behind the content (the author of the message / biznisz / comment, or
-- the profile itself), so moderation can act on the user whatever was reported.
ALTER TABLE public.reports
  ALTER COLUMN reported_profile_id DROP NOT NULL;

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS target_type text NOT NULL DEFAULT 'profile',
  -- id of the reported row; null for a profile (reported_profile_id is that id)
  ADD COLUMN IF NOT EXISTS target_id text,
  -- text of the content when it was reported, so a report can still be judged
  -- after the author deletes or edits it
  ADD COLUMN IF NOT EXISTS target_excerpt text;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_target_type_check
  CHECK (target_type IN ('profile', 'message', 'group_message', 'biznisz', 'comment'));

ALTER TABLE public.reports
  ADD CONSTRAINT reports_target_check
  CHECK (
    (target_type = 'profile' AND reported_profile_id IS NOT NULL)
    OR (target_type <> 'profile' AND target_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS reports_target_idx
  ON public.reports (target_type, target_id);

-- The author of a comment/biznisz may have been deleted (reported_profile_id is
-- an FK to auth.users), so it is nullable and cleared rather than cascading the
-- report away with the account.
ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_reported_profile_id_fkey;
ALTER TABLE public.reports
  ADD CONSTRAINT reports_reported_profile_id_fkey
  FOREIGN KEY (reported_profile_id) REFERENCES auth.users(id) ON DELETE SET NULL;
