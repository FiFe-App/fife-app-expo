-- Migration: Prevent deletion of last contact
-- This migration adds a policy to prevent users from deleting their last contact,
-- ensuring buziness-contacts consistency

-- Drop the existing policy that allows all edits
DROP POLICY IF EXISTS "edit if user's" ON "public"."contacts";

-- Create separate policies for INSERT, UPDATE, and DELETE
-- INSERT policy: Allow users to insert their own contacts
CREATE POLICY "Enable insert for author" ON "public"."contacts" 
  FOR INSERT 
  TO "authenticated" 
  WITH CHECK ("author" = "auth"."uid"());

-- UPDATE policy: Allow users to update their own contacts
CREATE POLICY "Enable update for author" ON "public"."contacts" 
  FOR UPDATE 
  TO "authenticated" 
  USING ("author" = "auth"."uid"())
  WITH CHECK ("author" = "auth"."uid"());

-- DELETE policy: Prevent deletion if it's the user's last contact
CREATE POLICY "Enable delete for author with remaining contacts" ON "public"."contacts" 
  FOR DELETE 
  TO "authenticated" 
  USING (
    "author" = "auth"."uid"()
    AND
    (
      SELECT COUNT(*) 
      FROM "public"."contacts" 
      WHERE "contacts"."author" = "auth"."uid"()
      AND "contacts"."data" IS NOT NULL 
      AND "contacts"."data" != ''
    ) > 1
  );
