-- Fix: ensure RLS policies exist on profileRecommendations
-- Uses DROP IF EXISTS + CREATE to be idempotent

DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."profileRecommendations";
CREATE POLICY "Enable read access for all users"
  ON "public"."profileRecommendations"
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Edit for Author" ON "public"."profileRecommendations";
CREATE POLICY "Edit for Author"
  ON "public"."profileRecommendations"
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((( SELECT auth.uid() AS uid) = author))
  WITH CHECK ((( SELECT auth.uid() AS uid) = author));
