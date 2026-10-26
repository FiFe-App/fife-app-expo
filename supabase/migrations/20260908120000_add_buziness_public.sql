-- "public": the author's opt-in to a biznisz that anyone can open with a link,
-- without an account. It is what makes a fifeapp.hu/biznisz/<id> link work for
-- somebody who got it on Facebook, and what the link preview (see
-- netlify/edge-functions/social-preview.ts) is allowed to read with the anon key.
--
-- Default false: every existing listing stays members-only until its author
-- turns sharing on in the editor.

ALTER TABLE public.buziness
  ADD COLUMN IF NOT EXISTS "public" boolean NOT NULL DEFAULT false;

-- Read access. Until now the policy let anyone — signed in or not — read every
-- listing of their own "world" (see the bad boy ghost system). Signed-in users
-- keep exactly that; anonymous visitors now only get the listings whose author
-- marked them public.
DROP POLICY IF EXISTS "Enable read access for all users" ON public.buziness;
CREATE POLICY "Enable read access for all users"
  ON public.buziness
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (
    (auth.uid() IS NOT NULL OR buziness."public")
    AND (
      author = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = author AND bad_boy = public.is_bad_boy()
      )
    )
  );
