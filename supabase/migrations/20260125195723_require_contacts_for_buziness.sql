-- Migration: Require at least one contact for buziness creation
-- This migration modifies the buziness table policies to enforce that users
-- must have at least one contact before they can create a buziness.

-- Drop the old combined policy
DROP POLICY IF EXISTS "Enable select, insert, update, delete for author" ON "public"."buziness";

-- Create separate policies for different operations
-- SELECT policy: Allow users to read their own buziness
CREATE POLICY "Enable select for author" ON "public"."buziness" 
  FOR SELECT 
  TO "authenticated" 
  USING ((( SELECT "auth"."uid"() AS "uid") = "author"));

-- UPDATE policy: Allow users to update their own buziness
CREATE POLICY "Enable update for author" ON "public"."buziness" 
  FOR UPDATE 
  TO "authenticated" 
  USING ((( SELECT "auth"."uid"() AS "uid") = "author"));

-- DELETE policy: Allow users to delete their own buziness
CREATE POLICY "Enable delete for author" ON "public"."buziness" 
  FOR DELETE 
  TO "authenticated" 
  USING ((( SELECT "auth"."uid"() AS "uid") = "author"));

-- INSERT policy: Require at least one contact with non-empty data
CREATE POLICY "Enable insert for author with contacts" ON "public"."buziness" 
  FOR INSERT 
  TO "authenticated" 
  WITH CHECK (
    (( SELECT "auth"."uid"() AS "uid") = "author") 
    AND 
    EXISTS (
      SELECT 1 FROM "public"."contacts" 
      WHERE "contacts"."author" = "auth"."uid"()
      AND "contacts"."data" IS NOT NULL 
      AND "contacts"."data" != ''
    )
  );

-- Add index on contacts(author) for better performance of the policy check
CREATE INDEX IF NOT EXISTS "idx_contacts_author" ON "public"."contacts" ("author");
