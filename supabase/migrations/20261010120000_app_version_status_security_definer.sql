-- The update gate is called before sign-in, as anon. It ran with the caller's
-- rights, so 20261003120000 — which revoked anon's EXECUTE on every function
-- and its SELECT on every table — broke it:
--   "permission denied for function parse_app_version"
-- (and app_versions would have been next).
--
-- Run it as its owner instead of re-opening parse_app_version and
-- app_versions to anon: the function only ever returns the one platform row
-- the gate needs, and search_path is already pinned to ''.
ALTER FUNCTION "public"."get_app_version_status"("p_platform" "text", "p_version" "text")
  SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION "public"."get_app_version_status"("p_platform" "text", "p_version" "text")
  TO anon, authenticated, service_role;
