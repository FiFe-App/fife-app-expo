-- Fix infinite recursion in contacts DELETE policy.
-- The old policy queries `contacts` in a subquery, which triggers RLS evaluation
-- again on the same table, causing infinite recursion.
-- Solution: Use a SECURITY DEFINER function to count contacts without RLS.

-- Helper function that counts non-empty contacts for a given user (bypasses RLS)
CREATE OR REPLACE FUNCTION public.count_user_contacts(user_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)
  FROM public.contacts
  WHERE contacts.author = user_id
    AND contacts.data IS NOT NULL
    AND contacts.data != '';
$$;

-- Only callable internally (from policies), not exposed to clients
REVOKE EXECUTE ON FUNCTION public.count_user_contacts(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.count_user_contacts(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.count_user_contacts(uuid) TO authenticated;

-- Helper function that checks if a user has any buziness (bypasses RLS)
CREATE OR REPLACE FUNCTION public.user_has_buziness(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.buziness WHERE buziness.author = user_id
  );
$$;

REVOKE EXECUTE ON FUNCTION public.user_has_buziness(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_has_buziness(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.user_has_buziness(uuid) TO authenticated;

-- Drop the broken policy
DROP POLICY IF EXISTS "Enable delete for author unless last contact with buziness" ON "public"."contacts";

-- Recreate the DELETE policy using the helper functions (no self-referencing subquery)
CREATE POLICY "Enable delete for author unless last contact with buziness" ON "public"."contacts"
  FOR DELETE
  TO "authenticated"
  USING (
    author = auth.uid()
    AND (
      -- Allow if user has more than one non-empty contact
      public.count_user_contacts(auth.uid()) > 1
      -- Or allow if user has no buziness
      OR NOT public.user_has_buziness(auth.uid())
    )
  );
