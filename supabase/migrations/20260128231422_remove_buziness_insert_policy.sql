-- Migration: Remove INSERT policy for buziness table
-- Buziness creation should only happen through the create-buziness edge function
-- which validates contacts before creation. Direct INSERT is no longer allowed.

-- Drop the INSERT policy that required contacts
DROP POLICY IF EXISTS "Enable insert for author with contacts" ON "public"."buziness";

-- Note: SELECT, UPDATE, and DELETE policies remain unchanged
-- Users can still read, update, and delete their own buziness records
