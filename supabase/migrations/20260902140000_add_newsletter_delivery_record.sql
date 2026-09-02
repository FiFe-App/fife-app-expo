-- Which addresses a run actually reached, and which it did not.
--
-- Until now a partial send recorded only counts and a de-duplicated blob of
-- error strings, so after a run that stopped at "451 Mailbox rate limit
-- reached" there was no way to tell who had already been mailed. Finishing the
-- send meant either mailing the delivered ones a second time or reconstructing
-- the list by hand from the edge logs.
--
-- With these two columns the remainder is one insert: send the same issue again
-- with `excluded` set to the previous run's sent_recipients.
--
-- These hold the same kind of address data the table already stores in
-- `recipients`, on a table with RLS enabled and no policies — service role only.

ALTER TABLE "public"."newsletters"
  ADD COLUMN IF NOT EXISTS "sent_recipients"   "text"[],
  ADD COLUMN IF NOT EXISTS "failed_recipients" "text"[];

COMMENT ON COLUMN "public"."newsletters"."sent_recipients" IS
  'Addresses the SMTP server accepted. Written as the run progresses, so a run killed mid-flight still says how far it got. Feed this into the next issue''s excluded to send the remainder.';

COMMENT ON COLUMN "public"."newsletters"."failed_recipients" IS
  'Addresses that errored. Retry by sending a new issue with recipients set to these.';
