-- Let signed-in users suggest new help contacts from the "Segítség kell?"
-- screen. Suggestions land as non-public rows (pending review) and only
-- join the public list once an admin flips `public` to true directly in the
-- database — there are no UPDATE/DELETE policies, so users can't self-publish.

ALTER TABLE "public"."help_contacts"
    ADD COLUMN "author" uuid REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    ADD COLUMN "public" boolean NOT NULL DEFAULT false;

-- Existing curated entries are already vetted/live — keep them visible.
UPDATE "public"."help_contacts" SET "public" = true;

GRANT INSERT ON TABLE "public"."help_contacts" TO "authenticated";

DROP POLICY "Enable read access for all users" ON "public"."help_contacts";

-- Only public (reviewed) entries are listable, by anyone including
-- signed-out users. Non-public submissions are protected: nobody can read
-- them back through the API, not even their own author.
CREATE POLICY "Enable read access for public entries" ON "public"."help_contacts" FOR SELECT USING ("public" = true);

CREATE POLICY "Enable insert for authenticated users" ON "public"."help_contacts" FOR INSERT TO "authenticated" WITH CHECK (
    (SELECT auth.uid()) = "author" AND "public" = false
);
