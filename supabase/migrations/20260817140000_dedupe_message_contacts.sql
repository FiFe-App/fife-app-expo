-- `contacts` never constrained (author, type), so an account could end up with
-- several MESSAGE rows. Every read of that contact used `.maybeSingle()`, which
-- fails with PGRST116 once there is more than one row, and the app read that
-- failure as "messaging is off" — which in turn made the enable button insert
-- yet another duplicate on each press.

-- A duplicate may be some biznisz's defaultContact; repoint those at the row we
-- keep so the foreign key does not null them out when the duplicate goes.
UPDATE public.buziness b
SET "defaultContact" = keep.id
FROM public.contacts dup
JOIN LATERAL (
  SELECT c.id
  FROM public.contacts c
  WHERE c.type = 'MESSAGE' AND c.author = dup.author
  ORDER BY c.id
  LIMIT 1
) keep ON true
WHERE b."defaultContact" = dup.id
  AND dup.type = 'MESSAGE'
  AND dup.id <> keep.id;

-- Keep the oldest MESSAGE contact per author, drop the rest.
DELETE FROM public.contacts dup
USING public.contacts keep
WHERE dup.type = 'MESSAGE'
  AND keep.type = 'MESSAGE'
  AND dup.author = keep.author
  AND dup.id > keep.id;

-- One MESSAGE contact per account from here on. Other contact types are left
-- alone: several phone numbers or links per account are legitimate.
CREATE UNIQUE INDEX IF NOT EXISTS contacts_one_message_per_author
  ON public.contacts (author)
  WHERE type = 'MESSAGE';
