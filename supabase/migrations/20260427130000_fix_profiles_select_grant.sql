-- Fix: grant SELECT on profiles to anon and authenticated roles
-- These grants exist in the remote schema but are missing from the local DB.

GRANT SELECT ON TABLE "public"."profiles" TO "anon";
GRANT SELECT ON TABLE "public"."profiles" TO "authenticated";
GRANT SELECT ON TABLE "public"."profiles" TO "service_role";
