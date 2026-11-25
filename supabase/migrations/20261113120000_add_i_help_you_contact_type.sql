-- "Rám írhatsz": a user can let people who need support message them.
-- Stored like MESSAGE: a contacts row whose data is 'true' when switched on,
-- with an optional note in `title`. The help page lists these users.
ALTER TYPE contact_type ADD VALUE IF NOT EXISTS 'I-HELP-YOU';
